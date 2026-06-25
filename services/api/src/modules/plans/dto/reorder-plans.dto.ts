export class ReorderPlanItemDto {
  id!: string;
  displayOrder!: number;
}

export class ReorderPlansDto {
  items!: ReorderPlanItemDto[];
}
