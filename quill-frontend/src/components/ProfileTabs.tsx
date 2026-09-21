"use client";

import { useState } from "react";
import BlogList, { type Blog } from "@/app/blogs/BlogList";
import PendingCommentsList from "@/components/PendingCommentsList";
import ProfileNotificationsList from "@/components/ProfileNotificationsList";
import type { Comment } from "@/types/CommentProps";

type ProfileTabsProps = {
  draftBlogs: Blog[];
  publishedBlogs: Blog[];
  addedComments: Comment[];
  pendingComments: Comment[];
  rejectedComments: Comment[];
  // Where each moderation list should resume from, or null if that's all.
  pendingCursor: string | null;
  rejectedCursor: string | null;
};

type TabId = "drafts" | "published" | "comments" | "approve" | "rejected" | "notifications";

// `gap` marks where the posts group ends and the comments group begins.
const TABS: { id: TabId; label: string; gap?: boolean }[] = [
  { id: "drafts", label: "Drafts" },
  { id: "published", label: "Published" },
  { id: "comments", label: "Comments", gap: true },
  { id: "approve", label: "To approve" },
  { id: "rejected", label: "Rejected" },
  { id: "notifications", label: "Notifications" },
];

// BlogList renders nothing for an empty array, so empty tabs need their own note.
const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="py-2 text-xl font-serif text-muted-foreground">{children}</p>
);

const ProfileTabs = ({
  draftBlogs,
  publishedBlogs,
  addedComments,
  pendingComments,
  rejectedComments,
  pendingCursor,
  rejectedCursor,
}: ProfileTabsProps) => {
  const [active, setActive] = useState<TabId>("published");

  // BlogList draws nothing for an empty list, so say so ourselves.
  const posts = (blogs: Blog[], emptyMessage: string) => {
    if (blogs.length === 0) return <Empty>{emptyMessage}</Empty>;
    return <BlogList blogs={blogs} />;
  };

  const panels: Record<TabId, React.ReactNode> = {
    drafts: posts(draftBlogs, "Nothing in progress. Start something."),
    published: posts(publishedBlogs, "Nothing published yet."),

    // Your own comments, so the status and the post's author both matter.
    comments: <PendingCommentsList comments={addedComments} />,

    // These two are all on your own posts, so the post author is you and the
    // status is already implied by the tab.
    approve: (
      <PendingCommentsList
        comments={pendingComments}
        showStatus={false}
        showPostAuthor={false}
        status="PENDING"
        nextCursor={pendingCursor}
      />
    ),
    rejected: (
      <PendingCommentsList
        comments={rejectedComments}
        showStatus={false}
        showPostAuthor={false}
        status="REJECTED"
        nextCursor={rejectedCursor}
      />
    ),

    notifications: <ProfileNotificationsList />,
  };

  return (
    <div className="mt-16">
      <nav aria-label="Profile sections" className="overflow-x-auto border-b border-border">
        <div role="tablist" className="flex min-w-max items-center">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={tab.id === active}
              onClick={() => setActive(tab.id)}
              className={`cursor-pointer whitespace-nowrap px-3 py-2 font-serif transition-colors text-lg duration-300 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
                tab.gap ? "ml-3 border-l border-border pl-6" : ""
              } ${
                tab.id === active ? "text-accent" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="mt-10">{panels[active]}</div>
    </div>
  );
};

export default ProfileTabs;
