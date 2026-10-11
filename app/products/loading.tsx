export default function Loading() {
  return (
    <div className="p-4 space-y-4 max-w-xl mx-auto">
      <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 w-4/5 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
    </div>
  );
}
