import type { Messages } from './types';

export const vi: Messages = {
  common: {
    loading: 'Đang tải…',
    error: 'Đã xảy ra lỗi',
    email: 'Email',
    password: 'Mật khẩu',
    signIn: 'Đăng nhập',
    signOut: 'Đăng xuất',
    on: 'bật',
    off: 'tắt',
    at: 'lúc',
    language: 'Ngôn ngữ',
    refresh: 'Làm mới',
    signInFailed: 'Đăng nhập thất bại',
  },
  login: {
    subtitle: 'Nhắc ăn chay âm lịch',
  },
  nav: {
    today: 'Hôm nay',
    settings: 'Cài đặt',
  },
  today: {
    title: 'Hôm nay',
    lunar: 'Âm',
    leapMonth: '(nhuận)',
    fasting: 'Hôm nay là ngày chay',
    notFasting: 'Hôm nay không phải ngày chay',
    loadError: 'Lỗi tải dữ liệu',
  },
  settings: {
    title: 'Lịch & nhắc',
    preset: 'Preset',
    slots: {
      EVE_BEFORE: 'Tối hôm trước',
      MORNING: 'Sáng trong ngày',
      FOLLOWUP: 'Nhắc lại',
    },
  },
};
