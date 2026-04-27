import { Controller, Get, Param } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';

@Controller('super-admin/centers/:centerId/subscription')
export class CenterSubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  getLatestForCenter(@Param('centerId') centerId: string) {
    return this.subscriptionsService.getLatestForCenter(centerId);
  }
}
