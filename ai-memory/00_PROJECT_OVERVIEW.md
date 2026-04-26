# RoyalCare - Project Overview

Last updated: 2026-04-26
Status: Initial official project initialization

## 1. Project Identity

RoyalCare is a multi-tenant SaaS platform for service-based health, beauty, and wellness centers.

Target center types:
- Laser centers
- Physiotherapy clinics
- Hijama centers
- Beauty clinics
- Wellness centers

RoyalCare is the parent platform. It sells and manages complete digital packages for multiple centers. Each subscribed center receives its own public website, admin panel, customers, appointments, branding, modules, and domain setup.

## 2. Core Product Idea

RoyalCare provides "website + admin system as a service" for centers.

Each center should be able to operate as if it has its own independent platform, while RoyalCare keeps centralized control over subscriptions, templates, modules, domains, billing, permissions, and tenant lifecycle.

Each center gets:
- Custom domain
- Public website
- Center owner admin panel
- Customer records
- Appointment and session management
- Branding: logo, colors, theme, languages
- Enabled modules based on center type and subscription
- Customer portal
- Notifications

## 3. System Levels

### 3.1 Super Admin - RoyalCare

The Super Admin is used by the RoyalCare team.

Primary responsibilities:
- Manage centers and subscriptions
- Configure custom domains
- Enable or disable modules per center
- Assign industry templates
- Monitor platform usage
- Manage global settings
- Manage plans, pricing, and feature access
- Support tenant troubleshooting
- View system health and backups

### 3.2 Center Owner Admin Panel

The Center Owner Admin Panel is used by each subscribed center.

Primary responsibilities:
- Manage center website content
- Manage branding, languages, pages, services, staff, appointments, and customers
- Manage notifications and customer communication
- Review bookings and sessions
- Configure center-level settings within allowed subscription limits

### 3.3 Customer Portal

The Customer Portal is used by end customers of each center.

Primary responsibilities:
- Customer login and profile access
- View appointments
- Book or request appointments
- View sessions or treatment history where allowed
- Receive notifications
- Update basic personal information

Needs Confirmation:
- Whether customers can pay online in the first release.
- Whether customers can cancel/reschedule appointments themselves.
- Whether customer portal access is mandatory for every center or optional by subscription/module.

## 4. Main Features

Core platform features:
- Subscription management
- Custom domain mapping
- Multi-language support: Arabic, Hebrew, English
- Dynamic pages builder
- Appointments and sessions
- Notifications
- Customer login portal
- Center-specific modules
- Industry templates: Laser, Physio, Hijama, Beauty
- Branding system: logo, colors, theme
- Responsive simple admin design
- Future mobile app support

## 5. Technical Direction

Planned stack:
- Frontend Web: Next.js + TypeScript
- Backend API: NestJS + TypeScript
- Database: PostgreSQL + Prisma
- Future Mobile: React Native Expo

Architecture principles:
- Clean scalable backend
- Tenant isolation using `centerId`
- Strong permissions model
- RTL-friendly web UI
- Mobile-ready API design
- Practical admin UI with no unnecessary complexity
- Backup and recovery designed from the beginning

## 6. Product Philosophy

RoyalCare should feel practical, trustworthy, and operationally clear.

The product is not a decorative marketing demo. It is a working business system for clinics and centers that need to manage customers, appointments, services, sessions, content, languages, and staff every day.

Design priorities:
- Simple workflows
- Fast scanning
- Clear permissions
- Minimal clutter
- Strong tenant separation
- Reliable audit trail for important actions
- Easy continuation by future developers and AI agents

## 7. Important Project Rules

- Do not make random assumptions.
- Mark unclear requirements as `Needs Confirmation`.
- Keep documentation detailed and professional.
- Prefer simple, practical admin screens over complex UI.
- Every tenant-owned record must include `centerId` unless intentionally global.
- Treat Arabic and Hebrew as first-class RTL languages.
- Keep the future React Native app in mind when shaping APIs.
- Maintain these memory files as the long-term source of truth.

## 8. Current Known Unknowns

Needs Confirmation:
- Initial MVP scope and launch deadline.
- Payment provider and subscription billing flow.
- Domain provider/DNS automation strategy.
- Hosting environment.
- Authentication provider or custom auth.
- Whether center websites are server-rendered, statically generated, or hybrid.
- Whether customers are unique per center only or can have a global RoyalCare identity.
- Regulatory requirements for medical/customer data by country.
- Backup retention period and restore process expectations.
- Whether online payments are part of v1.
