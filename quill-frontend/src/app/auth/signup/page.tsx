import Link from "next/link";
import SignupForm from "@/components/SignupForm";
import OAuthButtons from "@/components/OAuthButtons";

export default function SignupPage() {
  return (
    <div className="w-full max-w-sm">
      <h1 className="text-xl font-semibold">Create your account</h1>

      <div className="mt-5 rounded-md border border-border p-5">
        <SignupForm />
        <OAuthButtons callbackUrl="/blogs" />
      </div>

      <p className="mt-4 rounded-md border border-border p-4 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/auth/signin" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
