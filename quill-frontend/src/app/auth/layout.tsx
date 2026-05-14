import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Quote from "@/components/Quote";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session) redirect("/blogs");

  return (
    <div className="grid lg:grid-cols-2 h-screen">
      {children}
      <div className="hidden lg:block">
        <Quote />
      </div>
    </div>
  );
}
