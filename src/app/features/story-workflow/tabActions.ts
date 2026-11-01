import { createContext, useContext, type ReactNode } from "react";

/**
 * Cụm nút điều khiển của Studio (quay lại, huỷ, duyệt, đổi bé). Studio đưa vào đây,
 * các thanh tab của từng bố cục (Yêu cầu/Dàn ý, Truyện/Học liệu, tạo tranh) hiện nó ở góc phải.
 * Ngoài Studio không có Provider nên không hiện gì.
 */
export const TabActions = createContext<ReactNode>(null);

export function useTabActions(): ReactNode {
  return useContext(TabActions);
}
