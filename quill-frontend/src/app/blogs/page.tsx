import { getBulkBlogs } from "@/actions/blogActions";
import BlogList from "./BlogList";
import SearchBox from "@/components/SearchBox";

// Enable ISR - revalidate every 5 minutes (300 seconds)
export const revalidate = 300;

export default async function BlogHub({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q?.trim() || "";

  const data = await getBulkBlogs(query);
  const blogs = data?.blogs || [];

  return (
    <main className="mx-auto max-w-content px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Stories</h1>

      {/* The results are SearchBox's children so it can fade them while the
          next page loads; the count below them is part of that result. */}
      <SearchBox q={query}>
        <p className="mb-6 mt-4 text-sm text-muted">
          {query
            ? `${blogs.length} ${blogs.length === 1 ? "result" : "results"} for “${query}”`
            : `${blogs.length} ${blogs.length === 1 ? "story" : "stories"} from the Quill community.`}
        </p>

        {query && blogs.length === 0 ? (
          <p className="rounded-md border border-border p-10 text-center text-sm text-muted">
            Nothing matched that. Try another word.
          </p>
        ) : (
          <BlogList blogs={blogs} />
        )}
      </SearchBox>
    </main>
  );
}
