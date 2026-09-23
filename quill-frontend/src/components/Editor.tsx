"use client";
import React, { useRef, useState, DragEvent } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import MenuBar from "./EditorMenuBar";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import ImageExtension from "@tiptap/extension-image";
import Image from "next/image";
import Button from "@/atoms/Button";
import { postBlog, editBlog } from "@/actions/blogActions";
import { Upload, LinkIcon, X, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/utils/constants";
import {
  deleteImageFromCloudinary,
  uploadImageToCloudinary,
  isImageFile,
  resolvePendingDeletes,
} from "@/actions/imageActions";
import { PostVisibility } from "@/types/PostProps";

export type EditablePost =
  | {
      id: string;
      title: string;
      content: string | null;
      image: string | null;
      authorId: string;
      visibility: PostVisibility;
    }
  | undefined;

export default function BlogEditor({ post }: { post: EditablePost }) {
  const initialContent = post?.content || "";
  const { data: session } = useSession();
  const [title, setTitle] = useState(post?.title || "");
  const [isError, setIsError] = useState({ element: "", message: "" });
  const [imageUrl, setImageUrl] = useState(post?.image || "");
  const [content, setContent] = useState(initialContent);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [pendingDeletes, setPendingDeletes] = useState<string[]>([]);

  const onChange = (content: string) => {
    setContent(content);
  };

  // Handle drag events
  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const deleteImage = async (url: string) => {
    const token = session?.backendToken;
    if (!token) return;
    try {
      await deleteImageFromCloudinary(token, url);
    } catch (error) {
      console.error("Image delete error:", error);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const token = session?.backendToken;
    if (!token) {
      setIsError({ element: "image", message: "Please sign in to upload images." });
      return "";
    }

    setIsUploadingImage(true);
    try {
      return await uploadImageToCloudinary(token, file);
    } catch (error) {
      console.error("Image upload error:", error);
      setIsError({
        element: "image",
        message: error instanceof Error ? error.message : "Image upload failed. Please try again.",
      });
      return "";
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(isImageFile);

    if (imageFile) {
      const url = await uploadImage(imageFile);
      if (url) setImageUrl(url);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isImageFile(file)) {
      const url = await uploadImage(file);
      if (url) setImageUrl(url);
    }
  };

  const uploadImageFromUrl = async (url: string): Promise<string> => {
    const token = session?.backendToken;
    if (!token) {
      setIsError({ element: "image", message: "Please sign in to upload images." });
      return "";
    }

    setIsUploadingImage(true);
    try {
      const response = await fetch(`${API_URL}/image/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: token },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed");
      return data.url;
    } catch (error) {
      console.error("Image upload error:", error);
      setIsError({
        element: "image",
        message:
          error instanceof Error
            ? error.message
            : "Couldn't import that image URL. Please check the link and try again.",
      });
      return "";
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (tempImageUrl) {
      const url = await uploadImageFromUrl(tempImageUrl.trim());
      if (!url) return;
      setImageUrl(url);
      setTempImageUrl("");
      setShowUrlInput(false);
    }
  };

  const removeImage = () => {
    if (imageUrl) {
      setPendingDeletes((queued) => [...queued, imageUrl]);
    }
    setImageUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: "list-disc ml-3",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal ml-3",
          },
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight,
      ImageExtension.configure({
        HTMLAttributes: {
          class: "rounded-md border border-border my-6 mx-auto block max-w-[480px] w-full h-auto",
        },
      }),
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "tiptap prose prose-lg dark:prose-invert max-w-none w-full min-h-[460px] bg-transparent py-6 text-fg focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const handleSave = async (state: "DRAFT" | "PUBLIC") => {
    const payload = {
      title,
      content: content,
      image: imageUrl,
      visibility: state,
    };

    if (!title) {
      setIsError({ element: "title", message: "Title is required" });
      return;
    }
    if (!content || content === "<p></p>") {
      setIsError({ element: "content", message: "Content is required" });
      return;
    }
    if (!session?.backendToken) {
      setIsError({ element: "auth", message: "You must be signed in to publish" });
      return;
    }
    setIsError({ element: "", message: "" });
    setIsPublishing(true);

    // Only the save itself is guarded here. Anything after it runs once the post
    // is already stored, so folding it into this try would report a successful
    // publish as a failure.
    let response;
    try {
      response = post
        ? await editBlog(post.id, { ...payload, authorId: post.authorId }, session.backendToken)
        : await postBlog(payload, session.backendToken);
    } catch (error) {
      console.error("Publish error:", error);
      setIsError({
        element: "publish",
        message:
          error instanceof Error && error.message
            ? error.message
            : "Failed to publish the blog. Please try again.",
      });
      setIsPublishing(false);
      return;
    }

    // Only once the post is safely saved is the old image unreferenced.
    const toDelete = resolvePendingDeletes(pendingDeletes, imageUrl);
    await Promise.all(toDelete.map(deleteImage));
    setPendingDeletes([]);

    router.push(`/blog/${response?.blog?.id}`);
  };

  return (
    <div>
      {/* Action bar, pinned under the site header. */}
      <div className="sticky top-14 z-30 border-b border-border bg-bg">
        <div className="mx-auto flex max-w-reading items-center justify-between gap-4 px-4 py-2">
          <span className="text-sm text-muted">{post ? "Editing" : "Draft"}</span>
          <div className="flex gap-2">
            <Button
              label="Save as draft"
              variant="secondary"
              size="sm"
              onClick={() => handleSave("DRAFT")}
              loading={isPublishing}
              disabled={isPublishing || isUploadingImage}
            />
            <Button
              label={post ? "Save changes" : "Publish"}
              variant="primary"
              size="sm"
              onClick={() => handleSave("PUBLIC")}
              loading={isPublishing}
              disabled={isPublishing || isUploadingImage}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-reading px-4 py-8">
        {["publish", "auth", "image"].includes(isError.element) && (
          <p className="mb-4 text-sm text-danger">{isError.message}</p>
        )}

        {/* Title */}
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled story"
          className="w-full border-none bg-transparent text-3xl font-semibold tracking-tight outline-none placeholder:text-muted"
        />
        {isError.element === "title" && (
          <span className="mt-2 block text-sm text-danger">{isError.message}</span>
        )}

        {/* Featured image */}
        <div className="mt-8">
          <span className="mb-2 block text-sm font-medium">Featured image</span>

          {!imageUrl ? (
            <div className="space-y-4">
              <div
                className={`relative rounded-md border border-dashed p-8 text-center ${
                  isDragOver ? "border-accent bg-bg-subtle" : "border-border hover:border-muted"
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center gap-4">
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-muted" />
                      <p className="text-sm text-muted">Uploading image...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-muted" />
                      <p className="text-sm text-muted">
                        {isDragOver ? "Drop it" : "Drop an image, or click to browse"}
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-sm text-muted">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {!showUrlInput ? (
                <Button
                  onClick={() => setShowUrlInput(true)}
                  variant="secondary"
                  icon={<LinkIcon className="w-4 h-4" />}
                  label="Add image from URL"
                  className="w-full justify-center"
                />
              ) : (
                <div className="flex gap-2 items-end">
                  <input
                    type="url"
                    value={tempImageUrl}
                    onChange={(e) => setTempImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 bg-transparent border-b border-border py-2 text-fg focus:outline-none focus:border-accent transition-colors"
                  />
                  <Button
                    onClick={handleUrlSubmit}
                    label={isUploadingImage ? "Adding..." : "Add"}
                    variant="secondary"
                    size="sm"
                    loading={isUploadingImage}
                    disabled={isUploadingImage}
                  />
                  <Button
                    variant="ghost"
                    square
                    onClick={() => {
                      setShowUrlInput(false);
                      setTempImageUrl("");
                    }}
                    className="text-muted"
                    icon={<X className="w-4 h-4" />}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="relative group">
              <div className="relative h-64 w-full overflow-hidden rounded-md border border-border bg-bg-subtle">
                <Image
                  src={imageUrl}
                  alt="Featured image preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <Button
                  variant="primary"
                  square
                  onClick={removeImage}
                  className="absolute top-3 right-3 !w-8 !h-8 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  icon={<X className="w-4 h-4" />}
                />
              </div>
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="mt-10">
          <MenuBar editor={editor} />
          <EditorContent editor={editor} />
          {isError.element === "content" && (
            <span className="text-sm text-danger mt-2 block">{isError.message}</span>
          )}
        </div>
      </div>
    </div>
  );
}
