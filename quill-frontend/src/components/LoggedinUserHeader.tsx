"use client";
import Avatar from "@/atoms/Avatar";
import Button from "@/atoms/Button";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const LoggedinUserHeader = ({session} : {session: Session}) => {
  const { name, image } = session?.user || {};
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();
  const handleLogout = () => {
    if(session){
      signOut({ callbackUrl: "/" });
    }
  };
  return (
    <header className="w-full flex justify-between items-center px-6 py-2 bg-white border-b border-gray-200 sticky top-0 z-50">
      <span
        className="text-3xl font-extrabold tracking-wide cursor-pointer"
        onClick={() => router.push("/blogs")}
      >
        QUILL
      </span>
      <div className="flex gap-10">
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
            className="absolute w-[150px] h-auto bg-white top-12 right-2 rounded-lg shadow-lg text-black py-2 z-10"
            onMouseLeave={() => setShowUserMenu(false)}
          >
            <>
              <div className="px-4 py-2 border-b border-gray-200">
                <span className="text-sm font-medium">
                  Hi {name || "User"} 👋
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
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
