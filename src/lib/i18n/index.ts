export type Language = 'en' | 'es' | 'pt'

export const strings: Record<Language, Record<string, string>> = {
  en: {
    // Auth
    welcome_back: 'Welcome back',
    sign_in_subtitle: 'Sign in with your Cleaner ID',
    cleaner_id: 'Cleaner ID',
    password: 'Password',
    sign_in: 'Sign In',
    forgot_id: 'Forgotten your Cleaner ID?',
    forgot_id_sub: 'Let your supervisor know',
    invalid_credentials: 'Incorrect ID or password. Please try again.',
    select_language: 'Choose your language',

    // Greetings
    good_morning: 'Good morning',
    good_afternoon: 'Good afternoon',
    good_evening: 'Good evening',

    // Home stats
    total_jobs: 'Total Jobs',
    zones_done: 'Zones Done',
    remaining: 'Remaining',
    your_jobs_today: 'Your Jobs Today',

    // Zone list
    shift_progress: 'Shift Progress',
    overall_progress: 'OVERALL PROGRESS',
    your_zones: 'Your Zones',
    mark_shift_complete: 'Mark Shift Complete',
    finish_all_zones: 'Finish all zones to complete shift.',
    all_zones_finished: 'All zones finished. Ready to complete shift.',

    // Zone submission
    upload_photos: 'Upload photos',
    add_note: 'Add a note (optional)',
    submit: 'Submit',
    no_photo: "Can't take a photo?",
    no_photo_reason: 'Describe why',

    // Shift screens
    shift_complete: 'Shift complete!',
    great_work: 'Great work today.',
    view_history: 'View shift history',
    shift_history: 'Shift History',
    shift_history_subtitle: 'A record of all your completed and incomplete shifts.',
    completed: 'Completed',
    incomplete: 'Incomplete',

    // Notifications
    notifications_title: 'Notifications',
    notifications_subtitle: 'Stay updated with the latest instructions from your supervisors and building management.',
    end_of_updates: 'End of Updates',

    // Bottom nav
    nav_jobs: 'Jobs',
    nav_history: 'History',
    nav_notifications: 'Notifications',

    // Offline
    no_internet: 'No internet connection',
    offline_message: 'Your submission will be sent automatically when you reconnect.',

    // Notifications detail
    urgent: 'URGENT',
    notif_message: 'Message',
    attached_docs: 'Attached Documentation',
    download: 'Download',
    view: 'View',

    // Language names
    lang_en: 'English',
    lang_es: 'Español',
    lang_pt: 'Português',
  },
  es: {
    // Auth
    welcome_back: 'Bienvenido de nuevo',
    sign_in_subtitle: 'Inicia sesión con tu ID de limpiador',
    cleaner_id: 'ID de limpiador',
    password: 'Contraseña',
    sign_in: 'Iniciar sesión',
    forgot_id: '¿Olvidaste tu ID?',
    forgot_id_sub: 'Avisa a tu supervisor',
    invalid_credentials: 'ID o contraseña incorrectos. Inténtalo de nuevo.',
    select_language: 'Elige tu idioma',

    // Greetings
    good_morning: 'Buenos días',
    good_afternoon: 'Buenas tardes',
    good_evening: 'Buenas noches',

    // Home stats
    total_jobs: 'Total de trabajos',
    zones_done: 'Zonas completadas',
    remaining: 'Restante',
    your_jobs_today: 'Sus trabajos de hoy',

    // Zone list
    shift_progress: 'Progreso del turno',
    overall_progress: 'PROGRESO GENERAL',
    your_zones: 'Sus zonas',
    mark_shift_complete: 'Marcar turno completado',
    finish_all_zones: 'Completa todas las zonas para terminar el turno.',
    all_zones_finished: 'Todas las zonas completadas. Listo para finalizar.',

    // Zone submission
    upload_photos: 'Subir fotos',
    add_note: 'Añadir nota (opcional)',
    submit: 'Enviar',
    no_photo: '¿No puedes tomar una foto?',
    no_photo_reason: 'Describe el motivo',

    // Shift screens
    shift_complete: '¡Turno completado!',
    great_work: 'Buen trabajo hoy.',
    view_history: 'Ver historial de turnos',
    shift_history: 'Historial de turnos',
    shift_history_subtitle: 'Un registro de todos tus turnos completados e incompletos.',
    completed: 'Completado',
    incomplete: 'Incompleto',

    // Notifications
    notifications_title: 'Notificaciones',
    notifications_subtitle: 'Mantente actualizado con las últimas instrucciones de tus supervisores.',
    end_of_updates: 'Fin de actualizaciones',

    // Bottom nav
    nav_jobs: 'Trabajos',
    nav_history: 'Historial',
    nav_notifications: 'Avisos',

    // Offline
    no_internet: 'Sin conexión a internet',
    offline_message: 'Tu envío se enviará automáticamente cuando te reconectes.',

    // Notifications detail
    urgent: 'URGENTE',
    notif_message: 'Mensaje',
    attached_docs: 'Documentación adjunta',
    download: 'Descargar',
    view: 'Ver',

    // Language names
    lang_en: 'English',
    lang_es: 'Español',
    lang_pt: 'Português',
  },
  pt: {
    // Auth
    welcome_back: 'Bem-vindo de volta',
    sign_in_subtitle: 'Entre com seu ID de limpador',
    cleaner_id: 'ID do limpador',
    password: 'Senha',
    sign_in: 'Entrar',
    forgot_id: 'Esqueceu seu ID?',
    forgot_id_sub: 'Avise seu supervisor',
    invalid_credentials: 'ID ou senha incorretos. Tente novamente.',
    select_language: 'Escolha seu idioma',

    // Greetings
    good_morning: 'Bom dia',
    good_afternoon: 'Boa tarde',
    good_evening: 'Boa noite',

    // Home stats
    total_jobs: 'Total de trabalhos',
    zones_done: 'Zonas concluídas',
    remaining: 'Restante',
    your_jobs_today: 'Seus trabalhos de hoje',

    // Zone list
    shift_progress: 'Progresso do turno',
    overall_progress: 'PROGRESSO GERAL',
    your_zones: 'Suas zonas',
    mark_shift_complete: 'Marcar turno concluído',
    finish_all_zones: 'Conclua todas as zonas para finalizar o turno.',
    all_zones_finished: 'Todas as zonas concluídas. Pronto para finalizar.',

    // Zone submission
    upload_photos: 'Enviar fotos',
    add_note: 'Adicionar nota (opcional)',
    submit: 'Enviar',
    no_photo: 'Não consegue tirar foto?',
    no_photo_reason: 'Descreva o motivo',

    // Shift screens
    shift_complete: 'Turno concluído!',
    great_work: 'Ótimo trabalho hoje.',
    view_history: 'Ver histórico de turnos',
    shift_history: 'Histórico de turnos',
    shift_history_subtitle: 'Um registro de todos os seus turnos concluídos e incompletos.',
    completed: 'Concluído',
    incomplete: 'Incompleto',

    // Notifications
    notifications_title: 'Notificações',
    notifications_subtitle: 'Fique atualizado com as últimas instruções dos seus supervisores.',
    end_of_updates: 'Fim das atualizações',

    // Bottom nav
    nav_jobs: 'Trabalhos',
    nav_history: 'Histórico',
    nav_notifications: 'Avisos',

    // Offline
    no_internet: 'Sem conexão à internet',
    offline_message: 'Seu envio será enviado automaticamente quando você se reconectar.',

    // Notifications detail
    urgent: 'URGENTE',
    notif_message: 'Mensagem',
    attached_docs: 'Documentação em anexo',
    download: 'Baixar',
    view: 'Ver',

    // Language names
    lang_en: 'English',
    lang_es: 'Español',
    lang_pt: 'Português',
  },
}
