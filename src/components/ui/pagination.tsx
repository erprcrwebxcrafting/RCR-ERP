"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
}

export function Pagination({ currentPage, totalPages, totalItems, pageSize = 10 }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalItems <= pageSize) {
    return null;
  }

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="mt-8 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-6">
      <div className="text-sm text-slate-500 font-medium">
        Showing <span className="font-bold text-slate-900 dark:text-white">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-bold text-slate-900 dark:text-white">{Math.min(currentPage * pageSize, totalItems)}</span> of <span className="font-bold text-slate-900 dark:text-white">{totalItems}</span> results
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          asChild
          disabled={currentPage <= 1}
          className={currentPage <= 1 ? "opacity-50 pointer-events-none" : ""}
        >
          <Link href={createPageURL(currentPage - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          asChild
          disabled={currentPage >= totalPages}
          className={currentPage >= totalPages ? "opacity-50 pointer-events-none" : ""}
        >
          <Link href={createPageURL(currentPage + 1)}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
