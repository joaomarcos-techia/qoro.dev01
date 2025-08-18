
'use client';
import Image from 'next/image';

interface LogoProps {
  height?: number;
}

export function Logo({ height = 32 }: LogoProps) {
  // A proporção da imagem original é aproximadamente 3.75:1 (largura:altura)
  const width = height * 3.75; 

  return (
    <Image
      src="https://firebasestorage.googleapis.com/v0/b/qoro-iy1gs.firebasestorage.app/o/logo_definitiva-removebg-preview.png?alt=media&token=a6de67b0-f90f-41a1-885f-a5ab5df437ac"
      alt="Qoro Logo"
      width={width}
      height={height}
      priority
    />
  );
}
