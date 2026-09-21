import Link from "next/link";
import Image from "next/image";
import { formatDate, getReadingTime, getExcerpt } from "@/utils/postMeta";

export interface Blog {
  id: string;
  title: string;
  content: string;
  image?: string;
  publishedDate: string | null;
  author: {
    name: string;
  };
  published?: boolean;
}

interface BlogListProps {
  blogs: Blog[];
}

export default function BlogList({ blogs }: BlogListProps) {
  if (!blogs?.length) {
    return (
      <div className="rounded-md border border-border p-10 text-center">
        <p className="font-medium">No stories yet</p>
        <p className="mt-1 text-sm text-muted">Be the first to publish one.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border border-y border-border">
      {blogs.map((article) => (
        <li key={article.id}>
          <Link
            href={`/blog/${article.id}`}
            prefetch={false}
            className="flex gap-4 py-5 hover:bg-bg-subtle"
          >
            <div className="min-w-0 flex-1">
              <h2 className="font-medium leading-snug">{article.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
                {getExcerpt(article.content)}
              </p>
              <p className="mt-2 text-xs text-muted">
                {[
                  article.author?.name,
                  formatDate(article.publishedDate),
                  getReadingTime(article.content),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>

            {article.image && (
              <div className="relative hidden h-20 w-28 shrink-0 overflow-hidden rounded-md border border-border sm:block">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </div>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
