import { getBulkBlogs } from "@/actions/blogActions";
import BlogList from "./BlogList";

// Enable ISR - revalidate every 5 minutes (300 seconds)
export const revalidate = 300;

export default async function BlogHub() {
  // Fetch data on the server
  const data = await getBulkBlogs();
  console.log(data)
  const blogs = data?.blogs || [];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold mb-8">Latest Articles</h2>
        <BlogList blogs={blogs} />
      </main>
    </div>
  );
}

