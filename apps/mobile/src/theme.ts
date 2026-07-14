/** Lotus Pond design tokens — keep aligned with apps/web globals.css. */
export const colors = {
  jade950: '#0c2a22',
  jade900: '#134033',
  jade800: '#1a5443',
  jade700: '#216b55',
  jade600: '#2a8769',
  jade500: '#3a9d7c',
  mist: '#e8f1ed',
  mistDeep: '#d4e5dc',
  foam: '#f7fbf9',
  paper: '#ffffff',
  ink: '#122820',
  inkSoft: '#3d564c',
  muted: '#5f746a',
  line: 'rgba(18, 40, 32, 0.1)',
  lineStrong: 'rgba(18, 40, 32, 0.16)',
  danger: '#b42318',
  white: '#ffffff',
} as const;

export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayRegular: 'Fraunces_500Medium',
  body: 'Outfit_400Regular',
  bodyMedium: 'Outfit_500Medium',
  bodySemi: 'Outfit_600SemiBold',
  bodyBold: 'Outfit_700Bold',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 22,
  pill: 999,
} as const;
