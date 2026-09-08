import BlogList from "@/app/blogs/BlogList";
import ProfileHeader from "./ProfileHeader";
import { getUserProfile } from "@/actions/userActions";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

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
    publishedBlogs = response?.user?.posts.filter((blog) => blog.published === true);
    draftBlogs = response?.user?.posts.filter((blog) => blog.published !== true);
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-3xl mx-auto px-6 md:px-10 py-16 md:py-24">
        <ProfileHeader user={response.user} />
        {draftBlogs.length !== 0 && (
          <div className="mt-16">
            <div className="flex items-center gap-4 mb-8">
              <span className="eyebrow">[ Drafts ]</span>
              <span className="flex-1 rule" />
            </div>
            <BlogList blogs={draftBlogs || []} />
          </div>
        )}

        <div className="mt-16">
          <div className="flex items-center gap-4 mb-8">
            <span className="eyebrow">[ Published ]</span>
            <span className="flex-1 rule" />
          </div>
          <BlogList blogs={publishedBlogs || []} />
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
