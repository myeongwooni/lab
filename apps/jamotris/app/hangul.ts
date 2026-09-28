// 자모를 합치고 풀고, 판 위에서 단어를 찾는 규칙을 모아 둡니다.

import { DICTIONARY } from "./dictionary";

const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
const JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
const JONG = ["", ..."ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ"];

// 떨어지는 조각은 된소리와 겹받침 없이 기본 자음과 홑모음만 나옵니다.
export const CONSONANTS = [..."ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ"];
export const VOWELS = [..."ㅏㅐㅑㅓㅔㅕㅗㅛㅜㅠㅡㅣ"];

// 모음 위에 모음이 떨어지면 겹모음이 됩니다. ㅗ 위에 ㅏ → ㅘ
const COMPOUND: Record<string, string> = {
  "ㅗㅏ": "ㅘ", "ㅗㅐ": "ㅙ", "ㅗㅣ": "ㅚ",
  "ㅜㅓ": "ㅝ", "ㅜㅔ": "ㅞ", "ㅜㅣ": "ㅟ",
  "ㅡㅣ": "ㅢ",
};

export type Tile =
  | { kind: "consonant"; ch: string }
  | { kind: "vowel"; ch: string }
  | { kind: "syllable"; cho: string; jung: string; jong: string };

export function tileText(tile: Tile) {
  if (tile.kind !== "syllable") return tile.ch;
  const code = 0xac00 + (CHO.indexOf(tile.cho) * 21 + JUNG.indexOf(tile.jung)) * 28 + JONG.indexOf(tile.jong);
  return String.fromCharCode(code);
}

export function jamoTile(ch: string): Tile {
  return CONSONANTS.includes(ch) ? { kind: "consonant", ch } : { kind: "vowel", ch };
}

/**
 * 떨어진 조각(top)이 바로 아래 칸(below)에 내려앉았을 때 합쳐진 결과. 못 합치면 null.
 * 자음은 모음에 붙어 첫소리가 되고, 받침 없는 글자에 떨어지면 받침이 됩니다.
 */
export function merge(below: Tile, top: Tile): Tile | null {
  if (top.kind === "syllable") return null;
  if (below.kind === "consonant") {
    return top.kind === "vowel" ? { kind: "syllable", cho: below.ch, jung: top.ch, jong: "" } : null;
  }
  if (below.kind === "vowel") {
    if (top.kind === "consonant") return { kind: "syllable", cho: top.ch, jung: below.ch, jong: "" };
    const compound = COMPOUND[below.ch + top.ch];
    return compound ? { kind: "vowel", ch: compound } : null;
  }
  if (below.jong) return null;
  if (top.kind === "consonant") return { ...below, jong: top.ch };
  const compound = COMPOUND[below.jung + top.ch];
  return compound ? { ...below, jung: compound } : null;
}

/** 한 글자를 떨어뜨려야 하는 자모 순서로 풉니다. 조각으로 만들 수 없는 글자면 null. */
function dropOrder(syllable: string): string[] | null {
  const code = syllable.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return null;
  const cho = CHO[Math.floor(code / 588)];
  const jung = JUNG[Math.floor((code % 588) / 28)];
  const jong = JONG[code % 28];
  if (!CONSONANTS.includes(cho)) return null;
  if (jong && !CONSONANTS.includes(jong)) return null;
  let vowels = [jung];
  if (!VOWELS.includes(jung)) {
    const pair = Object.keys(COMPOUND).find((key) => COMPOUND[key] === jung);
    if (!pair) return null;
    vowels = [...pair];
  }
  return [cho, ...vowels, ...(jong ? [jong] : [])];
}

// 떨어뜨릴 단어는 누구나 아는 두세 글자 낱말에서 고릅니다. 조각으로 못 만드는 단어는 아래에서 걸러집니다.
const RAW_WORDS = `
나무 바다 하늘 구름 바람 노을 이슬 소나기 무지개 별빛 달빛 햇빛 새벽 아침 저녁 오후 여름 가을 겨울 봄비
사자 호랑이 고양이 강아지 토끼 여우 늑대 사슴 너구리 다람쥐 코끼리 기린 하마 오리 거위 참새 제비 부엉이 고래 상어
문어 오징어 새우 게 조개 거북이 나비 벌 개미 거미 모기 파리 매미 사마귀 두더지 원숭이 판다 펭귄 낙타 염소
사과 포도 수박 참외 딸기 바나나 자두 앵두 복숭아 귤 레몬 키위 망고 배 감 밤 호두 땅콩 대추 수세미
우유 두부 김치 라면 국수 만두 떡 김밥 비빔밥 된장 고추 마늘 양파 감자 고구마 오이 호박 당근 버섯 배추
피자 치즈 버터 과자 사탕 초코 케이크 커피 녹차 주스 콜라 사이다 소금 설탕 간장 식초 빵 밥 국 반찬
엄마 아빠 누나 오빠 언니 동생 아기 할머니 할아버지 삼촌 이모 고모 친구 선생님 가족 부부 이웃 손님 사장 기사
머리 얼굴 눈썹 코 입술 이마 볼 귀 목 어깨 허리 다리 무릎 발 손 가슴 배꼽 손가락 발가락 머리카락
학교 교실 공부 숙제 시험 방학 연필 지우개 공책 가방 책상 의자 칠판 분필 도서관 운동장 급식 소풍 졸업 입학
기차 버스 자동차 비행기 배낭 자전거 택시 지하철 오토바이 트럭 도로 다리미 신호등 정류장 공항 항구 기지
사랑 우정 행복 기쁨 슬픔 눈물 웃음 마음 생각 꿈 소원 약속 희망 용기 추억 비밀 거짓말 선물 편지 노래
음악 미술 체육 영화 연극 사진 그림 춤 피아노 기타 드럼 북 가수 배우 화가 작가 요리사 의사 간호사 경찰
축구 야구 농구 배구 수영 달리기 줄넘기 태권도 스키 등산 낚시 바둑 장기 퍼즐 게임 공 모자 장갑 양말 신발
바지 치마 셔츠 코트 조끼 안경 우산 시계 반지 목도리 수건 비누 치약 칫솔 거울 이불 베개 침대 소파 냉장고
나라 서울 부산 제주 강 산 섬 호수 들판 숲 동굴 사막 바위 모래 파도 해변 등대 마을 도시 시장
하나 다섯 여섯 일곱 여덟 아홉 열 스물 서른 마흔 쉰 백 천 만 오늘 내일 어제 모레 지금 나중
구두 가수 기도 도시 모기 보리 부자 소리 수도 아이 오이 이마 자리 주사 지도 차도 코너 파도 포수 하루
가구 가시 거리 고기 구이 기러기 나이 너비 노래 누구 다리 대나무 도토리 마루 머루 모래 바구니 보자기 비누 사다리
소나무 수저 아버지 어머니 요리 우리 자두 조기 주머니 지구 차 치마 커피 크기 토마토 파티 하마 허수아비 호미
가방 가족 강물 개구리 거울 고향 공원 과일 교회 구멍 국물 그네 기억 기운 꽃잎 날개 냄새 눈사람 달걀 대문
동물 돌멩이 마술 만화 모험 목욕 물감 바늘 방울 벽돌 별명 보물 봉투 불꽃 사탕 산책 상자 생일 선물 세상
소풍 손잡이 송이 수박 시간 신문 쌀 안개 약국 얼음 연못 열쇠 옷장 우물 은행 이름 인형 일기 장난감 저금통
전화 정원 종이 주전자 줄 지갑 창문 천둥 촛불 침 컵 탑 태양 통 파랑 풍선 하품 한글 할일 햄버거
`;

const WORD_LIST = RAW_WORDS.split(/\s+/).filter(
  (word) => word.length >= 2 && [...word].every((syllable) => dropOrder(syllable)),
);

// 판 위에서 알아보는 단어는 큰 명사 사전까지 넓혀, 떨어뜨리지 않은 단어도 만들면 터집니다.
export const WORDS = new Set([...WORD_LIST, ...DICTIONARY.split(" ")]);

/** 다음에 떨어질 자모 묶음. 단어 하나를 순서대로 풀어 주고, 가끔 아무 자모를 하나 섞습니다. */
export function nextBatch(random: () => number = Math.random): string[] {
  const word = WORD_LIST[Math.floor(random() * WORD_LIST.length)];
  const batch = [...word].flatMap((syllable) => dropOrder(syllable)!);
  if (random() < 0.35) {
    const pool = random() < 0.5 ? CONSONANTS : VOWELS;
    batch.splice(Math.floor(random() * (batch.length + 1)), 0, pool[Math.floor(random() * pool.length)]);
  }
  return batch;
}

export type Board = (Tile | null)[][];

export type Found = { word: string; cells: [number, number][] };

/**
 * 가로(왼쪽→오른쪽)와 세로(위→아래)로 이어진 글자 가운데 사전에 있는 단어를 모두 찾습니다.
 * 같은 줄에서는 긴 단어를 먼저 잡고, 이미 잡힌 칸과 겹치는 짧은 단어는 건너뜁니다.
 */
export function findWords(board: Board): Found[] {
  const rows = board.length;
  const cols = board[0].length;
  const lines: [number, number][][] = [];
  for (let r = 0; r < rows; r++) lines.push(Array.from({ length: cols }, (_, c) => [r, c] as [number, number]));
  for (let c = 0; c < cols; c++) lines.push(Array.from({ length: rows }, (_, r) => [r, c] as [number, number]));

  const found: Found[] = [];
  for (const line of lines) {
    const taken = new Set<number>();
    const text = line.map(([r, c]) => {
      const tile = board[r][c];
      return tile?.kind === "syllable" ? tileText(tile) : " ";
    });
    for (let length = Math.min(5, line.length); length >= 2; length--) {
      for (let start = 0; start + length <= line.length; start++) {
        const word = text.slice(start, start + length).join("");
        if (!WORDS.has(word)) continue;
        const span = Array.from({ length }, (_, i) => start + i);
        if (span.some((i) => taken.has(i))) continue;
        span.forEach((i) => taken.add(i));
        found.push({ word, cells: span.map((i) => line[i]) });
      }
    }
  }
  return found;
}
