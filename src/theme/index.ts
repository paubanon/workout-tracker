export const Colors = {
  primary: '#007AFF', // iOS Blue, widely accepted acting as accent
  background: '#F2F2F7', // iOS System Gray 6 (Light)
  surface: '#FFFFFF',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#C6C6C8',
  danger: '#FF3B30',
  success: '#34C759',
  warning: '#FFCC00',
};

export const Spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

export const Typography = {
  title: {
    fontSize: 28,
    fontWeight: '700' as '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600' as '600',
    color: Colors.text,
  },
  body: {
    fontSize: 17, // Standard iOS body size
    color: Colors.text,
  },
  caption: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
};

export const Theme = {
  Colors,
  Spacing,
  Typography,
};
