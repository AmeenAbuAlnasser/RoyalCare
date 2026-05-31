import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

const DEFAULTS: Record<string, string> = {
  whatsapp_default_country_code: '970',
  whatsapp_support_phone: '',
  public_site_name: 'RoyalCare',
  public_logo_url: '',
  public_favicon_url: '',
  public_hero_image_url: '',
  public_footer_logo_url: '',
  public_support_phone: '',
  public_support_whatsapp: '',
  public_support_email: 'support@royalcare.app',
  public_facebook_url: '',
  public_instagram_url: '',
  public_whatsapp_url: '',
  public_youtube_url: '',
  public_tiktok_url: '',
  public_hero_title_ar: '',
  public_hero_title_en: '',
  public_hero_title_he: '',
  public_hero_subtitle_ar: '',
  public_hero_subtitle_en: '',
  public_hero_subtitle_he: '',
  public_owner_cta_text_ar: '',
  public_owner_cta_text_en: '',
  public_owner_cta_text_he: '',
  public_patient_cta_text_ar: '',
  public_patient_cta_text_en: '',
  public_patient_cta_text_he: '',
};

export const PUBLIC_SYSTEM_SETTING_KEYS = Object.keys(DEFAULTS).filter((key) =>
  key.startsWith('public_'),
);

@Injectable()
export class SystemSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSetting(key: string): Promise<string> {
    const db = await this.prisma.getClient();
    const row = await db.systemSetting.findUnique({ where: { key } });
    return row?.value ?? DEFAULTS[key] ?? '';
  }

  async getAll(): Promise<
    { key: string; value: string; updatedAt: string | null }[]
  > {
    const db = await this.prisma.getClient();
    const rows = await db.systemSetting.findMany();
    const stored = new Map(rows.map((r) => [r.key, r]));
    return Object.keys(DEFAULTS).map((key) => ({
      key,
      value: stored.get(key)?.value ?? DEFAULTS[key],
      updatedAt: stored.get(key)?.updatedAt.toISOString() ?? null,
    }));
  }

  async getPublicSettings(): Promise<
    { key: string; value: string; updatedAt: string | null }[]
  > {
    const db = await this.prisma.getClient();
    const rows = await db.systemSetting.findMany({
      where: { key: { in: PUBLIC_SYSTEM_SETTING_KEYS } },
    });
    const stored = new Map(rows.map((r) => [r.key, r]));
    return PUBLIC_SYSTEM_SETTING_KEYS.map((key) => ({
      key,
      value: stored.get(key)?.value ?? DEFAULTS[key] ?? '',
      updatedAt: stored.get(key)?.updatedAt.toISOString() ?? null,
    }));
  }

  async setSetting(key: string, value: string): Promise<void> {
    const db = await this.prisma.getClient();
    await db.systemSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }
}
