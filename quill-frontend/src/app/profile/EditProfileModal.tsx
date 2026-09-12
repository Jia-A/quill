"use client";
import { useRef, useState, DragEvent } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Loader2, Upload } from "lucide-react";
import Button from "@/atoms/Button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { updateUserProfile } from "@/actions/userActions";
import { useUserProfile } from "@/components/UserProfileProvider";
import {
  deleteImageFromCloudinary,
  uploadImageToCloudinary,
  isImageFile,
  isCloudinaryUrl,
  resolvePendingDeletes,
} from "@/actions/imageActions";

interface EditProfileModalProps {
  user: {
    name: string;
    avatar?: string;
    aboutAuthor?: string;
  };
  onClose: () => void;
}

export default function EditProfileModal({ user, onClose }: EditProfileModalProps) {
  const [avatarPreview, setAvatarPreview] = useState(user.avatar);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isError, setIsError] = useState<{ element: string; message: string } | null>(null);
  const { data: session } = useSession();
  const router = useRouter();
  const { setUserData } = useUserProfile();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState(user.avatar || "");
  const [pendingDeletes, setPendingDeletes] = useState<string[]>([]);
  const newNameRef = useRef<HTMLInputElement>(null);
  const newAboutRef = useRef<HTMLTextAreaElement>(null);

  const applyFile = (file?: File) => {
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
  };

  const queueForDeletion = (url: string) => {
    if (url && isCloudinaryUrl(url)) {
      setPendingDeletes((queued) => [...queued, url]);
    }
  };

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const uploadImage = async (file: File): Promise<string> => {
    setIsUploadingImage(true);
    setIsError(null);
    try {
      return await uploadImageToCloudinary(session?.backendToken ?? "", file);
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
    console.log("handleDrop called");
    e.preventDefault();
    setIsDragOver(false);
    applyFile(e.dataTransfer.files?.[0]);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(isImageFile);

    if (imageFile) {
      const url = await uploadImage(imageFile);
      if (url) {
        queueForDeletion(imageUrl);
        setImageUrl(url);
      }
    }
  };
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    applyFile(e.target.files?.[0]);
    const file = e.target.files?.[0];
    if (file && isImageFile(file)) {
      // For demo purposes, we'll create a URL for the selected image
      // In a real app, you'd upload this to a cloud service
      const url = await uploadImage(file);
      if (url) {
        queueForDeletion(imageUrl);
        setImageUrl(url);
      }
    }
  };

  const removeImage = () => {
    queueForDeletion(imageUrl);
    setImageUrl("");
    setAvatarPreview(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    const name = newNameRef.current?.value || user.name;
    const about = newAboutRef.current?.value || user.aboutAuthor || "";

    const payload: { name: string; aboutAuthor: string; avatar?: string } = {
      name,
      aboutAuthor: about,
    };

    if (imageUrl !== (user.avatar || "")) {
      payload.avatar = imageUrl;
    }

    setIsSaving(true);
    setIsError(null);
    try {
      await updateUserProfile(session?.backendToken, payload);
    } catch (error) {
      console.error("Profile update error:", error);
      setIsError({
        element: "save",
        message:
          error instanceof Error ? error.message : "Failed to save changes. Please try again.",
      });
      setIsSaving(false);
      return;
    }

    const toDelete = resolvePendingDeletes(pendingDeletes, imageUrl);
    await Promise.all(toDelete.map((url) => deleteImageFromCloudinary(session?.backendToken, url)));
    setPendingDeletes([]);
    setIsSaving(false);
    setUserData({ name, avatar: imageUrl });
    onClose();
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-popover border border-border text-popover-foreground shadow-xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <span className="eyebrow">[ Edit profile ]</span>
          <Button
            variant="ghost"
            square
            onClick={onClose}
            icon={<XMarkIcon width={18} height={18} />}
          />
        </div>

        <div className="px-6 py-6 space-y-5">
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-24 h-24">
              <div
                className={`group relative w-24 h-24 overflow-hidden border transition-colors ${
                  isDragOver ? "border-accent bg-accent/5" : "border-foreground/30"
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="flex items-center justify-center w-full h-full bg-foreground text-background font-serif text-3xl">
                    {user.name?.charAt(0)}
                  </span>
                )}
                {isUploadingImage ? (
                  <Loader2 className="w-7 h-7 text-accent animate-spin" />
                ) : (
                  <div
                    className={`absolute inset-0 flex items-center justify-center bg-background/70 transition-opacity ${
                      isDragOver ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <Upload className="w-5 h-5 text-foreground" />
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              {avatarPreview && !isUploadingImage && (
                <Button
                  variant="primary"
                  square
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage();
                  }}
                  icon={<XMarkIcon width={12} height={12} />}
                  className="absolute -top-2 -right-2 !w-5 !h-5 z-10"
                />
              )}
            </div>
            <span className="eyebrow text-muted-foreground">
              {isDragOver ? "Drop it" : "Click or drag to change"}
            </span>
            {isError?.element === "image" && (
              <span className="eyebrow text-destructive">{isError.message}</span>
            )}
          </div>

          <div>
            <label className="eyebrow block mb-2">Name</label>
            <input
              type="text"
              defaultValue={user.name}
              className="w-full bg-background border border-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
              ref={newNameRef}
            />
          </div>

          <div>
            <label className="eyebrow block mb-2">About you</label>
            <textarea
              defaultValue={user.aboutAuthor}
              className="w-full bg-background border border-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
              rows={3}
              ref={newAboutRef}
              wrap="soft"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-border">
          {isError?.element === "save" && (
            <span className="eyebrow text-destructive mr-auto">{isError.message}</span>
          )}
          <Button
            variant="secondary"
            size="sm"
            label="Cancel"
            onClick={onClose}
            disabled={isSaving}
          />
          <Button
            variant="primary"
            size="sm"
            label={isSaving ? "Saving..." : "Save"}
            onClick={handleSave}
            loading={isSaving}
            disabled={isSaving || isUploadingImage}
          />
        </div>
      </div>
    </div>
  );
}
