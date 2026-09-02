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
import { deleteImageFromCloudinary } from "@/actions/imageActions";

export default function BlogEditor({ post }) {
  const initialContent = post?.content || "";
  console.log(post);
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
  // Cloudinary URLs removed/replaced in this session, destroyed only once the post saves.
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
    try {
      await deleteImageFromCloudinary(session.backendToken, url);
    } catch (error) {
      console.error("Image delete error:", error);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(`${API_URL}/image/upload`, {
        method: "POST",
        body: formData,
        headers: { authorization: session.backendToken ?? "" },
      });

      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      return data.url;
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
    const imageFile = files.find((file) => file.type.startsWith("image/"));

    if (imageFile) {
      // For demo purposes, we'll create a URL for the dropped image
      // In a real app, you'd upload this to a cloud service
      const url = await uploadImage(imageFile);
      if (url) setImageUrl(url);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      // For demo purposes, we'll create a URL for the selected image
      // In a real app, you'd upload this to a cloud service
      const url = await uploadImage(file);
      if (url) setImageUrl(url);
    }
  };

  const uploadImageFromUrl = async (url: string): Promise<string> => {
    setIsUploadingImage(true);
    try {
      const response = await fetch(`${API_URL}/image/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: session.backendToken ?? "" },
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
          "tiptap prose prose-lg dark:prose-invert max-w-none w-full min-h-[460px] bg-transparent py-6 text-foreground focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const handlePublish = async () => {
    const payload = {
      title,
      content: content,
      image: imageUrl,
      published: true,
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
    const toDelete = pendingDeletes.filter((url) => url !== imageUrl);
    await Promise.all(toDelete.map(deleteImage));
    setPendingDeletes([]);

    router.push(`/blog/${response?.blog?.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto py-14 px-6 md:px-10">
        {/* Masthead row */}
        <div className="flex items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4 min-w-0">
            <span className="eyebrow whitespace-nowrap">{post ? "[ Editing ]" : "[ Draft ]"}</span>
            <span className="flex-1 rule" />
          </div>
          <Button
            label={post ? "Save changes" : "Publish"}
            variant="primary"
            onClick={handlePublish}
            loading={isPublishing}
            disabled={isPublishing || isUploadingImage}
          />
        </div>

        {["publish", "auth", "image"].includes(isError.element) && (
          <p className="text-destructive eyebrow -mt-8 mb-8 text-right">{isError.message}</p>
        )}

        {/* Title */}
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled story"
          className="w-full font-serif font-light text-[clamp(2.25rem,6vw,4rem)] leading-[1] tracking-tightest border-none outline-none placeholder:text-muted-foreground/50 bg-transparent text-foreground"
        />
        {isError.element === "title" && (
          <span className="text-destructive eyebrow mt-3 block">{isError.message}</span>
        )}

        {/* Featured image */}
        <div className="mt-10">
          <span className="eyebrow block mb-4">Featured image</span>

          {!imageUrl ? (
            <div className="space-y-4">
              <div
                className={`relative border border-dashed p-10 text-center transition-colors ${
                  isDragOver
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-muted-foreground"
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center gap-4">
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="w-7 h-7 text-accent animate-spin" />
                      <p className="eyebrow">Uploading image...</p>
                    </>
                  ) : (
                    <>
                      <Upload
                        className={`w-7 h-7 ${isDragOver ? "text-accent" : "text-muted-foreground"}`}
                      />
                      <p className="eyebrow">
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
                <span className="eyebrow">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {!showUrlInput ? (
                <button
                  onClick={() => setShowUrlInput(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-border hover:border-accent hover:text-accent text-foreground transition-colors eyebrow"
                >
                  <LinkIcon className="w-4 h-4" />
                  Add image from URL
                </button>
              ) : (
                <div className="flex gap-2 items-end">
                  <input
                    type="url"
                    value={tempImageUrl}
                    onChange={(e) => setTempImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 bg-transparent border-b border-border py-2 text-foreground focus:outline-none focus:border-accent transition-colors"
                  />
                  <Button
                    onClick={handleUrlSubmit}
                    label={isUploadingImage ? "Adding..." : "Add"}
                    variant="secondary"
                    size="sm"
                    loading={isUploadingImage}
                    disabled={isUploadingImage}
                  />
                  <button
                    onClick={() => {
                      setShowUrlInput(false);
                      setTempImageUrl("");
                    }}
                    className="p-2 text-muted-foreground hover:text-accent transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="relative group">
              <div className="relative w-full h-72 overflow-hidden border border-border bg-muted">
                <Image
                  src={imageUrl}
                  alt="Featured image preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  onClick={removeImage}
                  className="absolute top-3 right-3 w-8 h-8 bg-foreground text-background flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-accent hover:text-accent-foreground active:bg-accent active:text-accent-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="mt-10">
          <MenuBar editor={editor} />
          <EditorContent editor={editor} />
          {isError.element === "content" && (
            <span className="text-destructive eyebrow mt-2 block">{isError.message}</span>
          )}
        </div>
      </div>
    </div>
  );
}
