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

  // Extended colors (previously hardcoded)
  secondary: '#FF9500', // Orange for charts/secondary data
  placeholderText: '#C7C7CC', // Input placeholder text
  successBackground: '#E8FAE8', // Completed item background
  inputBackground: '#E5E5EA', // Input field backgrounds
  gridLine: '#E0E0E0', // Chart grid lines
  switchTrackOff: '#767577', // Switch track when off
  switchThumb: '#f4f3f4', // Switch thumb color
};

// Layout constants (previously magic numbers)
export const Layout = {
  longPressDelay: 750,
  keyboardPaddingOffset: 220,
  keyboardExtraMargin: 100,
  rpeButtonSize: 40,
  paginationLimit: 20,
  exportLimit: 1000,
  batchSize: 50,
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
  Layout,
};
