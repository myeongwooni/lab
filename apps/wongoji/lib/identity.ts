import { createHash, randomUUID } from "node:crypto";

export const VISITOR_COOKIE = "wongoji_id";

const ADJECTIVES = [
  "말없는", "느린", "서두르는", "잠 못 드는", "우산 없는", "창가의",
  "겨울의", "골목의", "먼저 웃는", "뒤돌아보는", "주머니 속", "새벽의",
  "책장 넘기는", "길 잃은", "조용한", "기다리는", "지각한", "빗속의",
];

const NOUNS = [
  "사슴", "등대", "우체부", "고양이", "기차", "연필", "부표", "소년",
  "달팽이", "가로등", "종이배", "파도", "손님", "목소리", "그림자", "나그네",
  "안개", "새벽별",
];

export function newVisitorId(): string {
  return randomUUID();
}

/** Short, non-reversible public form of the visitor cookie. */
export function publicId(visitorId: string): string {
  return createHash("sha256")
    .update(`wongoji:${visitorId}`)
    .digest("hex")
    .slice(0, 10);
}

export function nicknameFor(publicIdValue: string): string {
  const n = parseInt(publicIdValue.slice(0, 8), 16);
  return `${ADJECTIVES[n % ADJECTIVES.length]} ${
    NOUNS[Math.floor(n / ADJECTIVES.length) % NOUNS.length]
  }`;
}

export function ipHash(ip: string): string {
  return createHash("sha256").update(`wongoji:ip:${ip}`).digest("hex").slice(0, 16);
}

export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
