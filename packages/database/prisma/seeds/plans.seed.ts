/**
 * Plans Seed — RoyalCare Subscription Plans v2
 *
 * Usage (from packages/database):
 *   DATABASE_URL="postgresql://royalcare:royalcare123@localhost:5432/royalcare_dev?schema=public" npx tsx prisma/seeds/plans.seed.ts
 *
 * SAFE TO RUN REPEATEDLY — uses upsert keyed on plan.code.
 * Also backfills Subscription.planId for existing rows by matching
 * UPPER(planCode) to Plan.code.
 *
 * NEVER import this file in production application code.
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const DB_URL = process.env['DATABASE_URL'];
if (!DB_URL) {
  console.error('❌  DATABASE_URL is not set.');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: DB_URL });
const prisma = new PrismaClient({ adapter });

// ─── Feature definitions ───────────────────────────────────────────────────

type Feature = {
  key: string;
  nameEn: string;
  nameAr: string;
  nameHe: string;
  included: boolean;
};

const ALL_FEATURES: Omit<Feature, 'included'>[] = [
  { key: 'website_builder',    nameEn: 'Website Builder',       nameAr: 'منشئ المواقع',           nameHe: 'בונה אתרים'             },
  { key: 'online_booking',     nameEn: 'Online Booking',        nameAr: 'الحجز الإلكتروني',        nameHe: 'הזמנה אונליין'           },
  { key: 'patients',           nameEn: 'Patients',              nameAr: 'المرضى',                  nameHe: 'מטופלים'                 },
  { key: 'appointments',       nameEn: 'Appointments',          nameAr: 'المواعيد',                 nameHe: 'תורים'                   },
  { key: 'services',           nameEn: 'Services',              nameAr: 'الخدمات',                  nameHe: 'שירותים'                 },
  { key: 'billing',            nameEn: 'Billing',               nameAr: 'الفواتير',                 nameHe: 'חיוב'                    },
  { key: 'patient_portal',     nameEn: 'Patient Portal',        nameAr: 'بوابة المريض',            nameHe: 'פורטל מטופלים'           },
  { key: 'marketing_tracking', nameEn: 'Marketing Tracking',    nameAr: 'تتبع التسويق',            nameHe: 'מעקב שיווקי'             },
  { key: 'custom_domain',      nameEn: 'Custom Domain',         nameAr: 'نطاق مخصص',               nameHe: 'דומיין מותאם'            },
  { key: 'advanced_reports',   nameEn: 'Advanced Reports',      nameAr: 'تقارير متقدمة',           nameHe: 'דוחות מתקדמים'           },
  { key: 'unlimited_users',    nameEn: 'Unlimited Users',       nameAr: 'مستخدمون غير محدودين',    nameHe: 'משתמשים ללא הגבלה'       },
  { key: 'priority_support',   nameEn: 'Priority Support',      nameAr: 'دعم أولوي',               nameHe: 'תמיכה מועדפת'            },
];

function features(includedKeys: string[]): Feature[] {
  const included = new Set(includedKeys);
  return ALL_FEATURES.map((f) => ({ ...f, included: included.has(f.key) }));
}

// ─── Plan definitions ──────────────────────────────────────────────────────

const BASIC_FEATURES = features([
  'website_builder',
  'online_booking',
  'patients',
  'appointments',
  'services',
  'billing',
]);

const PROFESSIONAL_FEATURES = features([
  'website_builder',
  'online_booking',
  'patients',
  'appointments',
  'services',
  'billing',
  'patient_portal',
  'marketing_tracking',
  'custom_domain',
  'advanced_reports',
]);

const ENTERPRISE_FEATURES = features(ALL_FEATURES.map((f) => f.key));

const PLANS = [
  {
    code: 'BASIC',
    nameEn: 'Basic',
    nameAr: 'أساسي',
    nameHe: 'בסיסי',
    descriptionEn: 'Everything you need to get started — website, booking, patients, and billing.',
    descriptionAr: 'كل ما تحتاجه للبدء — موقع إلكتروني، حجز، مرضى، وفواتير.',
    descriptionHe: 'כל מה שצריך כדי להתחיל — אתר, הזמנות, מטופלים וחיוב.',
    yearlyPrice: 299,
    currency: 'USD',
    isActive: true,
    isPublic: true,
    isPopular: false,
    isContactPricing: false,
    displayOrder: 1,
    maxUsers: 5,
    maxPatients: null,
    maxAppointmentsPerMonth: null,
    features: BASIC_FEATURES,
  },
  {
    code: 'PROFESSIONAL',
    nameEn: 'Professional',
    nameAr: 'احترافي',
    nameHe: 'מקצועי',
    descriptionEn: 'Advanced features for growing clinics — patient portal, marketing, custom domain, and detailed reports.',
    descriptionAr: 'ميزات متقدمة للعيادات المتنامية — بوابة المريض، تسويق، نطاق مخصص، وتقارير تفصيلية.',
    descriptionHe: 'פיצ\'רים מתקדמים למרפאות בצמיחה — פורטל מטופלים, שיווק, דומיין מותאם ודוחות מפורטים.',
    yearlyPrice: 399,
    currency: 'USD',
    isActive: true,
    isPublic: true,
    isPopular: true,
    isContactPricing: false,
    displayOrder: 2,
    maxUsers: null,
    maxPatients: null,
    maxAppointmentsPerMonth: null,
    features: PROFESSIONAL_FEATURES,
  },
  {
    code: 'ENTERPRISE',
    nameEn: 'Enterprise',
    nameAr: 'مؤسسي',
    nameHe: 'ארגוני',
    descriptionEn: 'Full platform access with priority support and custom pricing for large organizations.',
    descriptionAr: 'وصول كامل للمنصة مع دعم أولوي وتسعير مخصص للمؤسسات الكبيرة.',
    descriptionHe: 'גישה מלאה לפלטפורמה עם תמיכה מועדפת ותמחור מותאם לארגונים גדולים.',
    yearlyPrice: 0,
    currency: 'USD',
    isActive: true,
    isPublic: true,
    isPopular: false,
    isContactPricing: true,
    displayOrder: 3,
    maxUsers: null,
    maxPatients: null,
    maxAppointmentsPerMonth: null,
    features: ENTERPRISE_FEATURES,
  },
] as const;

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n📋  Upserting subscription plans...');

  for (const plan of PLANS) {
    const { code, features: planFeatures, ...rest } = plan;

    await prisma.plan.upsert({
      where: { code },
      create: {
        code,
        features: planFeatures as object[],
        ...rest,
      },
      update: {
        features: planFeatures as object[],
        ...rest,
      },
    });

    const marker = plan.isContactPricing
      ? '(contact pricing)'
      : `$${plan.yearlyPrice}/yr`;
    console.log(`   ✓ ${plan.code.padEnd(14)} ${plan.nameEn.padEnd(16)} ${marker}`);
  }

  // ─── Backfill planId on existing subscriptions ───────────────────────────
  console.log('\n🔗  Backfilling Subscription.planId...');

  const plans = await prisma.plan.findMany({ select: { id: true, code: true } });
  const planByCode = new Map(plans.map((p) => [p.code.toUpperCase(), p.id]));

  const subscriptions = await prisma.subscription.findMany({
    where: { planId: null },
    select: { id: true, planCode: true },
  });

  console.log(`   Found ${subscriptions.length} subscription(s) with planId = NULL`);

  let matched = 0;
  let unmatched = 0;

  for (const sub of subscriptions) {
    const planId = planByCode.get(sub.planCode.trim().toUpperCase());
    if (planId) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { planId },
      });
      matched++;
    } else {
      console.warn(`   ⚠  No plan match for planCode="${sub.planCode}" (subscriptionId=${sub.id})`);
      unmatched++;
    }
  }

  console.log(`   ✓ Backfilled: ${matched}  |  Unmatched: ${unmatched}`);

  // ─── Summary ──────────────────────────────────────────────────────────────
  const totalWithPlanId = await prisma.subscription.count({ where: { planId: { not: null } } });
  const totalWithout = await prisma.subscription.count({ where: { planId: null } });

  console.log('\n✅  Plans seed complete.');
  console.log(`   Plans in database : ${plans.length}`);
  console.log(`   Subscriptions with planId    : ${totalWithPlanId}`);
  console.log(`   Subscriptions without planId : ${totalWithout}`);

  if (totalWithout > 0) {
    console.warn(
      `\n   ⚠  ${totalWithout} subscription(s) could not be matched.\n` +
      '      Run: SELECT id, "planCode" FROM "Subscription" WHERE "planId" IS NULL;\n' +
      '      to inspect unmatched rows and assign planId manually.',
    );
  }
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
