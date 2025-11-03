
'use client';

import React from 'react';

export function TermsOfUseText() {
  return (
    <div className="space-y-4 text-gray-300">
      <p>
        <strong>Última atualização:</strong> 1º de agosto de 2024
      </p>
      <p>
        Bem-vindo ao Qoro! Estes Termos de Uso ("Termos") governam seu acesso e uso de nossa plataforma. Ao se cadastrar ou usar nossos serviços, você concorda com estes Termos.
      </p>
      
      <h2 className="text-xl font-bold text-white pt-4">1. Contas de Usuário</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Responsabilidade:</strong> Você é responsável por manter a segurança de sua conta e senha. O Qoro não pode e não será responsável por qualquer perda ou dano decorrente de sua falha em cumprir com esta obrigação de segurança.</li>
        <li><strong>Uso Autorizado:</strong> Você é responsável por todas as atividades que ocorrem em sua conta e por garantir que o uso da plataforma por seus usuários convidados esteja em conformidade com estes Termos.</li>
      </ul>

      <h2 className="text-xl font-bold text-white pt-4">2. Assinaturas e Pagamentos</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Faturamento:</strong> Os planos pagos são cobrados mensalmente, de forma antecipada. A assinatura será renovada automaticamente, a menos que seja cancelada.</li>
        <li><strong>Cancelamento:</strong> Você pode cancelar sua assinatura a qualquer momento através do portal de gerenciamento de assinaturas. O cancelamento entrará em vigor no final do ciclo de faturamento atual. Não há reembolso por períodos parciais.</li>
        <li><strong>Alterações de Preço:</strong> Reservamo-nos o direito de alterar os preços dos planos. Notificaremos você com pelo menos 30 dias de antecedência sobre quaisquer alterações.</li>
      </ul>

      <h2 className="text-xl font-bold text-white pt-4">3. Uso Aceitável da Plataforma</h2>
      <p>Você concorda em não usar o serviço para:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Enviar spam ou mensagens não solicitadas.</li>
        <li>Violar qualquer lei ou regulamento aplicável.</li>
        <li>Armazenar ou transmitir material ilegal, fraudulento ou prejudicial.</li>
        <li>Tentar obter acesso não autorizado à nossa plataforma ou sistemas relacionados.</li>
      </ul>

      <h2 className="text-xl font-bold text-white pt-4">4. Propriedade Intelectual</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Nossa Propriedade:</strong> A plataforma Qoro e todo o seu conteúdo (excluindo seus dados) são propriedade exclusiva do Qoro.</li>
        <li><strong>Sua Propriedade:</strong> Você retém todos os direitos e a propriedade sobre os dados que insere na plataforma ("Seus Dados"). Você nos concede uma licença limitada para usar, processar e exibir Seus Dados exclusivamente para fins de fornecimento e melhoria dos nossos serviços.</li>
      </ul>

      <h2 className="text-xl font-bold text-white pt-4">5. Limitação de Responsabilidade</h2>
      <p>
        O Qoro é fornecido "como está". Em nenhuma circunstância seremos responsáveis por quaisquer danos diretos, indiretos, incidentais ou consequenciais resultantes do uso ou da incapacidade de usar nossos serviços.
      </p>
      
      <h2 className="text-xl font-bold text-white pt-4">6. Encerramento</h2>
      <p>
        Podemos suspender ou encerrar sua conta se você violar estes Termos. Você pode encerrar sua conta a qualquer momento, cancelando sua assinatura e solicitando a exclusão dos dados.
      </p>

      <h2 className="text-xl font-bold text-white pt-4">7. Modificações nos Termos</h2>
      <p>
        Reservamo-nos o direito de modificar estes Termos a qualquer momento. Notificaremos você sobre mudanças significativas. O uso continuado da plataforma após as alterações constitui sua aceitação dos novos Termos.
      </p>
    </div>
  );
}
