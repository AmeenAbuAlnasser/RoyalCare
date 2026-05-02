import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export type CenterSessionPayload = {
  centerId: string;
  exp: number;
  role: string;
  userId: string;
};

const CENTER_SESSION_SECRET =
  process.env.ROYALCARE_CENTER_SESSION_SECRET ??
  'royalcare-local-center-session-secret';

function base64UrlEncode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(value: string) {
  return createHmac('sha256', CENTER_SESSION_SECRET)
    .update(value)
    .digest('base64url');
}

export const centerSessionCookieName = 'royalcare_center_session';
export const centerSessionMaxAgeSeconds = 60 * 60 * 8;

export function createCenterSessionToken(
  payload: Omit<CenterSessionPayload, 'exp'>,
) {
  const sessionPayload: CenterSessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + centerSessionMaxAgeSeconds,
  };
  const body = base64UrlEncode(JSON.stringify(sessionPayload));
  const nonce = randomBytes(12).toString('base64url');
  const unsignedToken = `${body}.${nonce}`;
  const signature = sign(unsignedToken);

  return `${unsignedToken}.${signature}`;
}

export function verifyCenterSessionToken(token?: string) {
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
    const payload = JSON.parse(base64UrlDecode(body)) as CenterSessionPayload;

    if (
      !payload.userId ||
      !payload.centerId ||
      payload.exp < Date.now() / 1000
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
