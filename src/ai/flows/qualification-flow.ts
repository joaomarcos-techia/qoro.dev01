
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as qualificationService from '@/services/qualificationService';
import { QualificationLeadSchema } from '@/ai/schemas';

const qualificationFlow = ai.defineFlow(
  {
    name: 'qualificationFlow',
    inputSchema: QualificationLeadSchema,
    outputSchema: z.object({ success: z.boolean(), message: z.string() }),
  },
  async (answers) => {
    try {
      await qualificationService.createQualificationLead(answers);
      return { success: true, message: 'Lead salvo com sucesso no Firestore!' };
    } catch (error: any) {
      console.error("❌ Erro ao salvar lead no Firestore:", error);
      return { success: false, message: "Falha ao salvar as informações do formulário." };
    }
  }
);

export async function submitQualificationForm(
  input: z.infer<typeof QualificationLeadSchema>
): Promise<{ success: boolean; message: string }> {
  return qualificationFlow(input);
}
