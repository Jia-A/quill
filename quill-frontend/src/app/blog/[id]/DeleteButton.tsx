"use client";
import { deleteBlog } from "@/actions/blogActions";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const DeleteButton = ({
  blog,
}: {
  blog: { id: string; title: string; content: string; image: string; authorId: string };
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const { data: session } = useSession();
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    setError("");
    try {
      await deleteBlog(blog.id, session?.backendToken ?? "");
      router.push("/blogs");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete your post");
      setIsDeleting(false);
    }
  };

  // Lock background scroll while the dialog is open. Padding replaces the width
  // the hidden scrollbar leaves behind, so the page doesn't shift.
  useEffect(() => {
    if (!showDialog) return;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const { overflow, paddingRight } = document.body.style;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [showDialog]);

  const isAuthor = session?.user?.id === blog.authorId;
  if (!isAuthor) return null;

  return (
    <div>
      <button
        onClick={() => {
          setError("");
          setShowDialog(true);
        }}
        className="group inline-flex items-center gap-3 eyebrow bg-foreground text-background px-6 py-4 hover:bg-accent hover:text-accent-foreground hover:border-accent transition-colors"
      >
        Delete blog
      </button>

      <AnimatePresence>
        {showDialog && (
          <motion.div
            key="delete-confirm"
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => !isDeleting && setShowDialog(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-background border border-border p-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="font-serif font-light text-3xl tracking-tightest">
                Delete this story?
              </h2>
              <p className="text-muted-foreground mt-3">
                This will permanently remove the blog and its image. This action cannot be undone.
              </p>
              {error && <p className="accent-text mt-3">{error}</p>}

              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setShowDialog(false)}
                  disabled={isDeleting}
                  className="eyebrow px-6 py-4 border border-border hover:bg-secondary transition-colors disabled:opacity-60 disabled:pointer-events-none"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="eyebrow px-6 py-4 bg-foreground text-background hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-60 disabled:pointer-events-none"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DeleteButton;
