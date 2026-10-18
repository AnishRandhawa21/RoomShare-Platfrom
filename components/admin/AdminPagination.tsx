"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (newPage: number) => void;
}

export function AdminPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: AdminPaginationProps) {
  if (totalPages <= 1 && totalItems === 0) return null;

  const startIdx = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const endIdx = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white border-t border-zinc-200/80 rounded-b-2xl text-xs text-zinc-500">
      <div>
        Showing <span className="font-semibold text-zinc-800">{startIdx}</span> to{" "}
        <span className="font-semibold text-zinc-800">{endIdx}</span> of{" "}
        <span className="font-semibold text-zinc-800">{totalItems}</span> results
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="flex h-8 items-center gap-1 rounded-lg border border-zinc-200 px-2.5 font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Prev</span>
        </button>

        <span className="px-2 text-xs font-semibold text-zinc-700">
          Page {currentPage} of {Math.max(1, totalPages)}
        </span>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="flex h-8 items-center gap-1 rounded-lg border border-zinc-200 px-2.5 font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <span>Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
