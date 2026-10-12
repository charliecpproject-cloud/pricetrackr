"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  // Optional: log the error for debugging
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 max-w-xl w-full mx-auto">
        <h2 className="text-xl font-semibold mb-4">問題が発生しました</h2>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
        >
          もう一度試す
        </button>
      </div>
    </div>
  );
}
