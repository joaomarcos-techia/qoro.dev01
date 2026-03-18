import { Timeline } from "@/components/ui/timeline";

const checkClass =
  "flex gap-2 items-center text-neutral-300 text-xs md:text-sm";

const data = [
  {
    title: "Passo 1",
    content: (
      <div>
        <h4 className="text-white text-base md:text-lg font-semibold mb-3">
          Fale com a gente
        </h4>
        <p className="text-neutral-200 text-xs md:text-sm font-normal mb-6">
          Entre em contato e configuramos tudo para você. Cadastro da clínica,
          equipe médica e agenda — sem complicação, sem consultoria cara.
        </p>
        <div className="space-y-1">
          <div className={checkClass}>✓ Cadastro da clínica e equipe</div>
          <div className={checkClass}>✓ Configuração da agenda</div>
          <div className={checkClass}>✓ Personalização do atendimento</div>
        </div>
      </div>
    ),
  },
  {
    title: "Passo 2",
    content: (
      <div>
        <h4 className="text-white text-base md:text-lg font-semibold mb-3">
          Conecte o WhatsApp
        </h4>
        <p className="text-neutral-200 text-xs md:text-sm font-normal mb-6">
          Escaneie um QR Code e o número da clínica fica integrado ao sistema.
          Seus pacientes começam a ser atendidos automaticamente.
        </p>
        <div className="space-y-1">
          <div className={checkClass}>✓ Integração via QR Code</div>
          <div className={checkClass}>✓ Número da clínica conectado</div>
          <div className={checkClass}>✓ Atendimento automático ativo</div>
        </div>
      </div>
    ),
  },
  {
    title: "Passo 3",
    content: (
      <div>
        <h4 className="text-white text-base md:text-lg font-semibold mb-3">
          Ative o agente de IA
        </h4>
        <p className="text-neutral-200 text-xs md:text-sm font-normal mb-6">
          O agente agenda, confirma, responde dúvidas e envia lembretes — 24
          horas por dia, sem intervenção humana. Sua clínica nunca mais perde
          um paciente.
        </p>
        <div className="space-y-1">
          <div className={checkClass}>✓ Agendamento automático</div>
          <div className={checkClass}>✓ Confirmações e lembretes</div>
          <div className={checkClass}>✓ Respostas inteligentes 24/7</div>
        </div>
      </div>
    ),
  },
];

export default function TimelineSection() {
  return <Timeline data={data} />;
}
