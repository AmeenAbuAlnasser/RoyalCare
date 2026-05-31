export class ManualWhatsAppLogDto {
  phone!: string;
  message!: string;
  action!: 'OPENED_WHATSAPP' | 'COPIED_MESSAGE';
}
