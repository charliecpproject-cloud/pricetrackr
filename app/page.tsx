"use client";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Price Tracker Home</h1>
      <button
        onClick={handleLogout}
        className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
      >
        Logout
      </button>
    </div>
  );
}
