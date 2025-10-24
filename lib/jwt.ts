import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

/**
 * JWT token yaratish
 */
export function createToken(payload: any): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" })
  ).toString("base64url");
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${data}`)
    .digest("base64url");
  return `${header}.${data}.${signature}`;
}

/**
 * JWT token tekshirish va decode qilish
 */
export function verifyToken(token: string): any {
  try {
    const [header, data, signature] = token.split(".");

    if (!header || !data || !signature) {
      throw new Error("Invalid token format");
    }

    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${data}`)
      .digest("base64url");

    if (signature !== expectedSignature) {
      throw new Error("Invalid signature");
    }

    return JSON.parse(Buffer.from(data, "base64url").toString());
  } catch (error) {
    throw new Error("Invalid token");
  }
}

/**
 * Authorization header'dan token olish
 */
export function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Token'dan user ma'lumotlarini olish
 */
export function getUserFromToken(authHeader: string | null): any | null {
  try {
    const token = getTokenFromHeader(authHeader);
    if (!token) return null;
    return verifyToken(token);
  } catch (error) {
    return null;
  }
}
