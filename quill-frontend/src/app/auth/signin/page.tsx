import Link from "next/link";
import SigninForm from "@/components/SigninForm";
import OAuthButtons from "@/components/OAuthButtons";

export default function SigninPage() {
  return (
    <div className="w-full max-w-sm">
      <h1 className="text-xl font-semibold">Sign in to Quill</h1>

      <div className="mt-5 rounded-md border border-border p-5">
        <SigninForm />
        <OAuthButtons callbackUrl="/blogs" />
      </div>

      <p className="mt-4 rounded-md border border-border p-4 text-center text-sm text-muted">
        New to Quill?{" "}
        <Link href="/auth/signup" className="text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
