
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as qualificationService from '@/services/qualificationService';
import { QualificationLeadSchema } from '@/ai/schemas';

const questions = [
  { key: 'companySize', title: 'Qual o tamanho da sua empresa?' },
  { key: 'inefficientProcesses', title: 'Quais processos internos hoje consomem mais tempo da sua equipe?' },
  { key: 'currentTools', title: 'Quais ferramentas ou softwares vocês já utilizam no dia a dia?' },
  { key: 'urgency', title: 'Qual o nível de prioridade que você dá para resolver esse problema?' },
  { key: 'interestedServices', title: 'Em quais serviços você tem mais interesse?' },
  { key: 'investmentRange', title: 'Em qual faixa de investimento você estaria confortável para este projeto?' },
  { key: 'desiredOutcome', title: 'O que você gostaria de alcançar com essa solução?' },
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
    // A função de salvamento agora é interna e não é esperada pelo cliente.
    const processAndSaveLead = async () => {
      try {
        const formattedAnswers = questions.map(q => {
          let answer = (answers as any)[q.key];
          
          if (q.key === 'interestedServices' && typeof answer === 'object' && answer !== null) {
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
            contato: contactInfo
        };

        await qualificationService.createQualificationLead(dataToSave);
      } catch (error: any) {
        // Erro silencioso no servidor
      }
    };
    
    // Inicia o processo de salvamento, mas não espera por ele (fire-and-forget).
    processAndSaveLead();

    // Retorna sucesso imediatamente para a interface, mesmo que o salvamento ainda esteja ocorrendo.
    return { success: true, message: 'Processamento do formulário iniciado.' };
  }
);

export async function submitQualificationForm(
  input: z.infer<typeof QualificationLeadSchema>
): Promise<{ success: boolean; message: string }> {
  return qualificationFlow(input);
}
