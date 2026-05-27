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

    // Zone submission
    take_photo_instruction: 'Take a photo after cleaning this zone.',
    photo_requirements: 'Minimum 1 photo required. Ensure the area is fully visible and well-lit.',
    note_placeholder: 'Any notes about this zone...',
    cant_submit_photo: "I can't submit a photo",
    submit_zone: 'Submit Zone',
    submitting: 'Submitting…',
    add_photo: 'Add photo',

    // No photo note
    no_photo_warning_body: 'Missing photos can affect quality assurance records. Please provide a detailed reason below to proceed with the report.',
    visual_doc_required: 'Visual documentation required',
    reason_for_no_photo: 'Reason for no photo',
    explain_no_photo: 'Explain why you were unable to submit a photo...',
    submit_without_photo: 'Submit Without Photo',
    no_photo_label: 'No Photo',

    // Shift history
    not_started: 'Not Started',
    zones_completed_label: 'zones completed',
    no_shifts_yet: 'No shifts yet',
    no_shifts_body: 'Completed shifts will appear here.',
    back_to_history: 'Back to history',
    zones: 'Zones',
    of_count: 'of',

    // Shift detail
    shift_details: 'Shift Details',
    commercial_cleaning: 'Commercial Cleaning',
    duration: 'Duration',
    lead_specialist: 'Lead Specialist',
    cleaned_zones: 'Cleaned Zones',
    zone_skipped: 'Skipped',
    note_prefix: 'Note:',
    shift_not_found: 'Shift not found',

    // Shift completed
    shift_completed_title: 'Shift Completed!',
    shift_completed_body: 'All zones have been verified and submitted successfully. Your supervisor has been notified. Great work today!',
    log_out: 'Log Out',

    // Language names
    lang_en: 'English',
    lang_es: 'Español',
    lang_pt: 'Português',

    // Supervisor — Desktop sidebar
    sv_portal_label: 'Supervisor Portal',
    sv_nav_dashboard: 'Dashboard',
    sv_nav_jobs: 'Jobs',
    sv_nav_workers: 'Workers',
    sv_nav_history: 'History',
    sv_sign_out: 'Sign Out',

    // Supervisor — Dashboard
    sv_todays_sites: "Today's Sites",
    sv_pending_approvals: 'Pending approvals',
    sv_issues_reported: 'Issues reported',
    sv_no_active_shifts: 'No active shifts today',
    sv_no_active_shifts_body: "Create today's job to assign cleaners and zones.",
    sv_go_to_jobs: 'Go to Jobs',
    sv_active_pill: 'ACTIVE',
    sv_manage_facility: 'Manage Facility',
    sv_workers_on_shift: 'Workers on shift',
    sv_select_worker_prompt: 'Select a worker to view their profile',
    sv_select_facility_prompt: 'Select a facility to view today\'s shift',
    sv_view_all_jobs: 'View all jobs',

    // Supervisor — Jobs (facilities list)
    sv_jobs_title: 'Jobs',
    sv_your_facilities: 'Your Facilities',
    sv_no_facilities: 'No facilities assigned',
    sv_no_facilities_body: 'You have no client facilities assigned yet.',
    sv_scheduled_pill: 'SCHEDULED',
    sv_no_job_today: 'No shift today',

    // Supervisor — Jobs (zone management)
    sv_no_zones_yet: 'No zones yet',
    sv_no_zones_body: 'Tap "+ Zone" to assign areas to cleaners.',
    sv_no_shift_yet: 'No shift started yet',
    sv_no_shift_body: "Create today's job to start assigning zones and cleaners.",
    sv_start_todays_shift: "Start Today's Shift",
    sv_add_zone: 'Zone',
    sv_zone_name_label: 'Zone Name',
    sv_zone_name_placeholder: 'e.g. Kitchen, Desk Zone 01',
    sv_assign_cleaner_label: 'Assign Cleaner',
    sv_unassigned: 'Unassigned',
    sv_facility_label: 'Facility',
    sv_zone_name_required: 'Zone name is required.',
    sv_failed_add_zone: 'Failed to add zone. Try again.',
    sv_could_not_create: 'Could not create job. Try again.',
    sv_mark_cleaner_complete: 'Mark Complete',
    sv_cleaner_shift_done: 'Done',
    sv_undo_mark_complete: 'Undo',
    sv_unassigned_zones: 'Unassigned',
    sv_failed_mark_complete: 'Failed to mark complete. Try again.',

    // Supervisor — Zone editing
    sv_edit_zone_title: 'Edit Zone',
    sv_zone_notes_label: 'Notes for Cleaners',
    sv_zone_notes_placeholder: 'Optional guidance for the cleaner assigned to this zone...',
    sv_save_changes: 'Save Changes',
    sv_duplicate_zone: 'Duplicate',
    sv_delete_zone: 'Delete Zone',
    sv_failed_save_zone: 'Failed to save. Try again.',
    sv_failed_delete_zone: 'Failed to delete. Try again.',

    // Supervisor — Workers
    sv_workers_title: 'Workers',
    sv_search_workers: 'Search by name or ID…',
    sv_on_shift_section: 'On Shift',
    sv_idle_section: 'Idle',
    sv_replacement_section: 'Replacement Pool',
    sv_no_workers_yet: 'No workers yet',
    sv_no_workers_body: 'Workers will appear here once they are added to your company.',
    sv_no_results: 'No results',
    sv_no_results_body: 'Try a different name or ID.',
    sv_active_worker: 'Active',
    sv_idle_worker: 'Idle',
    sv_replacement_worker: 'Replacement',

    // Supervisor — History
    sv_history_title: 'History',
    sv_my_shifts: 'My Shifts',
    sv_all_workers: 'All Workers',
    sv_no_past_shifts: 'No past shifts yet',
    sv_no_past_shifts_body: 'Completed shifts will appear here.',
    sv_done_pill: 'Done',
    sv_part_pill: 'Part',

    // Supervisor — Evidence
    sv_job_evidence: 'Job Evidence',
    sv_pending_approvals_title: 'Pending Approvals',
    sv_no_submissions: 'No submissions yet',
    sv_no_submissions_body: 'Evidence uploaded by cleaners will appear here for review.',
    sv_cleaner_note_label: 'Cleaner Note',
    sv_no_photo_msg: 'No photo submitted — cleaner provided a reason.',
    sv_feedback_placeholder: 'Add feedback (optional)…',
    sv_approve: 'Approve',
    sv_not_accepted: 'Not Accepted',
    sv_submit_feedback: 'Submit Feedback',
    sv_approved_pill: 'Approved',

    // Supervisor — Notifications
    sv_notifications_subtitle_sup: 'Messages and updates from your clients.',
    sv_no_notifications: 'No notifications yet',
    sv_no_notifications_body: 'Client messages will appear here.',
    sv_select_message: 'Select a message to read',

    // Supervisor — Issues
    sv_issues_title: 'Client Issues',
    sv_issues_subtitle: 'Reports and complaints submitted by clients.',
    sv_no_issues: 'No issues reported',
    sv_no_issues_body: 'Client-reported issues will appear here.',
    sv_client_note_label: 'Client Note',
    sv_reported_by: 'Reported by',
    sv_acknowledge: 'Acknowledge',
    sv_mark_resolved: 'Mark Resolved',
    sv_status_open: 'Open',
    sv_status_acknowledged: 'Acknowledged',
    sv_status_resolved: 'Resolved',

    // Language picker
    sv_language_label: 'Language',

    // Supervisor — Cleaner Profile & Ratings
    sv_cleaner_profile: 'Cleaner Profile',
    sv_overall_rating: 'Overall Rating',
    sv_no_ratings_yet: 'No ratings yet',
    sv_ratings_count: 'ratings',
    sv_rate_this_cleaner: 'Rate This Cleaner',
    sv_star_1: 'Poor',
    sv_star_2: 'Fair',
    sv_star_3: 'Good',
    sv_star_4: 'Very Good',
    sv_star_5: 'Excellent',
    sv_rating_notes_label: 'Rating Notes',
    sv_rating_notes_placeholder: 'Explain your rating in detail…',
    sv_evidence_photos_label: 'Supporting Evidence',
    sv_evidence_hint: 'Minimum 3 photos required to submit a rating.',
    sv_add_photos: 'Add Photos',
    sv_submit_rating: 'Submit Rating',
    sv_rating_submitted: 'Rating Submitted',
    sv_rating_submitted_body: 'Your rating has been recorded. The cleaner will be notified.',
    sv_rating_error_star: 'Please select a star rating.',
    sv_rating_error_notes: 'Please add notes to support your rating.',
    sv_rating_error_photo: 'At least 3 supporting photos are required.',
    sv_low_rating_guardrail: 'Ratings of 2 stars or below are automatically flagged and reviewed by management to ensure fair treatment. Please confirm this rating accurately reflects the cleaner\'s work performance.',
    sv_low_rating_confirm: 'I confirm this rating is fair and free from bias',
    sv_rating_error_confirm: 'Please confirm the rating is fair before submitting.',
    sv_rating_history: 'Rating History',
    sv_by_supervisor_badge: 'Supervisor',
    sv_by_client_badge: 'Client',
    sv_confirm_shift_body: "This opens a new shift for today. Once started, you can add cleaning zones and assign your team.",
    sv_confirm_shift_cta: 'Start Shift',
    sv_confirm_shift_creating: 'Creating shift…',
    sv_build_zones_label: 'Build Zones',
    sv_launch_shift_btn: 'Launch Shift',
    sv_failed_start_shift: 'Could not start shift. Try again.',
    sv_shift_builder_title: "Build Today's Shift",
    sv_shift_builder_skip: 'Skip — add zones later',
    sv_shift_builder_done: 'View Shift',
    sv_zones_added: 'Zones Added',
    sv_add_another_zone: 'add another zone',
    sv_add_zone_btn: 'Add Zone',
    sv_report_absence: 'Report Absence & Replace',
    sv_absence_sheet_title: 'Report Absence',
    sv_absence_sheet_body: 'Select a replacement for today\'s shift. This is logged automatically for payroll.',
    sv_absence_search: 'Search by name or ID…',
    sv_absence_no_match: 'No match found',
    sv_absence_confirm_btn: 'Confirm Replacement',
    sv_absence_success: 'Absence Reported',
    sv_absence_success_body: "Today's zones have been reassigned to the replacement.",
    sv_absence_error: 'Could not submit. Try again.',

    // Client — Navigation
    cl_portal_label: 'Client Portal',
    cl_nav_overview: 'Overview',
    cl_nav_evidence: 'Evidence',
    cl_nav_complaints: 'Complaints',
    cl_nav_history: 'History',
    cl_sign_out: 'Sign Out',
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

    // Zone submission
    take_photo_instruction: 'Toma una foto después de limpiar esta zona.',
    photo_requirements: 'Se requiere mínimo 1 foto. Asegúrate de que el área sea completamente visible y bien iluminada.',
    note_placeholder: 'Notas sobre esta zona...',
    cant_submit_photo: 'No puedo enviar una foto',
    submit_zone: 'Enviar zona',
    submitting: 'Enviando…',
    add_photo: 'Añadir foto',

    // No photo note
    no_photo_warning_body: 'La falta de fotos puede afectar los registros de control de calidad. Proporcione una razón detallada a continuación para continuar con el informe.',
    visual_doc_required: 'Documentación visual requerida',
    reason_for_no_photo: 'Motivo por falta de foto',
    explain_no_photo: 'Explica por qué no pudiste enviar una foto...',
    submit_without_photo: 'Enviar sin foto',
    no_photo_label: 'Sin foto',

    // Shift history
    not_started: 'No iniciado',
    zones_completed_label: 'zonas completadas',
    no_shifts_yet: 'Sin turnos todavía',
    no_shifts_body: 'Los turnos completados aparecerán aquí.',
    back_to_history: 'Volver al historial',
    zones: 'Zonas',
    of_count: 'de',

    // Shift detail
    shift_details: 'Detalles del turno',
    commercial_cleaning: 'Limpieza Comercial',
    duration: 'Duración',
    lead_specialist: 'Especialista principal',
    cleaned_zones: 'Zonas limpiadas',
    zone_skipped: 'Omitido',
    note_prefix: 'Nota:',
    shift_not_found: 'Turno no encontrado',

    // Shift completed
    shift_completed_title: '¡Turno completado!',
    shift_completed_body: 'Todas las zonas han sido verificadas y enviadas correctamente. Tu supervisor ha sido notificado. ¡Buen trabajo hoy!',
    log_out: 'Cerrar sesión',

    // Language names
    lang_en: 'English',
    lang_es: 'Español',
    lang_pt: 'Português',

    // Supervisor — Desktop sidebar
    sv_portal_label: 'Portal de Supervisor',
    sv_nav_dashboard: 'Panel',
    sv_nav_jobs: 'Trabajos',
    sv_nav_workers: 'Trabajadores',
    sv_nav_history: 'Historial',
    sv_sign_out: 'Cerrar Sesión',

    // Supervisor — Dashboard
    sv_todays_sites: 'Sitios de hoy',
    sv_pending_approvals: 'Aprobaciones pendientes',
    sv_issues_reported: 'Problemas reportados',
    sv_no_active_shifts: 'Sin turnos activos hoy',
    sv_no_active_shifts_body: 'Crea el trabajo de hoy para asignar limpiadores y zonas.',
    sv_go_to_jobs: 'Ir a Trabajos',
    sv_active_pill: 'ACTIVO',
    sv_workers_on_shift: 'Trabajadores en turno',
    sv_select_worker_prompt: 'Selecciona un trabajador para ver su perfil',
    sv_select_facility_prompt: 'Selecciona una instalación para ver el turno de hoy',
    sv_view_all_jobs: 'Ver todos los trabajos',
    sv_manage_facility: 'Gestionar instalación',

    // Supervisor — Jobs (facilities list)
    sv_jobs_title: 'Trabajos',
    sv_your_facilities: 'Tus instalaciones',
    sv_no_facilities: 'Sin instalaciones asignadas',
    sv_no_facilities_body: 'Aún no tienes instalaciones de clientes asignadas.',
    sv_scheduled_pill: 'PROGRAMADO',
    sv_no_job_today: 'Sin turno hoy',

    // Supervisor — Jobs (zone management)
    sv_no_zones_yet: 'Sin zonas aún',
    sv_no_zones_body: 'Pulsa "+ Zona" para asignar áreas a los limpiadores.',
    sv_no_shift_yet: 'Sin turno iniciado',
    sv_no_shift_body: 'Crea el trabajo de hoy para empezar a asignar zonas y limpiadores.',
    sv_start_todays_shift: 'Iniciar turno de hoy',
    sv_add_zone: 'Zona',
    sv_zone_name_label: 'Nombre de la zona',
    sv_zone_name_placeholder: 'p. ej. Cocina, Zona de escritorios 01',
    sv_assign_cleaner_label: 'Asignar limpiador',
    sv_unassigned: 'Sin asignar',
    sv_facility_label: 'Instalación',
    sv_zone_name_required: 'El nombre de la zona es obligatorio.',
    sv_failed_add_zone: 'Error al añadir zona. Inténtalo de nuevo.',
    sv_could_not_create: 'No se pudo crear el trabajo. Inténtalo de nuevo.',

    // Supervisor — Zone editing
    sv_edit_zone_title: 'Editar zona',
    sv_zone_notes_label: 'Notas para limpiadores',
    sv_zone_notes_placeholder: 'Instrucciones opcionales para el limpiador asignado a esta zona...',
    sv_save_changes: 'Guardar cambios',
    sv_duplicate_zone: 'Duplicar',
    sv_delete_zone: 'Eliminar zona',
    sv_failed_save_zone: 'Error al guardar. Inténtalo de nuevo.',
    sv_failed_delete_zone: 'Error al eliminar. Inténtalo de nuevo.',

    // Supervisor — Workers
    sv_workers_title: 'Trabajadores',
    sv_search_workers: 'Buscar por nombre o ID…',
    sv_on_shift_section: 'En turno',
    sv_idle_section: 'Disponible',
    sv_replacement_section: 'Bolsa de sustitutos',
    sv_no_workers_yet: 'Sin trabajadores aún',
    sv_no_workers_body: 'Los trabajadores aparecerán aquí una vez añadidos a tu empresa.',
    sv_no_results: 'Sin resultados',
    sv_no_results_body: 'Prueba con otro nombre o ID.',
    sv_active_worker: 'Activo',
    sv_idle_worker: 'Disponible',
    sv_replacement_worker: 'Sustituto',

    // Supervisor — History
    sv_history_title: 'Historial',
    sv_my_shifts: 'Mis turnos',
    sv_all_workers: 'Todos los trabajadores',
    sv_no_past_shifts: 'Sin turnos anteriores',
    sv_no_past_shifts_body: 'Los turnos completados aparecerán aquí.',
    sv_done_pill: 'Hecho',
    sv_part_pill: 'Parcial',

    // Supervisor — Evidence
    sv_job_evidence: 'Evidencias del trabajo',
    sv_pending_approvals_title: 'Aprobaciones pendientes',
    sv_no_submissions: 'Sin envíos aún',
    sv_no_submissions_body: 'Las evidencias subidas por los limpiadores aparecerán aquí.',
    sv_cleaner_note_label: 'Nota del limpiador',
    sv_no_photo_msg: 'Sin foto — el limpiador proporcionó una razón.',
    sv_feedback_placeholder: 'Añadir comentario (opcional)…',
    sv_approve: 'Aprobar',
    sv_not_accepted: 'No aceptado',
    sv_submit_feedback: 'Enviar comentario',
    sv_approved_pill: 'Aprobado',

    // Supervisor — Notifications
    sv_notifications_subtitle_sup: 'Mensajes y actualizaciones de tus clientes.',
    sv_no_notifications: 'Sin notificaciones aún',
    sv_no_notifications_body: 'Los mensajes de clientes aparecerán aquí.',
    sv_select_message: 'Selecciona un mensaje para leer',

    // Supervisor — Issues
    sv_issues_title: 'Problemas de clientes',
    sv_issues_subtitle: 'Informes y quejas presentados por los clientes.',
    sv_no_issues: 'Sin problemas reportados',
    sv_no_issues_body: 'Los problemas reportados por clientes aparecerán aquí.',
    sv_client_note_label: 'Nota del cliente',
    sv_reported_by: 'Reportado por',
    sv_acknowledge: 'Confirmar',
    sv_mark_resolved: 'Marcar resuelto',
    sv_status_open: 'Abierto',
    sv_status_acknowledged: 'Confirmado',
    sv_status_resolved: 'Resuelto',

    // Language picker
    sv_language_label: 'Idioma',

    // Supervisor — Perfil de limpiador y valoraciones
    sv_cleaner_profile: 'Perfil del limpiador',
    sv_overall_rating: 'Valoración general',
    sv_no_ratings_yet: 'Sin valoraciones aún',
    sv_ratings_count: 'valoraciones',
    sv_rate_this_cleaner: 'Valorar a este limpiador',
    sv_star_1: 'Malo',
    sv_star_2: 'Regular',
    sv_star_3: 'Bueno',
    sv_star_4: 'Muy bueno',
    sv_star_5: 'Excelente',
    sv_rating_notes_label: 'Notas de valoración',
    sv_rating_notes_placeholder: 'Explica tu valoración en detalle…',
    sv_evidence_photos_label: 'Evidencia de apoyo',
    sv_evidence_hint: 'Se requieren mínimo 3 fotos para enviar una valoración.',
    sv_add_photos: 'Añadir fotos',
    sv_submit_rating: 'Enviar valoración',
    sv_rating_submitted: 'Valoración enviada',
    sv_rating_submitted_body: 'Tu valoración ha sido registrada. El limpiador será notificado.',
    sv_rating_error_star: 'Por favor, selecciona una valoración de estrellas.',
    sv_rating_error_notes: 'Por favor, añade notas para justificar tu valoración.',
    sv_rating_error_photo: 'Se requieren al menos 3 fotos de apoyo.',
    sv_low_rating_guardrail: 'Las valoraciones de 2 estrellas o menos son marcadas automáticamente y revisadas por la gerencia para garantizar un trato justo. Por favor, confirma que esta valoración refleja con precisión el trabajo del limpiador.',
    sv_low_rating_confirm: 'Confirmo que esta valoración es justa y sin sesgos',
    sv_rating_error_confirm: 'Por favor, confirma que la valoración es justa antes de enviar.',
    sv_rating_history: 'Historial de valoraciones',
    sv_by_supervisor_badge: 'Supervisor',
    sv_by_client_badge: 'Cliente',
    sv_confirm_shift_body: 'Esto abre un nuevo turno para hoy. Una vez iniciado, puedes añadir zonas y asignar tu equipo.',
    sv_confirm_shift_cta: 'Iniciar turno',
    sv_confirm_shift_creating: 'Creando turno…',
    sv_build_zones_label: 'Construir zonas',
    sv_launch_shift_btn: 'Lanzar turno',
    sv_failed_start_shift: 'No se pudo iniciar el turno. Inténtalo de nuevo.',
    sv_shift_builder_title: 'Construir turno de hoy',
    sv_shift_builder_skip: 'Omitir — añadir zonas más tarde',
    sv_shift_builder_done: 'Ver turno',
    sv_zones_added: 'Zonas añadidas',
    sv_add_another_zone: 'añadir otra zona',
    sv_add_zone_btn: 'Añadir zona',
    sv_report_absence: 'Reportar Ausencia y Reemplazar',
    sv_absence_sheet_title: 'Reportar Ausencia',
    sv_absence_sheet_body: 'Selecciona un sustituto para el turno de hoy. El cambio se registrará automáticamente para nómina.',
    sv_absence_search: 'Buscar por nombre o ID…',
    sv_absence_no_match: 'Sin resultados',
    sv_absence_confirm_btn: 'Confirmar sustituto',
    sv_absence_success: 'Ausencia reportada',
    sv_absence_success_body: 'Las zonas de hoy han sido reasignadas al sustituto.',
    sv_absence_error: 'No se pudo enviar. Inténtalo de nuevo.',

    // Client — Navigation
    cl_portal_label: 'Portal del Cliente',
    cl_nav_overview: 'Resumen',
    cl_nav_evidence: 'Evidencias',
    cl_nav_complaints: 'Quejas',
    cl_nav_history: 'Historial',
    cl_sign_out: 'Cerrar Sesión',
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

    // Zone submission
    take_photo_instruction: 'Tire uma foto após limpar esta zona.',
    photo_requirements: 'Mínimo 1 foto obrigatória. Certifique-se de que a área esteja totalmente visível e bem iluminada.',
    note_placeholder: 'Notas sobre esta zona...',
    cant_submit_photo: 'Não consigo enviar uma foto',
    submit_zone: 'Enviar zona',
    submitting: 'Enviando…',
    add_photo: 'Adicionar foto',

    // No photo note
    no_photo_warning_body: 'A falta de fotos pode afetar os registros de controle de qualidade. Forneça um motivo detalhado abaixo para prosseguir com o relatório.',
    visual_doc_required: 'Documentação visual necessária',
    reason_for_no_photo: 'Motivo da falta de foto',
    explain_no_photo: 'Explique por que não conseguiu enviar uma foto...',
    submit_without_photo: 'Enviar sem foto',
    no_photo_label: 'Sem foto',

    // Shift history
    not_started: 'Não iniciado',
    zones_completed_label: 'zonas concluídas',
    no_shifts_yet: 'Sem turnos ainda',
    no_shifts_body: 'Os turnos concluídos aparecerão aqui.',
    back_to_history: 'Voltar ao histórico',
    zones: 'Zonas',
    of_count: 'de',

    // Shift detail
    shift_details: 'Detalhes do turno',
    commercial_cleaning: 'Limpeza Comercial',
    duration: 'Duração',
    lead_specialist: 'Especialista principal',
    cleaned_zones: 'Zonas limpas',
    zone_skipped: 'Ignorado',
    note_prefix: 'Nota:',
    shift_not_found: 'Turno não encontrado',

    // Shift completed
    shift_completed_title: 'Turno concluído!',
    shift_completed_body: 'Todas as zonas foram verificadas e enviadas com sucesso. Seu supervisor foi notificado. Ótimo trabalho hoje!',
    log_out: 'Sair',

    // Language names
    lang_en: 'English',
    lang_es: 'Español',
    lang_pt: 'Português',

    // Supervisor — Desktop sidebar
    sv_portal_label: 'Portal do Supervisor',
    sv_nav_dashboard: 'Painel',
    sv_nav_jobs: 'Trabalhos',
    sv_nav_workers: 'Trabalhadores',
    sv_nav_history: 'Histórico',
    sv_sign_out: 'Sair',

    // Supervisor — Dashboard
    sv_todays_sites: 'Sites de hoje',
    sv_pending_approvals: 'Aprovações pendentes',
    sv_issues_reported: 'Problemas relatados',
    sv_no_active_shifts: 'Sem turnos ativos hoje',
    sv_no_active_shifts_body: 'Crie o trabalho de hoje para atribuir limpadores e zonas.',
    sv_go_to_jobs: 'Ir para Trabalhos',
    sv_active_pill: 'ATIVO',
    sv_workers_on_shift: 'Trabalhadores em turno',
    sv_select_worker_prompt: 'Selecione um trabalhador para ver o perfil',
    sv_select_facility_prompt: 'Selecione uma instalação para ver o turno de hoje',
    sv_view_all_jobs: 'Ver todos os trabalhos',
    sv_manage_facility: 'Gerir instalação',

    // Supervisor — Jobs (facilities list)
    sv_jobs_title: 'Trabalhos',
    sv_your_facilities: 'Suas instalações',
    sv_no_facilities: 'Sem instalações atribuídas',
    sv_no_facilities_body: 'Você ainda não tem instalações de clientes atribuídas.',
    sv_scheduled_pill: 'AGENDADO',
    sv_no_job_today: 'Sem turno hoje',

    // Supervisor — Jobs (zone management)
    sv_no_zones_yet: 'Sem zonas ainda',
    sv_no_zones_body: 'Toque em "+ Zona" para atribuir áreas aos limpadores.',
    sv_no_shift_yet: 'Nenhum turno iniciado',
    sv_no_shift_body: 'Crie o trabalho de hoje para começar a atribuir zonas e limpadores.',
    sv_start_todays_shift: 'Iniciar turno de hoje',
    sv_add_zone: 'Zona',
    sv_zone_name_label: 'Nome da zona',
    sv_zone_name_placeholder: 'ex. Cozinha, Zona de mesas 01',
    sv_assign_cleaner_label: 'Atribuir limpador',
    sv_unassigned: 'Não atribuído',
    sv_facility_label: 'Instalação',
    sv_zone_name_required: 'O nome da zona é obrigatório.',
    sv_failed_add_zone: 'Falha ao adicionar zona. Tente novamente.',
    sv_could_not_create: 'Não foi possível criar o trabalho. Tente novamente.',

    // Supervisor — Zone editing
    sv_edit_zone_title: 'Editar zona',
    sv_zone_notes_label: 'Notas para limpadores',
    sv_zone_notes_placeholder: 'Orientações opcionais para o limpador atribuído a esta zona...',
    sv_save_changes: 'Salvar alterações',
    sv_duplicate_zone: 'Duplicar',
    sv_delete_zone: 'Excluir zona',
    sv_failed_save_zone: 'Falha ao salvar. Tente novamente.',
    sv_failed_delete_zone: 'Falha ao excluir. Tente novamente.',

    // Supervisor — Workers
    sv_workers_title: 'Trabalhadores',
    sv_search_workers: 'Pesquisar por nome ou ID…',
    sv_on_shift_section: 'Em turno',
    sv_idle_section: 'Disponível',
    sv_replacement_section: 'Reserva de substitutos',
    sv_no_workers_yet: 'Sem trabalhadores ainda',
    sv_no_workers_body: 'Os trabalhadores aparecerão aqui após serem adicionados à sua empresa.',
    sv_no_results: 'Sem resultados',
    sv_no_results_body: 'Tente outro nome ou ID.',
    sv_active_worker: 'Ativo',
    sv_idle_worker: 'Disponível',
    sv_replacement_worker: 'Substituto',

    // Supervisor — History
    sv_history_title: 'Histórico',
    sv_my_shifts: 'Meus turnos',
    sv_all_workers: 'Todos os trabalhadores',
    sv_no_past_shifts: 'Sem turnos anteriores',
    sv_no_past_shifts_body: 'Os turnos concluídos aparecerão aqui.',
    sv_done_pill: 'Concluído',
    sv_part_pill: 'Parcial',

    // Supervisor — Evidence
    sv_job_evidence: 'Evidências do trabalho',
    sv_pending_approvals_title: 'Aprovações pendentes',
    sv_no_submissions: 'Sem envios ainda',
    sv_no_submissions_body: 'As evidências enviadas pelos limpadores aparecerão aqui.',
    sv_cleaner_note_label: 'Nota do limpador',
    sv_no_photo_msg: 'Sem foto — o limpador forneceu uma razão.',
    sv_feedback_placeholder: 'Adicionar comentário (opcional)…',
    sv_approve: 'Aprovar',
    sv_not_accepted: 'Não aceito',
    sv_submit_feedback: 'Enviar comentário',
    sv_approved_pill: 'Aprovado',

    // Supervisor — Notifications
    sv_notifications_subtitle_sup: 'Mensagens e atualizações dos seus clientes.',
    sv_no_notifications: 'Sem notificações ainda',
    sv_no_notifications_body: 'Mensagens de clientes aparecerão aqui.',
    sv_select_message: 'Selecione uma mensagem para ler',

    // Supervisor — Issues
    sv_issues_title: 'Problemas de clientes',
    sv_issues_subtitle: 'Relatórios e reclamações enviados por clientes.',
    sv_no_issues: 'Sem problemas relatados',
    sv_no_issues_body: 'Problemas relatados por clientes aparecerão aqui.',
    sv_client_note_label: 'Nota do cliente',
    sv_reported_by: 'Relatado por',
    sv_acknowledge: 'Confirmar',
    sv_mark_resolved: 'Marcar resolvido',
    sv_status_open: 'Aberto',
    sv_status_acknowledged: 'Confirmado',
    sv_status_resolved: 'Resolvido',

    // Language picker
    sv_language_label: 'Idioma',

    // Supervisor — Perfil do limpador e avaliações
    sv_cleaner_profile: 'Perfil do limpador',
    sv_overall_rating: 'Avaliação geral',
    sv_no_ratings_yet: 'Sem avaliações ainda',
    sv_ratings_count: 'avaliações',
    sv_rate_this_cleaner: 'Avaliar este limpador',
    sv_star_1: 'Ruim',
    sv_star_2: 'Regular',
    sv_star_3: 'Bom',
    sv_star_4: 'Muito bom',
    sv_star_5: 'Excelente',
    sv_rating_notes_label: 'Notas de avaliação',
    sv_rating_notes_placeholder: 'Explique sua avaliação em detalhes…',
    sv_evidence_photos_label: 'Evidências de apoio',
    sv_evidence_hint: 'Mínimo 3 fotos obrigatórias para enviar uma avaliação.',
    sv_add_photos: 'Adicionar fotos',
    sv_submit_rating: 'Enviar avaliação',
    sv_rating_submitted: 'Avaliação enviada',
    sv_rating_submitted_body: 'Sua avaliação foi registrada. O limpador será notificado.',
    sv_rating_error_star: 'Por favor, selecione uma avaliação de estrelas.',
    sv_rating_error_notes: 'Por favor, adicione notas para justificar sua avaliação.',
    sv_rating_error_photo: 'Pelo menos 3 fotos de apoio são obrigatórias.',
    sv_low_rating_guardrail: 'Avaliações de 2 estrelas ou abaixo são sinalizadas automaticamente e revisadas pela gerência para garantir tratamento justo. Por favor, confirme que esta avaliação reflete com precisão o desempenho do limpador.',
    sv_low_rating_confirm: 'Confirmo que esta avaliação é justa e sem preconceitos',
    sv_rating_error_confirm: 'Por favor, confirme que a avaliação é justa antes de enviar.',
    sv_rating_history: 'Histórico de avaliações',
    sv_by_supervisor_badge: 'Supervisor',
    sv_by_client_badge: 'Cliente',
    sv_confirm_shift_body: 'Isso abre um novo turno para hoje. Depois de iniciado, você pode adicionar zonas e designar sua equipa.',
    sv_confirm_shift_cta: 'Iniciar turno',
    sv_confirm_shift_creating: 'A criar turno…',
    sv_build_zones_label: 'Construir zonas',
    sv_launch_shift_btn: 'Lançar turno',
    sv_failed_start_shift: 'Não foi possível iniciar o turno. Tente novamente.',
    sv_shift_builder_title: 'Construir turno de hoje',
    sv_shift_builder_skip: 'Pular — adicionar zonas depois',
    sv_shift_builder_done: 'Ver turno',
    sv_zones_added: 'Zonas adicionadas',
    sv_add_another_zone: 'adicionar outra zona',
    sv_add_zone_btn: 'Adicionar zona',
    sv_report_absence: 'Relatar Ausência e Substituir',
    sv_absence_sheet_title: 'Relatar Ausência',
    sv_absence_sheet_body: 'Selecione um substituto para o turno de hoje. A mudança será registrada automaticamente para o pagamento.',
    sv_absence_search: 'Pesquisar por nome ou ID…',
    sv_absence_no_match: 'Nenhum resultado',
    sv_absence_confirm_btn: 'Confirmar substituto',
    sv_absence_success: 'Ausência relatada',
    sv_absence_success_body: 'As zonas de hoje foram reatribuídas ao substituto.',
    sv_absence_error: 'Não foi possível enviar. Tente novamente.',

    // Client — Navigation
    cl_portal_label: 'Portal do Cliente',
    cl_nav_overview: 'Resumo',
    cl_nav_evidence: 'Evidências',
    cl_nav_complaints: 'Reclamações',
    cl_nav_history: 'Histórico',
    cl_sign_out: 'Sair',
  },
}
