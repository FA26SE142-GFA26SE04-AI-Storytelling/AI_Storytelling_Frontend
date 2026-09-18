import { ChildAccessCredential, CHILD_AVATAR_LIST } from '../types/childCredential';

const STORAGE_KEY_PREFIX = 'magictales_child_cred_';

export const childAccessCredentialService = {
  /**
   * Sinh mã EasyLogin Badge ngẫu nhiên thân thiện
   */
  generateBadgeCode(childId: number, avatarId: string): string {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `KID-${childId}-${avatarId.toUpperCase().slice(0, 3)}-${randomSuffix}`;
  },

  /**
   * Lấy thông tin credential của bé (tạo mặc định nếu chưa có)
   */
  getCredential(childProfileId: number): ChildAccessCredential {
    if (typeof window === 'undefined') {
      return this.createDefaultCredential(childProfileId);
    }

    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${childProfileId}`);
      if (raw) {
        const parsed = JSON.parse(raw) as ChildAccessCredential;
        return parsed;
      }
    } catch (e) {
      console.error('Error loading child credential:', e);
    }

    const defaultCred = this.createDefaultCredential(childProfileId);
    this.saveCredential(defaultCred);
    return defaultCred;
  },

  /**
   * Tạo credential mặc định cho một bé
   */
  createDefaultCredential(childProfileId: number): ChildAccessCredential {
    const avatarIndex = childProfileId % CHILD_AVATAR_LIST.length;
    const avatar = CHILD_AVATAR_LIST[avatarIndex] || CHILD_AVATAR_LIST[0];
    return {
      childProfileId,
      avatarId: avatar.id,
      pinCode: '1234', // PIN mặc định ban đầu là 1234
      easyLoginBadgeCode: this.generateBadgeCode(childProfileId, avatar.id),
      failedAttempts: 0,
      lockedUntil: null,
      lastLoginAt: null,
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Lưu credential của bé vào localStorage
   */
  saveCredential(cred: ChildAccessCredential): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${cred.childProfileId}`, JSON.stringify(cred));
    } catch (e) {
      console.error('Error saving child credential:', e);
    }
  },

  /**
   * Đặt lại mã PIN và/hoặc Avatar của bé
   */
  updateCredential(
    childProfileId: number,
    updates: { avatarId?: string; pinCode?: string }
  ): { success: boolean; message: string; data?: ChildAccessCredential } {
    const cred = this.getCredential(childProfileId);
    if (updates.avatarId) {
      cred.avatarId = updates.avatarId;
      cred.easyLoginBadgeCode = this.generateBadgeCode(childProfileId, updates.avatarId);
    }
    if (updates.pinCode) {
      if (!/^\d{4}$/.test(updates.pinCode)) {
        return { success: false, message: 'Mã PIN phải bao gồm đúng 4 chữ số (0-9).' };
      }
      cred.pinCode = updates.pinCode;
    }

    cred.failedAttempts = 0;
    cred.lockedUntil = null;
    cred.updatedAt = new Date().toISOString();
    this.saveCredential(cred);
    return { success: true, message: 'Đã cập nhật phương thức truy cập của bé thành công!', data: cred };
  },

  /**
   * Xác thực mã PIN của bé với cơ chế chống Brute-Force (khóa 15 phút sau 5 lần sai)
   */
  verifyPin(
    childProfileId: number,
    enteredPin: string
  ): { success: boolean; message: string; remainingAttempts?: number; lockedMinutes?: number } {
    const cred = this.getCredential(childProfileId);

    // Kiểm tra khóa tạm thời
    if (cred.lockedUntil) {
      const lockExpiry = new Date(cred.lockedUntil).getTime();
      const now = Date.now();
      if (now < lockExpiry) {
        const remainingMinutes = Math.ceil((lockExpiry - now) / 60000);
        return {
          success: false,
          message: `Hồ sơ đang tạm khóa do nhập sai quá nhiều lần. Vui lòng nhờ bố mẹ trợ giúp hoặc thử lại sau ${remainingMinutes} phút.`,
          lockedMinutes: remainingMinutes,
        };
      } else {
        // Hết thời gian khóa -> reset
        cred.lockedUntil = null;
        cred.failedAttempts = 0;
      }
    }

    // Kiểm tra mã PIN
    if (cred.pinCode === enteredPin.trim()) {
      cred.failedAttempts = 0;
      cred.lockedUntil = null;
      cred.lastLoginAt = new Date().toISOString();
      this.saveCredential(cred);
      return { success: true, message: 'Xác thực thành công!' };
    } else {
      cred.failedAttempts = (cred.failedAttempts || 0) + 1;
      if (cred.failedAttempts >= 5) {
        const lockoutTime = new Date(Date.now() + 15 * 60000).toISOString();
        cred.lockedUntil = lockoutTime;
        this.saveCredential(cred);
        return {
          success: false,
          message: 'Bé đã nhập sai 5 lần. Hệ thống tạm khóa 15 phút để bảo vệ hồ sơ. Hãy nhờ bố mẹ mở khóa nhé!',
          lockedMinutes: 15,
        };
      } else {
        this.saveCredential(cred);
        const remaining = 5 - cred.failedAttempts;
        return {
          success: false,
          message: `Mã PIN chưa chính xác. Bé còn ${remaining} lần thử nữa nhé!`,
          remainingAttempts: remaining,
        };
      }
    }
  },

  /**
   * Tìm hồ sơ bé qua mã EasyLogin Badge hoặc QR Code
   */
  verifyEasyBadgeCode(
    childProfiles: Array<{ id: number }>,
    scannedCode: string
  ): { success: boolean; childProfileId?: number; message: string } {
    const cleanCode = scannedCode.trim().toUpperCase();
    for (const child of childProfiles) {
      const cred = this.getCredential(child.id);
      if (cred.easyLoginBadgeCode.toUpperCase() === cleanCode) {
        return {
          success: true,
          childProfileId: child.id,
          message: 'Nhận diện thẻ EasyLogin thành công!',
        };
      }
    }
    return {
      success: false,
      message: 'Không tìm thấy thẻ đọc sách hợp lệ trong danh sách hồ sơ của bạn.',
    };
  },
};
