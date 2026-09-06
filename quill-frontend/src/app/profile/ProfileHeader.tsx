"use client";
import { useState } from "react";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import Avatar from "@/atoms/Avatar";
import Button from "@/atoms/Button";
import EditProfileModal from "./EditProfileModal";

interface ProfileHeaderProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
    aboutAuthor?: string;
  };
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
  const [showEditModal, setShowEditModal] = useState(false);

  return (
    <>
      <div className="flex items-center gap-4 mb-8">
        <span className="eyebrow">[ Profile ]</span>
        <span className="flex-1 rule" />
      </div>

      <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
        <Avatar
          size="xl"
          avImage={user.avatar}
          name={user.name}
          alt={user.name}
          onClick={() => {}}
        />
        <div className="flex-1 min-w-0">
          <h1 className="font-serif font-light text-[clamp(2rem,5vw,3.5rem)] leading-[0.95] tracking-tightest">
            {user.name}
          </h1>
          <p className="mt-3 text-muted-foreground">{user.email}</p>
          {user.aboutAuthor && (
            <p className="mt-4 font-serif italic text-foreground/80 leading-relaxed max-w-md">
              {user.aboutAuthor}
            </p>
          )}
        </div>
        <Button
          variant="secondary"
          size="sm"
          label="Edit profile"
          icon={<PencilSquareIcon width={16} height={16} />}
          onClick={() => setShowEditModal(true)}
          className="self-start"
        />
      </div>

      {showEditModal && <EditProfileModal user={user} onClose={() => setShowEditModal(false)} />}
    </>
  );
}
