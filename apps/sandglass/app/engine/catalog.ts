import type { ChapterId, CharId, DeathId, EndingId } from "./script";

// 이름표 색. 표에 없는 화자는 기본색입니다.
export const SPEAKER_COLORS: Record<string, string> = {
  서하: "#ffe2a8",
  엘리오스: "#e89a9a",
  라젤: "#e6b878",
  시안: "#a9c8f2",
  리리: "#f5b27c",
  토비: "#c9d88f",
  세실리아: "#f4c6d4",
  아델하르트: "#e8d38e",
  "재의 왕": "#c9c4bc",
  무면: "#e9e6e0",
  헤르만: "#b8b2c8",
  민재: "#b9d4f0",
  "박 선생": "#a8bfd8",
  수간호사: "#b8c7d6",
  마르타: "#c7b39a",
  핀: "#d8c890",
  미아: "#f0d0b0",
  한나: "#e0bf98",
  국왕: "#e6d2a0",
};

export const CHARACTER_NAMES: Record<CharId, string> = {
  elios: "엘리오스 반 에스페리아",
  razel: "라젤 크로우",
  sian: "시안 드 루베르",
  lili: "리리",
  toby: "토비",
  cecilia: "세실리아 반 에스페리아",
  adelhart: "아델하르트 반 에스페리아",
  ashking: "재의 왕",
  faceless: "무면",
  herman: "헤르만",
};

export type Route = "common" | "elios" | "razel" | "sian" | "true";

export type ChapterInfo = { id: ChapterId; label: string; title: string; route: Route };

export const CHAPTERS: ChapterInfo[] = [
  { id: "prologue", label: "프롤로그", title: "4시 44분", route: "common" },
  { id: "ch01", label: "제1장", title: "첫 번째 새벽", route: "common" },
  { id: "ch02", label: "제2장", title: "말할 수 없는 것", route: "common" },
  { id: "ch03", label: "제3장", title: "시계의 집", route: "common" },
  { id: "ch04", label: "제4장", title: "일곱 개의 찻잔", route: "common" },
  { id: "ch05", label: "제5장", title: "새벽제 전야", route: "common" },
  { id: "e06", label: "제6장", title: "멈춘 시계를 고치는 법", route: "elios" },
  { id: "e07", label: "제7장", title: "재의 왕", route: "elios" },
  { id: "e08", label: "제8장", title: "여명탑", route: "elios" },
  { id: "r06", label: "제6장", title: "잿빛 늑대", route: "razel" },
  { id: "r07", label: "제7장", title: "천 번 죽는 법", route: "razel" },
  { id: "r08", label: "제8장", title: "늑대의 새벽", route: "razel" },
  { id: "s06", label: "제6장", title: "기시의 눈", route: "sian" },
  { id: "s07", label: "제7장", title: "거꾸로 도는 시계", route: "sian" },
  { id: "s08", label: "제8장", title: "멈춘 시간의 탑", route: "sian" },
  { id: "t06", label: "제6장", title: "틈새의 문", route: "true" },
  { id: "t07", label: "제7장", title: "재의 왕의 999번", route: "true" },
  { id: "t08", label: "제8장", title: "되돌릴 수 없는 하루", route: "true" },
  { id: "t09", label: "제9장", title: "천 번째 새벽, 당신에게", route: "true" },
];

export const ROUTE_NAMES: Record<Route, string> = {
  common: "공통",
  elios: "엘리오스",
  razel: "라젤",
  sian: "시안",
  true: "진실",
};

export const ROUTE_ORDER: Route[] = ["common", "elios", "razel", "sian", "true"];

export function chapterInfo(id: string): ChapterInfo {
  return CHAPTERS.find((c) => c.id === id) ?? CHAPTERS[0];
}

export type EndingKind = "TRUE" | "GOOD" | "NORMAL" | "BAD" | "ANOTHER";
export type EndingInfo = { id: EndingId; title: string; kind: EndingKind; route: Route; hint: string };

export const ENDINGS: EndingInfo[] = [
  { id: "e_good", title: "새벽을 부르는 이름", kind: "GOOD", route: "elios", hint: "공방의 춤에서 한 약속과, 어머니의 일지를 끝까지." },
  { id: "e_bad", title: "재의 왕관", kind: "BAD", route: "elios", hint: "엘리오스 루트에서 이르는 또 하나의 끝." },
  { id: "r_good", title: "늑대의 귀향", kind: "GOOD", route: "razel", hint: "막내를 살리고, 짐을 반만 나눠 들 것." },
  { id: "r_bad", title: "마지막 모래 한 알", kind: "BAD", route: "razel", hint: "라젤 루트에서 이르는 또 하나의 끝." },
  { id: "s_good", title: "지금에 머무는 법", kind: "GOOD", route: "sian", hint: "멈춘 오르골의 태엽을 감고, 그를 용서할 것." },
  { id: "s_bad", title: "모래 속의 누이", kind: "BAD", route: "sian", hint: "시안 루트에서 이르는 또 하나의 끝." },
  { id: "sand_room", title: "모래의 방", kind: "BAD", route: "common", hint: "가장 어두운 밤, 틈새의 방에서 멈춰 선다면." },
  { id: "alone", title: "혼자 맞는 새벽", kind: "NORMAL", route: "common", hint: "축제 전야의 마지막 갈림길에서, 아무도 고르지 않는다면." },
  { id: "true", title: "천 번째 새벽, 당신에게", kind: "TRUE", route: "true", hint: "세 사람의 새벽을 모두 본 뒤, 재의 왕을 만나러." },
  { id: "return", title: "4시 44분의 옥상", kind: "ANOTHER", route: "true", hint: "마지막 새벽에, 다른 약속을 고른다면." },
];

export function endingInfo(id: string): EndingInfo {
  return ENDINGS.find((e) => e.id === id) ?? ENDINGS[0];
}

export const CG_TITLES: Record<string, string> = {
  cg_fall: "하늘로 떨어지는 모래",
  cg_first_death: "넷에서 멈춘 맥박",
  cg_ashking: "잿더미 왕좌",
  cg_sand: "모래가 된 대답",
  cg_demon: "그림자의 칼날",
  cg_clocks: "수백 개의 째깍임",
  cg_tea: "식탁보에 번지는 홍차",
  cg_lili: "꺼져 가는 여우불",
  cg_lanterns: "운하 위의 등불",
  cg_betrayal: "종탑의 흰 리본",
  cg_e_waltz: "태엽 왈츠",
  cg_unmask: "가면 아래의 얼굴",
  cg_e_good: "새벽을 부르는 이름",
  cg_e_bad: "재의 왕관",
  cg_r_back: "등을 맡긴다는 것",
  cg_r_good: "재 위에 돋은 새싹",
  cg_r_bad: "마지막 모래 한 알",
  cg_s_eye: "시계 문자판의 눈동자",
  cg_s_blade: "울면서 찌르는 칼",
  cg_s_good: "지금이라는 오르골",
  cg_s_bad: "모래 속의 누이",
  cg_two_kings: "두 명의 엘리오스",
  cg_shatter: "깨지는 역시계",
  cg_true: "천 번째 새벽",
  cg_return: "4시 44분의 캔커피",
};

export const CG_ORDER = Object.keys(CG_TITLES);

// 사망 기록 도감. 잠긴 동안은 hint만, 해금되면 제목·장·묘비명을 보여 줍니다.
export type DeathKind = "story" | "choice";
export type DeathInfo = { id: DeathId; title: string; chapter: ChapterId; kind: DeathKind; epitaph: string; hint: string };

export const DEATHS: DeathInfo[] = [
  { id: "d_chapel", title: "예배당의 첫 밤", chapter: "ch01", kind: "story", epitaph: "맥박을 셌다. 넷에서 멈췄다. 처음이라 몰랐다, 그게 끝이 아니라는 걸.", hint: "첫날 밤, 아이를 쫓아서." },
  { id: "d_sand", title: "모래가 된 고백", chapter: "ch02", kind: "story", epitaph: "사실대로 말했을 뿐이다. 그의 손끝부터 모래가 되었다.", hint: "진실은 때로 가장 잔인한 칼이 된다." },
  { id: "d_fire", title: "불타는 여관", chapter: "ch02", kind: "story", epitaph: "숨는다고 오지 않는 밤은 없었다. 문밖엔 흰 가면이 서 있었다.", hint: "문을 잠그고 아무것도 하지 않는다면." },
  { id: "d_alone", title: "혼자 간 예배당", chapter: "ch02", kind: "choice", epitaph: "한 번만 더 확인하려 했다. 혼자서는 안 된다는 것을, 다시 배웠다.", hint: "모두를 모으기 전에, 서두른다면." },
  { id: "d_poison", title: "첫 번째 찻잔", chapter: "ch03", kind: "story", epitaph: "입술이 저렸다. 국왕과 같은 증상이라는 걸, 쓰러지면서 알았다.", hint: "따뜻한 식탁, 따뜻한 차." },
  { id: "d_king", title: "너무 큰 목소리", chapter: "ch03", kind: "choice", epitaph: "옳은 말이었다. 들어서는 안 될 사람까지 들었을 뿐.", hint: "진단은 정확했지만, 청중이 너무 많았다." },
  { id: "d_stairs", title: "나선 계단의 손", chapter: "ch04", kind: "story", epitaph: "구르며 계단을 셌다. 마흔셋. 등에 닿은 손은 장갑을 끼고 있었다.", hint: "독을 피한 밤, 어둠 속의 계단." },
  { id: "d_lili", title: "여우의 밤", chapter: "ch04", kind: "story", epitaph: "서른, 서른, 서른. 작은 손은 끝내 다시 따뜻해지지 않았다.", hint: "누군가 당신을 감싸 준 밤." },
  { id: "d_accuse", title: "증거 없는 고발", chapter: "ch04", kind: "choice", epitaph: "그는 부드럽게 웃으며 부인했다. 그날 밤이 마지막이었다.", hint: "식탁 앞에서, 증거 없이." },
  { id: "d_bell", title: "종탑의 성녀", chapter: "ch05", kind: "story", epitaph: "언니는 몇 번째예요? 대답하기도 전에, 등불의 도시가 멀어졌다.", hint: "축제의 밤, 가장 높은 곳에서." },
  { id: "d_slander", title: "광장의 교수대", chapter: "ch05", kind: "choice", epitaph: "진실을 외쳤다. 광장은 천사의 편이었다.", hint: "모두가 사랑하는 사람을, 모두 앞에서." },
  { id: "d_e_follow", title: "뒤를 밟은 밤", chapter: "e06", kind: "choice", epitaph: "그녀의 콧노래를 따라갔다. 골목 끝에는 얼굴 없는 것들이 기다렸다.", hint: "밤길, 혼자서 누군가의 뒤를." },
  { id: "d_e_fire", title: "불타는 시계의 집", chapter: "e06", kind: "story", epitaph: "시계들이 불 속에서 하나씩 멈췄다. 그를 감싼 등이 뜨거웠다.", hint: "수백 개의 시계가 멈추는 밤." },
  { id: "d_e_rush", title: "너무 이른 제단", chapter: "e07", kind: "choice", epitaph: "새벽은 기다려 주지 않았다. 하지만 서두르는 사람도 기다려 주지 않았다.", hint: "계획이 서기 전에, 가장 높은 곳으로." },
  { id: "d_r_nest", title: "늑대 굴의 습격", chapter: "r06", kind: "story", epitaph: "그의 목에 손가락을 댔다. 없었다. 그다음은 내 차례였다.", hint: "늑대들이 잠든 밤." },
  { id: "d_r_third", title: "세 번째 칼", chapter: "r07", kind: "story", epitaph: "화살, 무너진 벽, 칼. 그는 매번 다르게 죽었고, 나는 매번 같았다.", hint: "몇 번을 되풀이해도, 그는 앞에 선다." },
  { id: "d_r_cellar", title: "지하 수로", chapter: "r07", kind: "choice", epitaph: "잿빛 결정이 반짝였다. 물은 차갑고, 어둠은 깊었다.", hint: "발밑의 물길로, 먼저 혼자." },
  { id: "d_s_archive", title: "금지된 서고", chapter: "s06", kind: "choice", epitaph: "찾던 문헌은 거기 있었다. 문헌을 지키는 것도.", hint: "읽어서는 안 되는 책이 있는 곳에, 혼자." },
  { id: "d_s_blade", title: "청탑의 칼", chapter: "s07", kind: "story", epitaph: "그는 울면서 찔렀다. 12년 전으로 가면, 당신은 아프지 않을 거라며.", hint: "별 보는 테라스에서 들은 진실." },
];

export function deathInfo(id: string): DeathInfo | undefined {
  return DEATHS.find((d) => d.id === id);
}
