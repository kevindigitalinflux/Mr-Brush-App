import type { Language } from './i18n'

export interface Attachment {
  name: string
  meta: string
  type: 'pdf' | 'image'
}

export interface NotifDetail {
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

export const DETAIL_MAP: Record<string, NotifDetail> = {
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
      title: { en: 'MANDATORY INSTRUCTIONS', es: 'INSTRUCCIONES OBLIGATORIAS', pt: 'INSTRUÇÕES OBRIGATÓRIAS' },
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
      title: { en: 'IMMEDIATE ACTIONS', es: 'ACCIONES INMEDIATAS', pt: 'AÇÕES IMEDIATAS' },
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
