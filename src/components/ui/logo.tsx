'use client';

import Image from 'next/image';

interface LogoProps {
  width?: number;
  height?: number;
}

export function Logo({ width = 120, height = 32 }: LogoProps) {
  return (
    <Image
      src="https://firebasestorage.googleapis.com/v0/b/qoro-iy1gs.appspot.com/o/qoro-logo.png?alt=media&token=425a8155-c543-4340-a1f7-e722c83675a8"
      alt="Qoro Logo"
      width={width}
      height={height}
      priority
    />
  );
}
