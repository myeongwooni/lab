import type { ArtId } from "./scenes";
import type { MonsterId, StatId } from "./engine";

// 시나리오 "꺼진 새벽 등불". 장면마다 그림, 게임 마스터의 서술, 선택지가 있습니다.

export type SceneId = "tavern" | "road" | "woods" | "swamp" | "camp" | "gate" | "hall" | "vault" | "lair";
export type EndingId = "hero" | "shadow" | "friend" | "fallen";

export type Goto =
  | { scene: SceneId }
  | { fight: MonsterId; win: SceneId | EndingId; flee?: SceneId; surprise?: boolean }
  | { ending: EndingId }
  | { stay: true };

export type Effects = {
  damage?: string; // 주사위 식
  heal?: "half" | "full";
  gold?: number;
  potion?: number;
  flag?: string;
};

export type Outcome = { text: string; effects?: Effects; go: Goto };

export type Choice = {
  label: string;
  check?: { stat: StatId; dc: number; advantageIf?: string[] };
  requires?: { flag?: string; notFlag?: string; gold?: number };
  once?: boolean; // 한 번 고르면 다시 나오지 않습니다
  pass: Outcome;
  fail?: Outcome;
};

export type Scene = {
  art: ArtId;
  title: string;
  text: string;
  notes?: { flag: string; text: string }[];
  choices: Choice[];
};

export const SCENES: Record<SceneId, Scene> = {
  tavern: {
    art: "tavern",
    title: "선술집 '녹슨 잔'",
    text:
      "빗소리가 지붕을 두드리는 밤. 벽난로 옆에 앉은 촌장이 당신을 부른다. " +
      "\"마을을 지키던 새벽 등불을 누가 훔쳐 갔소. 등불이 꺼진 뒤로 밤마다 서리가 내리지. " +
      "발자국은 북쪽 숲으로 이어졌다오. 부탁하오, 모험가.\"",
    choices: [
      {
        label: "주인장에게 소문을 캐묻는다",
        once: true,
        check: { stat: "cha", dc: 11 },
        pass: {
          text: "주인장이 목소리를 낮춘다. \"북쪽 유적에 새끼 용이 산다더군. 추위를 몹시 탄다지. 녀석 이름이 '잿불'이랬나.\"",
          effects: { flag: "rumor" },
          go: { stay: true },
        },
        fail: {
          text: "주인장은 말없이 잔만 닦는다. 괜히 술 한 잔 값으로 금화 2닢만 나갔다.",
          effects: { gold: -2 },
          go: { stay: true },
        },
      },
      {
        label: "물약을 산다 (금화 5)",
        once: true,
        requires: { gold: 5 },
        pass: { text: "주인장이 먼지 쌓인 선반에서 분홍빛 물약을 꺼내 준다.", effects: { gold: -5, potion: 1 }, go: { stay: true } },
      },
      {
        label: "등불을 찾아 길을 나선다",
        pass: { text: "망토를 여미고 빗속으로 나선다. 촌장이 문간에서 등을 지켜본다.", go: { scene: "road" } },
      },
    ],
  },

  road: {
    art: "road",
    title: "북쪽 갈림길",
    text:
      "비가 그치고 해가 뜬다. 마을을 벗어나자 길이 둘로 갈라진다. " +
      "이정표 왼쪽에는 '늑대 숲', 오른쪽에는 '안개 늪'. 둘 다 북쪽 유적으로 이어진다.",
    choices: [
      {
        label: "땅에 남은 흔적을 살핀다",
        once: true,
        check: { stat: "int", dc: 12 },
        pass: {
          text: "작은 발톱 자국, 그리고 풀이 새까맣게 그을린 자국. 무언가 뜨거운 것을 끌고 간 모양이다. 도둑은 사람이 아니다.",
          effects: { flag: "clue" },
          go: { stay: true },
        },
        fail: { text: "밤새 내린 비에 흔적이 다 씻겨 나갔다.", go: { stay: true } },
      },
      { label: "늑대 숲으로 간다", pass: { text: "빽빽한 침엽수 사이로 들어선다. 햇빛이 금세 사라진다.", go: { scene: "woods" } } },
      { label: "안개 늪으로 간다", pass: { text: "발밑이 질척해지고 안개가 피어오른다.", go: { scene: "swamp" } } },
    ],
  },

  woods: {
    art: "woods",
    title: "늑대 숲",
    text: "덤불 속에서 노란 눈 두 개가 번뜩인다. 뼈만 남은 늑대가 이빨을 드러내며 길을 막는다.",
    choices: [
      {
        label: "검을 뽑아 맞선다",
        pass: { text: "늑대가 으르렁거리며 달려든다!", go: { fight: "wolf", win: "camp", flee: "camp" } },
      },
      {
        label: "바람을 등지고 몰래 지나간다",
        check: { stat: "dex", dc: 12 },
        pass: { text: "바람 방향을 읽고 덤불 사이로 소리 없이 빠져나왔다. 늑대는 엉뚱한 쪽을 킁킁거린다.", go: { scene: "camp" } },
        fail: { text: "뚝! 마른 가지를 밟았다. 늑대가 달려든다!", go: { fight: "wolf", win: "camp", flee: "camp" } },
      },
      {
        label: "늑대의 습성을 떠올려 달랜다",
        check: { stat: "int", dc: 13 },
        pass: {
          text: "눈을 피하고 몸을 낮춘 채 천천히 물러선다. 늑대는 흥미를 잃고 사라졌다. 늑대가 있던 자리에 누군가 흘린 금화 주머니가 있다.",
          effects: { gold: 4 },
          go: { scene: "camp" },
        },
        fail: { text: "눈이 마주쳤다. 늑대는 그걸 도전으로 받아들였다!", go: { fight: "wolf", win: "camp", flee: "camp" } },
      },
    ],
  },

  swamp: {
    art: "swamp",
    title: "안개 늪",
    text:
      "발목까지 차오르는 늪. 안개 속 어딘가에서 꾸르륵, 거품이 올라온다. " +
      "저 앞에 쓰러진 모험가의 배낭이 반쯤 가라앉아 있다.",
    choices: [
      {
        label: "배낭을 힘껏 끌어올린다",
        check: { stat: "str", dc: 11 },
        pass: {
          text: "배낭을 건져 올렸다! 물약 하나와 금화 3닢. 그때 발밑 거품이 부풀어 오른다. 슬라임이다!",
          effects: { potion: 1, gold: 3 },
          go: { fight: "slime", win: "camp", flee: "camp" },
        },
        fail: {
          text: "배낭은 꿈쩍도 않고 오히려 몸이 빨려 들어간다. 허우적대는 사이 슬라임이 솟아오른다!",
          effects: { damage: "1d4" },
          go: { fight: "slime", win: "camp", flee: "camp" },
        },
      },
      {
        label: "마른 돌만 밟고 조용히 건넌다",
        check: { stat: "dex", dc: 11 },
        pass: { text: "돌에서 돌로 가볍게 뛰어 늪을 건넜다. 뒤에서 아쉬운 듯한 꾸르륵 소리가 들린다.", go: { scene: "camp" } },
        fail: { text: "첨벙! 물보라 속에서 초록 덩어리가 솟구친다!", go: { fight: "slime", win: "camp", flee: "camp" } },
      },
    ],
  },

  camp: {
    art: "camp",
    title: "언덕 위 야영지",
    text:
      "해가 지고 별이 뜬다. 유적이 내려다보이는 언덕에서 모닥불을 피운다. " +
      "지나가던 떠돌이 상인이 불가에 짐을 내려놓는다. \"좋은 밤이오. 뭐 필요한 거라도?\"",
    choices: [
      {
        label: "모닥불 곁에서 푹 잔다",
        once: true,
        pass: { text: "타닥타닥 불 소리를 들으며 깊이 잠들었다. 몸이 한결 가볍다.", effects: { heal: "half" }, go: { stay: true } },
      },
      {
        label: "물약을 산다 (금화 5)",
        once: true,
        requires: { gold: 5 },
        pass: { text: "\"탁월한 선택이오.\" 상인이 윙크하며 물약을 건넨다.", effects: { gold: -5, potion: 1 }, go: { stay: true } },
      },
      {
        label: "낡은 방패를 산다 (금화 6, 방어 +1)",
        once: true,
        requires: { gold: 6, notFlag: "shield" },
        pass: { text: "흠집투성이지만 튼튼한 방패다. 팔에 끼우니 든든하다.", effects: { gold: -6, flag: "shield" }, go: { stay: true } },
      },
      {
        label: "상인에게 유적 이야기를 듣는다",
        once: true,
        check: { stat: "cha", dc: 12 },
        pass: {
          text: "\"유적 안쪽 방에 보물상자가 있지. 근데 그거, 너무 반짝이지 않소? 반짝이는 건 대개 이빨이 있더라고.\"",
          effects: { flag: "mimicTip" },
          go: { stay: true },
        },
        fail: { text: "상인은 하품만 하다가 먼저 잠들어 버렸다.", go: { stay: true } },
      },
      { label: "유적으로 내려간다", pass: { text: "불씨를 밟아 끄고 어둠 속 유적으로 향한다.", go: { scene: "gate" } } },
    ],
  },

  gate: {
    art: "gate",
    title: "유적의 돌문",
    text: "이끼 낀 돌문에 푸른 룬이 희미하게 빛난다. 문은 굳게 닫혀 있고, 룬 사이에는 알 수 없는 글귀가 새겨져 있다.",
    choices: [
      {
        label: "룬을 해독한다",
        check: { stat: "int", dc: 13 },
        pass: {
          text: "'추위를 두려워하는 불의 아이, 잿불이 이곳에 잠든다.' 룬이 차례로 꺼지며 문이 스르르 열린다.",
          effects: { flag: "runes" },
          go: { scene: "hall" },
        },
        fail: { text: "잘못 읽은 룬이 번쩍! 전격이 손끝을 태운다. 그 충격에 문이 덜컹 열렸다.", effects: { damage: "1d6" }, go: { scene: "hall" } },
      },
      {
        label: "어깨로 문을 밀어젖힌다",
        check: { stat: "str", dc: 13 },
        pass: { text: "끄으응! 돌문이 비명을 지르며 밀려난다.", go: { scene: "hall" } },
        fail: { text: "어깨가 먼저 비명을 질렀다. 몇 번을 더 들이받고서야 문이 열렸다.", effects: { damage: "1d4" }, go: { scene: "hall" } },
      },
      {
        label: "문틈으로 몸을 비집어 넣는다",
        check: { stat: "dex", dc: 12 },
        pass: { text: "숨을 참고 좁은 틈으로 쏙 빠져 들어갔다.", go: { scene: "hall" } },
        fail: { text: "허리가 끼었다! 겨우 빠져나오느라 여기저기 긁혔다.", effects: { damage: "1d4" }, go: { scene: "hall" } },
      },
    ],
  },

  hall: {
    art: "hall",
    title: "고블린 소굴",
    text: "문 너머는 고블린들의 야영지다. 대부분 곯아떨어졌지만, 보초 하나가 창을 끌어안고 꾸벅꾸벅 졸고 있다. 안쪽으로 가는 길은 보초 뒤에 있다.",
    choices: [
      {
        label: "졸고 있는 보초를 덮친다",
        pass: { text: "보초가 화들짝 깨어나 창을 겨눈다!", go: { fight: "goblin", win: "vault", surprise: true } },
      },
      {
        label: "고블린 말로 교대 시간이라고 속인다",
        check: { stat: "cha", dc: 12 },
        pass: { text: "\"꾸륵, 교대다!\" 보초가 반가운 얼굴로 창을 넘기고 천막으로 들어간다.", effects: { gold: 2 }, go: { scene: "vault" } },
        fail: { text: "\"…너, 고블린 아니잖아?\" 보초가 호각을 문다!", go: { fight: "goblin", win: "vault" } },
      },
      {
        label: "그림자를 따라 몰래 지나간다",
        check: { stat: "dex", dc: 13 },
        pass: { text: "횃불 빛이 닿지 않는 벽을 따라 소리 없이 지나갔다.", go: { scene: "vault" } },
        fail: { text: "뼈다귀를 밟았다. 우지끈! 보초가 벌떡 일어선다!", go: { fight: "goblin", win: "vault" } },
      },
    ],
  },

  vault: {
    art: "vault",
    title: "보물 방",
    text: "안쪽 방 한가운데, 받침대 위에 보물상자 하나가 놓여 있다. 반짝인다. 지나치게 반짝인다.",
    notes: [{ flag: "mimicTip", text: "상인의 말이 떠오른다. 반짝이는 건 대개 이빨이 있다." }],
    choices: [
      {
        label: "상자를 자세히 살핀다",
        once: true,
        requires: { notFlag: "mimicSeen" },
        check: { stat: "int", dc: 12, advantageIf: ["mimicTip"] },
        pass: { text: "경첩 틈으로 끈적한 침이 흐른다. 이건 상자가 아니다. 미믹이다!", effects: { flag: "mimicSeen" }, go: { stay: true } },
        fail: { text: "아무리 봐도 평범한 보물상자 같다.", go: { stay: true } },
      },
      {
        label: "뚜껑을 연다",
        requires: { notFlag: "mimicSeen" },
        pass: { text: "뚜껑을 여는 순간, 상자에 이빨이 돋았다! 미믹이다!", go: { fight: "mimic", win: "lair", flee: "lair" } },
      },
      {
        label: "미믹에게 먼저 한 방 먹인다",
        requires: { flag: "mimicSeen" },
        pass: { text: "잠든 척하던 미믹의 정수리를 먼저 내리쳤다!", go: { fight: "mimic", win: "lair", flee: "lair", surprise: true } },
      },
      {
        label: "상자를 두고 안쪽으로 간다",
        pass: { text: "보물은 아쉽지만, 등불이 먼저다. 더 깊은 곳에서 뜨거운 바람이 불어온다.", go: { scene: "lair" } },
      },
    ],
  },

  lair: {
    art: "lair",
    title: "용의 둥지",
    text:
      "동굴 가장 깊은 곳, 금화 더미 위에서 새끼 용이 새벽 등불을 끌어안고 잠들어 있다. " +
      "등불의 온기에 기대 몸을 둥글게 말고, 콧김마다 불씨가 톡톡 튄다.",
    notes: [
      { flag: "rumor", text: "주인장 말대로다. 녀석은 추위를 피해 등불을 가져간 것이다." },
      { flag: "runes", text: "룬에 새겨진 이름이 떠오른다. 잿불." },
      { flag: "clue", text: "그을린 발자국의 주인은 역시 이 녀석이었다." },
    ],
    choices: [
      {
        label: "무기를 들고 정면으로 맞선다",
        pass: { text: "금화가 와르르 쏟아지며 잿불이 몸을 일으킨다. \"내 등불이야!\"", go: { fight: "dragon", win: "hero" } },
      },
      {
        label: "숨을 죽이고 등불만 빼낸다",
        check: { stat: "dex", dc: 15 },
        pass: { text: "잿불의 발톱 사이로 손을 넣어, 한 치씩, 등불을 빼냈다. 잿불은 잠결에 입맛만 다신다.", go: { ending: "shadow" } },
        fail: { text: "금화 한 닢이 짤랑 굴러떨어졌다. 잿불의 눈이 번쩍 뜨인다!", go: { fight: "dragon", win: "hero" } },
      },
      {
        label: "잿불을 깨워 이야기를 건넨다",
        check: { stat: "cha", dc: 14, advantageIf: ["rumor", "runes", "clue"] },
        pass: {
          text: "\"잿불, 춥구나? 등불 대신 마을 대장간 화덕은 어때?\" 잿불의 눈이 동그래진다. \"…거기 따뜻해?\"",
          go: { ending: "friend" },
        },
        fail: {
          text: "\"도둑놈이라니!\" 단잠을 깨운 대가는 코앞에서 뿜어진 불길이었다.",
          effects: { damage: "1d6" },
          go: { fight: "dragon", win: "hero" },
        },
      },
    ],
  },
};

export type Ending = { art: ArtId; title: string; text: string; good: boolean };

export const ENDINGS: Record<EndingId, Ending> = {
  hero: {
    art: "village",
    title: "영웅의 귀환",
    good: true,
    text:
      "무릎 꿇은 잿불을 뒤로하고 등불을 들고 마을로 돌아왔다. 광장에 등불이 다시 켜지자 지붕의 서리가 녹아내린다. " +
      "사람들은 밤새 당신의 이름으로 노래를 지었다.",
  },
  shadow: {
    art: "village",
    title: "그림자의 귀환",
    good: true,
    text:
      "아무도 모르게 등불을 되찾아 새벽녘 광장에 걸어 두었다. 마을 사람들은 누가 했는지 끝내 몰랐다. " +
      "가끔 북쪽 유적에서 서운한 콧김 소리가 들린다나.",
  },
  friend: {
    art: "friend",
    title: "용과 친구가 되다",
    good: true,
    text:
      "잿불은 등불을 돌려주는 대신 겨울마다 대장간 화덕에서 몸을 녹이기로 했다. " +
      "그해 겨울, 마을에는 등불 하나와 아주 뜨거운 난로 하나가 생겼다.",
  },
  fallen: {
    art: "fallen",
    title: "모험은 여기까지",
    good: false,
    text: "눈앞이 캄캄해진다. 멀리서 주사위 구르는 소리만 들린다… 하지만 이야기는 다시 굴릴 수 있다.",
  },
};

export const ENDING_ORDER: EndingId[] = ["hero", "shadow", "friend", "fallen"];
