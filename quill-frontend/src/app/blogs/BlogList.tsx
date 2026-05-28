"use client";
import { motion } from "framer-motion";
import { convert } from "html-to-text";
import Link from "next/link";
import Image from "next/image";

interface Blog {
  id: string;
  title: string;
  content: string;
  image?: string;
  publishedDate: string | null;
  author: {
    name: string;
  };
}

interface BlogListProps {
  blogs: Blog[];
}

export default function BlogList({ blogs }: BlogListProps) {
  function getReadingTime(text: string) {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min`;
  }

  function getOneLineText(html: string) {
    const text = convert(html, {
      wordwrap: false,
      selectors: [{ selector: "a", options: { ignoreHref: true } }],
    });
    return text.replace(/\s+/g, " ").trim();
  }

  if (!blogs?.length) {
    return (
      <div className="border-t border-border py-20 text-center">
        <p className="eyebrow">[ Nothing here yet ]</p>
        <p className="mt-4 font-serif text-2xl text-muted-foreground">
          Be the first to publish a story.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-border">
      {blogs.map((article, idx) => {
        const publishedDate =
          article?.publishedDate !== null
            ? new Date(article.publishedDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "";
        return (
          <motion.article
            key={article.id || idx}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: (idx % 6) * 0.06 }}
            className="border-b border-border group"
          >
            <Link
              href={`/blog/${article.id}`}
              prefetch={false}
              className="block py-10 text-foreground"
            >
              <div className="flex gap-8 items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Index + meta */}
                  <div className="flex items-center gap-4 mb-4 min-w-0">
                    <span className="font-mono text-sm text-accent shrink-0">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="eyebrow truncate min-w-0">
                      {[
                        article.author.name,
                        publishedDate,
                        `${getReadingTime(article.content)} read`,
                      ]
                        .filter(Boolean)
                        .join("  /  ")}
                    </span>
                  </div>

                  <h3 className="font-serif font-normal text-3xl md:text-4xl leading-tight tracking-tightest transition-colors group-hover:text-accent">
                    {article.title}
                  </h3>
                  <p className="mt-4 text-muted-foreground leading-relaxed line-clamp-2 max-w-xl">
                    {getOneLineText(article.content)}
                  </p>
                </div>

                {article.image && (
                  <div className="hidden sm:block flex-shrink-0 w-28 h-28 md:w-36 md:h-36 relative overflow-hidden border border-border bg-muted">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover md:grayscale md:group-hover:grayscale-0 transition-all duration-500"
                      sizes="(max-width: 768px) 112px, 144px"
                    />
                  </div>
                )}
              </div>
            </Link>
          </motion.article>
        );
      })}
    </div>
  );
}
