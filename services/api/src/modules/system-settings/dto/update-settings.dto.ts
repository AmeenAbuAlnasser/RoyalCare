class SettingEntryDto {
  key!: string;
  value?: string | null;
}

export class UpdateSettingsDto {
  settings!: SettingEntryDto[];
}
