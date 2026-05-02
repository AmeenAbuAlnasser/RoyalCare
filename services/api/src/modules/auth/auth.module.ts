import { Module } from '@nestjs/common';
import { CenterAuthController } from './controllers/center-auth.controller';
import { CenterAuthService } from './services/center-auth.service';

@Module({
  controllers: [CenterAuthController],
  providers: [CenterAuthService],
  exports: [CenterAuthService],
})
export class AuthModule {}
