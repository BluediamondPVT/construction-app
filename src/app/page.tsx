// src/app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  // Automatically redirects the root URL to the login page
  redirect("/login");
}