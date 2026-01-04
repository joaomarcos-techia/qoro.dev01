
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as qualificationService from '@/services/qualificationService';
import { QualificationLeadSchema } from '@/ai/schemas';
import { questions } from '@/app/qualificacao/form/questions';

const contactFields = ['fullName', 'role', 'email'];

const qualificationFlow = ai.defineFlow(
  {
    name: 'qualificationFlow',
    inputSchema: QualificationLeadSchema,
    outputSchema: z.object({ success: z.boolean(), message: z.string() }),
  },
  async (answers) => {
    try {
      const questionMap = new Map(questions.map(q => [q.key, q.title]));
      const formattedAnswers: { pergunta: string; resposta: string }[] = [];
      const contactInfo: Record<string, any> = {};

      for (const [key, value] of Object.entries(answers)) {
        if (!value) continue;

        if (contactFields.includes(key)) {
          const contactTitle = questions.find(q => q.keys?.includes(key))?.title || key;
           const fieldInfo = {
            'fullName': 'Nome Completo',
            'role': 'Cargo',
            'email': 'E-mail'
          };
          contactInfo[fieldInfo[key as keyof typeof fieldInfo]] = value;
          continue;
        }
        
        const pergunta = questionMap.get(key) || 'Funcionalidades de Interesse';
        let resposta: string;

        if (key === 'interestedFeatures' && typeof value === 'object' && value !== null) {
          resposta = Object.values(value as Record<string, string[]>).flat().join(', ');
        } else {
          resposta = String(value);
        }

        if (resposta && resposta.trim() !== '' && pergunta) {
          formattedAnswers.push({ pergunta, resposta });
        }
      }
      
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
