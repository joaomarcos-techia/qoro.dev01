'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as qualificationService from '@/services/qualificationService';
import { QualificationLeadSchema } from '@/ai/schemas';

const questionMap: Record<string, string> = {
  fullName: 'Nome Completo',
  role: 'Cargo',
  email: 'E-mail',
  companySize: 'Qual o tamanho da sua empresa?',
  inefficientProcesses: 'Quais processos internos hoje consomem mais tempo da sua equipe?',
  currentTools: 'Quais ferramentas ou softwares vocês já utilizam no dia a dia?',
  urgency: 'Qual o nível de prioridade que você dá para resolver esse problema?',
  interestedServices: 'Em quais serviços você tem mais interesse?',
  investmentRange: 'Em qual faixa de investimento você estaria confortável para este projeto?',
  desiredOutcome: 'O que você gostaria de alcançar com essa solução?',
};

const qualificationFlow = ai.defineFlow(
  {
    name: 'qualificationFlow',
    inputSchema: QualificationLeadSchema,
    outputSchema: z.object({ success: z.boolean(), message: z.string() }),
  },
  async (answers) => {
    try {
      // Transforma o objeto de respostas para usar os títulos das perguntas como chaves
      const formattedData: Record<string, any> = {};
      for (const key in answers) {
        if (Object.prototype.hasOwnProperty.call(answers, key) && questionMap[key]) {
          const answer = (answers as any)[key];
          
          // Formata a resposta de serviços de interesse para ser mais legível
          if (key === 'interestedServices' && typeof answer === 'object' && answer !== null) {
            formattedData[questionMap[key]] = Object.values(answer).flat().join(', ');
          } else {
            formattedData[questionMap[key]] = answer;
          }
        }
      }

      // Garante que os campos de contato sem pergunta direta também sejam incluídos
      if (answers.fullName) formattedData['Nome Completo'] = answers.fullName;
      if (answers.role) formattedData['Cargo'] = answers.role;
      if (answers.email) formattedData['E-mail'] = answers.email;


      await qualificationService.createQualificationLead(formattedData);
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
