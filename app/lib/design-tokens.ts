/**
 * 🎨 DESIGN TOKENS 2025 - Современные эффекты и стили
 * Для создания красивых дизайнов с тенями, glassmorphism, neumorphism
 */

export const designTokens = {
  // 🌟 GLASSMORPHISM ЭФФЕКТЫ
  glassmorphism: {
    backdropBlur: {
      sm: 'backdrop-blur-sm',
      md: 'backdrop-blur-md',
      lg: 'backdrop-blur-lg',
      xl: 'backdrop-blur-xl',
    },
    backgroundOpacity: {
      light: 'bg-white/10',
      medium: 'bg-white/20',
      heavy: 'bg-white/30',
      dark: 'bg-black/10',
    },
    borderOpacity: {
      light: 'border-white/20',
      medium: 'border-white/30',
      heavy: 'border-white/40',
    }
  },

  // ✨ НЕОМОРФИЗМ (NEUMORPHISM)
  neumorphism: {
    light: {
      shadow: 'shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.9)]',
      hover: 'hover:shadow-[6px_6px_12px_rgba(0,0,0,0.15),-6px_-6px_12px_rgba(255,255,255,0.95)]',
    },
    dark: {
      shadow: 'shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.05)]',
      hover: 'hover:shadow-[6px_6px_12px_rgba(0,0,0,0.4),-6px_-6px_12px_rgba(255,255,255,0.1)]',
    }
  },

  // 🌈 СОВРЕМЕННЫЕ ТЕНИ 2025
  shadows: {
    soft: 'shadow-lg shadow-black/5',
    medium: 'shadow-xl shadow-black/10',
    strong: 'shadow-2xl shadow-black/15',
    colored: {
      purple: 'shadow-purple-500/20 shadow-xl',
      blue: 'shadow-blue-500/20 shadow-xl',
      pink: 'shadow-pink-500/20 shadow-xl',
      green: 'shadow-green-500/20 shadow-xl',
    },
    inner: 'shadow-inner shadow-black/10',
    glow: {
      purple: 'shadow-purple-400/50 shadow-2xl',
      blue: 'shadow-blue-400/50 shadow-2xl',
      pink: 'shadow-pink-400/50 shadow-2xl',
    }
  },

  // 🔄 СОВРЕМЕННЫЕ BORDER RADIUS
  borderRadius: {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full',
    modern: 'rounded-2xl', // Стандарт 2025
  },

  // 🎭 ГРАДИЕНТЫ 2025
  gradients: {
    primary: 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600',
    secondary: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600',
    accent: 'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600',
    sunset: 'bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600',
    ocean: 'bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-500',
    forest: 'bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500',
    mesh: 'bg-gradient-to-br from-purple-400 via-pink-500 to-red-500',
  },

  // ✨ МИКРО-ИНТЕРАКЦИИ
  interactions: {
    hover: {
      scale: 'hover:scale-105 transition-transform duration-200',
      lift: 'hover:-translate-y-1 transition-transform duration-200',
      glow: 'hover:shadow-lg hover:shadow-current/20 transition-shadow duration-200',
      rotate: 'hover:rotate-3 transition-transform duration-200',
    },
    tap: {
      scale: 'active:scale-95 transition-transform duration-75',
      press: 'active:translate-y-0.5 transition-transform duration-75',
    },
    focus: {
      ring: 'focus:ring-2 focus:ring-current focus:ring-offset-2 focus:ring-offset-white',
      glow: 'focus:shadow-lg focus:shadow-current/30',
    }
  },

  // 🎨 ЦВЕТОВЫЕ ТОКЕНЫ 2025
  colors: {
    primary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7c3aed',
      900: '#581c87',
    },
    accent: {
      50: '#fdf2f8',
      100: '#fce7f3',
      500: '#ec4899',
      600: '#db2777',
      700: '#be185d',
      900: '#831843',
    },
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      800: '#262626',
      900: '#171717',
    }
  },

  // 📐 ПРОПОРЦИИ И РАССТОЯНИЯ
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },

  // 🎯 АНИМАЦИИ
  animations: {
    fadeIn: 'animate-in fade-in duration-300',
    slideUp: 'animate-in slide-in-from-bottom-4 duration-300',
    scaleIn: 'animate-in zoom-in-95 duration-200',
    bounce: 'animate-bounce',
    pulse: 'animate-pulse',
    ping: 'animate-ping',
    spin: 'animate-spin',
  },

  // 🔤 ТИПОГРАФИКА
  typography: {
    heading: 'font-bold tracking-tight',
    body: 'font-normal leading-relaxed',
    caption: 'text-sm text-gray-600 dark:text-gray-400',
    mono: 'font-mono text-sm',
  }
};

/**
 * 🎯 ГОТОВЫЕ КОМПОНЕНТЫ СТИЛЕЙ
 */
export const componentStyles = {
  // Красивая кнопка 2025
  button2025: `
    ${designTokens.borderRadius.modern}
    ${designTokens.shadows.medium}
    ${designTokens.gradients.primary}
    ${designTokens.interactions.hover.scale}
    ${designTokens.interactions.tap.scale}
    text-white font-semibold px-6 py-3
    transition-all duration-200
    hover:shadow-purple-500/25
    active:shadow-inner
  `,

  // Glassmorphism карточка
  glassCard: `
    ${designTokens.glassmorphism.backdropBlur.md}
    ${designTokens.glassmorphism.backgroundOpacity.medium}
    ${designTokens.glassmorphism.borderOpacity.light}
    ${designTokens.borderRadius.xl}
    ${designTokens.shadows.soft}
    border backdrop-blur-md
    transition-all duration-300
    hover:backdrop-blur-lg
  `,

  // Neumorphism элемент
  neuElement: `
    ${designTokens.borderRadius.lg}
    ${designTokens.neumorphism.light.shadow}
    ${designTokens.interactions.hover.lift}
    bg-gray-50 dark:bg-gray-800
    transition-all duration-200
  `,

  // Современная форма ввода
  modernInput: `
    ${designTokens.borderRadius.lg}
    ${designTokens.shadows.inner}
    bg-white/50 dark:bg-gray-800/50
    backdrop-blur-sm
    border border-gray-200/50 dark:border-gray-700/50
    focus:border-purple-500/50
    focus:ring-2 focus:ring-purple-500/20
    transition-all duration-200
  `,
};

/**
 * 🎨 ФУНКЦИИ ДЛЯ ДИНАМИЧЕСКОГО ГЕНЕРИРОВАНИЯ СТИЛЕЙ
 */
export const generateStyles = {
  // Генератор градиентов
  gradient: (colors: string[], direction: 'to-r' | 'to-br' | 'to-b' = 'to-r') =>
    `bg-gradient-${direction} from-${colors.join(' via-')} to-${colors[colors.length - 1]}`,

  // Генератор теней с цветом
  coloredShadow: (color: string, intensity: number = 20) =>
    `shadow-xl shadow-${color}-500/${intensity}`,

  // Генератор glassmorphism
  glass: (opacity: 'light' | 'medium' | 'heavy' = 'medium') =>
    `${designTokens.glassmorphism.backdropBlur.md} ${designTokens.glassmorphism.backgroundOpacity[opacity]} ${designTokens.glassmorphism.borderOpacity.light} backdrop-blur-md border`,
};

export default designTokens;


