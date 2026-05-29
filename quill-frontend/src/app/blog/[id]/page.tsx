import { getBlogById } from "@/actions/blogActions";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import SocialDraftsPanel from "@/components/SocialDraftsPanel";
import type { Metadata } from "next";
import { sanitizeBlogHtmlServer } from "@/utils/sanitizeServer";

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
    const response = await getBlogById(id);
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

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  try {
    const response = await getBlogById(id);

    if (!response.blog) {
      throw new Error("Blog not found");
    }

    const blog = response.blog;
    const publishedDate = blog.publishedDate
      ? new Date(blog.publishedDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : null;

    const wordCount = blog.content ? blog.content.replace(/<[^>]*>/g, "").split(/\s+/).length : 0;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    // Defense in depth: content is sanitized by the backend on write, but we
    // sanitize again at the render boundary before dangerouslySetInnerHTML.
    const safeContent = await sanitizeBlogHtmlServer(blog.content || "");

    const meta = [blog.author?.name || "Anonymous", publishedDate, `${readingTime} min read`]
      .filter(Boolean)
      .join("  /  ");

    return (
      <div className="min-h-screen bg-background">
        <article className="max-w-3xl mx-auto px-6 md:px-10 py-16 md:py-24">
          {/* Back link */}
          <Link
            href="/blogs"
            className="group inline-flex items-center gap-2 eyebrow text-muted-foreground hover:text-accent transition-colors mb-12"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            All stories
          </Link>

          {/* Header */}
          <header>
            <div className="eyebrow mb-6">{meta}</div>
            <h1 className="font-serif font-light text-[clamp(2.5rem,7vw,5rem)] leading-[0.98] tracking-tightest text-foreground">
              {blog.title}
            </h1>
          </header>

          {/* Featured image */}
          {blog.image && (
            <div className="my-12 overflow-hidden border border-border bg-muted">
              <Image
                src={blog.image}
                alt={blog.title}
                width={1200}
                height={600}
                className="w-full aspect-[16/9] md:aspect-auto md:h-[26rem] object-cover"
                priority
              />
            </div>
          )}

          <div className="rule my-12" />

          {/* Body */}
          <div
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: safeContent }}
          />

          {/* Footer / author */}
          <footer className="border-t border-border mt-20 pt-12">
            {blog.author && (
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 flex-shrink-0 bg-foreground text-background flex items-center justify-center font-serif text-2xl">
                  {blog.author.name?.charAt(0).toUpperCase() || "A"}
                </div>
                <div>
                  <span className="eyebrow">Written by</span>
                  <h3 className="font-serif text-2xl tracking-tightest mt-1">
                    {blog.author.name || "Anonymous"}
                  </h3>
                  <p className="text-muted-foreground mt-1 text-sm max-w-md">
                    Writing on Quill — sharing stories that matter.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-12">
              <Link
                href="/blogs"
                className="group inline-flex items-center gap-3 eyebrow bg-foreground text-background px-6 py-4 hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                Back to all stories
              </Link>
              {blog.author?.id && blog.published && (
                <SocialDraftsPanel postId={blog.id} authorId={blog.author.id} />
              )}
            </div>
          </footer>
        </article>
      </div>
    );
  } catch (error) {
    console.error(`Error fetching blog ${id}:`, error);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-lg text-center">
          <span className="font-serif font-light text-[clamp(4rem,15vw,9rem)] leading-none accent-text block">
            404
          </span>
          <h1 className="font-serif text-3xl tracking-tightest mt-4 mb-4">Story not found</h1>
          <p className="text-muted-foreground mb-10 leading-relaxed">
            The story you&apos;re looking for doesn&apos;t exist or may have been moved.
          </p>
          <Link
            href="/blogs"
            className="group inline-flex items-center gap-3 eyebrow bg-foreground text-background px-6 py-4 hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Browse all stories
          </Link>
        </div>
      </div>
    );
  }
};

export default page;
