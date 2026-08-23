import { auth } from "@/auth";
import { getBlogById } from "@/actions/blogActions";
import EditorClient from "./ClientEditor";

const EditBlog = async ({ params }: { params: { id: string } }) => {
  const { id } = await params;
  const session = await auth();
  try {
    const post = await getBlogById(id);
    // console.log("*********",post.blog.authorId, session?.user?.id)
    if (post.blog.authorId === session?.user?.id) {
      return <EditorClient post={post.blog} />;
    } else return <div>You are not authorized to edit this blog.</div>;
  } catch (err) {
    console.log("Error fetching blog by ID", err);
    return <div>Error fetching blog by ID</div>;
  }
};

export default EditBlog;
