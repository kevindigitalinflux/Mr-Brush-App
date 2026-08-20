export type Language = 'en' | 'es' | 'pt'

export const strings: Record<Language, Record<string, string>> = {
  en: {
    // Auth
    welcome_back: 'Welcome back',
    sign_in_subtitle: 'Sign in with your User ID',
    cleaner_id: 'Cleaner ID',
    password: 'Password',
    sign_in: 'Sign In',
    forgot_id: 'Forgotten your User ID?',
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
    nav_pay: 'Pay',
    nav_notifications: 'Notifications',

    // Generic states
    loading: 'Loading…',
    uploading: 'Uploading…',

    // Home
    home_overview: "Here is the overview for today's assignments.",
    home_active_assignments: 'Active Assignments',
    home_no_jobs: 'No Jobs Today',
    home_no_jobs_body: 'You have no jobs assigned for today. Check back later or contact your supervisor.',
    home_all_done: 'All Jobs Completed',
    home_all_done_body: "You've successfully finished all your scheduled tasks for today. Great work!",

    // Zone list
    in_progress: 'In Progress',
    no_photo_submitted: 'No Photo Submitted',

    // Zone submission
    zone_photo: 'Zone photo',
    upload_failed: 'Upload failed. Check your connection and try again.',

    // Zone submission success
    zone_submitted_success: 'Submitted successfully',
    zone_verified_clean: 'Verified Clean',
    redirecting: 'Redirecting to next task…',
    continue_now: 'Continue Now',

    // Zone offline queued
    offline_saved: 'Submission Saved',
    offline_saved_body: 'Your photos have been saved to this device. They will upload automatically as soon as you reconnect.',
    online_uploading_body: "You're back online. Your evidence is uploading now — this only takes a moment.",
    syncing: 'SYNCING',
    uploaded: 'Uploaded!',
    uploaded_body: 'Your evidence has been submitted successfully. Returning to your shift…',
    back_to_zones: 'Back to zone list',
    offline_upload_failed: 'Upload Failed',
    offline_upload_failed_body: "Something went wrong uploading this submission. It's still saved on this device — tap retry, or it will try again automatically next time you reconnect.",
    retry: 'Retry',

    // Pay
    pay_title: 'Your Pay',
    pay_clear: 'Clear',
    pay_no_records: 'No records for this period',
    pay_no_records_body: 'Try a different month or clear the filter.',
    pay_shifts: 'Shifts',
    pay_hours: 'Hours',
    pay_expected_pay: 'Expected Pay',
    pay_status_pending: 'Pending',
    pay_status_approved: 'Approved',
    pay_status_paid: 'Paid',

    // Notifications (cleaner-side)
    notif_empty: 'No notifications yet',
    notif_empty_body: 'Messages from your supervisor will appear here.',
    notif_select_to_read: 'Select a notification to read',
    notif_not_found: 'Notification not found.',

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
    photo_requirements: 'Add at least 1 photo, or record a short video (max 15s). Ensure the area is fully visible and well-lit.',
    note_placeholder: 'Any notes about this zone...',
    cant_submit_photo: "I can't submit a photo",
    submit_zone: 'Submit Zone',
    submitting: 'Submitting…',
    add_photo: 'Add photo',
    record_video: 'Record video',
    recording_label: 'Recording',
    retake_video: 'Retake',
    use_video: 'Use video',
    remove_video: 'Remove video',
    video_needs_signal: 'Needs a signal to record',
    video_too_long: 'Video must be 15 seconds or under. Please record again.',
    video_too_large: 'Video file is too large. Please record a shorter clip.',
    video_playback_failed: "Couldn't preview this video. Please retake it.",
    camera_permission_denied: 'Camera access is needed to record video. Check your browser permissions.',

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
    zone_flagged: 'Flagged — No Photo',
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

    // Cleaner — Desktop sidebar
    cleaner_portal_label: 'Cleaner Portal',
    user_id_label: 'User ID',

    // Supervisor — Desktop sidebar
    sv_portal_label: 'Supervisor Portal',
    sv_nav_dashboard: 'Dashboard',
    sv_nav_jobs: 'Jobs',
    sv_nav_workers: 'Workers',
    sv_nav_history: 'History',
    sv_nav_rates: 'Rates',
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

    // Recurring zone schedule
    sv_recurring_schedule_title: 'Recurring Schedule',
    sv_recurring_schedule_subtitle: 'Zones that repeat automatically on the days you choose',
    sv_add_recurring_zone: 'Add Recurring Zone',
    sv_recurring_days_label: 'Repeats On',
    sv_recurring_days_required: 'Select at least one day',
    sv_recurring_cleaner_required: 'Select a cleaner',
    sv_recurring_no_rules: 'No Recurring Zones',
    sv_recurring_no_rules_body: 'Set up a zone once and it will be created automatically on the days you choose.',
    sv_recurring_load_failed: 'Something went wrong. Please try again.',
    sv_recurring_active: 'Active',
    sv_recurring_paused: 'Paused',
    sv_recurring_pause: 'Pause',
    sv_recurring_resume: 'Resume',
    sv_recurring_confirm_delete: 'Confirm',
    sv_recurring_sync_now: "Sync Today's Zones Now",
    sv_recurring_syncing: 'Syncing…',
    sv_recurring_sync_note: 'Runs recurring zone assignments for all due facilities today, not just this one.',
    sv_recurring_sync_success: 'Synced — check zones for today.',
    sv_recurring_sync_error: 'Could not sync. Try again.',
    sv_day_mon: 'Mon',
    sv_day_tue: 'Tue',
    sv_day_wed: 'Wed',
    sv_day_thu: 'Thu',
    sv_day_fri: 'Fri',
    sv_day_sat: 'Sat',
    sv_day_sun: 'Sun',
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
    sv_job_evidence_subtitle: 'Photos and notes uploaded by cleaners for this job.',
    sv_pending_approvals_title: 'Pending Approvals',
    sv_pending_approvals_subtitle: 'Review and approve evidence submitted by your cleaners.',
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

    // Reclean acknowledgement
    reclean_ack_heading: 'Acknowledge Reclean',
    reclean_ack_body: 'Confirm you\'ve received this request. Your supervisor will be notified.',
    reclean_ack_note_placeholder: 'Add a note for your supervisor (optional)…',
    reclean_ack_btn: 'Acknowledge',
    reclean_ack_submitting: 'Sending…',
    reclean_ack_done: 'Acknowledged',
    reclean_ack_done_body: 'Your supervisor has been notified.',

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
    sign_in_subtitle: 'Inicia sesión con tu ID de usuario',
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
    nav_pay: 'Pago',
    nav_notifications: 'Avisos',

    // Generic states
    loading: 'Cargando…',
    uploading: 'Subiendo…',

    // Home
    home_overview: 'Aquí tienes el resumen de las asignaciones de hoy.',
    home_active_assignments: 'Asignaciones activas',
    home_no_jobs: 'Sin trabajos hoy',
    home_no_jobs_body: 'No tienes trabajos asignados para hoy. Vuelve más tarde o contacta a tu supervisor.',
    home_all_done: 'Todos los trabajos completados',
    home_all_done_body: 'Has completado correctamente todas las tareas programadas para hoy. ¡Buen trabajo!',

    // Zone list
    in_progress: 'En progreso',
    no_photo_submitted: 'Sin foto enviada',

    // Zone submission
    zone_photo: 'Foto de zona',
    upload_failed: 'Error al subir. Comprueba tu conexión e inténtalo de nuevo.',

    // Zone submission success
    zone_submitted_success: 'Enviado correctamente',
    zone_verified_clean: 'Limpieza verificada',
    redirecting: 'Redirigiendo a la siguiente tarea…',
    continue_now: 'Continuar ahora',

    // Zone offline queued
    offline_saved: 'Envío guardado',
    offline_saved_body: 'Tus fotos se han guardado en este dispositivo. Se subirán automáticamente cuando te reconectes.',
    online_uploading_body: 'Estás de vuelta en línea. Tu evidencia se está subiendo ahora — solo tomará un momento.',
    syncing: 'SINCRONIZANDO',
    uploaded: '¡Subido!',
    uploaded_body: 'Tu evidencia ha sido enviada correctamente. Volviendo a tu turno…',
    back_to_zones: 'Volver a la lista de zonas',
    offline_upload_failed: 'Error al subir',
    offline_upload_failed_body: 'Algo salió mal al subir este envío. Sigue guardado en este dispositivo — toca reintentar, o se intentará de nuevo automáticamente la próxima vez que te conectes.',
    retry: 'Reintentar',

    // Pay
    pay_title: 'Tu pago',
    pay_clear: 'Borrar',
    pay_no_records: 'Sin registros para este período',
    pay_no_records_body: 'Prueba con otro mes o borra el filtro.',
    pay_shifts: 'Turnos',
    pay_hours: 'Horas',
    pay_expected_pay: 'Pago esperado',
    pay_status_pending: 'Pendiente',
    pay_status_approved: 'Aprobado',
    pay_status_paid: 'Pagado',

    // Notifications (cleaner-side)
    notif_empty: 'Sin notificaciones aún',
    notif_empty_body: 'Los mensajes de tu supervisor aparecerán aquí.',
    notif_select_to_read: 'Selecciona una notificación para leer',
    notif_not_found: 'Notificación no encontrada.',

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
    photo_requirements: 'Agrega al menos 1 foto, o graba un video corto (máx. 15s). Asegúrate de que el área sea completamente visible y bien iluminada.',
    note_placeholder: 'Notas sobre esta zona...',
    cant_submit_photo: 'No puedo enviar una foto',
    submit_zone: 'Enviar zona',
    submitting: 'Enviando…',
    add_photo: 'Añadir foto',
    record_video: 'Grabar video',
    recording_label: 'Grabando',
    retake_video: 'Grabar de nuevo',
    use_video: 'Usar video',
    remove_video: 'Eliminar video',
    video_needs_signal: 'Necesita señal para grabar',
    video_too_long: 'El video debe durar 15 segundos o menos. Por favor, grábalo de nuevo.',
    video_too_large: 'El archivo de video es demasiado grande. Graba un clip más corto.',
    video_playback_failed: 'No se pudo previsualizar este video. Vuelve a grabarlo.',
    camera_permission_denied: 'Se necesita acceso a la cámara para grabar video. Comprueba los permisos de tu navegador.',

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
    zone_flagged: 'Marcado — Sin Foto',
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

    // Cleaner — Desktop sidebar
    cleaner_portal_label: 'Portal del Limpiador',
    user_id_label: 'ID de usuario',

    // Supervisor — Desktop sidebar
    sv_portal_label: 'Portal de Supervisor',
    sv_nav_dashboard: 'Panel',
    sv_nav_jobs: 'Trabajos',
    sv_nav_workers: 'Trabajadores',
    sv_nav_history: 'Historial',
    sv_nav_rates: 'Tarifas',
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

    // Recurring zone schedule
    sv_recurring_schedule_title: 'Horario recurrente',
    sv_recurring_schedule_subtitle: 'Zonas que se crean automáticamente en los días que elijas',
    sv_add_recurring_zone: 'Añadir zona recurrente',
    sv_recurring_days_label: 'Se repite en',
    sv_recurring_days_required: 'Selecciona al menos un día',
    sv_recurring_cleaner_required: 'Selecciona un limpiador',
    sv_recurring_no_rules: 'Sin zonas recurrentes',
    sv_recurring_no_rules_body: 'Configura una zona una vez y se creará automáticamente en los días que elijas.',
    sv_recurring_load_failed: 'Algo salió mal. Inténtalo de nuevo.',
    sv_recurring_active: 'Activo',
    sv_recurring_paused: 'Pausado',
    sv_recurring_pause: 'Pausar',
    sv_recurring_resume: 'Reanudar',
    sv_recurring_confirm_delete: 'Confirmar',
    sv_recurring_sync_now: 'Sincronizar Zonas de Hoy',
    sv_recurring_syncing: 'Sincronizando…',
    sv_recurring_sync_note: 'Ejecuta las asignaciones de zonas recurrentes para todas las instalaciones pendientes hoy, no solo esta.',
    sv_recurring_sync_success: 'Sincronizado — revisa las zonas de hoy.',
    sv_recurring_sync_error: 'No se pudo sincronizar. Inténtalo de nuevo.',
    sv_day_mon: 'Lun',
    sv_day_tue: 'Mar',
    sv_day_wed: 'Mié',
    sv_day_thu: 'Jue',
    sv_day_fri: 'Vie',
    sv_day_sat: 'Sáb',
    sv_day_sun: 'Dom',
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
    sv_job_evidence_subtitle: 'Fotos y notas subidas por los limpiadores para este trabajo.',
    sv_pending_approvals_title: 'Aprobaciones pendientes',
    sv_pending_approvals_subtitle: 'Revisa y aprueba las evidencias enviadas por tus limpiadores.',
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

    // Reclean acknowledgement
    reclean_ack_heading: 'Confirmar Relimpieza',
    reclean_ack_body: 'Confirma que has recibido esta solicitud. Tu supervisor será notificado.',
    reclean_ack_note_placeholder: 'Añade una nota para tu supervisor (opcional)…',
    reclean_ack_btn: 'Confirmar',
    reclean_ack_submitting: 'Enviando…',
    reclean_ack_done: 'Confirmado',
    reclean_ack_done_body: 'Tu supervisor ha sido notificado.',

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
    sign_in_subtitle: 'Entre com seu ID de usuário',
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
    nav_pay: 'Pagamento',
    nav_notifications: 'Avisos',

    // Generic states
    loading: 'Carregando…',
    uploading: 'Enviando…',

    // Home
    home_overview: 'Aqui está o resumo das atribuições de hoje.',
    home_active_assignments: 'Atribuições ativas',
    home_no_jobs: 'Sem trabalhos hoje',
    home_no_jobs_body: 'Você não tem trabalhos atribuídos para hoje. Volte mais tarde ou contate seu supervisor.',
    home_all_done: 'Todos os trabalhos concluídos',
    home_all_done_body: 'Você concluiu com sucesso todas as tarefas programadas para hoje. Ótimo trabalho!',

    // Zone list
    in_progress: 'Em andamento',
    no_photo_submitted: 'Sem foto enviada',

    // Zone submission
    zone_photo: 'Foto da zona',
    upload_failed: 'Falha no envio. Verifique sua conexão e tente novamente.',

    // Zone submission success
    zone_submitted_success: 'Enviado com sucesso',
    zone_verified_clean: 'Limpeza verificada',
    redirecting: 'Redirecionando para a próxima tarefa…',
    continue_now: 'Continuar agora',

    // Zone offline queued
    offline_saved: 'Envio salvo',
    offline_saved_body: 'Suas fotos foram salvas neste dispositivo. Elas serão enviadas automaticamente quando você se reconectar.',
    online_uploading_body: 'Você está de volta online. Sua evidência está sendo enviada agora — isso leva apenas um momento.',
    syncing: 'SINCRONIZANDO',
    uploaded: 'Enviado!',
    uploaded_body: 'Sua evidência foi enviada com sucesso. Voltando ao seu turno…',
    back_to_zones: 'Voltar à lista de zonas',
    offline_upload_failed: 'Falha no envio',
    offline_upload_failed_body: 'Algo deu errado ao enviar esta submissão. Ainda está salva neste dispositivo — toque em tentar novamente, ou será enviada automaticamente na próxima vez que você se conectar.',
    retry: 'Tentar novamente',

    // Pay
    pay_title: 'Seu pagamento',
    pay_clear: 'Limpar',
    pay_no_records: 'Sem registros para este período',
    pay_no_records_body: 'Tente outro mês ou limpe o filtro.',
    pay_shifts: 'Turnos',
    pay_hours: 'Horas',
    pay_expected_pay: 'Pagamento esperado',
    pay_status_pending: 'Pendente',
    pay_status_approved: 'Aprovado',
    pay_status_paid: 'Pago',

    // Notifications (cleaner-side)
    notif_empty: 'Sem notificações ainda',
    notif_empty_body: 'As mensagens do seu supervisor aparecerão aqui.',
    notif_select_to_read: 'Selecione uma notificação para ler',
    notif_not_found: 'Notificação não encontrada.',

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
    photo_requirements: 'Adicione pelo menos 1 foto, ou grave um vídeo curto (máx. 15s). Certifique-se de que a área esteja totalmente visível e bem iluminada.',
    note_placeholder: 'Notas sobre esta zona...',
    cant_submit_photo: 'Não consigo enviar uma foto',
    submit_zone: 'Enviar zona',
    submitting: 'Enviando…',
    add_photo: 'Adicionar foto',
    record_video: 'Gravar vídeo',
    recording_label: 'Gravando',
    retake_video: 'Gravar novamente',
    use_video: 'Usar vídeo',
    remove_video: 'Remover vídeo',
    video_needs_signal: 'Precisa de sinal para gravar',
    video_too_long: 'O vídeo deve ter 15 segundos ou menos. Por favor, grave novamente.',
    video_too_large: 'O arquivo de vídeo é muito grande. Grave um clipe mais curto.',
    video_playback_failed: 'Não foi possível pré-visualizar este vídeo. Grave novamente.',
    camera_permission_denied: 'É necessário acesso à câmera para gravar vídeo. Verifique as permissões do seu navegador.',

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
    zone_flagged: 'Marcado — Sem Foto',
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

    // Cleaner — Desktop sidebar
    cleaner_portal_label: 'Portal do Limpador',
    user_id_label: 'ID do usuário',

    // Supervisor — Desktop sidebar
    sv_portal_label: 'Portal do Supervisor',
    sv_nav_dashboard: 'Painel',
    sv_nav_jobs: 'Trabalhos',
    sv_nav_workers: 'Trabalhadores',
    sv_nav_history: 'Histórico',
    sv_nav_rates: 'Tarifas',
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

    // Recurring zone schedule
    sv_recurring_schedule_title: 'Horário recorrente',
    sv_recurring_schedule_subtitle: 'Zonas criadas automaticamente nos dias que você escolher',
    sv_add_recurring_zone: 'Adicionar zona recorrente',
    sv_recurring_days_label: 'Repete em',
    sv_recurring_days_required: 'Selecione pelo menos um dia',
    sv_recurring_cleaner_required: 'Selecione um limpador',
    sv_recurring_no_rules: 'Nenhuma zona recorrente',
    sv_recurring_no_rules_body: 'Configure uma zona uma vez e ela será criada automaticamente nos dias escolhidos.',
    sv_recurring_load_failed: 'Algo deu errado. Tente novamente.',
    sv_recurring_active: 'Ativo',
    sv_recurring_paused: 'Pausado',
    sv_recurring_pause: 'Pausar',
    sv_recurring_resume: 'Retomar',
    sv_recurring_confirm_delete: 'Confirmar',
    sv_recurring_sync_now: 'Sincronizar Zonas de Hoje',
    sv_recurring_syncing: 'Sincronizando…',
    sv_recurring_sync_note: 'Executa as atribuições de zonas recorrentes para todas as instalações pendentes hoje, não apenas esta.',
    sv_recurring_sync_success: 'Sincronizado — verifique as zonas de hoje.',
    sv_recurring_sync_error: 'Não foi possível sincronizar. Tente novamente.',
    sv_day_mon: 'Seg',
    sv_day_tue: 'Ter',
    sv_day_wed: 'Qua',
    sv_day_thu: 'Qui',
    sv_day_fri: 'Sex',
    sv_day_sat: 'Sáb',
    sv_day_sun: 'Dom',
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
    sv_job_evidence_subtitle: 'Fotos e notas enviadas pelos limpadores para este trabalho.',
    sv_pending_approvals_title: 'Aprovações pendentes',
    sv_pending_approvals_subtitle: 'Revise e aprove as evidências enviadas pelos seus limpadores.',
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

    // Reclean acknowledgement
    reclean_ack_heading: 'Confirmar Relimpeza',
    reclean_ack_body: 'Confirme que recebeu esta solicitação. Seu supervisor será notificado.',
    reclean_ack_note_placeholder: 'Adicione uma nota para seu supervisor (opcional)…',
    reclean_ack_btn: 'Confirmar',
    reclean_ack_submitting: 'Enviando…',
    reclean_ack_done: 'Confirmado',
    reclean_ack_done_body: 'Seu supervisor foi notificado.',

    // Client — Navigation
    cl_portal_label: 'Portal do Cliente',
    cl_nav_overview: 'Resumo',
    cl_nav_evidence: 'Evidências',
    cl_nav_complaints: 'Reclamações',
    cl_nav_history: 'Histórico',
    cl_sign_out: 'Sair',
  },
}
