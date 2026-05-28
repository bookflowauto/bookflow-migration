// All translatable strings live here. English is the source of truth — Greek
// must keep the same keys. Phase A + B scope: Nav, Settings, Calendar,
// Patients, Appointments, Billing, Auth.

export const LOCALES = ['en', 'el'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'el'

export function isLocale(s: unknown): s is Locale {
  return s === 'en' || s === 'el'
}

const en = {
  // ── Nav ────────────────────────────────────────────────────────────
  'nav.workspace': 'Workspace',
  'nav.patients': 'Patients',
  'nav.calendar': 'Calendar',
  'nav.billing': 'Billing',
  'nav.settings': 'Settings',
  'nav.practitioner': 'Practitioner',

  // ── Top bar ────────────────────────────────────────────────────────
  'topbar.signOut': 'Sign out',
  'topbar.toggleTheme': 'Toggle theme',

  // ── Sidebar locked state (no active plan) ──────────────────────────
  'sidebar.locked.title': 'Dashboard locked',
  'sidebar.locked.body': 'Choose a plan below to unlock patients, calendar, and settings.',
  'sidebar.locked.tooltip': 'Choose a plan to unlock this section.',

  // ── Settings page ──────────────────────────────────────────────────
  'settings.title': 'Settings',
  'settings.subtitle': 'Manage your practice settings and integrations.',
  'settings.loadFailed': 'Failed to load settings',
  'settings.tab.general': 'General',
  'settings.tab.profile': 'Profile',
  'settings.tab.security': 'Security',
  'settings.tab.notifications': 'Notifications',
  'settings.tab.mydata': 'myDATA (AADE)',

  // ── Settings: Profile tab ──────────────────────────────────────────
  'settings.profile.title': 'Profile',
  'settings.profile.subtitle': 'Your name, contact details, and connected Google Calendar.',
  'settings.profile.name': 'Full name',
  'settings.profile.email': 'Email',
  'settings.profile.emailHelp': 'Changing your email triggers a verification link sent to the new address. Until you confirm it, sign-in still uses your old email.',
  'settings.profile.phone': 'Phone (optional)',
  'settings.profile.calendarId': 'Google Calendar ID',
  'settings.profile.calendarIdHelp': 'The calendar email Workflow #1 polls for appointments. Usually your Google account email.',
  'settings.profile.save': 'Save profile',
  'settings.profile.saving': 'Saving…',
  'settings.profile.saved': 'Profile updated ✓',
  'settings.profile.savedEmail': 'Profile updated. Check your new email inbox to confirm the address change.',
  'settings.profile.errName': 'Name cannot be empty.',
  'settings.profile.errCalendarId': 'Calendar ID cannot be empty.',
  'settings.profile.errEmail': 'Please enter a valid email address.',

  // ── Settings: Security tab ─────────────────────────────────────────
  'settings.security.title': 'Security',
  'settings.security.subtitle': 'Change your sign-in password.',
  'settings.security.currentPassword': 'Current password',
  'settings.security.newPassword': 'New password',
  'settings.security.confirmPassword': 'Confirm new password',
  'settings.security.passwordHelp': 'Must be at least 8 characters.',
  'settings.security.save': 'Update password',
  'settings.security.saving': 'Updating…',
  'settings.security.saved': 'Password updated ✓',
  'settings.security.errMinLength': 'New password must be at least 8 characters.',
  'settings.security.errMismatch': 'Passwords do not match.',
  'settings.security.errCurrent': 'Current password is incorrect.',

  // ── Settings: Notifications tab ────────────────────────────────────
  'settings.notifications.title': 'Notifications',
  'settings.notifications.subtitle': 'Control which automated messages your practice sends and receives.',
  'settings.notifications.smsReminder': 'SMS reminders to patients',
  'settings.notifications.smsReminderHelp': 'When enabled, Workflow #1 sends a Greek reminder + confirmation link to every patient with a phone number.',
  'settings.notifications.offset': 'Send reminder this many hours before the appointment',
  'settings.notifications.offsetHelp': 'Between 1 and 168 hours (7 days). Default: 24h.',
  'settings.notifications.emailDigest': 'Daily email digest of upcoming appointments',
  'settings.notifications.emailDigestHelp': 'Receive a summary email each morning with that day\'s appointments. (Coming soon — toggle is saved for when the digest worker ships.)',
  'settings.notifications.save': 'Save preferences',
  'settings.notifications.saving': 'Saving…',
  'settings.notifications.saved': 'Preferences updated ✓',
  'settings.notifications.errOffset': 'Reminder offset must be between 1 and 168 hours.',

  'settings.language.title': 'Language',
  'settings.language.subtitle': 'Choose the language used across the dashboard.',
  'settings.language.english': 'English',
  'settings.language.greek': 'Ελληνικά',
  'settings.language.saved': 'Language updated ✓',

  'settings.rate.title': 'Session Rate',
  'settings.rate.subtitle':
    'Default amount charged per session. Used when generating tax receipts in myDATA.',
  'settings.rate.label': 'Rate per session (EUR)',
  'settings.rate.save': 'Save rate',
  'settings.rate.saving': 'Saving…',
  'settings.rate.saved': 'Rate updated ✓',
  'settings.rate.errPositive': 'Rate must be greater than €0',
  'settings.rate.errSession': 'Session expired. Please sign in again.',

  // ── Settings: myDATA tab ───────────────────────────────────────────
  'mydata.verified': 'Verified',
  'mydata.field.username': 'myDATA username (AADE)',
  'mydata.field.subscriptionKey': 'Subscription key',
  'mydata.field.subscriptionKey.keepExisting': '(leave blank to keep existing)',
  'mydata.field.environment': 'Environment',
  'mydata.env.sandbox': 'Sandbox (AADE dev)',
  'mydata.env.production': 'Production',
  'mydata.field.vat': 'VAT number (ΑΦΜ) — 9 digits',
  'mydata.field.kad': 'KAD code',
  'mydata.kad.placeholder': 'Select…',
  'mydata.kad.869014': '869014 — Υπηρεσίες ψυχολόγου',
  'mydata.kad.869039': '869039 — Λοιπές υπηρεσίες ανθρώπινης υγείας',
  'mydata.field.regime': 'VAT regime',
  'mydata.regime.exempt': 'Exempt (Article 22 — clinical psychology default)',
  'mydata.regime.standard': 'Standard 24%',
  'mydata.regime.mixed': 'Mixed (some activities taxable)',
  'mydata.field.address': 'Business address (printed on receipts)',
  'mydata.secondaryTaxable':
    'I also perform taxable work (e.g. consulting, HR training) alongside clinical psychology. Receipts for those services will use standard VAT.',
  'mydata.consent':
    'I authorise BookFlow to access my myDATA account on my behalf, using the credentials above, to submit e-receipts for appointments I confirm. I remain the legal issuer of record.',
  'mydata.errConsent': 'You must authorize BookFlow to access your myDATA account.',
  'mydata.errKey': 'Subscription key is required.',
  'mydata.btn.verify': 'Verify & save',
  'mydata.btn.update': 'Update & re-verify',
  'mydata.btn.verifying': 'Verifying with AADE…',

  // ── Calendar header / grid / panel ─────────────────────────────────
  'calendar.title': 'Calendar',
  'calendar.new': 'New appointment',
  'calendar.newDisabledTooltip':
    'Appointments sync from Google Calendar. Inline create coming soon.',
  'calendar.today': 'Today',
  'calendar.prev': 'Previous',
  'calendar.next': 'Next',
  'calendar.view.day': 'Day',
  'calendar.view.week': 'Week',
  'calendar.view.month': 'Month',
  'calendar.viewAria': 'Calendar view',
  'calendar.empty': 'No appointments on this day',
  'calendar.moreCount': '+{n} more',
  'calendar.day.mon': 'Mon',
  'calendar.day.tue': 'Tue',
  'calendar.day.wed': 'Wed',
  'calendar.day.thu': 'Thu',
  'calendar.day.fri': 'Fri',
  'calendar.day.sat': 'Sat',
  'calendar.day.sun': 'Sun',
  'calendar.unknownPatient': 'Unknown patient',
  'calendar.unknown': 'Unknown',

  'panel.title': 'Appointment',
  'panel.close': 'Close',
  'panel.patient': 'Patient',
  'panel.summary': 'Summary',
  'panel.workflow': 'Workflow',
  'panel.phone': 'Phone',
  'panel.minutes': '{n} min',
  'panel.intake.done': 'Intake completed',
  'panel.intake.pending': 'Intake pending',
  'panel.soap.done': 'SOAP note recorded',
  'panel.soap.pending': 'No SOAP note yet',
  'panel.receipt.done': 'Receipt issued',
  'panel.receipt.pending': 'Receipt not issued',
  'panel.openAppointment': 'Open appointment',
  'panel.patientProfile': 'Patient profile',

  // ── Patients list ──────────────────────────────────────────────────
  'patients.title': 'Patients',
  'patients.subtitle': 'All patients linked to your calendar appointments.',
  'patients.kpi.total': 'Total patients',
  'patients.kpi.intakeDone': 'Intake completed',
  'patients.kpi.intakePending': 'Intake pending',
  'patients.kpi.totalSessions': 'Total sessions',
  'patients.list.all': 'All patients',
  'patients.list.count.one': '{n} patient',
  'patients.list.count.other': '{n} patients',
  'patients.empty': 'No patients yet. They will appear once appointments sync from Google Calendar.',
  'patients.intake.done': 'Intake done',
  'patients.intake.pending': 'Intake pending',

  // ── Patient detail ─────────────────────────────────────────────────
  'patient.intakeStatus': 'Intake status',
  'patient.intake.completed': 'Completed',
  'patient.intake.pending': 'Pending',
  'patient.stats.sessions': 'Sessions',
  'patient.stats.upcoming': 'Upcoming',
  'patient.stats.completed': 'Completed',
  'patient.stats.billed': 'Billed',
  'patient.soap.title': 'Merged SOAP summary',
  'patient.appointments.title': 'Appointments',
  'patient.appointments.totalSuffix': 'total',
  'patient.appointments.empty': 'No appointments yet.',
  'patient.session': 'Session',

  // ── Regenerate SOAP button ─────────────────────────────────────────
  'regenerate.btn': 'Regenerate SOAP',
  'regenerate.btn.busy': 'Regenerating…',
  'regenerate.unlimited': 'Unlimited regens',
  'regenerate.counter': '{n}/{limit} regens',
  'regenerate.noTranscripts': 'No session transcripts available to regenerate from.',
  'regenerate.noAuth': 'Not authenticated. Please refresh and try again.',
  'regenerate.quotaHit':
    "You've used all regenerations this month. Upgrade to Professional for more.",
  'regenerate.failed': 'Failed to regenerate SOAP: {error}',
  'regenerate.failedGeneric': 'Failed to regenerate SOAP. Please try again.',
  'regenerate.success': 'SOAP regenerated successfully!',
  'regenerate.tooltipNoTranscripts': 'No session transcripts available yet',

  // ── Appointment detail ─────────────────────────────────────────────
  'appointment.title': 'Appointment',
  'appointment.session': 'Session',
  'appointment.sessionNotes': 'Session notes',
  'appointment.sessionNotes.subtitle': 'Transcribed from your post-session dictation',
  'appointment.recordNotes': 'Record notes',
  'appointment.transcribing': 'Transcription in progress…',
  'appointment.noTranscript': 'No transcript yet. Use the button above to record session notes.',
  'appointment.patient': 'Patient',
  'appointment.phoneLabel': 'Phone',
  'appointment.intakeLabel': 'Intake',

  // ── Transcript editor ──────────────────────────────────────────────
  'transcript.save': 'Save',
  'transcript.saving': 'Saving…',
  'transcript.cancel': 'Cancel',
  'transcript.edit': 'Edit transcript',
  'transcript.export': 'Export PDF',
  'transcript.exporting': 'Exporting…',
  'transcript.exportNoAuth': 'Not authenticated. Please refresh and try again.',
  'transcript.exportFailed': 'Failed to export PDF: {error}',
  'transcript.exportFailedGeneric': 'Failed to export PDF. Please try again.',
  'transcript.exportSuccess': 'PDF exported successfully',

  // ── Status actions ─────────────────────────────────────────────────
  'statusActions.markAttended': 'Mark attended',
  'statusActions.marking': 'Marking…',
  'statusActions.markCancelled': 'Mark cancelled',
  'statusActions.cancelling': 'Cancelling…',
  'statusActions.confirmCancel':
    'Mark this appointment as cancelled? This will block receipt issuance.',
  'statusActions.errSession': 'Session expired',
  'statusActions.errGeneric': 'Failed to update status',

  // ── Status / scribe badges ─────────────────────────────────────────
  'status.scheduled': 'scheduled',
  'status.confirmed': 'confirmed',
  'status.completed': 'completed',
  'status.cancelled': 'cancelled',
  'scribe.pending': 'scribe pending',
  'scribe.transcribing': 'transcribing',
  'scribe.complete': 'scribed',
  'scribe.failed': 'scribe failed',

  // ── Receipt section + Issue modal ──────────────────────────────────
  'receipt.title': 'Tax receipt (myDATA)',
  'receipt.issued': 'Issued',
  'receipt.mark': 'AADE Mark',
  'receipt.submitted': 'Submitted',
  'receipt.pending': 'Submitting to AADE…',
  'receipt.pending.help':
    "Usually completes in a few seconds. If it's been longer, the workflow may have crashed — reset to retry.",
  'receipt.reset': 'Reset & retry',
  'receipt.resetting': 'Resetting…',
  'receipt.resetConfirm':
    'Reset receipt status? Use this if the workflow crashed and the badge is stuck on "Submitting".',
  'receipt.failed': 'Failed to submit',
  'receipt.failed.help':
    'Receipt submission failed. Try issuing again or contact support if it persists.',
  'receipt.cta.issue': 'Issue a Greek tax e-receipt for this session',
  'receipt.cta.retry': 'Retry issuing receipt',
  'receipt.btn.issue': 'Issue receipt',
  'receipt.btn.issuing': 'Issuing…',
  'receipt.btn.retry': 'Retry',
  'receipt.errSession': 'Session expired',
  'receipt.errFailed': 'Failed to issue receipt',
  'receipt.errResetFailed': 'Failed to reset',

  'receipt.modal.title': 'Issue Receipt',
  'receipt.modal.amount': 'Amount (EUR)',
  'receipt.modal.amountHelp': 'Default session rate. Edit if needed for special pricing.',
  'receipt.modal.errPositive': 'Amount must be greater than €0',
  'receipt.modal.lateTitle': 'Late receipt warning.',
  'receipt.modal.lateBody':
    'This appointment was {hours} hours ago. AADE requires submission within 24 hours of issuance — late filings may incur a penalty (€150+). Submit as soon as possible.',
  'receipt.modal.info':
    'A Greek tax e-receipt will be issued to AADE (myDATA) for this appointment. Amount will be recorded as VAT-exempt clinical psychology service.',
  'receipt.modal.cancel': 'Cancel',
  'receipt.modal.submit': 'Issue receipt',
  'receipt.modal.submitting': 'Issuing receipt…',

  // ── Billing ────────────────────────────────────────────────────────
  'billing.title': 'Billing',
  'billing.subtitle': 'Manage your subscription, view usage, and upgrade your plan.',
  'billing.banner.successTitle': 'Subscription activated',
  'billing.banner.successBody':
    'Your {plan} plan is now active. It may take a few seconds to reflect on this page.',
  'billing.banner.cancelled': 'Checkout cancelled. No charges were made.',
  'billing.currentPlan': 'Current plan',
  'billing.renews': 'Renews {date}',
  'billing.unpaid.title': 'Choose a plan to get started',
  'billing.unpaid.body':
    'Pick a plan below to unlock your dashboard. You can switch plans or cancel anytime.',
  'billing.upgrade.title': 'Upgrade required',
  'billing.upgrade.body':
    'That feature is available on a higher tier. Pick a plan below to unlock it.',
  'billing.usage.sms': 'SMS reminders',
  'billing.usage.scribe': 'AI scribe dictation',
  'billing.usage.unit.messages': 'messages',
  'billing.usage.unit.minutes': 'minutes',
  'billing.usage.thisMonth': 'this month',
  'billing.usage.overQuota':
    'Quota exceeded — upgrade your plan or wait for next billing period.',
  'billing.usage.atQuota': "You're at {pct}% of your monthly quota.",
  'billing.plans.switch': 'Switch plan',
  'billing.plans.choose': 'Choose a plan',
  'billing.plans.switch.subtitle': 'Upgrade or downgrade anytime. Changes are pro-rated.',
  'billing.plans.choose.subtitle':
    'All plans include unlimited patients and appointments. Pick a plan to activate billing.',
  'billing.manage': 'Manage subscription',
  'billing.manage.opening': 'Opening…',
  'billing.manage.errAuth': 'You need to be signed in.',
  'billing.manage.errFailed': 'Portal failed',

  // Plan status labels
  'billing.status.unpaid': 'no plan',
  'billing.status.active': 'active',
  'billing.status.past_due': 'past due',
  'billing.status.cancelled': 'cancelled',

  // Feature gate (in-page upgrade prompt)
  'featureGate.title': 'Upgrade to unlock',
  'featureGate.body': 'This feature is included on a higher tier.',
  'featureGate.cta': 'See plans',

  // Tier names
  'plan.essentials': 'Essentials',
  'plan.professional': 'Professional',
  'plan.premium': 'Premium',
  'plan.essentials.tag': 'Solo practitioners, getting started',
  'plan.professional.tag': 'Established practices',
  'plan.premium.tag': 'Multi-practitioner clinics',

  // Plan selector
  'plans.period.monthly': 'Monthly',
  'plans.period.annual': 'Annual',
  'plans.period.save': 'Save 17%',
  'plans.mostPopular': 'Most popular',
  'plans.currentPlan': 'Current plan',
  'plans.priceSuffix': '/month',
  'plans.billedAnnually': '€{annual} billed annually',
  'plans.btn.current': 'Current plan',
  'plans.btn.loading': 'Loading…',
  'plans.btn.switch': 'Switch plan',
  'plans.btn.choose': 'Choose plan',
  'plans.errAuth': 'You need to be signed in.',
  'plans.errCheckout': 'Checkout failed',

  // Plan features
  'plan.feat.sms.100': '100 SMS reminders / month',
  'plan.feat.sms.500': '500 SMS reminders / month',
  'plan.feat.sms.1500': '1,500 SMS reminders / month',
  'plan.feat.scribe.30min': '30 min AI scribe dictation / month',
  'plan.feat.scribe.10h': '10 hours AI scribe / month',
  'plan.feat.scribe.30h': '30 hours AI scribe / month',
  'plan.feat.gcal': 'Google Calendar sync',
  'plan.feat.intake.1': '1 intake template',
  'plan.feat.intake.unlimited': 'Unlimited intake templates',
  'plan.feat.pdf.single': 'Single-note PDF export',
  'plan.feat.support.email': 'Email support (48h)',
  'plan.feat.support.chat': 'Email + chat support (24h)',
  'plan.feat.support.priority': 'Priority support (4h SLA)',
  'plan.feat.soap.merge': 'Longitudinal SOAP merge',
  'plan.feat.soap.structured': 'Editable structured SOAP',
  'plan.feat.timeline': 'Per-patient timeline + search',
  'plan.feat.multiCalendar': 'Multi-calendar sync',
  'plan.feat.seats': '3 practitioner seats included',
  'plan.feat.secretary': 'Secretary / admin seat',
  'plan.feat.backup': 'Monthly compliance backup',
  'plan.feat.analytics': 'Practice analytics',

  // ── Auth (login, forgot, reset) ────────────────────────────────────
  'auth.welcomeBack': 'Welcome back',
  'auth.signInPrompt': 'Sign in to your BookFlow account',
  'auth.email': 'Email',
  'auth.emailPlaceholder': 'you@clinic.com',
  'auth.password': 'Password',
  'auth.passwordPlaceholder': '••••••••',
  'auth.forgotPassword': 'Forgot password?',
  'auth.signIn': 'Sign in',
  'auth.signingIn': 'Signing in…',
  'auth.tagline': 'Automate · Integrate · Elevate',
  'auth.err.invalidCreds': 'Email or password is incorrect.',
  'auth.err.notConfirmed': 'Please confirm your email before signing in.',
  'auth.err.rateLimit': 'Too many attempts. Please wait a few minutes and try again.',
  'auth.err.network': 'Network error. Check your connection and try again.',
  'auth.err.invalidEmail': 'That email address looks invalid.',

  'forgot.title': 'Reset your password',
  'forgot.subtitle.idle': "Enter your email and we'll send you a reset link.",
  'forgot.subtitle.sent': "We've sent you a link to reset your password.",
  'forgot.checkInbox': 'Check {email} for the reset link.',
  'forgot.notReceived': "Didn't get it? Check your spam folder, or",
  'forgot.tryAgain': 'try again',
  'forgot.btn.send': 'Send reset link',
  'forgot.btn.sending': 'Sending…',
  'auth.backToSignIn': '← Back to sign in',

  'reset.title': 'Set a new password',
  'reset.subtitle': "Choose a strong password you haven't used before.",
  'reset.invalidLink': 'This reset link is invalid or has expired.',
  'reset.requestNew': 'Request a new link',
  'reset.success': 'Password updated',
  'reset.redirecting': 'Redirecting to your dashboard…',
  'reset.newPassword': 'New password',
  'reset.confirmPassword': 'Confirm password',
  'reset.newPlaceholder': 'At least 8 characters',
  'reset.confirmPlaceholder': 'Re-enter your password',
  'reset.errMinLength': 'Password must be at least 8 characters.',
  'reset.errMismatch': 'Passwords do not match.',
  'reset.btn.update': 'Update password',
  'reset.btn.updating': 'Updating…',
} as const

export type TranslationKey = keyof typeof en
export type Dictionary = Record<TranslationKey, string>

const el: Dictionary = {
  // Nav
  'nav.workspace': 'Χώρος εργασίας',
  'nav.patients': 'Ασθενείς',
  'nav.calendar': 'Ημερολόγιο',
  'nav.billing': 'Χρεώσεις',
  'nav.settings': 'Ρυθμίσεις',
  'nav.practitioner': 'Θεραπευτής',

  // Top bar
  'topbar.signOut': 'Αποσύνδεση',
  'topbar.toggleTheme': 'Εναλλαγή θέματος',

  'sidebar.locked.title': 'Κλειδωμένος πίνακας',
  'sidebar.locked.body': 'Επιλέξτε πακέτο παρακάτω για να ξεκλειδώσετε ασθενείς, ημερολόγιο και ρυθμίσεις.',
  'sidebar.locked.tooltip': 'Επιλέξτε πακέτο για να ξεκλειδώσετε αυτή την ενότητα.',

  // Settings page
  'settings.title': 'Ρυθμίσεις',
  'settings.subtitle': 'Διαχείριση ρυθμίσεων και ενσωματώσεων της πρακτικής σας.',
  'settings.loadFailed': 'Αποτυχία φόρτωσης ρυθμίσεων',
  'settings.tab.general': 'Γενικά',
  'settings.tab.profile': 'Προφίλ',
  'settings.tab.security': 'Ασφάλεια',
  'settings.tab.notifications': 'Ειδοποιήσεις',
  'settings.tab.mydata': 'myDATA (ΑΑΔΕ)',

  // Profile tab
  'settings.profile.title': 'Προφίλ',
  'settings.profile.subtitle': 'Το ονοματεπώνυμο, τα στοιχεία επικοινωνίας και το συνδεδεμένο Google Calendar.',
  'settings.profile.name': 'Ονοματεπώνυμο',
  'settings.profile.email': 'Email',
  'settings.profile.emailHelp': 'Η αλλαγή email απαιτεί επιβεβαίωση μέσω συνδέσμου στη νέα διεύθυνση. Μέχρι να επιβεβαιωθεί, η σύνδεση γίνεται με το παλιό email.',
  'settings.profile.phone': 'Τηλέφωνο (προαιρετικό)',
  'settings.profile.calendarId': 'Google Calendar ID',
  'settings.profile.calendarIdHelp': 'Το email του ημερολογίου που χρησιμοποιεί η Ροή #1 για συγχρονισμό. Συνήθως το email του Google λογαριασμού σας.',
  'settings.profile.save': 'Αποθήκευση προφίλ',
  'settings.profile.saving': 'Αποθήκευση…',
  'settings.profile.saved': 'Το προφίλ ενημερώθηκε ✓',
  'settings.profile.savedEmail': 'Το προφίλ ενημερώθηκε. Ελέγξτε το νέο email σας για να επιβεβαιώσετε την αλλαγή.',
  'settings.profile.errName': 'Το ονοματεπώνυμο δεν μπορεί να είναι κενό.',
  'settings.profile.errCalendarId': 'Το Calendar ID δεν μπορεί να είναι κενό.',
  'settings.profile.errEmail': 'Εισάγετε ένα έγκυρο email.',

  // Security tab
  'settings.security.title': 'Ασφάλεια',
  'settings.security.subtitle': 'Αλλαγή του κωδικού σύνδεσης.',
  'settings.security.currentPassword': 'Τρέχων κωδικός',
  'settings.security.newPassword': 'Νέος κωδικός',
  'settings.security.confirmPassword': 'Επιβεβαίωση νέου κωδικού',
  'settings.security.passwordHelp': 'Τουλάχιστον 8 χαρακτήρες.',
  'settings.security.save': 'Ενημέρωση κωδικού',
  'settings.security.saving': 'Ενημέρωση…',
  'settings.security.saved': 'Ο κωδικός ενημερώθηκε ✓',
  'settings.security.errMinLength': 'Ο νέος κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες.',
  'settings.security.errMismatch': 'Οι κωδικοί δεν ταιριάζουν.',
  'settings.security.errCurrent': 'Ο τρέχων κωδικός είναι λάθος.',

  // Notifications tab
  'settings.notifications.title': 'Ειδοποιήσεις',
  'settings.notifications.subtitle': 'Έλεγχος των αυτόματων μηνυμάτων που στέλνει και λαμβάνει το ιατρείο σας.',
  'settings.notifications.smsReminder': 'SMS υπενθυμίσεις στους ασθενείς',
  'settings.notifications.smsReminderHelp': 'Όταν είναι ενεργό, η Ροή #1 στέλνει υπενθύμιση στα ελληνικά + σύνδεσμο επιβεβαίωσης σε κάθε ασθενή με αριθμό τηλεφώνου.',
  'settings.notifications.offset': 'Αποστολή υπενθύμισης τόσες ώρες πριν το ραντεβού',
  'settings.notifications.offsetHelp': 'Μεταξύ 1 και 168 ωρών (7 ημέρες). Προεπιλογή: 24 ώρες.',
  'settings.notifications.emailDigest': 'Καθημερινό email με τα ραντεβού της ημέρας',
  'settings.notifications.emailDigestHelp': 'Λάβετε μια σύνοψη κάθε πρωί με τα ραντεβού της ημέρας. (Σύντομα — η ρύθμιση αποθηκεύεται για όταν ενεργοποιηθεί.)',
  'settings.notifications.save': 'Αποθήκευση προτιμήσεων',
  'settings.notifications.saving': 'Αποθήκευση…',
  'settings.notifications.saved': 'Οι προτιμήσεις ενημερώθηκαν ✓',
  'settings.notifications.errOffset': 'Η υπενθύμιση πρέπει να είναι μεταξύ 1 και 168 ωρών.',

  'settings.language.title': 'Γλώσσα',
  'settings.language.subtitle': 'Επιλέξτε τη γλώσσα του πίνακα ελέγχου.',
  'settings.language.english': 'English',
  'settings.language.greek': 'Ελληνικά',
  'settings.language.saved': 'Η γλώσσα ενημερώθηκε ✓',

  'settings.rate.title': 'Χρέωση Συνεδρίας',
  'settings.rate.subtitle':
    'Προεπιλεγμένη χρέωση ανά συνεδρία. Χρησιμοποιείται για την έκδοση αποδείξεων στο myDATA.',
  'settings.rate.label': 'Χρέωση ανά συνεδρία (EUR)',
  'settings.rate.save': 'Αποθήκευση χρέωσης',
  'settings.rate.saving': 'Αποθήκευση…',
  'settings.rate.saved': 'Η χρέωση ενημερώθηκε ✓',
  'settings.rate.errPositive': 'Η χρέωση πρέπει να είναι μεγαλύτερη από €0',
  'settings.rate.errSession': 'Η συνεδρία έληξε. Παρακαλώ συνδεθείτε ξανά.',

  // myDATA tab
  'mydata.verified': 'Επιβεβαιωμένο',
  'mydata.field.username': 'Όνομα χρήστη myDATA (ΑΑΔΕ)',
  'mydata.field.subscriptionKey': 'Subscription key',
  'mydata.field.subscriptionKey.keepExisting': '(αφήστε κενό για να διατηρηθεί το υπάρχον)',
  'mydata.field.environment': 'Περιβάλλον',
  'mydata.env.sandbox': 'Sandbox (ΑΑΔΕ δοκιμαστικό)',
  'mydata.env.production': 'Παραγωγή',
  'mydata.field.vat': 'ΑΦΜ — 9 ψηφία',
  'mydata.field.kad': 'Κωδικός ΚΑΔ',
  'mydata.kad.placeholder': 'Επιλέξτε…',
  'mydata.kad.869014': '869014 — Υπηρεσίες ψυχολόγου',
  'mydata.kad.869039': '869039 — Λοιπές υπηρεσίες ανθρώπινης υγείας',
  'mydata.field.regime': 'Καθεστώς ΦΠΑ',
  'mydata.regime.exempt': 'Απαλλαγή (Άρθρο 22 — προεπιλογή κλινικής ψυχολογίας)',
  'mydata.regime.standard': 'Κανονικό 24%',
  'mydata.regime.mixed': 'Μικτό (κάποιες υπηρεσίες φορολογούνται)',
  'mydata.field.address': 'Διεύθυνση επιχείρησης (εκτυπώνεται στις αποδείξεις)',
  'mydata.secondaryTaxable':
    'Παράλληλα με την κλινική ψυχολογία προσφέρω και φορολογητέες υπηρεσίες (π.χ. συμβουλευτική, εκπαίδευση HR). Οι αντίστοιχες αποδείξεις θα φέρουν κανονικό ΦΠΑ.',
  'mydata.consent':
    'Εξουσιοδοτώ το BookFlow να έχει πρόσβαση στον λογαριασμό μου στο myDATA, με τα παραπάνω στοιχεία, για την υποβολή ηλεκτρονικών αποδείξεων στα ραντεβού που επιβεβαιώνω. Παραμένω ο/η νόμιμος εκδότης.',
  'mydata.errConsent': 'Πρέπει να εξουσιοδοτήσετε το BookFlow να αποκτήσει πρόσβαση στο myDATA σας.',
  'mydata.errKey': 'Το subscription key είναι υποχρεωτικό.',
  'mydata.btn.verify': 'Επιβεβαίωση & αποθήκευση',
  'mydata.btn.update': 'Ενημέρωση & νέα επιβεβαίωση',
  'mydata.btn.verifying': 'Επιβεβαίωση με ΑΑΔΕ…',

  // Calendar
  'calendar.title': 'Ημερολόγιο',
  'calendar.new': 'Νέο ραντεβού',
  'calendar.newDisabledTooltip':
    'Τα ραντεβού συγχρονίζονται από το Google Calendar. Η απευθείας δημιουργία έρχεται σύντομα.',
  'calendar.today': 'Σήμερα',
  'calendar.prev': 'Προηγούμενο',
  'calendar.next': 'Επόμενο',
  'calendar.view.day': 'Ημέρα',
  'calendar.view.week': 'Εβδομάδα',
  'calendar.view.month': 'Μήνας',
  'calendar.viewAria': 'Προβολή ημερολογίου',
  'calendar.empty': 'Δεν υπάρχουν ραντεβού αυτή την ημέρα',
  'calendar.moreCount': '+{n} ακόμη',
  'calendar.day.mon': 'Δευ',
  'calendar.day.tue': 'Τρί',
  'calendar.day.wed': 'Τετ',
  'calendar.day.thu': 'Πέμ',
  'calendar.day.fri': 'Παρ',
  'calendar.day.sat': 'Σάβ',
  'calendar.day.sun': 'Κυρ',
  'calendar.unknownPatient': 'Άγνωστος ασθενής',
  'calendar.unknown': 'Άγνωστος',

  'panel.title': 'Ραντεβού',
  'panel.close': 'Κλείσιμο',
  'panel.patient': 'Ασθενής',
  'panel.summary': 'Περιγραφή',
  'panel.workflow': 'Ροή εργασίας',
  'panel.phone': 'Τηλέφωνο',
  'panel.minutes': '{n} λεπτά',
  'panel.intake.done': 'Το intake ολοκληρώθηκε',
  'panel.intake.pending': 'Εκκρεμεί το intake',
  'panel.soap.done': 'Καταγράφηκε σημείωση SOAP',
  'panel.soap.pending': 'Δεν υπάρχει ακόμη SOAP',
  'panel.receipt.done': 'Η απόδειξη εκδόθηκε',
  'panel.receipt.pending': 'Η απόδειξη δεν έχει εκδοθεί',
  'panel.openAppointment': 'Άνοιγμα ραντεβού',
  'panel.patientProfile': 'Καρτέλα ασθενούς',

  // Patients list
  'patients.title': 'Ασθενείς',
  'patients.subtitle': 'Όλοι οι ασθενείς που συνδέονται με τα ραντεβού του ημερολογίου σας.',
  'patients.kpi.total': 'Σύνολο ασθενών',
  'patients.kpi.intakeDone': 'Ολοκληρωμένα intake',
  'patients.kpi.intakePending': 'Εκκρεμή intake',
  'patients.kpi.totalSessions': 'Σύνολο συνεδριών',
  'patients.list.all': 'Όλοι οι ασθενείς',
  'patients.list.count.one': '{n} ασθενής',
  'patients.list.count.other': '{n} ασθενείς',
  'patients.empty':
    'Δεν υπάρχουν ακόμη ασθενείς. Θα εμφανιστούν μόλις συγχρονιστούν ραντεβού από το Google Calendar.',
  'patients.intake.done': 'Ολοκληρωμένο intake',
  'patients.intake.pending': 'Εκκρεμές intake',

  // Patient detail
  'patient.intakeStatus': 'Κατάσταση intake',
  'patient.intake.completed': 'Ολοκληρώθηκε',
  'patient.intake.pending': 'Εκκρεμές',
  'patient.stats.sessions': 'Συνεδρίες',
  'patient.stats.upcoming': 'Επερχόμενα',
  'patient.stats.completed': 'Ολοκληρωμένα',
  'patient.stats.billed': 'Χρεωμένα',
  'patient.soap.title': 'Συγκεντρωτική σύνοψη SOAP',
  'patient.appointments.title': 'Ραντεβού',
  'patient.appointments.totalSuffix': 'σύνολο',
  'patient.appointments.empty': 'Δεν υπάρχουν ραντεβού ακόμη.',
  'patient.session': 'Συνεδρία',

  // Regenerate
  'regenerate.btn': 'Αναδημιουργία SOAP',
  'regenerate.btn.busy': 'Αναδημιουργία…',
  'regenerate.unlimited': 'Απεριόριστες αναδημιουργίες',
  'regenerate.counter': '{n}/{limit} αναδημιουργίες',
  'regenerate.noTranscripts':
    'Δεν υπάρχουν διαθέσιμες απομαγνητοφωνήσεις για αναδημιουργία.',
  'regenerate.noAuth': 'Μη συνδεδεμένος. Παρακαλώ ανανεώστε και προσπαθήστε ξανά.',
  'regenerate.quotaHit':
    'Έχετε χρησιμοποιήσει όλες τις αναδημιουργίες αυτού του μήνα. Αναβαθμίστε σε Professional.',
  'regenerate.failed': 'Η αναδημιουργία SOAP απέτυχε: {error}',
  'regenerate.failedGeneric': 'Η αναδημιουργία SOAP απέτυχε. Δοκιμάστε ξανά.',
  'regenerate.success': 'Το SOAP αναδημιουργήθηκε με επιτυχία!',
  'regenerate.tooltipNoTranscripts': 'Δεν υπάρχουν ακόμη απομαγνητοφωνήσεις',

  // Appointment
  'appointment.title': 'Ραντεβού',
  'appointment.session': 'Συνεδρία',
  'appointment.sessionNotes': 'Σημειώσεις συνεδρίας',
  'appointment.sessionNotes.subtitle': 'Απομαγνητοφώνηση από την υπαγόρευση μετά τη συνεδρία',
  'appointment.recordNotes': 'Καταγραφή σημειώσεων',
  'appointment.transcribing': 'Απομαγνητοφώνηση σε εξέλιξη…',
  'appointment.noTranscript':
    'Δεν υπάρχει ακόμη απομαγνητοφώνηση. Χρησιμοποιήστε το παραπάνω κουμπί για καταγραφή.',
  'appointment.patient': 'Ασθενής',
  'appointment.phoneLabel': 'Τηλέφωνο',
  'appointment.intakeLabel': 'Intake',

  // Transcript editor
  'transcript.save': 'Αποθήκευση',
  'transcript.saving': 'Αποθήκευση…',
  'transcript.cancel': 'Άκυρο',
  'transcript.edit': 'Επεξεργασία κειμένου',
  'transcript.export': 'Εξαγωγή PDF',
  'transcript.exporting': 'Εξαγωγή…',
  'transcript.exportNoAuth': 'Μη συνδεδεμένος. Παρακαλώ ανανεώστε και προσπαθήστε ξανά.',
  'transcript.exportFailed': 'Η εξαγωγή PDF απέτυχε: {error}',
  'transcript.exportFailedGeneric': 'Η εξαγωγή PDF απέτυχε. Δοκιμάστε ξανά.',
  'transcript.exportSuccess': 'Το PDF εξήχθη με επιτυχία',

  // Status actions
  'statusActions.markAttended': 'Σήμανση παρουσίας',
  'statusActions.marking': 'Σήμανση…',
  'statusActions.markCancelled': 'Σήμανση ακύρωσης',
  'statusActions.cancelling': 'Ακύρωση…',
  'statusActions.confirmCancel':
    'Σήμανση του ραντεβού ως ακυρωμένου; Αυτό θα μπλοκάρει την έκδοση απόδειξης.',
  'statusActions.errSession': 'Η συνεδρία έληξε',
  'statusActions.errGeneric': 'Αποτυχία ενημέρωσης κατάστασης',

  // Status / scribe
  'status.scheduled': 'προγραμματισμένο',
  'status.confirmed': 'επιβεβαιωμένο',
  'status.completed': 'ολοκληρωμένο',
  'status.cancelled': 'ακυρωμένο',
  'scribe.pending': 'εκκρεμεί καταγραφή',
  'scribe.transcribing': 'απομαγνητοφώνηση',
  'scribe.complete': 'καταγράφηκε',
  'scribe.failed': 'απέτυχε καταγραφή',

  // Receipt
  'receipt.title': 'Απόδειξη (myDATA)',
  'receipt.issued': 'Εκδόθηκε',
  'receipt.mark': 'MARK ΑΑΔΕ',
  'receipt.submitted': 'Υποβλήθηκε',
  'receipt.pending': 'Υποβολή στην ΑΑΔΕ…',
  'receipt.pending.help':
    'Συνήθως ολοκληρώνεται σε λίγα δευτερόλεπτα. Αν αργήσει, η ροή ίσως απέτυχε — κάντε επαναφορά για νέα προσπάθεια.',
  'receipt.reset': 'Επαναφορά & νέα προσπάθεια',
  'receipt.resetting': 'Επαναφορά…',
  'receipt.resetConfirm':
    'Επαναφορά κατάστασης απόδειξης; Χρησιμοποιήστε το αν η ροή κράσαρε και η σήμανση έμεινε στο «Υποβολή».',
  'receipt.failed': 'Αποτυχία υποβολής',
  'receipt.failed.help':
    'Η υποβολή της απόδειξης απέτυχε. Δοκιμάστε ξανά ή επικοινωνήστε με την υποστήριξη.',
  'receipt.cta.issue': 'Έκδοση ηλεκτρονικής απόδειξης για αυτή τη συνεδρία',
  'receipt.cta.retry': 'Νέα προσπάθεια έκδοσης απόδειξης',
  'receipt.btn.issue': 'Έκδοση απόδειξης',
  'receipt.btn.issuing': 'Έκδοση…',
  'receipt.btn.retry': 'Νέα προσπάθεια',
  'receipt.errSession': 'Η συνεδρία έληξε',
  'receipt.errFailed': 'Αποτυχία έκδοσης απόδειξης',
  'receipt.errResetFailed': 'Αποτυχία επαναφοράς',

  'receipt.modal.title': 'Έκδοση Απόδειξης',
  'receipt.modal.amount': 'Ποσό (EUR)',
  'receipt.modal.amountHelp':
    'Προεπιλεγμένη χρέωση συνεδρίας. Επεξεργαστείτε για ειδική τιμολόγηση.',
  'receipt.modal.errPositive': 'Το ποσό πρέπει να είναι μεγαλύτερο από €0',
  'receipt.modal.lateTitle': 'Προειδοποίηση καθυστερημένης απόδειξης.',
  'receipt.modal.lateBody':
    'Το ραντεβού ήταν πριν από {hours} ώρες. Η ΑΑΔΕ απαιτεί υποβολή εντός 24 ωρών — οι καθυστερημένες υποβολές επιφέρουν πρόστιμο (€150+). Υποβάλετε όσο το δυνατόν πιο γρήγορα.',
  'receipt.modal.info':
    'Θα εκδοθεί ηλεκτρονική απόδειξη στην ΑΑΔΕ (myDATA) για αυτό το ραντεβού. Το ποσό θα καταχωρηθεί ως απαλλασσόμενη από ΦΠΑ υπηρεσία κλινικής ψυχολογίας.',
  'receipt.modal.cancel': 'Άκυρο',
  'receipt.modal.submit': 'Έκδοση απόδειξης',
  'receipt.modal.submitting': 'Έκδοση απόδειξης…',

  // Billing
  'billing.title': 'Χρεώσεις',
  'billing.subtitle':
    'Διαχειριστείτε τη συνδρομή σας, δείτε τη χρήση και αναβαθμίστε το πακέτο σας.',
  'billing.banner.successTitle': 'Η συνδρομή ενεργοποιήθηκε',
  'billing.banner.successBody':
    'Το πακέτο {plan} είναι πλέον ενεργό. Ίσως χρειαστούν λίγα δευτερόλεπτα να εμφανιστεί στη σελίδα.',
  'billing.banner.cancelled': 'Το checkout ακυρώθηκε. Δεν έγινε καμία χρέωση.',
  'billing.currentPlan': 'Τρέχον πακέτο',
  'billing.renews': 'Ανανεώνεται στις {date}',
  'billing.unpaid.title': 'Επιλέξτε πακέτο για να ξεκινήσετε',
  'billing.unpaid.body':
    'Επιλέξτε ένα πακέτο παρακάτω για να ξεκλειδώσετε τον πίνακα ελέγχου. Μπορείτε να αλλάξετε ή να ακυρώσετε ανά πάσα στιγμή.',
  'billing.upgrade.title': 'Απαιτείται αναβάθμιση',
  'billing.upgrade.body':
    'Αυτή η λειτουργία διατίθεται σε ανώτερο πακέτο. Επιλέξτε ένα παρακάτω για να την ξεκλειδώσετε.',
  'billing.usage.sms': 'SMS υπενθυμίσεις',
  'billing.usage.scribe': 'Καταγραφή AI scribe',
  'billing.usage.unit.messages': 'μηνύματα',
  'billing.usage.unit.minutes': 'λεπτά',
  'billing.usage.thisMonth': 'αυτόν τον μήνα',
  'billing.usage.overQuota':
    'Ξεπεράσατε το όριο — αναβαθμίστε το πακέτο σας ή περιμένετε την επόμενη περίοδο.',
  'billing.usage.atQuota': 'Είστε στο {pct}% του μηνιαίου ορίου σας.',
  'billing.plans.switch': 'Αλλαγή πακέτου',
  'billing.plans.choose': 'Επιλέξτε πακέτο',
  'billing.plans.switch.subtitle':
    'Αναβαθμίστε ή υποβαθμίστε ανά πάσα στιγμή. Οι αλλαγές είναι αναλογικές.',
  'billing.plans.choose.subtitle':
    'Όλα τα πακέτα περιλαμβάνουν απεριόριστους ασθενείς και ραντεβού. Επιλέξτε ένα για να ενεργοποιήσετε τη χρέωση.',
  'billing.manage': 'Διαχείριση συνδρομής',
  'billing.manage.opening': 'Άνοιγμα…',
  'billing.manage.errAuth': 'Πρέπει να είστε συνδεδεμένος.',
  'billing.manage.errFailed': 'Η πύλη απέτυχε',

  'billing.status.unpaid': 'χωρίς πακέτο',
  'billing.status.active': 'ενεργό',
  'billing.status.past_due': 'εκπρόθεσμο',
  'billing.status.cancelled': 'ακυρωμένο',

  'featureGate.title': 'Αναβαθμίστε για ξεκλείδωμα',
  'featureGate.body': 'Η λειτουργία διατίθεται σε ανώτερο πακέτο.',
  'featureGate.cta': 'Δείτε τα πακέτα',

  'plan.essentials': 'Essentials',
  'plan.professional': 'Professional',
  'plan.premium': 'Premium',
  'plan.essentials.tag': 'Επαγγελματίες ξεκινώντας μόνοι',
  'plan.professional.tag': 'Καθιερωμένες πρακτικές',
  'plan.premium.tag': 'Κλινικές πολλών θεραπευτών',

  'plans.period.monthly': 'Μηνιαία',
  'plans.period.annual': 'Ετήσια',
  'plans.period.save': 'Έκπτωση 17%',
  'plans.mostPopular': 'Δημοφιλέστερο',
  'plans.currentPlan': 'Τρέχον πακέτο',
  'plans.priceSuffix': '/μήνα',
  'plans.billedAnnually': '€{annual} ετήσια χρέωση',
  'plans.btn.current': 'Τρέχον πακέτο',
  'plans.btn.loading': 'Φόρτωση…',
  'plans.btn.switch': 'Αλλαγή πακέτου',
  'plans.btn.choose': 'Επιλογή πακέτου',
  'plans.errAuth': 'Πρέπει να είστε συνδεδεμένος.',
  'plans.errCheckout': 'Το checkout απέτυχε',

  'plan.feat.sms.100': '100 SMS υπενθυμίσεις / μήνα',
  'plan.feat.sms.500': '500 SMS υπενθυμίσεις / μήνα',
  'plan.feat.sms.1500': '1.500 SMS υπενθυμίσεις / μήνα',
  'plan.feat.scribe.30min': '30 λεπτά AI scribe / μήνα',
  'plan.feat.scribe.10h': '10 ώρες AI scribe / μήνα',
  'plan.feat.scribe.30h': '30 ώρες AI scribe / μήνα',
  'plan.feat.gcal': 'Συγχρονισμός Google Calendar',
  'plan.feat.intake.1': '1 πρότυπο intake',
  'plan.feat.intake.unlimited': 'Απεριόριστα πρότυπα intake',
  'plan.feat.pdf.single': 'Εξαγωγή μεμονωμένης σημείωσης σε PDF',
  'plan.feat.support.email': 'Email υποστήριξη (48ω)',
  'plan.feat.support.chat': 'Email + chat υποστήριξη (24ω)',
  'plan.feat.support.priority': 'Προτεραιότητα (4ω SLA)',
  'plan.feat.soap.merge': 'Συγκέντρωση SOAP στο χρόνο',
  'plan.feat.soap.structured': 'Δομημένη σύνταξη SOAP',
  'plan.feat.timeline': 'Ιστορικό ασθενούς + αναζήτηση',
  'plan.feat.multiCalendar': 'Πολλαπλά ημερολόγια',
  'plan.feat.seats': '3 θέσεις θεραπευτή',
  'plan.feat.secretary': 'Θέση γραμματείας',
  'plan.feat.backup': 'Μηνιαίο αντίγραφο συμμόρφωσης',
  'plan.feat.analytics': 'Στατιστικά πρακτικής',

  // Auth
  'auth.welcomeBack': 'Καλώς ήρθατε ξανά',
  'auth.signInPrompt': 'Συνδεθείτε στον λογαριασμό σας BookFlow',
  'auth.email': 'Email',
  'auth.emailPlaceholder': 'you@clinic.com',
  'auth.password': 'Κωδικός',
  'auth.passwordPlaceholder': '••••••••',
  'auth.forgotPassword': 'Ξεχάσατε τον κωδικό;',
  'auth.signIn': 'Σύνδεση',
  'auth.signingIn': 'Σύνδεση…',
  'auth.tagline': 'Αυτοματοποιήστε · Ενσωματώστε · Αναβαθμίστε',
  'auth.err.invalidCreds': 'Το email ή ο κωδικός είναι λανθασμένα.',
  'auth.err.notConfirmed': 'Παρακαλώ επιβεβαιώστε το email σας πριν τη σύνδεση.',
  'auth.err.rateLimit': 'Πολλές προσπάθειες. Περιμένετε λίγα λεπτά και δοκιμάστε ξανά.',
  'auth.err.network': 'Σφάλμα δικτύου. Ελέγξτε τη σύνδεσή σας και δοκιμάστε ξανά.',
  'auth.err.invalidEmail': 'Το email φαίνεται μη έγκυρο.',

  'forgot.title': 'Επαναφορά κωδικού',
  'forgot.subtitle.idle':
    'Δώστε το email σας και θα στείλουμε σύνδεσμο επαναφοράς.',
  'forgot.subtitle.sent': 'Σας στείλαμε σύνδεσμο για να επαναφέρετε τον κωδικό σας.',
  'forgot.checkInbox': 'Ελέγξτε το {email} για τον σύνδεσμο επαναφοράς.',
  'forgot.notReceived': 'Δεν τον λάβατε; Ελέγξτε τον φάκελο spam, ή',
  'forgot.tryAgain': 'δοκιμάστε ξανά',
  'forgot.btn.send': 'Αποστολή συνδέσμου',
  'forgot.btn.sending': 'Αποστολή…',
  'auth.backToSignIn': '← Επιστροφή στη σύνδεση',

  'reset.title': 'Ορισμός νέου κωδικού',
  'reset.subtitle': 'Επιλέξτε έναν ισχυρό κωδικό που δεν έχετε ξαναχρησιμοποιήσει.',
  'reset.invalidLink': 'Ο σύνδεσμος επαναφοράς δεν είναι έγκυρος ή έχει λήξει.',
  'reset.requestNew': 'Ζητήστε νέο σύνδεσμο',
  'reset.success': 'Ο κωδικός ενημερώθηκε',
  'reset.redirecting': 'Ανακατεύθυνση στον πίνακα ελέγχου…',
  'reset.newPassword': 'Νέος κωδικός',
  'reset.confirmPassword': 'Επιβεβαίωση κωδικού',
  'reset.newPlaceholder': 'Τουλάχιστον 8 χαρακτήρες',
  'reset.confirmPlaceholder': 'Επαναλάβετε τον κωδικό σας',
  'reset.errMinLength': 'Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες.',
  'reset.errMismatch': 'Οι κωδικοί δεν ταιριάζουν.',
  'reset.btn.update': 'Ενημέρωση κωδικού',
  'reset.btn.updating': 'Ενημέρωση…',
}

const enDict: Dictionary = en

export const DICTIONARIES: Record<Locale, Dictionary> = {
  en: enDict,
  el,
}

// t() with optional {key} interpolation.
export function translate(
  locale: Locale,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  const dict = DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE]
  let s: string = dict[key] ?? DICTIONARIES.en[key] ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
    }
  }
  return s
}

// Locale-aware Date formatters: passes through to the right BCP-47 tag.
export function bcp47(locale: Locale): string {
  return locale === 'el' ? 'el-GR' : 'en-GB'
}
