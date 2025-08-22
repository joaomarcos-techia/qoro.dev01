
'use client';

import Image from 'next/image';

const projects = [
  {
    title: 'Website Institucional Moderno',
    description: 'Desenvolvimento de um site responsivo e otimizado para performance, com foco na experiência do usuário.',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/qoro-iy1gs.firebasestorage.app/o/site.png?alt=media&token=b004694d-d2ac-49bd-aa20-fb5061fc0a4c',
    alt: 'Screenshot de um website institucional moderno',
  },
  {
    title: 'Plataforma SaaS Complexa',
    description: 'Criação de uma aplicação web completa com dashboard, autenticação e integrações para gestão de dados.',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/qoro-iy1gs.firebasestorage.app/o/site1.png?alt=media&token=f9fb65bd-d523-4d24-81af-7b1ef44b248e',
    alt: 'Screenshot de um dashboard de uma plataforma SaaS',
  },
];

const ProjectCard = ({ project }: { project: typeof projects[0] }) => (
  <div className="bg-card/50 border border-border rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 group">
    <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-4">
      <Image
        src={project.imageUrl}
        alt={project.alt}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
    <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
    <p className="text-white/70 text-sm leading-relaxed">{project.description}</p>
  </div>
);

export function ProductsSection() {
  return (
    <section id="produtos" className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="text-sm font-medium text-primary mb-4 tracking-wider uppercase">Nosso Trabalho</div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Projetos que Impulsionam Negócios
          </h2>
          <p className="text-lg text-white/70 max-w-3xl mx-auto">
            Veja exemplos de como transformamos ideias em soluções digitais robustas e eficientes para nossos clientes.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projects.map((project) => (
                <ProjectCard key={project.title} project={project} />
            ))}
        </div>

      </div>
    </section>
  );
}
