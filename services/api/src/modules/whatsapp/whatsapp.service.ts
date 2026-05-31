import { Injectable } from '@nestjs/common';

/**
 * WhatsApp dispatcher — currently a placeholder.
 *
 * Mode selection:
 *   WHATSAPP_MODE=manual  (default) — no API calls; frontend opens wa.me links manually.
 *   WHATSAPP_MODE=api     — enables sendMessage() once credentials are set.
 *
 * Required env vars for API mode:
 *   WHATSAPP_API_URL   — WhatsApp Business Cloud API base URL
 *   WHATSAPP_TOKEN     — Bearer token (permanent system-user token)
 *   WHATSAPP_PHONE_ID  — Phone number ID from Meta Business Manager
 */
@Injectable()
export class WhatsAppService {
  private readonly mode = process.env.WHATSAPP_MODE ?? 'manual';
  private readonly apiUrl = process.env.WHATSAPP_API_URL;
  private readonly token = process.env.WHATSAPP_TOKEN;
  private readonly phoneId = process.env.WHATSAPP_PHONE_ID;

  isApiModeEnabled(): boolean {
    return (
      this.mode === 'api' &&
      Boolean(this.apiUrl) &&
      Boolean(this.token) &&
      Boolean(this.phoneId)
    );
  }

  /**
   * Sends a WhatsApp message via the Business Cloud API.
   * Only active when WHATSAPP_MODE=api and all credentials are configured.
   * TODO: Implement actual HTTP call to WHATSAPP_API_URL.
   */
  sendMessage(phone: string, message: string): Promise<void> {
    void phone;
    void message;

    if (!this.isApiModeEnabled()) {
      throw new Error(
        'WhatsApp API mode is disabled. Set WHATSAPP_MODE=api with WHATSAPP_API_URL, WHATSAPP_TOKEN, and WHATSAPP_PHONE_ID.',
      );
    }
    // Placeholder — real implementation goes here.
    throw new Error('WhatsApp Business API sending is not yet implemented.');
  }
}
