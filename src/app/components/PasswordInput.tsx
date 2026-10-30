"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

/** Ô nhập mật khẩu có nút ẩn/hiện. Nhận mọi thuộc tính của <input>. */
export default function PasswordInput({ className = "inp", ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [show, setShow] = useState(false);
  const label = show ? "Ẩn mật khẩu" : "Hiện mật khẩu";
  return (
    <span className="pw-wrap">
      <input {...props} className={className} type={show ? "text" : "password"} />
      <button type="button" className="pw-toggle" onClick={() => setShow((s) => !s)} aria-label={label} title={label} aria-pressed={show}>
        {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </span>
  );
}
