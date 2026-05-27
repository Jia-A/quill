import Quote from "@/components/Quote";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid lg:grid-cols-2 h-screen">
      {children}
      <div className="hidden lg:block">
        <Quote />
      </div>
    </div>
  );
}
