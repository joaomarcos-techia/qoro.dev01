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
        src="https://firebasestorage.googleapis.com/v0/b/qoro-iy1gs.firebasestorage.app/o/logo_definitiva-removebg-preview.png?alt=media&token=a6de67b0-f90f-41a1-885f-a5ab5df437ac"
        alt="Qoro Logo"
        fill
        className="object-contain"
        sizes={`${width}px`}
        priority
      />
    </div>
  );
}
