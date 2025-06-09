// components/AdminLogoutButton.tsx
"use client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function AdminLogoutButton() {
  const supabase = createClientComponentClient();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  };
  return <button onClick={handleLogout}>Logout</button>;
}
