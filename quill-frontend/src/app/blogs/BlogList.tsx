"use client";
import { motion } from "framer-motion";
import { CalendarIcon, ClockIcon, UserIcon } from "@heroicons/react/24/outline";
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
    return `${minutes} min read`;
  }

  function getOneLineText(html) {
  const text = convert(html, {
    wordwrap: false,
    selectors: [
      { selector: "a", options: { ignoreHref: true } },
    ],
  });
  return text.replace(/\s+/g, " ").trim(); // collapse all whitespace/newlines
}

  return (
    <div className="space-y-12">
      {blogs?.map((article, idx) => {
        const publishedDate = article?.publishedDate !== null ? 
          new Date(article?.publishedDate).toLocaleDateString("en-US", { 
            year: "numeric", 
            month: "long", 
            day: "numeric" 
          }) : ""
        console.log(article)
        return (
          <motion.article
            key={article.id || idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="border-b pb-8 group hover:transition-transform hover:duration-300 hover:scale-101"
          >
            <Link href={`/blog/${article.id}`} prefetch={false} className="text-black">
              <div className="flex gap-6 items-start">
                {/* Content Section */}
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-2 hover:underline">
                    {article.title}
                  </h3>
                  <p className="mt-2 text-gray-700 leading-relaxed">
                    {getOneLineText(article.content)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                    {publishedDate && 
                      <span className="flex items-center gap-1">
                        <CalendarIcon width={16} height={16} /> {publishedDate}
                      </span>
                    }
                    <span className="flex items-center gap-1">
                      <ClockIcon width={16} height={16} /> {getReadingTime(article.content)}
                    </span>
                    <span className="flex items-center gap-1">
                      <UserIcon width={16} height={16} /> {article.author.name}
                    </span>
                  </div>
                </div>
                
                {/* Image Section */}
                {article.image && (
                  <div className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 relative rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 96px, 128px"
                    />
                  </div>
                )}
              </div>
            </Link>
          </motion.article>
        )}
      )}
    </div>
  );
}
