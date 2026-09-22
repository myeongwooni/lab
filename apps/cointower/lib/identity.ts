import { createHash, randomUUID } from "node:crypto";

export const VISITOR_COOKIE = "cointower_id";

const ADJECTIVES = [
  "겁 없는", "손이 떨린", "눈 감은", "숨 참은", "새벽의", "마지막",
  "돌아온", "처음 온", "운 나쁜", "확신에 찬", "말리던", "지켜보던",
  "설마 하던", "웃고 있던", "장갑 낀", "한 손의", "심호흡한", "뒤늦은",
];

const NOUNS = [
  "도박사", "우체부", "타자", "선장", "전령", "점쟁이", "구경꾼", "신참",
  "대장장이", "야경꾼", "항해사", "광부", "우산장수", "시계공", "등대지기",
  "떠돌이", "문지기", "수습생",
];

export function newVisitorId(): string {
  return randomUUID();
}

export function publicId(visitorId: string): string {
  return createHash("sha256")
    .update(`cointower:${visitorId}`)
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
  return createHash("sha256").update(`cointower:ip:${ip}`).digest("hex").slice(0, 16);
}

export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
