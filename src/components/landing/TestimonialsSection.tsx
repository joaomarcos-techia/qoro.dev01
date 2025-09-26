import Image from 'next/image';
import { Star, Zap } from 'lucide-react';

const testimonials = [
  {
    quote: "Desde que adotamos a Qoro, nosso processo de vendas foi transformado. Ter todos os dados dos clientes e o funil de vendas em um só lugar nos deu uma clareza que planilhas jamais ofereceram. Fechamos 30% mais negócios no último trimestre.",
    name: 'Ana P.',
    company: 'CEO, InovaTech',
    avatar: 'https://picsum.photos/100/100?random=1',
    highlight: 'Aumento de 30% nas Vendas',
    color: 'text-crm-primary',
  },
  {
    quote: "O QoroPulse é como ter um consultor de negócios 24/7. As sugestões proativas sobre nosso fluxo de caixa e oportunidades de venda são incrivelmente precisas. É uma verdadeira virada de jogo para a tomada de decisões estratégicas.",
    name: 'Bruno L.',
    company: 'Diretor, Soluções Criativas',
    avatar: 'https://picsum.photos/100/100?random=2',
    highlight: 'Decisões mais Inteligentes',
    color: 'text-pulse-primary',
  },
  {
    quote: "A gestão financeira da agência era um caos. Com o QoroFinance, finalmente temos controle total sobre as contas a pagar e a receber. A visualização de relatórios é simples, direta e nos economiza horas de trabalho toda semana.",
    name: 'Carlos M.',
    company: 'Fundador, Agência Vértice',
    avatar: 'https://picsum.photos/100/100?random=3',
    highlight: 'Controle Financeiro Total',
    color: 'text-finance-primary',
  },
  {
    quote: "Acabar com a confusão de 'quem está fazendo o quê' foi o maior ganho com o QoroTask. Nossa produtividade como equipe dobrou. A simplicidade do quadro kanban e do calendário integrado mantém todos alinhados e focados.",
    name: 'Daniela F.',
    company: 'Gerente de Projetos, Construtora Futuro',
    avatar: 'https://picsum.photos/100/100?random=4',
    highlight: 'Produtividade em Dobro',
    color: 'text-task-primary',
  },
  {
    quote: "Com a Qoro, finalmente saímos das planilhas. As opções do QoroFinance nos economiza pelo menos 10 horas de trabalho manual por semana. É a clareza que precisávamos para tomar decisões.",
    name: 'Lucas F.',
    company: 'Diretor, LF Consultoria',
    avatar: 'https://picsum.photos/100/100?random=5',
    highlight: '10h/semana economizadas',
    color: 'text-primary',
  }
];

const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

const TestimonialCard = ({ testimonial }: { testimonial: typeof testimonials[0] }) => (
  <div className="bg-card border border-border rounded-2xl p-6 h-full flex flex-col transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1">
    <div className="flex-grow mb-4">
      <p className="text-white/80 italic">"{testimonial.quote}"</p>
    </div>
    <div className="flex items-center">
      <div className="w-10 h-10 rounded-full mr-4 bg-secondary flex items-center justify-center font-bold text-primary">
          {getInitials(testimonial.name)}
      </div>
      <div>
        <p className="font-bold text-white">{testimonial.name}</p>
        <p className="text-sm text-white/60">{testimonial.company}</p>
      </div>
    </div>
    <div className="mt-4 pt-4 border-t border-border/50">
        <div className={`flex items-center text-sm font-semibold ${testimonial.color}`}>
            <Zap className="w-4 h-4 mr-2"/>
            <span>{testimonial.highlight}</span>
        </div>
    </div>
  </div>
);

export function TestimonialsSection() {
  return (
    <section id="depoimentos" className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="text-sm font-medium text-primary mb-4 tracking-wider uppercase">Testemunhos</div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            O que nossos clientes dizem
          </h2>
          <p className="text-lg text-white/70 max-w-3xl mx-auto">
            Empresas como a sua já estão transformando a gestão com a Qoro.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.slice(0, 3).map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} />
          ))}
           <div className="lg:col-span-3">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:max-w-4xl mx-auto">
                {testimonials.slice(3, 5).map((testimonial, index) => (
                    <TestimonialCard key={index} testimonial={testimonial} />
                ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
