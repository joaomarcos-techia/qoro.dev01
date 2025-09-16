
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { AskPulseInputSchema, AskPulseOutputSchema, PulseMessage } from '@/ai/schemas';
import { getCrmSummaryTool } from '@/ai/tools/crm-tools';
import { createTaskTool, listTasksTool } from '@/ai/tools/task-tools';
import { listAccountsTool, getFinanceSummaryTool } from '@/ai/tools/finance-tools';
import { listSuppliersTool } from '@/ai/tools/supplier-tools';
import * as pulseService from '@/services/pulseService';

const PulseResponseSchema = z.object({
  response: z.string().describe('The final, user-facing response from the AI.'),
  title: z.string().optional().describe('A short, descriptive title for the conversation if a new one is needed.'),
});

/**
 * Sanitiza mensagens para garantir compatibilidade com Gemini
 */
function sanitizeMessage(msg: PulseMessage): { role: 'user' | 'model'; parts: { text: string }[] } | null {
  if (!msg || typeof msg !== 'object') {
    return null;
  }

  const content = typeof msg.content === 'string' 
    ? msg.content.trim() 
    : String(msg.content || '').trim();

  if (!content) {
    return null;
  }

  const role = msg.role === 'assistant' ? 'model' : 'user';

  return {
    role,
    parts: [{ text: content }],
  };
}

/**
 * Verifica se o título sugerido é derivativo da primeira mensagem
 */
function isTitleDerivedFromFirstMessage(suggested?: string, firstUser?: string): boolean {
  if (!suggested?.trim() || !firstUser?.trim()) return true;
  
  const a = suggested.trim().toLowerCase();
  const b = firstUser.trim().toLowerCase();
  
  return a === b || a.includes(b) || b.includes(a);
}


// Flow principal
const pulseFlow = ai.defineFlow(
  {
    name: 'pulseFlow',
    inputSchema: AskPulseInputSchema,
    outputSchema: AskPulseOutputSchema,
  },
  async (input) => {
    const { actor, messages: clientMessages } = input;
    let { conversationId } = input;

    // Validação de entrada
    if (!actor?.trim()) {
      throw new Error('Actor é obrigatório.');
    }

    if (!Array.isArray(clientMessages) || clientMessages.length === 0) {
      throw new Error('Lista de mensagens é obrigatória.');
    }

    const lastUserMessage = clientMessages[clientMessages.length - 1];
    if (!lastUserMessage || lastUserMessage.role !== 'user') {
      throw new Error('A última mensagem deve ser do usuário.');
    }

    const userContent = String(lastUserMessage.content || '').trim();
    if (!userContent) {
      throw new Error('A mensagem do usuário não pode estar vazia.');
    }

    // Carregar ou criar conversa
    let conversationHistory: PulseMessage[] = [];
    let currentTitle = 'Nova Conversa';

    if (conversationId) {
        const loadedConv = await pulseService.getConversation({ conversationId, actor });
        if (loadedConv) {
          conversationHistory = Array.isArray(loadedConv.messages) ? loadedConv.messages : [];
          currentTitle = loadedConv.title || 'Nova Conversa';
        } else {
          throw new Error('Conversa não encontrada.');
        }
    } else {
        const created = await pulseService.createConversation({
            actor,
            messages: [lastUserMessage],
            title: userContent.substring(0, 30), // Título provisório
        });
        conversationId = created.id;
        conversationHistory = [lastUserMessage];
        currentTitle = created.title;
    }
    
    // Construir histórico para IA
    const aiHistory = conversationHistory.map(sanitizeMessage).filter((m): m is NonNullable<typeof m> => m !== null);

    if (aiHistory.length === 0) {
      throw new Error('Nenhuma mensagem válida no histórico.');
    }

    // Prompt do sistema
    const systemPrompt = `Você é o QoroPulse, um agente de IA especialista em gestão empresarial.

OBJETIVO:
- Fornecer insights acionáveis baseados nos dados da Qoro
- Ser um parceiro estratégico do usuário
- Se for uma nova conversa, SEMPRE sugira um título curto e descritivo no campo 'title' da resposta.

FERRAMENTAS:
- Use as ferramentas disponíveis quando a pergunta puder ser respondida com dados
- Nunca invente dados - se não disponível, informe claramente
- Não mencione o uso de ferramentas na resposta
- Aja como se soubesse a informação diretamente

TOM:
- Direto, executivo e amigável
- Combine dados de diferentes fontes em uma resposta coesa
- Foque em ações práticas e insights úteis`;

    const availableTools = [
      getCrmSummaryTool,
      listTasksTool,
      createTaskTool,
      listAccountsTool,
      getFinanceSummaryTool,
      listSuppliersTool,
    ].filter(Boolean);

    try {
      let llmResponse = await ai.generate({
          model: 'googleai/gemini-1.5-flash',
          history: aiHistory,
          tools: availableTools,
          toolConfig: { context: { actor } },
          system: systemPrompt,
          output: { schema: PulseResponseSchema },
      });

      const toolRequests = llmResponse.toolRequests();

      if (toolRequests?.length > 0) {
        const modelMessage = { role: 'model' as const, parts: toolRequests.map(toolRequest => ({ toolRequest })) };
        aiHistory.push(modelMessage);

        const toolOutputs = await Promise.all(
          toolRequests.map(async (toolRequest) => {
            try {
              const output = await ai.runTool(toolRequest, { context: { actor } });
              return { toolResponse: { name: toolRequest.name, output } };
            } catch (err) {
              console.error(`Erro na ferramenta ${toolRequest.name}:`, err);
              return { toolResponse: { name: toolRequest.name, output: { __error: true, message: 'Ferramenta temporariamente indisponível' } }};
            }
          })
        );
        
        aiHistory.push({ role: 'tool' as const, parts: toolOutputs });

        llmResponse = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
            history: aiHistory,
            system: systemPrompt,
            output: { schema: PulseResponseSchema },
        });
      }

      const finalOutput = llmResponse.output();
      
      let assistantResponseText: string;
      let suggestedTitle: string | undefined;

      if (typeof finalOutput === 'string') {
        assistantResponseText = finalOutput.trim();
      } else if (finalOutput && typeof finalOutput === 'object') {
        assistantResponseText = String(finalOutput.response || '').trim();
        suggestedTitle = String(finalOutput.title || '').trim() || undefined;
      } else {
        assistantResponseText = 'Desculpe, não consegui processar sua solicitação adequadamente.';
      }

      if (!assistantResponseText) {
        assistantResponseText = 'Desculpe, não consegui gerar uma resposta.';
      }

      const firstUserContent = conversationHistory.find(m => m.role === 'user')?.content || '';
      const firstUserString = String(firstUserContent);
      
      let titleToSave = currentTitle;
      if (suggestedTitle && !isTitleDerivedFromFirstMessage(suggestedTitle, firstUserString)) {
        titleToSave = suggestedTitle;
      }
      
      const assistantMessage: PulseMessage = { role: 'assistant', content: assistantResponseText };
      const allMessages = [...conversationHistory, assistantMessage];
      
      await pulseService.updateConversation(actor, conversationId!, { messages: allMessages, title: titleToSave });

      return {
        conversationId: conversationId!,
        title: titleToSave,
        response: assistantMessage,
      };

    } catch (error) {
      console.error('Erro no fluxo principal da IA:', error);
      
      // Fallback: resposta simples sem ferramentas
      try {
        const fallbackResponse = await ai.generate({ model: 'googleai/gemini-1.5-flash', history: aiHistory, system: systemPrompt });
        const fallbackText = String(fallbackResponse.text() || 'Desculpe, estou com dificuldades técnicas no momento. Tente novamente em alguns instantes.');
        const assistantMessage: PulseMessage = { role: 'assistant', content: fallbackText };
        const allMessages = [...conversationHistory, assistantMessage];
        
        await pulseService.updateConversation(actor, conversationId!, { messages: allMessages, title: currentTitle });

        return {
          conversationId: conversationId!,
          title: currentTitle,
          response: assistantMessage,
        };
      } catch (fallbackError) {
        console.error('Fallback também falhou:', fallbackError);
        throw new Error('Sistema temporariamente indisponível. Tente novamente em alguns instantes.');
      }
    }
  }
);

/**
 * Wrapper cliente para o fluxo principal
 */
export async function askPulse(input: z.infer<typeof AskPulseInputSchema>): Promise<z.infer<typeof AskPulseOutputSchema>> {
  try {
    return await pulseFlow(input);
  } catch (error) {
    console.error('Erro na função askPulse:', error);
    
    // Resposta de emergência
    return {
      conversationId: input.conversationId || 'temp-id',
      title: 'Erro de Sistema',
      response: {
        role: 'assistant',
        content: 'Desculpe, nosso sistema está passando por instabilidades. Tente novamente em alguns minutos. Se o problema persistir, entre em contato com o suporte.',
      },
    };
  }
}

// Flow de exclusão
const DeleteConversationInputSchema = z.object({
  conversationId: z.string(),
  actor: z.string(),
});

const deleteConversationFlow = ai.defineFlow(
  {
    name: 'deleteConversationFlow',
    inputSchema: DeleteConversationInputSchema,
    outputSchema: z.object({ success: z.boolean() }),
  },
  async ({ conversationId, actor }) => {
    try {
      return await pulseService.deleteConversation({ conversationId, actor });
    } catch (error) {
      console.error('Erro ao deletar conversa:', error);
      return { success: false };
    }
  }
);

export async function deleteConversation(input: z.infer<typeof DeleteConversationInputSchema>): Promise<{ success: boolean }> {
  return deleteConversationFlow(input);
}
    

    