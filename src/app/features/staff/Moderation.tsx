import ConnectedModerationQueue from './ConnectedModerationQueue';

/** Hàng đợi kiểm duyệt dùng cho luồng Administrator xử lý các ca chuyển cấp. */
export function ModerationQueue({ admin }: { admin?: boolean }) {
  return <ConnectedModerationQueue admin={admin} />;
}
