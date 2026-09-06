import BlogList from "@/app/blogs/BlogList";
import { getPublicUserProfile } from "@/actions/userActions";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const response = await getPublicUserProfile(id);
  const name = response?.user?.name || "Author";
  return { title: `${name} — Quill` };
}

const AuthorProfilePage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const response = await getPublicUserProfile(id);

  if (!response?.user) {
    notFound();
  }

  const user = response.user;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-3xl mx-auto px-6 md:px-10 py-16 md:py-24">
        <div className="flex items-center gap-4 mb-8">
          <span className="eyebrow">[ Profile ]</span>
          <span className="flex-1 rule" />
        </div>

        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 sm:items-center">
          <div className="w-24 h-24 shrink-0 overflow-hidden border border-foreground/30">
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="flex items-center justify-center w-full h-full bg-foreground text-background font-serif text-3xl">
                {user.name?.charAt(0) || "?"}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-serif font-light text-[clamp(2rem,5vw,3.5rem)] leading-[0.95] tracking-tightest">
              {user.name || "Anonymous"}
            </h1>
            {user.aboutAuthor && (
              <p className="mt-4 font-serif italic text-foreground/80 leading-relaxed max-w-md">
                {user.aboutAuthor}
              </p>
            )}
          </div>
        </div>

        <div className="mt-16">
          <div className="flex items-center gap-4 mb-8">
            <span className="eyebrow">[ Posts ]</span>
            <span className="flex-1 rule" />
          </div>
          <BlogList blogs={user.posts || []} />
        </div>
      </main>
    </div>
  );
};

export default AuthorProfilePage;
