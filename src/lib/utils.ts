
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCPF = (value: string) => {
  if (!value) return "";
  const onlyDigits = value.replace(/\D/g, '');
  
  if (onlyDigits.length <= 3) return onlyDigits;
  if (onlyDigits.length <= 6) return `${onlyDigits.slice(0, 3)}.${onlyDigits.slice(3)}`;
  if (onlyDigits.length <= 9) return `${onlyDigits.slice(0, 3)}.${onlyDigits.slice(3, 6)}.${onlyDigits.slice(6)}`;
  return `${onlyDigits.slice(0, 3)}.${onlyDigits.slice(3, 6)}.${onlyDigits.slice(6, 9)}-${onlyDigits.slice(9, 11)}`;
};

export const formatCNPJ = (value: string) => {
  if (!value) return "";
  value = value.replace(/\D/g, ''); 
  value = value.replace(/^(\d{2})(\d)/, '$1.$2');
  value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
  value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
  value = value.replace(/(\d{4})(\d)/, '$1-$2');
  return value.slice(0, 18); 
};

export const formatPhone = (value: string) => {
  if (!value) return "";
  value = value.replace(/\D/g, '');
  value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
  value = value.replace(/(\d{5})(\d)/, '$1-$2');
  return value.slice(0, 15);
};
