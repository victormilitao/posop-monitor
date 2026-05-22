/**
 * Centralized color palette for the app.
 * Must match the Tailwind config in tailwind.config.js.
 * Always import from here instead of hardcoding hex values.
 */

export const AppColors = {
  primary: {
    50: '#E8EDF3',
    100: '#C5D3E5',
    200: '#9AB4D1',
    300: '#6F95BD',
    400: '#4F7DAD',
    500: '#2F659D',
    600: '#275590',
    700: '#1B3A5C',
    800: '#142D47',
    900: '#0D1F33',
  },
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#E6E8ED',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  success: {
    light: '#ECFDF5',
    DEFAULT: '#10B981',
    dark: '#065F46',
  },
  error: {
    light: '#FEF2F2',
    DEFAULT: '#EF4444',
    dark: '#991B1B',
  },
  warning: {
    light: '#FFFBEB',
    DEFAULT: '#F59E0B',
    dark: '#92400E',
  },
  info: {
    light: '#EFF6FF',
    DEFAULT: '#3B82F6',
    dark: '#1E40AF',
  },
} as const;
