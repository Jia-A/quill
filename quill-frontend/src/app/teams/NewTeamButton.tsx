"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import Button from "@/atoms/Button";
import { useSession } from "next-auth/react";
import ShareTeamsSidebar from "@/components/ShareTeamsSidebar";

/**
 * Opens the shared drawer straight on its create-team form. Nothing is being
 * shared here, so the drawer runs without a post.
 */
const NewTeamButton = ({ className }: { className?: string }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const token = session?.backendToken;
  if (!token) return null;

  return (
    <>
      <Button
        variant="primary"
        label="New team"
        icon={<Plus className="h-4 w-4" />}
        onClick={() => setOpen(true)}
        className={className}
      />
      <ShareTeamsSidebar
        token={token}
        open={open}
        createOnly
        onClose={() => setOpen(false)}
        // The list is rendered on the server, so the new team only appears
        // once the page is re-fetched.
        onCreated={() => router.refresh()}
      />
    </>
  );
};

export default NewTeamButton;
