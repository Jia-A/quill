import ProfileHeader from "./ProfileHeader";
import { getUserProfile } from "@/actions/userActions";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPendingComments, getUserComments } from "@/actions/commentAction";
import type { Comment } from "@/types/CommentProps";
import ProfileTabs from "@/components/ProfileTabs";
import { Blog } from "../blogs/BlogList";

const ProfilePage = async () => {
  const session = await auth();

  if (!session?.backendToken) {
    redirect("/auth/signin");
  }

  let response;
  let publishedBlogs;
  let draftBlogs;
  let sharedBlogs;
  try {
    response = await getUserProfile(session.backendToken);
    publishedBlogs = response?.user?.posts.filter((blog: Blog) => blog.visibility === "PUBLIC");
    draftBlogs = response?.user?.posts.filter((blog: Blog) => blog.visibility === "DRAFT");
    sharedBlogs = response?.user?.posts.filter((blog: Blog) => blog.visibility === "SHARED");
  } catch {
    return (
      <main className="mx-auto max-w-content px-4 py-10">
        <p className="rounded-md border border-border p-8 text-center text-sm text-muted">
          {`Couldn't load your profile right now. Please try again shortly.`}
        </p>
      </main>
    );
  }

  // Fetched in parallel, and each tolerates its own failure: one failing list
  // shouldn't blank the whole profile.
  const [pendingComments, addedComments, rejectedByMe] = await Promise.all([
    getPendingComments(session.backendToken).catch(() => ({ comments: [] })),
    getUserComments(session.backendToken).catch(() => ({ comments: [] })),
    // Comments this user rejected on their own posts — not their own comments
    // that were rejected, which stay in the Comments tab with their status.
    getPendingComments(session.backendToken, "REJECTED").catch(() => ({ comments: [] })),
  ]);

  const authored: Comment[] = addedComments?.comments ?? [];

  return (
    <main className="mx-auto max-w-content px-4 py-10">
      <ProfileHeader user={response.user} />
      <ProfileTabs
        draftBlogs={draftBlogs || []}
        sharedBlogs={sharedBlogs || []}
        publishedBlogs={publishedBlogs || []}
        addedComments={authored}
        pendingComments={pendingComments?.comments ?? []}
        rejectedComments={rejectedByMe?.comments ?? []}
        pendingCursor={pendingComments?.nextCursor ?? null}
        rejectedCursor={rejectedByMe?.nextCursor ?? null}
      />
    </main>
  );
};

export default ProfilePage;
