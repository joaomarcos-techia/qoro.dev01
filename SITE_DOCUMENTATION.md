# NovaVest Landing Page - Documentacao Completa

## Stack Tecnica
- React 19.2.4 + TypeScript
- Vite 8.0.0
- Tailwind CSS v4.2.1 (config via `@theme` no CSS, sem `tailwind.config.js`)
- Framer Motion 12.36.0
- @tabler/icons-react
- lucide-react
- clsx + tailwind-merge (utility `cn()`)

## Tema & Design Tokens (index.css)
- Tema unico: **dark mode**
- Background: `hsl(260 87% 3%)` (roxo muito escuro, quase preto)
- Foreground: `hsl(40 6% 95%)` (branco quente)
- Primary/Accent: `hsl(262 83% 58%)` (roxo vibrante)
- Card: `hsl(240 6% 9%)`
- Muted: `hsl(240 4% 16%)`
- Border: `hsl(240 4% 20%)`
- Fontes: Poppins, Manrope, Inter, Geist Sans (Google Fonts via `<link>` no index.html)
- Utility CSS: `.liquid-glass` (glassmorphism com gradient border, blur, luminosity blend)
- Animacao: `marquee` (translateX 0% -> -50%, 20s linear infinite)

---

## Estrutura de Componentes (ordem de renderizacao)

### 1. Navbar (`src/components/Navbar.tsx`)
**Posicao:** Fixed no topo, z-50, centralizado horizontalmente.

**Estado 1 (topo, sem scroll):**
- Fundo transparente
- Largura maxima: 1280px
- Sem bordas, sem sombra, sem blur
- Margin-top: 12px

**Estado 2 (scroll > 50px):**
- Fundo: `rgba(255, 255, 255, 0.06)` (glassmorphism)
- Largura maxima: 1100px
- Border-radius: 12px
- Borda: 1px `rgba(255, 255, 255, 0.1)`
- Sombra: `0 8px 32px rgba(0, 0, 0, 0.4)` + inset highlight
- Backdrop-filter: `blur(20px) saturate(1.4)`
- Margin-top: 12px

**Transicao:** Framer Motion `animate`, 0.4s easeInOut.

**Altura fixa:** 56px em ambos os estados.

**Conteudo:**
- **Logo:** Icone SVG camera (20x18) + texto "Qoro" (Poppins SemiBold 15px, branco)
- **Links:** "How It Works", "Investment Plans", "Pricing", "Documentation" (Poppins Medium 14px, branco, gap 32px, hidden em mobile)
- **Botao CTA:** "Get started" (Inter SemiBold 14px, texto #171719, fundo #FAFAFA, borda sutil, rounded-full, altura 36px, padding horizontal 20px)

**Hook:** `useScrolled(50)` — retorna boolean quando `window.scrollY > 50`.

---

### 2. Hero Section (`src/App.tsx` — section wrapper)
**Layout:** Flex column, centralizado, padding top 112px (pt-28), padding bottom 8px.

#### 2a. HeroBadge (`src/components/HeroBadge.tsx`)
- **Container:** Pill (`rounded-full`), `bg-white/30`, padding 6px 12px
- **Icone estrela:** SVG 18x18 com estrela de 5 pontas (stroke branco 1.5px)
  - 3 linhas horizontais animadas (sparkle/shimmer effect)
  - Animacao: `pathLength` [0.6 -> 1 -> 0.6], `opacity` [0.3 -> 1 -> 0.3], `strokeWidth` [1.5 -> 2 -> 1.5]
  - Duracao: 1.6s cada, repeat infinito, easeInOut
  - Stagger: linha 1 delay 0s, linha 2 delay 0.35s, linha 3 delay 0.7s
  - RepeatDelay: 0.6s
- **Texto:** "IA-First" (Manrope Medium 18px, branco, tracking -0.36px)

#### 2b. HeroContent (`src/components/HeroContent.tsx`)
- **Margin-top:** 24px (mt-6) do badge
- **Max-width:** 768px (max-w-3xl)
- **Titulo:** "Invest With Confidence" + quebra de linha + "Grow Wealth With Clarity"
  - Manrope Medium, branco, responsivo: 24px (mobile) -> 42px (desktop)
  - Leading 1.15, tracking-tight
- **Subtitulo:** "AI-driven portfolios. Transparent performance." + quebra + "Secure wealth building, all in one place."
  - Manrope Medium, branco 70% opacidade, 14px (mobile) -> 16px (desktop)
  - Leading relaxed, max-width 512px

#### 2c. EarlyAccessForm (`src/components/EarlyAccessForm.tsx`)
- **Margin-top:** 32px (mt-8)
- **Container:** Pill escuro (`bg-[#1a1a1a]`), borda `white/15`, rounded-full, padding 4px + padding-left 16px, max-width 384px
- **Input:** Placeholder "seuemail@email.com", transparente, Manrope Medium 14px, branco, placeholder branco 50%
- **Botao:** "Get early access", fundo #FAFAFA, texto #171719, rounded-full, Manrope Medium 12-14px, padding 10px 20px, hover branco puro

---

### 3. Video (`src/components/SocialProofSection.tsx`)
- **Layout:** Relative, full-width, overflow hidden
- **Video:** Background video (absolute, inset-0, object-cover)
  - URL: CloudFront CDN (`d8j0ntlcm91z4.cloudfront.net/...hf_20260308...mp4`) /? Uso pois acho o video bonito, é de um gradiante que combina com a nossa identidade visual
  - AutoPlay, muted, playsInline
  - **Fade logic (JavaScript):**
    - `requestAnimationFrame` loop lendo `currentTime` e `duration`
    - Fade-in: primeiros 0.5s (opacity 0 -> 1)
    - Fade-out: ultimos 0.5s (opacity 1 -> 0)
    - On ended: opacity 0, espera 100ms, reset currentTime=0, play() (loop manual seamless)
- **Gradient overlay:** `bg-gradient-to-b from-background via-transparent to-background` (absolute, inset-0)
- **Spacer:** div de altura 256px (h-64) para visibilidade do video

---

### 4. Features Section (`src/components/ui/feature-section-with-hover-effects.tsx`)
- **Layout:** Grid 1 coluna (mobile) -> 2 colunas (md) -> 4 colunas (lg), max-width 1280px, centralizado, padding vertical 40px
- **8 cards** com efeito hover:

| # | Titulo | Descricao | Icone |
|---|--------|-----------|-------|
| 1 | Built for developers | Built for engineers, developers, dreamers, thinkers and doers. | IconTerminal2 |
| 2 | Ease of use | It's as easy as using an Apple, and as expensive as buying one. | IconEaseInOut |
| 3 | Pricing like no other | Our prices are best in the market. No cap, no lock, no credit card required. | IconCurrencyDollar |
| 4 | 100% Uptime guarantee | We just cannot be taken down by anyone. | IconCloud |
| 5 | Multi-tenant Architecture | You can simply share passwords instead of buying new seats | IconRouteAltLeft |
| 6 | 24/7 Customer Support | We are available a 100% of the time. Atleast our AI Agents are. | IconHelp |
| 7 | Money back guarantee | If you donot like EveryAI, we will convince you to like us. | IconAdjustmentsBolt |
| 8 | And everything else | I just ran out of copy ideas. Accept my sincere apologies | IconHeart |

- **Hover effect:** Gradient aparece (opacity 0 -> 1, 200ms), barra lateral muda de neutral-700 para blue-500 e cresce (h-6 -> h-8), titulo translada 2px para direita
- **Bordas:** Cards 1-4 tem borda inferior, cards separados por bordas laterais (neutral-800)
- **Icones:** @tabler/icons-react, cor neutral-400
- **Titulo:** text-lg font-bold, neutral-100
- **Descricao:** text-sm, neutral-300

---

### 5. Testimonials Section (`src/components/ui/testimonial-v2.tsx`)
- **Layout:** Section transparente, padding vertical 96px, overflow hidden

**Header:**
- Badge: "TESTIMONIALS" (uppercase, text-xs, font-semibold, tracking-wide, borda neutral-700, fundo neutral-800/50, rounded-full)
- Titulo: "What our users say" (text-4xl/5xl, font-extrabold, tracking-tight, branco)
- Subtitulo: "Discover how thousands of teams streamline their operations with our platform." (text-lg, neutral-400, max-width 384px)

**Animacao de entrada:** Framer Motion `whileInView` — opacity 0->1, y 50->0, rotate -2->0, duracao 1.2s, ease customizado [0.16, 1, 0.3, 1]

**Colunas de depoimentos:** 3 colunas (1 mobile, 2 tablet, 3 desktop) com scroll infinito vertical (translateY -50%, loop)
- Coluna 1: duracao 15s
- Coluna 2: duracao 19s (hidden mobile)
- Coluna 3: duracao 17s (hidden mobile/tablet)
- Mask-image: fade top/bottom (transparent -> black 10% -> black 90% -> transparent)
- Max-height: 740px

**9 depoimentos:**

| # | Nome | Cargo | Texto |
|---|------|-------|-------|
| 1 | Briana Patton | Operations Manager | This ERP revolutionized our operations, streamlining finance and inventory... |
| 2 | Bilal Ahmed | IT Manager | Implementing this ERP was smooth and quick... |
| 3 | Saman Malik | Customer Support Lead | The support team is exceptional... |
| 4 | Omar Raza | CEO | This ERP's seamless integration enhanced our business... |
| 5 | Zainab Hussain | Project Manager | Its robust features and quick support have transformed... |
| 6 | Aliza Khan | Business Analyst | The smooth implementation exceeded expectations... |
| 7 | Farhan Siddiqui | Marketing Director | Our business functions improved with a user-friendly design... |
| 8 | Sana Sheikh | Sales Manager | They delivered a solution that exceeded expectations... |
| 9 | Hassan Ali | E-commerce Manager | Using this ERP, our online presence and conversions significantly improved... |

**Card style:** padding 40px, rounded-3xl, borda neutral-800, fundo neutral-900, sombra
- Hover: scale 1.03, y -8px, sombra aumentada (spring stiffness 400, damping 17)
- Avatar: 40x40, rounded-full, ring-2 neutral-800, hover ring primary/30
- Nome: font-semibold, branco
- Cargo: text-sm, neutral-500
- Texto: neutral-400, leading-relaxed

**Imagens dos avatares:** Unsplash (fotos reais de pessoas)

---

### 6. Timeline Section (`src/components/ui/timeline.tsx` + `src/components/TimelineSection.tsx`)
- **Layout:** Full-width, fundo neutral-950, max-width 1280px centralizado

**Header:**
- Titulo: "Changelog from my journey" (text-lg/4xl, branco)
- Subtitulo: "I've been working on Aceternity for the past 2 years. Here's a timeline of my journey." (text-sm/base, neutral-300)

**Linha de progresso:**
- Linha vertical de 2px (neutral-700, gradient transparente nas pontas)
- Linha de progresso animada: gradient purple-500 -> blue-500 -> transparente
- Animada por scroll (useScroll + useTransform do Framer Motion)
- Offset: start 10% -> end 50%

**Dots:** Circulos de 40px, fundo preto, circulo interno 16px neutral-800 com borda neutral-700

**3 entradas:**

**2024:**
- Texto: "Built and launched Aceternity UI and Aceternity UI Pro from scratch"
- Grid 2x2 de imagens (startup-1 a startup-4 de assets.aceternity.com)

**Early 2023:**
- Texto: "I usually run out of copy..." + "Lorem ipsum is for people who are too lazy..."
- Grid 2x2 de imagens (hero-sections, features-section, bento-grids, cards)

**Changelog:**
- Texto: "Deployed 5 new components on Aceternity today"
- Checklist:
  - Card grid component
  - Startup template Aceternity
  - Random file upload lol
  - Himesh Reshammiya Music CD
  - Salman Bhai Fan Club registrations open
- Grid 2x2 de imagens (hero-sections, features-section, bento-grids, cards)

**Titulos das entradas:** text-xl/5xl, font-bold, neutral-500, sticky no scroll (top 40)

**Imagens:** rounded-lg, object-cover, responsivas (h-20 mobile -> h-60 desktop), sombras multiplas

---

## Arquivos Auxiliares

### `src/lib/utils.ts`
- Funcao `cn()`: merge de classes CSS usando `clsx` + `tailwind-merge`

### `src/hooks/useScrolled.ts`
- Hook customizado que retorna `true` quando `window.scrollY > threshold` (default 50px)
- Listener de scroll com `{ passive: true }`

### `index.html`
- Titulo: "NovaVest -- Invest With Confidence"
- Google Fonts: Inter (400, 600), Manrope (400, 500, 700, 800), Poppins (400, 500, 600)
- Preconnect para fonts.googleapis.com e fonts.gstatic.com

### `vite.config.ts`
- Plugins: @vitejs/plugin-react + @tailwindcss/vite
- Alias: `@/` -> `./src/`

### `tsconfig.app.json`
- Target: ES2020, JSX: react-jsx, strict mode
- Paths: `@/*` -> `./src/*`

---

## Dependencias (package.json)
- react, react-dom (19.x)
- framer-motion (12.x)
- @tabler/icons-react
- lucide-react
- clsx
- tailwind-merge
- tailwindcss (4.x)
- @tailwindcss/vite
- @vitejs/plugin-react
- vite (8.x)
- typescript


TUDO AQUI SÃO COMPONENTES QUE DEVEM SER MODIFICADOS E MELHORADOS, MAS O CONCEITO E A IDEIA GERAL DEVEM SER MANTIDOS, E NÃO DEVEM SER EXCLUIDOS DO PROJETO, ESSA LANDING PAGE NAO TERA NENHUM CONTATO COM O NOSSO PRODUTO, O SISTEMA CLINICO. FIQUE CIENTE DISSO.