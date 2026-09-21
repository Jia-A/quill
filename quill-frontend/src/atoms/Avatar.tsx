import Image from "next/image";
import { AvatarProps } from "@/types/AvatarProps";

const sizes = {
  sm: "w-7 h-7 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
  xl: "w-20 h-20 text-2xl",
};

const Avatar = ({ size = "md", avImage, alt, name, onClick }: AvatarProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative overflow-hidden rounded-full border border-border ${sizes[size]}`}
    >
      {avImage ? (
        <Image src={avImage} alt={alt || name || "avatar"} className="object-cover" fill />
      ) : (
        <span className="flex items-center justify-center w-full h-full bg-bg-subtle font-medium">
          {name?.charAt(0).toUpperCase()}
        </span>
      )}
    </button>
  );
};

export default Avatar;
