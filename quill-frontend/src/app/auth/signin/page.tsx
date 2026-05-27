import Link from "next/link";
import SigninForm from "@/components/SigninForm";
import OAuthButtons from "@/components/OAuthButtons";

export default function SigninPage() {
  return (
    <div className="h-screen flex justify-center items-center p-3">
      <div className="flex flex-col gap-2">
        <span className="text-3xl font-extrabold text-center">
          Login to your account
        </span>
        <div className="flex gap-2 mb-3 text-center justify-center">
          <span>New to Quill?</span>
          <Link
            href="/auth/signup"
            className="underline font-bold cursor-pointer"
          >
            Signup here
          </Link>
        </div>

        <SigninForm />
        <OAuthButtons callbackUrl="/blogs" />
      </div>
    </div>
  );
}
