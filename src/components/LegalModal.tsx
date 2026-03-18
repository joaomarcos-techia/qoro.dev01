import { useEffect } from "react";
import { IconX } from "@tabler/icons-react";

interface LegalModalProps {
  type: "privacy" | "terms" | null;
  onClose: () => void;
}

const h2Class = "text-xl font-bold text-white mt-8 mb-3";
const h3Class = "text-base font-semibold text-white mt-6 mb-2";
const pClass = "text-sm text-white/70 leading-relaxed mb-4";
const tableClass =
  "w-full text-xs sm:text-sm text-white/70 border-collapse mb-6 [&_th]:text-left [&_th]:text-white [&_th]:font-semibold [&_th]:p-1.5 sm:[&_th]:p-2 [&_th]:border [&_th]:border-neutral-700 [&_th]:bg-neutral-800/50 [&_td]:p-1.5 sm:[&_td]:p-2 [&_td]:border [&_td]:border-neutral-700";
const ulClass = "list-disc list-inside text-sm text-white/70 space-y-1 mb-4";
const strongClass = "text-white font-semibold";

function PrivacyContent() {
  return (
    <>
      <p className={pClass}>
        <strong className={strongClass}>Última atualização:</strong> 16 de março
        de 2026
      </p>

      <h2 className={h2Class}>1. Introdução</h2>
      <p className={pClass}>
        A <strong className={strongClass}>Qoro</strong> ("Empresa", "nós"),
        comprometida com a transparência e a proteção de dados, elaborou esta
        Política de Privacidade para informar como coletamos, utilizamos,
        armazenamos e protegemos os dados pessoais dos Usuários da plataforma{" "}
        <strong className={strongClass}>Clínica</strong> ("Plataforma").
      </p>
      <p className={pClass}>
        Esta Política é regida pela{" "}
        <strong className={strongClass}>
          Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)
        </strong>
        , pelo{" "}
        <strong className={strongClass}>
          Código de Defesa do Consumidor (Lei nº 8.078/1990)
        </strong>{" "}
        e pela regulamentação setorial de saúde aplicável.
      </p>

      <h2 className={h2Class}>2. Definições</h2>
      <table className={tableClass}>
        <thead>
          <tr>
            <th>Termo</th>
            <th>Definição</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong className={strongClass}>Dado Pessoal</strong>
            </td>
            <td>
              Informação que identifica ou torna identificável uma pessoa natural
              (LGPD, art. 5º, I)
            </td>
          </tr>
          <tr>
            <td>
              <strong className={strongClass}>Dado Sensível</strong>
            </td>
            <td>
              Dado pessoal sobre saúde, origem racial, convicção religiosa, dado
              genético, biométrico, entre outros (LGPD, art. 5º, II)
            </td>
          </tr>
          <tr>
            <td>
              <strong className={strongClass}>Titular</strong>
            </td>
            <td>Pessoa natural a quem os dados se referem</td>
          </tr>
          <tr>
            <td>
              <strong className={strongClass}>Controlador</strong>
            </td>
            <td>A Empresa — quem decide sobre o tratamento dos dados</td>
          </tr>
          <tr>
            <td>
              <strong className={strongClass}>Operador</strong>
            </td>
            <td>Terceiros que tratam dados em nome do Controlador</td>
          </tr>
          <tr>
            <td>
              <strong className={strongClass}>DPO/Encarregado</strong>
            </td>
            <td>
              Responsável pela comunicação entre Controlador, titulares e ANPD
            </td>
          </tr>
        </tbody>
      </table>

      <h2 className={h2Class}>3. Dados que Coletamos</h2>
      <h3 className={h3Class}>
        3.1 Dados de Profissionais de Saúde e Funcionários
      </h3>
      <ul className={ulClass}>
        <li>Nome completo, CPF, e-mail e telefone</li>
        <li>Número de registro profissional (CRM, CRO, CRP, etc.)</li>
        <li>Dados de acesso (login, hash de senha, tokens de sessão)</li>
        <li>
          Logs de ações realizadas na Plataforma (trilha de auditoria)
        </li>
        <li>Endereço IP e informações do dispositivo</li>
      </ul>

      <h3 className={h3Class}>3.2 Dados de Pacientes</h3>
      <ul className={ulClass}>
        <li>
          Identificação: nome completo, CPF (armazenado com hash), data de
          nascimento, sexo
        </li>
        <li>Contato: e-mail, telefone, endereço</li>
        <li>
          Dados de saúde (sensíveis): anamnese, diagnósticos (CID-10),
          prescrições, exames, histórico de consultas, prontuário eletrônico
        </li>
        <li>
          Dados financeiros: histórico de pagamentos, plano de saúde,
          informações de faturamento
        </li>
        <li>
          Comunicações via WhatsApp: mensagens trocadas com o assistente de IA
          da clínica
        </li>
      </ul>

      <h3 className={h3Class}>3.3 Dados Coletados Automaticamente</h3>
      <ul className={ulClass}>
        <li>Logs de acesso (data, hora, IP, dispositivo)</li>
        <li>Cookies de sessão (httpOnly, sem rastreamento entre sites)</li>
        <li>Métricas de uso para melhoria do sistema</li>
      </ul>

      <h2 className={h2Class}>4. Finalidade e Base Legal do Tratamento</h2>
      <table className={tableClass}>
        <thead>
          <tr>
            <th>Finalidade</th>
            <th>Dados</th>
            <th>Base Legal (LGPD)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Autenticação e controle de acesso</td>
            <td>Credenciais, IP, device</td>
            <td>Legítimo interesse (art. 7º, IX)</td>
          </tr>
          <tr>
            <td>Prestação de serviços de saúde</td>
            <td>Prontuário, diagnósticos, prescrições</td>
            <td>Tutela da saúde (art. 11, II, f)</td>
          </tr>
          <tr>
            <td>Agendamento de consultas</td>
            <td>Nome, telefone, preferências</td>
            <td>Execução de contrato (art. 7º, V)</td>
          </tr>
          <tr>
            <td>Comunicação via WhatsApp/IA</td>
            <td>Mensagens, telefone</td>
            <td>Execução de contrato (art. 7º, V)</td>
          </tr>
          <tr>
            <td>Faturamento e financeiro</td>
            <td>CPF, plano de saúde, pagamentos</td>
            <td>Execução de contrato (art. 7º, V)</td>
          </tr>
          <tr>
            <td>Cumprimento de obrigações legais</td>
            <td>Prontuário, notas fiscais</td>
            <td>Obrigação legal (art. 7º, II)</td>
          </tr>
          <tr>
            <td>Auditoria e segurança</td>
            <td>Logs de ação</td>
            <td>Legítimo interesse (art. 7º, IX)</td>
          </tr>
          <tr>
            <td>Melhoria da Plataforma</td>
            <td>Métricas anonimizadas</td>
            <td>Legítimo interesse (art. 7º, IX)</td>
          </tr>
        </tbody>
      </table>
      <p className={pClass}>
        <strong className={strongClass}>Dados sensíveis de saúde</strong> são
        tratados exclusivamente com base no{" "}
        <strong className={strongClass}>art. 11, II, alínea "f"</strong> da LGPD
        (tutela da saúde, por profissionais de saúde ou autoridades sanitárias).
      </p>

      <h2 className={h2Class}>5. Dados de Menores</h2>
      <p className={pClass}>
        Dados de pacientes menores de 18 anos somente são coletados e tratados
        mediante:
      </p>
      <ul className={ulClass}>
        <li>Consentimento expresso do responsável legal</li>
        <li>Presença do responsável no cadastro do paciente</li>
        <li>
          Respeito ao{" "}
          <strong className={strongClass}>
            Estatuto da Criança e do Adolescente (ECA — Lei nº 8.069/1990)
          </strong>
        </li>
      </ul>

      <h2 className={h2Class}>6. Compartilhamento de Dados</h2>
      <h3 className={h3Class}>6.1 Com Quem Compartilhamos</h3>
      <ul className={ulClass}>
        <li>
          <strong className={strongClass}>Clínica contratante:</strong> acesso
          integral aos dados de seus pacientes e colaboradores
        </li>
        <li>
          <strong className={strongClass}>
            Operadores de infraestrutura:
          </strong>{" "}
          Google Cloud / Firebase (armazenamento, autenticação)
        </li>
        <li>
          <strong className={strongClass}>Z-API:</strong> processamento de
          mensagens WhatsApp
        </li>
        <li>
          <strong className={strongClass}>Google (Gemini AI):</strong>{" "}
          processamento de mensagens para o assistente de IA
        </li>
        <li>
          <strong className={strongClass}>Autoridades públicas:</strong>{" "}
          mediante determinação legal ou ordem judicial
        </li>
      </ul>

      <h3 className={h3Class}>6.2 Não Compartilhamos</h3>
      <ul className={ulClass}>
        <li>Dados de pacientes com fins publicitários</li>
        <li>Dados com seguradoras sem consentimento prévio do paciente</li>
        <li>Dados com terceiros não relacionados à prestação do serviço</li>
      </ul>

      <h3 className={h3Class}>6.3 Transferência Internacional</h3>
      <p className={pClass}>
        Dados podem ser transferidos para servidores fora do Brasil (ex.: Google
        Cloud). Garantimos que esses provedores adotam medidas de segurança
        equivalentes às exigidas pela LGPD, conforme art. 33 da Lei.
      </p>

      <h2 className={h2Class}>7. Segurança dos Dados</h2>
      <table className={tableClass}>
        <thead>
          <tr>
            <th>Medida</th>
            <th>Descrição</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong className={strongClass}>Criptografia em repouso</strong>
            </td>
            <td>Dados sensíveis criptografados com AES-256-GCM</td>
          </tr>
          <tr>
            <td>
              <strong className={strongClass}>Criptografia em trânsito</strong>
            </td>
            <td>TLS 1.3 em todas as comunicações</td>
          </tr>
          <tr>
            <td>
              <strong className={strongClass}>Hash de CPF</strong>
            </td>
            <td>CPF armazenado apenas como hash irreversível</td>
          </tr>
          <tr>
            <td>
              <strong className={strongClass}>Autenticação segura</strong>
            </td>
            <td>Cookies httpOnly, sessões com expiração</td>
          </tr>
          <tr>
            <td>
              <strong className={strongClass}>Controle de acesso</strong>
            </td>
            <td>Perfis com permissões mínimas necessárias</td>
          </tr>
          <tr>
            <td>
              <strong className={strongClass}>Trilha de auditoria</strong>
            </td>
            <td>Registro imutável de todas as ações críticas</td>
          </tr>
          <tr>
            <td>
              <strong className={strongClass}>Rate limiting</strong>
            </td>
            <td>Proteção contra ataques de força bruta e spam</td>
          </tr>
          <tr>
            <td>
              <strong className={strongClass}>Anti-enumeração</strong>
            </td>
            <td>Fluxo de autenticação que não revela existência de cadastros</td>
          </tr>
        </tbody>
      </table>

      <h2 className={h2Class}>8. Retenção de Dados</h2>
      <table className={tableClass}>
        <thead>
          <tr>
            <th>Tipo de Dado</th>
            <th>Prazo de Retenção</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Prontuário médico</td>
            <td>Mínimo 20 anos (CFM Resolução 1.821/2007)</td>
          </tr>
          <tr>
            <td>Dados fiscais e financeiros</td>
            <td>5 anos (Código Tributário Nacional)</td>
          </tr>
          <tr>
            <td>Logs de auditoria</td>
            <td>5 anos</td>
          </tr>
          <tr>
            <td>Dados de acesso (IP, sessões)</td>
            <td>6 meses</td>
          </tr>
          <tr>
            <td>Mensagens WhatsApp/IA</td>
            <td>2 anos ou conforme solicitação do paciente</td>
          </tr>
          <tr>
            <td>Dados de conta (após encerramento)</td>
            <td>90 dias, depois anonimizados ou excluídos</td>
          </tr>
        </tbody>
      </table>
      <p className={pClass}>
        Após o prazo legal, os dados são{" "}
        <strong className={strongClass}>
          anonimizados ou excluídos de forma segura
        </strong>
        .
      </p>

      <h2 className={h2Class}>9. Direitos dos Titulares</h2>
      <p className={pClass}>
        Em conformidade com o <strong className={strongClass}>art. 18 da LGPD</strong>,
        o titular tem direito a:
      </p>
      <table className={tableClass}>
        <thead>
          <tr>
            <th>Direito</th>
            <th>Como Exercer</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Confirmação de tratamento</td>
            <td>Solicitação ao DPO</td>
          </tr>
          <tr>
            <td>Acesso aos dados</td>
            <td>Portal do paciente ou solicitação ao DPO</td>
          </tr>
          <tr>
            <td>Correção de dados</td>
            <td>Portal do paciente ou solicitação ao DPO</td>
          </tr>
          <tr>
            <td>Anonimização, bloqueio ou eliminação</td>
            <td>Solicitação ao DPO</td>
          </tr>
          <tr>
            <td>Portabilidade</td>
            <td>Solicitação ao DPO — exportação em formato estruturado</td>
          </tr>
          <tr>
            <td>Eliminação dos dados por consentimento</td>
            <td>Solicitação ao DPO</td>
          </tr>
          <tr>
            <td>Revogação do consentimento</td>
            <td>Solicitação ao DPO</td>
          </tr>
          <tr>
            <td>Revisão de decisões automatizadas</td>
            <td>Solicitação ao DPO</td>
          </tr>
        </tbody>
      </table>

      <h3 className={h3Class}>Como Exercer os Direitos</h3>
      <ul className={ulClass}>
        <li>
          <strong className={strongClass}>E-mail:</strong> dpo@qoro.com.br
        </li>
        <li>
          <strong className={strongClass}>Portal do Paciente:</strong> seção
          "Meus Dados / LGPD"
        </li>
        <li>
          <strong className={strongClass}>Prazo de resposta:</strong> até 15
          dias úteis
        </li>
      </ul>

      <h2 className={h2Class}>10. Cookies</h2>
      <p className={pClass}>
        A Plataforma utiliza apenas cookies estritamente necessários para o
        funcionamento:
      </p>
      <table className={tableClass}>
        <thead>
          <tr>
            <th>Cookie</th>
            <th>Finalidade</th>
            <th>Tipo</th>
            <th>Validade</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code className="text-xs bg-neutral-800 px-1 rounded">
                __session
              </code>
            </td>
            <td>Autenticação e controle de sessão</td>
            <td>httpOnly, Secure</td>
            <td>8h / 30 dias</td>
          </tr>
        </tbody>
      </table>
      <p className={pClass}>
        <strong className={strongClass}>Não utilizamos</strong> cookies de
        rastreamento, publicidade ou analytics de terceiros.
      </p>

      <h2 className={h2Class}>
        11. Inteligência Artificial e Decisões Automatizadas
      </h2>
      <h3 className={h3Class}>11.1 Assistente WhatsApp</h3>
      <p className={pClass}>
        O assistente de IA (Google Gemini) processa mensagens de pacientes para
        identificar intenção (agendamento, cancelamento, dúvidas), sugerir
        horários disponíveis e confirmar ou cancelar consultas.
      </p>
      <h3 className={h3Class}>11.2 Supervisão Humana</h3>
      <p className={pClass}>
        Todas as interações são registradas e podem ser revisadas pelos
        responsáveis da clínica. O paciente pode solicitar atendimento humano a
        qualquer momento.
      </p>
      <h3 className={h3Class}>11.3 Ausência de Perfilamento Discriminatório</h3>
      <p className={pClass}>
        A IA não realiza perfilamento com base em dados sensíveis para fins
        discriminatórios. Diagnósticos e decisões clínicas são exclusivamente
        responsabilidade do profissional de saúde.
      </p>

      <h2 className={h2Class}>12. Alterações nesta Política</h2>
      <p className={pClass}>
        Podemos atualizar esta Política periodicamente. Alterações relevantes
        serão comunicadas por e-mail e notificação na Plataforma com
        antecedência mínima de{" "}
        <strong className={strongClass}>15 dias</strong>.
      </p>

      <h2 className={h2Class}>13. Legislação e Regulação Aplicável</h2>
      <ul className={ulClass}>
        <li>LGPD — Lei nº 13.709/2018</li>
        <li>Marco Civil da Internet — Lei nº 12.965/2014</li>
        <li>CFM Resolução 1.821/2007 — Prontuário eletrônico</li>
        <li>CFM Resolução 2.299/2021 — Telemedicina e registros digitais</li>
        <li>RDC ANVISA nº 63/2011 — Regulação de serviços de saúde</li>
        <li>Lei nº 9.656/1998 — Planos de saúde</li>
      </ul>

      <p className="text-xs text-white/40 mt-8 italic">
        Esta Política de Privacidade deve ser lida em conjunto com os Termos de
        Uso.
      </p>
    </>
  );
}

function TermsContent() {
  return (
    <>
      <p className={pClass}>
        <strong className={strongClass}>Última atualização:</strong> 16 de março
        de 2026
      </p>

      <h2 className={h2Class}>1. Aceitação dos Termos</h2>
      <p className={pClass}>
        Ao acessar ou utilizar a plataforma da{" "}
        <strong className={strongClass}>Qoro</strong>, você ("Usuário") concorda
        integralmente com estes Termos de Uso. Caso não concorde com qualquer
        disposição, interrompa imediatamente o uso da Plataforma.
      </p>
      <p className={pClass}>
        Estes termos constituem um contrato vinculante entre o Usuário e a{" "}
        <strong className={strongClass}>Qoro</strong> ("Empresa"), pessoa
        jurídica de direito privado, inscrita no CNPJ sob o nº{" "}
        <strong className={strongClass}>61.698.053/0001-12</strong>.
      </p>

      <h2 className={h2Class}>2. Descrição do Serviço</h2>
      <p className={pClass}>
        A Plataforma é um sistema de gestão clínica que oferece:
      </p>
      <ul className={ulClass}>
        <li>Gestão de agendamentos e prontuários eletrônicos</li>
        <li>Comunicação entre profissionais de saúde e pacientes</li>
        <li>Processamento financeiro e faturamento</li>
        <li>
          Atendimento via WhatsApp com suporte de inteligência artificial
        </li>
      </ul>

      <h2 className={h2Class}>3. Cadastro e Conta de Usuário</h2>
      <h3 className={h3Class}>3.1 Elegibilidade</h3>
      <ul className={ulClass}>
        <li>
          Profissionais de saúde devidamente registrados nos respectivos
          conselhos (CRM, CRO, CRP, etc.)
        </li>
        <li>Estabelecimentos de saúde legalmente constituídos</li>
        <li>
          Pacientes maiores de 18 anos ou menores devidamente representados
        </li>
      </ul>

      <h3 className={h3Class}>3.2 Responsabilidades do Usuário</h3>
      <ul className={ulClass}>
        <li>
          Fornecer informações verdadeiras, precisas e completas no cadastro
        </li>
        <li>Manter a confidencialidade de suas credenciais de acesso</li>
        <li>
          Notificar imediatamente a Empresa sobre qualquer uso não autorizado
        </li>
        <li>Todos os atos realizados com suas credenciais</li>
      </ul>

      <h3 className={h3Class}>3.3 Perfis de Acesso</h3>
      <p className={pClass}>
        A Plataforma possui diferentes níveis de acesso (admin, gestor, médico,
        atendente, financeiro), cada um com permissões específicas definidas pela
        clínica contratante. O acesso indevido a funcionalidades além do perfil
        atribuído é expressamente proibido.
      </p>

      <h2 className={h2Class}>4. Uso Permitido</h2>
      <ul className={ulClass}>
        <li>
          Fins legítimos relacionados à prestação ou recebimento de serviços de
          saúde
        </li>
        <li>
          Atividades em conformidade com a legislação brasileira vigente
        </li>
        <li>Fins autorizados pela clínica à qual está vinculado</li>
      </ul>

      <h2 className={h2Class}>5. Uso Proibido</h2>
      <ul className={ulClass}>
        <li>Compartilhar credenciais de acesso com terceiros</li>
        <li>
          Acessar dados de pacientes além do necessário para o atendimento
        </li>
        <li>
          Exportar, copiar ou armazenar dados de pacientes em sistemas não
          autorizados
        </li>
        <li>Inserir dados falsos nos prontuários</li>
        <li>
          Tentar contornar mecanismos de segurança ou controle de acesso
        </li>
        <li>Utilizar a Plataforma para fins comerciais não autorizados</li>
        <li>Praticar qualquer ato que viole o sigilo profissional</li>
        <li>
          Realizar engenharia reversa, descompilar ou modificar qualquer parte
          do sistema
        </li>
      </ul>

      <h2 className={h2Class}>6. Dados de Saúde e Sigilo</h2>
      <h3 className={h3Class}>6.1 Dados Sensíveis</h3>
      <p className={pClass}>
        Os dados de saúde são classificados como{" "}
        <strong className={strongClass}>dados pessoais sensíveis</strong> pela
        LGPD e gozam de proteção especial.
      </p>
      <h3 className={h3Class}>6.2 Sigilo Profissional</h3>
      <p className={pClass}>
        O uso da Plataforma não exime os profissionais de saúde do cumprimento
        das obrigações de sigilo previstas nos respectivos códigos de ética
        profissional e na legislação vigente.
      </p>
      <h3 className={h3Class}>6.3 Prontuário Eletrônico</h3>
      <p className={pClass}>
        Os prontuários eletrônicos gerados na Plataforma seguem as diretrizes da{" "}
        <strong className={strongClass}>CFM Resolução 1.821/2007</strong> e do{" "}
        <strong className={strongClass}>CFM Resolução 2.299/2021</strong>.
      </p>

      <h2 className={h2Class}>7. Propriedade Intelectual</h2>
      <h3 className={h3Class}>7.1 Titularidade</h3>
      <p className={pClass}>
        Todo o conteúdo da Plataforma é de propriedade exclusiva da Empresa e
        protegido pela Lei nº 9.610/1998 e Lei nº 9.279/1996.
      </p>
      <h3 className={h3Class}>7.2 Licença de Uso</h3>
      <p className={pClass}>
        A Empresa concede ao Usuário uma licença limitada, não exclusiva,
        intransferível e revogável para uso da Plataforma.
      </p>
      <h3 className={h3Class}>7.3 Dados do Usuário</h3>
      <p className={pClass}>
        Os dados inseridos pelo Usuário permanecem de titularidade da clínica
        contratante. A Empresa não reivindica propriedade sobre esses dados.
      </p>

      <h2 className={h2Class}>8. Disponibilidade e Manutenção</h2>
      <p className={pClass}>
        Meta de uptime de{" "}
        <strong className={strongClass}>99,5%</strong> ao mês. Manutenções
        programadas comunicadas com antecedência mínima de 24 horas.
      </p>

      <h2 className={h2Class}>9. Inteligência Artificial</h2>
      <h3 className={h3Class}>9.1 Assistente de Agendamento</h3>
      <p className={pClass}>
        A Plataforma utiliza inteligência artificial (Google Gemini) para
        auxiliar no atendimento via WhatsApp.
      </p>
      <h3 className={h3Class}>9.2 Limitações</h3>
      <p className={pClass}>
        O assistente de IA{" "}
        <strong className={strongClass}>não substitui</strong> o julgamento
        clínico do profissional de saúde. Nenhuma informação gerada pela IA deve
        ser interpretada como diagnóstico, prescrição ou conselho médico.
      </p>
      <h3 className={h3Class}>9.3 Supervisão Humana</h3>
      <p className={pClass}>
        Toda interação via IA está sujeita à supervisão e pode ser revisada
        pelos responsáveis da clínica.
      </p>

      <h2 className={h2Class}>10. Rescisão</h2>
      <p className={pClass}>
        O Usuário pode encerrar sua conta a qualquer momento. A Empresa pode
        suspender o acesso em caso de violação destes Termos, prática de atos
        ilícitos ou risco à segurança de dados.
      </p>

      <h2 className={h2Class}>11. Limitação de Responsabilidade</h2>
      <p className={pClass}>
        A responsabilidade total da Empresa não excederá o valor pago pelo
        Usuário nos últimos 3 meses de uso da Plataforma.
      </p>

      <h2 className={h2Class}>12. Alterações nos Termos</h2>
      <p className={pClass}>
        Alterações relevantes serão notificadas com antecedência mínima de 15
        dias via e-mail ou notificação na Plataforma.
      </p>

      <p className="text-xs text-white/40 mt-8 italic">
        Estes Termos de Uso devem ser lidos em conjunto com a Política de
        Privacidade.
      </p>
    </>
  );
}

export default function LegalModal({ type, onClose }: LegalModalProps) {
  useEffect(() => {
    if (!type) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [type, onClose]);

  if (!type) return null;

  const title =
    type === "privacy" ? "Política de Privacidade" : "Termos de Uso";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 pt-[3vh] sm:pt-[5vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[94vh] sm:max-h-[90vh] rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 border-b border-neutral-800 shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors cursor-pointer p-1"
            aria-label="Fechar"
          >
            <IconX className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
          {type === "privacy" ? <PrivacyContent /> : <TermsContent />}
        </div>
      </div>
    </div>
  );
}
