'use client';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  height?: number;
  className?: string;
}

export function Logo({ height = 24, className }: LogoProps) {
  const width = height * 2.5; // Maintain aspect ratio

  return (
    <div className={cn('relative', className)} style={{ height: `${height}px`, width: `${width}px`}}>
      <Image
        src="https://raw.githubusercontent.com/joaomarcos-techia/qoro.dev01/main/public/logo_definitiva-removebg-preview.png"
        alt="Qoro Logo"
        fill
        className="object-contain"
        sizes={`${width}px`}
        priority
      />
    </div>
  );
}
