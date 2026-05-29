import Link from "next/link";
import SignupForm from "@/components/SignupForm";
import OAuthButtons from "@/components/OAuthButtons";

export default function SignupPage() {
  return (
    <div className="flex justify-center items-center px-6 py-16">
      <div className="w-full max-w-[380px]">
        <span className="eyebrow">[ Begin writing ]</span>
        <h1 className="font-serif font-light text-4xl tracking-tightest mt-4">
          Create your account
        </h1>
        <p className="mt-3 text-muted-foreground text-sm">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-foreground link-underline font-medium">
            Sign in
          </Link>
        </p>

        <SignupForm />
        <OAuthButtons callbackUrl="/blogs" />
      </div>
    </div>
  );
}
