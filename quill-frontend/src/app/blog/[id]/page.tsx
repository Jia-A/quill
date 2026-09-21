import { getBlogById } from "@/actions/blogActions";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import SocialDraftsPanel from "@/components/SocialDraftsPanel";
import type { Metadata } from "next";
import { sanitizeBlogHtmlServer } from "@/utils/sanitizeServer";
import EditButton from "./EditButton";
import DeleteButton from "./DeleteButton";
import Avatar from "@/atoms/Avatar";
import CommentableContent from "@/components/CommentableContent";
import { formatDate, getReadingTime } from "@/utils/postMeta";

export const revalidate = 300;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const session = await auth();
    const response = await getBlogById(id, session?.backendToken);
    const blog = response?.blog;
    if (!blog) return { title: "Story not found — Quill" };

    const description =
      blog.summary || (blog.content ? stripHtml(blog.content).slice(0, 200) : "Read on Quill.");
    const url = `${SITE_URL}/blog/${id}`;
    const images = blog.image ? [{ url: blog.image }] : undefined;
    const authorName = blog.author?.name || "Anonymous";

    return {
      title: `${blog.title} — Quill`,
      description,
      alternates: { canonical: url },
      openGraph: {
        title: blog.title,
        description,
        url,
        siteName: "Quill",
        type: "article",
        authors: [authorName],
        images,
      },
      twitter: {
        card: images ? "summary_large_image" : "summary",
        title: blog.title,
        description,
        images: images?.map((i) => i.url),
      },
    };
  } catch {
    return { title: "Quill" };
  }
}

const Blog = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const session = await auth();
  const response = await getBlogById(id, session?.backendToken);
  if (!response?.blog) {
    notFound();
  }

  const blog = response.blog;
  const publishedDate = formatDate(blog.publishedDate, true);

  const safeContent = await sanitizeBlogHtmlServer(blog.content || "");

  const meta = [blog.author?.name || "Anonymous", publishedDate, getReadingTime(blog.content)]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="mx-auto max-w-reading px-4 py-10">
      <Link
        href="/blogs"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
      >
        <ArrowLeft className="w-4 h-4" />
        All stories
      </Link>

      <header className="mt-6">
        <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight">
          {blog.title}
        </h1>
        <p className="mt-3 text-sm text-muted">{meta}</p>

        {blog.author?.id && (
          <div className="mt-5 flex flex-wrap gap-2">
            {blog?.published && <SocialDraftsPanel postId={blog.id} authorId={blog.author.id} />}
            <EditButton blog={blog} />
            <DeleteButton blog={blog} />
          </div>
        )}
      </header>

      {blog.image && (
        <Image
          src={blog.image}
          alt={blog.title}
          width={1200}
          height={600}
          className="mt-8 w-full rounded-md border border-border object-cover"
          priority
        />
      )}

      <div className="mt-8 border-t border-border pt-8">
        <CommentableContent
          html={safeContent}
          postId={blog.id}
          token={session?.backendToken}
          postAuthorId={blog.author?.id}
          currentUserId={session?.user?.id}
        />
      </div>

      {blog.author && (
        <footer className="mt-12 border-t border-border pt-6">
          <Link href={`/author/${blog.author.id}`} className="flex items-center gap-3">
            <Avatar
              size="md"
              avImage={blog.author.avatar}
              alt={blog.author.name || "Anonymous"}
              name={blog.author.name || "A"}
            />
            <div>
              <p className="text-xs text-muted">Written by</p>
              <p className="font-medium hover:text-accent">{blog.author.name || "Anonymous"}</p>
            </div>
          </Link>
        </footer>
      )}
    </article>
  );
};

export default Blog;
