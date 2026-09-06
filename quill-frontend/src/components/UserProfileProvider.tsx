"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getUserProfile } from "@/actions/userActions";

interface UserProfileData {
  name: string;
  avatar?: string;
}

interface UserProfileContextValue {
  userData: UserProfileData | null;
  setUserData: (data: UserProfileData) => void;
}

const UserProfileContext = createContext<UserProfileContextValue>({
  userData: null,
  setUserData: () => {},
});

export const useUserProfile = () => useContext(UserProfileContext);

export default function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [userData, setUserData] = useState<UserProfileData | null>(null);

  useEffect(() => {
    if (!session?.backendToken) return;
    getUserProfile(session.backendToken)
      .then((response) => {
        if (response?.user) {
          setUserData({ name: response.user.name, avatar: response.user.avatar });
        }
      })
      .catch((error) => {
        console.error("Failed to fetch user profile:", error);
      });
  }, [session?.backendToken]);

  return (
    <UserProfileContext.Provider value={{ userData, setUserData }}>
      {children}
    </UserProfileContext.Provider>
  );
}
