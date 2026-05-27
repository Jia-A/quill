import type { Metadata } from "next";
import "./globals.css";
// import { Nunito } from "next/font/google";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { ThemeProvider } from "@/components/ThemeProvider";

const nunito = Inter({
  subsets: ["latin"],
  weight: ["400", "700"], // Specify desired weights (e.g., regular and bold)
  display: "swap", // Optimizes font loading behavior
});

export const metadata: Metadata = {
  title: "Quill",
  description: "Quill — a place to read, write, and share stories.",
  icons: {
    icon: "/quill-logo-circle.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${nunito.className} antialiased`}>
        <ThemeProvider>
          <SessionProviderWrapper>
            <Header />
            {children}
          </SessionProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
