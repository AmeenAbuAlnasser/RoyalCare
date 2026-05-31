import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export type PlatformSessionPayload = {
  userId: string;
  exp: number;
};

function getPlatformSessionSecret() {
  const secret = process.env.ROYALCARE_PLATFORM_SESSION_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'ROYALCARE_PLATFORM_SESSION_SECRET is required in production.',
    );
  }

  return 'royalcare-local-platform-session-secret';
}

const PLATFORM_SESSION_SECRET = getPlatformSessionSecret();

function base64UrlEncode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(value: string) {
  return createHmac('sha256', PLATFORM_SESSION_SECRET)
    .update(value)
    .digest('base64url');
}

export const platformSessionCookieName = 'royalcare_platform_session';
export const platformSessionMaxAgeSeconds = 60 * 60 * 8; // 8 hours

export function createPlatformSessionToken(
  payload: Omit<PlatformSessionPayload, 'exp'>,
) {
  const sessionPayload: PlatformSessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + platformSessionMaxAgeSeconds,
  };
  const body = base64UrlEncode(JSON.stringify(sessionPayload));
  const nonce = randomBytes(12).toString('base64url');
  const unsignedToken = `${body}.${nonce}`;
  const signature = sign(unsignedToken);

  return `${unsignedToken}.${signature}`;
}

export function verifyPlatformSessionToken(
  token?: string,
): PlatformSessionPayload | null {
  if (!token) {
    return null;
  }

  const [body, nonce, signature] = token.split('.');

  if (!body || !nonce || !signature) {
    return null;
  }

  const expectedSignature = sign(`${body}.${nonce}`);
  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      base64UrlDecode(body),
    ) as PlatformSessionPayload;

    if (!payload.userId || payload.exp < Date.now() / 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
