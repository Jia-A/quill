import { getBulkBlogs } from "@/actions/blogActions";
import BlogList from "./BlogList";

// Enable ISR - revalidate every 5 minutes (300 seconds)
export const revalidate = 300;

export default async function BlogHub() {
  const data = await getBulkBlogs();
  const blogs = data?.blogs || [];

  return (
    <main className="mx-auto max-w-content px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Stories</h1>
        <p className="mt-1 text-sm text-muted">
          {blogs.length} {blogs.length === 1 ? "story" : "stories"} from the Quill community.
        </p>
      </header>

      <BlogList blogs={blogs} />
    </main>
  );
}
