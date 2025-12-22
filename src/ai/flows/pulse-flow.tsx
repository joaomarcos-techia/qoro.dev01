
'use server';

import { ai as aiPromise, googleAI } from '@/ai/genkit';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { AskPulseInputSchema, AskPulseOutputSchema, PulseMessage } from '@/ai/schemas';

export type { AskPulseInput, AskPulseOutput, PulseMessage } from '@/ai/schemas';

const roleMap: Record<PulseMessage['role'], 'user' | 'model'> = {
  user: 'user',
  assistant: 'model',
  model: 'model',
  tool: 'user',
};

// Define o schema Zod para a saída estruturada da IA
const AiStructuredOutputSchema = z.object({
  suggestedTitle: z.string().describe("Um título curto e conciso de 2 a 3 palavras para a conversa."),
  response: z.string().describe("A resposta completa e formatada para o usuário."),
});

const pulseFlowPromise = aiPromise.then(ai => ai.defineFlow(
  {
    name: 'pulseFlow',
    inputSchema: AskPulseInputSchema,
    outputSchema: AskPulseOutputSchema,
  },
  async (input: z.infer<typeof AskPulseInputSchema>) => {
    const { actor, messages, conversationId: existingConvId } = input;
    const userId = actor;

    const userMessages = messages.filter(m => m.role === 'user');
    const isNewConversation = !existingConvId || existingConvId === 'new';
    
    // Condição para gerar título: apenas em conversas novas e na segunda mensagem do usuário.
    const shouldGenerateTitle = isNewConversation && userMessages.length === 2;

    const systemPrompt = `
<OBJETIVO>
Você é QoroPulse, um agente de IA especialista em gestão empresarial. Sua missão é fornecer suporte estratégico em vendas, RH, marketing, finanças e gestão.
</OBJETIVO>

<INSTRUCOES_DE_SAIDA>
Sua resposta DEVE ser um objeto JSON contendo duas chaves: "suggestedTitle" and "response".
1.  "response": Esta chave conterá sua resposta completa e formatada em Markdown para o usuário, seguindo as diretrizes de estilo e conteúdo.
2.  "suggestedTitle": ${shouldGenerateTitle ? 'Baseado no diálogo até agora, gere um título curto e conciso de 2 a 3 palavras que resuma o tópico principal. Este título deve ser direto e informativo (ex: "Aumentar Vendas B2B", "Melhorar Fluxo de Caixa", "Engajamento da Equipe").' : 'Retorne uma string vazia ("").'}

</INSTRUCOES_DE_SAIDA>

<ESTILO_E_CONTEUDO_DA_RESPOSTA>
- Tom: consultivo, claro, humano e motivador.
- Linguagem: simples, acessível, mas profissional. Evitar jargões técnicos sem explicação.
- Estrutura: Use Markdown de forma clara e profissional (títulos, listas, negrito) para máxima legibilidade.
- Proatividade: Sempre finalize oferecendo um próximo passo ou aprofundamento.
- Frameworks: Utilize frameworks conhecidos (AIDA, SPIN, OKR, SMART, DRE, etc.) quando aplicável para enriquecer a resposta.
</ESTILO_E_CONTEUDO_DA_RESPOSTA>

<EXEMPLO_SAIDA_JSON>
{
  "suggestedTitle": "Otimizar Processo de Vendas",
  "response": "Olá! Entendi que você quer otimizar seu processo de vendas. Uma ótima abordagem é usar o framework AIDA (Atenção, Interesse, Desejo, Ação). Vamos detalhar cada etapa.\\n\\n**1. Atenção:** Como você está capturando a atenção inicial dos seus potenciais clientes?... (continuação da resposta)"
}
</EXEMPLO_SAIDA_JSON>
`.trim();

    const conversationHistory = messages.map(m => ({
      role: roleMap[m.role] || 'user',
      content: [{ text: m.content ?? '' }],
    }));

    let aiOutput;
    try {
      const result = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        system: systemPrompt,
        messages: conversationHistory,
        config: { temperature: 0.5 },
        output: { format: 'json', schema: AiStructuredOutputSchema },
      });
      aiOutput = result.output;

      if (!aiOutput) {
        throw new Error("A IA não retornou uma saída estruturada válida.");
      }

    } catch (err: any) {
      throw new Error(`Falha ao gerar resposta da IA: ${err.message || 'Erro desconhecido'}`);
    }

    const responseMessage: PulseMessage = { role: 'assistant', content: aiOutput.response };
    const finalMessages = [...messages, responseMessage];

    let conversationId = existingConvId;
    let finalTitle = "Nova conversa";

    try {
      if (conversationId && conversationId !== 'new') {
        const conversationRef = adminDb.collection('pulse_conversations').doc(conversationId);
        const docSnap = await conversationRef.get();
        if (!docSnap.exists) {
            throw new Error(`Conversa com ID ${conversationId} não encontrada.`);
        }
        
        const existingData = docSnap.data()!;
        
        // Se o título existente for "Nova conversa" e a IA sugeriu um novo, atualiza. Senão, mantém o antigo.
        const titleToSave = existingData.title === 'Nova conversa' && aiOutput.suggestedTitle
            ? aiOutput.suggestedTitle 
            : existingData.title;

        await conversationRef.update({
          messages: finalMessages.map(m => ({ ...m })),
          title: titleToSave,
          updatedAt: FieldValue.serverTimestamp(),
        });
        finalTitle = titleToSave; // Garante que o título retornado para a UI é o que foi salvo

      } else {
        const newConversationData = {
          userId,
          title: finalTitle, // Salva "Nova conversa" na criação
          messages: finalMessages.map(m => ({ ...m })),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };
        const addedRef = await adminDb.collection('pulse_conversations').add(newConversationData);
        conversationId = addedRef.id;
      }
    } catch (dbError) {
      throw new Error("Falha ao salvar a conversa no banco de dados.");
    }
    
    if (!conversationId) {
        throw new Error("Não foi possível obter um ID para a conversa.");
    }

    return { response: responseMessage, conversationId, title: finalTitle };
  }
));

export async function askPulse(
  input: z.infer<typeof AskPulseInputSchema>
): Promise<z.infer<typeof AskPulseOutputSchema>> {
  const pulseFlow = await pulseFlowPromise;
  return pulseFlow(input);
}
