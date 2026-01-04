
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as qualificationService from '@/services/qualificationService';
import { QualificationLeadSchema } from '@/ai/schemas';

const questions = [
  { key: 'clinicSpecialty', title: 'Especialidade Principal' },
  { key: 'clinicChallenges', title: 'Maiores Desafios' },
  { key: 'currentTools', title: 'Ferramentas Atuais' },
  { key: 'mainGoal', title: 'Principal Objetivo' },
  { key: 'interestedFeatures', title: 'Funcionalidades de Interesse' },
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
      const formattedAnswers = questions.map(q => {
        let answer = (answers as any)[q.key];
        
        if (q.key === 'interestedFeatures' && typeof answer === 'object' && answer !== null) {
          answer = Object.values(answer).flat().join(', ');
        }
        
        return {
          pergunta: q.title,
          resposta: answer || 'Não informado',
        };
      }).filter(item => item.resposta !== 'Não informado');

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
