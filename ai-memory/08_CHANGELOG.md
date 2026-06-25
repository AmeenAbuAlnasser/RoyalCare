# RoyalCare - Changelog

# 2026-06-22 - Appointment API Stale Prisma Runtime Recovery

- Reproduced authenticated `500` responses from `GET /api/v1/tenant/appointments` and `/tenant/appointments/options` and captured PostgreSQL `42703: column "followUpType" does not exist`.
- Confirmed the database and regenerated Prisma client enums match exactly: `NONE`, `SESSION_BASED_PLAN`, `RECURRING_CONTINUOUS`.
- Root cause was the pre-refactor API process still holding the old appointment/service Prisma select in memory after migration removed `Service.followUpType`; the rebuilt source no longer selects that column.
- Updated obsolete QA/inspection scripts that still queried `followUpType`: `scripts/_inspect-appointment-follow-up.mjs`, `services/api/qa-followup-check.cjs`, and `services/api/qa-repair-followup-plan.cjs`.
- Removed stale `.next`, API `dist`, and available `node_modules/.cache` directories; regenerated Prisma, rebuilt API/web, and restarted both local production servers.
- Runtime QA returned `200` for appointments, cancelled filtering, options, and `/tenant/appointments`. Service create/edit accepted both new modes. Completing a recurring QA appointment created exactly one continuous recurring row; all QA data was removed afterward.


# 2026-06-22 - Follow-up Plan Naming and UX Refactor

- Replaced the overlapping fixed/session/recurring naming model with one authoritative `ServiceFollowUpMode`: `NONE`, `SESSION_BASED_PLAN`, or `RECURRING_CONTINUOUS`.
- Removed `ServiceFollowUpType` and `Service.followUpType`; session phase intervals remain in `followUpRules` with `defaultIntervalDays` fallback.
- Added and applied migrations `20260622140000_refactor_follow_up_plan_types`, `20260622141000_backfill_session_plan_rules`, and `20260622141100_backfill_json_null_session_plan_rules`, preserving existing configuration while mapping 8 services to session-based plans, 5 to continuous recurring plans, and 40 to none; former fixed-interval plans receive an equivalent single session-range rule when count and interval exist, including Prisma JSON-null rows.
- Service and custom-appointment forms now show only the session-count treatment plan and continuous recurring follow-up choices, with localized helper text under each option. Arabic uses `خطة علاج بعدد جلسات` and `متابعة دورية مستمرة`.
- Completing the last finite-plan session now marks the entire plan completed; continuous recurring completion still creates the next reminder cycle.
- Prisma format/validate/generate/migrate status, database package typecheck, API build, web typecheck, and web production build passed.

# 2026-06-17 - Public Booking Branch Selection

- Added nullable `BookingRequest.branchId` with migration `20260617124500_add_booking_request_branch`.
- Public simple booking now requires branch selection only when the center has multiple active branches, auto-assigns the single active branch, and keeps city/area optional.
- `/c/[slug]/book` shows localized branch cards above patient info with branch name, city, phone, and WhatsApp.
- `/tenant/booking-requests` cards now display the selected branch and optional patient area.
- Live API verification on `laser-care`: missing branch returned `400 branchId`, selected branch returned `201`, and the created row stored the branch id.
- Verification: Prisma format/generate/migrate deploy, API production build, and web production build passed.

# 2026-06-17 - Simple Booking Request Validation Fix

- Hardened public booking request validation so `SIMPLE_REQUEST` mode does not parse or require `requestedDate`, `requestedTime`, or `providerId`.
- `DIRECT_BOOKING` continues to validate date/time and slot availability.
- Verification: API production build and web production build passed; scoped whitespace check for the touched backend file passed.

# 2026-06-17 - Public Booking Request Area Field

- Added optional `BookingRequest.patientArea` with migration `20260617123000_add_booking_request_patient_area`.
- Updated public booking request creation to accept/store `patientArea`, validate it to 120 characters, include it in booking notifications, and expose it in tenant booking-request responses.
- Added a lightweight city/area field to `/c/[slug]/book` using a searchable browser datalist with common cities and manual typing fallback.
- Updated `/tenant/booking-requests` cards to show the submitted city/area when present.
- Verification: Prisma format/generate/migrate deploy/status, API production build, and web production build passed. `git diff --check` still reports a pre-existing blank-line-at-EOF issue in unrelated `services/api/src/modules/auth/services/tenant-dashboard.service.ts`.

# 2026-06-17 - Public Booking Simple Request Mode

- Added center-level public booking mode setting with `SIMPLE_REQUEST` as the default and `DIRECT_BOOKING` preserving the previous provider/date/time flow.
- Added `PublicBookingMode`, `BookingRequestSource`, `BrandingSettings.publicBookingMode`, `BookingRequest.source`, nullable `BookingRequest.requestedDate`, and migration `20260617120000_add_public_booking_mode`.
- Updated public center APIs to expose the mode and public booking creation to create request-only `BookingRequest` rows with `status=PENDING`, `source=PUBLIC_WEBSITE`, phone, note, and optional service/offer context.
- Updated `/tenant/settings/website` with a localized Public booking mode control.
- Updated `/c/[slug]/book` so simple mode shows the clear Arabic message `اترك بياناتك وسنتواصل معك لتأكيد الموعد.` and hides provider/date/time selection.
- Updated `/tenant/booking-requests` to display request-only rows as contact requests and keep manual scheduling as the admin follow-up path.
- Verification: Prisma format/validate/generate, migration deploy, API production build, web production build, focused API lint, focused web lint with existing `<img>` warnings only, and diff whitespace check passed.

# 2026-06-14 - Tenant Expenses Sidebar Visibility Fix

- Diagnosed why the implemented Expenses module was not visible in tenant navigation.
- Confirmed `/tenant/expenses`, `/tenant/expenses/list`, `/tenant/expenses/new`, `/tenant/expenses/categories`, and `/tenant/expenses/reports` exist and are included in the Next.js build route manifest.
- Updated the tenant shell to normalize legacy dot-form tenant permissions such as `expenses.view` into canonical colon-form keys such as `expenses:view` before sidebar/page access checks.
- Added an Expenses sidebar section with localized EN/AR/HE subitems for overview, all expenses, add expense, and categories, placed in the daily operations group near billing.
- Ensured existing saved `CENTER_MANAGER` role permissions receive effective Expenses permissions by default while preserving normalized tenant RBAC checks.
- Verification: API production build, web production build, focused API lint for touched RBAC services, focused web lint for the tenant shell, and diff whitespace check passed.

# 2026-06-14 - Tenant Expenses Recovery And Stabilization

- Audited the interrupted Expenses module implementation after shutdown.
- Confirmed the module had started across Prisma schema/migration, API module/routes, tenant sidebar/RBAC, tenant routes, API client, reports integration, and Expenses UI.
- Applied pending migration `20260614120000_add_tenant_expenses` and regenerated Prisma Client so API builds recognize expense models.
- Fixed API TypeScript issues in `ExpensesService` and kept the new Expenses API path focused-lint clean.
- Fixed web TypeScript blockers in `/tenant/expenses` and permission-label typing.
- Added list-row edit and delete actions using existing tenant expense update/delete APIs, gated by `expenses:edit` and `expenses:delete`.
- Verified Prisma schema/migration status, API production build, web production build, and focused lint for touched Expenses API/web files.

# 2026-06-14 - Tenant Center Account Profile Editing

- Converted `/tenant/profile` from a read-only user info page into an editable Center Account Profile for operational identity.
- Added backend `GET/PATCH /auth/center/account-profile` to update the existing system sources: owner user name/phone/email, center primary language, active/latest subscription `notificationPhone` as primary WhatsApp, and center avatar via the existing branding logo field.
- Added validation for required full name, main phone, main WhatsApp, email, preferred language, and avatar URL; duplicate email/phone conflicts are mapped to field errors.
- Rebuilt the tenant profile UI around clear sections for center account identity, Primary Center Contact, password management, sticky save state, dirty-state detection, avatar upload, and before-unload protection for unsaved changes.
- Kept website WhatsApp override and branch-specific contact responsibilities separate from the operational center profile source.
- Verification: API production build and web production build passed.

# 2026-06-14 - Tenant/Public Website WhatsApp Source Refactor

- Clarified WhatsApp source architecture without adding duplicate storage: `BrandingSettings.whatsappPhone` is now treated as the optional public website override, while the global operational WhatsApp is derived from the active subscription `notificationPhone` with center owner phone fallback.
- Updated public center API responses so public `branding.whatsappPhone` resolves as website override first, then global operational WhatsApp; existing public website CTA/contact/offer paths continue reading the same public field.
- Updated branch contact cards so branch-specific WhatsApp wins, then falls back to the resolved center website/global WhatsApp.
- Updated public booking follow-up WhatsApp links to use the resolved center WhatsApp instead of platform support WhatsApp.
- Updated tenant settings and website settings labels/helpers to distinguish primary center WhatsApp from optional website WhatsApp override in EN/AR/HE.
- Verification: API production build and web production build passed.

# 2026-06-13 - Tenant Settings UX Refactor

- Refactored the shared tenant public-profile settings surface used by `/tenant/settings` into a calmer SaaS settings experience with section cards for public profile, visual identity, branches, working hours, links/social, SEO, and website settings.
- Added in-form language tabs so Arabic, English, and Hebrew public-profile and branch fields are edited one language at a time instead of rendering repeated multilingual fields together.
- Redesigned branch management into compact summary cards showing branch name, city, phone, status, and main-branch badge by default; full branch details, status toggles, maps URL, working-hours text, save/deactivate, and ordering remain available when expanded.
- Kept existing public-profile image uploads, branch create/update/deactivate/reorder behavior, primary-branch logic, and API contracts intact.
- Verification: web production build passed.

# 2026-06-13 - Tenant Patient Card Terminology Cleanup

- Removed the technical "linked records" metric from `/tenant/patients` summary cards and replaced it with the more practical appointment-count metric for reception workflow.
- Renamed the card label from latest session to latest visit in Arabic/Hebrew/English patient card copy while keeping the existing backend summary calculations intact.
- The card summary now focuses on treatment plans, overdue sessions, outstanding balance, last visit, and appointment count.
- Verification: web production build passed.

# 2026-06-13 - Tenant Patient Card Summary Simplification

- Simplified `/tenant/patients` summary cards so they no longer display a single upcoming appointment count or next session date, avoiding misleading output for patients with multiple future appointments across multiple treatment plans.
- Added `overdueSessionsCount` to the existing patient summary contract and render the card summary as aggregate/history fields only: treatment plan count, overdue sessions, latest visit, outstanding balance, and appointment count.
- Kept existing backend upcoming summary fields intact for filters/future detail use; full patient profile/details remain accessible through the existing primary View action.
- Verification: API production build and web production build passed.

# 2026-06-13 - Tenant 12-Hour Time Formatting

- Standardized tenant-facing appointment/session time display on shared deterministic helpers in `apps/web/src/i18n/formatters.ts`.
- Hardened `formatTime12h(time)` to handle `HH:mm`, `HH:mm:ss`, and ISO-like date-time strings while always rendering English `AM`/`PM`.
- Added `formatAppointmentDateTime(date, time, locale)` and updated patient summaries, dashboard appointment rows, appointment calendar labels, appointment conflict modal, booking requests, follow-up linked appointment labels, appointment form linked-session banner, and report unbilled-session rows to avoid raw 24-hour time output and duplicated `00:00` date/time labels.
- Verification: web production build passed.

# 2026-06-13 - Tenant Patient Summary Data Fix

- Fixed `/tenant/patients` summary cards showing `لا يوجد` despite related appointment, follow-up, invoice, or linked-record data.
- Added a computed patient `summary` to `GET /api/v1/patients` and `GET /api/v1/patients/:patientId`, using batched center-scoped queries instead of per-card fetches.
- Summary fields now include latest completed/booked appointment, nearest upcoming scheduled/confirmed appointment, treatment/follow-up plan count, outstanding invoice balance, upcoming appointment count, and total linked records.
- Updated the patients dashboard to render real summary values and enabled the upcoming-appointment and receivables filters from the same summary data.
- Verification: API production build and web production build passed.

# 2026-06-13 - Tenant Patients Dashboard UX Refresh

- Improved `/tenant/patients` as a patient summary dashboard without changing patient API logic or backend schema.
- Added compact KPI cards for total patients, active patients, archived patients, and patients created this month.
- Reworked patient rows into summary cards with avatar initials, identity details, status badge, registration/gender metadata, summary placeholders for unavailable clinical/financial data, and linked-record context from existing API counts.
- Added a responsive filters bar for gender, status, archive state, upcoming appointments, and receivables.
- Reorganized actions so View is primary, Edit is secondary, and archive/delete live under a More actions menu; permanent delete keeps the existing blocked-delete tooltip behavior.
- Added quick actions for appointment creation and invoice creation where routes already exist, plus a disabled treatment-plan placeholder for future support.
- Added a richer empty state with icon and "Add First Patient" action, plus a pagination-ready footer for larger patient lists.
- Verification: `npm run build` passed in `apps/web`.

# 2026-06-13 - Tenant Reports Dashboard UX Refresh

- Improved `/tenant/reports` frontend hierarchy without changing financial report calculations or API behavior.
- Split the page into a compact date filter bar, four primary KPI cards, five secondary KPI cards, and a two-column desktop analysis grid.
- Added CSS-only bar visuals for revenue/payment status, revenue by service, and top providers using existing report response data.
- Clarified outstanding receivables with focused metrics and a top-debtors list, while keeping the expandable full receivables table.
- Cleaned the completed-without-invoice amber alert so it only appears when sessions need invoicing, keeps the session list, appointment links, and explicit invoice creation actions.
- Updated reports empty-state copy in EN/AR/HE to read as intentional low-data states.
- Verification: `npm run build` passed in `apps/web`.

# 2026-06-08 - Tenant Phantom Invoice Auto-Creation Fix

- Traced tenant invoice creation and found the hidden source: `/tenant/appointments` auto-created an invoice when an appointment status changed to `COMPLETED` and the user had `billing:create`.
- Removed that silent auto-create path; appointment status changes now preserve any existing invoice summary but do not create a new invoice.
- Added `Invoice.source` with `MANUAL`, `AUTO_APPOINTMENT`, `AUTO_FOLLOW_UP`, and `AUTO_RECALCULATION`; current explicit tenant invoice actions save `MANUAL`.
- Confirmed `invoice.create` remains centralized in tenant billing service and frontend invoice creation calls remain tied to explicit invoice buttons.
- Verification: Prisma generate, Prisma migrate deploy, API production build, and web production build passed.

# 2026-06-08 - Service Treatment Plan Templates

- Added service-level treatment plan templates/protocols so one service can support different patient session counts such as 5, 8, or 10 sessions without duplicating the service.
- Added `ServiceTreatmentTemplate` plus appointment and patient follow-up snapshot fields so selected templates are copied into patient plans and future template edits do not mutate historical plans.
- Tenant service create/edit now includes a responsive `Treatment plan templates` section with add/edit/delete, active/default, ordering, total sessions, interval, and optional phase rules.
- Appointment create/edit now shows `Choose treatment plan` when the selected service has active templates, defaults to the service default template, applies session/phase fields, and still allows patient-specific overrides.
- Follow-up and patient treatment summaries now prefer patient-plan snapshot totals and phases over mutable service defaults.
- Verification: Prisma format/generate, API production build, and web production build passed.

# 2026-06-06 - Super Admin Center Creation Logo Persistence Fix

- Fixed the Super Admin new-center wizard so selecting a center logo uploads the image immediately through the existing Super Admin public image upload helper and stores the returned `/uploads/branding/...` URL in `branding.logoUrl`.
- The create-center payload now includes `branding.logoUrl`, matching the backend `CreateCenterBrandingDto.logoUrl` field already persisted into `BrandingSettings.logoUrl`.
- Super Admin center summaries now include `branding.logoUrl` in API responses so newly created centers can show the saved logo immediately instead of initials.
- Verification: API and web production builds passed. Runtime API QA uploaded a logo, created a QA center with that URL, confirmed center details returned the same `branding.logoUrl`, and confirmed tenant `/auth/center/me` returned the same logo for sidebar/session use.

# 2026-06-06 - Super Admin Center Public Visibility Permission Fix

- Fixed the Super Admin center details public visibility toggle so it uses the same platform-session/PermissionGuard flow as other center management actions.
- Added `PATCH /api/v1/centers/:centerId/public-visibility` and `/api/v1/super-admin/centers/:centerId/public-visibility` behind `edit:centers`; the frontend now calls `/centers/:centerId/public-visibility` instead of the legacy `/admin/centers/:centerId/public-visibility` header-only endpoint.
- Verification: API and web production builds passed. Runtime API check toggled and restored QA Recovery public visibility with a platform Super Admin cookie (`200`), while the same request without platform cookie returned `403`.

# 2026-06-06 - Tenant Financial Reports Partial Invoice Receivables Fix

- Hardened receivables calculation for invoices whose stored status is `PARTIAL`. Because the current `Invoice` model does not store `paidAmount` or `remainingAmount`, reports compute balances from invoice amount, `Payment` rows, and `CREDIT_USE` rows; an open invoice with status `PARTIAL` is now counted as partially paid even if no derived paid amount is present.
- Removed temporary reports debug logging after the calculation fix.
- Verification: API and web production builds passed.

# 2026-06-06 - Tenant Financial Reports Open Receivables Range Fix

- Fixed `/tenant/reports` receivables logic so open balances are no longer hidden by the selected report date range.
- Financial reports now separate period revenue, period invoice activity, and all-center open receivables. Revenue still uses actual collection dates, invoice activity uses invoice creation date, and receivables use every non-cancelled invoice with computed remaining balance greater than zero.
- Receivables KPIs now count partially paid invoices, unpaid invoices, patients with balances, total receivables, and highest debt from all open balances until fully paid.
- Added helper copy under the receivables section explaining that it shows every open balance even outside the selected period.
- Verification: API and web production builds passed.

# 2026-06-06 - Tenant Financial Reports Date Filter Clarity

- Clarified `/tenant/reports` date-filter behavior so selected-period invoice KPIs are visibly tied to invoices issued in the range, while revenue continues using actual payment/credit-use collection dates.
- `GET /api/v1/tenant/reports/financial` now returns `reportMeta` with `rangeType`, `startDate`, `endDate`, `invoiceCountIncluded`, and `paymentCountIncluded`; `summary.invoiceCountIncluded` was added for the new KPI.
- Added an active date-range summary near the KPI cards, a new `Invoices in selected range` KPI, and a clear empty-state message when the selected range has no invoices.
- Backend comments now document which date field drives revenue versus receivables/invoice-count metrics.
- Verification: API and web production builds passed.

# 2026-06-06 - Tenant Financial Reports Receivables Dashboard

- Expanded `/tenant/reports` from revenue-only reporting into a financial dashboard with an Outstanding Receivables section.
- `GET /api/v1/tenant/reports/financial` now returns receivables KPIs, receivable details, receivables by payment status, top patients by debt, and revenue-vs-receivables chart data.
- Receivable calculations derive paid and remaining amounts from invoice total, payments, credit uses, and payment status logic rather than relying on `totalAmount` alone.
- Corrected financial report consistency so revenue is based on actual payment/credit-use dates, while receivables and invoice counts are derived from computed remaining balance (`invoice.amount - payments - credit uses`) and overdue/unpaid/partial flags.
- Added open-receivables-only and overdue-only filters, plus a responsive receivables detail table with patient, phone, service, invoice total, paid, remaining, status, last payment, and due date.
- Verification: API and web production builds passed.

# 2026-06-05 - Follow-up Linked Appointment Details Consistency

- Follow-up API responses now include a full `linkedAppointment` object for booked follow-up sessions: id, date, start/end time, status, and provider.
- Booked follow-up session cards now read appointment date, start time, end time, status, and provider from the linked appointment data instead of showing placeholder `Not recorded` values.
- Corrected booked-session isolation so `appointmentId` is never treated as a linked session appointment in `/tenant/follow-ups`; only the current session's `nextAppointmentId`, `linkedAppointmentId`, `nextAppointment`, or `linkedAppointment` can show booked UI/actions.
- View/Edit appointment actions and duplicate-booking hiding continue to use the same linked appointment resolver.
- Verification: API and web production builds passed.

# 2026-06-05 - Follow-up Duplicate Booking Prevention

- Appointment creation now accepts `followUpId` and rejects duplicate booking when the follow-up session already has `nextAppointmentId`; in the current schema `appointmentId` is the source completed appointment that created the follow-up, not the newly booked appointment.
- Backend duplicate protection runs inside the appointment create transaction: the appointment is created and linked to the follow-up only if the follow-up is still unlinked; competing duplicate requests roll back with `400 This follow-up session already has an appointment.`
- Appointment create from follow-up now sends `followUpId` in the payload, and the appointment form disables saving when the loaded follow-up already has a linked appointment.
- The existing follow-up session card continues hiding `Book session` for linked sessions and shows View/Edit appointment actions instead.
- Fixed the follow-up session Actions dropdown itself so `Book session` is rendered only when there is no `nextAppointment`/`nextAppointmentId` and the status is not `BOOKED`, `COMPLETED`, or `CANCELLED`; linked sessions render View/Edit appointment actions instead.
- Booked follow-up cards now show visible primary View Appointment and secondary Edit Appointment buttons whenever a linked appointment id exists, even if the full linked appointment object is not present in the response.
- Added a single frontend `getLinkedAppointmentId()` resolver for follow-up session actions and booked-state UI. It checks `linkedAppointmentId`, `nextAppointmentId`, `appointment?.id`, and `nextAppointment?.id`, with `appointmentId` used only as a legacy fallback for `BOOKED` rows because current API data uses `appointmentId` for the source completed appointment.
- Follow-up API responses now include `linkedAppointmentId` as an explicit alias for `nextAppointmentId`; booked rows without any resolvable appointment id show a visible warning instead of silently hiding appointment actions.
- Verification: API and web production builds passed.

# 2026-06-05 - Follow-up Booked Session Visual States

- Follow-up session cards now derive their visual state from linked appointment existence and appointment status: unbooked, booked, completed, missed, or cancelled.
- Booked sessions show a distinct blue appointment state, linked appointment badge, appointment date/time/status/provider, and View/Edit appointment actions; the Book Session action is hidden once a linked appointment exists.
- Treatment summary progress now counts completed, booked, and remaining finite sessions from the derived visual state so the top summary matches the timeline cards.
- Follow-up API `nextAppointment` now includes the linked appointment provider for accurate provider display in booked-session cards.
- Verification: web and API production builds passed.

# 2026-06-05 - Dynamic Business Data No-Translation Hardening

- Fixed frontend display helpers so user/business data values are no longer selected or transformed by the active UI locale.
- Patient names, provider/staff names, center names, service names, custom service names, invoice service names, appointment conflict service names, follow-up service names, and patient-portal service/center names now render from stable stored values with deterministic fallbacks.
- UI labels, statuses, helper text, RTL direction, and date formatting remain localized; only dynamic business data display was hardened.
- Removed development console logs from the public booking form after touching the page for service/center display safety.
- Verification: `apps/web` production build passed.

# 2026-06-05 - Follow-ups Identity Labeling Fix

- Fixed `/tenant/follow-ups` identity confusion by explicitly labeling patient, phone, service, provider, plan, and session values in collapsed rows, expanded treatment summaries, and session cards.
- Provider/staff names now appear only under the Provider label, with Arabic label `المعالج / المقدم`, so owner/staff names no longer look like patient names.
- Added frontend normalization helpers for patient display name, service display name, provider display name, treatment plan label, and session label using the existing follow-up API response fields.
- Updated the appointment-from-follow-up banner to show labeled patient, service, session, and due date values.
- Removed temporary console/debug logs from the follow-ups and appointment form pages.
- Verification: web production build passed.

# 2026-06-05 - Follow-up Appointment Prefill and Link Fix

- Fixed appointment creation from a follow-up session so `/tenant/appointments/new?patientId=...&serviceId=...&followUpId=...` hydrates only after follow-up and appointment option data are loaded.
- The form now auto-fills patient, service, provider from the follow-up/last-treatment provider when available, appointment date from the follow-up due date, duration from the selected service, `SCHEDULED` status, and note `موعد من خطة متابعة`.
- Available slot loading now waits for provider, appointment date, and duration to be ready, then loads automatically after hydration while preserving manual edits after the initial prefill.
- Added a source follow-up banner showing that the appointment is created from a follow-up plan, including session number, service name, and due date.
- Follow-up status updates now optionally accept `nextAppointmentId`; the API validates same-center/same-patient/same-service ownership and stores the appointment link when marking a follow-up `BOOKED`.
- Verification: web and API builds passed.

# 2026-06-05 - Tenant Follow-ups Treatment Journey UX

- Redesigned expanded `/tenant/follow-ups` patient plans from technical session rows into a clearer medical treatment journey.
- Added a Treatment Summary card above the timeline using existing API data only: diagnosis/condition notes where available, main treatment, plan type, progress, provider, last completed session, next upcoming session, medical notes, start date, and expected completion.
- Session cards now show journey-style titles such as `Session 1 — Service Name`, visible status, due date, provider, notes, and stronger completed/today/overdue/upcoming status colors/icons.
- Preserved existing filters, WhatsApp links, booking action, status updates, due-date edits, note saving, lazy plan loading, and current API logic.
- Verification: `apps/web` production build passed.

# 2026-06-04 - Tenant Staff Owner/Manager Duplicate Display Fix

- Fixed `/tenant/staff` so users with multiple center roles appear once in the staff list.
- Tenant staff list API now aggregates `UserRole` rows by user and returns `roles[]` plus `isCenterOwner` for display-only role badge merging.
- The staff page now renders multiple localized role badges on one card, so a center owner who is also manager shows both `Center Owner` and `Center Manager` / `مالك المركز` and `مدير المركز` / `בעל המרכז` and `מנהל המרכז`.
- Center owner status changes are protected: the UI disables the status toggle for the owner and the API rejects attempts to deactivate the center owner.
- Other staff list search/status/role filters continue to work over the aggregated unique staff users.
- Verification: API and web builds passed.

# 2026-06-03 - Session-Based Follow-up Plan Total UX

- Fixed session-based fixed follow-up plans so `SESSION_PLAN` no longer exposes the editable `totalRecommendedSessions` input in tenant service create/edit or appointment custom-service follow-up settings.
- Added `calculateTotalSessionsFromRules(rules)` helpers on the frontend and backend; the derived total is the highest `toSessionNumber` across treatment phases.
- The UI now shows a readonly localized summary card such as `Total sessions: 8 sessions` / `إجمالي الجلسات: 8 جلسات` / `סה״כ מפגשים: 8` with helper text explaining the number is calculated from treatment phases.
- Payload generation now sends the derived total for `FINITE_PLAN + SESSION_PLAN`, while non-session fixed plans keep the manual total field.
- Backend service/custom-service validation and persistence now derive `totalRecommendedSessions` from session rules and reject session plans without valid phase rules, preventing stale manual totals from driving plan generation.
- Verification: web and API builds passed.

# 2026-06-03 - Follow-up Mode Label Localization

- Added `services.followUp.none`, `services.followUp.fixedPlan`, and `services.followUp.recurring` translation keys in EN/AR/HE.
- Service create/edit follow-up mode radio labels now read from the new dictionary keys.
- Appointment custom-service follow-up mode radio labels now read from the same dictionary keys.
- Removed the old `followUpMode*` dictionary fields and hardcoded form fallback/copy labels for the three follow-up modes.
- Arabic now renders `بدون متابعة`, `خطة علاج ثابتة`, and `متابعة دورية مستمرة`; Hebrew renders `ללא מעקב`, `תוכנית טיפול קבועה`, and `מעקב מחזורי מתמשך`.
- Verification: web build passed, and source search found no remaining hardcoded follow-up mode labels in the service/appointment form code.

# 2026-06-03 - Patient Create/Edit Optional Field Labels

- The shared patient create/edit modal now displays a secondary localized optional marker for non-required patient fields.
- Required labels such as full name and phone remain unchanged with the existing red `*`.
- Optional fields now marked include localized name variants, email, gender, date of birth, national ID, and notes.
- The notes label now reads "Additional notes" / "ملاحظات إضافية" / "הערות נוספות" with the optional marker appended by the field component.
- The status field now shows the required `*` because it is a controlled default selector rather than optional patient information.
- Web build passed.

# 2026-06-03 - Tenant Billing Summary Clarity UX

- Tenant invoice details now add muted helper descriptions to invoice total, paid amount, balance due, and patient credit summary cards.
- Balance due summary cards include a desktop hover tooltip explaining `Balance Due = Invoice Total - Paid`.
- Invoice status badges now show short explanatory copy underneath for paid, partial, and unpaid/pending states.
- Billing status colors were clarified: paid uses green, partial uses amber/orange, pending/unpaid uses red, and credit stays indigo.
- The appointment details invoice section received the same billing summary descriptions and status explanation treatment for consistency.
- Web build passed.

# 2026-06-03 - Tenant Follow-ups Search Fix

- Removed the extra quick CRM chips below the `/tenant/follow-ups` search input, leaving only the main search input and existing status filter row.
- Fixed follow-up search so an active query loads the same-center queue with `includeAll=true`, ignores the current status/date filter for matching, and filters locally by patient name, phone, service name, and provider name.
- Improved Arabic search normalization by trimming, removing diacritics/tatweel, normalizing Alef variants, Ya/Alef Maqsura, and Ta Marbuta, and lowercasing comparisons.
- Phone search now ignores spaces/symbols and supports partial numeric matches in addition to exact phone matches.
- Search auto-expands only when there is a single matching patient group and keeps `q` plus `filter` in URL state.
- Verification: web build passed.

# 2026-06-03 - Tenant Follow-ups Smart Search and CRM Filtering

- Added sticky realtime search to `/tenant/follow-ups` with localized placeholders for AR/EN/HE.
- Search matches patient names, phone numbers, service names, and provider names where available, ranks exact phone and exact patient-name matches first, and highlights matched patient/phone/service text in compact patient rows.
- Search input is debounced by 300ms, persists to `q` in the URL, auto-expands matching patient accordions, and scrolls the single matching patient into view.
- When search is active, it loads the same-center queue with `includeAll=true` and applies search client-side, so search results override the currently selected status/date filter.
- Added CRM quick chips for Today, Overdue, Recurring, Treatment plans, Not contacted, Booked, and Completed. Recurring/treatment/not-contacted chips use client-side filtering over the same `includeAll=true` queue.
- Added localized search empty states and a `Search results` badge above matched rows.
- Verification: web and API builds passed.

# 2026-06-03 - Recurring Follow-up Creation on Appointment Completion Status Change

- Fixed recurring follow-up creation when an existing appointment changes from a non-completed status to `COMPLETED`.
- `PatientFollowUpsService.createFromCompletedAppointment()` now treats `service.followUpMode === RECURRING` as the authoritative recurring trigger instead of letting legacy `followUpEnabled` / `autoCreateNextReminder` checks block the recurring path first.
- Recurring due dates are now based on `appointment.completedAt` when available, falling back to `appointment.appointmentDate`.
- Finite-plan behavior remains guarded by `followUpMode`, `followUpEnabled`, and `autoCreateNextReminder`.
- Verification: API build passed. Runtime API QA on port `3005` patched a scheduled `حجامة` appointment to `COMPLETED`, created exactly one recurring follow-up due `2026-09-03`, confirmed `GET /tenant/follow-ups?filter=UPCOMING` includes it, and confirmed re-saving `COMPLETED` leaves the follow-up count at `1`.

# 2026-06-03 - Tenant Follow-ups Recurring vs Treatment Plan Visual Separation

- Updated `/tenant/follow-ups` patient rows and expanded follow-up cards to show explicit follow-up type badges: recurring reminders use an indigo `♾ Recurring` / `♾ متابعة دورية` / `♾ מעקב מחזורי` badge, while finite treatment plans use a blue `📋 Treatment Plan` / `📋 خطة علاج` / `📋 תוכנית טיפול` badge.
- Recurring rows now show lifecycle reminder copy, interval text, last session date when available, and next follow-up date. They no longer show session progress, progress dots, session numbers, or plan completion counts.
- Finite treatment plans still show session progress and plan dots, with recurring follow-ups excluded from finite-plan progress totals.
- The recurring action menu labels due-date editing as snooze/postpone while preserving WhatsApp, booking, contacted, booked, and completed actions.
- Verification: `apps/web` and `services/api` builds passed.

# 2026-06-03 - Follow-up Settings UI Mode Separation

- Fixed follow-up settings UI separation in tenant services and appointment custom-service settings.
- `NONE` now hides all follow-up fields.
- `FINITE_PLAN` shows only fixed treatment-plan fields: plan type, default interval, total sessions, auto-create next reminder, presets, session rules, plan preview, and existing WhatsApp templates.
- `RECURRING` shows only the recurring interval UI: "Repeat every" value and unit, plus helper text. Treatment session count, fixed interval/session-rule fields, presets, plan preview, and WhatsApp templates are hidden.
- Updated labels to EN `No follow-up`, `Fixed treatment plan`, `Recurring lifetime follow-up`; AR `بدون متابعة`, `خطة علاج بجلسات محددة`, `متابعة دورية مستمرة`; HE `ללא מעקב`, `תוכנית טיפול מוגדרת`, `מעקב מחזורי מתמשך`.
- Recurring units now use singular labels: EN Day/Week/Month/Year, AR يوم/أسبوع/شهر/سنة, HE יום/שבוע/חודש/שנה.
- Added appointment custom-service payload/backend wiring for `followUpMode`, `recurringIntervalValue`, and `recurringIntervalUnit`.
- Verification: API and web builds passed. Runtime API QA confirmed saving a recurring service stores `followUpMode=RECURRING` with recurring interval fields and no session/default interval fields; saving a finite plan stores `followUpMode=FINITE_PLAN` with sessions/default interval and no recurring fields; saving a custom service from an appointment stores `followUpMode=RECURRING` with `6-MONTH` and no finite-plan fields.

# 2026-06-03 - Recurring Lifetime Follow-ups

- Added recurring lifetime follow-up support alongside existing finite treatment plans.
- Added Prisma migration `20260603120000_add_recurring_follow_ups` with `ServiceFollowUpMode`, `RecurringIntervalUnit`, recurring service settings, and recurring metadata on `PatientFollowUp`.
- Tenant services now support `followUpMode=NONE|FINITE_PLAN|RECURRING`, recurring interval value/unit, automatic WhatsApp reminder flags, and reminder lead days.
- Appointment completion now creates only one active recurring follow-up for recurring services and enforces max one active recurring row per patient/service across `UPCOMING`, `DUE`, `CONTACTED`, `BOOKED`, and `MISSED`.
- Marking a recurring follow-up `COMPLETED` creates exactly one next recurring follow-up from the completed row's stored interval snapshot, skips if a newer active recurring row exists, and does not recursively regenerate old completed rows.
- Recurring follow-up cards display EN `Recurring Follow-up`, AR `متابعة دورية`, HE `מעקב מחזורי`, and recurring rows are excluded from treatment progress/session bars.
- Follow-up analytics now returns `recurringDueToday`, `recurringThisWeek`, and `recurringPatientsRetention`.
- Verification: migration applied locally, Prisma generate passed, API and web production builds passed. Runtime API QA created a recurring Botox service every 4 months, completed an appointment on `2026-06-04`, generated exactly one recurring follow-up due `2026-10-04`, blocked duplicate generation after a second completed appointment, completed that recurring follow-up and generated exactly one next row due `2027-02-04`, re-completing the old row kept total recurring rows at 2 and active rows at 1, and filter checks confirmed recurring rows follow due-date filters only.

# 2026-06-03 - Tenant Follow-ups Next 7 Days Filter Fix

- Changed the `/tenant/follow-ups` `THIS_WEEK` filter from current calendar-week behavior to the product-defined next-7-days window.
- New rule: `dueDate >= today` and `dueDate <= today + 7 days`, excluding `COMPLETED`, `BOOKED`, and `CANCELLED`.
- Backend list filtering and analytics now use the same inclusive next-7-days date window, implemented as `< today + 8 days` for date-only database fields.
- Frontend expanded-plan visibility filtering mirrors the same rule.
- Updated filter/priority labels to EN `Next 7 Days`, AR `خلال 7 أيام`, and HE `7 הימים הקרובים`.
- Decision: Today is allowed to overlap with Next 7 Days because the required next-7-days rule starts at today. In current QA data there were no due-today rows.
- Verification: API and web `npm run build` passed. Runtime API QA on 2026-06-03 returned `THIS_WEEK total=2`, `violations=0`, and confirmed a follow-up due `2026-06-08` (`today + 5`) appeared in the filter.

# 2026-06-03 - Tenant Follow-ups Filter Date Consistency Fix

- Fixed `/tenant/follow-ups` filter logic so `TODAY`, `THIS_WEEK`, `OVERDUE`, and `UPCOMING` rely only on actual due-date bucket rules plus status exclusions, not the visual next-follow-up badge.
- Root cause was date-boundary inconsistency: frontend and backend were deriving "today" with UTC `toISOString()` date keys, which can classify yesterday as today around local midnight in the Asia/Jerusalem tenant context. The backend also used a rolling 7-day window for `THIS_WEEK`.
- Backend list filters and analytics now share local-calendar day boundaries, a current-calendar-week end boundary, and date-filter status logic that excludes `COMPLETED` and `CANCELLED`.
- Frontend expanded-plan visibility filtering now mirrors the backend with local date keys and temporary debug logs for `filterType`, `dueDate`, `todayStart`, `todayEnd`, and `computedVisibility`.
- Verification: API and web `npm run build` passed. Runtime API QA for 2026-06-03 returned `TODAY total=0`, `OVERDUE total=10`, `UPCOMING total=105`, `THIS_WEEK total=0`, `COMPLETED total=1`, `CONTACTED total=1`, and `BOOKED total=1`, all with zero rule violations. Targeted QA confirmed due date `2026-06-02` appeared 5 times in `OVERDUE` and 0 times in every other filter.

# 2026-06-03 - Tenant Profile Header Logo Avatar

- Fixed `/tenant/profile` so the large profile header avatar uses the same resolved center logo source as `CenterAdminShell` instead of always showing user initials.
- `CenterAdminShell` now passes `centerLogoUrl` to child page render context, preserving the shared fallback order: `center.logoUrl`, `center.branding.logoUrl`, public `public_logo_url`, then initials.
- The profile header keeps the existing `h-16 w-16` rounded layout and falls back to initials if the image source is missing or fails to load.
- Verification: web `npm run build` passed. Browser QA confirmed `/tenant/profile` header avatar, sidebar bottom avatar, and sidebar top logo all rendered `/uploads/branding/center-branding-1779703246249-e2d6cffc-b46f-4099-b11f-b3eaaf7d43be.webp` with no initials fallback.

# 2026-06-03 - Tenant Sidebar Branding Consistency

- Fixed the bottom tenant sidebar profile/avatar area to use the same resolved center logo source as tenant branding instead of always showing user initials.
- Logo resolution now prefers `center.logoUrl`, then `center.branding.logoUrl`, then public platform `public_logo_url`, and falls back to initials only when no usable logo exists or image loading fails.
- Tenant favicon manager now receives the same resolved logo source so refresh/navigation branding stays consistent.
- Verification: web `npm run build` passed. Browser QA on `/tenant/dashboard` confirmed the bottom profile link renders an image avatar with `/uploads/branding/center-branding-1779703246249-e2d6cffc-b46f-4099-b11f-b3eaaf7d43be.webp`, no initials fallback, and the same image persisted after forced refresh.

# 2026-06-03 - Tenant Follow-up Due Date Refresh Fix

- Fixed `/tenant/follow-ups` due-date editing so a successful "Save date" mutation immediately updates the edited session card, due-date input draft, patient summary row, remaining-days badge, next-actionable highlight, and active filtered list without requiring a manual refresh.
- Root cause was frontend stale state: the page discarded the `PATCH /tenant/follow-ups/:followUpId/due-date` response and triggered a broad async refresh that could leave grouped patient summaries and expanded accordion content rendering old follow-up objects.
- Mutation refresh now applies the returned follow-up row optimistically, invalidates older in-flight list responses, reloads the opened patient's full plan with `includeAllForPatient=true`, reloads the active filtered list, preserves the opened accordion, and refreshes analytics counts.
- Added temporary debug logs around due-date save: before save, after response, after targeted state refresh, and after state update.
- Verification: web and API `npm run build` passed. Browser DevTools network QA changed follow-up `48e561cd-2508-429d-8245-267cd35f288e` from `2026-06-15` to `2026-06-30`; the PATCH payload was `{"dueDate":"2026-06-30"}`, response status was `200`, response body returned `dueDate:"2026-06-30"` and updated `updatedAt:"2026-06-02T22:01:21.600Z"`, and the expanded UI immediately showed `30/06/2026` with recalculated `27d left`. After a forced page reload, the expanded session still showed `30/06/2026`, the old `15/06/2026` date was absent, and neighboring sessions `22/06/2026` and `29/06/2026` were unchanged.

# 2026-06-02 - Tenant Follow-ups Phase 2 UX Scalability Polish

Improved `/tenant/follow-ups` for production-scale patient queues.

- Patient rows now default to collapsed compact accordions; only overdue/today rows, or direct `patientId` deep links, auto-expand.
- Full session timelines, editable session cards, notes, WhatsApp, booking, and status controls now render only inside expanded patient accordions.
- Added a sticky priority bar with counts for Overdue, Today, This week, and Upcoming.
- Replaced noisy per-session action clusters with a single `Actions` dropdown while keeping WhatsApp as a compact quick action.
- Changed the list layout to a full-width single-column CRM queue to remove large empty desktop whitespace.
- Compact patient rows now show patient name, phone, service, progress, next due date, remaining days, urgency badge, and active follow-up count.
- Backend follow-up list cap was increased from 200 to 1000 rows, and analytics now returns `thisWeek` and `upcoming` counts for the sticky bar.

Verified:
- Web production build passed.
- API build passed.
- Existing 1-patient / 8-session QA fixture was reset and returned sessions 1-8 through the full-plan endpoint.
- Added non-destructive QA scale data with 20 patients and 100 follow-ups in the QA center.
- Live API check returned 20 distinct scale patients, 100 scale follow-ups, 104 upcoming rows total, and sample full-plan sessions 1-5.
- Session notes, due-date, and status edits worked on one card and were restored; neighboring session due date stayed unchanged.
- Authenticated Chrome screenshots captured:
  - `C:\tmp\royalcare-followups-today.png`
  - `C:\tmp\royalcare-followups-upcoming.png`

# 2026-06-02 - Tenant Appointment Edit Current Slot Validation Fix

Fixed tenant appointment edit validation so editing notes/internal notes/status on an existing appointment does not get blocked by the appointment's own booked slot.

- Updated the tenant appointment form slot rendering to add a selectable current-slot override only in edit mode.
- The override applies only when the form still matches the loaded appointment's date, provider, service, start time, and calculated end time.
- The current slot now shows a localized label: EN `Current appointment`, AR `الموعد الحالي`, HE `התור הנוכחי`.
- Create appointment flow remains unchanged and still renders availability directly.
- Backend update validation was inspected and already excludes the edited appointment id from both availability and overlap checks.

Verified:
- Web production build passed.
- API build passed.
- Runtime tenant API QA created temporary appointments in `QA Recovery Center 1779095621868`.
- Availability with `excludeAppointmentId` returned the current slot as available.
- Updating only treatment notes on the existing appointment succeeded.
- Editing that appointment into another booked slot returned `409`.
- Creating a new appointment into that same booked slot returned `409`.

# 2026-06-02 - QA Recovery Operational Data Hard Delete

Added and ran a hard-delete QA cleanup script for `QA Recovery Center 1779095621868`.

- Added `services/api/scripts/qa-hard-delete-center-operational-data.ts`.
- Added API package command `qa:hard-delete-center-data`.
- The script finds the center by exact name, prints id/name/slug/owner, prints operational counts before deletion, deletes inside a transaction, prints deleted counts, prints after counts, and throws if any operational counts remain.
- Deleted only center-scoped operational/test data: appointments, booking requests, booking-related marketing tracking logs, credit transactions, customers, invoices, notification logs, notifications, patient follow-ups, patient portal tokens, patients, payments, and sessions.
- Preserved center, owner/user, staff/user roles, subscriptions, plans, settings, services, and audit logs.

Verified:
- API build passed.
- First run deleted: 10 appointments, 7 booking requests, 5 invoices, 7 booking-related marketing tracking logs, 8 notifications, 12 patient follow-ups, and 6 patients.
- After counts for all operational tables were zero.
- Second run was idempotent with all operational counts already zero.
- Protected records remained: center `1`, owner user `1`, services `11`, subscriptions `1`, user roles `2`, audit logs kept.
- Tenant API checks after cleanup returned `0` patients, `0` appointments, `0` booking requests, and `0` follow-ups; login-as still created the owner tenant session.

# 2026-06-02 - Tenant Follow-ups Expanded Plan Card Correction

Corrected the expanded patient plan UI so the treatment timeline is not mistaken for the follow-up plan.

- Expanded Upcoming patient groups now show a patient summary/header followed by a clear "Full follow-up plan" section.
- The full-plan section renders every fetched follow-up row as its own editable card.
- Each expanded plan card keeps independent due-date editing, notes editing, WhatsApp, appointment creation, mark contacted, mark booked, and mark completed actions.
- Treatment timeline rendering is now opt-in on `FollowUpCard`; expanded full-plan cards suppress the internal timeline so the main view is separate follow-up cards, not a timeline inside one card.
- Created a local QA patient `b3cbf72b-5cfc-44e8-84d9-a1815dbaaa56` in the QA center with 8 follow-up rows for regression verification.

Verified:
- `GET /tenant/follow-ups?filter=UPCOMING` includes the QA patient because it has upcoming follow-ups.
- `GET /tenant/follow-ups?patientId=b3cbf72b-5cfc-44e8-84d9-a1815dbaaa56&includeAllForPatient=true` returned `FULL_PLAN_TOTAL=8`.
- The returned plan included separate sessions 1-8 with mixed statuses: `COMPLETED`, `CONTACTED`, `DUE`, `UPCOMING`, and `BOOKED`.
- Editing session 5 due date to `2026-07-22` worked independently and was restored.
- Editing session 3 notes worked independently and was restored.
- Changing session 6 status to `CONTACTED` worked independently and was restored to `UPCOMING`.
- API build passed.
- Web build passed.

# 2026-06-02 - Tenant Follow-ups Full Patient Plan Expansion

Corrected the Upcoming grouped follow-ups UX so expanded patient cards show the full treatment/follow-up plan, not only the upcoming rows that caused the patient to appear in the summary.

- Added `includeAllForPatient=true` support to `GET /api/v1/tenant/follow-ups` for patient-scoped full-plan loading while keeping normal filters unchanged.
- Upcoming still shows one summary card per patient based on the active Upcoming filter.
- Expanding a patient now fetches all follow-ups for that patient regardless of status and renders them as editable cards.
- Expanded plan rows sort by session number when available, then due date, then created date.
- The highlighted card now uses the next-actionable rule instead of the first visible card: first non-completed/non-booked future row, or nearest pending/overdue row when no future actionable row exists.
- Updated the Arabic and Hebrew next-follow-up labels to the requested text.
- Mutations made inside an expanded plan refresh both the filtered summary list and the full patient plan.

Verified:
- API build passed.
- Web build passed.
- Live tenant API check: all existing filters returned `200`.
- `GET /tenant/follow-ups?filter=UPCOMING` returned three patient summary rows in local QA data.
- `GET /tenant/follow-ups?patientId=<id>&includeAllForPatient=true` returned the selected patient's same-center full plan.
- Due-date edit to `2026-07-22` returned `200`, and the row was restored to `2026-07-06`.
- Unauthenticated due-date edit returned `401`.
- Local QA data did not include an 8-follow-up patient fixture; the maximum same-center patient follow-up count found was 1, so the 8-card visual case still needs a seeded/browser fixture for full manual UI confirmation.

# 2026-06-02 - Tenant Follow-ups Grouped Upcoming UX

Improved `/tenant/follow-ups` so Upcoming follow-ups are grouped by patient.

- Upcoming now renders one patient summary card per `patientId`, showing patient name, phone, number of follow-ups, nearest follow-up date, remaining-time badge, and latest treatment summary when available.
- Expanding a patient shows all upcoming follow-up cards for that patient sorted by due date ascending.
- The nearest follow-up inside each expanded patient group is highlighted with a gold border/background and localized label: EN `Next Follow-up`, AR `المتابعة القادمة`, HE `מעקב הבא`.
- Extracted the follow-up card rendering into a reusable local component so existing actions stay available inside expanded groups: WhatsApp reminder, appointment creation, mark contacted, mark booked, mark completed, notes update, and due-date edit.
- Added a due-date editor to follow-up cards with EN/AR/HE labels.
- Added minimal tenant-safe backend support: `PATCH /api/v1/tenant/follow-ups/:followUpId/due-date` accepts `{ dueDate: "YYYY-MM-DD" }`, requires `appointments:update`, scopes by the authenticated session center, and recalculates `DUE`/`UPCOMING` status from the new date while preserving other workflow statuses.
- Verification passed: API build, web build, live Upcoming list returned rows, setting a QA follow-up due date to `2026-07-22` (50 days after `2026-06-02`) returned `200` with the updated due date, and the QA row was restored to its original `2026-07-01` due date.

# 2026-06-02 - Super Admin Center Public Profile Auth Fix

Fixed the Super Admin Center Details public-profile loading error.

- Root cause: `GET/PATCH/POST /api/v1/admin/centers/:centerId/public-profile...` still required the legacy `x-royalcare-super-admin-user-id` header, while the Super Admin details page API client correctly sends the current `royalcare_platform_session` cookie with `credentials: "include"`.
- Changed the admin center public-profile controller to use `PermissionGuard` instead of manual legacy header auth.
- `GET /api/v1/admin/centers/:centerId/public-profile` now requires `view:centers`.
- `PATCH /api/v1/admin/centers/:centerId/public-profile` and `POST /api/v1/admin/centers/:centerId/public-profile/upload-image` now require `edit:centers`.
- Imported `PermissionsModule` into `CenterPublicProfileModule` so the guard dependencies resolve normally.
- Tenant `GET/PATCH/POST /api/v1/tenant/public-profile...` behavior was not changed.
- Verification passed: API build, web build, cookie-auth admin profile request returned `200`, no-cookie admin request returned permission `403`, legacy-header-only admin request returned permission `403`, and unauthenticated tenant profile request still returned tenant-session `401`.

# 2026-06-01 - Public Marketing Pricing UI Polish

Polished the public homepage pricing preview and `/pricing` page as UI-only work.

- Redesigned pricing cards with wider layouts, stronger shadows, subtle warm gradients, larger pricing typography, roomier feature rows, and hover elevation.
- Treated the Professional/popular plan as the hero plan with a larger/elevated card, gold accent glow, and redesigned Most Popular badge.
- Updated Enterprise/contact pricing cards with a more premium contact-style price block.
- Replaced green WhatsApp CTA styling in pricing surfaces with RoyalCare navy/gold branded CTAs while preserving WhatsApp URL/message logic and tracking events.
- Improved homepage section rhythm with a warm pricing preview, clean white Why RoyalCare section, subtle navy-tinted FAQ, and the existing dark footer.
- Improved Why RoyalCare cards with modern numbered icon containers, better spacing, and subtle hover states.
- Web production build passed after the UI-only changes.

# 2026-05-31 - Homepage Pricing Preview

Added a compact public pricing preview to the homepage.

Changed:
- The public homepage now fetches `GET /api/v1/public/plans` and shows up to three compact plan cards for Basic, Professional, and Enterprise.
- The section appears directly after the homepage hero and before longer content sections.
- Cards show localized plan names, yearly price or contact pricing, the popular badge, and a short list of included features.
- Added a `/pricing` button with EN/AR/HE labels and WhatsApp CTAs using the same shared pricing WhatsApp message helper as the full pricing page.
- Extracted shared pricing WhatsApp and localized plan/feature helpers for reuse between `/pricing` and the homepage preview.

Verified:
- Web production build passed.

# 2026-05-31 - Public Footer Link Targets

Fixed public footer navigation link targets.

Changed:
- Replaced the generic `href="#"` footer group links with explicit destinations.
- Footer Pricing now links to `/pricing` in EN/AR/HE.
- Footer Open Your Center links to `/open-center`; platform feature/service/center links route to the matching `/centers` sections.
- Support links to the configured public support email, and Contact Us links to the current page footer contact anchor.
- Privacy Policy and Terms remain non-clickable labels until real legal pages exist, avoiding invalid placeholder links.

Verified:
- No bare `href="#"` remains in `PublicFooter`.
- Web production build passed.

# 2026-05-31 - Public Navigation Pricing Link

Added the public Pricing navigation item to the shared public header.

Changed:
- Public header desktop and mobile navigation now include `/pricing`.
- Added EN/AR/HE labels: `Pricing`, `الأسعار`, and `מחירים`.
- The `/pricing` nav item is marked active when the current path is `/pricing`; `/centers` remains active only on `/centers`.

Verified:
- Web production build passed.

# 2026-05-31 - Super Admin Settings Session Auth Fix

Fixed Super Admin Global Platform Settings authorization so saving settings uses the current platform session cookie instead of the removed legacy Super Admin header.

Changed:
- `GET/PATCH /api/v1/admin/settings` now use `PermissionGuard` with `manage:settings`.
- `POST /api/v1/admin/uploads/public-image` now uses the same session-cookie guard and no longer requires `x-royalcare-super-admin-user-id`.
- Added `manage:settings` to platform permission definitions; the existing RBAC foundation seeds it onto the `super_admin` role on API startup.
- Public settings endpoints remain public-safe and unauthenticated.

Verified:
- API build passed.
- API restarted successfully and `GET /api/v1/health` returned `200`.
- A no-cookie settings PATCH now returns the expected `Missing required permission: manage:settings` guard response instead of `SUPER_ADMIN role is required`.

# 2026-05-31 - Public Pricing WhatsApp CTA Flow

Completed the public `/pricing` CTA flow so plan actions open WhatsApp directly instead of checkout or lead capture.

Changed:
- Added/finished `/pricing` as a public pricing page backed by live public plan data.
- Pricing CTAs now build `https://wa.me/{salesWhatsappNumber}?text={encodedMessage}` using live plan names, yearly price, currency, and contact-pricing status.
- WhatsApp messages start with an Arabic greeting, include Arabic + English plan name, center-name/city/center-type placeholders, and omit the price line for contact-pricing/Enterprise plans.
- Added public-safe `GET /api/v1/public/platform-contact` support for `salesWhatsappNumber`, with fallback to public support WhatsApp/phone.
- No checkout, lead storage, or subscription logic changes were added.

Verified:
- API build passed.
- Web `npx tsc --noEmit` passed.
- Web production build passed.

# 2026-05-26 - Center Website Builder v1

Implemented center-controlled homepage section visibility and ordering without changing the public website architecture.

Changed:
- Added `websiteSectionOrder` and `websiteSectionVisibility` JSON fields to `BrandingSettings` with migration `20260526090000_add_website_builder_settings`.
- Extended tenant public profile save/load to persist builder settings through the existing `GET/PATCH /api/v1/tenant/public-profile` flow.
- Extended public center profile payloads so `/c/[slug]` can render from center-owned builder settings.
- Added a Section Builder card to `/tenant/settings/website` with EN/AR/HE labels, visibility toggles, and drag/drop ordering for Hero, About, Services, Reviews, Before/After, Team, Offers, Gallery, Contact, Working hours, and Social links.
- Updated `/c/[slug]` homepage rendering to use saved section order and visibility. Hidden sections and empty sections do not render placeholders.
- Updated center website nav/footer visibility to respect builder settings and available public data.

Verified:
- Prisma format, validate, generate passed.
- Local `prisma db push` applied the schema change.
- API build passed.
- Web `tsc --noEmit` and production build passed.
- Focused ESLint on touched web files passed with existing `<img>` warnings only.

# 2026-05-26 - Center Website Builder Stabilization QA Pass

Full integration QA pass across all routes. Two production bugs found and fixed.

Changed:
- Fixed `apps/web/src/lib/api/tenant-analytics.ts` — replaced inline `const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1"` (missing `NEXT_PUBLIC_ROYALCARE_API_URL` fallback) with `import { API_BASE_URL } from "./super-admin-centers"`. Production environments that set only `NEXT_PUBLIC_ROYALCARE_API_URL` would have sent analytics calls to `localhost:3001` and silently failed.
- Fixed `apps/web/src/lib/api/tenant-domains.ts` — replaced local three-way `API_BASE` constant with `import { API_BASE_URL as API_BASE } from "./super-admin-centers"` for consistency with all other tenant API files.

Verified (no bugs found):
- `npx tsc --noEmit` in `apps/web`: CLEAN.
- All 19 tenant API routes return `401` (auth-gated, route exists): `tenant/appointments`, `tenant/appointments/stats`, `tenant/billing/invoices`, `tenant/services`, `tenant/staff`, `tenant/staff/roles`, `patients`, `tenant/booking-requests`, `tenant/schedule`, `tenant/public-profile`, `tenant/center-gallery`, `tenant/reviews`, `tenant/before-after`, `tenant/settings/marketing`, `tenant/team`, `tenant/offers`, `tenant/seo`, `tenant/domains`, `tenant/marketing/analytics`.
- Data isolation confirmed: `qa-recovery-1779095621868` and `jenin-care` return different gallery counts, review counts, and branding data. No cross-center leakage.
- No RoyalCare platform navbar on public center pages (`/c/[slug]/*`).
- No RoyalCare branding flash on tenant dashboard SPA navigation (fixed in previous session via `(center-admin)/layout.tsx` + `useLayoutEffect`).

# 2026-05-26 - QA Demo Data Seed v1

Added a repeatable QA seed script for the `qa-recovery-1779095621868` center to make all Center Website Builder sections visible.

Changed:
- NEW `packages/database/prisma/seeds/qa-center.seed.ts` — idempotent seed script for QA center with `deleteMany`+`createMany` for gallery/reviews/before-after/team/offers and `upsert` for BrandingSettings and Services. Uses `PrismaPg` adapter pattern (required by this project's Prisma v7.8.0 setup). Reads `DATABASE_URL` from environment; exits with a clear error if not set.
- Fixed seed script to use `new PrismaClient({ adapter: new PrismaPg({ connectionString: DB_URL }) })` — matches the project's `PrismaService` pattern; bare `new PrismaClient()` and `datasourceUrl` constructor option are both rejected by this build.
- Added `seed:qa` npm script to `packages/database/package.json` for convenient re-running.
- Seed creates: 1 BrandingSettings (purple `#6D4AFF`), 5 services, 6 gallery images, 5 reviews, 4 before/after cases, 4 team members, 3 offers — all published, all with EN/AR/HE content.
- Seed output confirmed: center found, all 7 sections written, `✅ QA Recovery center seeded successfully!`.

# 2026-05-26 - Smart Contact Widget v1

Added a floating Smart Contact Widget on all public center pages and the booking page.

Changed:
- Added `CLICK_MAP` and `CLICK_MESSENGER` to `CenterWebsiteEventType` Prisma enum; DB pushed and Prisma client regenerated.
- Added `CLICK_MAP` and `CLICK_MESSENGER` to `CenterEventType` union in `apps/web/src/lib/marketing/track-center-event.ts`.
- Added `CLICK_MAP` and `CLICK_MESSENGER` to `VALID_EVENT_TYPES` in `services/api/src/modules/center-analytics/center-analytics.service.ts`.
- NEW `apps/web/src/components/center/SmartContactWidget.tsx` — shared floating widget component with:
  - 5 actions: WhatsApp, Phone, Book Now, Google Maps, Messenger (each auto-hidden when center data is missing).
  - Messenger URL derived from `branding.facebookUrl` via `m.me/` handle extraction; skipped when handle cannot be parsed.
  - Book Now action omitted on the booking page via `showBook={false}`.
  - Fixed bottom-right positioning, `z-50`; respects iPhone safe area via `env(safe-area-inset-bottom)`.
  - Expand/collapse toggle with opacity+translateY CSS transition animation; closes on outside click / Escape.
  - EN/AR/HE labels; per-item `dir="rtl"` for RTL text rendering.
  - Center primaryColor used for Book Now button and the toggle button.
  - All analytics calls fire `trackCenterEvent` with page context; platform tracking not used.
- Modified `apps/web/src/features/public/centers/CenterProfilePage.tsx` — imports and renders `SmartContactWidget` after footer for all `/c/[slug]` pages.
- Modified `apps/web/src/features/public/booking/BookingPage.tsx` — imports and renders `SmartContactWidget` with `showBook={false}` for `/c/[slug]/book`.

Verified:
- `npx tsc --noEmit` passed with no output.
- DB push accepted enum additions in 217ms; Prisma client regenerated v7.8.0.

# 2026-05-26 - Center Website Analytics Dashboard v1 + Booking Page Navbar Fix

Fixed booking page rendering wrong platform navbar, and added the Center Website Analytics Dashboard.

### Booking Page Navbar Fix

Changed:
- Removed `PublicHeader` (RoyalCare platform navbar) from `apps/web/src/features/public/booking/BookingPage.tsx`.
- Added inline `BookingNavbar` component showing center logo/initials, truncated center name, Home/Services/Contact links, and a Back to center CTA.
- `BookingNavbar` uses already-fetched `PublicCenterDetail`; no additional API call is made.
- Supports EN/AR/HE + RTL via `dir` attribute; shows a loading skeleton while center data loads.

### Center Website Analytics Dashboard v1

Added center-scoped website analytics with event tracking on public center pages and a Center Admin analytics dashboard.

Changed (schema):
- Added `CenterWebsiteEventType` enum (14 values: `VIEW_CENTER_WEBSITE`, `VIEW_BOOKING_PAGE`, `CLICK_BOOK_NOW`, `CLICK_WHATSAPP`, `CLICK_PHONE`, `VIEW_GALLERY`, `VIEW_REVIEWS`, `VIEW_BEFORE_AFTER`, `VIEW_OFFERS`, `SELECT_OFFER`, `COMPLETE_BOOKING`, `VIEW_CONTACT`, `VIEW_SERVICES`, `SELECT_SERVICE`).
- Added `CenterTrafficSource` enum (6 values: `FACEBOOK`, `INSTAGRAM`, `TIKTOK`, `GOOGLE`, `DIRECT`, `UNKNOWN`).
- Added `CenterWebsiteEvent` model with `centerId`, `eventType`, `source`, `sessionId`, `page`, `extraData` (Json?), `occurredAt`, and 5 indexes.
- Added `websiteEvents CenterWebsiteEvent[]` relation to the `Center` model.
- DB pushed successfully; Prisma client regenerated v7.8.0.

Changed (backend):
- NEW `services/api/src/modules/center-analytics/center-analytics.service.ts` — validates event types/sources, resolves center by slug, inserts events, and computes 30-day dashboard metrics using Prisma `groupBy()` plus in-memory Map aggregation.
- NEW `services/api/src/modules/center-analytics/center-analytics.controller.ts` — two controllers: `PublicCenterTrackController` (`POST /public/centers/:slug/track`, no auth) and `TenantCenterAnalyticsController` (`GET /tenant/marketing/analytics`, session auth).
- NEW `services/api/src/modules/center-analytics/center-analytics.module.ts` — imports `DatabaseModule` and `AuthModule`, registers both controllers and `CenterAnalyticsService`.
- Modified `services/api/src/app.module.ts` — registered `CenterAnalyticsModule`.

Changed (frontend tracking):
- NEW `apps/web/src/lib/marketing/track-center-event.ts` — `trackCenterEvent(slug, eventType, options)`: fire-and-forget with `keepalive: true`, `markHomeViewed(slug)` sessionStorage deduplication for `VIEW_CENTER_WEBSITE`, `getSessionId(slug)` for anonymous 24-char hex session id, UTM-then-referrer traffic source detection.
- Modified `apps/web/src/features/public/centers/CenterProfilePage.tsx` — added `VIEW_CENTER_WEBSITE`, page-kind events (gallery/reviews/before-after/offers/contact/services), `CLICK_BOOK_NOW`, `CLICK_WHATSAPP`, `CLICK_PHONE` tracking.
- Modified `apps/web/src/features/public/booking/BookingPage.tsx` — added `VIEW_BOOKING_PAGE`, `SELECT_SERVICE` (with extraData), and `COMPLETE_BOOKING` tracking.

Changed (frontend dashboard):
- NEW `apps/web/src/lib/api/tenant-analytics.ts` — `getTenantAnalyticsDashboard()` calling `GET /tenant/marketing/analytics` with session credentials.
- NEW `apps/web/src/features/center-admin/analytics/TenantMarketingAnalyticsPage.tsx` — 11 metric cards, 6-source traffic breakdown, 4 charts (daily visitors sparkline, booking attempts sparkline, top pages bar, top services bar), loading skeleton, empty state, error state, refresh button, EN/AR/HE + RTL.
- NEW `apps/web/src/app/(center-admin)/tenant/marketing/page.tsx` — route wrapper.
- Modified `apps/web/src/features/center-admin/layout/CenterAdminShell.tsx` — added `"websiteAnalytics"` `NavKey` and nav item linking to `/tenant/marketing` gated by `reports:view`.
- Modified `apps/web/src/i18n/dictionaries/center-admin.ts` — added `websiteAnalytics` label in EN/AR/HE.

Verified:
- `npx tsc --noEmit` passed with no errors after fixing `tone="neutral"` (was `"info"`) and replacing `as const` literal Copy type with a structural interface.

# 2026-05-25 - Center Before / After Gallery v1

Added center-scoped before/after transformation cases for public center websites.

Changed:
- Added `CenterBeforeAfter` and `CenterBeforeAfterCategory` to Prisma with migration `20260525200000_add_center_before_after`.
- Added tenant CRUD endpoints and image upload endpoint under `/api/v1/tenant/before-after`.
- Added public-safe endpoint `GET /api/v1/public/centers/:slug/before-after`.
- Added Center Admin page `/tenant/settings/before-after` with before/after image uploads, localized fields, category selector, publish toggle, sort order, drag/drop reordering, and live preview.
- Added public `/c/[slug]/before-after` route plus homepage section, category filters, comparison slider, and conditional center-nav/footer link.

Verified:
- Prisma format, validate, generate, and local `db push` passed.
- API build passed.
- Web `tsc --noEmit` and production build passed.
- Focused lint on new API files passed; focused lint on touched web files had only existing `<img>` warnings.
- Full API lint is still blocked by unrelated `featured-services.controller.ts` no-base-to-string errors.
- Full web lint is still blocked by unrelated existing lint errors in center profile, centers directory, Super Admin center details, leads, and platform tracking files.
- Tenant before/after image upload endpoint accepted a local WebP upload and returned `/uploads/before-after/...webp`.
- Live API QA seeded 3 QA Recovery before/after cases, confirmed QA Recovery returns 3 published cases, Jenin Care returns empty, and the empty QA center returns empty.

# 2026-05-25 - Center Reviews / Testimonials v1

Added center-scoped Reviews / Testimonials v1 for Center Website Builder.

Changed:
- Added Prisma `CenterReview` with center id, customer name, rating, localized comments, publish flag, sort order, and timestamps.
- Added tenant review CRUD endpoints under `GET/POST/PATCH/DELETE /api/v1/tenant/reviews`.
- Added public-safe `GET /api/v1/public/centers/:slug/reviews`, returning only published reviews for the resolved center.
- Added `/tenant/settings/reviews` for Center Admins to list, add, edit, delete, publish/unpublish, rate, localize, and sort reviews.
- Added `/c/[slug]/reviews` and homepage reviews rendering when published reviews exist.
- Center website nav/footer include Reviews only when published reviews exist.

Verified:
- Prisma format, validate, generate, and local `db push` completed.
- API build passed.
- Focused API ESLint for the new review module passed.
- Web `tsc --noEmit` passed.
- Focused web ESLint passed with existing `<img>` warnings only.
- Web production build passed and includes `/tenant/settings/reviews` and `/c/[centerSlug]/reviews`.
- QA Recovery tenant API created 3 reviews, then one was unpublished.
- Public QA Recovery reviews endpoint returned only the 2 published reviews.
- Jenin Care and the empty QA center returned empty public review arrays.
- Route smoke returned `200` for `/tenant/settings/reviews`, `/c/qa-recovery-1779095621868/reviews`, `/c/jenin-care/reviews`, and `/c/qa-empty-generic-center/reviews`.

# 2026-05-25 - Center Website Generic Gallery/Favicon Verification

Verified that the center website gallery and favicon behavior is generic and center-scoped.

Verified:
- No hardcoded `qa-recovery-1779095621868` or `jenin-care` slugs were found in app/API source code.
- `CenterGalleryService.getPublicGallery(slug)` resolves the public active center by slug, selects the center id, and then reads `CenterGalleryImage` rows by `centerId`.
- `/c/[slug]` and center subpages dispatch the favicon from `center.branding.logoUrl`; `GlobalFavicon` applies it only on `/c/*` and restores the platform favicon when leaving center routes.
- QA Recovery returned 4 gallery images and its own center logo.
- Jenin Care returned 1 gallery image and its own distinct center logo.
- A third QA center `qa-empty-generic-center` was created locally with an active subscription, no branding logo, and no gallery images; its public profile returned `branding: null`, gallery returned an empty array, and public pages returned `200`.

# 2026-05-25 - Center Website Gallery and Favicon Fix

Fixed public center website gallery display and center favicon persistence.

Changed:
- `/c/[slug]` now loads the existing public-safe `GET /api/v1/public/centers/:slug/gallery` payload and shows a Gallery section when that center has images.
- Added `/c/[slug]/gallery` with center-specific metadata, navbar/footer, gallery grid, and Book Now CTA.
- Center website navbar/footer include Gallery only when public gallery images exist for the current center.
- Center favicon cleanup no longer clears the favicon on center subpage unmounts; `GlobalFavicon` remains responsible for restoring the platform favicon only when leaving `/c/*`.
- Booking page center favicon cleanup was aligned with the same route-leave behavior.

Verified:
- `GET /api/v1/public/centers/qa-recovery-1779095621868` returns `branding.logoUrl`.
- `GET /api/v1/public/centers/qa-recovery-1779095621868/gallery` returned 4 QA Recovery gallery images.
- `GET /api/v1/public/centers/jenin-care/gallery` returned only Jenin Care gallery data, confirming center scoping.
- QA Recovery logo and first gallery image URLs both returned `200` from the web app.
- Route smokes returned `200` for `/c/qa-recovery-1779095621868`, `/about`, `/services`, `/contact`, `/book`, and `/gallery`.
- API build passed.
- Web `tsc --noEmit` passed.
- Focused web ESLint passed with existing `<img>` warnings only.
- Web production build passed.

# 2026-05-25 - Tenant Gallery Load Error Handling

Fixed tenant gallery load failure handling without changing public website behavior.

Changed:
- `listTenantGallery()` now preserves HTTP status and response details through `TenantGalleryRequestError` instead of throwing only a generic message.
- `/tenant/settings/gallery` now shows localized inline messages for expired sessions, permission errors, and general load failures.
- Added a Retry action so gallery loading failures do not push users into the Next error overlay.
- Confirmed the backend endpoint is `GET /api/v1/tenant/center-gallery` and returns `{ success: true, items: [] }` on an empty/missing-table read path; authenticated QA returned existing items for the test center.

Verified:
- Unauthenticated API request returned `401` with structured session error.
- Super Admin login-as tenant session then `GET /api/v1/tenant/center-gallery` returned `200` with center-scoped items.
- API build passed.
- Web `tsc --noEmit` passed.
- Focused web ESLint passed with one existing `<img>` warning only.
- Web production build passed.
- `/tenant/settings/gallery` route smoke returned `200`.

# 2026-05-25 - Center Website Cross-Promotion Removal

Removed RoyalCare network and cross-center promotion from independent center website pages.

Changed:
- Removed All centers / Back to directory links from `/c/[slug]` center website pages.
- Center website navbar now promotes only the current center: logo, name, Home, Services, About, Contact, and Book Now.
- Replaced the homepage hero RoyalCare network badge with a neutral center-owned official website badge.
- Removed RoyalCare/network wording from center website route metadata and center contact helper text.
- Kept `/centers` and the platform navbar unchanged.
- Kept `/c/[slug]/book` working and did not change tracking events.

Verified:
- Web `tsc --noEmit` passed.
- Focused web ESLint passed with existing `<img>` warnings only.
- Web production build passed.
- Smoke checks returned `200` for `/c/jenin-care`, `/c/jenin-care/about`, `/c/jenin-care/services`, `/c/jenin-care/contact`, `/c/jenin-care/book`, and `/centers`.

# 2026-05-25 - Tenant Website Public Link

Added the center public website link to Center Admin website settings.

Changed:
- `/tenant/settings/website` now shows the current center website URL near the top of the page using `/c/[centerSlug]` and the current browser origin when available.
- Added Open website and Copy link actions with EN/AR/HE labels and RTL-safe layout.
- The link uses the authenticated tenant session center slug and does not expose admin/private fields.
- Custom domain support was not added.

Verified:
- Web `tsc --noEmit` passed.
- Focused web ESLint passed for `TenantWebsiteSettingsPage.tsx` with existing `<img>` warnings only.
- Web production build passed.
- Route smoke returned `200` for `/tenant/settings/website` and `/c/jenin-care`.

# 2026-05-25 - Center Website Builder Routing Foundation

Established the first route foundation separating RoyalCare platform marketing pages from independent center websites.

Changed:
- Added public center website routes `/c/[slug]/about`, `/c/[slug]/services`, and `/c/[slug]/contact`.
- Center website nav now links to real center routes instead of in-page anchors.
- `/c/[slug]`, `/c/[slug]/about`, `/c/[slug]/services`, and `/c/[slug]/contact` all load public-safe center data by slug and use the center-specific navbar, center logo/name/colors, Book Now CTA, and WhatsApp CTA when configured.
- `/c/[slug]/services` shows all active public services returned by the public center profile API.
- `/c/[slug]/about` shows full center description, working hours, and center info.
- `/c/[slug]/contact` shows phone, WhatsApp, email, address, social links, and Google Maps link when configured.
- `/centers` remains the RoyalCare platform directory using the platform navbar.
- Custom domains/subdomains are documented as future work and were not implemented.

Verified:
- Web TypeScript, lint, build, and route smoke checks are recorded with the implementation report.

# 2026-05-25 - Center Website Navbar

Separated center websites from the RoyalCare platform navigation.

Changed:
- `/c/[slug]` now uses a center-specific navbar with center logo/name, Home, Services, About, Contact, and Book Now.
- Platform navigation items such as Centers, How it works, Features, FAQ, Login, and Open Center are no longer shown on center website pages.
- Added a small All centers link outside the main center nav.
- Navbar uses the center primary color for Book Now and falls back to initials when no logo exists.
- Mobile menu works with the same center-specific links.
- Existing tracking remains intact: `ViewCenter`, `StartBooking`, and `WhatsAppClick`.

Verified:
- Web `tsc --noEmit` passed.
- Web production build passed.
- Focused web ESLint passed with existing `<img>` warnings only.
- Runtime route checks returned `200` for `/c/jenin-care`, `/centers`, `/c/jenin-care/book`, and `/tenant/dashboard`.

# 2026-05-25 - Center Public Website Homepage v1

Built the first public homepage for each center at `/c/[slug]` using the center website settings layer.

Changed:
- `/c/[slug]` now renders a center website homepage with hero, logo, cover image, center name, slogan, short description, Book Now / WhatsApp / Call CTAs, about text, featured services, working hours, contact details, social links, and Google Maps link when configured.
- The homepage uses public-safe fields from `GET /api/v1/public/centers/:slug`; no tenant-private settings or Meta CAPI token are exposed.
- Public center API payload now includes the website settings fields added to `BrandingSettings`, including localized full descriptions, slogans, working hours, contact fields, maps URL, secondary color, and social links.
- Existing marketing events are preserved: `ViewCenter`, `StartBooking`, and `WhatsAppClick`.
- `/c/[slug]/book` remains unchanged and still works.

Verified:
- API build passed.
- Web `tsc --noEmit` passed.
- Web production build passed.
- Focused API ESLint passed for `public-centers.service.ts`.
- Focused web ESLint passed for touched public center files with two existing `<img>` preview warnings only.
- Runtime checks returned `200` for `/api/v1/health`, `/c/jenin-care`, and `/c/jenin-care/book`.
- Runtime public center API response includes `sloganEn`, `fullDescriptionEn`, `workingHoursEn`, `googleMapsUrl`, `secondaryColor`, `phone`, and social links for the QA center.

# 2026-05-25 - Center Website Settings v1

Added the first CMS/settings layer for future full website-per-center pages.

Changed:
- Added `/tenant/settings/website` under the existing Center Admin settings area and `settings:view` permission.
- Added a responsive EN/AR/HE website settings form for center logo, cover/hero image, primary/secondary colors, localized short descriptions, localized full descriptions, localized slogans, contact details, localized addresses, Google Maps URL, localized working-hours text, and social links.
- Added a live preview card for the center website draft settings.
- Extended the existing tenant public-profile API and upload flow instead of introducing a new architecture.
- Added migration `20260525110000_add_center_website_settings` for the missing website CMS fields in `BrandingSettings`.
- Tenant `GET/PATCH /api/v1/tenant/public-profile` and image upload now enforce the existing `settings:view` permission.

Verified:
- Prisma format, validate, generate, and migrate deploy passed locally.
- API build passed.
- Web `tsc --noEmit` and production build passed.
- Focused API ESLint passed for the public-profile controller/service.
- Focused web ESLint passed for touched files with two existing preview `<img>` warnings only.
- Live API save/reload QA persisted and reloaded AR/EN/HE descriptions, slogans, addresses, working hours, colors, contact fields, maps URL, and social links for the QA center.
- Unauthenticated tenant public-profile access returned `401`.

# 2026-05-25 - Public Booking Pre-Deployment UX QA

Completed a focused local hardening pass for `/c/[slug]/book` before deployment.

Changed:
- Public booking submit errors now announce through an alert region so validation/API failures are clearer for assistive tech and mobile users.
- Confirmed the booking form keeps localized required-field validation for patient name, phone, service, date, and time slot.
- Confirmed double-submit prevention, disabled form controls during submit, slot-loading disabled submit state, and slot-unavailable refresh behavior remain in place.
- Confirmed existing marketing tracking events remain wired without adding new tracking features.

Local QA checklist:
- Required name/phone/service/date/slot validation shows localized EN/AR/HE messages.
- Services, slots, and submit states show loading/disabled behavior.
- Double clicking submit does not create a second request while submit is in progress.
- `BookingFailed` fires for validation/API failures and `CompleteBooking` remains tied to successful booking responses.
- Mobile slot grid remains touch-friendly with no horizontal overflow.

# 2026-05-24 - Public Booking UX Hardening

Hardened the public center booking flow after marketing tracking production readiness.

Changed:
- `/c/[slug]/book` now prevents double submit with an early submit guard and disabled form controls during submission.
- Submit is disabled while availability slots are loading so stale slot state cannot be submitted.
- API field errors are mapped back to localized booking field messages instead of showing raw backend English strings.
- Slot-unavailable conflicts still clear the selected time, refresh availability, show a localized message, and fire `BookingFailed`.
- Availability load errors now render as a clear alert, and mobile slot buttons use larger touch targets with a two-column base grid.
- Existing tracking events were preserved: `ViewBookingPage`, `SelectService`, `SelectDateTime`, `SubmitBookingAttempt`, `BookingFailed`, and `CompleteBooking`.

Verified:
- Web `tsc --noEmit` passed.
- Web production build passed.
- API build passed to confirm public booking/CAPI path still compiles.
- Focused web ESLint on touched booking files passed with one existing `<img>` warning only.
- `/c/jenin-care/book` returned `200` from the local web server.

# 2026-05-24 - Marketing Tracking Logs Runtime Readiness

Finalized runtime readiness for tenant marketing tracking debug logs.

Changed:
- Applied migration `20260524120000_add_marketing_tracking_logs`.
- Resolved the earlier local `20260523170000_add_tenant_marketing_settings` migration as applied after verifying the table already existed with the expected columns.
- Added a safe marketing log writer so missing-table or transient log-write failures warn instead of breaking public booking or Meta CAPI test flows.
- `GET /api/v1/tenant/settings/marketing/logs` now falls back to `{ logs: [], unavailable: true }` if the log table is unavailable.
- Documented that marketing logs are safe, contain no raw PII/token, and require the migration before rows appear.

Verified:
- `prisma migrate deploy` applied the tracking log migration and `prisma migrate status` reports the database schema is up to date.
- `GET /api/v1/tenant/settings/marketing/logs?limit=20` returned `{"logs":[]}` before runtime tests.
- Backend-only Meta CAPI test with invalid credentials returned `400` and created a safe `META_CAPI / TestMarketingEvent / FAILED` log.
- Public booking for Jenin Care returned `201` with `bookingRequestId=bacd6742-201f-4c86-b842-5fd28019b57a` and created a safe `META_CAPI / CompleteBooking / FAILED` log because Meta returned HTTP 400.
- The failed Meta CAPI provider attempt did not block booking creation.
- Prisma validate, API build, and web `tsc --noEmit` passed.

# 2026-05-24 - Marketing Event Debug Logs

Added tenant marketing tracking debug logs for server-side Meta CAPI activity.

Changed:
- Added `MarketingTrackingLog` with center-scoped provider/event/status/message/event id/booking request/timestamp fields.
- Server-side Meta CAPI `CompleteBooking` now logs `SUCCESS`, `FAILED`, or `SKIPPED` without exposing tokens or raw personal data.
- Backend-only Meta CAPI `TestMarketingEvent` now logs `SUCCESS`, `FAILED`, or `SKIPPED` without exposing tokens or raw personal data.
- Added `GET /api/v1/tenant/settings/marketing/logs?limit=20`, scoped by authenticated tenant `centerId` and protected by `settings:view`.
- `/tenant/settings/marketing` now shows a responsive Recent Tracking Logs section with refresh, provider, event name, status badge, message, optional event id, and created date.
- Added EN/AR/HE labels for providers, statuses, empty/error/loading states, and refresh controls.

Verified:
- Prisma validate and generate passed.
- API build passed.
- Web `tsc --noEmit` and web production build passed.
- API/web lint remain blocked by unrelated existing lint issues outside this marketing debug-log slice.

# 2026-05-24 - Marketing Tracking Test Mode

Added tracking test mode to the tenant marketing settings page.

Changed:
- `/tenant/settings/marketing` now includes a Test Tracking section.
- Added client-side test buttons for Meta Pixel, TikTok Pixel, GA4, and Snap Pixel using `TestMarketingEvent`.
- Added backend-only `POST /api/v1/tenant/settings/marketing/test-meta-capi` for Meta CAPI test events.
- Meta CAPI test uses the saved center-scoped Meta pixel id and token without exposing the token to the frontend.
- Added per-button loading state and localized EN/AR/HE success/error messages.
- Extended `trackMarketingEvent` with optional provider targeting while preserving provider failure isolation.

Verified:
- API build passed.
- Web `tsc --noEmit` and web production build passed.
- API/web lint remain blocked by unrelated existing lint issues outside this work.

# 2026-05-24 - Tenant Marketing Settings UI Hardening

Improved the authenticated tenant marketing settings management experience now that public injection and Meta CAPI are active.

Changed:
- `/tenant/settings/marketing` remains the authenticated Center Admin settings page for Meta Pixel, Meta CAPI token, TikTok Pixel, Snapchat Pixel, GA4, GTM, custom head script, and custom body script.
- The page requires the existing `settings:view` permission through `CenterAdminShell`.
- Meta CAPI token responses are now masked: the API returns `hasMetaConversionApiToken` and `metaConversionApiToken: null` instead of echoing the raw token back to the browser.
- Saving without editing the token preserves the existing token; entering a new token replaces it; clearing it sends `null`.
- Added EN/AR/HE helper text for the hidden saved token state and warnings that custom scripts run only on public center pages.
- Updated old “not injected yet” copy to match the current active public tracking behavior.

Verified:
- API build passed.
- Web `tsc --noEmit` and web production build passed.
- API lint remains blocked by unrelated existing public-profile/featured-services lint errors.

# 2026-05-24 - Meta Pixel and CAPI Deduplication

Added shared Meta deduplication ids for public booking conversions.

Changed:
- Public booking success responses now include `trackingEventId` in the format `booking_<bookingRequestId>`.
- Server-side Meta CAPI `CompleteBooking` now sends that value as `event_id`.
- Browser `CompleteBooking` now passes the same value as `event_id`; the marketing event helper forwards it to Meta Pixel as `{ eventID }`.
- TikTok, GA4, and Snap continue to receive the event payload and remain isolated from provider failures.
- The Meta Conversion API token remains backend-only and is still absent from public marketing responses and web clients.

Verified:
- API build passed.
- Web `tsc --noEmit` passed.

# 2026-05-24 - Meta Conversion API v1

Added backend-only Meta Conversion API tracking for successful public booking creation.

Changed:
- Added `MetaConversionsService` for best-effort server-side Meta CAPI sends.
- Public booking creation now triggers a server-side `CompleteBooking` event after the booking request is created.
- CAPI reads `metaPixelId` and `metaConversionApiToken` only from the center-scoped tenant marketing settings row inside the API.
- Public marketing endpoints and web clients still never expose `metaConversionApiToken`.
- Available phone and requester name values are SHA-256 hashed before sending to Meta.
- Source URL, user agent, IP address, booking id, center id/slug, service id, price/value, and currency are included when available.
- Meta provider failures are logged without tokens or raw personal data and never block booking creation.
- Added `META_GRAPH_API_VERSION` to `services/api/.env.example`.

Verified:
- API build passed.
- Web `tsc --noEmit` and web production build passed.
- API lint remains blocked by unrelated existing lint errors in `center-public-profile` and `featured-services` files.

## 2026-05-20 - Real-Time Booking Request Notifications

Added:
- Public booking creation now persists a `BOOKING_REQUEST_CREATED` in-app notification for the center admin audience.
- Booking notifications include EN/AR/HE title/body text and navigate to `/tenant/booking-requests`.
- Tenant shell now refreshes notification and pending-booking badges on a lightweight polling loop and same-browser public booking events.
- Tenant notifications now expose `GET /api/v1/tenant/notifications/stream` as a small SSE push channel backed by the existing notification service.
- Tenant shell shows a localized new-booking toast with a direct link to Booking Requests.
- Tenant notifications page maps booking notifications to a friendly label and clicking the notification opens Booking Requests.

Verified:
- Prisma schema validation, generate, and `prisma db push` passed after adding the notification enum value.
- Live public booking API call created booking request `3601301e-c45a-4c2a-8449-f2e2b37fb258` and notification `b024a445-3e08-4b32-a2f9-5878a41ecc5a`.
- Tenant notifications API returned the new notification unread with `actionUrl: "/tenant/booking-requests"`.
- Tenant pending booking request API returned total `1` for the QA center.
- API lint/build and web lint/tsc/build passed.

## 2026-05-17 - Super Admin Audit Action Label Localization

Fixed:
- Super Admin Audit Logs now displays localized EN/AR/HE labels for tenant billing and subscription invoice audit actions instead of raw action codes.
- The action filter still submits raw audit action codes, preserving backend filtering behavior.
- Replaced corrupted Arabic/Hebrew audit-log dictionary text with clean Unicode labels.
- Audit log cards now use localized unknown actor, unknown target, unknown center, clear-selection, payment amount, credit amount, subscription, and technical details labels.
- Audit label lookup now falls back from the current language to English and then to the raw action code.
- Billing audit metadata labels are localized for invoice, patient, amount, currency, status, payment method, center, subscription invoice, plan, due date, paid date, and cancelled date fields.
- Billing audit cards prefer business values such as invoice numbers, patient names, and center names as primary text; UUID identifiers stay in smaller secondary lines when a friendly value exists.
- Audit timeline actor, target, center, patient, invoice, and subscription-invoice cards now skip UUID-like values when selecting the primary display value and use them only as muted secondary technical context when a friendly value is available.
- Tenant billing audit actions now render with a custom business summary instead of the generic target/center grid, preventing duplicated target/patient and center rows. UUIDs for patient, invoice, and center are shown only under Technical details unless no friendly value exists.
- Tenant invoices now have nullable unique `invoiceNumber` values generated from a yearly `TenantInvoiceNumberCounter` in `INV-YYYY-000001` format.
- Existing tenant invoices were backfilled with invoice numbers and the local 2026 counter was synced.
- Tenant billing audit metadata for invoice creation, payment addition, credit creation, credit usage, and invoice cancellation now includes invoice number plus patient and center names under EN/AR/HE metadata keys.
- Added and ran a one-time tenant billing audit metadata backfill script. It scanned 59 audit rows, updated 59 on the first pass, then updated 2 remaining rows after filling one late null invoice number. Final verification found 0 billing audit rows with an invoice id but missing invoice number.

Added labels:
- `TENANT_INVOICE_CREATED`
- `TENANT_PAYMENT_ADDED`
- `TENANT_CREDIT_CREATED`
- `TENANT_CREDIT_USED`
- `TENANT_INVOICE_CANCELLED`
- `SUBSCRIPTION_INVOICE_CREATED`
- `SUBSCRIPTION_INVOICE_PAID`
- `SUBSCRIPTION_INVOICE_CANCELLED`
- `SUBSCRIPTION_INVOICE_DOWNLOADED`

Verified:
- Web dictionary/type coverage verified for English, Arabic, and Hebrew labels.
- API lint and build passed.
- Web lint, `tsc --noEmit`, and production build passed.

## 2026-05-17 - Tenant Credit Audit Hardening

Fixed:
- Overpayments that create patient credit now write an explicit `TENANT_CREDIT_CREATED` audit action.
- Credit creation audit metadata includes `patientId`, `patientName`, `invoiceId`, `creditAmount`, `centerId`, `createdBy`, and the related credit transaction id.
- Super Admin Audit Logs now maps `TENANT_CREDIT_CREATED` target fields to the patient (`targetName=patientName`, `targetId=patientId`) and displays patient, invoice, credit amount, and center details.
- Tenant billing audit target mapping now covers invoice creation, payment addition, credit creation, credit usage, and invoice cancellation so the Super Admin target column/card no longer falls back to unspecified when billing metadata exists.
- Credit usage remains audited separately through `TENANT_CREDIT_USED`.

Verified:
- Focused live API/database check confirmed an overpayment created one `TENANT_CREDIT_CREATED` audit row.
- API lint and build passed.
- Web lint, `tsc --noEmit`, and production build passed.

## 2026-05-17 - Appointment to Invoice to Payment Hardening

Fixed:
- Appointment-linked duplicate invoice creation is now blocked server-side instead of returning the existing invoice.
- Tenant invoice creation, invoice cancellation, payment addition, and credit usage now write Super Admin-visible audit rows.
- Use Credit sections hide while a new payment is being submitted to avoid overlapping payment/credit actions.

Verified:
- API lint and build passed.
- Web lint, `tsc --noEmit`, and production build passed.

## 2026-05-17 - Tenant Financial Reports Custom Filter Badge Fix

Fixed:
- Switching to Custom on `/tenant/reports` now activates a concrete custom date range immediately, so the filter badge and displayed range no longer remain stuck on the previous period such as This Month.
- Applying new custom dates updates the active filter badge and range together.

Verified:
- Web lint, `tsc --noEmit`, and production build passed.

## 2026-05-17 - Tenant Financial Reports Aggregation Fix

Fixed:
- Tenant financial report revenue no longer uses standalone today/month payment aggregates that can disagree with invoice cards.
- Revenue, average invoice value, payment-status chart, service chart, and top-patient spending now derive from the same non-cancelled invoice dataset for the selected report filter.
- Credit usage is included only when tied to the same filtered non-cancelled invoice set.

Verified:
- API build and lint passed.
- Web `tsc --noEmit`, lint, and production build passed.

## 2026-05-17 - Tenant Financial Reports

Added:
- Center Admin `/tenant/reports` financial report module using the existing tenant reports route and shell.
- `GET /api/v1/tenant/reports/financial` for report cards and charts scoped to the authenticated center.
- Financial cards for revenue today, revenue this month, paid invoices, pending invoices, overdue invoices, total patient credit, and average invoice value.
- Charts for revenue by day, revenue by payment status, revenue by service, and top patients by spending.

Changed:
- Tenant report revenue now counts both payments and `CREDIT_USE` patient credit usage while excluding cancelled invoices.
- Tenant report filters support Today, Last 7 days, This month, and Custom date range.
- Existing tenant report summary/top-patient endpoints now reuse the consolidated report calculation for compatibility.

Verified:
- API build and lint passed.
- Web lint, `tsc --noEmit`, and production build passed.

## 2026-05-17 - Subscription Billing Final QA

Verified:
- Subscription Billing Phase 1 + 2 completed and final QA passed.
- Super Admin subscription invoice create, auto invoice number, mark paid, cancel, overdue sync, PDF download, and audit logging passed runtime QA.
- Tenant read-only subscription invoice visibility passed; tenant edit/cancel/pay invoice actions remain unavailable.
- Expired and suspended tenant access rules still block tenant business writes.
- Super Admin `subscriptionBilling` dashboard KPIs matched direct database counts and aggregates for total revenue, paid invoices, pending invoices, overdue invoices, MRR, and revenue by plan.
- AR, EN, and HE PDF invoices generated as valid one-page PDFs with readable invoice numbers, totals, and currency text.
- Runtime/database checks passed after `prisma db push`, Prisma generate, API lint/build, web `tsc`, web lint, and web build.

Known production risk:
- Subscription invoice PDF generation requires Chrome/Chromium to be available to the API process through `CHROME_PATH` or a standard executable path.

Next recommended module:
- Tenant Financial Reports, or Appointment → Invoice → Payment final hardening.

## 2026-05-16 - Subscription Billing Phase 2

Added:
- Yearly `SubscriptionInvoiceNumberCounter` model for race-safe invoice numbers such as `SUB-2026-000001`.
- Super Admin subscription invoice PDF download endpoint and `/super-admin/subscriptions` Download PDF button with EN/AR/HE labels.
- `SUBSCRIPTION_INVOICE_DOWNLOADED` audit action for PDF downloads.
- Overdue synchronization for unpaid subscription invoices whose due date has passed.
- Super Admin dashboard subscription financial KPIs: total subscription revenue, paid invoices, pending invoices, overdue invoices, MRR, and revenue by plan.

Verified:
- Prisma format, validate, generate, and typecheck passed.
- API lint and build passed.
- Web lint, `tsc --noEmit`, and build passed.

## 2026-05-16 - Subscription Billing Phase 1

Added:
- `SubscriptionInvoice` Prisma model and `SubscriptionInvoiceStatus` enum for manual subscription invoices.
- Super Admin subscription invoice APIs for list, create, mark paid, and cancel.
- Tenant read-only subscription invoice API under the existing tenant subscription surface.
- Super Admin `/super-admin/subscriptions` Subscription Billing panel with invoice create form, search/filter, mark paid, and cancel actions.
- Tenant dashboard read-only subscription invoices panel.

Verified:
- Prisma format, validate, and generate passed.
- API lint and build passed.
- Web lint, `tsc --noEmit`, and build passed.

## 2026-05-16 - Tenant Subscription Restriction QA

Fixed:
- Direct tenant appointment create/edit forms now respect blocked subscription access before submit and show the existing localized restriction message.
- Direct tenant invoice create form now respects blocked subscription access before submit and disables the submit button with the existing restriction tooltip.
- Tenant invoice details now disables invoice status changes, Add Payment, and Use Credit controls for expired/suspended subscriptions while preserving read-only invoice and payment history access.

Verified:
- Live API gate checks confirmed `ACTIVE` and `EXPIRING_SOON` tenant sessions reach normal validation for patient, appointment, invoice, and payment writes instead of subscription blocks.
- Live API gate checks confirmed `EXPIRED` tenant sessions return `403 SUBSCRIPTION_EXPIRED` for patient, appointment, invoice, and payment writes.
- Live API gate checks confirmed `SUSPENDED` tenant sessions return `403 SUBSCRIPTION_SUSPENDED` for patient, appointment, invoice, and payment writes.
- Dashboard, auth refresh, and tenant notifications remained readable for active, expiring-soon, expired, and suspended sessions.
- Renewal requests succeeded for expired and suspended tenant sessions.
- Super Admin renewal check confirmed the same tenant session immediately changed from blocked to active access without relogin, then the QA subscription was restored.
- API lint, API build, API unit tests, web lint, web `tsc --noEmit`, and web build passed.

## 2026-05-16 - Subscription Automation Card UX

Changed:
- Improved the Super Admin `/super-admin/subscriptions` Subscription Automation card to show business-friendly lifecycle job summaries instead of technical monitoring details.
- Kept the existing backend lifecycle job status response and Run Now behavior unchanged.
- Renamed the manual run button in EN/AR/HE to "Check subscriptions now" / "فحص الاشتراكات الآن" / "בדוק מינויים עכשיו".
- The card now shows last run status, last run time, next run time, total subscriptions checked, expired updated, notifications created, suspended skipped, and duplicate notifications skipped.
- Added readable EN/AR/HE summary lines for checked subscriptions, expired updates, suspended skips, and no-action-needed runs.

Verified:
- Web `npx.cmd tsc --noEmit` passed.
- Web `npm.cmd run lint` passed.
- Web `npm.cmd run build` passed.

## 2026-05-15 - Subscription Lifecycle Job Monitoring UI

Added:
- Persisted `SubscriptionLifecycleJobRun` records for subscription lifecycle automation runs.
- `GET /api/v1/super-admin/subscriptions/lifecycle-job/status`.
- Super Admin subscriptions page card for Subscription Automation with next run, last run, last result, status, and Run Now button.

Changed:
- Manual lifecycle job runs now persist started/finished timestamps, trigger source, result counters, success, and error details.
- `POST /api/v1/super-admin/subscriptions/run-lifecycle-job` returns the persisted result counter shape used by the UI.

Verified:
- Prisma format, validate, generate, and db push passed.
- API build, lint, and unit tests passed.
- Web lint, `tsc --noEmit`, and production build passed.
- Live service status/run/status QA persisted a run with `triggeredBy=qa-ui-check`, scanned 21 subscriptions, and returned the updated latest status.

## 2026-05-15 - Subscription Lifecycle Cron Job

Added:
- Backend subscription lifecycle job in the subscriptions module.
- Daily scheduler runs at 02:00 server time using Nest module lifecycle hooks.
- Protected QA endpoint `POST /api/v1/super-admin/subscriptions/run-lifecycle-job` for Super Admin users with `manage:subscriptions`.

Changed:
- The job uses the shared backend `normalizeSubscriptionLifecycle()` helper.
- `ACTIVE`/`TRIALING` subscriptions past their period end are updated to `EXPIRED`.
- Expiring notifications are created for 7-day, 3-day, and 1-day milestones for both `SUPER_ADMIN` and `CENTER_ADMIN`.
- Expired notifications are created for both `SUPER_ADMIN` and `CENTER_ADMIN`.
- Automatic status changes write `SUBSCRIPTION_STATUS_CHANGED` audit logs with `actorType: SYSTEM` and `reason: cron_lifecycle_update`.
- Tenant subscription write access now uses the shared lifecycle helper.

Verified:
- Manual job run scanned 21 subscriptions, expired 1 subscription, created 2 expired notifications, and wrote 1 cron audit log.
- Second and third job runs created 0 duplicate notifications, made 0 duplicate status updates, and wrote no duplicate audit rows.
- Suspended subscriptions remained `SUSPENDED`.
- Live data had no 1/3/7-day expiring subscriptions, so expiring milestone notification creation was code-verified but not live-data-triggered.
- API lint passed.
- API build passed.
- API unit tests passed.
- Web lint passed.
- Web `tsc --noEmit` passed.
- Web production build passed.

## 2026-05-15 - Super Admin Subscription Lifecycle Filters

Fixed:
- Super Admin dashboard lifecycle cards no longer open mixed raw-status subscription results.
- Active, Trialing, Expiring Soon, Expired, Suspended, and Cancelled filters now use `?lifecycle=` and match the backend-normalized lifecycle exactly.

Changed:
- `GET /api/v1/super-admin/subscriptions` accepts `lifecycle=ACTIVE|TRIALING|EXPIRING_SOON|EXPIRED|SUSPENDED|CANCELLED|UNKNOWN`.
- The frontend subscription API wrapper no longer emits old lifecycle-card params such as `status=`, `filter=`, `expiringSoon=true`, or `expired=true`.
- Missing WhatsApp phone remains a separate non-lifecycle filter.

Verified:
- Live count comparison: ACTIVE 3, TRIALING 10, EXPIRING_SOON 0, EXPIRED 1, SUSPENDED 6, CANCELLED 1, UNKNOWN 0, total 21.
- Active lifecycle filter contained zero suspended/cancelled rows.
- Suspended lifecycle filter contained zero fully active rows.
- API lint passed.
- API build passed.
- API unit tests passed.
- Web lint passed.
- Web `tsc --noEmit` passed.
- Web production build passed.

## 2026-05-15 - Subscription Lifecycle Badge Consistency

Fixed:
- Super Admin subscription rows no longer render contradictory lifecycle and days badges, such as `EXPIRED` with `expires in X days`.

Changed:
- Backend and web `normalizeSubscriptionLifecycle()` now return one lifecycle presentation object with `lifecycle`, `daysRemaining`, `label`, and `color`.
- Super Admin subscription table rows, mobile cards, expiring-soon cards, and subscription details status badge now render from the shared lifecycle object.
- The shared helper defensively prevents an `EXPIRED` lifecycle from carrying a non-negative `daysRemaining` presentation value.

Verified:
- Live contradiction scan found zero invalid lifecycle/day combinations.
- Live lifecycle distribution remained total 21, lifecycle sum 21.
- API lint passed.
- API build passed.
- API unit tests passed.
- Web lint passed.
- Web `tsc --noEmit` passed.
- Web production build passed.

## 2026-05-15 - Super Admin Subscription KPI Total Alignment

Fixed:
- Super Admin dashboard subscription KPI cards now classify every subscription exactly once with the shared lifecycle helper.
- Trialing and cancelled subscriptions are no longer lost from dashboard lifecycle totals.
- Suspended and cancelled dashboard cards now navigate to separate lifecycle-matching filters.

Changed:
- Added explicit dashboard KPI cards for Total, Trialing, and Cancelled; Unknown remains hidden unless non-zero.
- Super Admin subscriptions filters now distinguish `SUSPENDED` from `CANCELLED` instead of grouping cancelled records under suspended.
- Archived centers classify as blocked/suspended for lifecycle counting.

Verified:
- Live shared-helper distribution check: total 21, lifecycle bucket sum 21.
- API lint passed.
- API build passed.
- API unit tests passed.
- Web lint passed.
- Web `tsc --noEmit` passed.
- Web production build passed.

## 2026-05-14 - Super Admin Expiring Soon Lifecycle Alignment

Fixed:
- Aligned Super Admin dashboard expiring-soon KPI counts with `/super-admin/subscriptions?filter=EXPIRING_SOON`.

Changed:
- Added one backend subscription lifecycle helper for expiring-soon date windows, blocked statuses, and normalized lifecycle values.
- Super Admin analytics and subscription list filters now use the same `ACTIVE`/`TRIALING`, 0-7 days remaining, non-blocked expiring-soon definition.
- The subscription API response now exposes normalized lifecycle values from the shared backend helper.
- The web subscription filter now uses the shared web lifecycle helper for `EXPIRING_SOON` instead of local shortcut logic.

Verified:
- API lint passed.
- API build passed.
- API unit tests passed.
- Web lint passed.
- Web `tsc --noEmit` passed.
- Web production build passed.

## 2026-05-14 - Super Admin Dashboard Card Navigation

Changed:
- Super Admin dashboard overview cards now navigate to the matching management pages: Centers, Users, and the dashboard analytics section for revenue.
- Super Admin dashboard subscription KPI cards now navigate to `/super-admin/subscriptions` with pre-applied filters for active, expiring soon, expired, and suspended subscriptions.
- `/super-admin/subscriptions` now recognizes dashboard query params including `filter=EXPIRING_SOON` and `status=ACTIVE|EXPIRED|SUSPENDED`.

Verified:
- Web lint passed.
- Web `tsc --noEmit` passed.
- Web production build passed.

## 2026-05-14 - Subscription and Notifications QA Regression Fixes

Fixed QA issues found in the subscription + notifications regression pass.

Changed:
- Protected `GET/POST /api/v1/super-admin/subscriptions`, subscription details, and subscription timeline routes with the platform permission guard.
- Added `POST /api/v1/super-admin/subscriptions/:id/manual-whatsapp-log` so WhatsApp opens/copies from the subscription page are logged.
- Subscription timelines now include WhatsApp logs attached to all subscription notification types, including suspended, renewed, trial-ending, and missing-phone notifications.
- `/super-admin/subscriptions` now passes WhatsApp modal open/copy actions into the manual logging API.

Verified:
- API lint passed.
- API build passed.
- API unit tests passed.
- Web lint passed.
- Web `tsc --noEmit` passed.
- Web production build passed.

## 2026-05-06 - Global Numeric Date Display

Changed:
- Frontend shared formatter `formatDate()` now displays all parsed dates as `DD/MM/YYYY`.
- Date-time values with an included time now display as `DD/MM/YYYY HH:mm`.
- Removed localized month-name tables from the shared formatter.
- Replaced appointment conflict and tenant reports short-month formatting with the shared numeric formatter.
- Updated the reusable `DateField` display to use the same numeric date helper while keeping stored/input values as `YYYY-MM-DD`.
- Completed missing Super Admin Center Details subscription/login-as dictionary keys that were blocking web TypeScript checks.

Verified:
- Source audit found no remaining `toLocaleDateString` or `Intl.DateTimeFormat` usages in `apps/web/src`, `services/api/src`, or `packages`.
- `npm.cmd run lint` passed in `apps/web`.
- `npx.cmd tsc --noEmit` passed in `apps/web`.
- `npm.cmd run build` passed in `apps/web`.

## 2026-05-06 - Super Admin Users Management Completion

Changed:
- Backend Super Admin Users API now supports real list/search/status/role filtering, counters, create, update, status changes, password reset, and center role assignment.
- Added endpoints: `PATCH /api/v1/super-admin/users/:userId`, `PATCH /api/v1/super-admin/users/:userId/status`, and `POST /api/v1/super-admin/users/:userId/reset-password`.
- Existing create and center-role assignment flows were extended to support temporary passwords, optional platform roles, and optional center roles.
- Frontend `/super-admin/users` now uses real API data instead of `users-data` mocks.
- Users filters, counters, Add User modal, edit action, activate/deactivate action, reset password action, desktop/mobile action menus, and success/error notices are connected.
- `/super-admin/users/[id]` now loads the real user, platform roles, center roles, and supports status change, password reset, and assigning a center role.
- User API responses continue to use safe user selections and do not return `passwordHash`.

Verified:
- `npm.cmd run lint` and `npm.cmd run build` passed in `services/api`.
- `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `npm.cmd run build` passed in `apps/web`.

## 2026-05-02 — Tenant Payments Module + Reopen Invoice

Added full manual payment recording capability to the tenant billing module.

Changed:
- Schema: `PARTIAL` added to `InvoiceStatus` enum; new `PaymentMethod` enum (CASH, BANK_TRANSFER, CHECK, OTHER); new `Payment` model with back-relations on Invoice, User, Center, Patient; `prisma db push` applied.
- Backend: `TenantPaymentService` with `create()` (overpayment guard, atomic `$transaction`, CANCELLED-invoice block) and `list()` (aggregate totals).
- Backend: `TenantBillingService.updateStatus()` extended for PARTIAL status and Reopen Invoice (CANCELLED → PENDING recalculates status from payment aggregate).
- Backend: `BillingController` has two new routes: `POST /tenant/billing/:invoiceId/payments` and `GET /tenant/billing/:invoiceId/payments`.
- Frontend: `TenantInvoiceDetailsPage` rebuilt with payment summary bar, Add Payment form, and payment history table; form hidden for PAID/CANCELLED invoices.
- Frontend: `TenantBillingPage` updated with PARTIAL badge (indigo), PARTIAL filter option, and PARTIAL-aware action buttons.
- Frontend API client: `TenantPayment`, `PaymentSummary`, `CreatePaymentPayload`, `CreatePaymentResult` types; `listTenantPayments()`, `createTenantPayment()` functions.
- `billing-permissions.ts`: added `hasPaymentPermission()` and `paymentRolePermissions`.
- i18n: 16 payment keys + `PARTIAL` status added to EN, AR, and HE billing dictionaries.

Verified:
- `npm run build` and `tsc --noEmit` passed in `services/api` and `apps/web`.
- Payment routes return `401` (auth guard alive) confirming registration.

## 2026-04-30 — Appointment Overlap Bug Fix (Hardened Detection)

Fixed critical bug where overlapping appointments could be saved without showing the conflict alert.

Root cause investigated: `ensureNoOverlap` passed a JavaScript Date directly to Prisma for a `@db.Date` column. While this typically works, any timezone drift between Node.js and PostgreSQL session could cause the date filter to return zero rows, silently passing the overlap check. Additionally, if `conflictDetails` was somehow null, the frontend alert would not render.

Changed:
- Backend `ensureNoOverlap`: extract date string with `dateOnlyText` before the query, re-construct an explicit UTC midnight Date (`new Date(\`${targetDateStr}T00:00:00.000Z\`)`) to eliminate timezone ambiguity.
- Backend: added in-memory application-layer filter after the Prisma query to keep only rows whose `dateOnlyText(appt.appointmentDate)` matches `targetDateStr`, providing a second safety net.
- Backend: `conflictDetails` in the thrown `BadRequestException` is now guaranteed non-null via `?? { fallback object }`.
- Frontend `extractConflictDetails`: hardened to also detect a conflict when `conflictDetails` key is absent but `message` contains "conflict", returning a minimal placeholder object so the alert still renders.

Verified:
- `tsc --noEmit` passed in both `services/api` and `apps/web`.
- `npm run build` passed in `apps/web` (all routes compiled).

## 2026-04-30 — Appointment Overlap Conflict Alert

Replaced simple overlap text error with a full styled conflict details alert box.

Changed:
- Backend `ensureNoOverlap` now queries full patient name, service names (EN/AR/HE), and provider name for the conflicting appointment.
- Backend overlap error response now includes a top-level `conflictDetails` object: `patientName`, `serviceNameEn/Ar/He`, `providerName`, `appointmentDate`, `startTime`, `endTime`.
- Backend overlap error message changed from `"Validation failed"` to `"Appointment conflict detected"`.
- Frontend: new `AppointmentConflictAlert` component renders a red bordered alert box with warning icon, conflict title, a labeled detail grid (patient, service, provider, date, start, end), and a "choose a different time slot" message.
- Frontend: `TenantAppointmentFormPage` extracts `conflictDetails` from API error responses and shows the alert below the form fields.
- Frontend: conflict alert clears on each new submit attempt.
- i18n: added 8 new keys to the `appointments` dictionary for EN, AR, and HE: `conflictTitle`, `conflictMessage`, `conflictPatient`, `conflictService`, `conflictProvider`, `conflictDate`, `conflictStart`, `conflictEnd`.
- RTL support: conflict alert uses `rtl:flex-row-reverse` on icon+content row and on each label–value pair.
- Pre-existing build failure in `TenantServiceFormPage.tsx` fixed by adding missing `durationUnitMinutes` and `durationUnitHours` dictionary keys in EN, AR, and HE.

Verified:
- `npm run lint` passed in `services/api` and `apps/web`.
- `npm run build` passed in `services/api`.
- `npm run build` passed in `apps/web` (all appointment routes compiled).

## 2026-04-30

Fixed Tenant Services default-language-only service form validation.

Changed:
- Tenant Services create/edit forms now require only the center default-language service name.
- Service descriptions are optional in English, Arabic, and Hebrew.
- Non-default language name fields are optional and marked with localized Optional labels.
- Backend service validation no longer rejects missing non-default language fields or missing descriptions.
- Tenant Services still store English, Arabic, and Hebrew name/description fields separately.

Verified:
- Arabic default-language center created a service with Arabic name only.
- Hebrew default-language center created a service with Hebrew name only.
- English default-language center created a service with English name only.
- Missing default-language name returned `400`.
- Created services appeared in `/tenant/services` and `/tenant/appointments/options`.
- No online payment functionality was added.

Fixed Super Admin Center Details default-language editing.

Changed:
- Center Details now treats `Center.primaryLanguage` as the displayed default language source.
- Edit Center now includes a translated Default Language selector with English, Arabic, and Hebrew options.
- `PATCH /api/v1/centers/:centerId` now accepts `primaryLanguage` and validates it against `EN`, `AR`, and `HE`.
- Updating `primaryLanguage` also aligns `BrandingSettings.defaultLanguage` and ensures the selected language is included in enabled languages when branding settings exist.
- The Super Admin center API client now includes `primaryLanguage` in update payloads.

Verified:
- API build passed after adding the update-field support.
- Web `tsc --noEmit` passed after adding the edit form field.
- Full lint/build QA is tracked with the implementation report.

Notes:
- No duplicate language field was added.
- Dedicated tenant login and Tenant Services continue to read the center default from `Center.primaryLanguage`.
- No online payment functionality was added.

## 2026-04-29

Fixed Tenant Patients Search UX.

Changed:
- Patients list search now filters locally and instantly while typing; no Search button or Enter key is required.
- Search matches patient full name and phone number with trimmed, case-insensitive partial matching.
- Phone search also ignores common formatting separators such as spaces, dots, dashes, and parentheses.
- Added localized no-results empty state for filtered searches in English, Arabic, and Hebrew.
- Patient success messages now auto-hide after 4 seconds on list and details screens.
- Patient list only calls the API for initial load and mutation refreshes, not on every keystroke.

Verified:
- Source audit confirmed the Patients page no longer uses submitted query state or a search button.
- Source audit confirmed `listPatients()` is not called on search input changes.
- Source audit confirmed localized no-results labels exist for EN/AR/HE.
- Source audit confirmed success notices use a 4-second auto-hide timer.
- `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `npm.cmd run build` passed in `apps/web`.

Implemented Tenant Patients Management foundation.

Changed:
- Added Prisma `Patient` model with `centerId`, identity/contact fields, gender, date of birth, national ID, notes, status, timestamps, center relation, and tenant lookup indexes.
- Added per-center unique patient phone rule through `@@unique([centerId, phone])`.
- Added tenant Patients API:
  - `GET /api/v1/patients`
  - `POST /api/v1/patients`
  - `GET /api/v1/patients/:patientId`
  - `PATCH /api/v1/patients/:patientId`
  - `PATCH /api/v1/patients/:patientId/status`
- Patients API derives `centerId` from the signed center session cookie and never accepts client-supplied tenant ids.
- Added tenant `/dashboard/patients` list/search/create/edit/archive page.
- Added tenant `/dashboard/patients/[id]` details/edit/archive page.
- Refactored the tenant dashboard shell into a reusable center admin shell with localized navigation and RTL behavior.
- Added English, Arabic, and Hebrew patient labels, statuses, genders, empty/loading states, form labels, and validation text.

Verified:
- Prisma format, validate, generate, database push, and database package typecheck passed.
- `npm.cmd run build` and `npm.cmd run lint` passed in `services/api`.
- `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `npm.cmd run build` passed in `apps/web`.
- Created a patient through the tenant API and confirmed it used the authenticated center id.
- Duplicate phone in the same center returned `409`.
- The same phone in a different center was allowed.
- Invalid phone returned `400`.
- Blank patient name on update returned `400`.
- Edit patient persisted.
- Archive patient persisted.
- Invalid patient status returned `400`.
- Search by name returned the updated patient.
- Refresh/list after archive returned the persisted archived patient.
- Cross-center patient details access returned `404`.
- Patient list/detail/create responses contained no password, passwordHash, token, secret, auth verification, last-login, or deleted metadata fields.
- `/dashboard/patients` route checks confirmed EN renders LTR and AR/HE render RTL.

Fixed Tenant Dashboard Shell i18n and RTL completeness.

Changed:
- Replaced broken Arabic/Hebrew tenant dashboard dictionary text with valid localized strings.
- Added localized tenant center status labels for `TRIAL`, `ACTIVE`, `PAST_DUE`, `SUSPENDED`, `CANCELLED`, and `ARCHIVED`.
- Tenant dashboard center status now renders through the dictionary instead of raw API enum text.
- Tenant dashboard role and center status API types now use explicit shared key unions.
- Tenant dashboard desktop shell mirrors the sidebar to the right for Arabic/Hebrew and keeps it on the left for English.
- Tenant dashboard mobile drawer now opens from the correct physical side for RTL/LTR.

Verified:
- Source audit found no hardcoded sidebar/dashboard English labels in the tenant dashboard component.
- English, Arabic, and Hebrew tenant dashboard nav, role, status, title, subtitle, card, loading, and logout labels exist in the dictionary.
- Built route checks confirmed `/dashboard` renders `lang="en" dir="ltr"`, `lang="ar" dir="rtl"`, and `lang="he" dir="rtl"` from locale cookies.
- `npm.cmd run lint` passed in `apps/web`.
- `npx.cmd tsc --noEmit` passed in `apps/web`.
- `npm.cmd run build` passed in `apps/web`.

Fixed Center Staff Reset Password usability.

Changed:
- `POST /api/v1/centers/:centerId/staff/:userId/reset-password` now returns the newly generated temporary password for the Super Admin reset operation.
- The reset endpoint still stores only the hashed password in `User.passwordHash`.
- Center Details now shows a confirmation dialog before resetting a center staff password.
- After reset, Center Details shows a modal with the generated temporary password plus Copy and Close actions.
- The reset flow no longer shows only the generic “Staff user saved” message.

Verified:
- Reset password returned `201`, `resetComplete: true`, and a generated `temporaryPassword`.
- The copied/generated temporary password worked for tenant login.
- Direct database inspection confirmed `User.passwordHash` exists, starts with `scrypt$`, and is not equal to the temporary password.
- Reset response did not expose `passwordHash`, tokens, secrets, auth verification timestamps, last login, or deleted metadata.
- `npm.cmd run build` and `npm.cmd run lint` passed in `services/api`.
- `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `npm.cmd run build` passed in `apps/web`.

Implemented Tenant Login and Center Dashboard Shell foundation.

Changed:
- Added tenant-side center staff auth endpoints:
  - `POST /api/v1/auth/center/login`
  - `GET /api/v1/auth/center/me`
  - `POST /api/v1/auth/center/logout`
- Added secure password verification for existing scrypt password hashes.
- Added signed HttpOnly center session cookie handling.
- Tenant login authenticates only center-scoped staff users with active `UserRole.centerId` assignments.
- Inactive users are blocked.
- Suspended, cancelled, and archived centers are blocked from tenant login.
- Added tenant login page at `/login`.
- Added tenant dashboard shell at `/dashboard`.
- Dashboard shell shows center name, current user, role, center status, placeholder summary cards, responsive sidebar/drawer navigation, and logout.
- Added English, Arabic, and Hebrew tenant dashboard/login dictionary.
- Super Admin login semantics were not changed.

Verified:
- Valid tenant login returned `201`.
- Invalid password returned `401`.
- Inactive staff login returned `401`.
- `/auth/center/me` returned `200` after login and matched the assigned center id.
- Logout returned `201` and `/auth/center/me` returned `401` after logout.
- Wrong-center staff access returned `404`.
- Tenant auth responses contained no `password`, `passwordHash`, token, secret, verification, last-login, or deleted metadata fields.
- `npm.cmd run build` and `npm.cmd run lint` passed in `services/api`.
- `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `npm.cmd run build` passed in `apps/web`.

Implemented Center Staff Users Management foundation.

Changed:
- Added center-scoped staff endpoints under `/api/v1/centers/:centerId/staff`.
- Staff users are tenant users, not platform admins; they are represented by safe `User` records assigned through `UserRole.centerId`.
- Supported center staff roles: `CENTER_OWNER`, `CENTER_MANAGER`, `DOCTOR`, `RECEPTIONIST`, `ACCOUNTANT`, and `STAFF`.
- Added create, list, edit, status update, and reset temporary password workflows.
- Staff validation returns field-specific errors for `fullName`, `email`, `phone`, `role`, `status`, and `temporaryPassword`.
- Center Details now includes a permission-aware Center Staff Users section with list, add, edit, activate/deactivate, and reset password actions.
- Added English, Arabic, and Hebrew dictionary labels for the staff section, roles, statuses, buttons, empty/loading states, and form text.
- Staff responses never return passwords, password hashes, tokens, secrets, or auth metadata.

Verified:
- Staff user creation returned `201`.
- Duplicate email returned `409 errors.email`.
- Duplicate phone returned `409 errors.phone`.
- Invalid email returned `400 errors.email`.
- Invalid phone returned `400 errors.phone`.
- Invalid role returned `400 errors.role`.
- Invalid status returned `400 errors.status`.
- Staff edit returned `200` and changed the role to `ACCOUNTANT`.
- Deactivate returned `200` with user status `INACTIVE`.
- Activate returned `200` with user status `ACTIVE`.
- Reset temporary password returned `201`, reported `resetComplete: true`, and did not leak `password`, `passwordHash`, token, secret, or auth metadata fields.
- Cross-center staff list did not include the staff user from another center.
- Cross-center staff update returned `404`.
- Missing center returned `404`.
- English, Arabic, and Hebrew staff labels exist in the Center Details dictionary.
- `npm.cmd run build` and `npm.cmd run lint` passed in `services/api`.
- `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `npm.cmd run build` passed in `apps/web`.

## 2026-04-28

Implemented Super Admin Users & Permissions Foundation.

Changed:
- Added platform RBAC seed definitions for Super Admin, Platform Admin, Finance Admin, Support Admin, and Read Only Admin.
- Added granular platform permissions such as `view:centers`, `edit:centers`, `suspend:centers`, `manage:subscriptions`, `view:internal_notes`, `manage:internal_notes`, `view:users`, and `manage:users`.
- Added permission decorators and a NestJS permission guard.
- Added `GET /api/v1/permissions/me`, `GET /api/v1/permissions/platform-roles`, and `POST /api/v1/permissions/platform-users/:userId/roles`.
- Protected Centers endpoints with permission checks for view/create/edit/status/subscription/internal-notes actions.
- Protected Super Admin Users endpoints with `view:users` and `manage:users`.
- Centers List and Center Details now hide UI actions and sections when the current platform user lacks the required permission.
- API clients forward the temporary development `x-royalcare-super-admin-user-id` header from `localStorage.royalcare.superAdminUserId`.

Verified:
- Default Super Admin returned all 11 implemented platform permissions.
- Platform roles endpoint returned all 5 implemented roles.
- Finance Admin could update manual subscriptions and received `403` for center status actions.
- Support Admin could create internal notes and received `403` for subscription updates.
- Read Only Admin could list centers and received `403` for center update and internal-note access.
- Center detail/list responses after RBAC changes did not include `password`, `passwordHash`, `token`, `secret`, `emailVerifiedAt`, `phoneVerifiedAt`, `lastLoginAt`, or `deletedAt`.
- `npm.cmd run build` and `npm.cmd run lint` passed in `services/api`.
- `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `npm.cmd run build` passed in `apps/web`.

Implemented manual Subscription & Plan Management.

Changed:
- Added manual-only subscription fields `nextRenewalDate` and `billingNotes`.
- Removed old external payment provider fields from the Prisma subscription schema.
- Added `PATCH /api/v1/centers/:centerId/subscription`.
- Supported manual plans: `BASIC`, `STANDARD`, `PREMIUM`, `ENTERPRISE`.
- Supported manual statuses: `TRIAL`, `ACTIVE`, `EXPIRED`, `OVERDUE`, `CANCELLED`.
- Manual subscription updates validate plan, status, and date ordering with field-specific errors.
- Manual subscription changes create automatic private internal notes.
- Center Details now includes a Subscription Management section, expiry/overdue/expired warning badges, and a manual update modal.
- No Stripe, PayPal, checkout, card payment, or external provider fields were added; old provider fields were removed.

Verified:
- Valid subscription update returned `200` and persisted manual plan/status/dates/billing notes.
- Invalid plan returned `400 errors.subscriptionPlan`.
- Invalid status returned `400 errors.subscriptionStatus`.
- End date before start date returned `400 errors.subscriptionDates`.
- Expired subscription status/date persisted and is available for warning display.
- Centers list and Center Details reflected subscription updates.
- Automatic internal notes were created for manual subscription changes.
- Responses did not expose auth-sensitive fields or payment-provider fields.
- `npm.cmd run db:format`, `npm.cmd run db:validate`, `npm.cmd run db:generate`, `npx.cmd prisma db push`, and `npm.cmd run typecheck` passed in `packages/database`.
- `npm.cmd run build` and `npm.cmd run lint` passed in `services/api`.
- `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `npm.cmd run build` passed in `apps/web`.

Implemented Super Admin Center Status Actions.

Changed:
- Added `PATCH /api/v1/centers/:centerId/status` and Super Admin alias.
- Supported status actions: activate to `ACTIVE`, suspend to `SUSPENDED`, and deactivate to `CANCELLED` because the current Prisma status model does not include `INACTIVE`.
- Status action validation rejects unsupported statuses with `errors.status`.
- Suspend/deactivate require a reason and reject missing reasons with `errors.reason`.
- Status changes run in a database transaction and create an automatic private internal note describing the status transition and reason.
- Center Details quick actions now open a confirmation/reason dialog, submit the status action, refresh center details, and refresh internal notes.

Verified:
- Activate returned `200` and persisted `ACTIVE`.
- Suspend without reason returned `400 errors.reason`.
- Suspend with reason returned `200` and persisted `SUSPENDED`.
- Deactivate returned `200` and persisted `CANCELLED`.
- Invalid `INACTIVE` status returned `400 errors.status`.
- Invalid center id returned `404`.
- Centers list and Center Details reflected the updated status after refresh.
- Automatic internal notes were created newest first for status actions.
- Status action responses did not expose passwords, password hashes, tokens, secrets, or auth metadata.
- `npm.cmd run build` and `npm.cmd run lint` passed in `services/api`.
- `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `npm.cmd run build` passed in `apps/web`.

Implemented real Super Admin Center Internal Notes.

Changed:
- Added `CenterInternalNote` Prisma model with `centerId`, `authorId`, note text, timestamps, center relation, author relation, and lookup indexes.
- Added `GET /api/v1/centers/:centerId/internal-notes` to list private center notes newest first.
- Added `POST /api/v1/centers/:centerId/internal-notes` to create private Super Admin notes.
- Internal notes validate required/non-empty note text and return `400 errors.note`.
- Missing and malformed center ids return `404 Center not found`.
- Internal note responses include safe author info only and never expose passwords, password hashes, tokens, secrets, or auth metadata.
- Center Details now loads real internal notes, saves notes, shows newest-first history, loading state, saving state, empty state, and field-level validation.
- Removed the UI-only notes behavior from Center Details.

Verified:
- Prisma schema format, validation, generation, database push, and database package typecheck passed.
- Created two notes through the API and confirmed they persisted after reload.
- Notes list returned newest first.
- Empty note POST returned `400 errors.note`.
- Invalid and malformed center ids returned `404`.
- Normal Center Details response did not expose internal notes.
- Notes responses did not include sensitive auth fields.
- `npm.cmd run build` and `npm.cmd run lint` passed in `services/api`.
- `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `npm.cmd run build` passed in `apps/web`.

Implemented Edit Center / Update Center.

Changed:
- Added `PATCH /api/v1/centers/:centerId` and `PATCH /api/v1/super-admin/centers/:centerId`.
- Center updates can change center name, type, status, owner/admin full name, email, phone, latest subscription plan/dates, and primary domain.
- Update validation now returns field-specific errors for invalid or duplicate admin email, invalid or duplicate admin phone, duplicate domain, invalid center name, invalid dates, and invalid ids.
- Update responses reuse safe user/domain projections and do not expose passwords, password hashes, tokens, secrets, or auth-adjacent user metadata.
- Center Details now supports `/super-admin/centers/{id}?mode=edit` with a real prefilled edit form and PATCH submission.
- Center Details edit form shows loading/saving state and field-level backend errors.

Verified:
- Valid PATCH updated a real PostgreSQL center and changed details/list data.
- Invalid email returned `400 errors.adminEmail`.
- Invalid phone returned `400 errors.adminPhone`.
- Duplicate email returned `409 errors.adminEmail`.
- Duplicate phone returned `409 errors.adminPhone`.
- Duplicate domain returned `409 errors.domain`.
- Blank center name returned `400 errors.centerName`.
- Missing and malformed center ids returned `404`.
- List/details responses reflected the update and contained no sensitive fields.
- `npm.cmd run build` and `npm.cmd run lint` pass in `services/api`.
- `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `npm.cmd run build` pass in `apps/web`.

## 2026-04-27

Finalized real-data Super Admin Center Details integration.

Changed:
- Removed the old `center-details-data.ts` mock dependency from Center Details.
- Center Details activity timeline now derives from real center, subscription, domain, and admin timestamps returned by `GET /api/v1/centers/:centerId`.
- Backend center detail/list/create responses now select safe domain fields and exclude domain verification tokens.
- Malformed center detail IDs now return a clean `404 Center not found` instead of a Prisma-backed `500`.

Verified:
- `npm.cmd run build` and `npm.cmd run lint` pass in `services/api`.
- `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `npm.cmd run build` pass in `apps/web`.
- `GET /api/v1/centers/:centerId` returned three different real PostgreSQL centers with matching IDs, names, owners, domains, and plans.
- `GET /api/v1/centers/not-a-real-center-id` returned `404`.
- Serialized list and detail responses did not include `passwordHash`, password fields, or token fields.
- Source search found no remaining `center-details-data` or `centerDetailsById` usage in the Centers details flow.

Fixed QA production-blocking Create Center validation and sensitive logging issues.

Changed:
- Removed temporary frontend API and submit debug logs that could print full create payloads, including `temporaryPassword`.
- Add New Center frontend validation now blocks missing admin name, missing temporary password, invalid phone, and short password before sending a request.
- Backend `POST /api/v1/centers` now rejects missing admin name, missing temporary password, invalid email, invalid phone, and short password with field-specific `400` errors.
- Center name validation now uses `errors.centerName` instead of `errors.name`.
- Duplicate domain creation now returns `409 Conflict` with `errors.domain` instead of `errors.unique`.
- Domain is not required in the current frontend flow because neither custom domain nor subdomain is marked required; backend still validates and maps duplicate domain errors when a domain is provided.

Verified:
- Valid create returned `201`.
- Missing admin name returned `400 errors.adminName`.
- Missing password returned `400 errors.temporaryPassword`.
- Invalid email returned `400 errors.adminEmail`.
- Invalid phone returned `400 errors.adminPhone`.
- Short password returned `400 errors.temporaryPassword`.
- Duplicate domain returned `409 errors.domain`.
- Missing center name returned `400 errors.centerName`.
- API responses did not include `passwordHash` or plaintext `TemporaryPassword123!`.
- Source search found no remaining `console.*`, `RoyalCare submit debug`, or full payload logging in the Create Center frontend API path.
- `npm.cmd run build` and `npm.cmd run lint` pass in `services/api`.
- `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `npm.cmd run build` pass in `apps/web`.

Fixed required owner/admin phone validation in Create Center.

Changed:
- Add New Center Wizard now requires the Center Admin mobile number before submitting.
- Missing admin phone sets a field-level error under the mobile number input and prevents the POST request.
- Backend center creation validation now rejects missing, blank, or null `admin.phone` with `400 Bad Request`.
- Backend response uses `errors.adminPhone` with English, Arabic, and Hebrew user-facing messages.
- Duplicate phone validation remains in place and still returns `409 Conflict` for already-used phone numbers.
- Successful center creation still hashes temporary passwords and does not return `passwordHash`.

Verified:
- `POST /api/v1/centers` without `admin.phone` returned `400` with `errors.adminPhone`.
- `POST /api/v1/centers` with a unique admin phone returned `201` and created center `c382aa07-be04-444e-9618-29ba417ec2c8`.
- Duplicate phone POST still returned `409` with `errors.adminPhone`.
- The successful create response did not contain `passwordHash`.
- `npm.cmd run build` passes in `services/api`.
- `npm.cmd run lint` passes in `services/api`.
- `npm.cmd run lint` passes in `apps/web`.
- `npx.cmd tsc --noEmit` passes in `apps/web`.
- `npm.cmd run build` passes in `apps/web` when allowed to run outside the sandbox.

Connected Super Admin Center Details to real PostgreSQL data.

Changed:
- `/super-admin/centers/[id]` now loads center details only from `GET /api/v1/centers/:centerId`.
- Removed the mock details fallback from the live Center Details page.
- Added explicit loading, not-found, and user-friendly load-error states.
- Center Details now renders real center info, owner/admin info, subscription, domain, branding, languages, status, created date, and updated date from the API response.
- Added frontend API typing for `updatedAt`.
- Kept password-safe behavior: center detail responses use safe user selection and do not expose passwords or `passwordHash`.

Verified:
- `npm.cmd run build` passes in `services/api`.
- `npm.cmd run lint` passes in `services/api`.
- `npm.cmd run lint` passes in `apps/web`.
- `npx.cmd tsc --noEmit` passes in `apps/web`.
- `npm.cmd run build` passes in `apps/web` when allowed to run outside the sandbox.
- Live API probe against the built NestJS API returned three real centers from `GET /api/v1/centers?pageSize=3`.
- `GET /api/v1/centers/3f30ab62-a797-4692-8797-548b9a0750d5` returned matching center `hammam` and the serialized response did not contain `passwordHash`.
- Detail probes for three different centers returned three matching, different records: `hammam`, `مركز سيرين`, and `Validation Success Test 1777319664`.

Audited and hardened Center Admin user password security.

Changed:
- Added secure backend password hashing helper at `services/api/src/common/security/password-hashing.ts` using Node.js `crypto.scrypt`.
- Center Admin temporary passwords from Create Center are now hashed before writing `User.passwordHash`.
- Super Admin user creation now accepts `password` instead of client-supplied `passwordHash` and hashes it server-side.
- Added shared `safeUserSelect` at `services/api/src/common/database/safe-user-select.ts`.
- Replaced user response selections in Centers and Users services so `passwordHash` is not returned in centers list, center details, user list, user details, create user, or center-role assignment responses.
- Added Reset Admin Password, Force Password Change, and Send Welcome Email actions to Center Details quick actions.
- Added Force Password Change and Send Welcome Email actions to Users table/detail UI.

Verified:
- Source audit found no remaining `owner: true`, `user: true`, or user response include paths that can return `passwordHash`.
- `hashPassword("TemporaryPassword123!")` returned an `scrypt$...` hash that does not equal the plaintext password.
- `npm.cmd run build` passes in `services/api`.
- `npm.cmd run lint` passes in `services/api`.
- `npm.cmd run lint` passes in `apps/web`.
- `npx.cmd tsc --noEmit` passes in `apps/web`.

Finished and hardened real PostgreSQL-backed Centers Management list.

Changed:
- `/super-admin/centers` fetches real centers from `GET /api/v1/centers`.
- The list shows real center name, owner/admin, center type, subscription plan, expiry date, domain, status, and actions.
- Center type labels are translated through the Centers dictionary instead of showing raw API enum text.
- View actions open `/super-admin/centers/{realCenterId}`.
- Edit actions open `/super-admin/centers/{realCenterId}?mode=edit`, allowing the real details page to fetch the same real center id.
- Row action menu open state now uses the real center id instead of the visible row index, so filtering/searching cannot attach an action menu to the wrong row.
- Suspend, Renew Subscription, and Delete remain safe prepared actions with no database mutation until confirmed endpoints are added.
- Loading, empty, no-results, and load-error states are translated and do not expose technical API or transport errors to normal users.

Verified:
- `GET /api/v1/centers?pageSize=5` returned real PostgreSQL center rows, including `8c54075c-0e2c-4ed5-8ce1-77dc109b749b` and `e809f844-574a-4b1e-8057-d07f040e2ad3`.
- `GET /api/v1/centers/e809f844-574a-4b1e-8057-d07f040e2ad3` returned the matching real center details.
- `npm.cmd run lint` passes in `apps/web`.
- `npx.cmd tsc --noEmit` passes in `apps/web`.

Added permanent RoyalCare error handling standard.

Changed:
- Added a project-wide rule that generic user-facing errors are forbidden.
- Documented that form errors must be clear, translated, non-technical, and tied to exact field keys.
- Standardized backend validation responses around `{ message, errors }` with stable field keys such as `centerName`, `adminEmail`, `adminPhone`, `subscriptionPlan`, `startDate`, `expiryDate`, and `domain`.
- Documented that Prisma `P2002`, missing required fields, invalid enums, duplicate values, and date-ordering failures must be mapped to readable field-specific messages.
- Documented frontend behavior: show field-level errors under the exact input and use top alert summaries only when useful.
- Marked Add New Center Wizard, Users forms, Subscriptions forms, Domains forms, and Plans forms as the first forms that must follow this standard.

Updated:
- `AGENTS.md`
- `CLAUDE.md`
- `ai-memory/05_UI_UX_RULES.md`
- `ai-memory/04_API_MAP.md`

Fixed Create Center duplicate admin phone/email validation.

Changed:
- `POST /api/v1/centers` and the Super Admin center creation path now pre-check duplicate center admin email and phone inside the creation transaction before creating or updating the admin `User`.
- Replaced the previous user `upsert` behavior with explicit `update` by `userId` or `create` for a new admin, so a unique phone collision no longer chooses the wrong lookup key.
- Added a Prisma `P2002` safety net that maps unique `User.phone` and `User.email` collisions to clean `409 Conflict` responses instead of `500 Internal Server Error`.
- Duplicate admin phone now returns field-level localized messages:
  - English: `Phone number is already used by another user.`
  - Arabic: `رقم الهاتف مستخدم مسبقًا.`
  - Hebrew: `מספר הטלפון כבר בשימוש.`
- The Create Center API client now preserves status, raw response body, and parsed JSON details in `ApiRequestError`.
- The Add New Center wizard now extracts backend field errors and shows the localized duplicate-phone/email message in the existing create alert instead of a generic error.

Verified:
- Duplicate phone POST to `http://localhost:3001/api/v1/centers` returned `409 Conflict` with `errors.adminPhone` and all three localized messages.
- Duplicate email POST to `http://localhost:3001/api/v1/centers` returned `409 Conflict` with `errors.adminEmail` and all three localized messages.
- New unique phone POST to `http://localhost:3001/api/v1/centers` succeeded and created center `e809f844-574a-4b1e-8057-d07f040e2ad3`.
- `GET /api/v1/centers/e809f844-574a-4b1e-8057-d07f040e2ad3` returned the created center with the matching owner user.
- `npm.cmd run build` passes in `services/api`.
- `npm.cmd run lint` passes in `services/api`.
- `npm.cmd run lint` passes in `apps/web`.
- `npx.cmd tsc --noEmit` passes in `apps/web`.

Connected Super Admin Centers Management list to real PostgreSQL data.

Changed:
- `/super-admin/centers` now uses `GET /api/v1/centers` for the centers table instead of mock/static rows.
- Removed mock fallback behavior from the live centers list.
- Added real loading, API error, empty, and no-results states while keeping the existing Super Admin table design.
- Search and status filters now operate on real API rows.
- Stats cards now count real API rows.
- View actions now link to `/super-admin/centers/{realCenterId}`.
- Edit actions now link to `/super-admin/centers/{realCenterId}?mode=edit`, allowing the real details page to load the real center data.
- Suspend, Renew Subscription, and Delete now use safe prepared action handlers without mutating database state until real endpoints/confirmations are added.
- Center Details API client now uses `GET /api/v1/centers/:centerId`.

Verified:
- `GET /api/v1/centers?pageSize=5` returned real PostgreSQL center rows.
- `GET /api/v1/centers/2f0dd844-e04d-4d41-80a6-60cbbf9b8e03` returned the matching real center.
- `npm.cmd run lint` passes in `apps/web`.
- `npx.cmd tsc --noEmit` passes in `apps/web`.

Fixed services/api PostgreSQL connection source.

Root cause:
- `services/api/.env` contained the correct Docker PostgreSQL URL, but the NestJS API did not load `.env`.
- `PrismaService` fell back to an old hardcoded connection string using password `royalcare`, causing PostgreSQL password authentication failures for user `royalcare`.

Changed:
- Added an explicit API database URL loader at `services/api/src/common/config/database-url.ts`.
- API database URL loading order is now:
  1. `services/api/.env`
  2. root `.env`
  3. `packages/database/.env`
  4. existing `process.env.DATABASE_URL`
  5. required local Docker fallback
- `PrismaService` now uses the explicit loader and rejects any URL other than the required local Docker URL.
- Updated `packages/database/.env.example` to remove the stale `postgres:postgres` example.

Verified:
- `npm.cmd run build` passes in `services/api`.
- `npm.cmd run lint` passes in `services/api`.
- `POST /api/v1/centers` succeeded against Docker PostgreSQL and created a real center record without password authentication errors.

Fixed likely React maximum update depth loop sources in Super Admin shell/create flow.

Changed:
- Removed the redundant `router.refresh()` immediately after `router.push("/super-admin/centers")` in the Add New Center success handler.
- Hardened `LanguageProvider` so selecting the current locale is a no-op and document/localStorage/cookie persistence only writes when values actually changed.

Reason:
- The create success path could trigger App Router refresh work while navigation was already in progress.
- The global language provider was doing persistence writes on every locale effect run even when the browser state already matched.

Verified:
- `npm.cmd run lint` passes in `apps/web`.
- `npx.cmd tsc --noEmit` passes in `apps/web`.
- `npm.cmd run build` compiles successfully, then fails in this Windows environment with `spawn EPERM`.
- `npm.cmd run dev` and `npx.cmd next dev --webpack` fail before serving with the same Windows `spawn EPERM`.

Debugged Add New Center submit preflight behavior.

Changed:
- Create Center now reports exact frontend validation blockers instead of showing the generic API error before a request is attempted.
- Added temporary `TODO(debug)` console logs for Create Center submit verification:
  - validation blockers
  - payload before submit
  - configured API base URL
  - API URL
  - API response/error
- API client now supports `NEXT_PUBLIC_API_URL`, then `NEXT_PUBLIC_ROYALCARE_API_URL`, then `http://localhost:3001/api/v1`.
- API client now displays readable backend response messages, including nested NestJS validation response bodies.

Verified:
- `npm.cmd run lint` passes in `apps/web`.
- `npx.cmd tsc --noEmit` passes in `apps/web`.

Connected Add New Center Wizard to real PostgreSQL-backed center creation.

Changed:
- Added `POST /api/v1/centers` as an alias for real center creation, while keeping `POST /api/v1/super-admin/centers`.
- Expanded center creation to write `Center`, `BrandingSettings`, `Subscription`, optional `Domain`, center admin `User`, center admin `Role`, and `UserRole` in one Prisma transaction.
- Added backend validation for center name, owner/admin email, subscription plan, default language, enabled languages, and default-language inclusion.
- Connected Step 6 Review + Confirm in `/super-admin/centers/new` to the real API instead of mock save behavior.
- Added a web API client for Super Admin center list, create, and detail requests.
- Updated `/super-admin/centers` to prefer API-backed centers and link View actions to real center ids.
- Updated `/super-admin/centers/[id]` to fetch a real center by id before falling back to existing mock detail records.

Verified:
- `npm.cmd run build` passes in `services/api`.
- `npm.cmd run lint` passes in `services/api`.
- `npm.cmd test -- --runInBand` passes in `services/api`.
- `npm.cmd run lint` passes in `apps/web`.
- `npx.cmd tsc --noEmit` passes in `apps/web`.
- `npm.cmd run db:validate` passes in `packages/database`.
- `npm.cmd run build` in `apps/web` compiles successfully, then fails during the Next.js TypeScript phase with Windows `spawn EPERM`; direct TypeScript and ESLint checks pass.

Started real database-backed Super Admin core backend foundation.

Changed:
- Updated Prisma Client generation to the standard `prisma-client-js` runtime path.
- Improved core indexes for User, Center, and Subscription lookup patterns.
- Added `User.deletedAt` for future soft-delete-safe user lifecycle handling.
- Added API database infrastructure through a shared NestJS `DatabaseModule` and lazy `PrismaService`.

Added:
- Centers API controller, service, and DTOs.
- Users API controller, service, and DTOs.
- Subscriptions API controllers, service, and DTOs.
- Shared API pagination helper.

Implemented API foundation:
- `GET /api/v1/super-admin/centers`
- `POST /api/v1/super-admin/centers`
- `GET /api/v1/super-admin/centers/:centerId`
- `GET /api/v1/super-admin/users`
- `POST /api/v1/super-admin/users`
- `GET /api/v1/super-admin/users/:userId`
- `POST /api/v1/super-admin/users/:userId/center-roles`
- `GET /api/v1/super-admin/subscriptions`
- `POST /api/v1/super-admin/subscriptions`
- `GET /api/v1/super-admin/subscriptions/:subscriptionId`
- `GET /api/v1/super-admin/centers/:centerId/subscription`

Notes:
- Existing Super Admin UI routes were not changed.
- Auth, permission guards, and production tenant request context are still pending before exposing these endpoints as secured production APIs.

Verified:
- `npm run db:format` passes in `packages/database`.
- `npm run db:validate` passes in `packages/database`.
- `npm run db:generate` passes in `packages/database`.
- `npm run typecheck` passes in `packages/database`.
- `npm run lint` passes in `services/api`.
- `npm run build` passes in `services/api`.
- `npm test -- --runInBand` passes in `services/api`.
- `npm run test:e2e` passes in `services/api`.

Built Super Admin Settings Management page.

Added:
- Route `/super-admin/settings`.
- Settings Management page component.
- Mock global platform settings data.
- English, Arabic, and Hebrew dictionary for Settings Management.

Includes:
- General Platform Settings for platform name, default language, supported languages, currency, timezone, and date format.
- Branding Settings for platform logo, primary color, secondary color, email branding, and login page branding.
- Security Settings for two-factor default, password policy, session timeout, login attempt limits, and force password reset.
- Notification Settings for email, WhatsApp, system, payment, and subscription alerts.
- Subscription Defaults for trial duration, grace period, and auto suspension rules.
- Domain Defaults for subdomain pattern, SSL auto renewal, and DNS verification rules.
- Backup & System Health for last backup, backup frequency, system status, database health, and backup-now state.

Changed:
- Super Admin sidebar Settings item now links to `/super-admin/settings`.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- `/super-admin/settings` returned `200 OK` on the built Next.js server.
- Production route checks confirmed `royalcare_locale=ar`, `royalcare_locale=he`, and `royalcare_locale=en` render the expected `lang` and `dir` values.

Built Super Admin Notifications Management page.

Added:
- Route `/super-admin/notifications`.
- Notifications Management page component.
- Mock notification summary, notification rows, filters, and template preview data.
- English, Arabic, and Hebrew dictionary for Notifications Management.

Includes:
- Summary cards for total notifications, unread, critical, and sent today.
- Search and filters for all, unread, critical, system, subscription, domain, payment, and support.
- Desktop notifications table with title, message, type, priority, related center, created date, read/unread status, and actions.
- Mobile notification cards using the shared bottom-sheet action menu.
- Notification Templates Preview for subscription expiring, domain verification failed, payment failed, and new center created.

Changed:
- Super Admin sidebar Notifications item now links to `/super-admin/notifications`.
- Shared action menu gained read and archive icons for notification row actions.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- `/super-admin/notifications` returned `200 OK` on the built Next.js server.
- Production route checks confirmed `royalcare_locale=ar`, `royalcare_locale=he`, and `royalcare_locale=en` render the expected `lang` and `dir` values.

Fixed mobile Super Admin action menu overflow.

Changed:
- Updated shared `SuperAdminActionMenu` so desktop keeps the compact dropdown while mobile opens a fixed bottom sheet / slide-up action panel.
- Mobile action sheets now use a screen-safe fixed overlay, rounded top panel, touch-friendly item height, and safe-area bottom padding.
- Destructive actions are visually separated and remain clearly red.
- Users, Centers, Subscriptions, Domains, and Plans inherit the fixed mobile behavior from the shared component.
- Updated permanent UI rules so this becomes the RoyalCare responsive action standard.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Redesigned Super Admin row action menus.

Added:
- Shared `SuperAdminActionMenu` component for premium compact row actions.
- Inline action icons for view, edit, reset password, suspend, delete, renew, verify, invoice, duplicate, activate, and related menu actions.

Changed:
- Users, Centers, Subscriptions, Domains, and Plans now use one compact vertical-dot row action trigger.
- Replaced old large `Actions` buttons, stacked dropdown buttons, and inline desktop button clusters with a consistent enterprise-style dropdown.
- Delete/cancel actions now appear as clearly red destructive menu items.
- Updated permanent UI rules so this shared action menu is the Super Admin standard.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Built Super Admin User Details page.

Added:
- Dynamic route `/super-admin/users/[id]`.
- User Details page component.
- Id-keyed mock user details data for users `1` through `5`.
- Mock activity timeline data per user id.
- English, Arabic, and Hebrew dictionary for User Details.

Includes:
- User Overview with profile avatar, full name, email, mobile number, role, department, status, created date, last login, last activity, and two-factor authentication status.
- Permissions Summary with assigned role, direct permissions, access level, and restricted areas.
- Quick Actions for edit, reset password, suspend, activate, force logout, and delete.
- Activity Timeline with user created, password reset, role changed, last login, and permission updated events.
- Assigned Responsibilities and private Internal Notes sections.
- Translated not-found state for invalid ids.

Changed:
- Users Management `View` actions now open the matching `/super-admin/users/{id}` details route.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- `/super-admin/users/1`, `/super-admin/users/2`, `/super-admin/users/3`, and `/super-admin/users/999` returned `200 OK` on the local Next.js dev server.
- Dynamic content checks confirmed ids `1`, `2`, and `3` render Sara Levi, Amir Haddad, and Maya Cohen respectively; id `999` renders `User not found`.
- Production route checks confirmed `royalcare_locale=ar` renders `<html lang="ar" dir="rtl">`, `royalcare_locale=he` renders `<html lang="he" dir="rtl">`, and `royalcare_locale=en` renders `<html lang="en" dir="ltr">`.

Built Super Admin Users Management page.

Added:
- Route `/super-admin/users`.
- Users Management page component.
- Mock RoyalCare platform user data.
- English, Arabic, and Hebrew dictionary for Users Management.

Includes:
- Summary cards for total users, active users, pending users, and suspended users.
- Add New User primary action.
- Search and filters for name/email/role, role, status, and last login.
- Desktop Users table with user name, email, role, department, status, last login, created date, and actions.
- Mobile user cards with one structured `Actions` menu per user.
- Roles Preview block for Super Admin, Support, Sales, Finance, and Viewer.

Changed:
- Super Admin sidebar Users item now links to `/super-admin/users`.
- User `View` actions are prepared to link to `/super-admin/users/{id}` for the future details page.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Built Super Admin Plan Details page.

Added:
- Dynamic route `/super-admin/plans/[id]`.
- Plan Details page component.
- Id-keyed mock plan details data for plans `1` through `4`.
- English, Arabic, and Hebrew dictionary for Plan Details.

Includes:
- Plan Overview with plan name, monthly/yearly price, trial duration, setup fee, featured status, active status, created date, and last updated date.
- Included Features with users, branches, appointments, customers, storage, modules, notification channels, API access, custom domain support, and support level.
- Quick Actions for edit, duplicate, activate/deactivate, mark featured, and delete.
- Current Subscribers block with subscriber count, recent subscribers, and revenue contribution.
- Upgrade Paths block with lower plan, higher plan, and recommended upgrade path.
- Internal Super Admin notes section.
- Translated not-found state for invalid ids.

Changed:
- Plans Management `View Plan` action now links to `/super-admin/plans/{id}`.
- Plans mock ids now use route-friendly ids `1` through `4`.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Built Super Admin Plans Management page.

Added:
- Route `/super-admin/plans`.
- Plans Management page component.
- Mock plan data for Trial, Starter, Professional, and Enterprise plans.
- English, Arabic, and Hebrew dictionary for Plans Management.

Includes:
- Summary cards for total plans, active plans, most popular plan, and highest revenue plan.
- Add New Plan button.
- Search and filters for active, inactive, trial-enabled, and popular plans.
- Plan cards with pricing, trial duration, user/branch limits, modules, support level, status, and featured badges.
- Mobile-safe `Actions` menu per plan.
- Plan Comparison Preview table.

Changed:
- Super Admin sidebar Plans item now links to `/super-admin/plans`.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Built Super Admin Domain Details page.

Added:
- Dynamic route `/super-admin/domains/[id]`.
- Domain Details page component.
- Id-keyed mock domain details data for domains `1` through `5`.
- Mock domain activity timeline data per domain id.
- English, Arabic, and Hebrew dictionary for Domain Details.

Includes:
- Domain Overview with domain, center, owner, type, verification, DNS, SSL, dates, and status.
- DNS Instructions with A record, CNAME, and TXT verification record.
- Verification Actions for verify, DNS recheck, SSL renewal, suspend, and delete.
- SSL Certificate Info with provider, issued date, expiry date, auto renew, and certificate status.
- Domain Activity Timeline.
- Internal Super Admin notes section.
- Translated not-found state for invalid ids.

Changed:
- Domains Management `View` action now links to `/super-admin/domains/{id}`.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Built Super Admin Domains Management page.

Added:
- Route `/super-admin/domains`.
- Domains Management page component.
- Mock domain data for custom domains and subdomains.
- English, Arabic, and Hebrew dictionary for Domains Management.

Includes:
- Summary cards for total, verified, pending, failed, and SSL-expiring domains.
- Search and filters for verification status, suspended domains, SSL expiring soon, and domain/center/owner search.
- Desktop domains management table.
- Mobile domain cards with one structured `Actions` menu per domain.
- Pending Verification highlighted section.
- SSL Expiry Warning section.
- Domain Health Overview with healthy, warning, and critical counts.

Changed:
- Super Admin sidebar Domains item now links to `/super-admin/domains`.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Built Super Admin Subscription Details page.

Added:
- Dynamic route `/super-admin/subscriptions/[id]`.
- Subscription Details page component.
- Id-keyed mock subscription details data for subscriptions `1` through `5`.
- Mock payment history and renewal history data per subscription id.
- English, Arabic, and Hebrew dictionary for Subscription Details.

Includes:
- Subscription Overview with center, logo mark, owner, plan, billing cycle, price, dates, auto renewal, status, payment status, and renewal dates.
- Quick Actions for renewal, upgrade, downgrade, suspend, cancel, invoice generation, and invoice history.
- Payment History with desktop table and mobile cards.
- Renewal History timeline.
- Billing Information section.
- Internal Super Admin notes section.
- Translated not-found state for invalid ids.

Changed:
- Subscriptions Management `View` action now links to `/super-admin/subscriptions/{id}`.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Built Super Admin Subscriptions Management page.

Added:
- Route `/super-admin/subscriptions`.
- Subscriptions Management page component.
- Mock subscription data, revenue snapshot data, and expiring-soon data.
- English, Arabic, and Hebrew dictionary for Subscriptions Management.

Includes:
- Summary cards for active, trial, expiring soon, expired, and monthly revenue.
- Search and filters for status, auto renewal, plan type, date range, and center/owner/domain search.
- Desktop subscriptions management table.
- Mobile subscription cards with one structured `Actions` menu per subscription.
- Expiring Soon highlighted section.
- Revenue Snapshot section for MRR, ARR, pending payments, and failed renewals.

Changed:
- Super Admin sidebar Subscriptions item now links to `/super-admin/subscriptions`.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Improved Centers Management mobile action buttons.

Changed:
- Mobile row actions now use one compact `Actions` button instead of showing View, Edit, Suspend, Renew Subscription, and Delete as a messy stacked cluster.
- Tapping the mobile `Actions` button expands a structured equal-width action menu.
- Delete appears last and uses the shared danger button style.
- Desktop keeps the normal inline table action layout.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Fixed Center Details dynamic loading by route id.

Root cause:
- The Center Details page used a fallback center object when the route id was not found.
- Since only id `1` existed in mock data, `/super-admin/centers/2`, `/3`, and later ids all displayed Nova Laser Center.

Changed:
- Added distinct mock Center Details records for ids `1` through `5`.
- `/super-admin/centers/1` now shows Nova Laser Center.
- `/super-admin/centers/2` now shows Al Noor Hijama.
- `/super-admin/centers/3` now shows Balance Physio.
- `/super-admin/centers/4` now shows Glow Beauty Clinic.
- `/super-admin/centers/5` now shows Wellness House.
- Removed the silent fallback-to-Nova behavior.
- Added a translated not-found state for unknown ids.
- Kept the Centers Management `View` action mapped to the correct row id.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Built Super Admin Center Details page.

Added:
- Dynamic route `/super-admin/centers/[id]`.
- Center Details page component for managing one center tenant.
- Mock center detail data and activity timeline data.
- English, Arabic, and Hebrew dictionary for Center Details.

Includes:
- Center Overview card with logo, owner, center type, services, status, subscription, domain, and created date.
- Quick Actions section with Edit, Renew Subscription, Suspend, Activate, Delete, and Login as Center Admin buttons.
- Center Admin Information section.
- Branding + Languages section with logo preview, colors, default language, and enabled languages.
- Activity Timeline with mock center events.
- Internal Super Admin Notes section.

Changed:
- Centers Management `View` action now links to `/super-admin/centers/{id}`.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Built Add New Center wizard Step 6: Review + Confirm.

Changed:
- Created a full Review + Confirm summary for Center Basic Info, Subscription Plan, Domain Setup, Branding + Languages, and Center Admin Account.
- Review now shows controlled wizard values from previous steps instead of only placeholder text.
- Added logo preview and selected logo file name to the Branding + Languages review section.
- Added a translated warning box: `Please review all information carefully before creating the center.`
- Added a strong final `Create Center` primary action on the final wizard step.
- Kept the flow UI-only with no backend creation call.
- Added English, Arabic, and Hebrew copy for Create Center, no-logo state, and the review warning.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Fixed Auto Renewal control in the Add New Center wizard.

Added:
- Shared `ToggleSwitch` component for compact boolean form controls.

Changed:
- Replaced the Auto Renewal full-width browser checkbox card with the shared toggle switch.
- Auto Renewal is now controlled by wizard state and visibly switches between enabled and disabled states.
- The review step now reflects the current Auto Renewal state.
- Existing wizard boolean controls now use the same toggle style for consistency.
- Documented the permanent toggle rule in UI/UX memory.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

## 2026-04-26

Improved Add New Center wizard center classification structure.

Changed:
- Replaced the single Center Type select in Step 1 with a Primary Category single-select.
- Added Services Offered as multi-select checkboxes.
- Added Other service support with a conditional custom service name field.
- Added English, Arabic, and Hebrew dictionary entries for primary categories and offered services.
- Review step now summarizes the selected primary category and services offered.
- Kept the wizard UI-only, responsive, and inside the shared `SuperAdminLayout`.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Built Add New Center wizard Step 5: Center Admin Account.

Changed:
- Added controlled UI state for the center admin account step.
- Step 5 now includes Admin Full Name, Admin Email, Mobile Number, Password, Confirm Password, Permissions Preset, notification toggles, two-factor authentication toggle, and Account Status.
- Added permission preset options: Full Access, Standard Management, Limited Access, and Custom Permissions.
- Added account status options: Active and Pending Activation.
- Added lightweight validation UI for email format and password match.
- Added required field indicators for the required Step 5 fields.
- Review step now includes the selected admin account values, permissions preset, account status, and notification/security toggles.
- Added English, Arabic, and Hebrew dictionary entries for all Step 5 fields, validation messages, presets, toggles, and statuses.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Improved Add New Center wizard Step 4: Branding + Languages.

Changed:
- Step 4 now keeps controlled UI state for primary color, secondary color, default language, and enabled languages.
- Center logo upload remains UI-only but now works as a clear image picker with local preview and selected file name.
- Enabled language checkboxes are ordered Arabic, Hebrew, English and update wizard state.
- Default language selector updates wizard state without resetting global app language.
- Branding review now reflects selected colors, default language, and enabled languages.
- Added translated empty-state copy for the case where no enabled languages are selected.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Fixed hydration mismatch from locale-dependent number and currency formatting.

Root cause:
- Dashboard stat cards used `Intl.NumberFormat` with compact currency during client rendering.
- Server and browser ICU/bidi behavior can format the same Arabic currency value differently, for example `US$ 42.8 ألف` on the server and `42.8 ألف US$` on the client.
- React treated that text difference as a hydration mismatch.

Added:
- `apps/web/src/i18n/formatters.ts`

Changed:
- Dashboard numbers, signed changes, percentages, and compact money now use deterministic RoyalCare formatting utilities.
- Centers Management stats and dates now use the same shared deterministic formatting layer.
- Removed direct `Intl.NumberFormat` and `Intl.DateTimeFormat` usage from current Super Admin rendered values.
- Formatting is now controlled by the selected app locale only, not browser or operating-system locale.
- Documented that future hydration-sensitive number, currency, percent, and date text must use the shared formatter.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- `rg` finds no direct `Intl`, `NumberFormat`, `DateTimeFormat`, or `toLocaleString` usage in `apps/web/src`.
- Server-rendered Arabic `/super-admin/dashboard` now outputs `42.8 ألف US$`.
- Server-rendered English `/super-admin/dashboard` now outputs `US$ 42.8K`.
- Server-rendered Hebrew `/super-admin/dashboard` now outputs `‎US$ 42.8K`.

Fixed Super Admin language flicker on page navigation.

Root cause:
- Language persistence was previously resolved from browser `localStorage` after hydration.
- The server-rendered page could start in English/LTR before the client provider switched to saved Arabic or Hebrew.

Changed:
- Added server-readable locale cookie support using `royalcare_locale`.
- Updated the Next.js root layout to read the saved locale cookie before rendering UI.
- Root layout now applies `<html lang>` and `<html dir>` from the saved locale on the first server render.
- `LanguageProvider` now receives the server-resolved `initialLocale`.
- Removed first-render dependency on `localStorage`; `localStorage` is now only a browser-side mirror.
- Locale changes persist to both the `royalcare_locale` cookie and `royalcare.locale` localStorage key.
- Super Admin Login, Dashboard, Centers, and Add New Center Wizard all use the global provider state.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- Server-rendered `/super-admin/dashboard` with `royalcare_locale=ar` returns `<html lang="ar" dir="rtl">`.
- Server-rendered `/super-admin/centers` with `royalcare_locale=he` returns `<html lang="he" dir="rtl">`.
- Server-rendered `/super-admin/centers/new` with `royalcare_locale=ar` returns `<html lang="ar" dir="rtl">`.
- Server-rendered `/super-admin/login` with `royalcare_locale=he` returns `<html lang="he" dir="rtl">`.

Added global Super Admin language persistence.

Root cause:
- Dashboard, Centers, and Add New Center Wizard each kept their own page-level locale state initialized to English.
- Navigating between pages remounted a new component and reset the locale.

Added:
- `apps/web/src/i18n/LanguageProvider.tsx`
- App-wide `LanguageProvider` wrapping the Next.js root layout.

Changed:
- Selected language is stored in browser `localStorage` under `royalcare.locale`.
- `LanguageProvider` updates document `lang` and `dir` globally.
- `SuperAdminLayout` now reads and updates language through `useLanguage()`.
- Dashboard now reads global language state instead of local page state.
- Centers Management now reads global language state instead of local page state.
- Add New Center Wizard now reads global language state instead of local page state.
- Super Admin Login now reads global language state and renders English, Arabic, or Hebrew copy from the saved locale.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- `/super-admin/dashboard` returns `200 OK` locally.
- `/super-admin/centers` returns `200 OK` locally.
- `/super-admin/centers/new` returns `200 OK` locally.
- `/super-admin/login` returns `200 OK` locally.

Added Back to Centers action to the Add New Center wizard.

Changed:
- Added a top-header secondary button linking from `/super-admin/centers/new` back to `/super-admin/centers`.
- Added translations:
  - English: `Back to Centers`
  - Arabic: `العودة إلى المراكز`
  - Hebrew: `חזרה למרכזים`
- Button uses the shared secondary button style.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Created reusable custom DateField for Add New Center wizard date fields.

Root cause:
- Native `input type="date"` displays its visible value using browser/OS locale, which can show Arabic-style dates even when the RoyalCare app language is English.

Added:
- `apps/web/src/components/forms/DateField.tsx`

Changed:
- Start Date and Expiry Date now use the reusable `DateField` component.
- Visible date display is controlled by RoyalCare app locale, not browser/OS locale.
- Internal date value remains `YYYY-MM-DD`.
- English displays `YYYY-MM-DD`.
- Arabic and Hebrew use RTL-friendly day/month/year display.
- Date picker UI uses simple day/month/year selects with translated labels.
- Added translated day/month/year labels and updated date helper text in the wizard dictionary.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- `/super-admin/centers/new` returns `200 OK` locally.

Restored native date picker fields in the Add New Center wizard.

Changed:
- Start Date and Expiry Date now use native `input type="date"` controls again.
- Removed the plain-text date-input approach from the visible wizard UI.
- Added localized helper text for date fields while keeping browser-native date picker behavior.
- Documented that future wizard date fields must use native date controls, not fake text placeholders.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- `/super-admin/centers/new` returns `200 OK` locally.

Fixed Add New Center primary action link contrast on `/super-admin/centers`.

Root cause:
- The Add New Center action is a Next.js `Link`, rendered as an anchor.
- The global `a { color: inherit; }` rule was outside Tailwind's cascade layers, so it could override utility text color on link-like buttons in Tailwind v4.
- This caused the shared primary style's `text-white` to be unreliable for anchor buttons.

Changed:
- Moved the global anchor reset into `@layer base` so Tailwind utility classes win correctly.
- Added `primaryButtonClassName` to the shared button style utility.
- Updated the Centers Management Add New Center link to use `primaryButtonClassName`.
- Reconfirmed no matching primary action uses a dark navy background with dark text.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- `/super-admin/centers` returns `200 OK` locally.

Fixed Add New Center wizard language consistency and logo upload UI.

Changed:
- Replaced native date inputs with text-style date fields so visible placeholders are controlled by the selected language.
- Added localized date placeholders:
  - English: `yyyy-mm-dd`
  - Arabic: `يوم/شهر/سنة`
  - Hebrew: `יום/חודש/שנה`
- Added localized mock review dates.
- Replaced the static logo upload placeholder with a working image file picker.
- Logo picker accepts image files, shows the selected file name, and displays a local preview without backend upload.
- Added localized logo upload button, selected-file label, preview alt text, and helper text.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- `/super-admin/centers/new` returns `200 OK` locally.

Fixed Super Admin button contrast and shared button styling.

Added:
- Shared button style utility at `apps/web/src/components/ui/button-styles.ts`.

Changed:
- Login primary submit button now uses the shared primary button style.
- Centers Management Add New Center link now uses the shared primary style.
- Centers filters now use shared primary/secondary styles.
- Centers row actions now use shared secondary, warning, and danger styles.
- Dashboard section actions now use the shared ghost style.
- Add New Center wizard footer controls now use shared secondary, warning, and primary styles.
- Shared layout mobile menu button now uses the shared secondary icon style.

Button standards:
- Primary: navy background with white text.
- Secondary: white/light background with navy text and proper border.
- Danger: red background with white text.
- Warning: gold background with navy text.
- Success: green background with white text.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Created the Super Admin Add New Center Wizard.

Added:
- Route: `/super-admin/centers/new`
- Wizard route file
- Add New Center wizard component
- English, Arabic, and Hebrew wizard translation dictionary

Includes:
- Center Basic Info
- Subscription Plan
- Domain Setup
- Branding + Languages
- Center Admin Account
- Review + Confirm

Changed:
- Wizard uses the shared `SuperAdminLayout`.
- Existing Centers Management "Add New Center" action now links to `/super-admin/centers/new`.
- Wizard is UI-only with mock placeholders and no backend submission.
- Responsive structure follows the permanent RoyalCare rules: no unwanted page overflow, contained layouts, mobile stacking, tablet-friendly grids.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- `/super-admin/centers/new` returns `200 OK` locally.

Improved Super Admin sidebar hover and active menu styling.

Changed:
- Updated shared `SuperAdminLayout` navigation styling.
- Removed harsh white hover blocks from sidebar items.
- Hover now uses subtle navy background with a soft gold logical start-border.
- Active item now uses a stronger navy surface, clear gold logical start-border, and semibold white text.
- Increased item height/spacing slightly for better readability.
- Documented sidebar hover, active, and future sidebar input styling rules in UI memory.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Added permanent responsive and shared Super Admin layout rules.

Changed:
- Created reusable `SuperAdminLayout` for Super Admin pages.
- Refactored `/super-admin/dashboard` to use `SuperAdminLayout`.
- Refactored `/super-admin/centers` to use `SuperAdminLayout`.
- Documented that all future pages must be responsive by default across desktop, tablet, and mobile.
- Documented that tables may scroll only inside their own containers.
- Documented that Super Admin pages must not create page-specific navbars, sidebars, headers, language switchers, or profile header controls.
- Documented RTL/LTR drawer and sidebar direction rules for Arabic, Hebrew, and English.
- Updated agent guidance in `AGENTS.md` and `CLAUDE.md`.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- `/super-admin/dashboard` returns `200 OK` locally.
- `/super-admin/centers` returns `200 OK` locally.

Improved the Super Admin Centers Management UI and responsive quality.

Changed:
- Strengthened the RoyalCare-branded sidebar with larger navigation text, more spacing, and a clearer gold-accent active item.
- Replaced the mobile/tablet horizontal navigation strip with a direction-aware drawer.
- Drawer opens from the right for Arabic/Hebrew and from the left for English.
- Improved the heading command area so it feels more useful and less empty while staying simple.
- Updated cards to 1 column on mobile, 2 columns on tablet, and 4 columns on desktop.
- Made search and filters stack/wrap cleanly on smaller screens.
- Added `min-width: 0`, `max-width: 100%`, and `minmax(0, ...)` constraints through the Centers page shell, cards, filters, and table section.
- Kept the large centers table scrollable only inside the table container.
- Added translated drawer menu/close labels for English, Arabic, and Hebrew.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- `/super-admin/centers` returns `200 OK` locally.
- `/super-admin/dashboard` returns `200 OK` locally.

Fixed unwanted horizontal overflow in the Super Admin Dashboard responsive layout.

Root cause:
- The recent centers table uses a required minimum table width for readable columns.
- Its parent dashboard grid/section chain did not consistently use `min-width: 0`, so the table's minimum content width could force the page wider than the viewport on mobile/tablet widths.

Changed:
- Added `min-width: 0` and `max-width: 100%` constraints through the dashboard shell, main content, grid children, section shells, cards, and table wrapper.
- Changed the dashboard content grid to use `minmax(0, ...)` tracks so nested content can shrink correctly.
- Kept horizontal scrolling scoped to the table wrapper only.
- Ensured overview cards are explicitly 1 column on mobile, 2 columns on tablet, and 4 columns on desktop.
- Tightened header wrapping and control sizing for small screens.
- Added the same width safety discipline to the Super Admin Login route.
- Added `html, body { max-width: 100%; overflow-x: hidden; }` only as a final safety net after fixing the component-level source.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- `/super-admin/dashboard` returns `200 OK` locally.
- `/super-admin/login` returns `200 OK` locally.

Improved the Super Admin Dashboard responsive layout.

Changed:
- Replaced the smaller-screen horizontal dashboard navigation with a collapsible mobile/tablet drawer.
- Kept desktop sidebar navigation visible.
- Drawer opens from the right for Arabic and Hebrew RTL layouts.
- Drawer opens from the left for English LTR layouts.
- Dashboard overview cards now follow the required responsive grid: 4 columns on desktop, 2 columns on tablet, 1 column on mobile.
- Header title, language switcher, and profile area now wrap more safely on narrow screens.
- Domain and notification preview rows stack on mobile to avoid squeezed status badges.
- Recent centers table remains horizontally scrollable only where needed.
- Added translated drawer control labels for English, Arabic, and Hebrew.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.
- `/super-admin/dashboard` returns `200 OK` locally.
- `/super-admin/login` returns `200 OK` locally.

Created the Super Admin Centers Management page.

Added:
- Route: `/super-admin/centers`
- Centers page route file
- Centers management component
- Mock centers data
- English, Arabic, and Hebrew translation dictionary for Centers Management

Includes:
- Page title: Centers Management
- Add New Center button
- Search bar
- Filters for Active, Trial, Expired, Suspended
- Quick stats cards
- Responsive centers table
- Actions: View, Edit, Suspend, Renew Subscription, Delete

Table columns:
- Center Name
- Owner Name
- Center Type
- Subscription Plan
- Subscription Expiry Date
- Domain
- Status
- Actions

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Notes:
- UI only.
- Backend data is not connected yet.

Applied the official RoyalCare branding system across current platform UI.

Added:
- Official logo assets in `apps/web/public/brand/`.
- Brand token config in `apps/web/src/config/brand.ts`.
- Reusable `RoyalCareLogo` component in `apps/web/src/components/brand/RoyalCareLogo.tsx`.

Updated:
- Super Admin Login UI.
- Super Admin Dashboard UI.
- Global web color CSS variables.
- Sidebar colors.
- Buttons.
- Cards.
- Headers.
- Status badges.
- Language switcher.
- User profile area.

Brand colors:
- Royal Navy Blue `#0B2D5C`
- Luxury Gold `#C8A45D`
- Soft White `#F8FAFC`
- Neutral Gray `#E5E7EB`

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Notes:
- Structure was not redesigned.
- Backend/auth/data integrations were not changed.

Improved Super Admin Dashboard i18n and RTL behavior.

Changed:
- Language selector now switches the dashboard between English, Arabic, and Hebrew.
- Arabic and Hebrew set RTL direction.
- English sets LTR direction.
- Desktop sidebar mirrors to the right for Arabic and Hebrew.
- Sidebar labels are translated for all three languages.
- Dashboard section titles, card labels, status badges, actions, plan names, center names, domain issue text, notification titles, and account/header text are translated.
- Numbers and currency values use `Intl.NumberFormat` with the active locale.
- Mock dashboard data now uses stable translation keys instead of embedded English UI strings.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Created the first Super Admin Dashboard layout.

Added:
- Route: `/super-admin/dashboard`
- Dashboard page file
- Reusable Super Admin dashboard component
- Mock dashboard data file for future API replacement
- Locale/direction config
- Translation dictionary for Super Admin dashboard labels in English, Arabic, and Hebrew

Dashboard sections:
- Sidebar navigation
- Top header
- Dashboard overview cards
- Quick stats
- Recent centers
- Subscription overview
- Domain management preview
- Notifications preview

Design:
- Simple practical admin layout.
- White and dark blue RoyalCare style.
- Responsive desktop, tablet, and mobile structure.
- RTL-ready through locale direction mapping.
- UI text prepared through dictionaries instead of being embedded directly in the page.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Notes:
- UI only.
- Backend data is not connected yet.
- Language selector is structural only and will be wired when full i18n routing/provider work is implemented.

Defined system-wide multilingual i18n architecture.

Updated:
- `ai-memory/01_ARCHITECTURE.md`
- `ai-memory/05_UI_UX_RULES.md`
- `ai-memory/07_DECISIONS_LOG.md`

Added architecture rules:
- Required locales: Arabic, Hebrew, English.
- Direction mapping: Arabic/Hebrew RTL, English LTR.
- i18n applies to Public Website, Super Admin Panel, Center Admin Panel, and Customer Portal.
- Language switching should be available from user profile/settings for authenticated users.
- Public websites should respect center enabled languages and center default language.
- Translation files should be organized by locale and namespace.
- User-facing UI text should not be hardcoded in components.
- App shells must set `lang` and `dir` from the active locale.
- Admin layouts must use RTL-friendly logical CSS and simple mirrored layouts.

Needs Confirmation:
- Preferred Next.js i18n library.
- Locale URL strategy.
- Translation fallback behavior.

Created the first visible RoyalCare UI screen: Super Admin Login.

Added:
- Route: `/super-admin/login`
- File: `apps/web/src/app/(super-admin)/super-admin/login/page.tsx`
- Professional login page with:
  - RoyalCare logo/monogram area
  - Email field
  - Password field
  - Remember me checkbox
  - Forgot password link
  - Login button
  - Admin access note

Design:
- Simple ERP/admin style.
- White and dark blue RoyalCare look.
- Responsive desktop and mobile layout.
- RTL-friendly form structure.

Changed:
- Removed external Google font dependency from the web root layout.
- Switched the web app to a system font stack for more reliable offline/CI production builds.

Verified:
- `npm run lint` passes in `apps/web`.
- `npm run build` passes in `apps/web`.

Notes:
- Backend authentication is not connected yet.
- This is UI-only.

Extended the Prisma schema with Phase 2 business models.

Added models:
- `Customer`
- `Service`
- `Appointment`
- `Session`
- `Notification`
- `DynamicPage`
- `BrandingSettings`

Added enums:
- `CustomerStatus`
- `ServiceStatus`
- `AppointmentStatus`
- `AppointmentSource`
- `SessionStatus`
- `NotificationChannel`
- `NotificationStatus`
- `DynamicPageStatus`

Architecture notes:
- Every Phase 2 model includes `centerId`.
- Every Phase 2 tenant-owned model relates to `Center`.
- Customer records are isolated per center.
- Services, dynamic pages, and notifications support multilingual JSON content for `ar`, `he`, and `en`.
- Branding settings support logo URL, colors, default language, enabled languages, and theme JSON.
- Dynamic pages support per-center unique slugs.

Deferred:
- Payments
- Medical diagnosis details
- Staff scheduling
- Audit logs
- File assets
- Dedicated page block table

Verified:
- `npm run db:format` passes in `packages/database`.
- `npm run db:validate` passes in `packages/database`.
- `npm run typecheck` passes in `packages/database`.

Designed the Phase 1 production-ready Prisma schema foundation.

Added models:
- `User`
- `Role`
- `Permission`
- `UserRole`
- `RolePermission`
- `Center`
- `Subscription`
- `Domain`

Added enums:
- `UserStatus`
- `RoleStatus`
- `PermissionStatus`
- `UserRoleStatus`
- `RoleScope`
- `CenterType`
- `CenterStatus`
- `SupportedLanguage`
- `SubscriptionStatus`
- `BillingInterval`
- `DomainType`
- `DomainStatus`

Architecture notes:
- Uses UUID primary keys.
- Uses explicit RBAC join tables.
- Uses `centerId` for tenant-scoped assignments and center-owned subscription/domain records.
- Includes status fields and lifecycle timestamps.
- Supports subscription expiry/trial/cancel logic.
- Supports custom domains and RoyalCare subdomains.

Verified:
- `npm run db:format` passes in `packages/database`.
- `npm run db:validate` passes in `packages/database`.
- `npm run typecheck` passes in `packages/database`.

Deferred:
- Customers
- Appointments
- Services
- Sessions
- Notifications
- Dynamic Pages
- Branding Settings
- Audit Logs

Initialized the database architecture in `packages/database`.

Added:
- Prisma ORM `7.8.0`
- PostgreSQL datasource baseline
- `@royalcare/database` package metadata
- Prisma config at `packages/database/prisma.config.ts`
- Minimal Prisma schema at `packages/database/prisma/schema.prisma`
- Migration folder placeholder
- Seed folder placeholder
- TypeScript package configuration
- Tenant scope helper using `centerId`
- Database package scripts for:
  - `db:generate`
  - `db:validate`
  - `db:format`
  - `db:migrate:dev`
  - `db:migrate:deploy`
  - `db:studio`
  - `typecheck`

Verified:
- `npm run db:validate` passes in `packages/database`.
- `npm run typecheck` passes in `packages/database`.

Notes:
- Full RoyalCare application models were intentionally not created yet.
- Prisma schema currently contains generator/datasource configuration and planning comments only.
- npm reported `3 moderate severity vulnerabilities`; no automatic audit fix was run.

Initialized the backend API in `services/api`.

Added:
- NestJS `11.x` API scaffold generated with `@nestjs/cli@11.0.21`
- TypeScript backend setup
- REST-ready global prefix `api/v1`
- ESLint backend setup
- Clean modular API structure
- Health endpoint at `GET /api/v1/health`
- Module placeholders for:
  - Auth
  - Users
  - Tenancy
  - Centers
  - Subscriptions
  - Domains
  - Appointments
  - Customers
  - Services
  - Sessions
  - Notifications
  - Permissions
- Common backend folders for constants, decorators, DTOs, filters, guards, interceptors, interfaces, and pipes
- Tenant context interface using `centerId`

Verified:
- `npm run lint` passes in `services/api`.
- `npm run build` passes in `services/api`.
- `npm test` passes in `services/api`.
- `npm run test:e2e` passes in `services/api`.

Notes:
- No database connection was added.
- No Prisma schema was created.
- Business endpoints are not implemented yet.

Initialized the main web application in `apps/web`.

Added:
- Next.js `16.2.4`
- React `19.2.4`
- TypeScript
- Tailwind CSS
- App Router
- ESLint
- `src/` directory structure
- Import alias `@/*`
- Route-group placeholders for:
  - Public website
  - Super Admin Panel
  - Center Admin Panel
  - Customer Portal
- Feature/module placeholders for:
  - Auth
  - Tenancy
  - Public site
  - Super Admin
  - Center Admin
  - Customer Portal
- RTL-aware global CSS baseline

Removed:
- Generated demo homepage content
- Generated demo SVG assets

Verified:
- `npm run lint` passes in `apps/web`.

Notes:
- No actual RoyalCare pages or workflows were built yet.
- The web app is structure-ready for future implementation.

Initial official project memory initialization.

Added:
- Project overview
- Architecture direction
- Conceptual database schema
- Business rules
- API map
- UI/UX rules
- Permissions model
- Decisions log
- Current status
- Next tasks
- Claude guidance
- Agent guidance
- Root README

Notes:
- No application code has been generated yet.
- Many product and infrastructure details are intentionally marked as `Needs Confirmation`.

## 2026-04-28 - Centers i18n, RTL, Date, and Responsive Audit Fix

Updated the Centers Module UI localization and responsive hardening for:
- Centers List
- Center Details
- Edit Center
- Internal Notes
- Status Actions
- Manual Subscription Management

Changed:
- Centers List now maps API subscription plan codes to translated dictionary labels instead of showing raw API plan names.
- Center Details now translates manual subscription plans and subscription statuses instead of displaying enum values.
- Arabic and Hebrew dictionary entries were completed for newer edit, notes, status-action, and subscription-management UI text.
- Field-level API validation errors now choose the active UI locale when the backend returns localized error objects.
- Subscription and status modals now constrain height and scroll internally on small screens.
- Shared date formatter now formats ISO date-time strings by date part, preventing raw API timestamps such as `2027-06-01T00:00:00.000Z` from appearing in UI.

Verified:
- `npm.cmd run lint` passed in `apps/web`.
- `npx.cmd tsc --noEmit` passed in `apps/web`.
- `npm.cmd run build` passed in `apps/web`.
- SSR checks confirmed Centers List renders English as `lang="en" dir="ltr"` and Arabic/Hebrew as `lang="ar|he" dir="rtl"`.
- SSR checks confirmed Center Details route preserves Arabic RTL on `/super-admin/centers/:id?mode=edit`.

Notes:
- No new business features were added.
- No payment gateway or online payment UI was added.

## 2026-04-29 - Tenant Services Management

Implemented real Tenant Services Management inside the Center Admin dashboard.

Changed:
- Added the Prisma-backed tenant `Service` shape with `centerId`, multilingual names/descriptions, duration, manual price/currency metadata, active/archive status, timestamps, and tenant indexes.
- Added tenant API endpoints for service list, create, details, update, archive, and activate.
- Added backend center isolation by deriving `centerId` from the authenticated center session.
- Added service permissions: `services.view`, `services.create`, `services.update`, `services.archive`, and `services.activate`.
- Replaced the `/tenant/services` placeholder with real list, search, filter, create, details, edit, archive, and activate UI.
- Added `/tenant/services/new`, `/tenant/services/:id`, and `/tenant/services/:id/edit`.
- Added English, Arabic, and Hebrew service labels, statuses, validation text, empty states, and route text.

Verified:
- Prisma format, validate, generate, db push, and database package typecheck passed.
- API lint and build passed.
- Web lint, `tsc --noEmit`, and production build passed.
- Production route table includes all Services routes.
- Live API QA passed for create, list, details, update, archive, activate, validation errors, permissions, center isolation, and sensitive response leak checks.
- Existing `/tenant/patients` and `/api/v1/patients` still load after Services changes.
- Built `/tenant/services` route renders English LTR and Arabic/Hebrew RTL from the locale cookie.

Notes:
- Services pricing is manual metadata only. No online payment gateway, checkout, card, Stripe, or PayPal integration was added.

## 2026-04-29 - Tenant Dashboard i18n and RTL Fix

Fixed the tenant dashboard shell localization bug.

Changed:
- Added the same provider-backed language switcher pattern used by Super Admin to the Tenant Center Admin shell.
- Added tenant language labels for English, Arabic, and Hebrew.
- Tenant sidebar branding now uses translated dictionary values.
- Tenant shell now sets `lang` and `dir` from the active locale and keeps desktop/mobile sidebar direction mirrored for Arabic and Hebrew.
- Confirmed dashboard labels, role/status values, cards, logout, Patients, and Services surfaces use dictionary values instead of component hardcoded labels.

Verified:
- `npm.cmd run lint`, `npx.cmd tsc --noEmit`, and `npm.cmd run build` passed in `apps/web`.
- Built route checks returned `200` for `/tenant/dashboard`, `/tenant/patients`, `/tenant/services`, `/tenant/appointments`, `/tenant/staff`, `/tenant/billing`, `/tenant/reports`, and `/tenant/settings`.
- Built locale checks confirmed `/tenant/dashboard`, `/tenant/patients`, and `/tenant/services` render English as `lang="en" dir="ltr"` and Arabic/Hebrew as `lang="ar|he" dir="rtl"`.
- Source scan found no reported tenant dashboard/sidebar English labels as component literals; remaining hits are dictionary entries or component/type names.

Notes:
- No business features or online payment functionality were added.

## 2026-04-29 - Tenant Branding Shell Fix

Fixed the Tenant Center Admin shell branding source.

Changed:
- Tenant auth session now selects `center.branding.logoUrl`.
- Tenant frontend session type now includes `center.branding.logoUrl`.
- Tenant sidebar no longer renders the platform `RoyalCareLogo`.
- Tenant sidebar now renders the center's stored logo when available.
- Tenant sidebar falls back to center initials when no logo is stored, instead of falling back to platform branding.
- Tenant sidebar primary identity now shows the authenticated center name.

Verified:
- API lint and build passed.
- Web lint, `tsc --noEmit`, and build passed.
- Live `/api/v1/auth/center/login` and `/api/v1/auth/center/me` responses include `center.branding.logoUrl`.

Notes:
- The existing Create Center logo picker is still preview-only and does not upload/persist a logo URL. The backend field exists and is now wired when populated.

## 2026-04-29 - Tenant Services Default-Language Validation Fix

Fixed Tenant Services multilingual form validation.

Changed:
- Tenant Services backend now reads the authenticated center's `primaryLanguage` from the center session.
- Only the default language name and description are required for service create/full edit.
- English, Arabic, and Hebrew fields remain stored separately in the database.
- Non-default language fields are optional and can be blank.
- Explicitly blank default-language name/description is rejected on create and edit.
- Partial service PATCH requests can still update non-language fields without resending language fields.
- Tenant Services form now marks only the default-language name/description fields with `*`.
- Tenant Services form performs matching client-side validation before submit.

Verified:
- API lint and build passed.
- Web lint, `tsc --noEmit`, and build passed.
- Live API QA passed for EN, AR, and HE default-language centers.
- Valid create with only default language fields passed for EN, AR, and HE.
- Missing default name returned field-specific errors for `nameEn`, `nameAr`, or `nameHe`.
- Missing default description returned field-specific errors for `descriptionEn`, `descriptionAr`, or `descriptionHe`.
- Optional non-default language fields were accepted blank.
- Partial PATCH without language fields passed.
- Explicit blank default-language field on edit was rejected.
- Built `/tenant/services/new` route checks confirmed EN is LTR and AR/HE are RTL.

Notes:
- No auto-translation was added.
- Multilingual structure was preserved.

## 2026-04-29 - Dedicated Tenant Center Login

Added branded center-specific login routing.

Changed:
- Added `/c/[centerSlug]/login` for dedicated tenant center login.
- Added `/tenant/login` as the generic fallback login route.
- Added safe center login resolution endpoint: `GET /api/v1/auth/center/resolve/:centerSlug`.
- Center login resolution returns safe center identity, `branding.logoUrl`, primary language, status, and `loginAllowed`.
- `POST /api/v1/auth/center/login` now accepts optional `centerSlug` and authenticates only against that center's active role assignment.
- Tenant login UI resolves center branding by slug, shows center logo/name, applies the center default language through the shared locale provider, and blocks inactive/suspended centers before submit.
- Tenant logout/session redirects now use `/tenant/login`.

Verified:
- API lint and build passed.
- Web lint, `tsc --noEmit`, and build passed.
- Live API QA passed for valid dedicated login, wrong-center login rejection, suspended center blocking, center branding/default-language resolution, and sensitive leak checks.
- Built route checks returned `200` for `/c/royal-clinic/login`, `/c/alshifa-center/login`, `/c/jenin-care/login`, `/c/suspended-center/login`, `/tenant/login`, `/tenant/patients`, `/tenant/services`, and `/super-admin/login`.

Notes:
- Super Admin login and branding were not changed.
- No online payment functionality was added.

## 2026-04-29 - Documentation and QA Cleanup Before Appointments

Updated source-of-truth AI memory docs after the dedicated branded tenant login and Tenant Services validation work.

Changed:
- Documented `/c/[centerSlug]/login` as the dedicated branded tenant login route.
- Documented `/tenant/login` as the temporary generic fallback route.
- Documented tenant logo resolution from center branding with initials fallback.
- Documented center default language behavior and automatic RTL/LTR application.
- Documented wrong-center login rejection and suspended/cancelled/archived center blocking.
- Documented Tenant Services as private Center Admin ERP records by default.
- Documented Services default-language-required validation with optional non-default language fields.
- Reaffirmed manual/direct billing only and no online payment gateway, checkout, card, Stripe, or PayPal integration.
- Set Appointments as the next tenant module.

Verified:
- Web lint passed.
- Web `tsc --noEmit` passed.
- Web production build passed and listed `/c/[centerSlug]/login`, `/tenant/login`, and Tenant Services routes.
- API lint passed.
- API build passed.

Notes:
- No business features were added.
- No completed modules were rebuilt.

## 2026-04-29 - Super Admin Centers Regression Diagnosis and Center Login Access

Fixed Super Admin Centers operational visibility after tenant work.

Changed:
- Pinned the web dev script to port `3002` so the NestJS API can consistently serve `http://localhost:3001/api/v1`.
- Improved Super Admin Centers permission and centers-list error messaging so API or permission failures show a clear in-page message.
- Added a Center Login Access section to Super Admin Center Details.
- Center Login Access shows the public-safe center slug and full dedicated `/c/[centerSlug]/login` URL.
- Added Copy Login Link and Open Login Page actions.
- Added English, Arabic, and Hebrew translations for the new Center Login Access labels, actions, success state, and missing-slug fallback.

Verified:
- Direct database check found 23 `Center` rows in `royalcare_dev`.
- `GET /api/v1/permissions/me` returned `200` for the fallback local Super Admin with expected platform permissions.
- `GET /api/v1/centers?pageSize=100` returned `200` with `pagination.total: 23`.
- `GET /api/v1/centers/:centerId` returned real center details including `slug`.
- `/super-admin/centers`, `/super-admin/centers/:id`, `/c/royal-clinic/login`, `/tenant/patients`, and `/tenant/services` route checks returned `200`.

Notes:
- No Super Admin auth semantics were merged with tenant auth.
- No online payment functionality was added.

## 2026-04-29 - Tenant Appointments Management

Implemented real Tenant Appointments Management inside the Center Admin dashboard.

Changed:
- Reworked the Prisma `Appointment` model for operational tenant scheduling with `centerId`, `patientId`, `serviceId`, `staffUserId`, `createdByUserId`, date/time fields, status, notes, internal notes, cancellation fields, reminder flag, and timestamps.
- Added tenant appointment statuses: `SCHEDULED`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, and `NO_SHOW`.
- Added tenant appointment API endpoints for list, options, create, details, update, status update, and cancel.
- Added backend validation for same-center patient, service, provider, invalid date/time, same-day end time, provider overlap, and patient overlap.
- Added tenant appointment permissions: `appointments.view`, `appointments.create`, `appointments.update`, `appointments.cancel`, and `appointments.status.update`.
- Replaced the `/tenant/appointments` placeholder with real list, live search, status/date/provider filters, today/upcoming summary cards, create, details, edit, cancel, and status update UI.
- Added `/tenant/appointments/new`, `/tenant/appointments/:id`, and `/tenant/appointments/:id/edit`.
- Added English, Arabic, and Hebrew appointment dictionary labels, statuses, validation text, empty states, and route text.

Verified:
- Prisma format, validate, generate, db push, and database package typecheck passed.
- API lint and build passed.
- Web lint, `tsc --noEmit`, and production build passed.
- Live API QA passed for appointment create, list, details, edit, status update, cancellation, provider/patient overlap prevention, permission denial, cross-center protection, Patients API still working, Services API still working, and dedicated center login resolution.
- Built route checks returned `200` for `/tenant/appointments`, `/tenant/appointments/new`, `/tenant/appointments/:id`, `/tenant/appointments/:id/edit`, `/tenant/patients`, `/tenant/services`, and `/c/royal-clinic/login`.
- Locale route checks confirmed `/tenant/appointments` renders English as `lang="en" dir="ltr"` and Arabic/Hebrew as `lang="ar|he" dir="rtl"` when the locale cookie is set.

Notes:
- No hard delete endpoint was added.
- No online payment functionality was added.
- Advanced working-hours and staff-availability rules remain future scope.

## 2026-04-30 - Tenant Staff Management

Implemented production-grade Tenant Staff Management inside the Center Admin dashboard.

Changed:
- Replaced the `/tenant/staff` Coming Soon placeholder with a real staff list.
- Added `/tenant/staff/new`, `/tenant/staff/:id`, and `/tenant/staff/:id/edit`.
- Added Tenant Staff API endpoints for list, create, details, update, and activate/deactivate.
- Staff create requires full name, email, role, status, and password; edit keeps password optional and never displays existing passwords.
- Staff passwords are hashed with the existing scrypt password helper and `passwordHash` is never returned.
- Added tenant staff permissions: `staff.view`, `staff.create`, `staff.update`, and `staff.activate`.
- Tenant staff management uses existing center roles: `CENTER_OWNER`, `CENTER_MANAGER`, `DOCTOR`, `RECEPTIONIST`, `ACCOUNTANT`, and `STAFF`.
- Staff list supports search by name/email plus role and status filters.
- Added English, Arabic, and Hebrew staff translations with RTL support through the existing tenant shell.
- Appointment provider options now include only same-center active provider-capable staff roles: `DOCTOR`, `STAFF`, and `CENTER_MANAGER`.
- Appointment provider labels now prefer full name and safely fall back to email when full name is missing.

Verified:
- API build passed.
- API lint passed.
- Web lint passed.
- Web `tsc --noEmit` passed.
- Web production build passed and listed `/tenant/staff`, `/tenant/staff/new`, `/tenant/staff/:id`, and `/tenant/staff/:id/edit`.

Notes:
- No Prisma/database schema change was required; tenant staff uses the existing `User`, `Role`, and `UserRole` models.
- No hard delete endpoint was added.
- No online payment functionality was added.

## 2026-05-05 - Tenant RBAC Permission Key Standardization

Fixed tenant RBAC permission key mismatches that caused roles with assigned permissions, such as `appointments:view`, to receive `403` from tenant APIs.

Changed:
- Added a shared tenant permission key normalizer with canonical colon keys and legacy dot-key compatibility.
- Standardized tenant role permission storage and defaults to colon keys.
- Updated center session permission resolution so `/auth/center/me` returns normalized effective permissions for the logged-in center user.
- Updated tenant appointments, services, staff, billing, payments, and patient-credit controllers/services to check `session.permissions` instead of role-name strings.
- Updated frontend tenant permission helpers and action gates to read the session permission array.
- Updated the tenant role permissions page to save canonical keys.
- Extended `GET /api/v1/permissions/me` so tenant-cookie sessions return tenant session permissions while Super Admin header usage still returns platform permissions.

Mismatches fixed:
- `appointments.view` -> `appointments:view`
- `appointments.status.update` -> `appointments:status`
- `services.archive` -> `services:archive`
- `services.activate` -> `services:status`
- `billing.mark_paid` -> `billing:update`
- `payments.view/create` -> `payments:view/create`
- `staff.view/create/update/activate` -> `staff:view/create/update/status`

Follow-up audit:
- Canonical tenant keys were aligned to the final module/action list: patients status, services archive/status, staff status, billing cancel, reports view, settings view, and role permissions view/update.
- Patients, reports, role-permission APIs, and tenant sidebar visibility now enforce canonical keys.
- Dev-only RBAC denial logging prints the required permission and effective permission array when a tenant permission check fails outside production.
- Tenant frontend now uses `GET /api/v1/permissions/me` as the tenant permission/session source for the Center Admin shell.
- Center Admin sidebar items are hidden when the current user lacks the module `:view` permission.
- Direct URL access without the page permission now shows a translated Access Denied panel instead of a generic loading/error state.
- Create/edit/status/cancel/payment/staff/role-permission actions are hidden according to the canonical permission keys.

Verified:
- `npm.cmd run build` passed in `services/api`.
- `npm.cmd run lint` passed in `services/api`.
- `npm.cmd run lint` passed in `apps/web`.
- `npx.cmd tsc --noEmit` passed in `apps/web`.
- `npm.cmd run build` passed in `apps/web`.

## 2026-05-05 - Tenant Regression QA Pass

Ran a tenant regression QA pass focused on current sidebar pages, tenant RBAC gates, route registration, and build stability.

Changed:
- Fixed the tenant profile page access gate so every authenticated center user can open their own profile even when they do not have `settings:view`; module pages still inherit their canonical `:view` permissions.

Verified:
- API lint, API build, and API unit tests passed.
- Web lint, web `tsc --noEmit`, and web production build passed.
- Tenant sidebar routes returned `200` from the running Next.js server: dashboard, patients, services, staff, appointments, billing, reports, settings, role permissions, and profile.
- Tenant API routes returned auth-gated responses instead of `500`: appointments, services, staff, billing, billing summary, top patients, appointment invoice lookup, invoice payments, use-credit, roles, and `/permissions/me`.
- EN/AR/HE SSR locale checks passed on `/tenant/login`: English LTR, Arabic RTL, Hebrew RTL.

Notes:
- No new features were added.
- No online payment functionality was added.
- Full destructive/manual CRUD matrix was not run without confirmed seeded role credentials for owner, manager, doctor, receptionist, and accountant.

## 2026-05-05 - Tenant Dashboard Counters Fix

Fixed tenant dashboard counters that always displayed zero despite real tenant data.

Changed:
- Added `GET /api/v1/tenant/dashboard/stats`.
- Dashboard stats now count real center-scoped patients, appointments, services, and staff assignments from the authenticated tenant session center.
- Updated the tenant dashboard UI to fetch stats, show a loading placeholder, and show a translated error instead of silently defaulting to zero.

Verified:
- API build and lint passed.
- Web lint, `tsc --noEmit`, and production build passed.
- Live API check returned non-zero counts for Royal Clinic.
- Creating one same-center patient, service, staff user, and appointment increased each matching dashboard count by exactly `+1`.
- A different center returned a separate count set, confirming center isolation.

## 2026-05-05 - Tenant Dashboard UX Enhancement

Extended the existing tenant dashboard without redesigning the architecture.

Changed:
- Added Today Activity cards for today's appointments, appointments upcoming in the next 2 hours, and missed/no-show appointments.
- Added Recent Activity sections for the last 5 appointments and last 5 invoices.
- Added permission-aware Quick Actions for Add Patient, Add Appointment, and Create Invoice.
- Added Revenue Snapshot using the existing tenant billing summary endpoint.
- Added Alerts for upcoming appointments soon, patients with credit, and pending invoices.
- Extended `GET /api/v1/tenant/dashboard/stats` with dashboard activity, alerts, and recent activity data.

Verified:
- API build and lint passed.
- Web lint, `tsc --noEmit`, and production build passed.
- Live dashboard stats returned activity, alerts, recent appointments, and recent invoices.
- Creating a same-center appointment dated today increased total appointments and today's appointment count by `+1`, and the new appointment appeared first in recent appointments.
- Quick action target routes returned `200`: `/tenant/patients`, `/tenant/appointments/new`, `/tenant/billing/new`.

## 2026-05-05 - Super Admin Centers Management

Built the requested Super Admin Centers Management surface without changing the older Super Admin architecture.

Changed:
- Added strict Super Admin-only endpoints: `GET /api/v1/admin/centers`, `GET /api/v1/admin/centers/:centerId`, and `PATCH /api/v1/admin/centers/:centerId/status`.
- Added center summaries with `usersCount` calculated from same-center non-revoked user role assignments.
- Added center details with a safe same-center users list and no password hash exposure.
- Added `/admin/centers` and `/admin/centers/[centerId]` pages using the existing Super Admin layout.
- Added EN/AR/HE translations and RTL-ready responsive tables/cards for the new pages.

Verified:
- API lint and API build passed.
- Web lint, web `tsc --noEmit`, and web production build passed.
- Live API smoke checks confirmed no-header access returns `403`, a tenant center user header returns `403`, and a Super Admin header returns center list data.
- Center details returned safe users for Royal Clinic with no password hash fields.
- Status QA toggled a QA center from `ACTIVE` to `SUSPENDED` and restored it to `ACTIVE`.
- Local Next.js route checks returned `200` for `/admin/centers` and `/admin/centers/:centerId`.

## 2026-05-05 - Super Admin Login as Center Admin

Implemented Super Admin center impersonation using the existing tenant center session architecture.

Changed:
- Added `POST /api/v1/admin/centers/:centerId/login-as`.
- The endpoint requires explicit platform `super_admin`, selects the center owner or first active center manager, refuses platform Super Admin targets, creates the normal tenant center session cookie, and returns `token` plus `redirectUrl`.
- Added internal-note audit logging for each impersonation with Super Admin actor and target user details.
- Connected `Login as Center Admin` / `الدخول كمدير المركز` / Hebrew equivalent buttons on `/admin/centers` and `/admin/centers/:centerId`.

Verified:
- API build and lint passed.
- Web lint, web `tsc --noEmit`, and web production build passed.
- Live `POST /api/v1/admin/centers/:centerId/login-as` returned a token and `/tenant/dashboard` redirect URL.
- The returned cookie resolved through `GET /api/v1/auth/center/me` as the selected same-center center manager.
- Missing Super Admin header and tenant user header both returned `403`.
- Internal note audit entry was created with actor, target user, and center details.

## 2026-05-05 - Login as Center Admin Button Fix

Fixed the Super Admin UI click path for "Login as Center Admin".

Changed:
- The `/admin/centers` API client now resolves and caches the current Super Admin user id from `/permissions/me` when `royalcare.superAdminUserId` is missing.
- Added safe development-only logs for click, API request start, API response, and redirect URL.
- The list and details buttons now surface visible translated errors when the login-as API fails.

Verified:
- Web lint, web `tsc --noEmit`, and web production build passed.

## 2026-05-05 - Super Admin Action Visibility Fix

Restored Super Admin action visibility after tenant RBAC work made platform actions depend too heavily on frontend permission arrays.

Changed:
- Super Admin center list/details actions are no longer hidden by frontend permission fetch results.
- Restored Add Center, View, Activate/Suspend, Login as Center Admin, Add User to Center, and reset-password visibility.
- Backend endpoints remain the real Super Admin protection layer.

Verified:
- Web lint, web `tsc --noEmit`, and web production build passed.

## 2026-05-05 - Super Admin Login-as No-manager Handling

Fixed Super Admin login-as behavior for centers without an active center owner or manager.

Changed:
- `POST /api/v1/admin/centers/:centerId/login-as` now returns `409 Conflict` with `errorCode: NO_ACTIVE_CENTER_MANAGER` when no active `CENTER_OWNER` or `CENTER_MANAGER` exists.
- `/admin/centers`, `/admin/centers/:centerId`, and `/super-admin/centers/:id` handle that error with localized EN/AR/HE warnings and an Add Center Manager action.
- The older Super Admin center details page opens the existing staff form preselected as `CENTER_MANAGER`.

Verified:
- API build and lint passed.
- Web lint, web `tsc --noEmit`, and web production build passed.
- Live success login-as returned token and `/tenant/dashboard`.
- Live no-manager login-as returned `409` with `NO_ACTIVE_CENTER_MANAGER`.

## 2026-05-05 - Super Admin Add Center Manager Flow

Made the "Add Center Manager" recovery action functional inside the Super Admin center details page.

Changed:
- Added `POST /api/v1/admin/centers/:centerId/manager`.
- The endpoint requires Super Admin, creates or assigns a same-center `CENTER_MANAGER`, requires a temporary password, hashes it, blocks platform Super Admin assignment, and returns a safe user summary.
- Added a modal in `/admin/centers/:centerId` for manager name, email, optional phone, and temporary password.
- After successful manager creation, the center details refresh, the no-manager warning is hidden, and login-as becomes available.

Verified:
- API build and lint passed.
- Web lint, web `tsc --noEmit`, and web production build passed.
- Live API smoke created an active `CENTER_MANAGER` for a previously no-manager center, then login-as returned a token and `/tenant/dashboard`.

## 2026-05-06 - Super Admin Audit Log Write Fix

Fixed Audit Logs returning an empty list after Super Admin actions.

Changed:
- Made `AuditLog.actorUserId` nullable so expected audit records can still persist when a Super Admin actor header is missing or cannot be resolved.
- `AuditService.log()` now resolves actor, target user, and center links safely; unresolved supplied IDs are retained in metadata instead of dropping the log.
- Super Admin user create, update, status change, reset password, center-role assignment, and center login-as now await audit writes after successful actions.
- Center login-as audit rows now include the impersonated tenant admin as `targetUserId`.
- Super Admin Add Center Manager flow writes a center-role assignment audit row.

Verified:
- Prisma `db:format`, `db:validate`, `db:generate`, and `db push` passed.
- API build and lint passed.
- Live API smoke created audit rows for `user.created`, `user.updated`, `user.status_changed`, `user.password_reset`, `user.center_role_assigned`, and `center.login_as`.

## 2026-05-06 - Super Admin Audit Actor/Target Filters

Improved Audit Logs filtering so actors and affected users are not confused.

Changed:
- `GET /api/v1/super-admin/audit-logs` now supports `targetUserId` and `targetSearch` in addition to `actorUserId` and `actorSearch`.
- The Audit Logs UI now has separate autocomplete filters for actor and target.
- Actor label is clarified as "Search actor"; target label is "Search target" with EN/AR/HE translations.

Verified:
- API build and lint passed.
- Web lint and `tsc --noEmit` passed.
- Live API smoke confirmed actor filtering, target filtering, target-as-actor filtering, and clear/latest behavior.

## 2026-05-06 - Center Status Audit Logging

Added Super Admin audit logging for center activate/suspend status changes.

Changed:
- `PATCH /api/v1/admin/centers/:centerId/status` now writes `CENTER_STATUS_CHANGED` after a successful status update.
- The audit metadata includes `oldStatus`, `newStatus`, `centerName`, `actorName`, and `actorEmail`.
- Audit Logs UI labels `CENTER_STATUS_CHANGED` in EN/AR/HE and colors the badge from `metadata.newStatus` (`ACTIVE` green, `SUSPENDED` red).

Verified:
- API build and lint passed.
- Web lint and `tsc --noEmit` passed.
- Live API smoke changed a center from `ACTIVE` to `SUSPENDED` and confirmed the audit row.

## 2026-05-06 - Super Admin User Status Audit Logging

Added detailed audit logging for Super Admin user status changes.

Changed:
- `PATCH /api/v1/super-admin/users/:userId/status` now writes `USER_STATUS_CHANGED` from `UsersService.updateStatus()` after a successful status update.
- The audit metadata includes `oldStatus`, `newStatus`, `targetName`, `targetEmail`, `actorName`, and `actorEmail`.
- Audit Logs UI labels `USER_STATUS_CHANGED` in EN/AR/HE and colors the badge from `metadata.newStatus` (`ACTIVE` green, `SUSPENDED` red, other statuses amber).

Verified:
- API build and lint passed.
- Web lint and `tsc --noEmit` passed.
- Live API smoke changed a user from `ACTIVE` to `SUSPENDED` and confirmed the audit row.

## 2026-05-06 - Tenant Staff Status Audit Logging

Added Super Admin-visible audit logging for tenant staff activate/deactivate actions.

Changed:
- `PATCH /api/v1/tenant/staff/:staffId/status` now writes `TENANT_STAFF_STATUS_CHANGED` from `TenantStaffService.updateStatus()` after a successful tenant staff status update.
- The audit row includes tenant `actorUserId`, `targetUserId`, `centerId`, and metadata with `oldStatus`, `newStatus`, `targetName`, `targetEmail`, and `centerName`.
- Audit Logs UI labels `TENANT_STAFF_STATUS_CHANGED` in EN/AR/HE and colors the badge from `metadata.newStatus`.

Verified:
- API build and lint passed.
- Web lint and `tsc --noEmit` passed.
- Live tenant smoke changed Ahmad Taleb from `ACTIVE` to `INACTIVE` in Jenin Care and confirmed the Super Admin audit row.

## 2026-05-06 - Tenant Staff Audit Impersonation Metadata

Fixed tenant staff status audit logging when the action is performed through Super Admin login-as.

Changed:
- Center session tokens now carry optional `impersonatorUserId` when created by `POST /api/v1/admin/centers/:centerId/login-as`.
- Center session resolution exposes impersonation metadata to tenant endpoints.
- Tenant staff status audit rows use the Super Admin as `actorUserId` when impersonation exists, while preserving the tenant session user in `metadata.tenantActorUserId`.
- `TENANT_STAFF_STATUS_CHANGED` metadata now includes `source: "TENANT_STAFF"`, `impersonatedBySuperAdmin`, and optional `impersonatorUserId`.

Verified:
- API build and lint passed.
- Web lint and `tsc --noEmit` passed.
- Live impersonation smoke changed Ahmad Taleb in Jenin Care and confirmed the audit row actor was the Super Admin, target was the staff user, and impersonation metadata was present.

## 2026-05-06 - Critical Update Audit Logging Pass

Moved remaining critical Super Admin user audit writes into service-level update paths.

Changed:
- `UsersService.update()` now writes `USER_UPDATED` after successful user edits, with actor and target snapshots plus updated field names.
- `UsersService.resetPassword()` now writes `PASSWORD_RESET` after successful password resets, with actor and target snapshots.
- Controller-level thin `user.updated` and `user.password_reset` logs were removed to avoid duplicate/weak audit entries.
- Existing service-level logs remain active for `USER_STATUS_CHANGED`, `CENTER_STATUS_CHANGED`, and `TENANT_STAFF_STATUS_CHANGED`.

Verified:
- API build and lint passed.
- Web lint and `tsc --noEmit` passed.
- Live API smoke confirmed newest-first audit rows for `USER_UPDATED`, `PASSWORD_RESET`, and `USER_STATUS_CHANGED`.

## 2026-05-06 - Staff Status Audit Detail Upgrade

Fixed staff status audit rows from both tenant staff and Super Admin center-details staff actions.

Changed:
- Staff status changes now write canonical `STAFF_STATUS_CHANGED` audit rows instead of adding more source-specific action names.
- `TenantStaffService.updateStatus()` and `CentersService.updateStaffStatus()` include `oldStatus`, `newStatus`, `targetName`, `targetEmail`, `centerName`, and `actorName` in metadata.
- Center-details staff status updates pass the Super Admin actor id into the service and log with `source: "CENTER_DETAILS_PAGE"`.
- Audit log list responses now include display helpers: `readableActionAr`, `actorDisplayName`, `targetDisplayName`, `targetDisplayEmail`, and `centerDisplayName`.
- Audit Logs UI uses the enriched display fields and falls back to `غير محدد` instead of a dash when actor, target, or center names are missing.

Verified:
- API build and lint passed.
- Web lint, `tsc --noEmit`, and build passed.
- Live center-details smoke changed Ahmad Taleb in Jenin Care to `INACTIVE`, confirmed a `STAFF_STATUS_CHANGED` audit row with Arabic readable text, then restored the staff user to `ACTIVE`.

## 2026-05-06 - Staff Password Reset Audit Logging

Added readable audit logging for Super Admin center-details staff password resets.

Changed:
- `POST /api/v1/centers/:centerId/staff/:userId/reset-password` now passes the Super Admin actor id into `CentersService.resetStaffPassword()`.
- `CentersService.resetStaffPassword()` writes `STAFF_PASSWORD_RESET` after a successful password hash update.
- Staff password reset metadata includes `actorName`, `targetName`, `targetEmail`, `centerName`, and `source: "PASSWORD_RESET"`.
- No temporary password or password hash is stored in audit metadata.
- Audit log response mapping returns Arabic readable text for `STAFF_PASSWORD_RESET`.
- Audit Logs UI and dictionaries include EN/AR/HE labels for `STAFF_PASSWORD_RESET`.

Verified:
- API build and lint passed.
- Web lint, `tsc --noEmit`, and build passed.
- Live center-details smoke reset Ahmad Taleb's password in Jenin Care and confirmed a `STAFF_PASSWORD_RESET` audit row with full readable details and no password in metadata.

## 2026-05-06 - Audit Logs Timeline UI

Upgraded Super Admin Audit Logs from a plain table to a SaaS-style activity timeline.

Changed:
- `GET /api/v1/super-admin/audit-logs` keeps the same filters and pagination but now returns enriched timeline fields: `actionLabel`, `actorName`, `actorEmail`, `targetName`, `targetEmail`, and `centerName`.
- Backend action labels now include status transitions for user, staff, and center status changes.
- Backend readable Arabic action text covers staff password reset, password reset, staff status changes, center status changes, user status changes, and login-as center actions.
- `/super-admin/audit-logs` now renders responsive timeline cards instead of a wide table.
- Timeline cards show action label, actor, target, center, date/time, and optional IP/device values when present in metadata.
- Empty filtered results now show localized EN/AR/HE messages, including Arabic `لا توجد نتائج مطابقة للفلاتر الحالية`.

Verified:
- API build and lint passed.
- Web lint, `tsc --noEmit`, and build passed.
- Live API smoke confirmed newest-first audit rows return timeline-ready fields.

## 2026-05-06 - Super Admin Analytics Dashboard API

Added backend-only Super Admin analytics dashboard endpoint.

Changed:
- Added `SuperAdminAnalyticsModule`, `SuperAdminAnalyticsController`, and `SuperAdminAnalyticsService`.
- Registered `GET /api/v1/super-admin/analytics/dashboard`.
- The endpoint returns center, user, appointment, billing, and audit KPI groups.
- Billing revenue totals aggregate payments only when the linked invoice is not `CANCELLED`.
- Audit slices reuse enriched audit rows with `actionLabel`, actor/target names and emails, center name, and readable Arabic action text.
- Hardened `PermissionGuard` so protected Super Admin endpoints require an explicit platform user header instead of silently using the default seed admin.

Verified:
- API build, `tsc --noEmit`, and lint passed.
- Live API smoke confirmed Super Admin header access returns analytics data.
- Live no-header smoke returned `403`, confirming tenant/no-platform-header access is blocked by the platform guard.

## 2026-05-06 - Center Status Audit Logging Fix

Fixed missing audit rows for Super Admin center status changes.

Changed:
- Moved `CENTER_STATUS_CHANGED` audit logging into `CentersService.updateStatus()` so all center status endpoints log consistently.
- `PATCH /api/v1/admin/centers/:centerId/status`, `PATCH /api/v1/centers/:centerId/status`, and `PATCH /api/v1/super-admin/centers/:centerId/status` now share the same audit behavior.
- Center status audit metadata now includes `oldStatus`, `newStatus`, `oldIsActive`, `newIsActive`, `centerName`, `centerSlug`, `targetType: "CENTER"`, `targetId`, `targetName`, `targetEmail: null`, `changedBy`, optional `ip`, and optional `userAgent/device`.
- Audit enrichment now maps `CENTER_ACTIVATED` and `CENTER_DEACTIVATED` in addition to `CENTER_STATUS_CHANGED`.

Verified:
- API build and lint passed.
- Web lint, `tsc --noEmit`, and build passed.
- Live smoke changed a QA center from `ACTIVE` to `SUSPENDED`, confirmed a `CENTER_STATUS_CHANGED` row with readable Arabic text and center target fields, then changed it back to `ACTIVE` and confirmed a second row.
- No-header audit logs access returned `403`.

## 2026-05-06 - Super Admin Dashboard API Integration

Converted the existing Super Admin dashboard UI from mock/static data to the real analytics endpoint.

Changed:
- Added `apps/web/src/lib/api/super-admin-analytics.ts` with a typed `getSuperAdminAnalyticsDashboard()` client for `GET /api/v1/super-admin/analytics/dashboard`.
- `/super-admin/dashboard` now loads KPI cards, quick stats, recent centers, billing overview, revenue by center, and latest audit activity from the analytics response.
- Added loading, empty, and translated error states while preserving the existing dashboard layout.
- Dashboard date display uses the shared numeric `formatDate()` helper and currency display uses the existing compact currency formatter.
- Extended the analytics backend response with `centers.latestCenters` so the existing recent-centers panel can stay API-backed without adding a second request.
- Updated EN/AR/HE dashboard dictionary keys for the new API-backed sections and statuses.

Verified:
- API build passed.
- Web lint, `tsc --noEmit`, and production build passed.
- Live API smoke confirmed the analytics endpoint returns center counts, latest centers, revenue totals, and newest-first enriched audit logs for a Super Admin header.

## 2026-05-06 - Super Admin Dashboard Smart Insights

Added rule-based Smart Insights to the Super Admin analytics dashboard.

Changed:
- `GET /api/v1/super-admin/analytics/dashboard` now returns `insights.alerts`, `insights.highlights`, and `insights.recommendations`.
- Insight items include `type`, `severity`, translated EN/AR/HE messages, and optional `relatedCenterId`.
- Alerts cover no active centers, centers with no appointments in the last 7 days, revenue drop, cancelled invoices exceeding paid invoices, and high same-day sensitive action volume.
- Highlights cover top center by revenue, top center by appointments, most active admin, and revenue growth.
- Recommendations cover inactive centers, invoice cancellation review, inactive users, and no recent appointment activity.
- `/super-admin/dashboard` now renders a compact Smart Insights section above the KPI cards without changing the dashboard layout.

Verified:
- API lint and build passed.
- Web lint, `tsc --noEmit`, and production build passed.
- Live API smoke confirmed populated `alerts`, `highlights`, and `recommendations` are returned with translated messages.

## 2026-05-07 - Subscription Lifecycle Display and Smart Insight Name Safety

Fixed two production UI/data safety issues.

Changed:
- Super Admin subscription list now safely formats lifecycle text from `daysRemaining` when present, with fallbacks for `daysUntilExpiry`, `remainingDays`, or a valid `currentPeriodEnd`.
- Missing or invalid subscription end dates render `—` instead of leaking `undefined`.
- Subscription API list/detail responses return `notificationPhone: null` and `notificationLanguage: null` placeholders without selecting missing database columns, keeping the current page load path stable until the database column rollout is applied.
- Smart Insights center-name handling now detects repeated question marks/corrupted names and avoids embedding bad center names in Arabic alert text.
- Insight rows now use safe `relatedCenterName` values for center-related insights.

Verified:
- API build and lint passed.
- Web `tsc --noEmit`, lint, and production build passed.
- Live API smoke confirmed subscriptions return `daysRemaining`, `isExpired`, and `isExpiringSoon`.
- Live API smoke confirmed Arabic no-recent-appointments insight uses `هذا المركز` instead of `????`.
## 2026-05-12 - Tenant Subscription Access Control

Implemented backend-enforced tenant subscription write restrictions.

Changed:
- Added `TenantSubscriptionAccessService` and `TenantSubscriptionAccessMiddleware`.
- Applied subscription write checks to tenant patients, appointments, services, staff, billing/payments/credit, and tenant role-permission controllers.
- Tenant sessions now include `subscriptionAccess` from `/auth/center/me` and tenant-mode `/permissions/me`.
- Tenant shell shows subscription warning/restriction banners from the shared session state.
- Tenant list action buttons now disable with localized messages when subscription writes are blocked.
- Arabic restriction text now matches the required production copy for expired and suspended centers.

Verified:
- API lint and build passed.
- Web lint, `tsc --noEmit`, and production build passed.
- Middleware allows dashboard/notification reads and renewal request/logout while blocking tenant business write methods for expired/suspended subscriptions.

## 2026-05-12 - Super Admin Subscription Overview Actions

Improved the Super Admin subscriptions overview in place.

Changed:
- Added quick filter cards for All, Expiring Soon, Expired, Suspended, and Missing WhatsApp Phone.
- Added lifecycle badges for days remaining and visible missing WhatsApp phone indicators in desktop rows and mobile cards.
- Row actions now use the existing subscription PATCH endpoint for 30-day renewal and suspension.
- WhatsApp action opens only when a phone is available; missing-phone rows route the action to the edit subscription modal.

Verified:
- Web lint, `tsc --noEmit`, and production build passed.

## 2026-05-12 - Super Admin Subscription Filter Fix

Fixed subscription overview quick filters returning empty results.

Changed:
- `GET /api/v1/super-admin/subscriptions` now returns real safe subscription notification phone/language fields plus `ownerPhone` and `centerPhone: null`.
- Added backend support for `missingPhone=true` and made expired/expiring filters lifecycle-aware.
- `/super-admin/subscriptions` now applies the final quick-filter check against actual response fields so Expiring Soon, Expired, Suspended/Canceled, and Missing WhatsApp Phone behave consistently.

Verified:
- API lint and build passed.
- Web lint, `tsc --noEmit`, and production build passed.

## 2026-05-12 - Suspended Subscription Status Normalization

Fixed suspended subscription counts across the Super Admin dashboard and subscriptions page.

Changed:
- Added a shared web `normalizeSubscriptionStatus()` helper for subscription list lifecycle/status filtering.
- Suspended list filtering now treats subscription `SUSPENDED`/`CANCELLED` and center `SUSPENDED`/`CANCELLED` as blocked/suspended states.
- `GET /api/v1/super-admin/subscriptions?status=SUSPENDED` now uses the same blocked-state logic.
- Super Admin analytics subscription KPIs now count suspended subscriptions using the same subscription-or-center blocked-state logic.

Verified:
- API lint and build passed.
- Web lint, `tsc --noEmit`, and production build passed.

## 2026-05-13 - Super Admin Subscription Timeline

Added subscription activity timeline/history to Super Admin subscription details.

Changed:
- Added `GET /api/v1/super-admin/subscriptions/:id/timeline` with subscription-id and center-id fallback.
- Timeline builder combines subscription creation, subscription audit rows, subscription notifications, renewal requests, and manual WhatsApp notification logs into normalized newest-first items.
- `/super-admin/subscriptions/[id]` now renders a responsive Subscription Timeline section with localized labels, tones, relative time, and exact numeric date/time.

Verified:
- API lint and build passed.
- Web lint, `tsc --noEmit`, and production build passed.

## 2026-05-13 - Super Admin Subscription Action Availability

Unified subscription overview action menu rules across lifecycle states.

Changed:
- Added shared web `getSubscriptionActionAvailability()` helper beside the normalized subscription lifecycle helper.
- `/super-admin/subscriptions` desktop and mobile action menus now use the same lifecycle/action availability table.
- Trialing subscriptions now expose Renew and Suspend consistently; expired, suspended, and cancelled subscriptions expose Renew and WhatsApp but not Suspend.

Verified:
- Web lint, `tsc --noEmit`, and production build passed.

## 2026-05-13 - Super Admin In-App Notification Center

Implemented Super Admin subscription lifecycle notification center.

Changed:
- Added notification targeting with `SUPER_ADMIN` and `CENTER_ADMIN` audiences.
- Extended subscription notification types for suspended, renewed, trial ending soon, and missing WhatsApp phone events.
- Added Super Admin read APIs: `PATCH /api/v1/super-admin/notifications/:id/read` and `PATCH /api/v1/super-admin/notifications/read-all`.
- Super Admin notifications now return unread counts, action URLs, center names, and safe payload metadata.
- Subscription list/update and renewal request flows create Super Admin-targeted lifecycle notifications.
- Super Admin shell now includes an unread notification bell with dropdown preview, view-all, mark-read, and mark-all-read behavior.
- `/super-admin/notifications` now supports all, unread, subscriptions, renewal request, and system alert filters.

Verified:
- Prisma generate and `db push` passed.
- API lint and build passed.
- Web lint, `tsc --noEmit`, and production build passed.

## 2026-05-13 - Super Admin Notification Bell Refresh Fix

Fixed Super Admin notification bell updates without requiring a browser refresh.

Changed:
- Super Admin bell unread fetch now uses a stable callback.
- Bell polling interval changed to 30 seconds.
- Bell listens for `super-admin-notifications-updated` window events.
- Read, read-all, and Super Admin subscription update actions dispatch the refresh event so the badge updates immediately after local notification-affecting actions.
- Opening the dropdown fetches the latest unread notifications immediately.

Verified:
- Web lint, `tsc --noEmit`, and production build passed.
# 2026-05-18 - Tenant Isolation and RBAC Hardening

Hardened tenant-owned mutation paths against IDOR-style access.

Changed:
- Tenant patient, service, appointment, invoice status, payment, credit usage, and manual credit writes now include `centerId` in the mutation filter.
- Tenant password change now revalidates the signed session against an active center-scoped role before updating the user password.
- Tenant renewal request lookup now avoids ID-only `findUnique` for the center lookup.

Verified:
- API lint and build passed.
- Live HTTP QA created two QA centers with separate data and confirmed cross-center patient/service/appointment/invoice URL access returns `404`, while same-center access and reports return `200`.

# 2026-05-21 - Public Branding and Appearance Settings

Added Super Admin-controlled public website appearance settings without changing the public center APIs.

Changed:
- Expanded protected `GET/PATCH /api/v1/admin/settings` to store public site name, logo/favicon/hero/footer image URLs, contact details, social URLs, and AR/EN/HE landing texts.
- Added public read-only `GET /api/v1/public/settings` for non-secret `public_*` settings.
- Added a `/super-admin/settings` section for Public Website Appearance with Branding, Contact & WhatsApp, Social Links, and Landing Texts cards.
- `/centers` now reads public settings and safely falls back to existing defaults when values are missing.
- Public social icons are hidden when their URL is empty.

Verified:
- API lint/build passed.
- Web lint, `tsc --noEmit`, and production build passed.

# 2026-05-21 - Public Appearance Uploads

Implemented real image upload for Super Admin Public Website Appearance settings.

Changed:
- Added Super Admin protected `POST /api/v1/admin/uploads/public-image`.
- Validates PNG, JPG, WebP, and SVG images up to 2MB.
- Stores public branding assets under `apps/web/public/uploads/branding/`.
- Public Appearance image controls now upload files, preview immediately, support clearing, and keep optional URL entry collapsed.
- Public Appearance layout now uses a tighter desktop 70/30 form/preview grid with a sticky preview only on desktop and a single-column tablet/mobile layout.

Verified:
- API lint and build passed.
- Web lint, `tsc --noEmit`, and production build passed.

# 2026-05-21 - Public Brand Logo Rendering

Fixed uploaded public logo rendering in the landing navbar and footer.

Changed:
- Added shared `BrandLogo` component for public branding.
- Public navbar and footer now use a fixed-height, max-width, `object-contain` logo treatment with loading skeleton and initials fallback.
- Uploaded square, wide, tall, transparent PNG, and SVG logos no longer stretch or push the brand name onto a new line.

Verified:
- Web lint, `tsc --noEmit`, and production build passed.

# 2026-05-21 - Public Appearance Save Bar UX

Improved Super Admin Public Appearance save feedback.

Changed:
- The Public Appearance section now has a grouped sticky bottom save bar with status and feedback together, plus Cancel and Save actions together.
- Image upload success now shows a small inline reminder near the uploaded image field to save changes.
- Save success clears the dirty state while preserving the uploaded preview; save errors appear in the bar and near the top of the section.

Verified:
- Web lint, `tsc --noEmit`, and production build passed.

# 2026-05-23 - Tenant Marketing Tracking Events v2

Added the second pass of public journey tracking events while keeping tenant scripts isolated from admin areas.

Changed:
- Booking page load now tracks `ViewBookingPage`.
- Service selection now tracks `SelectService`.
- Date and available time slot selection now track `SelectDateTime`.
- Booking form submission now tracks `SubmitBookingAttempt` before the public booking API call.
- Booking validation, slot-unavailable, and API failures now track `BookingFailed`.
- Patient portal load now tracks `PatientPortalView`.
- Existing `CompleteBooking` and `WhatsAppClick` tracking were preserved.
- Tenant marketing injection now has an explicit public-center route guard and comments documenting that custom scripts come only from the public-safe endpoint.
- Public marketing API/client comments document that `metaConversionApiToken` must never be exposed publicly.

Verified:
- Static searches confirmed `TenantMarketingInjector` is mounted only on `/c/[slug]`, `/c/[slug]/book`, and `/c/[slug]/patient/[token]`.
- Static searches confirmed the public marketing client/service do not select or return `metaConversionApiToken`; only tenant settings screens/services reference it.
- QA checklist added to business rules for script injection pages, Network token leakage, provider-stub events, provider failure isolation, and build/typecheck checks.

# 2026-05-23 - Tenant Marketing Tracking Injection v1

Enabled saved tenant marketing settings on center-specific public journey pages only.

Changed:
- Added public safe endpoint `GET /api/v1/public/centers/:slug/marketing-settings`.
- The public endpoint returns Meta Pixel, TikTok Pixel, Snap Pixel, GA4, GTM, and custom script settings, but never returns `metaConversionApiToken`.
- Added `TenantMarketingInjector` using `next/script` and mounted it only on `/c/[slug]`, `/c/[slug]/book`, and `/c/[slug]/patient/[token]`.
- Added `trackMarketingEvent()` helper for Meta, TikTok, GA4, and Snap.
- Wired `ViewCenter`, `StartBooking`, `CompleteBooking`, and `WhatsAppClick` events in the public center profile and booking request flow.
- No scripts are mounted on `/centers`, `/tenant/*`, or `/super-admin/*`.

Verified:
- API build passed.
- Web `tsc --noEmit` and web build passed.
- Search confirmed `metaConversionApiToken` is not referenced in the public center marketing endpoint/client/injector path.
- API/web lint remain blocked by unrelated existing lint errors.

# 2026-05-23 - Tenant Marketing Settings Module

Added the first tenant marketing settings module without enabling tracking injection.

Changed:
- Added `TenantMarketingSettings` Prisma model and migration `20260523170000_add_tenant_marketing_settings`.
- Added tenant API endpoints for loading and saving marketing settings at `/api/v1/tenant/settings/marketing`.
- Added Center Admin route `/tenant/settings/marketing` with EN/AR/HE labels for Meta Pixel, Meta Conversion API token, TikTok Pixel, Snap Pixel, GA4, GTM, custom head script, and custom body script.
- Added a Settings sub-navigation item for Marketing.
- Tenant marketing settings are center-scoped by session `centerId`, require `settings:view`, and are covered by tenant subscription write blocking.

Verified:
- Prisma format, validate, and generate passed.
- API build passed.
- Web `tsc --noEmit` and web build passed.
- API/web lint still fail on unrelated existing public profile/gallery/directory issues.

# 2026-05-23 - Tenant Favicon Uses Center Logo

Fixed tenant app favicon behavior so Center Admin pages can show the current center logo in the browser tab.

Changed:
- `CenterAdminShell` dispatches a tenant-scoped favicon update after the authenticated center session loads.
- `GlobalFavicon` now supports tenant-only favicon overrides on `/tenant/*` routes and restores the RoyalCare platform favicon when leaving tenant routes.
- Tenant favicon overrides convert the center logo client-side into a contained 512x512 PNG data URL before applying `rel="icon"`, `rel="shortcut icon"`, and `rel="apple-touch-icon"`.
- Missing or broken center logos fall back to the platform favicon.

Verified:
- Web `tsc --noEmit` and web build passed.
- Web lint still fails on unrelated existing gallery/public-directory/Super Admin detail issues.

# 2026-05-23 - Tenant Sidebar Branding Fix

Fixed Center Admin sidebar branding so tenant pages no longer depend on public/platform branding.

Changed:
- Tenant sidebar now reads `session.center.branding.logoUrl` from the authenticated center session.
- Removed the extra tenant public-profile logo fetch from `CenterAdminShell`.
- If the center logo is missing or fails to load, the sidebar falls back to center initials inside the existing compact white logo tile.
- Public platform pages, navbar logo behavior, and favicon behavior were not changed.

Verified:
- Web `tsc --noEmit` and web build passed.
- Web lint still fails on unrelated existing gallery/public-directory/Super Admin detail issues; `CenterAdminShell` no longer reports lint errors after this change.

# 2026-05-23 - PNG Favicon Upload Hardening

Fixed the remaining browser-tab favicon conflict after DOM-level favicon links were already correct.

Changed:
- Favicon uploads are now converted through Sharp to a 512x512 transparent PNG and stored as `/uploads/branding/favicon-<timestamp>-<uuid>.png`.
- Favicon uploads never produce WebP, while other public branding images keep the existing optimized image flow.
- Root metadata and the root `GlobalFavicon` append managed `rel="icon"`, `rel="shortcut icon"`, and `rel="apple-touch-icon"` links with `type="image/png"` and an `updatedAt` cache-busting query.
- Removed the conflicting `apps/web/src/app/favicon.ico` so Next/browser fallback favicon handling cannot keep preferring the old black default icon.
- Re-uploaded the current favicon through the favicon upload path and saved `/uploads/branding/favicon-1779543890593-75a0dfcb-6845-42d7-81b9-ac93a0a6747b.png` as the public favicon setting.

Verified:
- Admin and public settings return the PNG favicon URL plus `updatedAt`.
- The uploaded favicon is served as `Content-Type: image/png`.
- Browser DOM checks on `/centers`, `/c/jenin-care`, `/tenant/settings`, and `/super-admin/settings` show only the uploaded PNG favicon links, with no `/favicon.ico` link.
- Network checks requested the uploaded PNG favicon URL, and a visible Chrome screenshot confirmed the tab icon changed from the old default.
- API build, web `tsc --noEmit`, and web build passed; lint remains blocked by unrelated existing violations in public profile/gallery/directory files.

# 2026-05-23 - Global Public Favicon Fix

Fixed uploaded favicon propagation across public, tenant, and Super Admin routes.

Changed:
- Public settings now return `updatedAt` for each setting.
- Root metadata uses `public_favicon_url` plus `updatedAt` as the cache-busting query value.
- The single root `GlobalFavicon` now fetches public settings after hydration and appends `rel="icon"`, `rel="shortcut icon"`, and `rel="apple-touch-icon"` links as the last icon links in `<head>`.
- Removed the unused secondary `PublicFavicon` component to keep one favicon owner.

Verified:
- Admin and public settings both returned the uploaded favicon URL.
- Headless browser checks on `/centers`, `/c/jenin-care`, `/tenant/settings`, and `/super-admin/settings` showed the uploaded favicon links in the DOM and requested the uploaded `/uploads/branding/...webp?v=...` URL.
- API build, web `tsc --noEmit`, and web build passed.

# 2026-05-18 - Localized Business Names for Billing Audit Logs

Fixed audit business-name localization at the source instead of treating user-entered names as UI text.

Changed:
- Added nullable `Center.nameAr`, `Center.nameEn`, and `Center.nameHe` with `Center.name` as the fallback/default.
- Reused existing patient localized full-name fields `fullNameAr`, `fullNameEn`, and `fullNameHe`.
- Super Admin center create/edit forms now allow Arabic, English, and Hebrew center names.
- Tenant billing audit metadata now stores real localized patient and center name snapshots where available.
- Super Admin Audit Logs now resolves business names through a shared localized business-name helper and keeps UUID values in Technical details.
- Backfill script now refreshes old tenant billing audit rows with invoice, patient, and center business metadata from the invoice source.

Verified:
- Prisma format, validate, generate, and `db push` passed.
- API lint and build passed.
- Web lint, `tsc --noEmit`, and production build passed.

# 2026-05-18 - Tenant RBAC UI Visibility Hardening

Hardened Center Admin appointment action visibility against missing role permissions.

Changed:
- Tenant appointment list now hides Edit and lifecycle/status controls unless the session includes the matching appointment permissions.
- Tenant appointment list now hides Create Invoice unless `billing:create` exists and keeps subscription-blocked write actions disabled with the existing localized restriction tooltip.
- Tenant appointment details now separates raw permission visibility from expired/suspended subscription write blocking for edit, status, cancel, invoice creation, payment, and credit usage actions.

Verified:
- API lint and build passed.
- Web lint, `tsc --noEmit`, and production build passed.
- Live RBAC API QA seeded owner/manager/staff/reception/billing/read-only users and confirmed restricted mutation/report access returns the expected `403` while allowed access succeeds.

# 2026-05-18 - Production Backup and Recovery Hardening

Hardened critical business records against irreversible production mistakes.

Changed:
- Critical financial/clinical relations now restrict parent hard deletes instead of cascading through subscriptions, subscription invoices, patients, appointments, tenant invoices, payments, and credit transactions.
- Tenant invoice status changes now audit cancellation, restore/reopen, and status-change transitions.
- Tenant patient create/update/archive/restore status paths now write audit rows.
- Tenant appointment create/update/status/cancel/restore paths now write audit rows.
- Restoring a cancelled appointment now clears stale cancellation flags, cancellation time, and cancellation reason.
- Added `ai-memory/11_BACKUP_RECOVERY.md` with pg_dump, pg_restore, daily schedule, retention, and restore safety guidance.

Verified:
- Prisma validate/generate/db push, API lint/build, and targeted API recovery QA are required before production deploy.

# 2026-05-18 - User-Facing UI Finalization Pass Started

Started the final SaaS polish pass for Super Admin and Center Admin surfaces.

Changed:
- Added shared admin surface primitives for polished cards, loading, empty, error, and section header states.
- Improved global focus, text rendering, tap highlight, and form-control typography behavior.
- Super Admin shell now uses a proper notification bell icon, polished dropdown loading/empty states, and a centered enterprise content width.
- Center Admin shell now uses a polished loading state, stronger page header treatment, centered enterprise content width, and shared access-denied state.
- Super Admin dashboard and audit logs use shared error/loading/empty surfaces.
- Tenant dashboard stat/error surfaces use the shared admin polish layer.

Verified:
- Web lint, TypeScript check, and production build passed.

# 2026-05-28 - Smart Follow-up Treatment Plans v1

Implemented treatment follow-up planning for recurring services.

Changed:
- Added service-level follow-up settings for fixed interval and session-plan recurrence.
- Added `PatientFollowUp` schema/model, enums, and migration `20260528100000_add_patient_follow_ups`.
- Added tenant follow-up APIs for listing, analytics, status updates, and notes.
- Appointment status changes now create an idempotent follow-up when an appointment first transitions to `COMPLETED`.
- Added `/tenant/follow-ups` worklist with Today/This week/Overdue/Upcoming/Contacted/Booked/Completed filters, WhatsApp prefilled messages, status actions, notes, metrics, and appointment-create prefill.
- Patient details now show a compact follow-up timeline.
- Tenant service create/edit form now exposes Follow-up Settings with EN/AR/HE labels and RTL-safe layout.

Verified:
- Prisma format, validate, and generate passed.
- API lint and build passed.
- Web lint passed with existing warnings only, `tsc --noEmit` passed, and web build passed.

# 2026-05-28 - Follow-up Previous Treatment Context Fix

Fixed follow-up clinical context retrieval so treatment notes are useful to staff.

Changed:
- Follow-up context now loads both `Appointment.notes` and `Appointment.internalNotes`.
- The context lookup is scoped to the same center, patient, and service, and now prioritizes latest `COMPLETED`, then latest `CONFIRMED`, then latest non-cancelled appointment with notes/internal notes.
- Follow-up cards show a distinct fallback when no previous completed treatment exists.
- Internal notes now display with a visible internal-notes badge.
- Non-completed note sources now display a warning badge and localized appointment status metadata.
- Treatment timelines on follow-up cards and appointment-create context now include provider names when available.

Verified:
- API build, web `tsc --noEmit`, and web build were run for this fix.

# 2026-05-28 - Follow-up Card Medical Workflow UX

Improved appointment note terminology and follow-up card scanability for treatment staff.

Changed:
- Appointment notes are labeled as treatment notes, with helper text explaining they appear in treatment history and future follow-ups.
- Internal notes are labeled as internal staff notes, with helper text explaining they are not shown to patients or follow-up messages.
- Appointment details now shows those helper explanations alongside notes.
- Follow-up cards now use a cleaner header with patient, phone, service, session, due date, overdue/upcoming, incomplete-session, and internal-note badges.
- The follow-up clinical context section was simplified into "last treatment session" metadata plus treatment notes and internal staff notes.
- Treatment history now presents as a vertical timeline.
- The follow-up note textarea now has an explicit "add new follow-up note" label.
- WhatsApp is the primary action; appointment/status actions are secondary.
- Follow-up card v2 polish separated header hierarchy into patient, service/session, status badges, and muted due-date metadata.
- Last treatment metadata now uses compact chips, timeline entries have clearer title/status/date hierarchy, textarea height is reduced, and the WhatsApp CTA uses a stronger green treatment-workflow action style.
- Follow-up card v3 polish tightened vertical spacing, removed heavy nested note boxes, softened the timeline line/node styling, added contextual suggested-next-action hints, highlighted overdue cards with a subtle red tone, and renamed the main CTA to patient WhatsApp.
- Added a dynamic remaining-time badge to follow-up card headers. It renders future, today, and overdue states from `dueDate` with localized EN/AR/HE labels and soft blue/green/red tones.

Verified:
- Web `npx tsc --noEmit` passed.
- Web production build passed.

# 2026-05-28 - Appointment Custom One-Time Services

Added custom service support to tenant appointment create/edit.

Changed:
- Appointment schema now stores nullable custom service name/price and a saved-as-service flag.
- Tenant appointment create/edit validates either a catalog service or a custom service name, keeps custom appointments editable, and can optionally create a saved `Service` record for future use.
- Appointment list/details show a localized custom-service badge.
- Tenant invoice schema/service now supports custom appointment invoices without forcing a catalog service row.
- Tenant dashboard, patient portal invoices, billing details, billing list, and financial reports safely display/group custom service revenue by the custom service name.
- Added migration `20260528130000_add_appointment_custom_service`.

Verified:
- Prisma format, validate, and generate passed.
- API lint and build passed.
- Web lint passed with existing warnings only, web `tsc --noEmit` passed, and web build passed.
# 2026-06-07 - Public Before/After Results UX

- Replaced the public before/after result card slider UI with a clearer side-by-side comparison layout.
- Each result now shows separate "Before" and "After" images with clear top badges, matching aspect ratio, rounded image frames, and `object-cover` cropping.
- The confusing bottom range slider was removed. Mobile stacks the images vertically; larger screens show them side by side.
- Before/after images now open a simple lightbox preview on click, with dark backdrop, centered full-size image, label/title, close button, backdrop close, and ESC close.
- Web build passed.

# 2026-06-06 - Multi-Branch Public Profile Support

- Added `CenterBranch` Prisma model and migration `20260606120000_add_center_branches` for multiple center locations/contact rows.
- Added Super Admin and tenant public-profile branch CRUD/reorder endpoints.
- Public center profile API now returns active branches sorted by main branch first and then sort order.
- Super Admin center details and tenant public profile settings now include a "Branches and Addresses" management section with branch cards, multilingual city/address/hours fields, phone, WhatsApp, maps URL, main/active flags, and ordering controls.
- Public center pages now show a "Branches & Contact" / "الفروع والتواصل" section when branches exist and fall back to legacy single address/contact fields for older centers.
- Local verification: `prisma db push`, API build, web build passed. Runtime API QA added two active branches to `laser-care`; `GET /api/v1/public/centers/laser-care` returned both branches with independent WhatsApp/maps/hours data.
## 2026-06-07 - Tenant/Public Navigation Performance

- Added short-lived in-memory caching for tenant `/permissions/me` session hydration, including promise dedupe and cache clearing on login/logout/failure.
- Added short-lived public settings and public center resource caches to avoid refetching unchanged branding/profile sections during fast SPA navigation.
- Added explicit tenant nav route prefetch on sidebar/profile links and a dashboard-shell skeleton while session hydration is pending.
- Added async/lazy image hints to public center gallery, before/after, offers, team, and directory imagery without changing the existing upload/storage flow.
- Verified `apps/web` production build passes and production server responds on port 3002.
## 2026-06-07 - Staff Provider Visibility Fix

- Added `UserRole.providerEnabled` so appointment provider visibility is controlled explicitly per staff assignment instead of being inferred from role.
- Tenant staff create/edit now includes a localized "Show as appointment provider" checkbox in EN/AR/HE.
- Tenant appointment options, appointment save validation, schedule providers, and public booking providers now require active staff with `providerEnabled=true`; active `CENTER_OWNER` assignments default to provider-enabled.
- Local DB was synced and existing active `CENTER_OWNER`, `CENTER_MANAGER`, `DOCTOR`, and `STAFF` assignments plus active owner assignments were backfilled as providers.
- Verified Rawan was active `CENTER_OWNER`; enabled `providerEnabled=true` for her local development row and confirmed she now satisfies the provider list condition.
- API and web builds passed.

## 2026-06-08 - Center Owner Provider Dropdown Fix

- Center owner assignments are provider-enabled by default during center creation and when a staff assignment is changed to `CENTER_OWNER`.
- Existing active owner assignments were backfilled to `providerEnabled=true` in the development database and in the migration.
- Appointment provider options, schedule provider lists, and public provider lists now de-duplicate staff users with multiple center roles so the owner appears once with the stored `fullName`.
- Staff form label was clarified in Arabic/English/Hebrew as a provider capability, separate from administrative role.
- Verification: API and web production builds passed.

## 2026-06-08 - Runtime Owner Provider Inclusion Fix

- Confirmed `/tenant/appointments/new` loads providers from `GET /api/v1/tenant/appointments/options`.
- Fixed that exact endpoint to fetch `Center.ownerUserId` and include active staff assignments when `providerEnabled=true OR userId=center.ownerUserId`.
- Appointment create/update provider validation now uses the same owner-aware condition, preventing the owner from appearing in the dropdown but failing on save.
- Tenant schedule provider validation/listing uses the same owner-aware condition so selecting the owner can load availability and schedule settings.
- Removed temporary availability runtime logging. API and web production builds passed.

## 2026-06-07 - Shared Before/After Pair UI

- Added a shared `BeforeAfterPair` component for side-by-side before/after images with badges, missing-image placeholders, responsive stacking, and optional lightbox preview.
- Updated the public before/after cards to use the shared component while preserving the public page lightbox behavior.
- Updated tenant admin `/tenant/settings/before-after` cards and form preview to remove the old slider/range preview and use the same side-by-side comparison layout.
- Added a quick publish/hide action to admin result cards while preserving edit/delete/category/status behavior.
- Verified `apps/web` production build passes.
# 2026-06-08 - Follow-up Early Treatment Plan Closure

Added early closure support for finite follow-up treatment plans.

- Added `PatientFollowUpStatus.CLOSED_EARLY`, `PatientFollowUpPlanStatus`, and closure metadata fields on `PatientFollowUp`.
- Added migration `20260608120000_add_follow_up_early_closure`.
- Added tenant endpoint `PATCH /api/v1/tenant/follow-ups/:followUpId/close-early`.
- Backend closes only future unbooked actionable sessions and preserves completed/booked/linked appointment history.
- Follow-up list/analytics date filters exclude closed-early sessions from today, upcoming, overdue, and reminder queues.
- `/tenant/follow-ups` now shows an early-close confirmation modal, localized reason choices, closed-plan summary details, and read-only closed future sessions without booking or WhatsApp reminder actions.
- API build and web build passed.
# 2026-06-08

- Fixed linked follow-up plan schedules when editing appointment dates. Appointment updates can now explicitly request follow-up schedule recalculation; the backend updates only the edited linked session and unbooked actionable future sessions from the saved plan snapshot, while preserving completed/booked/cancelled history. The appointment edit UI shows an RTL-safe warning and asks for confirmation before recalculating.
## 2026-06-20 - Appointment Details Follow-up Relation Consistency

- Unified appointment cards and appointment details on persisted `PatientFollowUp` relations.
- Added canonical `followUpPlanId` and linked `followUpPlan[]` data to the tenant appointment details response.
- Removed the details page's separate patient/service follow-up lookup, which could incorrectly show that no plan existed.
- Appointment create/status/cancel responses now reload relations after follow-up mutations to avoid stale plan detection.
- Corrected recurring-plan detection for rows that belong to the same patient/service recurrence but are not directly linked to the current appointment.
- Appointment list/details now return the same `followUpPlanSummary`; recurring appointment cards again show the existing-plan badge, and details render the matching recurring rows.
- Runtime verification for appointment `1ed5f4cb-d6dc-447a-936c-5375daf0666e` corrected pre-completion recurring-plan display: list/details now return `hasFollowUpPlan=true` and a 3-month recurring summary even though no reminder row exists yet.
## 2026-06-20 - Dedicated Recurring Follow-ups Workflow

- Added separate EN/AR/HE recurring and session-plan tabs to `/tenant/follow-ups`.
- Added recurring-specific filters, KPI counters, operational cards, branch/appointment/recurrence context, and WhatsApp/contact/book/skip/pause actions.
- Added recurring reminder/contact audit metadata and lifecycle states with migration `20260620120000_add_recurring_follow_up_workflow`.
- Booking a recurring reminder now preserves the booked cycle and schedules the next cycle from the appointment date.
- API and web production builds passed; focused QA verified reminder, contact, skip, next-cycle creation, pause, and booking lifecycle behavior.

## 2026-06-20 - Completed Appointment Recurring Generation

- Hardened recurring creation so disabled services cannot generate lifecycle rows and new rows explicitly start with `planStatus=ACTIVE`.
- Added an idempotent completed-appointment backfill when the recurring queue is loaded and restricted that queue to ACTIVE recurring lifecycles.
- Focused runtime QA verified `2026-03-12 + 3 months = 2026-06-12`, status `DUE`, plan status `ACTIVE`, and inclusion in the overdue recurring response; temporary QA data was removed.
- Exact branch runtime diagnosis found appointment `3d2ff4b6-65d2-4389-941e-a37447742e7e` stored with an inverted source date and a September reminder. A targeted dry-run/apply repair moved its existing recurring row to `nextDueDate=2026-06-12`, `DUE`, `ACTIVE`.
- Standardized recurring API/UI display and filtering on `nextDueDate`, made recurring analytics branch-aware, and added `scripts/repair-recurring-follow-ups.ts` for controlled branch/appointment dry-run repairs.
- Authenticated localhost QA for branch `9ad69bba-8e6a-48c0-9e10-91ffff7d0df6` returned THIS_WEEK `0`, OVERDUE `1`, and `recurringOverdue=1`; API/web builds passed and both local servers were restarted.
- Corrected recurring due-window boundaries with one shared `nextDueDate` classifier for list filters and counters. Runtime QA for `2026-03-22 + 3 months` on `2026-06-20` returned days-until-due `2`, THIS_WEEK list `1`, `recurringThisWeek=1`, and OVERDUE `0` on the exact branch.
# 2026-06-22 - Laser Care Development Test Data Reset

- Added `scripts/reset-laser-care-test-data.ts`, a development-only Prisma transaction reset guarded by the exact Laser Care center UUID, slug, and name plus local `royalcare_dev`, non-production, `CONFIRM_RESET`, and `--apply` checks.
- Removed Laser Care appointments, patients, booking requests, invoices, payments/credits, follow-ups, sessions, portal tokens, related notifications/logs, booking tracking logs, and operational audit logs while preserving services/templates, branches, staff/accounts, roles/permissions, subscriptions, branding, SEO, translations, and center settings.
- Applied the reset to center `17c0114c-0c7a-4a72-9944-a01263d6cecf`; all targeted remaining counts verified as zero in the transaction.
- Script typecheck, API build, and web production build passed.
