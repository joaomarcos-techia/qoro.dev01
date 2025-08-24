
'use server';
/**
 * @fileOverview A conversational AI agent for business insights.
 * - askPulse - A function that handles the conversational chat with QoroPulse.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { AskPulseInputSchema, AskPulseOutputSchema, PulseMessageSchema } from '@/ai/schemas';
import { listCustomersTool, listSaleLeadsTool } from '@/ai/tools/crm-tools';
import { createTaskTool, listTasksTool } from '@/ai/tools/task-tools';
import { listAccountsTool, getFinanceSummaryTool } from '@/ai/tools/finance-tools';
import { listSuppliersTool } from '@/ai/tools/supplier-tools';
import * as pulseService from '@/services/pulseService';

export async function askPulse(input: z.infer<typeof AskPulseInputSchema>): Promise<z.infer<typeof AskPulseOutputSchema>> {
  return pulseFlow(input);
}

const TitlePromptSchema = z.object({
    title: z.string().describe("Um título curto e conciso para a conversa, com no máximo 5 palavras."),
});

const pulseFlow = ai.defineFlow(
  {
    name: 'pulseFlow',
    inputSchema: AskPulseInputSchema,
    outputSchema: AskPulseOutputSchema,
  },
  async (input) => {
    const { actor, messages, conversationId } = input;
    const isNewConversation = !conversationId;

    const history = messages.slice(0, -1).map(message => ({
        role: message.role === 'user' ? 'user' : 'model',
        parts: [{ text: message.content }],
    }));

    const lastMessage = messages[messages.length - 1];
    const prompt = lastMessage.content;
    
    const llmResponse = await ai.generate({
        model: 'googleai/gemini-2.0-flash',
        prompt: prompt,
        history: history,
        config: {
          temperature: 0.7,
        },
        tools: [listCustomersTool, listSaleLeadsTool, listTasksTool, createTaskTool, listAccountsTool, getFinanceSummaryTool, listSuppliersTool],
        toolConfig: {
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

    const assistantMessage: z.infer<typeof PulseMessageSchema> = {
        role: 'assistant',
        content: llmResponse.text,
    };
    
    const updatedMessages = [...messages, assistantMessage];
    let newConversationId = conversationId;
    let title = '';

    if (isNewConversation) {
        const titleGenerationPrompt = `Com base na seguinte conversa, gere um título curto e conciso (máximo de 5 palavras) que resuma o assunto principal.

        Conversa:
        Usuário: ${prompt}
        Assistente: ${assistantMessage.content}`;

        const titleResponse = await ai.generate({
            model: 'googleai/gemini-2.0-flash',
            prompt: titleGenerationPrompt,
            output: {
                schema: TitlePromptSchema,
            }
        });
        
        title = titleResponse.output?.title || 'Nova Conversa';

        const result = await pulseService.createConversation(actor, title, updatedMessages);
        newConversationId = result.id;
    } else if (newConversationId) {
        await pulseService.updateConversation(actor, newConversationId, updatedMessages);
    }
    
    return {
        conversationId: newConversationId!,
        title: title || undefined,
        response: assistantMessage,
    };
  }
);
