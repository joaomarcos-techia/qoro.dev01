
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Loader2, Send, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const questions = [
  {
    step: 1,
    section: 'Empresa',
    title: 'Qual o tamanho da sua empresa?',
    type: 'radio',
    key: 'companySize',
    options: ['Micro (até 10)', 'Pequena (11-50)', 'Média (51-200)', 'Grande (201+)'],
  },
  {
    step: 2,
    section: 'Problema',
    title: 'Quais processos internos hoje consomem mais tempo da sua equipe?',
    type: 'textarea',
    key: 'inefficientProcesses',
    placeholder: 'Ex: "Gerenciamento manual de planilhas", "Falta de comunicação entre vendas e financeiro"...',
  },
  {
    step: 3,
    section: 'Problema',
    title: 'Quais ferramentas ou softwares vocês já utilizam no dia a dia?',
    type: 'textarea',
    key: 'currentTools',
    placeholder: 'Ex: "Trello para tarefas, Excel para finanças, WhatsApp para clientes"...',
  },
  {
    step: 4,
    section: 'Problema',
    title: 'Em uma escala de 0 a 10, qual é a urgência em resolver esse problema?',
    type: 'radio',
    key: 'urgency',
    options: Array.from({ length: 11 }, (_, i) => i.toString()),
    isScale: true,
  },
  {
    step: 5,
    section: 'Serviço',
    title: 'Em quais serviços você tem mais interesse?',
    subtitle: 'Selecione uma ou mais opções.',
    type: 'checkbox',
    key: 'interestedServices',
    options: [
      { category: 'Automação e Eficiência', items: ['Automação de processos internos', 'Integração entre sistemas já existentes'] },
      { category: 'Inteligência Artificial', items: ['Criação de agente de IA personalizado', 'Chatbots de atendimento', 'Geração de análises e insights automatizados'] },
      { category: 'Desenvolvimento', items: ['Criação de SaaS sob medida'] },
    ],
  },
  {
    step: 6,
    section: 'Investimento',
    title: 'Em qual faixa de investimento você estaria confortável para este projeto?',
    type: 'radio',
    key: 'investmentRange',
    options: ['Até R$ 2.000', 'R$ 2.000 – R$ 5.000', 'R$ 5.000 – R$ 10.000', 'Acima de R$ 10.000', 'Ainda não tenho uma ideia clara'],
  },
  {
    step: 7,
    section: 'Expectativa',
    title: 'O que você gostaria de alcançar com essa solução?',
    type: 'textarea',
    key: 'desiredOutcome',
    placeholder: 'Ex: "Reduzir custos em 20%", "Ganhar 5 horas por semana", "Aumentar as vendas"...',
  },
  {
    step: 8,
    section: 'Contato',
    title: 'Excelente! Estamos quase lá. Faltam apenas seus dados para contato.',
    type: 'contact',
    keys: ['fullName', 'role', 'email'],
  },
];

const totalSteps = questions.length;

export default function QualificationForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const router = useRouter();

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / totalSteps) * 100;
  
  const navigate = (direction: 'next' | 'back') => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      if (direction === 'next' && currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
      } else if (direction === 'back' && currentStep > 0) {
        setCurrentStep(currentStep - 1);
      }
      setIsAnimatingOut(false);
    }, 300); // Animation duration
  };

  const handleNext = () => navigate('next');
  const handleBack = () => navigate('back');

  const handleInputChange = (key: string, value: any) => {
    setAnswers({ ...answers, [key]: value });
  };
  
  const handleCheckboxChange = (category: string, item: string, checked: boolean) => {
    const key = 'interestedServices';
    const currentServices = answers[key] || {};
    const categoryServices = currentServices[category] || [];

    let newCategoryServices;
    if (checked) {
      newCategoryServices = [...categoryServices, item];
    } else {
      newCategoryServices = categoryServices.filter((s: string) => s !== item);
    }
    
    handleInputChange(key, { ...currentServices, [category]: newCategoryServices });
  }

  const handleSubmit = async () => {
    setIsLoading(true);
    console.log('Form Submitted:', answers);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    router.push('/qualificacao/obrigado');
  };

  const isNextButtonDisabled = () => {
    const value = answers[currentQuestion.key];
    if (currentQuestion.type === 'textarea' || currentQuestion.type === 'contact') {
        if(currentQuestion.type === 'contact') {
            return !answers['fullName'] || !answers['email'];
        }
        return !value || value.trim() === '';
    }
    if (currentQuestion.type === 'checkbox') {
        return !value || Object.values(value).every(v => Array.isArray(v) && v.length === 0);
    }
    return !value;
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white p-4">
      <header className="fixed top-0 left-0 right-0 p-4 z-10">
        <Progress value={progress} className="w-full h-1.5" />
      </header>

      <main className="flex-grow flex items-center justify-center">
        <div className={cn("w-full max-w-3xl transition-all duration-300", isAnimatingOut ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0')}>
          <div className="mb-8">
            <p className="text-primary font-semibold mb-2 flex items-center">
              {currentQuestion.step} <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground" /> {currentQuestion.section}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold">{currentQuestion.title}</h1>
            {currentQuestion.subtitle && <p className="text-muted-foreground mt-2 text-lg">{currentQuestion.subtitle}</p>}
          </div>

          <div className="min-h-[300px]">
            {currentQuestion.type === 'radio' && (
              <RadioGroup
                value={answers[currentQuestion.key] || ''}
                onValueChange={(value) => handleInputChange(currentQuestion.key, value)}
                className={cn("grid gap-3", currentQuestion.isScale ? 'grid-cols-6 md:grid-cols-11' : 'grid-cols-1 md:grid-cols-2')}
              >
                {currentQuestion.options.map((option, index) => (
                  <Label key={option} className={cn(
                    "flex items-center justify-start p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 h-full",
                    answers[currentQuestion.key] === option 
                      ? 'bg-primary/10 border-primary' 
                      : 'border-border hover:border-primary/50'
                  )}>
                    <RadioGroupItem value={option} id={option} className="sr-only" />
                    <div className={cn("w-6 h-6 rounded-md border-2 flex-shrink-0 mr-4 flex items-center justify-center", answers[currentQuestion.key] === option ? 'border-primary bg-primary' : 'border-border')}>
                      {answers[currentQuestion.key] === option && <Check className="w-4 h-4 text-primary-foreground" />}
                    </div>
                    <span className="font-semibold">{option}</span>
                  </Label>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.type === 'textarea' && (
              <Textarea
                value={answers[currentQuestion.key] || ''}
                onChange={(e) => handleInputChange(currentQuestion.key, e.target.value)}
                placeholder={currentQuestion.placeholder}
                className="min-h-[150px] text-lg bg-transparent border-b-2 border-border focus:border-primary rounded-none p-2"
              />
            )}

            {currentQuestion.type === 'checkbox' && (
              <div className="space-y-8">
                {currentQuestion.options.map(({ category, items }) => (
                  <div key={category}>
                    <h3 className="font-semibold text-xl mb-4">{category}</h3>
                    <div className="space-y-3">
                      {items.map((item) => {
                         const isChecked = answers[currentQuestion.key]?.[category]?.includes(item) || false;
                         return(
                          <Label key={item} className={cn("flex items-center justify-start p-4 border-2 rounded-xl cursor-pointer transition-all duration-200",
                             isChecked ? 'bg-primary/10 border-primary' : 'border-border hover:border-primary/50'
                          )}>
                            <Checkbox
                              id={item}
                              checked={isChecked}
                              onCheckedChange={(checked) => handleCheckboxChange(category, item, !!checked)}
                              className="sr-only"
                            />
                            <div className={cn("w-6 h-6 rounded-md border-2 flex-shrink-0 mr-4 flex items-center justify-center", isChecked ? 'border-primary bg-primary' : 'border-border')}>
                               {isChecked && <Check className="w-4 h-4 text-primary-foreground" />}
                            </div>
                            <span className="font-semibold">{item}</span>
                          </Label>
                         )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {currentQuestion.type === 'contact' && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="fullName" className="text-muted-foreground">Nome Completo *</Label>
                  <Input id="fullName" value={answers['fullName'] || ''} onChange={(e) => handleInputChange('fullName', e.target.value)} className="h-14 text-xl bg-transparent border-0 border-b-2 rounded-none p-2"/>
                </div>
                 <div>
                  <Label htmlFor="role" className="text-muted-foreground">Cargo</Label>
                  <Input id="role" value={answers['role'] || ''} onChange={(e) => handleInputChange('role', e.target.value)} className="h-14 text-xl bg-transparent border-0 border-b-2 rounded-none p-2"/>
                </div>
                 <div>
                  <Label htmlFor="email" className="text-muted-foreground">E-mail *</Label>
                  <Input id="email" type="email" value={answers['email'] || ''} onChange={(e) => handleInputChange('email', e.target.value)} className="h-14 text-xl bg-transparent border-0 border-b-2 rounded-none p-2"/>
                </div>
              </div>
            )}
          </div>

          <div className="mt-12 flex items-center justify-between">
            <Button variant="outline" size="lg" onClick={handleBack} disabled={currentStep === 0 || isLoading}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            
            {currentStep < totalSteps - 1 ? (
              <Button size="lg" onClick={handleNext} disabled={isNextButtonDisabled()}>
                Avançar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button size="lg" onClick={handleSubmit} disabled={isLoading || isNextButtonDisabled()}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {isLoading ? 'Enviando...' : 'Enviar Respostas'}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

