'use client';

import { useState, type FormEvent } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import './kid-shelves.css';

interface KidSearchActionProps {
  open: boolean;
  onOpen: () => void;
  onSubmit: (keyword: string) => void;
  onClose: () => void;
  searching: boolean;
}

// Nút và ô tìm kiếm truyện cho kệ sách của bé
export default function KidSearchAction({
  open,
  onOpen,
  onSubmit,
  onClose,
  searching,
}: KidSearchActionProps) {
  const [value, setValue] = useState('');

  if (!open) {
    return (
      <button
        type="button"
        className="kid-shelf-search-btn"
        aria-label="Tìm truyện"
        title="Tìm truyện"
        onClick={onOpen}
      >
        <Search size={24} aria-hidden="true" />
      </button>
    );
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const k = value.trim();
    if (!k) return;
    onSubmit(k);
  };

  const handleClose = () => {
    setValue('');
    onClose();
  };

  return (
    <form role="search" className="kid-shelf-search open" onSubmit={handleSubmit}>
      <input
        type="search"
        className="inp"
        aria-label="Tìm truyện"
        placeholder="Em muốn đọc truyện gì?"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        type="submit"
        className="kid-shelf-search-btn"
        aria-label="Tìm truyện"
        disabled={searching}
      >
        <ArrowRight size={20} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="kid-shelf-search-btn"
        aria-label="Đóng tìm kiếm"
        title="Đóng tìm kiếm"
        onClick={handleClose}
      >
        <X size={20} aria-hidden="true" />
      </button>
    </form>
  );
}
