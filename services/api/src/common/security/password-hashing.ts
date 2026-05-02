import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);

const PASSWORD_HASH_ALGORITHM = 'scrypt';
const PASSWORD_HASH_KEY_LENGTH = 64;
const PASSWORD_HASH_SALT_LENGTH = 16;

export async function hashPassword(password: string) {
  const salt = randomBytes(PASSWORD_HASH_SALT_LENGTH).toString('base64url');
  const derivedKey = (await scrypt(
    password,
    salt,
    PASSWORD_HASH_KEY_LENGTH,
  )) as Buffer;

  return [
    PASSWORD_HASH_ALGORITHM,
    PASSWORD_HASH_KEY_LENGTH,
    salt,
    derivedKey.toString('base64url'),
  ].join('$');
}

export async function verifyPassword(password: string, passwordHash: string) {
  const [algorithm, keyLengthValue, salt, storedKey] = passwordHash.split('$');
  const keyLength = Number(keyLengthValue);

  if (
    algorithm !== PASSWORD_HASH_ALGORITHM ||
    !Number.isInteger(keyLength) ||
    keyLength <= 0 ||
    !salt ||
    !storedKey
  ) {
    return false;
  }

  const derivedKey = (await scrypt(password, salt, keyLength)) as Buffer;
  const storedKeyBuffer = Buffer.from(storedKey, 'base64url');

  if (derivedKey.length !== storedKeyBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, storedKeyBuffer);
}
