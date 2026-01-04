
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as qualificationService from '@/services/qualificationService';
import { QualificationLeadSchema } from '@/ai/schemas';

export const questions = [
  {
    step: 1,
    section: 'Sua Clínica',
    title: 'Qual é a especialidade principal da sua clínica?',
    type: 'radio',
    key: 'clinicSpecialty',
    options: ['Clínica Geral', 'Odontologia', 'Fisioterapia', 'Psicologia', 'Estética', 'Outra'],
  },
  {
    step: 2,
    section: 'Desafios',
    title: 'Quais são os maiores desafios na gestão da sua clínica hoje?',
    type: 'textarea',
    key: 'clinicChallenges',
    placeholder: 'Ex: "Agendamento de pacientes", "Controle de prontuários", "Comunicação com pacientes", "Gestão financeira"...',
  },
  {
    step: 3,
    section: 'Ferramentas',
    title: 'Quais sistemas ou ferramentas você já utiliza?',
    type: 'textarea',
    key: 'currentTools',
    placeholder: 'Ex: "Software de agendamento X", "Prontuário eletrônico Y", "Planilhas para o financeiro"...',
  },
  {
    step: 4,
    section: 'Objetivos',
    title: 'Qual é o seu principal objetivo ao buscar uma nova solução?',
    type: 'radio',
    key: 'mainGoal',
    options: [
      'Reduzir o tempo gasto em tarefas administrativas',
      'Melhorar a experiência e comunicação com o paciente',
      'Aumentar o faturamento e otimizar as finanças',
      'Centralizar todas as informações em um único lugar',
    ],
  },
  {
    step: 5,
    section: 'Funcionalidades',
    title: 'Quais funcionalidades são mais importantes para você?',
    subtitle: 'Selecione uma ou mais opções.',
    type: 'checkbox',
    key: 'interestedFeatures',
    options: [
      { category: 'Gestão de Pacientes', items: ['Agenda inteligente e online', 'Prontuário eletrônico personalizável', 'Confirmação de consulta automática (WhatsApp)'] },
      { category: 'Financeiro', items: ['Controle de caixa e fluxo de caixa', 'Faturamento de convênios', 'Relatórios financeiros automáticos'] },
      { category: 'Inteligência', items: ['Assistente de IA para responder perguntas de gestão', 'Análise de dados de pacientes e agendamentos'] },
    ],
  },
  {
    step: 6,
    section: 'Contato',
    title: 'Excelente! Estamos quase lá. Faltam apenas seus dados para contato.',
    type: 'contact',
    key: 'contactInfo',
    keys: ['fullName', 'role', 'email'],
  },
];


const contactFields = [
    { key: 'fullName', title: 'Nome Completo' },
    { key: 'role', title: 'Cargo' },
    { key: 'email', title: 'E-mail' },
];

const qualificationFlow = ai.defineFlow(
  {
    name: 'qualificationFlow',
    inputSchema: QualificationLeadSchema,
    outputSchema: z.object({ success: z.boolean(), message: z.string() }),
  },
  async (answers) => {
    try {
      const questionMap = new Map(questions.map(q => [q.key, q.title]));

      const formattedAnswers = Object.entries(answers)
        .map(([key, value]) => {
          if (key === 'interestedFeatures' && typeof value === 'object' && value !== null) {
            const features = Object.values(value as Record<string, string[]>).flat().join(', ');
            return {
              pergunta: questionMap.get(key) || 'Funcionalidades de Interesse',
              resposta: features || 'Não informado',
            };
          }
          if (questionMap.has(key)) {
            return {
              pergunta: questionMap.get(key)!,
              resposta: value || 'Não informado',
            };
          }
          return null;
        })
        .filter(item => item !== null && item.resposta !== 'Não informado' && !contactFields.some(f => f.key === item.pergunta));
      
      const contactInfo: Record<string, any> = {};
      contactFields.forEach(field => {
        const answer = (answers as any)[field.key];
        if (answer) {
            contactInfo[field.title] = answer;
        }
      });
      
      const dataToSave = {
          respostas: formattedAnswers,
          contato: contactInfo,
          especialidade: answers.clinicSpecialty || 'Não informado',
      };

      await qualificationService.createQualificationLead(dataToSave);
      
      return { success: true, message: 'Lead salvo com sucesso.' };

    } catch (error: any) {
      console.error("❌ Falha ao salvar o lead no Firestore:", error);
      return { success: false, message: 'Falha ao salvar os dados.' };
    }
  }
);

export async function submitQualificationForm(
  input: z.infer<typeof QualificationLeadSchema>
): Promise<{ success: boolean; message: string }> {
  return qualificationFlow(input);
}
