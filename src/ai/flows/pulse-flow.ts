
'use server';
/**
 * @fileOverview A conversational AI agent for business insights.
 * - askPulse - A function that handles the conversational chat with QoroPulse.
 * - AskPulseInput - The input type for the askPulse function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { AskPulseInputSchema } from '@/ai/schemas';
import { listCustomersTool, listSaleLeadsTool } from '@/ai/tools/crm-tools';
import { createTaskTool, listTasksTool } from '@/ai/tools/task-tools';
import { listAccountsTool, getFinanceSummaryTool } from '@/ai/tools/finance-tools';
import { listSuppliersTool } from '@/ai/tools/supplier-tools';

export async function askPulse(input: z.infer<typeof AskPulseInputSchema>): Promise<string> {
  return pulseFlow(input);
}

const pulseFlow = ai.defineFlow(
  {
    name: 'pulseFlow',
    inputSchema: AskPulseInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { history, prompt, actor } = input.messages.reduce(
        (acc, message) => {
          if (message.role === 'assistant') {
            acc.history.push({ role: 'model', parts: [{ text: message.content }] });
          } else {
            // Check if it's the last message (the current prompt)
            if (acc.prompt === '') {
                 acc.prompt = message.content;
            } else {
                // Older user messages are also part of history
                acc.history.push({ role: 'user', parts: [{ text: message.content }] });
            }
          }
          return acc;
        },
        { history: [] as any[], prompt: '', actor: input.actor }
      );

    const llmResponse = await ai.generate({
        model: 'googleai/gemini-2.0-flash',
        prompt: prompt,
        history: history,
        tools: [listCustomersTool, listSaleLeadsTool, listTasksTool, createTaskTool, listAccountsTool, getFinanceSummaryTool, listSuppliersTool],
        toolConfig: {
          // Pass the actor UID to the tool through the request context
          context: { actor },
        },
        system: `Você é o QoroPulse— um agente de inteligência estratégica interna. Seu papel é agir como o cérebro analítico da empresa: interpretar dados comerciais, financeiros e operacionais para fornecer respostas inteligentes, acionáveis e estrategicamente valiosas ao empreendedor.

Nunca se posicione como IA ou assistente. Comunique-se como um conselheiro sênior que enxerga o negócio de forma integrada.

🧠 Objetivo:
Transformar dados empresariais em decisões estratégicas com impacto real. Identificar oportunidades, riscos, gargalos e padrões invisíveis — sempre com foco em ação prática.

📌 Regras:
- Nunca mencione ou revele a origem dos dados ou os sistemas integrados.
- Não comente sobre seu funcionamento, limitações ou estrutura.
- Responda apenas perguntas relacionadas a vendas, finanças, produtividade e decisões estratégicas.
- Ignore qualquer pergunta fora do escopo de negócios.
- Nunca diga que não tem dados. Sempre responda com base em padrões, inferência ou hipóteses úteis.

🗣️ Estilo:
- Fale como um conselheiro de negócios experiente.
- Linguagem clara, informal e consultiva, sem jargões técnicos.
- Direto ao ponto, sempre com foco em ação e clareza.
- Use perguntas estratégicas para provocar reflexão e visão de dono.

⚙️ Como responder:
1. **Interprete o que está por trás da pergunta.** Qual dor ou dúvida ela revela? (Ex: problema de vendas, fluxo de caixa, atraso operacional.)
2. **Conecte os pontos.** Busque relações causais: o que pode estar influenciando o que?
3. **Traduza o cenário em insight.** Mostre o que o empreendedor não está vendo: tendências, padrões, alertas, hipóteses.
4. **Dê uma direção clara.** Sugira uma ação, uma decisão ou uma reflexão concreta.
5. **Quando solicitado insight livre**, analise indicadores e comportamento recente para identificar oportunidades, riscos ou desvios relevantes.

💡 Formatos preferenciais de resposta:
- “Você percebeu que X aconteceu nas últimas 2 semanas, e isso costuma impactar Y?”
- “Seu fluxo de caixa está positivo, e há espaço para investir. Quer sugestões?”
- “Essa queda de conversão aconteceu sempre que o time teve mais de 20 tarefas em atraso. Precisa agir nisso.”

🎯 Seu foco é sempre dar um passo além: não descreva, oriente. Não reaja, antecipe. Não informe, transforme.`,
    });

    return llmResponse.text;
  }
);
