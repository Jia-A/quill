"use client";

import React, { useState, useRef, DragEvent } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import MenuBar from "@/components/EditorMenuBar";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Image from "next/image";
import Button from "@/atoms/Button";
import { postBlog } from "@/actions/blogActions";
import { Upload, X, ImageIcon, Link as LinkIcon } from "lucide-react";

export default function BlogEditor() {
  const [title, setTitle] = useState("");
  const [isError, setIsError] = useState({ element: "", message: "" });
  const [imageUrl, setImageUrl] = useState("");
  const [content, setContent] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onChange = (content: string) => {
    setContent(content);
    console.log(content);
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
    ],
    // Remove content property to start with truly empty editor
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose max-w-none w-full min-h-[500px] border rounded-md bg-slate-50 py-2 px-3",
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

    console.log(title, content);

    if (!title) {
      setIsError({ element: "title", message: "Title is required" });
      return;
    }
    if (!content || content === "<p></p>") {
      setIsError({ element: "content", message: "Content is required" });
      return;
    }
    try {
      const response = await postBlog(payload);
      console.log(response);
    } catch (error) {
      console.log(error);
    }
    console.log(payload);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto py-8 px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Create Your Story
          </h1>
          <p className="text-gray-600">Share your thoughts with the world</p>
        </div>

        {/* Publish Button */}
        <div className="mb-8 flex justify-center">
          <Button
            label="Publish Post"
            variant="primary"
            className="px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            onClick={handlePublish}
          />
        </div>

        {/* Main Editor Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Blog Title Input */}
          <div className="p-6 border-b border-gray-100">
            <label
              htmlFor="title"
              className="block text-sm font-semibold text-gray-700 mb-3"
            >
              Article Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a compelling title..."
              className="w-full text-2xl font-bold border-none outline-none placeholder-gray-400 bg-transparent"
            />
            {isError.element === "title" && (
              <span className="text-red-500 text-sm mt-2 block">
                {isError.message}
              </span>
            )}
          </div>

          {/* Enhanced Image Upload Section */}
          <div className="p-6 border-b border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Featured Image
            </label>

            {!imageUrl ? (
              <div className="space-y-4">
                {/* Drag and Drop Area */}
                <div
                  className={`relative border border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                    isDragOver
                      ? "border-blue-500 bg-blue-50 scale-105"
                      : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        isDragOver
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <Upload className="w-8 h-8" />
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {isDragOver
                          ? "Drop your image here!"
                          : "Drop your image here"}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        or click to browse your files
                      </p>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Alternative Options */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-sm text-gray-500 font-medium">or</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                {/* URL Input Toggle */}
                {!showUrlInput ? (
                  <button
                    onClick={() => setShowUrlInput(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Add image from URL
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={tempImageUrl}
                      onChange={(e) => setTempImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Button
                      onClick={handleUrlSubmit}
                      label="Add"
                      variant="primary"
                      className="px-6 py-2 text-white"
                    >
                      Add
                    </Button>
                    <button
                      onClick={() => {
                        setShowUrlInput(false);
                        setTempImageUrl("");
                      }}
                      className="px-4 py-2 text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Image Preview */
              <div className="relative group">
                <div className="relative w-full h-64 rounded-xl overflow-hidden bg-gray-100">
                  <Image
                    src={imageUrl}
                    alt="Featured image preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {/* Remove Button */}
                  <button
                    onClick={removeImage}
                    className="absolute top-3 right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Image ready! Click the × to remove and choose a different one.
                </p>
              </div>
            )}
          </div>

          {/* Editor Section */}
          <div className="p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Content
            </label>
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
            {isError.element === "content" && (
              <span className="text-red-500 text-sm mt-2 block">
                {isError.message}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
