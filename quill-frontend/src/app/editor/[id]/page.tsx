import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { getBlogById } from "@/actions/blogActions";
import PageNotice from "@/components/PageNotice";
import EditorClient from "./ClientEditor";

const EditBlog = async ({ params }: { params: { id: string } }) => {
  const { id } = await params;
  const session = await auth();
  let post;
  try {
    post = await getBlogById(id);
  } catch (err) {
    console.error("Error fetching blog by ID", err);
    return (
      <PageNotice
        eyebrow="[ Something went wrong ]"
        title="Couldn't load this story"
        message="We couldn't reach the server to load this story for editing. Please check your connection and try again."
      />
    );
  }

  if (!post?.blog) {
    notFound();
  }
  if (post.blog.authorId !== session?.user?.id) {
    return (
      <PageNotice
        eyebrow="[ Not yours to edit ]"
        title="You can't edit this story"
        message="This story belongs to another writer. You can still read it, but only its author can make changes."
        href={`/blog/${id}`}
        action="Read this story"
      />
    );
  }
  return <EditorClient post={post.blog} />;
};

export default EditBlog;
