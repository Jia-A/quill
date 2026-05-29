"use client";

import React, { useState, useRef, DragEvent } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import MenuBar from "@/components/EditorMenuBar";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import ImageExtension from "@tiptap/extension-image";
import Image from "next/image";
import Button from "@/atoms/Button";
import { postBlog } from "@/actions/blogActions";
import { Upload, X, ImageIcon, Link as LinkIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function BlogEditor() {
  const { data: session } = useSession();
  const [title, setTitle] = useState("");
  const [isError, setIsError] = useState({ element: "", message: "" });
  const [imageUrl, setImageUrl] = useState("");
  const [content, setContent] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((file) => file.type.startsWith("image/"));

    if (imageFile) {
      // For demo purposes, we'll create a URL for the dropped image
      // In a real app, you'd upload this to a cloud service
      const imageUrl = URL.createObjectURL(imageFile);
      setImageUrl(imageUrl);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      // For demo purposes, we'll create a URL for the selected image
      // In a real app, you'd upload this to a cloud service
      const imageUrl = URL.createObjectURL(file);
      setImageUrl(imageUrl);
    }
  };

  const handleUrlSubmit = () => {
    if (tempImageUrl) {
      setImageUrl(tempImageUrl);
      setTempImageUrl("");
      setShowUrlInput(false);
    }
  };

  const removeImage = () => {
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
    // Remove content property to start with truly empty editor
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
    try {
      const response = await postBlog(payload, session.backendToken);
      router.push(`/blog/${response.blog.id}`);
      console.log(response); // You can add a success message or redirect the user after successful publish
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto py-14 px-6 md:px-10">
        {/* Masthead row */}
        <div className="flex items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4 min-w-0">
            <span className="eyebrow whitespace-nowrap">[ Draft ]</span>
            <span className="flex-1 rule" />
          </div>
          <Button label="Publish" variant="primary" onClick={handlePublish} />
        </div>

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
                  <Button onClick={handleUrlSubmit} label="Add" variant="secondary" size="sm" />
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

        {/* Live preview */}
        <div className="mt-20 border-t border-border pt-10">
          <div className="flex items-center gap-3 mb-8">
            <ImageIcon className="w-4 h-4 text-accent" />
            <span className="eyebrow">Live preview</span>
            <span className="flex-1 rule" />
          </div>

          {title && (
            <h1 className="font-serif font-light text-4xl md:text-5xl mb-8 text-foreground leading-tight tracking-tightest">
              {title}
            </h1>
          )}
          {imageUrl && (
            <div className="mb-10 relative w-full h-80 overflow-hidden border border-border bg-muted">
              <Image
                src={imageUrl}
                alt={title || "Blog featured image"}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <div
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{
              __html:
                content ||
                "<p class='text-muted-foreground italic'>Start writing to see your story here…</p>",
            }}
          />
        </div>
      </div>
    </div>
  );
}
