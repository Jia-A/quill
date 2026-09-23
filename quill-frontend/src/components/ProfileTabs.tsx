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
  sharedBlogs: Blog[];
  // Where each moderation list should resume from, or null if that's all.
  pendingCursor: string | null;
  rejectedCursor: string | null;
};

type TabId =
  | "drafts"
  | "published"
  | "shared"
  | "comments"
  | "approve"
  | "rejected"
  | "notifications";

// `gap` marks where the posts group ends and the comments group begins.
const TABS: { id: TabId; label: string; gap?: boolean }[] = [
  { id: "published", label: "Published" },
  { id: "shared", label: "Shared" },
  { id: "drafts", label: "Drafts" },
  { id: "comments", label: "Comments", gap: true },
  { id: "approve", label: "To approve" },
  { id: "rejected", label: "Rejected" },
  { id: "notifications", label: "Notifications" },
];

// BlogList renders nothing for an empty array, so empty tabs need their own note.
const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="rounded-md border border-border p-8 text-center text-sm text-muted">{children}</p>
);

const ProfileTabs = ({
  draftBlogs,
  publishedBlogs,
  addedComments,
  pendingComments,
  rejectedComments,
  pendingCursor,
  rejectedCursor,
  sharedBlogs,
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
    shared: posts(sharedBlogs, "Nothing published yet."),

    // Your own comments, so the status and the post's author both matter.
    comments: <PendingCommentsList key="comments" comments={addedComments} />,

    // These two are all on your own posts, so the post author is you and the
    // status is already implied by the tab.
    approve: (
      <PendingCommentsList
        key="approve"
        comments={pendingComments}
        showStatus={false}
        showPostAuthor={false}
        status="PENDING"
        nextCursor={pendingCursor}
      />
    ),
    rejected: (
      <PendingCommentsList
        key="rejected"
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
    <div className="mt-8">
      <nav
        aria-label="Profile sections"
        className="scroll-strip overflow-x-auto border-b border-border"
      >
        <div role="tablist" className="flex min-w-max items-center">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={tab.id === active}
              onClick={() => setActive(tab.id)}
              className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm ${
                tab.gap ? "ml-2 border-l border-l-border pl-5" : ""
              } ${
                tab.id === active
                  ? "border-b-accent font-medium text-fg"
                  : "border-b-transparent text-muted hover:text-fg"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="mt-6">{panels[active]}</div>
    </div>
  );
};

export default ProfileTabs;
