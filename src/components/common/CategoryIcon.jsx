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
} from 'lucide-react';

const ICON_MAP = {
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
};

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
