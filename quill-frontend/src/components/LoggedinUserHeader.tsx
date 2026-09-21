"use client";
import Avatar from "@/atoms/Avatar";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import Wordmark from "@/components/Wordmark";
import NavLink from "@/components/NavLink";
import { useUserProfile } from "@/components/UserProfileProvider";
import NotificationList from "@/components/NotificationList";

const LoggedinUserHeader = ({ session }: { session: Session }) => {
  const { userData } = useUserProfile();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    if (session) {
      signOut({ callbackUrl: "/" });
    }
  };

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-border bg-bg">
      <div className="mx-auto flex h-full max-w-content items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Wordmark href="/" />
          <NavLink href="/blogs" match={["/blog", "/author"]}>
            Stories
          </NavLink>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationList />
          <Link
            href="/editor"
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-bg-subtle"
          >
            <PencilSquareIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Write</span>
          </Link>

          <div className="relative">
            <Avatar
              size="sm"
              avImage={userData?.avatar}
              alt={userData?.name || "User avatar"}
              name={userData?.name}
              onClick={() => setShowUserMenu(!showUserMenu)}
            />
            {showUserMenu && (
              <>
                {/* Click-outside backdrop — works on touch, where onMouseLeave never fires. */}
                <div
                  className="fixed inset-0 z-40"
                  aria-hidden
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="panel absolute right-0 top-10 z-50 w-48 py-1">
                  <div className="border-b border-border px-3 py-2">
                    <p className="text-xs text-muted">Signed in as</p>
                    <p className="truncate text-sm font-medium">{userData?.name}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="block px-3 py-2 text-sm hover:bg-bg-subtle"
                  >
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-bg-subtle"
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default LoggedinUserHeader;
