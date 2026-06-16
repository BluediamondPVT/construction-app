import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils"; 

// Font configure kar rahe hain
const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-jakarta", // Tailwind ke liye variable
  weight: ["400", "500", "600", "700"], // Regular, Medium, SemiBold, Bold
});

export const metadata: Metadata = {
  title: "Construction ERP Dashboard",
  description: "Modern construction management software",
};

import { Toaster } from "@/components/ui/toaster";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          "min-h-screen bg-slate-50 font-sans text-slate-900 antialiased dark:bg-slate-900 dark:text-slate-50",
          jakarta.variable // Font ko inject kar diya
        )}
        style={{ fontFamily: 'var(--font-jakarta)' }} // Apply directly
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}