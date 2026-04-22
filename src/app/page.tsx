import { redirect } from "next/navigation";

// Root page: redirect langsung ke dashboard
export default function RootPage() {
  redirect("/dashboard");
}
