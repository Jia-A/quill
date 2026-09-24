"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import Button from "@/atoms/Button";
import { useSession } from "next-auth/react";
import ShareTeamsSidebar from "@/components/ShareTeamsSidebar";

/**
 * Re-share control for a post that already lives in teams. Public posts have
 * the social panel instead, and drafts are shared from the editor, so this only
 * shows up on a SHARED post — and only for its author.
 */
const ShareTeamsButton = ({
  blog,
  className,
}: {
  blog: { id: string; authorId: string };
  className?: string;
}) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const token = session?.backendToken;
  const isAuthor = session?.user?.id === blog.authorId;
  if (!isAuthor || !token) return null;

  return (
    <>
      <Button
        variant="secondary"
        label="Share in teams"
        icon={<Users className="h-4 w-4" />}
        onClick={() => setOpen(true)}
        className={`justify-center ${className || ""}`.trim()}
      />
      <ShareTeamsSidebar
        postId={blog.id}
        token={token}
        open={open}
        onClose={() => setOpen(false)}
        // Unsharing every team drops the post back to a draft, so the page's
        // own author-only controls need to re-render off the new visibility.
        onShared={() => router.refresh()}
      />
    </>
  );
};

export default ShareTeamsButton;
