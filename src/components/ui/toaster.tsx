"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-zinc-900 group-[.toaster]:text-zinc-100 group-[.toaster]:border-zinc-800 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl group-[.toaster]:p-4 group-[.toaster]:font-sans",
          description: "group-[.toast]:text-zinc-400 text-xs mt-1",
          actionButton:
            "group-[.toast]:bg-amber-500 group-[.toast]:text-zinc-950 font-medium",
          cancelButton:
            "group-[.toast]:bg-zinc-800 group-[.toast]:text-zinc-300",
          closeButton:
            "group-[.toast]:bg-zinc-800 group-[.toast]:text-zinc-400 group-[.toast]:hover:text-zinc-100 group-[.toast]:border-zinc-700",
          success:
            "group-[.toaster]:!border-emerald-500/30 group-[.toaster]:!bg-emerald-950/40 group-[.toaster]:!text-emerald-200",
          error:
            "group-[.toaster]:!border-red-500/30 group-[.toaster]:!bg-red-950/40 group-[.toaster]:!text-red-200",
          warning:
            "group-[.toaster]:!border-amber-500/30 group-[.toaster]:!bg-amber-950/40 group-[.toaster]:!text-amber-200",
          info:
            "group-[.toaster]:!border-cyan-500/30 group-[.toaster]:!bg-cyan-950/40 group-[.toaster]:!text-cyan-200",
        },
      }}
      {...props}
    />
  );
}
