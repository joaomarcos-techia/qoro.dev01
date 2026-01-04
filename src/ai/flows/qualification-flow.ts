
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as qualificationService from '@/services/qualificationService';
import { QualificationLeadSchema } from '@/ai/schemas';
import { questions } from '@/app/qualificacao/form/questions';

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
