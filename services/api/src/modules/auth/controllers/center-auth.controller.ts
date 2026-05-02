import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CenterLoginDto } from '../dto/center-login.dto';
import { CenterAuthService } from '../services/center-auth.service';
import {
  centerSessionCookieName,
  centerSessionMaxAgeSeconds,
  createCenterSessionToken,
  verifyCenterSessionToken,
} from '../services/center-session.service';

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

@Controller('auth/center')
export class CenterAuthController {
  constructor(private readonly centerAuthService: CenterAuthService) {}

  @Get('resolve/:centerSlug')
  resolveCenter(@Param('centerSlug') centerSlug: string) {
    return this.centerAuthService.resolveCenterLogin(centerSlug);
  }

  @Post('login')
  async login(
    @Body() dto: CenterLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.centerAuthService.login(dto);
    const token = createCenterSessionToken({
      centerId: session.center.id,
      role: session.role.key,
      userId: session.user.id,
    });

    response.cookie(centerSessionCookieName, token, {
      httpOnly: true,
      maxAge: centerSessionMaxAgeSeconds * 1000,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return session;
  }

  @Get('me')
  getCurrentSession(@Req() request: Request) {
    const token = getCookie(request, centerSessionCookieName);

    return this.centerAuthService.getSession(verifyCenterSessionToken(token));
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(centerSessionCookieName, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return { loggedOut: true };
  }
}
