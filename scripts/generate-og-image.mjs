import sharp from "sharp";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// Read the logo SVG
const logoSvg = readFileSync(resolve(root, "public/logo-qoro.svg"), "utf-8");

// Scale the logo to fit nicely (original is 2407x870)
const logoWidth = 360;
const logoHeight = Math.round(870 * (logoWidth / 2407)); // ~130px

const WIDTH = 1200;
const HEIGHT = 630;

// Create the full OG image as SVG
const ogSvg = `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background gradient -->
    <radialGradient id="bgGlow" cx="50%" cy="45%" r="60%" fx="50%" fy="45%">
      <stop offset="0%" stop-color="#1a1035" />
      <stop offset="40%" stop-color="#110d20" />
      <stop offset="100%" stop-color="#0a0a12" />
    </radialGradient>

    <!-- Purple accent glow -->
    <radialGradient id="purpleGlow" cx="50%" cy="40%" r="35%">
      <stop offset="0%" stop-color="rgba(139,92,246,0.15)" />
      <stop offset="100%" stop-color="rgba(139,92,246,0)" />
    </radialGradient>

    <!-- Subtle top accent line -->
    <linearGradient id="accentLine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(139,92,246,0)" />
      <stop offset="30%" stop-color="rgba(139,92,246,0.6)" />
      <stop offset="50%" stop-color="rgba(204,46,173,0.5)" />
      <stop offset="70%" stop-color="rgba(139,92,246,0.6)" />
      <stop offset="100%" stop-color="rgba(139,92,246,0)" />
    </linearGradient>

    <!-- Bottom badge gradient -->
    <linearGradient id="badgeBg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(139,92,246,0.12)" />
      <stop offset="100%" stop-color="rgba(204,46,173,0.08)" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#0a0a12" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGlow)" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#purpleGlow)" />

  <!-- Top accent line -->
  <rect x="0" y="0" width="${WIDTH}" height="3" fill="url(#accentLine)" />

  <!-- Subtle grid pattern -->
  <g opacity="0.03">
    ${Array.from({ length: 20 }, (_, i) => `<line x1="${i * 60}" y1="0" x2="${i * 60}" y2="${HEIGHT}" stroke="white" stroke-width="0.5"/>`).join("\n    ")}
    ${Array.from({ length: 11 }, (_, i) => `<line x1="0" y1="${i * 60}" x2="${WIDTH}" y2="${i * 60}" stroke="white" stroke-width="0.5"/>`).join("\n    ")}
  </g>

  <!-- Logo -->
  <g transform="translate(${(WIDTH - logoWidth) / 2}, 140) scale(${logoWidth / 2407})">
    ${logoSvg.replace(/<\/?svg[^>]*>/g, "").replace(/<\?xml[^>]*>/g, "")}
  </g>

  <!-- Tagline -->
  <text x="${WIDTH / 2}" y="340" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="32" font-weight="600" fill="white" letter-spacing="-0.5">
    Gestão Clínica com IA no WhatsApp
  </text>

  <!-- Sub-tagline -->
  <text x="${WIDTH / 2}" y="385" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="18" fill="rgba(255,255,255,0.5)" letter-spacing="0.2">
    Agendamento automático 24h · Prontuário digital · Gestão financeira
  </text>

  <!-- Feature badges -->
  <g transform="translate(${WIDTH / 2}, 460)">
    <!-- Badge 1: Setup 72h -->
    <g transform="translate(-260, 0)">
      <rect x="-75" y="-18" width="150" height="36" rx="18" fill="rgba(139,92,246,0.12)" stroke="rgba(139,92,246,0.25)" stroke-width="1"/>
      <text x="0" y="5" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="500" fill="rgba(167,139,250,0.9)">Setup em 72h</text>
    </g>

    <!-- Badge 2: 15+ Clinicas -->
    <g transform="translate(-85, 0)">
      <rect x="-75" y="-18" width="150" height="36" rx="18" fill="rgba(16,185,129,0.1)" stroke="rgba(16,185,129,0.25)" stroke-width="1"/>
      <text x="0" y="5" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="500" fill="rgba(52,211,153,0.9)">15+ clínicas ativas</text>
    </g>

    <!-- Badge 3: LGPD -->
    <g transform="translate(85, 0)">
      <rect x="-75" y="-18" width="150" height="36" rx="18" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.25)" stroke-width="1"/>
      <text x="0" y="5" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="500" fill="rgba(96,165,250,0.9)">LGPD Compliance</text>
    </g>

    <!-- Badge 4: NPS 92 -->
    <g transform="translate(260, 0)">
      <rect x="-75" y="-18" width="150" height="36" rx="18" fill="rgba(245,83,63,0.1)" stroke="rgba(245,83,63,0.25)" stroke-width="1"/>
      <text x="0" y="5" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="500" fill="rgba(248,113,95,0.9)">NPS 92 · Nota 4.9</text>
    </g>
  </g>

  <!-- Website URL -->
  <text x="${WIDTH / 2}" y="550" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" fill="rgba(255,255,255,0.3)" letter-spacing="2">
    qoro.dev
  </text>

  <!-- Subtle vignette -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGlow)" opacity="0.3" />

  <!-- Bottom accent line -->
  <rect x="0" y="${HEIGHT - 3}" width="${WIDTH}" height="3" fill="url(#accentLine)" opacity="0.5" />
</svg>`;

// Generate PNG
await sharp(Buffer.from(ogSvg))
  .resize(WIDTH, HEIGHT)
  .png({ quality: 95, compressionLevel: 6 })
  .toFile(resolve(root, "public/og-image.png"));

console.log("OG image generated: public/og-image.png (1200x630)");
