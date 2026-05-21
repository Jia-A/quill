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
  const [isError, setIsError] = useState({element : "", message: ""});
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
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      // For demo purposes, we'll create a URL for the dropped image
      // In a real app, you'd upload this to a cloud service
      const imageUrl = URL.createObjectURL(imageFile);
      setImageUrl(imageUrl);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
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
          "prose dark:prose-invert max-w-none w-full min-h-[500px] border border-border rounded-md bg-muted py-2 px-3 text-foreground",
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
      published:true
    };

    console.log(title, content)

    if(!title) {
      setIsError({element: "title", message: "Title is required"});
      return;
    }
    if(!content || content === '<p></p>') {
      setIsError({element: "content", message: "Content is required"});
      return;
    }
    try {
      const response = await postBlog(payload)
      console.log(response)
    }
    catch(error) {
      console.log(error)
    }
    console.log(payload);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto py-8 px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">Create Your Story</h1>
          <p className="text-muted-foreground">Share your thoughts with the world</p>
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
        <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
          {/* Blog Title Input */}
          <div className="p-6 border-b border-border">
            <label htmlFor="title" className="block text-sm font-semibold text-foreground mb-3">
              Article Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a compelling title..."
              className="w-full text-2xl font-bold border-none outline-none placeholder-muted-foreground bg-transparent text-foreground"
            />
            {isError.element === "title" && (
              <span className="text-red-500 text-sm mt-2 block">{isError.message}</span>
            )}
          </div>

          {/* Enhanced Image Upload Section */}
          <div className="p-6 border-b border-border">
            <label className="block text-sm font-semibold text-foreground mb-3">
              Featured Image
            </label>
            
            {!imageUrl ? (
              <div className="space-y-4">
                {/* Drag and Drop Area */}
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                    isDragOver 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 scale-105'
                      : 'border-border hover:border-muted-foreground hover:bg-muted'
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      isDragOver ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'bg-muted text-muted-foreground'
                    }`}>
                      <Upload className="w-8 h-8" />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {isDragOver ? 'Drop your image here!' : 'Drop your image here'}
                      </h3>
                      <p className="text-muted-foreground text-sm">
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
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="text-sm text-muted-foreground font-medium">or</span>
                  <div className="flex-1 h-px bg-border"></div>
                </div>

                {/* URL Input Toggle */}
                {!showUrlInput ? (
                  <button
                    onClick={() => setShowUrlInput(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-border rounded-lg hover:bg-muted text-foreground transition-colors"
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
                      className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="px-4 py-2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Image Preview */
              <div className="relative group">
                <div className="relative w-full h-64 rounded-xl overflow-hidden bg-muted">
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
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Image ready! Click the × to remove and choose a different one.
                </p>
              </div>
            )}
          </div>

          {/* Editor Section */}
          <div className="p-6">
            <label className="block text-sm font-semibold text-foreground mb-3">
              Content
            </label>
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
            {isError.element === "content" && (
              <span className="text-red-500 text-sm mt-2 block">{isError.message}</span>
            )}
          </div>
        </div>

        {/* Preview Section */}
        <div className="mt-12 bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
          <div className="p-6 bg-muted border-b border-border">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ImageIcon className="w-6 h-6" />
              Live Preview
            </h2>
            <p className="text-muted-foreground mt-1">See how your post will look</p>
          </div>
          
          <div className="p-6 min-h-[200px]">
            {/* Preview Title */}
            {title && (
              <h1 className="text-4xl font-bold mb-6 text-foreground leading-tight">{title}</h1>
            )}

            {/* Preview Image */}
            {imageUrl && (
              <div className="mb-8 relative w-full h-80 rounded-xl overflow-hidden bg-muted">
                <Image
                  src={imageUrl}
                  alt={title || "Blog featured image"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}

            {/* Preview Content */}
            <div
              className="prose prose-lg prose-gray dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: content || "<p class='text-muted-foreground italic'>Start writing to see your content here...</p>" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
