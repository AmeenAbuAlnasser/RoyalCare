/**
 * QA Demo Data Seed — qa-recovery-1779095621868
 *
 * Usage (from packages/database):
 *   DATABASE_URL="postgresql://royalcare:royalcare123@localhost:5432/royalcare_dev?schema=public" npx tsx prisma/seeds/qa-center.seed.ts
 *
 * Or set DATABASE_URL in your shell and run:
 *   npx tsx prisma/seeds/qa-center.seed.ts
 *
 * SAFE TO RUN REPEATEDLY — replaces QA center content data, never touches
 * patients, appointments, invoices, or staff users.
 *
 * NEVER import this file in production application code.
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const QA_SLUG = 'qa-recovery-1779095621868';

const DB_URL = process.env['DATABASE_URL'];
if (!DB_URL) {
  console.error('❌  DATABASE_URL is not set. Export it before running this script.');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: DB_URL });
const prisma = new PrismaClient({ adapter });

// Deterministic picsum.photos images — stable across runs.
function img(seed: string, w = 800, h = 600): string {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

async function main() {
  console.log(`\n🔍  Looking up center: ${QA_SLUG}`);
  const center = await prisma.center.findFirst({
    where: { slug: QA_SLUG },
    select: { id: true, name: true, slug: true, status: true },
  });

  if (!center) {
    console.error(`❌  Center not found: ${QA_SLUG}`);
    console.error('    Make sure the center exists in the database before running this seed.');
    process.exit(1);
  }

  console.log(`✅  Found center: ${center.name} (${center.id})`);
  const { id: centerId } = center;

  // ─── 1. BrandingSettings ──────────────────────────────────────────────────
  console.log('\n📋  Upserting branding settings...');
  await prisma.brandingSettings.upsert({
    where: { centerId },
    create: {
      centerId,
      primaryColor: '#6D4AFF',
      secondaryColor: '#F59E0B',
      logoUrl: null,
      coverImageUrl: img('qa-cover', 1400, 600),
      cardImageUrl: img('qa-card', 800, 500),
      sloganEn: 'Expert Care. Real Results.',
      sloganAr: 'رعاية متخصصة. نتائج حقيقية.',
      sloganHe: 'טיפול מקצועי. תוצאות אמיתיות.',
      publicDescriptionEn:
        'QA Recovery Center is a premium medical aesthetics clinic specializing in laser therapy, skin rejuvenation, and personalized wellness plans.',
      publicDescriptionAr:
        'مركز QA Recovery هو عيادة تجميل طبية متميزة متخصصة في العلاج بالليزر وتجديد شباب البشرة وبرامج العافية الشخصية.',
      publicDescriptionHe:
        'מרכז QA Recovery הוא קליניקה רפואית-אסתטית מובילה המתמחה בטיפולי לייזר, התחדשות עור ותוכניות בריאות מותאמות אישית.',
      fullDescriptionEn:
        'Founded by a team of certified dermatologists and aesthetic specialists, QA Recovery Center brings together the latest laser technology with evidence-based skin science. Our treatments are tailored to each patient, ensuring natural-looking results with minimal downtime. From hair removal to scar revision and anti-aging protocols, every session is designed around your personal goals.',
      fullDescriptionAr:
        'تأسس مركز QA Recovery على يد فريق من أطباء الجلدية والمتخصصين في التجميل، ويجمع بين أحدث تقنيات الليزر وعلم الجلد المستند إلى الأدلة. تتميز علاجاتنا بأنها مصممة لكل مريض على حدة لضمان نتائج طبيعية مع أقل وقت تعافٍ ممكن. من إزالة الشعر إلى إصلاح الندبات وبروتوكولات مكافحة الشيخوخة، كل جلسة مصممة حول أهدافك الشخصية.',
      fullDescriptionHe:
        'מרכז QA Recovery הוקם על ידי צוות של דרמטולוגים מוסמכים ומומחי אסתטיקה, המשלב בין טכנולוגיית לייזר מתקדמת למדע עור מבוסס ראיות. הטיפולים שלנו מותאמים אישית לכל מטופל, ומבטיחים תוצאות טבעיות עם זמן השבתה מינימלי.',
      workingHoursEn: 'Sun – Thu: 9:00 AM – 6:00 PM\nFri: 9:00 AM – 2:00 PM\nSat: Closed',
      workingHoursAr: 'الأحد – الخميس: 9:00 صباحاً – 6:00 مساءً\nالجمعة: 9:00 صباحاً – 2:00 مساءً\nالسبت: مغلق',
      workingHoursHe: 'ראשון – חמישי: 9:00 – 18:00\nשישי: 9:00 – 14:00\nשבת: סגור',
      cityEn: 'Tel Aviv',
      cityAr: 'تل أبيب',
      cityHe: 'תל אביב',
      addressEn: '23 Dizengoff Street, Tel Aviv, Israel',
      addressAr: 'شارع ديزنغوف 23، تل أبيب، إسرائيل',
      addressHe: 'רחוב דיזנגוף 23, תל אביב, ישראל',
      phone: '+972-3-555-0100',
      whatsappPhone: '+972501234567',
      email: 'hello@qa-recovery.example.com',
      googleMapsUrl: 'https://maps.google.com/?q=32.0797,34.7739',
      facebookUrl: 'https://www.facebook.com/qarecoverycenter',
      instagramUrl: 'https://www.instagram.com/qarecoverycenter',
      tiktokUrl: 'https://www.tiktok.com/@qarecovery',
      enabledLanguages: ['EN', 'AR', 'HE'],
      defaultLanguage: 'EN',
    },
    update: {
      primaryColor: '#6D4AFF',
      secondaryColor: '#F59E0B',
      coverImageUrl: img('qa-cover', 1400, 600),
      cardImageUrl: img('qa-card', 800, 500),
      sloganEn: 'Expert Care. Real Results.',
      sloganAr: 'رعاية متخصصة. نتائج حقيقية.',
      sloganHe: 'טיפול מקצועי. תוצאות אמיתיות.',
      publicDescriptionEn:
        'QA Recovery Center is a premium medical aesthetics clinic specializing in laser therapy, skin rejuvenation, and personalized wellness plans.',
      publicDescriptionAr:
        'مركز QA Recovery هو عيادة تجميل طبية متميزة متخصصة في العلاج بالليزر وتجديد شباب البشرة وبرامج العافية الشخصية.',
      publicDescriptionHe:
        'מרכז QA Recovery הוא קליניקה רפואית-אסתטית מובילה המתמחה בטיפולי לייזר, התחדשות עור ותוכניות בריאות מותאמות אישית.',
      fullDescriptionEn:
        'Founded by a team of certified dermatologists and aesthetic specialists, QA Recovery Center brings together the latest laser technology with evidence-based skin science. Our treatments are tailored to each patient, ensuring natural-looking results with minimal downtime. From hair removal to scar revision and anti-aging protocols, every session is designed around your personal goals.',
      fullDescriptionAr:
        'تأسس مركز QA Recovery على يد فريق من أطباء الجلدية والمتخصصين في التجميل، ويجمع بين أحدث تقنيات الليزر وعلم الجلد المستند إلى الأدلة. تتميز علاجاتنا بأنها مصممة لكل مريض على حدة لضمان نتائج طبيعية مع أقل وقت تعافٍ ممكن. من إزالة الشعر إلى إصلاح الندبات وبروتوكولات مكافحة الشيخوخة، كل جلسة مصممة حول أهدافك الشخصية.',
      fullDescriptionHe:
        'מרכז QA Recovery הוקם על ידי צוות של דרמטולוגים מוסמכים ומומחי אסתטיקה, המשלב בין טכנולוגיית לייזר מתקדמת למדע עור מבוסס ראיות. הטיפולים שלנו מותאמים אישית לכל מטופל, ומבטיחים תוצאות טבעיות עם זמן השבתה מינימלי.',
      workingHoursEn: 'Sun – Thu: 9:00 AM – 6:00 PM\nFri: 9:00 AM – 2:00 PM\nSat: Closed',
      workingHoursAr: 'الأحد – الخميس: 9:00 صباحاً – 6:00 مساءً\nالجمعة: 9:00 صباحاً – 2:00 مساءً\nالسبت: مغلق',
      workingHoursHe: 'ראשון – חמישי: 9:00 – 18:00\nשישי: 9:00 – 14:00\nשבת: סגור',
      cityEn: 'Tel Aviv',
      cityAr: 'تل أبيب',
      cityHe: 'תל אביב',
      addressEn: '23 Dizengoff Street, Tel Aviv, Israel',
      addressAr: 'شارع ديزنغوف 23، تل أبيب، إسرائيل',
      addressHe: 'רחוב דיזנגוף 23, תל אביב, ישראל',
      phone: '+972-3-555-0100',
      whatsappPhone: '+972501234567',
      email: 'hello@qa-recovery.example.com',
      googleMapsUrl: 'https://maps.google.com/?q=32.0797,34.7739',
      facebookUrl: 'https://www.facebook.com/qarecoverycenter',
      instagramUrl: 'https://www.instagram.com/qarecoverycenter',
      tiktokUrl: 'https://www.tiktok.com/@qarecovery',
    },
  });
  console.log('   ✓ BrandingSettings upserted');

  // ─── 2. Services (upsert — keep existing IDs) ─────────────────────────────
  console.log('\n🛠   Upserting services...');
  const serviceData = [
    {
      nameEn: 'Laser Hair Removal',
      nameAr: 'إزالة الشعر بالليزر',
      nameHe: 'הסרת שיער בלייזר',
      descriptionEn: 'Permanent hair reduction using the latest diode laser technology. Safe for all skin types.',
      descriptionAr: 'تقليص دائم للشعر باستخدام أحدث تقنيات ليزر الثنائي. آمن لجميع أنواع البشرة.',
      descriptionHe: 'הפחתה קבועה של שיער באמצעות טכנולוגיית לייזר דיודה מתקדמת. בטוח לכל סוגי העור.',
      durationMinutes: 45,
      price: '350',
      currency: 'ILS',
      isActive: true,
    },
    {
      nameEn: 'Chemical Skin Peel',
      nameAr: 'التقشير الكيميائي للبشرة',
      nameHe: 'קילוף כימי לעור',
      descriptionEn: 'Professional-grade chemical peel that renews skin texture, fades pigmentation, and brightens complexion.',
      descriptionAr: 'تقشير كيميائي بمستوى احترافي يجدد ملمس البشرة، يخفف التصبغات، ويشرق البشرة.',
      descriptionHe: 'קילוף כימי ברמה מקצועית המחדש את מרקם העור, מדהה פיגמנטציה ומבהיר את גוון העור.',
      durationMinutes: 60,
      price: '480',
      currency: 'ILS',
      isActive: true,
    },
    {
      nameEn: 'Anti-Aging Facial',
      nameAr: 'جلسة فيشل مضاد للشيخوخة',
      nameHe: 'פנים נגד הזדקנות',
      descriptionEn: 'Targeted anti-aging treatment combining radiofrequency, serum infusion, and LED therapy for visible lifting.',
      descriptionAr: 'علاج مستهدف لمكافحة الشيخوخة يجمع بين الترددات الراديوية والمصل والعلاج بالضوء LED للشد الظاهر.',
      descriptionHe: 'טיפול ממוקד נגד הזדקנות המשלב רדיו-תדרים, עירוי סרום וטיפול LED להרמה גלויה.',
      durationMinutes: 75,
      price: '550',
      currency: 'ILS',
      isActive: true,
    },
    {
      nameEn: 'Acne Scar Revision',
      nameAr: 'تصحيح ندبات حب الشباب',
      nameHe: 'תיקון צלקות אקנה',
      descriptionEn: 'Fractional laser resurfacing designed to minimize acne scars, enlarged pores, and uneven texture.',
      descriptionAr: 'إعادة تسطيح بالليزر الكسوري مصممة لتقليل ندبات حب الشباب والمسام الممتدة وعدم انتظام الملمس.',
      descriptionHe: 'פיגור שטח לייזר חלקי שנועד למזער צלקות אקנה, נקבוביות מוגדלות ומרקם לא אחיד.',
      durationMinutes: 90,
      price: '650',
      currency: 'ILS',
      isActive: true,
    },
    {
      nameEn: 'Body Contouring Wrap',
      nameAr: 'لف تشكيل الجسم',
      nameHe: 'עיצוב גוף',
      descriptionEn: 'A relaxing yet effective full-body wrap that targets cellulite, hydrates skin, and improves body tone.',
      descriptionAr: 'لف كامل للجسم مريح وفعال يستهدف السيلوليت، يرطب البشرة، ويحسن قوام الجسم.',
      descriptionHe: 'עטיפת גוף מלאה מרגיעה ויעילה המכוונת לצלוליט, מעניקה לחות לעור ומשפרת את טונוס הגוף.',
      durationMinutes: 60,
      price: '420',
      currency: 'ILS',
      isActive: true,
    },
  ];

  for (const svc of serviceData) {
    const existing = await prisma.service.findFirst({
      where: { centerId, nameEn: svc.nameEn },
      select: { id: true },
    });
    if (existing) {
      await prisma.service.update({ where: { id: existing.id }, data: svc });
    } else {
      await prisma.service.create({ data: { centerId, ...svc } });
    }
  }
  console.log(`   ✓ ${serviceData.length} services upserted`);

  // ─── 3. Gallery Images ────────────────────────────────────────────────────
  console.log('\n🖼   Rebuilding gallery images...');
  await prisma.centerGalleryImage.deleteMany({ where: { centerId } });
  await prisma.centerGalleryImage.createMany({
    data: [
      { centerId, imageUrl: img('qa-g1', 800, 600), sortOrder: 1 },
      { centerId, imageUrl: img('qa-g2', 800, 600), sortOrder: 2 },
      { centerId, imageUrl: img('qa-g3', 800, 600), sortOrder: 3 },
      { centerId, imageUrl: img('qa-g4', 800, 600), sortOrder: 4 },
      { centerId, imageUrl: img('qa-g5', 800, 600), sortOrder: 5 },
      { centerId, imageUrl: img('qa-g6', 800, 600), sortOrder: 6 },
    ],
  });
  console.log('   ✓ 6 gallery images created');

  // ─── 4. Reviews ───────────────────────────────────────────────────────────
  console.log('\n⭐  Rebuilding reviews...');
  await prisma.centerReview.deleteMany({ where: { centerId } });
  await prisma.centerReview.createMany({
    data: [
      {
        centerId,
        customerName: 'Sarah M.',
        rating: 5,
        commentEn: 'Absolutely transformed my skin. The laser sessions were painless and the team was incredibly professional. I saw results after just the second visit!',
        commentAr: 'حوّلت بشرتي تمامًا. كانت جلسات الليزر غير مؤلمة والفريق محترف للغاية. رأيت النتائج بعد الزيارة الثانية فقط!',
        commentHe: 'שינה את העור שלי לחלוטין. טיפולי הלייזר היו ללא כאב והצוות היה מקצועי להפליא. ראיתי תוצאות אחרי הביקור השני בלבד!',
        isPublished: true,
        sortOrder: 1,
      },
      {
        centerId,
        customerName: 'Ahmad K.',
        rating: 5,
        commentEn: 'Best clinic in Tel Aviv! The anti-aging facial gave me visible results the very next day. Will definitely come back.',
        commentAr: 'أفضل عيادة في تل أبيب! أعطتني جلسة فيشل مضاد الشيخوخة نتائج مرئية في اليوم التالي. سأعود بالتأكيد.',
        commentHe: 'הקליניקה הטובה ביותר בתל אביב! טיפול הפנים נגד הזדקנות נתן לי תוצאות גלויות כבר למחרת. בהחלט אחזור.',
        isPublished: true,
        sortOrder: 2,
      },
      {
        centerId,
        customerName: 'Noa B.',
        rating: 5,
        commentEn: 'I struggled with acne scars for years. After 4 sessions of fractional laser here, my skin looks smoother than ever. The staff is warm and knowledgeable.',
        commentAr: 'كنت أعاني من ندبات حب الشباب لسنوات. بعد 4 جلسات ليزر كسوري هنا، تبدو بشرتي أكثر نعومة من أي وقت مضى. الموظفون دافئون وعلى دراية.',
        commentHe: 'סבלתי מצלקות אקנה שנים. אחרי 4 טיפולי לייזר חלקי כאן, העור שלי נראה חלק יותר מתמיד. הצוות חמים ובעלי ידע.',
        isPublished: true,
        sortOrder: 3,
      },
      {
        centerId,
        customerName: 'Fatima R.',
        rating: 4,
        commentEn: 'Great experience overall. The body wrap treatment was deeply relaxing and I noticed my skin was noticeably firmer afterward. Would recommend to friends.',
        commentAr: 'تجربة رائعة بشكل عام. كان علاج اللف للجسم مريحًا للغاية ولاحظت أن بشرتي أكثر نضارة بشكل ملحوظ بعد ذلك. سأوصي به للأصدقاء.',
        commentHe: 'חוויה נהדרת בסה"כ. טיפול עטיפת הגוף היה מרגיע מאוד ושמתי לב שהעור שלי מוצק יותר לאחר מכן. ממליצה לחברות.',
        isPublished: true,
        sortOrder: 4,
      },
      {
        centerId,
        customerName: 'Daniel S.',
        rating: 5,
        commentEn: 'The booking was easy, the clinic is spotless, and the results speak for themselves. My hair removal sessions have been going flawlessly.',
        commentAr: 'كان الحجز سهلاً، والعيادة نظيفة تمامًا، والنتائج تتحدث عن نفسها. جلسات إزالة الشعر كانت رائعة.',
        commentHe: 'ההזמנה הייתה קלה, הקליניקה מצוחצחת, והתוצאות מדברות בעד עצמן. טיפולי הסרת השיער שלי הולכים מצוין.',
        isPublished: true,
        sortOrder: 5,
      },
    ],
  });
  console.log('   ✓ 5 reviews created (all published)');

  // ─── 5. Before / After ────────────────────────────────────────────────────
  console.log('\n🔄  Rebuilding before/after cases...');
  await prisma.centerBeforeAfter.deleteMany({ where: { centerId } });
  await prisma.centerBeforeAfter.createMany({
    data: [
      {
        centerId,
        category: 'LASER',
        titleEn: 'Full-Body Laser Hair Removal',
        titleAr: 'إزالة الشعر بالليزر للجسم كاملاً',
        titleHe: 'הסרת שיער בלייזר לכל הגוף',
        descriptionEn: 'After 6 sessions of diode laser, patient achieved 95% permanent hair reduction.',
        descriptionAr: 'بعد 6 جلسات ليزر ثنائي، حقق المريض تخفيضاً دائماً للشعر بنسبة 95٪.',
        descriptionHe: 'לאחר 6 טיפולי לייזר דיודה, המטופל השיג הפחתת שיער קבועה של 95%.',
        beforeImageUrl: img('qa-ba-laser-before', 600, 800),
        afterImageUrl: img('qa-ba-laser-after', 600, 800),
        isPublished: true,
        sortOrder: 1,
      },
      {
        centerId,
        category: 'SKIN',
        titleEn: 'Acne Scar Revision',
        titleAr: 'تصحيح ندبات حب الشباب',
        titleHe: 'תיקון צלקות אקנה',
        descriptionEn: 'Fractional laser resurfacing over 4 sessions dramatically smoothed deep acne scarring.',
        descriptionAr: 'أدى إعادة تسطيح الليزر الكسوري على مدى 4 جلسات إلى تنعيم ندبات حب الشباب العميقة بشكل ملحوظ.',
        descriptionHe: 'פיגור שטח לייזר חלקי במהלך 4 טיפולים החליק בצורה דרמטית צלקות אקנה עמוקות.',
        beforeImageUrl: img('qa-ba-acne-before', 600, 800),
        afterImageUrl: img('qa-ba-acne-after', 600, 800),
        isPublished: true,
        sortOrder: 2,
      },
      {
        centerId,
        category: 'SKIN',
        titleEn: 'Pigmentation & Sun Damage',
        titleAr: 'التصبغات وأضرار الشمس',
        titleHe: 'פיגמנטציה ונזקי שמש',
        descriptionEn: 'Chemical peels combined with IPL treatment reduced age spots and hyperpigmentation significantly.',
        descriptionAr: 'التقشير الكيميائي مع علاج IPL قلل من البقع العمرية وفرط التصبغ بشكل ملحوظ.',
        descriptionHe: 'קילוף כימי בשילוב טיפול IPL הפחית משמעותית כתמי גיל ועודף פיגמנטציה.',
        beforeImageUrl: img('qa-ba-pigment-before', 600, 800),
        afterImageUrl: img('qa-ba-pigment-after', 600, 800),
        isPublished: true,
        sortOrder: 3,
      },
      {
        centerId,
        category: 'HAIR',
        titleEn: 'Eyebrow Microblading Result',
        titleAr: 'نتيجة تاتو الحواجب',
        titleHe: 'תוצאת מיקרובליידינג גבות',
        descriptionEn: 'Natural-look eyebrow shaping and densification using microblading technique.',
        descriptionAr: 'تشكيل الحواجب وتكثيفها بمظهر طبيعي باستخدام تقنية الميكروبليدينج.',
        descriptionHe: 'עיצוב וצפיפות גבות במראה טבעי תוך שימוש בטכניקת מיקרובליידינג.',
        beforeImageUrl: img('qa-ba-brow-before', 600, 800),
        afterImageUrl: img('qa-ba-brow-after', 600, 800),
        isPublished: true,
        sortOrder: 4,
      },
    ],
  });
  console.log('   ✓ 4 before/after cases created (all published)');

  // ─── 6. Team Members ──────────────────────────────────────────────────────
  console.log('\n👥  Rebuilding team members...');
  await prisma.centerTeamMember.deleteMany({ where: { centerId } });
  await prisma.centerTeamMember.createMany({
    data: [
      {
        centerId,
        nameEn: 'Dr. Layla Hassan',
        nameAr: 'د. ليلى حسن',
        nameHe: 'ד"ר לילה חסן',
        titleEn: 'Medical Director & Dermatologist',
        titleAr: 'مديرة طبية وأخصائية أمراض جلدية',
        titleHe: 'מנהלת רפואית ודרמטולוגית',
        specialtyEn: 'Laser & Skin Rejuvenation',
        specialtyAr: 'الليزر وتجديد شباب البشرة',
        specialtyHe: 'לייזר והתחדשות עור',
        bioEn: 'Dr. Layla holds a specialization in dermatology and laser medicine with over 14 years of clinical experience across Israel and the UAE.',
        bioAr: 'تحمل د. ليلى تخصصاً في أمراض الجلد وطب الليزر بخبرة سريرية تمتد لأكثر من 14 عاماً في إسرائيل والإمارات.',
        bioHe: 'ד"ר לילה בעלת התמחות בדרמטולוגיה ורפואת לייזר עם ניסיון קליני של מעל 14 שנים בישראל ובאמירויות.',
        yearsExperience: 14,
        photoUrl: img('qa-team-1', 400, 400),
        isPublished: true,
        sortOrder: 1,
      },
      {
        centerId,
        nameEn: 'Omar Al-Rashid',
        nameAr: 'عمر الراشد',
        nameHe: 'עומר אל-ראשיד',
        titleEn: 'Senior Laser Technician',
        titleAr: 'فني ليزر أول',
        titleHe: 'טכנאי לייזר בכיר',
        specialtyEn: 'Hair Removal & Scar Treatments',
        specialtyAr: 'إزالة الشعر وعلاجات الندبات',
        specialtyHe: 'הסרת שיער וטיפולי צלקות',
        bioEn: 'Omar has performed over 8,000 laser sessions with a patient satisfaction rate of 97%. He is certified in multiple laser platforms.',
        bioAr: 'أجرى عمر أكثر من 8000 جلسة ليزر بمعدل رضا مريض 97٪. وهو معتمد على منصات ليزر متعددة.',
        bioHe: 'עומר ביצע מעל 8,000 טיפולי לייזר עם שיעור שביעות רצון של 97%. הוא מוסמך במספר פלטפורמות לייזר.',
        yearsExperience: 9,
        photoUrl: img('qa-team-2', 400, 400),
        isPublished: true,
        sortOrder: 2,
      },
      {
        centerId,
        nameEn: 'Miriam Cohen',
        nameAr: 'ميريام كوهن',
        nameHe: 'מרים כהן',
        titleEn: 'Aesthetic Skin Therapist',
        titleAr: 'معالجة بشرة جمالية',
        titleHe: 'מטפלת עור אסתטית',
        specialtyEn: 'Chemical Peels & Anti-Aging',
        specialtyAr: 'التقشير الكيميائي ومكافحة الشيخوخة',
        specialtyHe: 'קילוף כימי ונגד הזדקנות',
        bioEn: 'Miriam is an CIDESCO-certified aesthetician specializing in corrective skin care and anti-aging facials for sensitive and mature skin types.',
        bioAr: 'ميريام أخصائية تجميل معتمدة من CIDESCO متخصصة في العناية التصحيحية بالبشرة وجلسات الفيشل المضادة للشيخوخة لأنواع البشرة الحساسة والناضجة.',
        bioHe: 'מרים היא אסתטיקאית מוסמכת CIDESCO המתמחה בטיפוח עור מתקן וטיפולי פנים נגד הזדקנות לעור רגיש ובוגר.',
        yearsExperience: 7,
        photoUrl: img('qa-team-3', 400, 400),
        isPublished: true,
        sortOrder: 3,
      },
      {
        centerId,
        nameEn: 'Yusuf Al-Mansoori',
        nameAr: 'يوسف المنصوري',
        nameHe: 'יוסף אל-מנסורי',
        titleEn: 'Body Contouring Specialist',
        titleAr: 'متخصص في تشكيل الجسم',
        titleHe: 'מומחה לעיצוב גוף',
        specialtyEn: 'Body Wraps & Cellulite Treatments',
        specialtyAr: 'اللفائف الجسدية وعلاجات السيلوليت',
        specialtyHe: 'עטיפות גוף וטיפולי צלוליט',
        bioEn: 'Yusuf combines traditional wellness therapies with modern body contouring technologies to deliver holistic, results-oriented treatments.',
        bioAr: 'يجمع يوسف علاجات العافية التقليدية مع تقنيات تشكيل الجسم الحديثة لتقديم علاجات شاملة موجهة نحو النتائج.',
        bioHe: 'יוסף משלב טיפולי בריאות מסורתיים עם טכנולוגיות עיצוב גוף מודרניות לטיפולים הוליסטיים ממוקדי תוצאות.',
        yearsExperience: 6,
        photoUrl: img('qa-team-4', 400, 400),
        isPublished: true,
        sortOrder: 4,
      },
    ],
  });
  console.log('   ✓ 4 team members created (all published)');

  // ─── 7. Offers ────────────────────────────────────────────────────────────
  console.log('\n🎁  Rebuilding offers...');
  await prisma.centerOffer.deleteMany({ where: { centerId } });
  const now = new Date();
  const inTwoMonths = new Date(now);
  inTwoMonths.setMonth(inTwoMonths.getMonth() + 2);

  await prisma.centerOffer.createMany({
    data: [
      {
        centerId,
        titleEn: 'Summer Glow Package',
        titleAr: 'باقة التألق الصيفي',
        titleHe: 'חבילת זוהר הקיץ',
        descriptionEn: '3 chemical peels + 1 LED therapy session + complimentary skin analysis consultation. Limited summer offer.',
        descriptionAr: '3 جلسات تقشير كيميائي + جلسة علاج LED + استشارة تحليل بشرة مجانية. عرض صيفي محدود.',
        descriptionHe: '3 קילופים כימיים + טיפול LED אחד + ייעוץ ניתוח עור חינם. מבצע קיץ מוגבל.',
        badgeEn: 'Summer Deal',
        badgeAr: 'عرض صيفي',
        badgeHe: 'מבצע קיץ',
        oldPrice: 1680,
        newPrice: 1190,
        currency: 'ILS',
        imageUrl: img('qa-offer-1', 800, 500),
        isPublished: true,
        startsAt: now,
        endsAt: inTwoMonths,
        sortOrder: 1,
      },
      {
        centerId,
        titleEn: 'New Patient Welcome Bundle',
        titleAr: 'باقة ترحيب المريض الجديد',
        titleHe: 'חבילת קבלת פנים למטופל חדש',
        descriptionEn: 'First-visit package: Full skin consultation + 1 facial treatment of your choice + 20% off your next booking.',
        descriptionAr: 'باقة الزيارة الأولى: استشارة بشرة كاملة + علاج وجه واحد من اختيارك + خصم 20٪ على حجزك التالي.',
        descriptionHe: 'חבילת ביקור ראשון: ייעוץ עור מלא + טיפול פנים אחד לבחירתך + 20% הנחה בהזמנה הבאה.',
        badgeEn: 'New Patients',
        badgeAr: 'مرضى جدد',
        badgeHe: 'מטופלים חדשים',
        oldPrice: 780,
        newPrice: 490,
        currency: 'ILS',
        imageUrl: img('qa-offer-2', 800, 500),
        isPublished: true,
        startsAt: now,
        endsAt: inTwoMonths,
        sortOrder: 2,
      },
      {
        centerId,
        titleEn: 'Laser Hair Removal — 6-Session Bundle',
        titleAr: 'إزالة الشعر بالليزر — باقة 6 جلسات',
        titleHe: 'הסרת שיער בלייזר — חבילת 6 טיפולים',
        descriptionEn: 'Complete 6-session full-body hair removal package for lasting results. Payment plans available.',
        descriptionAr: 'باقة كاملة من 6 جلسات لإزالة شعر الجسم الكامل للحصول على نتائج دائمة. خطط الدفع متاحة.',
        descriptionHe: 'חבילה מלאה של 6 טיפולי הסרת שיער לכל הגוף לתוצאות מתמשכות. תוכניות תשלום זמינות.',
        badgeEn: 'Best Value',
        badgeAr: 'أفضل قيمة',
        badgeHe: 'הכי משתלם',
        oldPrice: 2100,
        newPrice: 1550,
        currency: 'ILS',
        imageUrl: img('qa-offer-3', 800, 500),
        isPublished: true,
        startsAt: now,
        endsAt: inTwoMonths,
        sortOrder: 3,
      },
    ],
  });
  console.log('   ✓ 3 offers created (all published)');

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log('\n✅  QA Recovery center seeded successfully!\n');
  console.log('📍  Open these URLs to verify:');
  console.log('    http://localhost:3000/c/qa-recovery-1779095621868');
  console.log('    http://localhost:3000/c/qa-recovery-1779095621868/gallery');
  console.log('    http://localhost:3000/c/qa-recovery-1779095621868/reviews');
  console.log('    http://localhost:3000/c/qa-recovery-1779095621868/before-after');
  console.log('    http://localhost:3000/c/qa-recovery-1779095621868/team');
  console.log('    http://localhost:3000/c/qa-recovery-1779095621868/offers');
  console.log('    http://localhost:3000/c/qa-recovery-1779095621868/contact');
  console.log('    http://localhost:3000/c/qa-recovery-1779095621868/book\n');
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
