import crypto from "crypto";

export function generateOtp(): { code: string; hash: string } {
  const num = crypto.randomInt(100000, 999999);
  const code = num.toString();
  const hash = crypto.createHash("sha256").update(code).digest("hex");
  return { code, hash };
}

export function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code.trim()).digest("hex");
}
