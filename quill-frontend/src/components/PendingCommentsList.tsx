import Link from "next/link";

const PendingCommentsList = ({ comments }) => {
  console.log(comments.comments, "heyy");
  return (
    <div>
      {comments &&
        comments.map((comment) => (
          <Link
            key={comment.id}
            href={`/blog/${comment.postId}`}
            className="p-3 border border-green"
          >
            {comment.text}
          </Link>
        ))}
    </div>
  );
};

export default PendingCommentsList;
