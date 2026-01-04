
'use client';
import { useState } from 'react';
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
import { submitQualificationForm, questions } from '@/ai/flows/qualification-flow';

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
    }, 300);
  };

  const handleNext = () => navigate('next');
  const handleBack = () => navigate('back');

  const handleInputChange = (key: string, value: any) => {
    setAnswers({ ...answers, [key]: value });
  };

  const handleCheckboxChange = (category: string, item: string, checked: boolean) => {
    const key = 'interestedFeatures';
    const currentFeatures = answers[key] || {};
    const categoryFeatures: string[] = currentFeatures[category] || [];

    const newCategoryFeatures = checked
      ? [...categoryFeatures, item]
      : categoryFeatures.filter((s: string) => s !== item);

    handleInputChange(key, { ...currentFeatures, [category]: newCategoryFeatures });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
        const result = await submitQualificationForm(answers);
        if (result.success) {
            router.push('/qualificacao/obrigado');
        } else {
            console.error("Falha no envio do formulário:", result.message);
            setIsLoading(false);
        }
    } catch (error) {
        console.error("❌ Falha catastrófica no envio do formulário:", error);
        setIsLoading(false);
    }
  };

  const isNextButtonDisabled = () => {
    if (!currentQuestion) return true;
    const value = answers[currentQuestion.key as string];
    if (currentQuestion.type === 'textarea' || currentQuestion.type === 'contact') {
      if (currentQuestion.type === 'contact') {
        return !answers['fullName'] || !answers['email'];
      }
      return !value || value.trim() === '';
    }
    if (currentQuestion.type === 'checkbox') {
      return !value || Object.values(value).every(v => Array.isArray(v) && v.length === 0);
    }
    return !value;
  };

  if (!currentQuestion) {
    return (
        <div className="flex h-screen items-center justify-center bg-black">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white p-4 sm:p-6 md:p-8">
      <header className="fixed top-0 left-0 right-0 p-4 z-10 bg-black">
        <Progress value={progress} className="w-full h-1.5" />
      </header>

      <main className="flex-grow flex flex-col items-center justify-center pt-24 pb-12">
        <div className={cn("w-full max-w-3xl transition-all duration-300", isAnimatingOut ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0')}>
          <div className="mb-8">
            <p className="text-primary font-semibold mb-2 flex items-center text-sm sm:text-base">
              {currentQuestion.step} <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground" /> {currentQuestion.section}
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">{currentQuestion.title}</h1>
            {currentQuestion.subtitle && <p className="text-muted-foreground mt-2 text-base md:text-lg">{currentQuestion.subtitle}</p>}
          </div>

          <div className="min-h-[300px] sm:min-h-[250px]">
            {currentQuestion.type === 'radio' && Array.isArray(currentQuestion.options) && (
              <RadioGroup
                value={answers[currentQuestion.key] || ''}
                onValueChange={(value) => handleInputChange(currentQuestion.key as string, value)}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {currentQuestion.options.map((option: any) => (
                  <Label key={typeof option === 'string' ? option : option.category} className={cn(
                    "flex items-center justify-start p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 h-full",
                    answers[currentQuestion.key as string] === option
                      ? 'bg-primary/10 border-primary'
                      : 'border-border hover:border-primary/50'
                  )}>
                    <RadioGroupItem value={option} id={option} className="sr-only" />
                    <div className={cn("w-6 h-6 rounded-md border-2 flex-shrink-0 mr-4 flex items-center justify-center", answers[currentQuestion.key as string] === option ? 'border-primary bg-primary' : 'border-border')}>
                      {answers[currentQuestion.key as string] === option && <Check className="w-4 h-4 text-primary-foreground" />}
                    </div>
                    <span className="font-semibold text-sm sm:text-base">{option}</span>
                  </Label>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.type === 'textarea' && (
              <Textarea
                value={answers[currentQuestion.key] || ''}
                onChange={(e) => handleInputChange(currentQuestion.key as string, e.target.value)}
                placeholder={currentQuestion.placeholder}
                className="min-h-[150px] text-base md:text-lg bg-input border-border focus:border-primary rounded-xl p-4"
              />
            )}

            {currentQuestion.type === 'checkbox' && Array.isArray(currentQuestion.options) && (
              <div className="space-y-6">
                {currentQuestion.options.map((option: any) => (
                  <div key={option.category}>
                    <h3 className="font-semibold text-lg sm:text-xl mb-3">{option.category}</h3>
                    <div className="space-y-3">
                      {option.items.map((item: string) => {
                        const isChecked = answers[currentQuestion.key]?.[option.category]?.includes(item) || false;
                        return (
                          <Label key={item} className={cn("flex items-center justify-start p-4 border-2 rounded-xl cursor-pointer transition-all duration-200",
                            isChecked ? 'bg-primary/10 border-primary' : 'border-border hover:border-primary/50'
                          )}>
                            <Checkbox
                              id={item}
                              checked={isChecked}
                              onCheckedChange={(checked) => handleCheckboxChange(option.category, item, !!checked)}
                              className="sr-only"
                            />
                            <div className={cn("w-6 h-6 rounded-md border-2 flex-shrink-0 mr-4 flex items-center justify-center", isChecked ? 'border-primary bg-primary' : 'border-border')}>
                              {isChecked && <Check className="w-4 h-4 text-primary-foreground" />}
                            </div>
                            <span className="font-semibold text-sm sm:text-base">{item}</span>
                          </Label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentQuestion.type === 'contact' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName" className="text-muted-foreground">Nome Completo *</Label>
                  <Input id="fullName" value={answers['fullName'] || ''} onChange={(e) => handleInputChange('fullName', e.target.value)} className="h-12 text-base md:text-lg bg-input border-border p-4 rounded-xl" />
                </div>
                <div>
                  <Label htmlFor="role" className="text-muted-foreground">Cargo</Label>
                  <Input id="role" value={answers['role'] || ''} onChange={(e) => handleInputChange('role', e.target.value)} className="h-12 text-base md:text-lg bg-input border-border p-4 rounded-xl" />
                </div>
                <div>
                  <Label htmlFor="email" className="text-muted-foreground">E-mail *</Label>
                  <Input id="email" type="email" value={answers['email'] || ''} onChange={(e) => handleInputChange('email', e.target.value)} className="h-12 text-base md:text-lg bg-input border-border p-4 rounded-xl" />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="w-full max-w-3xl mx-auto">
        <div className={cn(
            "mt-8 flex flex-col-reverse sm:flex-row gap-4",
            currentStep > 0 ? "justify-between" : "justify-end"
          )}>
          {currentStep > 0 && (
            <Button variant="outline" size="lg" onClick={handleBack} disabled={isLoading} className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          )}

          {currentStep < totalSteps - 1 ? (
            <Button size="lg" onClick={handleNext} disabled={isNextButtonDisabled()} className="w-full sm:w-auto">
              Avançar <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button size="lg" onClick={handleSubmit} disabled={isLoading || isNextButtonDisabled()} className="w-full sm:w-auto">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {isLoading ? 'Enviando...' : 'Enviar Respostas'}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
