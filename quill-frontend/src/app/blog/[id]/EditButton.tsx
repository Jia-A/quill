"use client";
import LinkButton from "@/atoms/Link";
import { useSession } from "next-auth/react";
import Link from "next/link";

const EditButton = ({
  blog,
}: {
  blog: { id: string; title: string; content: string; image: string; authorId: string };
}) => {
  const { data: session } = useSession();

  const isAuthor = session?.user?.id === blog.authorId;
  if (!isAuthor) return null;

  return (
    <LinkButton
      href={`/editor/${blog.id}`}
      prefetch={false}
      // className="group inline-flex items-center gap-3 eyebrow bg-foreground text-background px-6 py-4 hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      Edit blog
    </LinkButton>
  );
};

export default EditButton;
