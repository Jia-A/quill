"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Inbox, Send, Users } from "lucide-react";
import { formatDate, getExcerpt, getReadingTime } from "@/utils/postMeta";
import type { TeamOverview, TeamPost } from "@/actions/teamActions";

/** Initial-only avatar. Members are a glance-level detail, so no images here. */
const MemberChip = ({ name, isYou }: { name: string; isYou: boolean }) => (
  <span
    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium ${
      isYou ? "bg-fg text-bg" : "bg-bg-subtle text-muted ring-1 ring-border"
    }`}
    aria-hidden
  >
    {name.charAt(0).toUpperCase()}
  </span>
);

/** One shared post. Drafts shared into a team are still readable by members. */
const PostRow = ({ post, showAuthor }: { post: TeamPost; showAuthor: boolean }) => (
  <li>
    <Link
      href={`/blog/${post.id}`}
      prefetch={false}
      className="group block rounded-md border border-transparent px-3 py-3 hover:border-border hover:bg-bg-subtle"
    >
      <div className="flex items-baseline gap-2">
        <h4 className="font-medium leading-snug group-hover:text-accent">{post.title}</h4>
        {post.visibility === "DRAFT" && (
          <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
            Draft
          </span>
        )}
      </div>
      {post.content && (
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
          {getExcerpt(post.content)}
        </p>
      )}
      <p className="mt-2 text-xs text-muted">
        {[
          showAuthor ? post.author?.name : null,
          formatDate(post.publishedDate),
          post.content ? getReadingTime(post.content) : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </Link>
  </li>
);

const PostSection = ({
  title,
  icon,
  posts,
  showAuthor,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  posts: TeamPost[];
  showAuthor: boolean;
  empty: string;
}) => (
  <section>
    <h3 className="flex items-center gap-2 text-sm font-medium">
      <span className="text-muted">{icon}</span>
      {title}
      {posts.length > 0 && (
        <span className="rounded-full bg-bg-subtle px-2 py-0.5 text-xs font-normal text-muted">
          {posts.length}
        </span>
      )}
    </h3>
    {posts.length === 0 ? (
      <p className="mt-2 rounded-md border border-dashed border-border px-3 py-4 text-center text-sm text-muted">
        {empty}
      </p>
    ) : (
      <ul className="mt-1.5 flex flex-col gap-0.5">
        {posts.map((post) => (
          <PostRow key={post.id} post={post} showAuthor={showAuthor} />
        ))}
      </ul>
    )}
  </section>
);

const TeamCard = ({ team }: { team: TeamOverview }) => {
  const total = team.sharedByYou.length + team.sharedWithYou.length;
  // Collapsed by default: the page is a list of teams first, so every card
  // stays scannable no matter how many teams you're in.
  const [open, setOpen] = useState(false);

  return (
    <li
      className={`overflow-hidden rounded-md border bg-card transition-colors ${
        open ? "border-muted" : "border-border hover:border-muted"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center gap-4 px-4 py-4 text-left"
      >
        {/* The stacked initials read as "who", so the row identifies the team
            without the roster having to be open. */}
        <span className="flex shrink-0 -space-x-2">
          {team.members.slice(0, 3).map((member) => (
            <MemberChip
              key={member.id}
              name={member.isYou ? "You" : member.name}
              isYou={member.isYou}
            />
          ))}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <h2 className="truncate font-medium">{team.name}</h2>
            {team.isCreator && (
              <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                Owner
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-sm text-muted">
            {team.members.length} {team.members.length === 1 ? "member" : "members"}
            {total > 0 && (
              <>
                {" · "}
                <span className="font-medium text-fg">
                  {total} {total === 1 ? "post" : "posts"}
                </span>
              </>
            )}
          </span>
        </span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            // Height is animated on the wrapper while the content sits in a
            // fixed-height child, so the inner layout never reflows mid-slide.
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-6 border-t border-border bg-bg px-4 py-5">
              <section>
                <h3 className="flex items-center gap-2 text-sm font-medium">
                  <span className="text-muted">
                    <Users className="h-3.5 w-3.5" />
                  </span>
                  Members
                </h3>
                <ul className="mt-2.5 flex flex-col gap-2">
                  {team.members.map((member) => (
                    <li key={member.id} className="flex items-center gap-2.5">
                      <MemberChip name={member.isYou ? "You" : member.name} isYou={member.isYou} />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-sm font-medium">
                          {member.isYou ? "You" : member.name}
                          {member.isCreator && (
                            <span className="rounded border border-border px-1 py-px text-[10px] font-medium uppercase tracking-wide text-muted">
                              Owner
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-xs text-muted">{member.email}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <PostSection
                title="Shared by you"
                icon={<Send className="h-3.5 w-3.5" />}
                posts={team.sharedByYou}
                showAuthor={false}
                empty="You haven't shared anything into this team."
              />

              <PostSection
                title="Shared with you"
                icon={<Inbox className="h-3.5 w-3.5" />}
                posts={team.sharedWithYou}
                showAuthor
                empty="No one has shared anything here yet."
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
};

export default TeamCard;
