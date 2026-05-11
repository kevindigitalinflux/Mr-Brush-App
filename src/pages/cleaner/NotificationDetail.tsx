import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useTranslation } from '../../lib/useTranslation'
import type { Language } from '../../lib/i18n'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Attachment {
  name: string
  meta: string
  type: 'pdf' | 'image'
}

interface NotifDetail {
  id: string
  senderName: string
  senderRole: Record<Language, string>
  initials: string
  avatarBg: string
  date: string
  subject: Record<Language, string>
  body: Record<Language, string[]>
  instructions?: {
    title: Record<Language, string>
    items: Record<Language, string[]>
  }
  signature: string
  attachments?: Attachment[]
}

// ─── Mock detail data — with translations per language ────────────────────────

const DETAIL_MAP: Record<string, NotifDetail> = {
  n1: {
    id: 'n1',
    senderName: 'Sarah Jenkins',
    senderRole: { en: 'Supervisor', es: 'Supervisora', pt: 'Supervisora' },
    initials: 'SJ', avatarBg: '#B8A77A', date: 'Today · 09:45 AM',
    subject: {
      en: 'Great Work — Lobby Standards',
      es: 'Excelente trabajo — Estándares del vestíbulo',
      pt: 'Ótimo trabalho — Padrões do lobby',
    },
    body: {
      en: [
        'Hi Team,',
        'I wanted to take a moment to acknowledge the exceptional work done on the 4th-floor lobby yesterday. The client specifically commented on how clean and well-presented the space was — this is exactly the standard we aim for.',
        'Just a reminder to restock the cleaning cart with microfibre cloths and glass cleaner before your next shift. The supply room on Level 2 has been replenished.',
      ],
      es: [
        'Hola equipo,',
        'Quería tomar un momento para reconocer el trabajo excepcional realizado en el vestíbulo del 4.º piso ayer. El cliente comentó específicamente lo limpio y bien presentado que estaba el espacio — este es exactamente el estándar al que aspiramos.',
        'Solo un recordatorio para reponer el carrito de limpieza con paños de microfibra y limpiador de vidrios antes de su próximo turno. El cuarto de suministros en el nivel 2 ha sido repuesto.',
      ],
      pt: [
        'Olá equipe,',
        'Queria reservar um momento para reconhecer o trabalho excepcional realizado no lobby do 4.º andar ontem. O cliente comentou especificamente como o espaço estava limpo e bem apresentado — este é exatamente o padrão que buscamos.',
        'Só um lembrete para reabastecer o carrinho de limpeza com panos de microfibra e limpa-vidros antes do próximo turno. A sala de suprimentos no nível 2 foi reabastecida.',
      ],
    },
    signature: 'S. Jenkins\nMr Brush & Co. | Supervisory Team',
  },
  n2: {
    id: 'n2',
    senderName: 'Alistair Sterling',
    senderRole: { en: 'Operations Manager', es: 'Gerente de Operaciones', pt: 'Gerente de Operações' },
    initials: 'AS', avatarBg: '#1A1C19', date: 'Oct 24, 2023 · 09:45 AM',
    subject: {
      en: 'Marble Flooring Maintenance: West Wing Lobby',
      es: 'Mantenimiento de suelos de mármol: Vestíbulo del Ala Oeste',
      pt: 'Manutenção de pisos de mármore: Lobby da Ala Oeste',
    },
    body: {
      en: [
        'Good morning, Team.',
        'We have received a specific request from the client regarding the new Italian marble installation in the West Wing Lobby. Please note that the standard acidic cleaning solution is strictly prohibited on this surface.',
        'Please confirm receipt of these instructions by marking this task as "Acknowledged" in your schedule view. If there are any concerns regarding the equipment availability in the West Wing closet, reach out to me directly before the 6:00 PM shift begins.',
      ],
      es: [
        'Buenos días, equipo.',
        'Hemos recibido una solicitud específica del cliente sobre la nueva instalación de mármol italiano en el vestíbulo del Ala Oeste. Tenga en cuenta que la solución de limpieza ácida estándar está estrictamente prohibida en esta superficie.',
        'Por favor confirme la recepción de estas instrucciones marcando esta tarea como «Reconocida» en su vista de horario. Si hay algún inconveniente con los equipos en el armario del Ala Oeste, comuníquese conmigo directamente antes de las 6:00 PM.',
      ],
      pt: [
        'Bom dia, equipe.',
        'Recebemos uma solicitação específica do cliente referente à nova instalação de mármore italiano no lobby da Ala Oeste. Observe que a solução de limpeza ácida padrão é estritamente proibida nesta superfície.',
        'Por favor confirme o recebimento dessas instruções marcando esta tarefa como «Confirmada» na sua visualização de agenda. Se houver algum problema com os equipamentos no armário da Ala Oeste, entre em contato comigo antes do início do turno das 18h.',
      ],
    },
    instructions: {
      title: {
        en: 'MANDATORY INSTRUCTIONS',
        es: 'INSTRUCCIONES OBLIGATORIAS',
        pt: 'INSTRUÇÕES OBRIGATÓRIAS',
      },
      items: {
        en: [
          "Use ONLY the neutral pH balance solution (labelled 'Heritage Gold 04').",
          'Microfibre pads must be changed every 500 square feet to prevent sediment scratching.',
          'Buffing speed should not exceed 150 RPM for the final polish.',
        ],
        es: [
          "Use SOLO la solución de pH neutro (etiquetada 'Heritage Gold 04').",
          'Los paños de microfibra deben cambiarse cada 500 pies cuadrados para evitar rasguños por sedimentos.',
          'La velocidad de pulido no debe superar 150 RPM para el pulido final.',
        ],
        pt: [
          "Use APENAS a solução de pH neutro (rotulada 'Heritage Gold 04').",
          'Os panos de microfibra devem ser trocados a cada 500 pés quadrados para evitar arranhões por sedimentos.',
          'A velocidade de polimento não deve exceder 150 RPM para o polimento final.',
        ],
      },
    },
    signature: 'A. Sterling\nMr Brush & Co. | Operations & Heritage Care',
    attachments: [
      { name: 'Marble_Care_Manual_v2.pdf', meta: '2.4 MB · PDF Document', type: 'pdf' },
      { name: 'West_Wing_Lobby_Grid.jpg',  meta: '1.1 MB · Image',        type: 'image' },
    ],
  },
  n3: {
    id: 'n3',
    senderName: 'Mark Thompson',
    senderRole: { en: 'Operations', es: 'Operaciones', pt: 'Operações' },
    initials: 'MT', avatarBg: '#434B4D', date: 'Yesterday · 03:12 PM',
    subject: {
      en: 'Supply Update — Stone Polish Delay',
      es: 'Actualización de suministros — Retraso del lustrador de piedra',
      pt: 'Atualização de suprimentos — Atraso no polidor de pedra',
    },
    body: {
      en: [
        'Hi all,',
        'Quick heads-up: the delivery of the specialised stone polish (Heritage Gold 03) has been delayed by approximately 5 working days due to a logistics issue with the supplier.',
        'In the meantime, please use the heritage wood wax on the library floor as a substitute. This has been approved by the site manager and will maintain the required finish.',
        "I'll send another update as soon as the delivery is rescheduled. Apologies for the short notice.",
      ],
      es: [
        'Hola a todos,',
        'Aviso rápido: la entrega del lustrador de piedra especializado (Heritage Gold 03) se ha retrasado aproximadamente 5 días hábiles debido a un problema logístico con el proveedor.',
        'Mientras tanto, use la cera de madera heritage en el suelo de la biblioteca como sustituto. Esto ha sido aprobado por el gerente del sitio y mantendrá el acabado requerido.',
        'Enviaré otra actualización tan pronto como se reprograme la entrega. Disculpe el aviso con tan poca antelación.',
      ],
      pt: [
        'Olá a todos,',
        'Aviso rápido: a entrega do polidor de pedra especializado (Heritage Gold 03) foi adiada em aproximadamente 5 dias úteis por um problema logístico com o fornecedor.',
        'Enquanto isso, use a cera de madeira heritage no piso da biblioteca como substituto. Isso foi aprovado pelo gerente do local e manterá o acabado exigido.',
        'Enviarei outra atualização assim que a entrega for remarcada. Desculpe o aviso com tão pouca antecedência.',
      ],
    },
    signature: 'M. Thompson\nMr Brush & Co. | Operations',
  },
  n4: {
    id: 'n4',
    senderName: 'System Alert',
    senderRole: { en: 'Automated Alert', es: 'Alerta Automática', pt: 'Alerta Automática' },
    initials: '!', avatarBg: '#BA1A1A', date: 'Today · 11:02 AM',
    subject: {
      en: 'Urgent: Water Leak — Utility Room 3B',
      es: 'Urgente: Fuga de agua — Sala de Servicios 3B',
      pt: 'Urgente: Vazamento de água — Sala de Utilidades 3B',
    },
    body: {
      en: [
        'This is an automated alert from the Mr Brush & Co. facilities monitoring system.',
        'A water leak has been reported in Utility Room 3B on the ground floor. Please proceed to the location immediately to assist with containment and report the situation to your supervisor.',
      ],
      es: [
        'Este es un aviso automático del sistema de monitoreo de instalaciones de Mr Brush & Co.',
        'Se ha reportado una fuga de agua en la Sala de Servicios 3B en la planta baja. Diríjase inmediatamente al lugar para ayudar con la contención e informe la situación a su supervisor.',
      ],
      pt: [
        'Este é um aviso automático do sistema de monitoramento de instalações da Mr Brush & Co.',
        'Foi reportado um vazamento de água na Sala de Utilidades 3B no térreo. Por favor vá imediatamente ao local para ajudar na contenção e reporte a situação ao seu supervisor.',
      ],
    },
    instructions: {
      title: {
        en: 'IMMEDIATE ACTIONS',
        es: 'ACCIONES INMEDIATAS',
        pt: 'AÇÕES IMEDIATAS',
      },
      items: {
        en: [
          'Proceed to Utility Room 3B on the ground floor immediately.',
          'Do not attempt any electrical repairs — isolate the area.',
          'Contact your supervisor on their direct line.',
          'Log the incident in the app under "Report Incident".',
        ],
        es: [
          'Diríjase inmediatamente a la Sala de Servicios 3B en la planta baja.',
          'No intente ninguna reparación eléctrica — aísle el área.',
          'Comuníquese con su supervisor en su línea directa.',
          'Registre el incidente en la app en «Reportar incidente».',
        ],
        pt: [
          'Dirija-se imediatamente à Sala de Utilidades 3B no térreo.',
          'Não tente nenhum reparo elétrico — isole a área.',
          'Entre em contato com seu supervisor na linha direta.',
          'Registre o incidente no app em «Reportar incidente».',
        ],
      },
    },
    signature: 'Mr Brush & Co. Facilities System',
  },
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckCircleSmall() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="flex-shrink-0 mt-0.5">
      <circle cx="12" cy="12" r="10" stroke="#B8A77A" strokeWidth="1.5" />
      <path d="M8 12l3 3 5-6" stroke="#B8A77A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PdfIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="2" width="14" height="18" rx="2" stroke="#B8A77A" strokeWidth="1.5" />
      <path d="M7 7h6M7 11h4" stroke="#B8A77A" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 6l4 4" stroke="#B8A77A" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 6h4v4" stroke="#B8A77A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="#B8A77A" strokeWidth="1.5" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="#B8A77A" />
      <path d="M3 16l5-5 4 4 2-2 4 4" stroke="#B8A77A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v13M7 13l5 5 5-5" stroke="#434844" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 20h18" stroke="#434844" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#434844" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" stroke="#434844" strokeWidth="2" />
    </svg>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SenderAvatar({ detail, size = 'sm' }: { detail: NotifDetail; size?: 'sm' | 'lg' }) {
  const dim = size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-sm'
  return (
    <div className={`${dim} rounded-full flex items-center justify-center flex-shrink-0`} style={{ backgroundColor: detail.avatarBg }}>
      <span className="font-['Poppins',sans-serif] font-semibold text-white">{detail.initials}</span>
    </div>
  )
}

function InstructionBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="border border-[#D0CFCA] rounded-[8px] p-4 bg-[#FAFAF6]">
      <p className="font-['Lato',sans-serif] font-bold text-[11px] tracking-[1.2px] text-[#6B5D36] uppercase mb-3">
        {title}
      </p>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <CheckCircleSmall />
            <span className="font-['Lato',sans-serif] text-sm text-[#434844] leading-[1.6]">{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AttachmentCard({ file }: { file: Attachment }) {
  const t = useTranslation()
  return (
    <div className="bg-white border border-[#D0CFCA] rounded-[10px] px-4 py-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-[8px] bg-[#F5F0E3] border border-[#D7C596]/40 flex items-center justify-center flex-shrink-0">
        {file.type === 'pdf' ? <PdfIcon /> : <ImageIcon />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-['Poppins',sans-serif] font-semibold text-sm text-[#1A1C19] truncate">{file.name}</p>
        <p className="font-['Lato',sans-serif] text-xs text-[#6B5D36] mt-0.5">{file.meta}</p>
      </div>
      <button
        aria-label={file.type === 'pdf' ? t('download') : t('view')}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F0EFE8] transition-colors"
      >
        {file.type === 'pdf' ? <DownloadIcon /> : <EyeIcon />}
      </button>
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

/** Full message view for a single notification. */
export function NotificationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { language } = useApp()
  const t = useTranslation()

  const detail = id ? DETAIL_MAP[id] : undefined

  if (!detail) {
    return (
      <div className="fixed inset-0 bg-[#F4F4EE] flex items-center justify-center">
        <p className="font-['Lato',sans-serif] text-[#434844]">Notification not found.</p>
      </div>
    )
  }

  const subject = detail.subject[language]
  const body = detail.body[language]
  const senderRole = detail.senderRole[language]

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <div className="w-full max-w-[480px] mx-auto pb-12">

        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-[#F4F4EE]/95 backdrop-blur-sm border-b border-[#E3E3DD] flex items-center justify-between px-6 h-16">
          <button
            onClick={() => navigate('/cleaner/notifications')}
            className="flex items-center gap-2 cursor-pointer"
            aria-label="Back to notifications"
          >
            <BackIcon />
            <span className="font-['Poppins',sans-serif] font-semibold text-base text-[#1A1C19]">
              {t('notif_message')}
            </span>
          </button>
          <SenderAvatar detail={detail} size="sm" />
        </div>

        {/* Sender info */}
        <div className="px-6 pt-5 pb-4 flex items-center gap-3">
          <SenderAvatar detail={detail} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="font-['Poppins',sans-serif] font-semibold text-base text-[#1A1C19]">{detail.senderName}</p>
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              <span className="font-['Lato',sans-serif] font-bold text-[11px] tracking-[0.8px] uppercase text-[#6B5D36]">
                {senderRole}
              </span>
              <span className="text-[#C3C8C2]">·</span>
              <span className="font-['Lato',sans-serif] text-[13px] text-[#8A8A8A]">{detail.date}</span>
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-[#E3E3DD] mx-6" style={{ width: 'calc(100% - 48px)' }} />

        {/* Subject */}
        <div className="px-6 pt-5 pb-4">
          <h1 className="font-['Poppins',sans-serif] font-bold text-[26px] text-[#1A1C19] leading-[1.25] tracking-[-0.3px]">
            {subject}
          </h1>
        </div>

        {/* Message body */}
        <div className="px-6">
          <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-5 flex flex-col gap-4">
            {body.map((para, i) => (
              <p key={i} className="font-['Lato',sans-serif] text-[15px] text-[#1A1C19] leading-[1.7]">
                {para}
              </p>
            ))}
            {detail.instructions && (
              <InstructionBlock
                title={detail.instructions.title[language]}
                items={detail.instructions.items[language]}
              />
            )}
            <div className="pt-1 border-t border-[#F0EFE8]">
              {detail.signature.split('\n').map((line, i) => (
                <p key={i} className={`font-['Lato',sans-serif] text-[14px] text-[#434844] leading-[1.6] ${i === 0 ? 'font-bold' : ''}`}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Attachments */}
        {detail.attachments && detail.attachments.length > 0 && (
          <div className="px-6 pt-6">
            <p className="font-['Lato',sans-serif] font-bold text-[11px] tracking-[1.5px] uppercase text-[#6B5D36] mb-3">
              {t('attached_docs')}
            </p>
            <div className="flex flex-col gap-2">
              {detail.attachments.map((file) => (
                <AttachmentCard key={file.name} file={file} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
