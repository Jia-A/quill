import Link from "next/link";
import SigninForm from "@/components/SigninForm";
import OAuthButtons from "@/components/OAuthButtons";

export default function SigninPage() {
  return (
    <div className="flex justify-center items-center px-6 py-16">
      <div className="w-full max-w-[380px]">
        <span className="eyebrow">[ Welcome back ]</span>
        <h1 className="font-serif font-light text-4xl tracking-tightest mt-4">
          Login to your account
        </h1>
        <p className="mt-3 text-muted-foreground text-sm">
          New to Quill?{" "}
          <Link href="/auth/signup" className="text-foreground link-underline font-medium">
            Create an account
          </Link>
        </p>

        <SigninForm />
        <OAuthButtons callbackUrl="/blogs" />
      </div>
    </div>
  );
}
