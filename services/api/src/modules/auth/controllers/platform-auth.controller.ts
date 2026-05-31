import { Body, Controller, Get, Logger, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { PlatformLoginDto } from '../dto/platform-login.dto';
import { PlatformAuthService } from '../services/platform-auth.service';
import {
  platformSessionCookieName,
  platformSessionMaxAgeSeconds,
  createPlatformSessionToken,
  verifyPlatformSessionToken,
} from '../services/platform-session.service';

function getCookie(request: Request, name: string) {
  const cookieHeader = request.headers.cookie;

  if (!cookieHeader) {
    return undefined;
  }

  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

@Controller('auth/super-admin')
export class PlatformAuthController {
  private readonly logger = new Logger(PlatformAuthController.name);

  constructor(private readonly platformAuthService: PlatformAuthService) {}

  @Post('login')
  async login(
    @Body() dto: PlatformLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const email = dto.email ?? '(missing)';
    this.logger.log(`[platform-auth:login-attempt] email=${email}`);

    let session: Awaited<ReturnType<typeof this.platformAuthService.login>>;
    try {
      session = await this.platformAuthService.login(dto.email, dto.password);
    } catch (err: unknown) {
      const reason =
        err instanceof Error ? err.message : String(err);
      this.logger.warn(`[platform-auth:login-failed] email=${email} reason=${reason}`);
      throw err;
    }

    const token = createPlatformSessionToken({ userId: session.user.id });

    response.cookie(platformSessionCookieName, token, {
      httpOnly: true,
      maxAge: platformSessionMaxAgeSeconds * 1000,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    this.logger.log(
      `[platform-auth:login-success] userId=${session.user.id} roleKeys=${session.roles.map((r) => r.key).join(',')}`,
    );
    return session;
  }

  @Get('me')
  getMe(@Req() request: Request) {
    const token = getCookie(request, platformSessionCookieName);
    return this.platformAuthService.getSession(
      verifyPlatformSessionToken(token),
    );
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(platformSessionCookieName, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return { loggedOut: true };
  }
}
