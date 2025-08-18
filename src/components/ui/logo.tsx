
'use client';

import Image from 'next/image';

interface LogoProps {
  width?: number;
  height?: number;
}

export function Logo({ width = 120, height = 32 }: LogoProps) {
  return (
    <Image
      src="https://storage.googleapis.com/qoro-iy1gs.appspot.com/qoro-logo.png"
      alt="Qoro Logo"
      width={width}
      height={height}
      priority
    />
  );
}
