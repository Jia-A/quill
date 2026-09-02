"use client";
import LinkButton from "@/atoms/Link";
import { useSession } from "next-auth/react";

const EditButton = ({
  blog,
}: {
  blog: { id: string; title: string; content: string; image: string; authorId: string };
}) => {
  const { data: session } = useSession();

  const isAuthor = session?.user?.id === blog.authorId;
  if (!isAuthor) return null;

  return (
    <LinkButton href={`/editor/${blog.id}`} prefetch={false}>
      Edit blog
    </LinkButton>
  );
};

export default EditButton;
