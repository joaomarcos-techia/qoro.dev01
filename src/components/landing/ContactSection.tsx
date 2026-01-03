
'use client';

import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ContactSection() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsLoading(true);
        router.push('/qualificacao');
    };

    return (
        <section id="contato" className="py-20 bg-black">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                 <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                    Seu negócio não terá mais funcionários. Terá um exército de agentes.
                </h2>
                <p className="text-lg text-primary mb-4 font-semibold">O futuro é o orchestrated workforce. Sua equipe humana foca na estratégia. A IA garante a execução.</p>
                <p className="text-lg md:text-xl text-white/70 mb-10 leading-relaxed max-w-3xl mx-auto">
                    Não fique para trás. A growth IA não é uma opção, é a fundação da próxima década de crescimento.
                </p>
                <div 
                    onClick={handleClick}
                    className="inline-flex items-center text-base md:text-lg font-semibold bg-primary text-primary-foreground px-8 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-primary/40 hover:-translate-y-1 group cursor-pointer"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                            Aguarde...
                        </>
                    ) : (
                        <>
                            Agende sua análise de fluxo agentic gratuita
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
