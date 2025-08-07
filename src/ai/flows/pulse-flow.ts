
'use server';
/**
 * @fileOverview A conversational AI agent for business insights.
 * - askPulse - A function that handles the conversational chat with QoroPulse.
 * - listConversations - Lists all conversations for the user.
 * - deleteConversation - Deletes a specific conversation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { AskPulseInputSchema, PulseMessageSchema, ConversationSchema } from '@/ai/schemas';
import { listCustomersTool, listSaleLeadsTool } from '@/ai/tools/crm-tools';
import { createTaskTool, listTasksTool } from '@/ai/tools/task-tools';
import { listAccountsTool, getFinanceSummaryTool } from '@/ai/tools/finance-tools';
import { listSuppliersTool } from '@/ai/tools/supplier-tools';
import * as pulseService from '@/services/pulseService';

const ActorSchema = z.object({ actor: z.string() });

export async function askPulse(input: z.infer<typeof AskPulseInputSchema>): Promise<z.infer<typeof PulseMessageSchema>> {
  return pulseFlow(input);
}

export async function listConversations(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof ConversationSchema>[]> {
    return listConversationsFlow(input);
}

export async function deleteConversation(input: { conversationId: string } & z.infer<typeof ActorSchema>): Promise<{ success: boolean }> {
    return deleteConversationFlow(input);
}

const listConversationsFlow = ai.defineFlow(
    {
        name: 'listPulseConversationsFlow',
        inputSchema: ActorSchema,
        outputSchema: z.array(ConversationSchema),
    },
    async ({ actor }) => {
        return pulseService.listConversations(actor);
    }
);

const deleteConversationFlow = ai.defineFlow(
    {
        name: 'deletePulseConversationFlow',
        inputSchema: z.object({ conversationId: z.string(), actor: z.string() }),
        outputSchema: z.object({ success: z.boolean() }),
    },
    async ({ conversationId, actor }) => {
        await pulseService.deleteConversation(conversationId, actor);
        return { success: true };
    }
);


const pulseFlow = ai.defineFlow(
  {
    name: 'pulseFlow',
    inputSchema: AskPulseInputSchema,
    outputSchema: PulseMessageSchema,
  },
  async (input) => {
    const { actor, messages } = input;
    let conversationId = input.conversationId;

    // Correctly separate the latest prompt from the history
    const history = messages.slice(0, -1).map(message => ({
        role: message.role === 'user' ? 'user' : 'model',
        parts: [{ text: message.content }],
    }));

    const lastMessage = messages[messages.length - 1];
    const prompt = lastMessage.content;
    
    // Generate the main response
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

    const assistantResponse: z.infer<typeof PulseMessageSchema> = {
        role: 'assistant',
        content: llmResponse.text,
    };
    
    const updatedMessages = [...messages, assistantResponse];

    // If it's a new conversation, generate a title and save it.
    if (!conversationId) {
        const titleResponse = await ai.generate({
            model: 'googleai/gemini-2.0-flash',
            prompt: `Crie um título curto (máximo 5 palavras) para a seguinte conversa:\n\nUsuário: ${prompt}\nAssistente: ${assistantResponse.content}`,
        });
        const title = titleResponse.text.replace(/"/g, ''); // Remove quotes from title
        conversationId = await pulseService.saveConversation(actor, title, updatedMessages);
    } else {
        // Otherwise, just update the existing conversation
        await pulseService.updateConversation(conversationId, actor, updatedMessages);
    }
    
    return { ...assistantResponse, conversationId };
  }
);
