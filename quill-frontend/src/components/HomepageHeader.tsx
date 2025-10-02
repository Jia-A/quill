import Button from "@/atoms/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

const HomepageHeader = () => {
  const router = useRouter();

  return (
    <header className="w-full flex justify-between items-center px-6 py-2 bg-white border-b border-gray-200 sticky top-0 z-50">
      <span
        className="text-3xl font-extrabold tracking-wide cursor-pointer"
        onClick={() => router.push("/blogs")}
      >
        QUILL
      </span>
      <Link href={"/auth"}>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" label="Login" />
          <Button variant="secondary" size="sm" label="Signup" />
        </div>
      </Link>
    </header>
  );
};

export default HomepageHeader;
