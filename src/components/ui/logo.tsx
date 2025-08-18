
'use client';
import Image from 'next/image';

interface LogoProps {
  height?: number;
}

export function Logo({ height = 32 }: LogoProps) {
  // Calculate width based on a 102:32 aspect ratio of the SVG
  const width = (height / 32) * 102;

  return (
    <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
      <Image
        src="/logo.svg"
        alt="Qoro Logo"
        width={width}
        height={height}
        priority
      />
    </div>
  );
}
