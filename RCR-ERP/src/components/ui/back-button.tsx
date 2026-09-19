"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton({ fallback = "/" }: { fallback?: string }) {
  const router = useRouter();

  return (
    <button 
      onClick={() => {
        if (window.history.length > 2) {
          router.back();
        } else {
          router.push(fallback);
        }
      }} 
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all shadow-lg backdrop-blur-md"
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
}
