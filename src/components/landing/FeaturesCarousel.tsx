
'use client';

import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';
import { Eye, BrainCircuit, Rocket, ShieldCheck, Link, Scaling } from 'lucide-react';

const features = [
  {
    icon: Eye,
    title: 'Visão 360°',
    description: 'Tenha todos os dados importantes do seu negócio — do cliente ao financeiro — em uma única tela.',
    colorClass: 'bg-crm-primary',
  },
  {
    icon: BrainCircuit,
    title: 'Decisões Inteligentes',
    description: 'Use a IA do QoroPulse para identificar tendências, prever resultados e guiar suas estratégias.',
    colorClass: 'bg-pulse-primary',
  },
  {
    icon: Rocket,
    title: 'Produtividade Máxima',
    description: 'Automatize tarefas, organize projetos e libere sua equipe para focar no que realmente importa.',
    colorClass: 'bg-task-primary',
  },
  {
    icon: ShieldCheck,
    title: 'Segurança de Ponta',
    description: 'Construído sobre a infraestrutura do Google, seus dados estão sempre seguros e disponíveis.',
    colorClass: 'bg-finance-primary',
  },
  {
    icon: Link,
    title: 'Tudo Conectado',
    description: 'Sistemas que conversam entre si para que você não perca nenhuma informação importante.',
    colorClass: 'bg-teal-500',
  },
  {
    icon: Scaling,
    title: 'Cresça Sem Limites',
    description: 'Nossa infraestrutura na nuvem escala com seu negócio, do primeiro ao milionésimo cliente.',
    colorClass: 'bg-pink-500',
  },
];

const animation = { duration: 20000, easing: (t: number) => t }

export function FeaturesCarousel() {
  const [sliderRef] = useKeenSlider<HTMLDivElement>({
    loop: true,
    renderMode: "performance",
    drag: false,
    slides: {
      perView: "auto",
      spacing: 15,
    },
    created(s) {
      s.moveToIdx(5, true, animation)
    },
    updated(s) {
      s.moveToIdx(s.track.details.abs + 5, true, animation)
    },
    animationEnded(s) {
      s.moveToIdx(s.track.details.abs + 5, true, animation)
    },
  })

  return (
    <div ref={sliderRef} className="keen-slider" style={{ maxWidth: "100vw" }}>
      {[...features, ...features].map((feature, index) => (
         <div key={index} className="keen-slider__slide" style={{ minWidth: 250, maxWidth: 250 }}>
            <div className="relative group flex flex-col items-center text-center p-6 bg-secondary/30 rounded-2xl border border-border transition-all duration-300 hover:bg-secondary/60 hover:-translate-y-1 overflow-hidden h-full">
               <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className={`text-black w-16 h-16 rounded-2xl flex items-center justify-center mb-5 flex-shrink-0 shadow-lg transition-transform duration-300 ${feature.colorClass}`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-white/70 text-sm">{feature.description}</p>
              </div>
            </div>
        </div>
      ))}
    </div>
  )
}
