import Quote from "@/components/Quote";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid lg:grid-cols-2 min-h-[calc(100vh-61px)]">
      {children}
      <div className="hidden lg:block">
        <Quote />
      </div>
    </div>
  );
}
