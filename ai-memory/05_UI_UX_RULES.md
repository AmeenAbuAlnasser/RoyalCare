# RoyalCare - UI/UX Rules

Last updated: 2026-04-26
Status: Initial UI/UX direction

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

Avoid:
- Complex unnecessary UI
- Decorative dashboards with little operational value
- Overly animated admin screens
- Large marketing-style hero sections inside admin areas
- Confusing workflows

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

Mobile:
- Forms should be easy to use on small screens.
- Avoid horizontal scrolling except for complex tables when unavoidable.
- Important actions should remain reachable without crowding the page.

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

Recommended CSS:
- Use `margin-inline`, `padding-inline`, `inset-inline`, `border-inline`.
- Use `start` and `end` naming in components where possible.

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

For multilingual content:
- Use tabs or segmented controls for language fields.
- Show missing translations clearly.

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

Needs Confirmation:
- Final design system color palette.

## 10. Branding Rules

Center branding:
- Public website should strongly reflect center branding.
- Customer portal should reflect center branding.
- Center admin can show center logo and small brand accents.
- Admin usability must remain more important than full visual customization.

Super Admin:
- Uses RoyalCare branding only.

Needs Confirmation:
- RoyalCare logo and brand colors.
- Whether each center admin panel should fully inherit center colors.

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
