"use client";
import Avatar from "@/atoms/Avatar";
import Button from "@/atoms/Button";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

const LoggedinUserHeader = ({ session }: { session: Session }) => {
  const { name, image } = session?.user || {};
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();
  const handleLogout = () => {
    if (session) {
      signOut({ callbackUrl: "/" });
    }
  };
  return (
    <header className="w-full flex justify-between items-center px-6 py-2 bg-background border-b border-border sticky top-0 z-50">
      <span
        className="text-3xl font-extrabold tracking-wide cursor-pointer"
        onClick={() => router.push("/blogs")}
      >
        QUILL
      </span>
      <div className="flex gap-4 items-center">
        <ThemeToggle />
        <Button
          variant="secondary"
          size="sm"
          label="Write"
          icon={<PencilSquareIcon width={20} height={20} />}
          onClick={() => router.push("/editor")}
        />
        <Avatar
          size="sm"
          avImage={image}
          alt={name}
          name={name}
          onClick={() => setShowUserMenu(!showUserMenu)}
        />
        {showUserMenu && (
          <div
            className="absolute w-[150px] h-auto bg-card border border-border top-12 right-2 rounded-lg shadow-lg text-card-foreground py-2 z-10"
            onMouseLeave={() => setShowUserMenu(false)}
          >
            <>
              <div className="px-4 py-2 border-b border-border">
                <span className="text-sm font-medium block truncate">Hi {name || "User"} 👋</span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm hover:bg-muted cursor-pointer"
              >
                Logout
              </button>
            </>
          </div>
        )}
      </div>
    </header>
  );
};

export default LoggedinUserHeader;
