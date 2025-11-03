
'use client';

import React from 'react';

export function PrivacyPolicyText() {
  return (
    <div className="space-y-4 text-gray-300">
      <p>
        <strong>Última atualização:</strong> 1º de agosto de 2024
      </p>
      <p>
        A sua privacidade é a nossa prioridade. Esta Política de Privacidade explica como o Qoro ("nós", "nosso") coleta, usa, armazena e protege suas informações quando você utiliza nossa plataforma.
      </p>
      
      <h2 className="text-xl font-bold text-white pt-4">1. Informações que Coletamos</h2>
      <p>
        Para fornecer nossos serviços, coletamos as seguintes informações:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Informações de Cadastro:</strong> Nome, e-mail, senha, nome da organização e CNPJ.</li>
        <li><strong>Informações de Pagamento:</strong> Ao assinar um plano pago, seus dados de pagamento são processados diretamente pelo nosso parceiro de pagamentos, Stripe. Não armazenamos os dados do seu cartão de crédito.</li>
        <li><strong>Dados de Uso da Plataforma:</strong> Informações sobre como você interage com nossos módulos (QoroCRM, QoroFinance, etc.), incluindo clientes, transações financeiras, tarefas e conversas com a IA (QoroPulse).</li>
        <li><strong>Dados Técnicos:</strong> Endereço IP, tipo de navegador e informações do dispositivo, coletados para garantir a segurança e a funcionalidade da plataforma.</li>
      </ul>

      <h2 className="text-xl font-bold text-white pt-4">2. Como Usamos Suas Informações</h2>
      <p>Utilizamos suas informações para:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Fornecer, manter e melhorar nossos serviços.</li>
        <li>Processar suas assinaturas e pagamentos.</li>
        <li>Personalizar sua experiência e fornecer suporte ao cliente.</li>
        <li>Comunicar informações importantes sobre sua conta e atualizações da plataforma.</li>
        <li>Garantir a segurança e prevenir fraudes.</li>
        <li>Treinar e aprimorar os modelos de inteligência artificial (de forma anonimizada e agregada).</li>
      </ul>
      
      <h2 className="text-xl font-bold text-white pt-4">3. Compartilhamento de Dados</h2>
      <p>Nós não vendemos suas informações pessoais. Podemos compartilhar seus dados com os seguintes parceiros, sob estritas obrigações de confidencialidade:</p>
       <ul className="list-disc pl-6 space-y-2">
        <li><strong>Google Cloud / Firebase:</strong> Para hospedar nossa infraestrutura, banco de dados e sistema de autenticação.</li>
        <li><strong>Stripe:</strong> Para processamento seguro de pagamentos.</li>
        <li><strong>Google AI Platform:</strong> Para alimentar as funcionalidades de inteligência artificial do QoroPulse.</li>
      </ul>
       <p>Também poderemos compartilhar informações se exigido por lei ou para proteger nossos direitos legais.</p>

      <h2 className="text-xl font-bold text-white pt-4">4. Segurança dos Dados</h2>
      <p>
        Empregamos as melhores práticas de segurança para proteger suas informações, incluindo criptografia em trânsito e em repouso, e controles de acesso rigorosos baseados na infraestrutura segura do Google.
      </p>

      <h2 className="text-xl font-bold text-white pt-4">5. Seus Direitos e Controle</h2>
      <p>Você tem o direito de acessar, corrigir ou excluir suas informações pessoais. Você pode gerenciar os dados da sua organização diretamente na plataforma ou entrar em contato conosco para solicitar a exclusão da sua conta e de todos os dados associados.</p>
      
       <h2 className="text-xl font-bold text-white pt-4">6. Alterações nesta Política</h2>
      <p>
        Podemos atualizar esta política periodicamente. Notificaremos você sobre quaisquer alterações significativas através da plataforma ou por e-mail.
      </p>

      <p className="pt-6">Se tiver alguma dúvida, entre em contato conosco pelo e-mail: <strong>contato@qoro.com</strong>.</p>
    </div>
  );
}
