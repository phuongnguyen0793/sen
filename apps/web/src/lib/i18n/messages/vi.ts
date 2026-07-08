import type { Messages } from './types';

export const vi: Messages = {
  common: {
    loading: 'Đang tải…',
    error: 'Đã xảy ra lỗi',
    requestFailed: 'Thất bại',
    email: 'Email',
    password: 'Mật khẩu',
    passwordHint: 'Mật khẩu (≥8 ký tự)',
    pleaseWait: 'Đang xử lý…',
    signIn: 'Đăng nhập',
    signUp: 'Đăng ký',
    signOut: 'Đăng xuất',
    on: 'bật',
    off: 'tắt',
    at: 'lúc',
    language: 'Ngôn ngữ',
    refresh: 'Làm mới',
  },
  landing: {
    tagline: 'Nhắc ăn chay đúng ngày âm — mùng 1, rằm, và ngày bạn chọn.',
    signIn: 'Đăng nhập',
    openWebApp: 'Mở ứng dụng web',
    footer: 'Nhắc ăn chay âm lịch — dành cho lịch Việt Nam.',
  },
  login: {
    titleSignIn: 'Đăng nhập',
    titleRegister: 'Tạo tài khoản',
    toggleToRegister: 'Chưa có tài khoản? Đăng ký',
    toggleToSignIn: 'Đã có tài khoản? Đăng nhập',
  },
  nav: {
    home: 'Trang chủ',
    today: 'Hôm nay',
    calendar: 'Lịch',
    reminders: 'Nhắc nhở',
  },
  today: {
    title: 'Hôm nay',
    lunar: 'Âm',
    leapMonth: '(nhuận)',
    fasting: 'Hôm nay là ngày chay',
    notFasting: 'Hôm nay không phải ngày chay',
    loadError: 'Lỗi tải dữ liệu',
  },
  calendar: {
    title: 'Lịch tháng',
    lunar: 'âm',
    today: '(hôm nay)',
  },
  reminders: {
    title: 'Nhắc nhở & lịch chay',
    currentPreset: 'Preset hiện tại',
    reminderTimes: 'Giờ nhắc',
    presets: {
      MUNG_1: 'Chỉ mùng 1',
      DAY_15: 'Chỉ rằm (15)',
      MUNG_1_AND_15: 'Mùng 1 và rằm',
    },
    slots: {
      EVE_BEFORE: 'Tối hôm trước',
      MORNING: 'Sáng trong ngày',
      FOLLOWUP: 'Nhắc lại',
    },
  },
  meta: {
    title: 'Sen — Nhắc ăn chay âm lịch',
    description: 'Mùng 1, rằm — không bao giờ quên. Nhắc nhở lịch âm và món chay.',
  },
};
