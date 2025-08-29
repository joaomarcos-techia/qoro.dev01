
'use client';

import { ArrowRight } from "lucide-react";

export function ContactSection() {
    return (
        <section id="contato" className="py-20 bg-secondary/20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                 <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                    Pronto para transformar seu negócio?
                </h2>
                <p className="text-lg md:text-xl text-white/70 mb-10 leading-relaxed max-w-3xl mx-auto">
                    Vamos conversar sobre como nossas soluções podem resolver seus desafios específicos. Sem compromisso, apenas uma conversa produtiva sobre o futuro da sua empresa.
                </p>
                <a href="http://bit.ly/41Emn3C" target="_blank" rel="noopener noreferrer">
                    <div className="inline-flex items-center text-base md:text-lg font-semibold bg-primary text-primary-foreground px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-primary/40 hover:-translate-y-1 group">
                        Fale com um especialista
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                </a>
            </div>
        </section>
    );
}
