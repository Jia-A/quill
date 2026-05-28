"use client";
import LoggedinUserHeader from "./LoggedinUserHeader";
import HomepageHeader from "./HomepageHeader";
import { useSession } from "next-auth/react";

const Header = () => {
  const { status, data: session } = useSession();

  // Avoid flashing the logged-out header while the session is still resolving.
  if (status === "loading") {
    return (
      <div className="w-full h-[61px] bg-background/80 backdrop-blur border-b border-border sticky top-0 z-50" />
    );
  }

  return (
    <div>
      {status === "authenticated" ? <LoggedinUserHeader session={session} /> : <HomepageHeader />}
    </div>
  );
};
export default Header;
