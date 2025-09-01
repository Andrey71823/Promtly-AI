/**
 * 🎨 DESIGN UTILITIES 2025
 * Утилиты для работы с современными дизайн токенами
 */

import { designTokens, componentStyles } from '~/lib/design-tokens';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: (string | undefined | null | false)[]) => {
  return twMerge(clsx(inputs));
};

/**
 * 🎯 ГЕНЕРАЦИЯ СТИЛЕЙ ПО ТОКЕНАМ
 */
export const createStyle = {
  // Glassmorphism эффекты
  glass: (variant: 'light' | 'medium' | 'heavy' = 'medium') => {
    return cn(
      designTokens.glassmorphism.backdropBlur.md,
      designTokens.glassmorphism.backgroundOpacity[variant],
      designTokens.glassmorphism.borderOpacity.light,
      'backdrop-blur-md border'
    );
  },

  // Neumorphism эффекты
  neu: (theme: 'light' | 'dark' = 'light') => {
    return cn(
      designTokens.borderRadius.lg,
      designTokens.neumorphism[theme].shadow,
      designTokens.interactions.hover.lift,
      theme === 'light' ? 'bg-gray-50' : 'bg-gray-800',
      'transition-all duration-200'
    );
  },

  // Современные тени
  shadow: (type: 'soft' | 'medium' | 'strong' | 'colored', color?: string) => {
    if (type === 'colored' && color) {
      return designTokens.shadows.colored[color as keyof typeof designTokens.shadows.colored] || designTokens.shadows.medium;
    }
    return designTokens.shadows[type];
  },

  // Градиенты
  gradient: (type: keyof typeof designTokens.gradients) => {
    return designTokens.gradients[type];
  },

  // Современные кнопки
  button: (variant: 'primary' | 'secondary' | 'glass' | 'neu' = 'primary') => {
    const base = cn(
      designTokens.borderRadius.modern,
      designTokens.interactions.hover.scale,
      designTokens.interactions.tap.scale,
      'font-semibold px-6 py-3 transition-all duration-200'
    );

    switch (variant) {
      case 'primary':
        return cn(base, designTokens.gradients.primary, designTokens.shadows.medium, 'text-white hover:shadow-purple-500/25');
      case 'secondary':
        return cn(base, 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700');
      case 'glass':
        return cn(base, createStyle.glass(), 'text-gray-900 dark:text-white');
      case 'neu':
        return cn(base, createStyle.neu(), 'text-gray-900 dark:text-white');
      default:
        return base;
    }
  },

  // Современные карточки
  card: (variant: 'default' | 'glass' | 'neu' | 'elevated' = 'default') => {
    const base = cn(
      designTokens.borderRadius.xl,
      'p-6 transition-all duration-300'
    );

    switch (variant) {
      case 'default':
        return cn(base, 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700');
      case 'glass':
        return cn(base, createStyle.glass());
      case 'neu':
        return cn(base, createStyle.neu());
      case 'elevated':
        return cn(base, 'bg-white dark:bg-gray-800', designTokens.shadows.strong, 'hover:shadow-2xl');
      default:
        return base;
    }
  },

  // Современные инпуты
  input: (variant: 'default' | 'glass' | 'neu' = 'default') => {
    const base = cn(
      designTokens.borderRadius.lg,
      'px-4 py-3 transition-all duration-200',
      'focus:outline-none focus:ring-2'
    );

    switch (variant) {
      case 'default':
        return cn(base, 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20');
      case 'glass':
        return cn(base, createStyle.glass(), 'focus:ring-purple-500/30');
      case 'neu':
        return cn(base, createStyle.neu(), 'focus:ring-purple-500/30');
      default:
        return base;
    }
  }
};

/**
 * 🎨 ПРЕСЕТЫ ДИЗАЙНА 2025
 */
export const designPresets = {
  // Темная тема с glassmorphism
  darkGlass: {
    background: 'bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900',
    card: createStyle.card('glass'),
    button: createStyle.button('primary'),
    input: createStyle.input('glass'),
  },

  // Светлая тема с neumorphism
  lightNeu: {
    background: 'bg-gradient-to-br from-gray-50 to-gray-100',
    card: createStyle.card('neu'),
    button: createStyle.button('primary'),
    input: createStyle.input('neu'),
  },

  // Современная градиентная тема
  gradientModern: {
    background: designTokens.gradients.primary,
    card: createStyle.card('elevated'),
    button: createStyle.button('secondary'),
    input: createStyle.input('default'),
  },

  // Минималистичная тема
  minimal: {
    background: 'bg-white dark:bg-gray-900',
    card: createStyle.card('default'),
    button: createStyle.button('primary'),
    input: createStyle.input('default'),
  }
};

/**
 * 🔧 УТИЛИТЫ ДЛЯ АНИМАЦИЙ
 */
export const animationUtils = {
  // Плавное появление
  fadeIn: (delay: number = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay }
  }),

  // Масштабирование при наведении
  hoverScale: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: { duration: 0.2 }
  },

  // Плавный подъем
  lift: {
    whileHover: { y: -4 },
    transition: { duration: 0.2 }
  }
};

export default {
  cn,
  createStyle,
  designPresets,
  animationUtils
};


