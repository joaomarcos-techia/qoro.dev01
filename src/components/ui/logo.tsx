'use client';
import Image from 'next/image';

interface LogoProps {
  height?: number;
}

export function Logo({ height = 32 }: LogoProps) {
  const width = (height / 32) * 120; // Adjusted aspect ratio

  return (
    <div 
      className="relative" 
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <Image
        src="https://firebasestorage.googleapis.com/v0/b/qoro-iy1gs.appspot.com/o/logo_definitiva-removebg-preview.png?alt=media&token=a6de67b0-f90f-41a1-885f-a5ab5df437ac"
        alt="Qoro Logo"
        width={width}
        height={height}
        priority
      />
    </div>
  );
}
