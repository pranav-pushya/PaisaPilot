import React from 'react';
import {
  Utensils,
  ShoppingCart,
  Car,
  Home,
  ShoppingBag,
  Film,
  HeartPulse,
  Smile,
  Briefcase,
  TrendingUp,
  Laptop,
  Tag,
  CreditCard,
  Smartphone,
  Banknote,
  Building,
  Dumbbell,
  Plane,
  BookOpen,
  Coffee,
  Music,
  Gift,
  GraduationCap,
  PawPrint,
  Gamepad2,
  Fuel,
  Tv,
  Shield,
  Zap,
  Heart,
  Sparkles,
  Wallet,
  Store,
  Bus,
  Wrench
} from 'lucide-react';

export const ICON_MAP = {
  Utensils,
  ShoppingCart,
  Car,
  Home,
  ShoppingBag,
  Film,
  HeartPulse,
  Smile,
  Briefcase,
  TrendingUp,
  Laptop,
  Tag,
  CreditCard,
  Smartphone,
  Banknote,
  Building,
  Dumbbell,
  Plane,
  BookOpen,
  Coffee,
  Music,
  Gift,
  GraduationCap,
  PawPrint,
  Gamepad2,
  Fuel,
  Tv,
  Shield,
  Zap,
  Heart,
  Sparkles,
  Wallet,
  Store,
  Bus,
  Wrench,
};

export const AVAILABLE_CATEGORY_ICONS = [
  'Utensils',
  'ShoppingCart',
  'Car',
  'Home',
  'ShoppingBag',
  'Film',
  'HeartPulse',
  'Smile',
  'Briefcase',
  'TrendingUp',
  'Laptop',
  'Dumbbell',
  'Plane',
  'BookOpen',
  'Coffee',
  'Music',
  'Gift',
  'GraduationCap',
  'PawPrint',
  'Gamepad2',
  'Fuel',
  'Tv',
  'Zap',
  'Tag',
];

export const AVAILABLE_CATEGORY_COLORS = [
  '#f97316', // Orange
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#84cc16', // Lime
  '#6366f1', // Indigo
];

export const CategoryIcon = ({ iconName, className = 'w-5 h-5', style }) => {
  const IconComponent = ICON_MAP[iconName] || Tag;
  return <IconComponent className={className} style={style} />;
};

export const PaymentModeIcon = ({ mode, className = 'w-4 h-4' }) => {
  switch (mode) {
    case 'UPI':
      return <Smartphone className={`${className} text-emerald-500`} />;
    case 'Credit Card':
      return <CreditCard className={`${className} text-indigo-500`} />;
    case 'Debit Card':
      return <CreditCard className={`${className} text-blue-500`} />;
    case 'Cash':
      return <Banknote className={`${className} text-amber-500`} />;
    case 'Net Banking':
      return <Building className={`${className} text-purple-500`} />;
    default:
      return <Tag className={className} />;
  }
};
