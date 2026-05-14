import Link from "next/link";
import SignupForm from "@/components/SignupForm";
import OAuthButtons from "@/components/OAuthButtons";

export default function SignupPage() {
  return (
    <div className="h-screen flex justify-center items-center p-3">
      <div className="flex flex-col gap-2">
        <span className="text-3xl font-extrabold text-center">
          Create new account
        </span>
        <div className="flex gap-2 mb-3 text-center justify-center">
          <span>Already have an account?</span>
          <Link
            href="/auth/signin"
            className="underline font-bold cursor-pointer"
          >
            Signin here
          </Link>
        </div>

        <SignupForm />
        <OAuthButtons callbackUrl="/blogs" />
      </div>
    </div>
  );
}
