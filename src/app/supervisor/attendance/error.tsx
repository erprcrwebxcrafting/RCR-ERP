"use client";
export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <div className="p-8 bg-red-50 text-red-900 border border-red-200 rounded-md m-8">
      <h2 className="text-xl font-bold mb-4">Something went wrong in Attendance!</h2>
      <pre className="whitespace-pre-wrap font-mono text-sm">{error.message}</pre>
      <pre className="whitespace-pre-wrap font-mono text-xs mt-4 text-red-700/80">{error.stack}</pre>
      <button onClick={() => reset()} className="mt-4 px-4 py-2 bg-red-100 border border-red-300 rounded hover:bg-red-200 font-medium">Try again</button>
    </div>
  );
}
