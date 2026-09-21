import BlogList from "@/app/blogs/BlogList";
import { getPublicUserProfile } from "@/actions/userActions";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const response = await getPublicUserProfile(id);
  const name = response?.user?.name || "Author";
  return { title: `${name} — Quill` };
}

const AuthorProfilePage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const response = await getPublicUserProfile(id);

  if (!response?.user) {
    notFound();
  }

  const user = response.user;
  const posts = user.posts || [];

  return (
    <main className="mx-auto max-w-content px-4 py-10">
      <Link
        href="/blogs"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
      >
        <ArrowLeft className="w-4 h-4" />
        All stories
      </Link>

      <div className="mt-6 flex items-start gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border">
          {user.avatar ? (
            <Image src={user.avatar} alt={user.name || "Author"} fill className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-bg-subtle text-2xl font-medium">
              {user.name?.charAt(0).toUpperCase() || "?"}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{user.name || "Anonymous"}</h1>
          <p className="mt-0.5 text-sm text-muted">
            {posts.length} {posts.length === 1 ? "story" : "stories"}
          </p>
          {user.aboutAuthor && (
            <p className="mt-3 max-w-prose text-sm leading-relaxed">{user.aboutAuthor}</p>
          )}
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold">Posts</h2>
      <BlogList blogs={posts} />
    </main>
  );
};

export default AuthorProfilePage;
