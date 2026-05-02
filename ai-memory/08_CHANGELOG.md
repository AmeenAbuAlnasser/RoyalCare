# RoyalCare - Changelog

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
