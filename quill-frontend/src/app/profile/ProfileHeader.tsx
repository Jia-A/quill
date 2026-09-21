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
      {/* On a phone the button can't share a row with the name without
          squeezing both, so it wraps to its own line underneath. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 items-start gap-4">
          <Avatar size="xl" avImage={user.avatar} name={user.name} alt={user.name} />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">{user.name}</h1>
            <p className="mt-0.5 text-sm text-muted">{user.email}</p>
            {user.aboutAuthor && (
              <p className="mt-3 max-w-prose text-sm leading-relaxed">{user.aboutAuthor}</p>
            )}
          </div>
        </div>
        <div className="shrink-0 sm:ml-auto">
          <Button
            variant="secondary"
            size="sm"
            label="Edit profile"
            icon={<PencilSquareIcon className="w-4 h-4" />}
            onClick={() => setShowEditModal(true)}
          />
        </div>
      </div>

      {showEditModal && <EditProfileModal user={user} onClose={() => setShowEditModal(false)} />}
    </>
  );
}
