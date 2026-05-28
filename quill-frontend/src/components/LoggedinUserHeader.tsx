"use client";
import Avatar from "@/atoms/Avatar";
import Button from "@/atoms/Button";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import Wordmark from "@/components/Wordmark";

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
    <header className="w-full flex justify-between items-center px-5 md:px-10 h-[61px] bg-background/80 backdrop-blur border-b border-border sticky top-0 z-50">
      <Wordmark href="/blogs" />
      <div className="flex gap-3 sm:gap-5 items-center">
        <ThemeToggle />
        <Button
          variant="secondary"
          size="sm"
          label="Write"
          icon={<PencilSquareIcon width={16} height={16} />}
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
          <>
            {/* Tap/click-outside backdrop — works on touch where onMouseLeave never fires */}
            <div
              className="fixed inset-0 z-40"
              aria-hidden
              onClick={() => setShowUserMenu(false)}
            />
            <div
              className="absolute w-[180px] h-auto bg-popover border border-border top-[58px] right-6 md:right-10 shadow-xl text-popover-foreground z-50"
              onMouseLeave={() => setShowUserMenu(false)}
            >
              <div className="px-4 py-3 border-b border-border">
                <span className="eyebrow block">Signed in as</span>
                <span className="text-sm font-serif block truncate mt-1">{name || "User"}</span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 eyebrow hover:text-accent transition-colors cursor-pointer"
              >
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default LoggedinUserHeader;
