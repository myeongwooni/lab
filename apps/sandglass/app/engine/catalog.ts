import type { ChapterId, CharId, EndingId } from "./script";

// 이름표 색. 표에 없는 화자는 기본색입니다.
export const SPEAKER_COLORS: Record<string, string> = {
  에스텔: "#ecd9a6",
  카시안: "#a9c0e6",
  루시엔: "#cfc8f0",
  미렐: "#f4b0a6",
  테오: "#bfdc98",
  이졸데: "#eb9aac",
  그레고르: "#dcc088",
  사공: "#93cccc",
  노엘: "#f2d88a",
  황제: "#e6d2a0",
  소년: "#c9d3ea",
  소녀: "#f1eee6",
};

export const CHARACTER_NAMES: Record<CharId, string> = {
  cassian: "카시안 아르덴",
  lucien: "루시엔 벨",
  mirelle: "미렐",
  theo: "테오",
  isolde: "이졸데 오르비스",
  gregor: "그레고르 할데인",
  ferryman: "무명의 사공",
  noel: "노엘",
  emperor: "아우렐리우스 3세",
  young: "소년 기사",
};

export type Route = "common" | "cassian" | "lucien" | "true";

export type ChapterInfo = { id: ChapterId; label: string; title: string; route: Route };

export const CHAPTERS: ChapterInfo[] = [
  { id: "prologue", label: "프롤로그", title: "별지는 밤", route: "common" },
  { id: "ch01", label: "제1장", title: "별 없는 필경사", route: "common" },
  { id: "ch02", label: "제2장", title: "백일서", route: "common" },
  { id: "ch03", label: "제3장", title: "별등제", route: "common" },
  { id: "ch04", label: "제4장", title: "금서고", route: "common" },
  { id: "ch05", label: "제5장", title: "이름을 부르는 법", route: "common" },
  { id: "c06", label: "제6장", title: "눈의 나라로", route: "cassian" },
  { id: "c07", label: "제7장", title: "당신의 일생", route: "cassian" },
  { id: "c08", label: "제8장", title: "서약의 밤", route: "cassian" },
  { id: "l06", label: "제6장", title: "스승의 죄", route: "lucien" },
  { id: "l07", label: "제7장", title: "지운 자의 이름", route: "lucien" },
  { id: "l08", label: "제8장", title: "당신이 지운 이름", route: "lucien" },
  { id: "t06", label: "제6장", title: "서쪽 끝으로", route: "true" },
  { id: "t07", label: "제7장", title: "잊혀진 사람들의 마을", route: "true" },
  { id: "t08", label: "제8장", title: "이름의 바다", route: "true" },
  { id: "t09", label: "제9장", title: "이름을 잃은 별에게", route: "true" },
];

export const ROUTE_NAMES: Record<Route, string> = {
  common: "공통",
  cassian: "카시안",
  lucien: "루시엔",
  true: "진실",
};

export function chapterInfo(id: string): ChapterInfo {
  return CHAPTERS.find((c) => c.id === id) ?? CHAPTERS[0];
}

export type EndingInfo = { id: EndingId; title: string; kind: "TRUE" | "GOOD" | "NORMAL" | "BAD"; route: Route; hint: string };

export const ENDINGS: EndingInfo[] = [
  { id: "c_good", title: "이름을 부르는 사람", kind: "GOOD", route: "cassian", hint: "그가 불러 온 노래의 빈 줄을, 끝까지 채울 것." },
  { id: "c_bad", title: "별이 된 기사", kind: "NORMAL", route: "cassian", hint: "카시안 루트에서 이르는 또 하나의 끝." },
  { id: "l_good", title: "다시 쓰는 첫 줄", kind: "GOOD", route: "lucien", hint: "그의 첫 단어와, 그를 용서한 날을 잊지 말 것." },
  { id: "l_bad", title: "빈 페이지", kind: "BAD", route: "lucien", hint: "루시엔 루트에서 이르는 또 하나의 끝." },
  { id: "early", title: "충실한 필경사", kind: "BAD", route: "common", hint: "금서고 앞에서 돌아선다면." },
  { id: "true", title: "이름을 잃은 별에게", kind: "TRUE", route: "true", hint: "두 사람의 이야기를 모두 본 뒤, 누구의 별도 아닌 길로." },
];

export function endingInfo(id: string): EndingInfo {
  return ENDINGS.find((e) => e.id === id) ?? ENDINGS[0];
}

export const CG_TITLES: Record<string, string> = {
  cg_oath: "월하화 아래의 서약",
  cg_newborn: "새로 켜진 별",
  cg_meet: "침묵탑의 달빛",
  cg_letter: "타들어 가는 첫 줄",
  cg_lantern: "서른 걸음의 다리",
  cg_vault: "빈 책의 흔적",
  cg_umbrella: "젖은 어깨",
  cg_confession: "창살 너머의 손",
  cg_snow_kiss: "눈의 나라",
  cg_book: "당신의 일생을 쓰는 밤",
  cg_c_good: "새벽별",
  cg_c_bad: "이천오백오십다섯 통",
  cg_lucien_teach: "첫 단어",
  cg_l_good: "두 사람의 펜",
  cg_l_bad: "주인 없는 안경",
  cg_sea: "무명해의 나룻배",
  cg_depth: "이름의 바다",
  cg_sisters: "찻잔 두 개",
  cg_true: "이름을 부르는 새벽",
};

export const CG_ORDER = Object.keys(CG_TITLES);
