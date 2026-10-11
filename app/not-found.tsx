import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-xl font-semibold mb-4">Page not found</h2>
      <Link href="/" className="text-indigo-600 hover:underline">
        Go home
      </Link>
    </div>
  );
}
