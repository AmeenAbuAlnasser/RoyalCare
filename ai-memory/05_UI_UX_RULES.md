# RoyalCare - UI/UX Rules

Last updated: 2026-04-27
Status: Permanent responsive and shared Super Admin layout rules defined

## 1. Product UI Philosophy

RoyalCare is an operational SaaS platform, not a decorative landing-page project.

The UI should be:
- Simple
- Practical
- Fast to scan
- Professional
- RTL-friendly
- Mobile-ready
- Easy for non-technical center owners and staff
- Fully translatable across Arabic, Hebrew, and English
- Acceptable for a paid enterprise SaaS platform

Avoid:
- Complex unnecessary UI
- Decorative dashboards with little operational value
- Overly animated admin screens
- Large marketing-style hero sections inside admin areas
- Confusing workflows
- Desktop layouts merely squeezed into mobile widths
- Random colors, weak contrast, tiny low-priority typography, and unpolished hover/active states

Permanent professional ERP completion rule:
- No RoyalCare page is considered complete unless it passes professional ERP UI standards.
- Responsive means intentional redesign, not shrinking.
- Desktop, tablet, and mobile must each be treated as first-class layouts.
- Mobile layouts must be redesigned intentionally:
  - Tables become cards or optimized table layouts.
  - Action buttons become dropdowns, action menus, or bottom sheets.
  - Sidebars become drawers.
  - Filters become collapsible or stacked sections when needed.
  - Stats become stacked cards.
- Buttons must have consistent size, clear hierarchy, strong visual priority, and no ugly stacked clusters.
- Spacing must be balanced with no compressed UI and no oversized empty areas.
- Colors must follow RoyalCare branding, use strong contrast, avoid random colors, and preserve a premium SaaS feel.
- Typography must have bold hierarchy, readable sizes, and no weak tiny text.
- Hover and active states must be professional, visible, and useful.
- Navigation must feel premium and enterprise-grade.
- Final quality gate: would this UI be acceptable for a paid enterprise SaaS platform? If not, redesign is required.

## 2. Main Interfaces

### 2.1 Super Admin

Audience:
- RoyalCare internal team

Primary goals:
- Manage centers
- Manage subscriptions
- Manage domains
- Manage modules
- Monitor platform health
- Support center accounts

Design style:
- Dense but clear
- Data-table focused
- Strong filters/search
- Clear status badges
- Audit-friendly actions

### 2.2 Center Owner Admin Panel

Audience:
- Center owners, managers, receptionists, staff

Primary goals:
- Manage appointments
- Manage customers
- Manage services and staff
- Edit website content
- Manage branding
- View operational dashboard

Design style:
- Simple sidebar navigation
- Clear top bar
- Mobile-friendly layouts
- Forms split into understandable sections
- Helpful empty states
- No unnecessary complexity

### 2.3 Customer Portal

Audience:
- End customers

Primary goals:
- Login
- View appointments
- Book/request appointments
- View profile
- Receive notifications

Design style:
- Very simple
- Center-branded
- Mobile-first
- Minimal navigation

### 2.4 Public Center Websites

Audience:
- Potential and existing customers of a center

Primary goals:
- Present services
- Show center brand
- Allow contact or booking request
- Support multiple languages

Design style:
- Template-based
- Industry-appropriate
- Center-branded
- Responsive
- Fast loading

## 3. Layout Rules

Admin layout:
- Sidebar navigation on desktop.
- Collapsible or drawer navigation on mobile.
- Top bar for current center, language, user menu, and important actions.
- Main content should use a constrained readable width where appropriate.
- Tables should support search, filtering, pagination, and clear empty states.
- Every new RoyalCare page must be fully responsive by default for desktop, tablet, and mobile.
- New pages must not create unwanted horizontal page scrolling.
- Tables may use horizontal scrolling only inside their own table container.
- Page wrappers, grids, flex children, cards, filters, badges, and long text containers must use `max-width: 100%` and `min-width: 0` where needed.

Mobile:
- Forms should be easy to use on small screens.
- Avoid horizontal scrolling except for complex tables when unavoidable.
- Important actions should remain reachable without crowding the page.
- Content must stack cleanly.
- Primary action buttons must remain usable and tappable.
- Sidebar navigation must become a drawer or menu-button experience.
- Super Admin dashboard overview cards must use 4 columns on desktop, 2 columns on tablet, and 1 column on mobile.
- Super Admin dashboard tables must be contained inside responsive wrappers and use horizontal scrolling only when the table cannot reasonably collapse.
- Header controls must wrap cleanly on mobile; language switching and user profile controls must never overlap the page title.
- Mobile/tablet admin navigation should use a drawer triggered from the header, not a crowded horizontal navigation strip.
- Dashboard grid and flex children must use `min-width: 0` where nested tables, badges, long translated labels, or domain strings may otherwise force page-level horizontal overflow.
- Centers Management grid and flex children must also use `min-width: 0`; the large centers table may scroll only inside its table wrapper.
- Mobile table row actions must not appear as messy stacked button clusters.
- On mobile, repeated row actions should collapse into one compact `Actions` trigger that opens a structured menu or bottom sheet.
- In mobile action menus, destructive actions such as Delete must appear last and use the shared danger style.
- Secondary operational actions such as Renew Subscription and Suspend must not dominate the mobile row layout.
- Global `overflow-x: hidden` may exist only as a final safety net; component-level overflow issues must be fixed at the source first.

Super Admin shared layout:
- All Super Admin pages must use the reusable `SuperAdminLayout` component.
- Do not create custom page-specific Super Admin navbars, sidebars, headers, language switchers, or profile header controls.
- `SuperAdminLayout` owns the RoyalCare sidebar/nav design, top header, language switcher, profile area, mobile drawer, and RTL/LTR shell behavior.
- Page components should render only their page-specific content inside the shared layout.
- Arabic and Hebrew must use RTL with sidebar/drawer on the right.
- English must use LTR with sidebar/drawer on the left.
- Desktop uses the persistent sidebar.
- Mobile and tablet use the drawer/menu button.
- Sidebar hover states must not use harsh white blocks or washed-out text.
- Sidebar hover should keep text clearly visible and use subtle navy/gold styling.
- Sidebar active state must be stronger than hover, with a clear gold logical start-border indicator and semibold text.
- Any future search/input controls inside the sidebar must use navy-compatible surfaces and borders, not harsh plain-white boxes.

Button rules:
- All Super Admin buttons and button-like links must use the shared button style utility at `apps/web/src/components/ui/button-styles.ts`.
- Primary action links should use `primaryButtonClassName` from the shared button style utility.
- Primary buttons use Royal Navy `#0B2D5C`, white text, semibold weight, and a clear darker navy hover state.
- Secondary buttons use white/light surfaces, Royal Navy text, and a clear neutral border with subtle gold hover.
- Danger buttons use strong red background with white text.
- Warning buttons use Luxury Gold with Royal Navy text.
- Success buttons use a strong green background with white text.
- Buttons must have readable contrast, consistent vertical alignment, clear focus rings, and enough padding for mobile use.
- Do not create low-contrast dark-on-dark or faded button text.
- Global anchor styles must stay inside Tailwind's `@layer base` so utility classes such as `text-white` can override them on link-like buttons.

Super Admin row action menu rules:
- Repeated table/card row actions must use the shared `SuperAdminActionMenu` component at `apps/web/src/features/super-admin/components/SuperAdminActionMenu.tsx`.
- Use a compact vertical-dot trigger for row actions; do not use large `Actions` buttons or stacked button groups inside tables/cards.
- Desktop and tablet-wide layouts (`md` and above) use an elegant compact dropdown menu.
- Mobile layouts below `md` must use a fixed bottom sheet / slide-up action panel, not a side dropdown.
- Mobile action sheets must be full screen-safe, respect safe-area bottom padding, and avoid viewport/table/card clipping.
- Action menu items must include icons, consistent width, professional spacing, a visible hover state, and a proper elevated shadow.
- Destructive actions such as Delete or Cancel must appear last and use the red danger tone.
- On mobile, destructive actions must be visually separated from non-destructive actions.
- Secondary row actions must not visually compete with primary page actions.
- The same premium action menu pattern applies across Super Admin Users, Centers, Subscriptions, Domains, Plans, and future data-management pages.
- No Super Admin mobile row action menu may open outside screen bounds or be cut off by an overflow container.

Toggle rules:
- Boolean form fields must use the shared `ToggleSwitch` component at `apps/web/src/components/ui/ToggleSwitch.tsx`.
- Do not use browser-default blue checkboxes for primary boolean controls such as Auto Renewal, notifications, or two-factor authentication.
- Toggle ON state uses RoyalCare navy with a gold thumb/accent.
- Toggle OFF state uses neutral gray.
- Toggle labels and ON/OFF status text must be translated through the active dictionary.
- The switch and its label must both be clickable.
- Toggles must stay compact, readable, and aligned with nearby form fields on desktop, tablet, and mobile.

Functional QA completion rules:
- A RoyalCare UI feature is not complete after visual checks only; it must pass functional UI testing.
- Dynamic pages using `[id]` must be tested with at least 3 different ids.
- Example dynamic-route tests:
  - `/super-admin/centers/1`
  - `/super-admin/centers/2`
  - `/super-admin/centers/3`
- Each tested id must show correct matching data, not the same fallback object.
- List-to-details flows must be tested by clicking `View` from the list; each row must navigate to the matching details route.
- Edit buttons must be wired to the correct item and must not always open/edit the first record.
- Details pages with route ids must not use one hardcoded mock object for all ids.
- Unknown ids must show a proper not-found or empty state instead of misleading data.
- Arabic, Hebrew, and English must be tested after navigation to confirm language persistence and correct RTL/LTR behavior.
- Desktop, tablet, and mobile widths must be tested before completion.
- A feature can be considered complete only when:
  - The route works.
  - Correct data appears.
  - Language persists after navigation.
  - No hydration errors appear.
  - No unwanted horizontal page overflow appears.
  - Buttons have readable contrast and correct shared styling.

## 4. RTL and Language Rules

Supported languages:
- Arabic: RTL
- Hebrew: RTL
- English: LTR

Rules:
- Layout direction must switch per selected language.
- Icons that imply direction must mirror correctly in RTL.
- Form alignment must respect direction.
- Navigation order should feel natural in RTL.
- Do not hardcode left/right when logical CSS properties can be used.
- No user-facing UI text should be hardcoded in components.
- Navigation labels, buttons, table headers, filters, forms, validation messages, statuses, empty states, and errors must come from translation dictionaries.
- Language switching must be available from user profile/settings in Super Admin, Center Admin, and Customer Portal.
- Public websites should show a language switcher when the center has more than one enabled language.
- The active locale must update the document `lang` attribute.
- The active locale must update the document `dir` attribute.
- Super Admin language state must come from the shared `LanguageProvider`.
- Super Admin pages must not keep separate page-level language state.
- The selected Super Admin language must persist across Dashboard, Centers, Add New Center, Login, and future Super Admin pages.
- Current UI persistence uses the server-readable `royalcare_locale` cookie as the first-render locale source.
- `localStorage` key `royalcare.locale` may be used only as a client-side mirror, not as the initial render source.
- The Next.js root layout must apply the saved locale to `<html lang>` and `<html dir>` before Super Admin UI renders.
- Super Admin pages must not flash English or LTR layout while Arabic or Hebrew is the saved language.
- Super Admin Login must also read global language state and must not remain static English when another locale is selected.
- Arabic and Hebrew layouts must be reviewed as first-class layouts, not as afterthoughts.
- Admin screens must remain simple in RTL; avoid decorative layouts that break when mirrored.

Recommended CSS:
- Use `margin-inline`, `padding-inline`, `inset-inline`, `border-inline`.
- Use `start` and `end` naming in components where possible.
- Use `text-align: start` instead of fixed left/right alignment.
- Prefer logical border radius/placement utilities when available.
- Avoid absolute positioning tied to physical left/right unless RTL handling is explicit.

Translation file rules:
- Use locale folders for `ar`, `he`, and `en`.
- Use namespaces by product area:
  - `common`
  - `auth`
  - `super-admin`
  - `center-admin`
  - `portal`
  - `public-site`
  - `validation`
  - `errors`
- Keep keys stable and descriptive.
- Avoid building sentences through string concatenation; use complete translated phrases.
- Do not store translated UI copy inside component files.

Language preference rules:
- Authenticated users select language in profile/settings.
- Until authentication/user settings are connected, Super Admin language selection is persisted in the `royalcare_locale` cookie and mirrored to browser `localStorage`.
- Any future locale provider or i18n library must preserve first-render locale resolution from a server-readable source to prevent language and direction flicker.
- Center public websites use the center default language unless a user selects another enabled language.
- Customer portal uses customer preference first, then center default language.
- English is the platform fallback when no better preference exists.

Deterministic formatting rules:
- Do not call `toLocaleString()`, `Intl.NumberFormat`, or `Intl.DateTimeFormat` directly inside UI rendering for hydration-sensitive text.
- Number, percent, currency, compact currency, and date display must go through shared RoyalCare formatting utilities.
- Formatting must be controlled by the selected app language, not browser or operating-system locale.
- Server-rendered and client-rendered text must match exactly to avoid React hydration warnings.
- Current shared formatter: `apps/web/src/i18n/formatters.ts`.
- Required compact money examples:
  - English: `US$ 42.8K`
  - Arabic: `42.8 ألف US$`
  - Hebrew: `‎US$ 42.8K`

## 5. Navigation Rules

Super Admin navigation:
- Dashboard
- Centers
- Subscriptions
- Domains
- Templates
- Modules
- Users/Roles
- Audit Log
- Backups
- Settings

Center Admin navigation:
- Dashboard
- Appointments
- Customers
- Sessions
- Services
- Staff
- Website Pages
- Branding
- Notifications
- Users/Roles
- Settings

Rules:
- Hide navigation items for disabled modules.
- Hide or disable actions based on permissions.
- Avoid showing features that the center cannot use.

## 6. Dashboard Rules

Dashboards should show useful operational data only.

Center dashboard may include:
- Today's appointments
- Upcoming appointments
- New customers
- Recent activity
- Pending appointment requests
- Subscription status notice, if needed

Super Admin dashboard may include:
- Active centers
- Trial centers
- Past-due centers
- Domain issues
- Recent subscriptions
- System health indicators

Needs Confirmation:
- Exact KPIs required for MVP.

## 7. Forms Rules

Forms should:
- Use clear labels
- Validate inline
- Show required fields clearly
- Avoid long overwhelming screens
- Group related fields
- Preserve entered data on validation errors
- Use confirmation dialogs for destructive actions
- Use translated labels, helper text, validation messages, and action labels

For multilingual content:
- Use tabs or segmented controls for language fields.
- Show missing translations clearly.
- Use Arabic, Hebrew, and English labels consistently.
- Keep translation-entry forms compact and practical for admin users.

## 8. Tables Rules

Tables should support:
- Search
- Filters
- Sort where useful
- Pagination
- Row actions
- Status badges
- Empty states

Use tables for:
- Centers
- Customers
- Appointments
- Services
- Staff
- Users
- Domains
- Audit logs

## 9. Status Display Rules

Use clear labels for statuses:
- Active
- Trial
- Suspended
- Cancelled
- Pending
- Verified
- Failed
- Confirmed
- Completed
- No-show

Status colors should be consistent:
- Success: active, verified, completed
- Warning: trial, pending, past due
- Danger: suspended, failed, cancelled
- Neutral: draft, inactive

Status text:
- Status labels must be translated.
- Status enum values should not be shown directly to users.

Needs Confirmation:
- Final design system color palette.

## 10. Branding Rules

Official RoyalCare platform brand:
- Logo: uploaded RoyalCare logo asset.
- Primary color: Royal Navy Blue `#0B2D5C`.
- Secondary color: Luxury Gold `#C8A45D`.
- Background: Soft White `#F8FAFC`.
- Neutral Gray: `#E5E7EB`.

Center branding:
- Public website should strongly reflect center branding.
- Customer portal should reflect center branding.
- Center admin can show center logo and small brand accents.
- Admin usability must remain more important than full visual customization.

Super Admin:
- Uses RoyalCare branding only.
- Super Admin login uses official RoyalCare logo, Royal Navy, Luxury Gold, Soft White, and Neutral Gray.
- Super Admin dashboard uses the same official RoyalCare branding system.
- Sidebar color is Royal Navy Blue.
- Primary buttons use Royal Navy Blue.
- Gold is used as a premium accent, not as a dominant background.
- Cards use white surfaces with Neutral Gray borders.
- Language switcher and user profile controls use white/Soft White surfaces with Neutral Gray borders.
- Status badges may use semantic colors, but trial/pending/accent states should use Luxury Gold where appropriate.
- Login screens should feel secure, practical, and admin-focused, not promotional.
- Avoid heavy animation on authentication screens.
- Keep forms compact, readable, and mobile-friendly.

Needs Confirmation:
- Whether each center admin panel should fully inherit center colors.

## 15. Implemented UI Screens

### 15.1 Super Admin Login

Route:
- `/super-admin/login`

File:
- `apps/web/src/app/(super-admin)/super-admin/login/page.tsx`

Status:
- UI-only screen implemented.
- Backend authentication is not connected yet.

Includes:
- RoyalCare logo/monogram area
- Email field
- Password field
- Remember me checkbox
- Forgot password link
- Login button
- Admin access note

Design direction:
- Official RoyalCare palette.
- Minimal professional admin feel.
- Responsive desktop/mobile layout.
- RTL-friendly structure using neutral spacing and simple form flow.

### 15.2 Super Admin Dashboard

Route:
- `/super-admin/dashboard`

Files:
- `apps/web/src/app/(super-admin)/super-admin/dashboard/page.tsx`
- `apps/web/src/features/super-admin/dashboard/SuperAdminDashboard.tsx`
- `apps/web/src/features/super-admin/dashboard/dashboard-data.ts`
- `apps/web/src/features/super-admin/layout/SuperAdminLayout.tsx`
- `apps/web/src/i18n/dictionaries/super-admin-dashboard.ts`
- `apps/web/src/i18n/locales.ts`

Status:
- UI-only screen implemented.
- Backend data is not connected yet.
- Language switching works locally for English, Arabic, and Hebrew.
- RTL layout mirroring works for Arabic and Hebrew.
- Responsive behavior has been improved for desktop, tablet, and mobile widths.
- Uses the shared `SuperAdminLayout`.

Includes:
- Sidebar navigation
- Mobile/tablet navigation drawer
- Top header
- Dashboard overview cards
- Quick stats section
- Recent centers section
- Subscription overview section
- Domain management preview
- Notifications preview
- Language selector placeholder

Design direction:
- Practical ERP/admin dashboard style.
- Official RoyalCare palette.
- Responsive desktop/tablet/mobile layout.
- Sidebar on desktop and collapsible drawer navigation on mobile/tablet.
- Mobile/tablet drawer opens from the right for Arabic and Hebrew, and from the left for English.
- Dashboard cards use 4 columns on desktop, 2 columns on tablet, and 1 column on mobile.
- Tables are contained with horizontal scrolling where needed.
- Header title, language selector, and user profile wrap cleanly on narrow screens.
- Page-level horizontal overflow has been corrected by constraining grid/flex children and keeping table overflow inside the table wrapper.
- RTL-ready through locale direction configuration.
- UI labels are prepared through translation dictionaries for English, Arabic, and Hebrew.
- Numbers and money are formatted through deterministic RoyalCare formatting utilities using the active app locale.
- English uses LTR layout.
- Arabic and Hebrew use RTL layout with the desktop sidebar on the right.
- Dashboard mock data uses translation keys so the visible UI does not mix languages, except neutral domain strings.

Sidebar items:
- Dashboard
- Centers
- Subscriptions
- Domains
- Plans
- Users
- Notifications
- Settings

### 15.3 Super Admin Centers Management

Route:
- `/super-admin/centers`

Files:
- `apps/web/src/app/(super-admin)/super-admin/centers/page.tsx`
- `apps/web/src/features/super-admin/centers/SuperAdminCentersPage.tsx`
- `apps/web/src/features/super-admin/centers/centers-data.ts`
- `apps/web/src/features/super-admin/layout/SuperAdminLayout.tsx`
- `apps/web/src/i18n/dictionaries/super-admin-centers.ts`

Status:
- UI-only screen implemented.
- Backend data is not connected yet.
- Uses the shared `SuperAdminLayout`.

Includes:
- Page title
- Add New Center button
- Search bar
- Status filters: Active, Trial, Expired, Suspended
- Quick stats cards
- Responsive table
- Actions: View, Edit, Suspend, Renew Subscription, Delete

Design direction:
- Official RoyalCare palette.
- Simple ERP-style management table.
- Responsive horizontal table on small screens.
- Desktop uses the RoyalCare navy sidebar with clearer gold-accent active navigation.
- Mobile/tablet uses a direction-aware drawer instead of horizontal navigation.
- Cards are 1 column on mobile, 2 columns on tablet, and 4 columns on desktop.
- Search and filters stack/wrap cleanly on small screens.
- Table overflow is contained inside the table wrapper, not the page.
- Mobile row actions use a single compact `Actions` button that expands into a structured action menu.
- Full English, Arabic, and Hebrew dictionary support.
- Arabic and Hebrew use RTL and mirrored sidebar.

### 15.4 Super Admin Add New Center Wizard

Route:
- `/super-admin/centers/new`

Files:
- `apps/web/src/app/(super-admin)/super-admin/centers/new/page.tsx`
- `apps/web/src/features/super-admin/centers/new/SuperAdminCenterWizard.tsx`
- `apps/web/src/i18n/dictionaries/super-admin-center-wizard.ts`
- `apps/web/src/features/super-admin/layout/SuperAdminLayout.tsx`

Status:
- UI-only wizard implemented.
- Backend center creation is not connected yet.
- Uses the shared `SuperAdminLayout`.

Includes:
- Center Basic Info
- Subscription Plan
- Domain Setup
- Branding + Languages
- Center Admin Account
- Review + Confirm

Design direction:
- Simple ERP-style setup wizard.
- RoyalCare navy/gold branding.
- Fully responsive desktop/tablet/mobile layout.
- Step navigation stacks cleanly on mobile and tablet.
- Forms use 1 column on mobile and 2 columns where appropriate on larger screens.
- Arabic and Hebrew use RTL through the shared layout.
- English uses LTR through the shared layout.
- No page-level horizontal scrolling; form sections and cards use `min-width: 0` and `max-width: 100%`.
- All visible labels come from English, Arabic, and Hebrew dictionaries.
- Wizard date fields must use the reusable `DateField` component at `apps/web/src/components/forms/DateField.tsx`.
- Do not use native `input type="date"` for visible wizard date fields because browser/OS locale can override the app language display.
- `DateField` stores values internally as `YYYY-MM-DD`.
- `DateField` controls display formatting from the selected app language: English uses `YYYY-MM-DD`; Arabic and Hebrew use RTL-friendly day/month/year display.
- Date field labels, helper text, and day/month/year picker labels must be dictionary-driven and must match the selected language.
- Logo upload is UI-functional: image file picker opens, accepts image files, and shows selected file name or preview locally without backend upload.
- Step 4 Branding + Languages keeps UI state for center logo preview, primary color, secondary color, default language, and enabled languages.
- Step 4 enabled language checkboxes must be ordered Arabic, Hebrew, English and remain controlled by wizard state.
- Step 4 color pickers must show the selected hex value beside the swatch and update immediately.
- Step 4 review output must reflect the selected branding and language values.
- Wizard helper text and upload text must change with the active language; do not mix languages on the same screen.
- Add New Center wizard includes a top-header `Back to Centers` secondary action linking to `/super-admin/centers`.
- Auto Renewal and other wizard boolean controls use the shared compact `ToggleSwitch` component instead of large checkbox cards or browser-default checkbox styling.

## 11. Page Builder Rules

Page builder should be practical.

Recommended MVP:
- Edit template sections
- Reorder blocks
- Publish/unpublish page
- Multi-language content
- SEO title/description

Avoid at first:
- Fully freeform drag-and-drop builder
- Complex animation controls
- Pixel-level design controls

Needs Confirmation:
- Required block types.
- Whether centers can create new pages or only edit predefined pages.

## 12. Accessibility Rules

Baseline requirements:
- Keyboard accessible controls
- Visible focus states
- Sufficient color contrast
- Labels for inputs
- Accessible dialogs
- Semantic buttons and links

## 13. Empty State Rules

Empty states should tell the user what is missing and provide a clear action.

Examples:
- No customers yet: show "Add customer"
- No appointments today: show calm empty message
- No services: show "Create service"

Avoid long educational text inside operational screens.

## 14. Design System Direction

Recommended component set:
- App shell
- Sidebar
- Top bar
- Data table
- Filter bar
- Form sections
- Modal
- Drawer
- Tabs
- Badge
- Toast
- Date/time picker
- Language switcher
- Center switcher for Super Admin support

Needs Confirmation:
- UI library: custom components, shadcn/ui, MUI, Ant Design, etc.
- Icon library.
