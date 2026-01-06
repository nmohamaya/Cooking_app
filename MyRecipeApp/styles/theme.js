// Warm, elegant color palette for the MyRecipeApp
export const colors = {
  // Primary warm tones
  primaryWarm: '#D4845C',      // Warm terracotta
  primaryDark: '#A0694A',      // Darker terracotta
  primaryLight: '#E8B399',     // Light terracotta

  // Accent colors
  accentWarm: '#E89B6F',       // Warm accent
  accentDeep: '#8B5A3C',       // Deep brown
  accentSoft: '#F4D4BC',       // Soft peachy

  // Background colors
  bgPrimary: '#FEFCFB',        // Off-white/ivory
  bgSecondary: '#FFF5F0',      // Very light warm
  bgTertiary: '#F8E8DF',       // Soft warm background

  // Border colors
  borderLight: '#EDD5C4',      // Light warm border
  borderMid: '#D9C4B0',        // Mid warm border

  // Text colors
  textPrimary: '#2C2C2C',      // Almost black
  textSecondary: '#666666',    // Medium gray
  textTertiary: '#999999',     // Light gray
  textDisabled: '#CCCCCC',     // Disabled text

  // Success, Warning, Error
  success: '#6BA876',          // Soft green
  warning: '#E8B856',          // Warm yellow
  error: '#C85C5C',            // Soft red
  errorLight: '#F5DCDC',       // Light red background

  // Semantic colors
  divider: '#EDDDCE',          // Light divider
  overlay: 'rgba(0, 0, 0, 0.3)', // Semi-transparent overlay
  overlayWarm: 'rgba(212, 132, 92, 0.1)', // Warm overlay
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  h2: { fontSize: 24, fontWeight: '700', lineHeight: 30 },
  h3: { fontSize: 20, fontWeight: '700', lineHeight: 26 },
  h4: { fontSize: 18, fontWeight: '700', lineHeight: 24 },
  h5: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  body: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  bodySmall: { fontSize: 12, fontWeight: '400', lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '400', lineHeight: 16 },
};

export const borderRadius = {
  small: 6,
  medium: 12,
  large: 16,
  round: 50,
};

export const shadows = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  strong: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
};
