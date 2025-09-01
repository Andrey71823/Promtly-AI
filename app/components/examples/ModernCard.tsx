/**
 * 🎨 ПРИМЕР СОВРЕМЕННОГО КОМПОНЕНТА 2025
 * Демонстрирует glassmorphism, neumorphism, современные тени и анимации
 */

import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { createStyle, designTokens, cn } from '~/utils/design-utils';

interface ModernCardProps {
  title: string;
  description: string;
  icon: string;
  variant?: 'glass' | 'neu' | 'elevated';
  gradient?: keyof typeof designTokens.gradients;
}

export const ModernCard = ({
  title,
  description,
  icon,
  variant = 'glass',
  gradient = 'primary'
}: ModernCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      className={cn(
        // Базовые стили
        'relative overflow-hidden rounded-2xl p-6',
        'transition-all duration-300 ease-out',
        'cursor-pointer group',

        // Варианты стилей
        variant === 'glass' && createStyle.glass('medium'),
        variant === 'neu' && createStyle.neu('light'),
        variant === 'elevated' && 'bg-white dark:bg-gray-800 shadow-xl hover:shadow-2xl',

        // Современные эффекты
        'hover:scale-[1.02] active:scale-[0.98]',
        'before:absolute before:inset-0 before:bg-gradient-to-r',
        `before:from-transparent before:via-white/5 before:to-transparent`,
        'before:translate-x-[-100%] hover:before:translate-x-[100%]',
        'before:transition-transform before:duration-700'
      )}
    >
      {/* Фоновый градиент */}
      <div className={cn(
        'absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300',
        designTokens.gradients[gradient]
      )} />

      {/* Контент */}
      <div className="relative z-10">
        {/* Иконка с анимацией */}
        <motion.div
          whileHover={{ rotate: 15, scale: 1.1 }}
          transition={{ duration: 0.2 }}
          className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 mb-4"
        >
          <Icon icon={icon} className="w-6 h-6 text-white" />
        </motion.div>

        {/* Заголовок */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
          {title}
        </h3>

        {/* Описание */}
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          {description}
        </p>

        {/* Декоративный элемент */}
        <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity">
          <Icon icon="mdi:sparkles" className="w-8 h-8 text-purple-500" />
        </div>
      </div>

      {/* Hover эффекты */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
};

/**
 * 🎯 ПРИМЕР ИСПОЛЬЗОВАНИЯ:
 *
 * import { ModernCard } from '~/components/examples/ModernCard';
 *
 * <ModernCard
 *   title="Glassmorphism Design"
 *   description="Beautiful backdrop blur effects with modern gradients"
 *   icon="mdi:blur"
 *   variant="glass"
 *   gradient="primary"
 * />
 */


