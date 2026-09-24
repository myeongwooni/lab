export type GradeId = "daikichi" | "kichi" | "chukichi" | "shokichi" | "suekichi" | "kyo" | "daikyo";

export type Mood = "sparkle" | "happy" | "smile" | "calm" | "sleepy" | "sad" | "cry";

export type Grade = {
  id: GradeId;
  label: string;
  cat: string;
  coat: CoatId;
  mood: Mood;
  weight: number;
  tier: "good" | "okay" | "bad";
  meow: string;
};

export type CoatId = "gold" | "cheese" | "calico" | "tuxedo" | "tabby" | "white" | "black";

// 가중치 합은 100입니다. 대흉은 일부러 드물게 둡니다.
export const GRADES: Grade[] = [
  { id: "daikichi", label: "대길", cat: "복고양이", coat: "gold", mood: "sparkle", weight: 8, tier: "good", meow: "오늘은 뭘 해도 되는 날이냥!" },
  { id: "kichi", label: "길", cat: "치즈냥", coat: "cheese", mood: "happy", weight: 17, tier: "good", meow: "꼬리가 절로 올라가는 하루다냥." },
  { id: "chukichi", label: "중길", cat: "삼색냥", coat: "calico", mood: "smile", weight: 22, tier: "good", meow: "적당히 좋은 게 제일 좋다냥." },
  { id: "shokichi", label: "소길", cat: "턱시도냥", coat: "tuxedo", mood: "calm", weight: 20, tier: "okay", meow: "작은 행운이 발밑에 굴러온다냥." },
  { id: "suekichi", label: "말길", cat: "고등어냥", coat: "tabby", mood: "sleepy", weight: 18, tier: "okay", meow: "천천히 가면 끝에 좋은 일이 있다냥." },
  { id: "kyo", label: "흉", cat: "흰둥냥", coat: "white", mood: "sad", weight: 12, tier: "bad", meow: "오늘은 이불 속이 제일 안전하다냥…" },
  { id: "daikyo", label: "대흉", cat: "까망냥", coat: "black", mood: "cry", weight: 3, tier: "bad", meow: "바닥을 찍었으니 이제 오를 일만 남았다냥!" },
];

type Pool = Record<Grade["tier"], string[]>;

const WISH: Pool = {
  good: ["생각보다 빨리 이루어진다냥", "말해 보면 들어준다냥", "이미 반쯤 이루어졌다냥"],
  okay: ["조금 돌아가지만 닿는다냥", "기다리면 소식이 온다냥", "한 번 더 부탁해 보라냥"],
  bad: ["오늘은 접어 두라냥", "욕심을 반만 덜라냥", "다음 달의 나에게 맡기라냥"],
};

const LOVE: Pool = {
  good: ["먼저 인사하면 잘 풀린다냥", "눈이 마주치면 웃어 주라냥", "오래된 인연에게 연락이 온다냥"],
  okay: ["밀당은 쉬고 솔직하게냥", "천천히 가까워지는 중이다냥", "답장은 조금 늦게 와도 괜찮다냥"],
  bad: ["괜한 말은 삼키라냥", "혼자만의 시간이 약이다냥", "오늘은 나를 먼저 챙기라냥"],
};

const WORK: Pool = {
  good: ["미뤄 둔 일을 끝낼 수 있다냥", "칭찬을 들을 예감이다냥", "새 아이디어가 번뜩인다냥"],
  okay: ["하나씩 차근차근 하라냥", "점심 먹고 집중이 잘 된다냥", "메모해 두면 쓸 데가 있다냥"],
  bad: ["저장 버튼을 자주 누르라냥", "마감은 두 번 확인하라냥", "큰 결정은 내일로 미루라냥"],
};

const MONEY: Pool = {
  good: ["뜻밖의 쿠폰이 들어온다냥", "잊었던 돈을 찾는다냥", "사고 싶던 게 할인한다냥"],
  okay: ["지갑은 닫아 두면 든든하다냥", "간식비 정도는 괜찮다냥", "영수증을 챙기라냥"],
  bad: ["충동구매 주의보다냥", "장바구니에만 담아 두라냥", "빌려준 돈은 잠시 잊으라냥"],
};

const HEALTH: Pool = {
  good: ["몸이 가볍다냥, 산책 가라냥", "푹 자고 개운하게 일어난다냥", "기지개 한 번이면 충분하다냥"],
  okay: ["물을 한 잔 더 마시라냥", "스트레칭을 잊지 말라냥", "일찍 자면 내일이 좋다냥"],
  bad: ["발밑을 조심하라냥", "따뜻하게 입으라냥", "낮잠이 필요하다냥"],
};

const ITEMS = [
  "츄르", "털실 뭉치", "종이 상자", "따뜻한 캔커피", "양말 한 짝", "방울", "생선 모양 과자",
  "햇볕 드는 창가", "빨간 우산", "새 볼펜", "손수건", "귤", "고양이 스티커", "보리차",
];

const COLORS = [
  { name: "귤색", hex: "#f39a3c" },
  { name: "벚꽃색", hex: "#f7a8b8" },
  { name: "하늘색", hex: "#7cc4f0" },
  { name: "새싹색", hex: "#8fd694" },
  { name: "레몬색", hex: "#f6dc5b" },
  { name: "라벤더색", hex: "#b7a3e8" },
  { name: "크림색", hex: "#f6ebcf" },
  { name: "민트색", hex: "#7fdcc7" },
];

const DIRECTIONS = ["동쪽", "서쪽", "남쪽", "북쪽", "창가 쪽", "냉장고 쪽"];

export type Fortune = {
  grade: Grade;
  number: number;
  lines: { label: string; text: string }[];
  item: string;
  color: { name: string; hex: string };
  direction: string;
  luckyNumber: number;
};

// 같은 시드면 언제 열어 봐도 같은 쪽지가 나오도록 작고 결정적인 난수를 씁니다.
function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(random: () => number, list: T[]) {
  return list[Math.floor(random() * list.length)];
}

export function fortuneOf(seed: number): Fortune {
  const random = mulberry32(seed);

  let roll = random() * 100;
  let grade = GRADES[GRADES.length - 1];
  for (const candidate of GRADES) {
    if (roll < candidate.weight) {
      grade = candidate;
      break;
    }
    roll -= candidate.weight;
  }

  const tier = grade.tier;
  return {
    grade,
    number: Math.floor(random() * 100) + 1,
    lines: [
      { label: "소원", text: pick(random, WISH[tier]) },
      { label: "연애", text: pick(random, LOVE[tier]) },
      { label: "일·공부", text: pick(random, WORK[tier]) },
      { label: "금전", text: pick(random, MONEY[tier]) },
      { label: "건강", text: pick(random, HEALTH[tier]) },
    ],
    item: pick(random, ITEMS),
    color: pick(random, COLORS),
    direction: pick(random, DIRECTIONS),
    luckyNumber: Math.floor(random() * 9) + 1,
  };
}

export function randomSeed() {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return value[0];
}

// 자정 기준은 사용자의 현지 시각입니다.
export function todayKey(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function previousDayKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return todayKey(new Date(year, month - 1, day - 1));
}
