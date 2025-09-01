
'use server';
/**
 * @fileOverview A conversational AI agent for business insights.
 * - askPulse - A function that handles the conversational chat with QoroPulse.
 * - deleteConversation - Deletes a conversation from the history.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { AskPulseInputSchema, AskPulseOutputSchema, PulseMessage, PulseMessageSchema } from '@/ai/schemas';
import { listCustomersTool } from '@/ai/tools/crm-tools';
import { createTaskTool, listTasksTool } from '@/ai/tools/task-tools';
import { listAccountsTool, getFinanceSummaryTool } from '@/ai/tools/finance-tools';
import { listSuppliersTool } from '@/ai/tools/supplier-tools';
import * as pulseService from '@/services/pulseService';
import { MessageData } from 'genkit';


const PulseResponseSchema = z.object({
    response: z.string().describe("A resposta da IA para a pergunta do usuário."),
    title: z.string().optional().describe("Se um título for solicitado, um título curto e conciso para a conversa com no máximo 5 palavras. Caso contrário, este campo não deve ser definido."),
});
type PulseResponse = z.infer<typeof PulseResponseSchema>;

const DeleteConversationInputSchema = z.object({
  conversationId: z.string(),
  actor: z.string(),
});

export async function askPulse(input: z.infer<typeof AskPulseInputSchema>): Promise<z.infer<typeof AskPulseOutputSchema>> {
  return pulseFlow(input);
}

const pulseFlow = ai.defineFlow(
  {
    name: 'pulseFlow',
    inputSchema: AskPulseInputSchema,
    outputSchema: AskPulseOutputSchema,
  },
  async (input) => {
    const { actor, messages, conversationId } = input;

    let existingConversation = null;
    if (conversationId) {
        existingConversation = await pulseService.getConversation({ conversationId, actor });
    }
    // A conversa não tem título se o campo `title` for nulo, indefinido ou uma string vazia.
    const hasTitle = !!existingConversation?.title;

    const history: MessageData[] = messages.slice(0, -1).map(message => ({
        role: message.role as 'user' | 'model',
        parts: [{ text: message.content }],
    }));

    const lastMessage = messages[messages.length - 1];
    const prompt = lastMessage.content;
    
    // A saudação só deve ser considerada na primeira mensagem para evitar que o título não seja gerado.
    const isGreetingOnFirstMessage = messages.length <= 1 && /^(oi|olá|ola|hello|hi|hey|bom dia|boa tarde|boa noite)/i.test(prompt.trim());

    let systemPrompt = `Você é o QoroPulse— um agente de inteligência estratégica interna. Seu papel é agir como o cérebro analítico da empresa: interpretar dados comerciais, financeiros e operacionais para fornecer respostas inteligentes, acionáveis e estrategicamente valiosas ao empreendedor.

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
- Quando solicitado insight livre, analise indicadores e comportamento recente para identificar oportunidades, riscos ou desvios relevantes.`;
    
    const shouldGenerateTitle = !hasTitle && !isGreetingOnFirstMessage;

    if (shouldGenerateTitle) {
        systemPrompt += `
        
IMPORTANTE: A conversa ainda não tem um título. Baseado na pergunta do usuário, você DEVE gerar um título curto e conciso (máximo 5 palavras) para a conversa no campo "title" do JSON de saída.`;
    }

    const llmResponse = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        prompt: prompt,
        history: history,
        output: {
            schema: PulseResponseSchema,
        },
        config: {
          temperature: 0.7,
        },
        tools: [listCustomersTool, listTasksTool, createTaskTool, listAccountsTool, getFinanceSummaryTool, listSuppliersTool],
        toolConfig: {
          context: { actor },
        },
        system: systemPrompt,
    });
    
    const output = llmResponse.output;

    if (!output) {
        throw new Error("A IA não conseguiu gerar uma resposta válida.");
    }
    
    const assistantMessage: z.infer<typeof PulseMessageSchema> = {
        role: 'assistant',
        content: output.response,
    };
    
    const updatedMessages = [...messages, assistantMessage];
    let currentConversationId = conversationId;
    let finalTitle = existingConversation?.title || undefined;

    if (shouldGenerateTitle && output.title) {
      finalTitle = output.title;
    }

    if (!conversationId) {
        const result = await pulseService.createConversation(actor, finalTitle || '', updatedMessages);
        currentConversationId = result.id;
    } else {
        await pulseService.updateConversation(actor, conversationId, updatedMessages, finalTitle);
    }
    
    return {
        conversationId: currentConversationId!,
        title: finalTitle,
        response: assistantMessage,
    };
  }
);


const deleteConversationFlow = ai.defineFlow(
  {
    name: 'deleteConversationFlow',
    inputSchema: DeleteConversationInputSchema,
    outputSchema: z.object({ success: z.boolean() }),
  },
  async ({ conversationId, actor }) => {
    return pulseService.deleteConversation({ conversationId, actor });
  }
);

export async function deleteConversation(input: z.infer<typeof DeleteConversationInputSchema>): Promise<{ success: boolean }> {
  return deleteConversationFlow(input);
}
