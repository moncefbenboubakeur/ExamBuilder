/**
 * Centralized theme configuration for ExamBuilder.net
 * Typeform-inspired design system with modern, professional aesthetics
 */

export const theme = {
  colors: {
    // Primary brand colors
    primary: {
      50: 'indigo-50',
      100: 'indigo-100',
      500: 'indigo-500',
      600: 'indigo-600',
      700: 'indigo-700',
    },
    // Accent colors
    accent: {
      400: 'sky-400',
      500: 'sky-500',
      600: 'sky-600',
    },
    // Neutral palette
    neutral: {
      50: 'neutral-50',
      100: 'neutral-100',
      200: 'neutral-200',
      300: 'neutral-300',
      600: 'neutral-600',
      700: 'neutral-700',
      800: 'neutral-800',
      900: 'neutral-900',
    },
    // Semantic colors
    success: {
      50: 'green-50',
      500: 'green-500',
      600: 'green-600',
    },
    error: {
      50: 'red-50',
      500: 'red-500',
      600: 'red-600',
    },
    warning: {
      50: 'yellow-50',
      500: 'yellow-500',
      600: 'yellow-600',
    },
  },

  typography: {
    // Font families
    fonts: {
      sans: 'font-sans', // Inter via Geist
      mono: 'font-mono',
    },
    // Font sizes
    sizes: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl',
    },
    // Font weights
    weights: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
  },

  spacing: {
    // Common spacing values
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
    '2xl': '4rem',
  },

  borderRadius: {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    full: 'rounded-full',
  },

  shadows: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  },

  // Component-specific styles
  components: {
    button: {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
      secondary: 'bg-white text-neutral-700 border-2 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50',
      ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500',
      sizes: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-5 py-2.5 text-base',
        lg: 'px-6 py-3 text-lg',
      },
    },
    card: {
      base: 'bg-white border border-neutral-200 rounded-xl shadow-sm',
      hover: 'hover:shadow-md transition-shadow duration-200',
      interactive: 'cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all duration-200',
    },
    input: {
      base: 'w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
      error: 'border-red-500 focus:ring-red-500',
    },
  },

  // Responsive breakpoints (for reference)
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Animation presets
  animations: {
    transition: 'transition-all duration-200 ease-in-out',
    fadeIn: 'animate-fadeIn',
    slideIn: 'animate-slideIn',
  },
} as const;

// Helper function to combine theme classes
export function getButtonClass(variant: keyof typeof theme.components.button, size: 'sm' | 'md' | 'lg' = 'md') {
  const variantClass = theme.components.button[variant];
  const sizeClass = theme.components.button.sizes[size];
  return `${variantClass} ${sizeClass} rounded-2xl font-medium transition-all duration-200`;
}

export function getCardClass(interactive: boolean = false) {
  return interactive
    ? `${theme.components.card.base} ${theme.components.card.interactive}`
    : `${theme.components.card.base} ${theme.components.card.hover}`;
}
