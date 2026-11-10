import { Info } from "lucide-react";

/**
 * Biểu tượng ⓘ đặt cạnh nhãn: lời giải thích hiện khi rê chuột (và được đọc bởi trình đọc màn hình),
 * thay cho dòng chữ nhỏ dưới ô nhập.
 */
export default function InfoTip({ text }: { text: string }) {
  return <span className="info-tip" title={text} aria-label={text} role="img"><Info className="ic" aria-hidden /></span>;
}
