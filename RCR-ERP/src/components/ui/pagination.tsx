"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "./button";
import { useTransition } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  pageParam?: string;
}

export function Pagination({ currentPage, totalPages, totalItems, pageSize = 10, pageParam = "page" }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (totalItems <= pageSize) {
    return null;
  }

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set(pageParam, pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const handleNavigate = (url: string) => {
    startTransition(() => {
      router.push(url, { scroll: false });
    });
  };

  return (
    <div className="mt-8 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-6">
      <div className="text-sm text-slate-500 font-medium flex items-center gap-2">
        <span>
          Showing <span className="font-bold text-slate-900 dark:text-white">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-bold text-slate-900 dark:text-white">{Math.min(currentPage * pageSize, totalItems)}</span> of <span className="font-bold text-slate-900 dark:text-white">{totalItems}</span> results
        </span>
        {isPending && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleNavigate(createPageURL(currentPage - 1))}
          disabled={currentPage <= 1 || isPending}
          className={currentPage <= 1 ? "opacity-50 cursor-not-allowed" : ""}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleNavigate(createPageURL(currentPage + 1))}
          disabled={currentPage >= totalPages || isPending}
          className={currentPage >= totalPages ? "opacity-50 cursor-not-allowed" : ""}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
