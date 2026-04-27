import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ListSubscriptionsQueryDto } from './dto/list-subscriptions-query.dto';
import { SubscriptionsService } from './subscriptions.service';

@Controller('super-admin/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  list(@Query() query: ListSubscriptionsQueryDto) {
    return this.subscriptionsService.list(query);
  }

  @Post()
  create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(dto);
  }

  @Get(':subscriptionId')
  getById(@Param('subscriptionId') subscriptionId: string) {
    return this.subscriptionsService.getById(subscriptionId);
  }
}
