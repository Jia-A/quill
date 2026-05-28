import { getBulkBlogs } from "@/actions/blogActions";
import BlogList from "./BlogList";

// Enable ISR - revalidate every 5 minutes (300 seconds)
export const revalidate = 300;

export default async function BlogHub() {
  const data = await getBulkBlogs();
  const blogs = data?.blogs || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-3xl mx-auto px-6 md:px-10 py-16 md:py-24">
        {/* Masthead */}
        <header className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <span className="eyebrow">[ The reading room ]</span>
            <span className="flex-1 rule" />
          </div>
          <h1 className="font-serif font-light text-[clamp(2.5rem,7vw,5rem)] leading-[0.95] tracking-tightest">
            Latest <span className="italic accent-text">stories</span>
          </h1>
          <p className="mt-5 text-muted-foreground max-w-md">
            Words from the Quill community. {blogs.length}{" "}
            {blogs.length === 1 ? "story" : "stories"} to read.
          </p>
        </header>

        <BlogList blogs={blogs} />
      </main>
    </div>
  );
}
