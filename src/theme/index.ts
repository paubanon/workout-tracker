export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  bgDark: string;
  bg: string;
  bgLight: string;
  text: string;
  textMuted: string;
  border: string;
  shadowS: string;
  shadowM: string;
  shadowL: string;
  surface: string; // Alias for bg
  background: string; // Alias for bgDark
  danger: string;
  success: string;
  warning: string;
}

export const DarkColors: ThemeColors = {
  primary: '#65D984', // Vibrant Green
  bgDark: '#1C1C1E',  // Base - lightened for shadow visibility
  bg: '#2C2C2E',      // Card - darker for contrast
  bgLight: '#3A3A3C', // Elevated/Input - even darker
  text: '#F2F2F7',    // ~95% White
  textMuted: '#AEAEB2', // ~70% White
  border: 'rgba(255,255,255, 0.1)',
  shadowS: '0px 1px 2px rgba(0,0,0,0.3)',
  shadowM: '0px 4px 8px rgba(0,0,0,0.4)',
  shadowL: '0px 8px 16px rgba(0,0,0,0.5)',

  // Aliases/Standard Palette
  surface: '#2C2C2E',
  background: '#1C1C1E',
  danger: '#FF453A',
  success: '#32D74B',
  warning: '#FFD60A',
};

export const LightColors: ThemeColors = {
  primary: '#007AFF', // System Blue
  bgDark: '#F2F2F7',  // iOS System Gray 6 - Page Base
  bg: '#FFFFFF',      // Card
  bgLight: '#FFFFFF', // Elevated - relies on shadow
  text: '#000000',
  textMuted: '#6C6C70',
  border: 'rgba(0,0,0, 0.1)',
  shadowS: '0px 1px 2px rgba(0,0,0,0.05)',
  shadowM: '0px 4px 6px rgba(0,0,0,0.08)',
  shadowL: '0px 10px 15px rgba(0,0,0,0.1)',

  // Aliases/Standard Palette
  surface: '#FFFFFF',
  background: '#F2F2F7',
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
  scale: {
    sm: 16,
    md: 18,
    lg: 20,
    xl: 24,
  },
  weight: {
    regular: '400' as '400',
    medium: '500' as '500',
    semibold: '600' as '600',
    bold: '700' as '700',
  },
  // Heading hierarchy
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  // Existing presets
  header: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  // Section headers (uppercase labels)
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  strokeWidth: 2,
};

export const BorderRadius = {
  sm: 8,
  m: 12,
  l: 20,
};

// React Native Shadow Styles
export const Shadows = {
  light: {
    s: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    m: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4,
    },
    l: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 15,
      elevation: 8,
    }
  },
  dark: {
    s: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 2,
    },
    m: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 4,
    },
    l: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 8,
    }
  }
};

// Dark theme depth - directional lighting simulation
// Top: Brighter border to simulate light hitting from above
// Bottom: Black shadow casting downward for depth (increased intensity)
export const TopLight = {
  s: {
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.20)',
    borderLeftColor: 'rgba(255,255,255,0.08)',
    borderRightColor: 'rgba(255,255,255,0.08)',
    borderBottomColor: 'rgba(255,255,255,0.04)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 6,
  },
  m: {
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.30)',
    borderLeftColor: 'rgba(255,255,255,0.12)',
    borderRightColor: 'rgba(255,255,255,0.12)',
    borderBottomColor: 'rgba(255,255,255,0.05)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 10,
  },
  l: {
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.40)',
    borderLeftColor: 'rgba(255,255,255,0.15)',
    borderRightColor: 'rgba(255,255,255,0.15)',
    borderBottomColor: 'rgba(255,255,255,0.06)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.9,
    shadowRadius: 24,
    elevation: 14,
  }
};

export const Theme = {
  Colors: DarkColors, // Default export for backwards compat initially, but should use Context
  LightColors,
  DarkColors,
  Spacing,
  Typography,
  BorderRadius,
  Shadows,
  TopLight
};
