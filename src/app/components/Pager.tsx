"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import IconButton from "@/app/components/IconButton";

/** Nút chuyển trang dùng chung cho danh sách có phân trang (`PagedResult`); chỉ một trang thì ẩn. */
export default function Pager({ page, totalPages, hasPrev, hasNext, onPage }: { page: number; totalPages: number; hasPrev: boolean; hasNext: boolean; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="pager">
      <IconButton icon={ChevronLeft} label="Trang trước" disabled={!hasPrev} onClick={() => onPage(page - 1)} />
      <span>{page}/{totalPages}</span>
      <IconButton icon={ChevronRight} label="Trang sau" disabled={!hasNext} onClick={() => onPage(page + 1)} />
    </div>
  );
}
