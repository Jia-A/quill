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
  try {
    response = await getUserProfile(session.backendToken);
    publishedBlogs = response?.user?.posts.filter((blog: Blog) => blog.published === true);
    draftBlogs = response?.user?.posts.filter((blog: Blog) => blog.published !== true);
  } catch {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <main className="max-w-3xl mx-auto px-6 md:px-10 py-16 md:py-24">
          <div className="flex items-center gap-4 mb-8">
            <span className="eyebrow">[ Profile ]</span>
            <span className="flex-1 rule" />
          </div>
          <p className="text-muted-foreground">
            {`Couldn't load your profile right now. Please try again shortly.`}
          </p>
        </main>
      </div>
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
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-3xl mx-auto px-6 md:px-10 py-16 md:py-24">
        <ProfileHeader user={response.user} />
        <ProfileTabs
          draftBlogs={draftBlogs || []}
          publishedBlogs={publishedBlogs || []}
          addedComments={authored}
          pendingComments={pendingComments?.comments ?? []}
          rejectedComments={rejectedByMe?.comments ?? []}
          pendingCursor={pendingComments?.nextCursor ?? null}
          rejectedCursor={rejectedByMe?.nextCursor ?? null}
        />
      </main>
    </div>
  );
};

export default ProfilePage;
