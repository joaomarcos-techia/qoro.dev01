'use client';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  height?: number;
}

export function Logo({ className, height = 24 }: LogoProps) {
  const aspectRatio = 100 / 40; 
  const width = height * aspectRatio;

  return (
      <Image
        src="https://firebasestorage.googleapis.com/v0/b/qoro-iy1gs.firebasestorage.app/o/logo_definitiva-removebg-preview.png?alt=media&token=a6de67b0-f90f-41a1-885f-a5ab5df437ac"
        alt="Qoro Logo"
        width={width}
        height={height}
        className={className}
        style={{ height: 'auto', width: `${width}px` }}
        priority
      />
  );
}
