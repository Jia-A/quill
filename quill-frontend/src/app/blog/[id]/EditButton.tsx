"use client";
import Button from "@/atoms/Button";
import { useSession } from "next-auth/react";

const EditButton = ({
  blog,
  className,
}: {
  blog: { id: string; title: string; content: string; image: string; authorId: string };
  className?: string;
}) => {
  const { data: session } = useSession();

  const isAuthor = session?.user?.id === blog.authorId;
  if (!isAuthor) return null;

  return (
    <Button
      href={`/editor/${blog.id}`}
      prefetch={false}
      variant="secondary"
      label="Edit blog"
      className={`justify-center ${className || ""}`.trim()}
    />
  );
};

export default EditButton;
