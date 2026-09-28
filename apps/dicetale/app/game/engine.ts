// 주사위와 판정, 전투 규칙. 화면과 상관없는 순수 함수만 둡니다.

export type StatId = "str" | "dex" | "int" | "cha";
export type Stats = Record<StatId, number>;
export type ClassId = "warrior" | "rogue" | "mage" | "bard";

export const STAT_NAMES: Record<StatId, string> = { str: "힘", dex: "민첩", int: "지능", cha: "매력" };
export const STAT_ORDER: StatId[] = ["str", "dex", "int", "cha"];

export type Hero = {
  name: string;
  classId: ClassId;
  stats: Stats;
  hp: number;
  maxHp: number;
  potions: number;
  gold: number;
  flags: string[];
};

export type Tally = { rolls: number; crits: number; fumbles: number; kills: number };

// 브라우저에서는 crypto 난수를 씁니다. 시뮬레이션에서는 바꿔 끼울 수 있습니다.
let random = (): number => {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 0x100000000;
};
export function setRandom(fn: () => number) {
  random = fn;
}

export function die(sides: number) {
  return Math.floor(random() * sides) + 1;
}

export type DiceResult = { total: number; rolls: number[]; bonus: number };

// "2d6+3" 같은 식을 굴립니다. crit이면 주사위 개수를 두 배로 굴립니다.
export function rollExpr(expr: string, crit = false): DiceResult {
  const m = /^(\d+)d(\d+)([+-]\d+)?$/.exec(expr.replace(/\s/g, ""));
  if (!m) throw new Error(`bad dice: ${expr}`);
  const count = Number(m[1]) * (crit ? 2 : 1);
  const sides = Number(m[2]);
  const bonus = Number(m[3] ?? 0);
  const rolls = Array.from({ length: count }, () => die(sides));
  return { total: rolls.reduce((a, b) => a + b, 0) + bonus, rolls, bonus };
}

export function mod(score: number) {
  return Math.floor((score - 10) / 2);
}

// 받침 유무에 따라 조사를 고릅니다. josa("늑대", "이", "가") → "늑대가"
export function josa(word: string, withBatchim: string, without: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const has = code >= 0 && code <= 11171 && code % 28 !== 0;
  return word + (has ? withBatchim : without);
}

export function signed(n: number) {
  return n >= 0 ? `+${n}` : `${n}`;
}

// 4d6 중 가장 낮은 하나를 버립니다.
export function rollAbility() {
  const dice = [die(6), die(6), die(6), die(6)];
  const sorted = [...dice].sort((a, b) => a - b);
  return { dice, value: sorted[1] + sorted[2] + sorted[3] };
}

export type ClassDef = {
  id: ClassId;
  name: string;
  primary: StatId;
  hp: number;
  ac: number;
  potions: number;
  weapon: string;
  weaponDice: string;
  skill: string;
  skillText: string;
  blurb: string;
};

export const CLASSES: Record<ClassId, ClassDef> = {
  warrior: {
    id: "warrior",
    name: "전사",
    primary: "str",
    hp: 20,
    ac: 15,
    potions: 2,
    weapon: "장검",
    weaponDice: "1d10",
    skill: "강타",
    skillText: "명중 +2, 피해 주사위 두 배",
    blurb: "튼튼한 갑옷과 장검. 쓰러지지 않는 게 특기.",
  },
  rogue: {
    id: "rogue",
    name: "도적",
    primary: "dex",
    hp: 16,
    ac: 14,
    potions: 2,
    weapon: "쌍단검",
    weaponDice: "1d8",
    skill: "기습",
    skillText: "유리하게 굴리고 2d6 추가 피해",
    blurb: "그림자처럼 움직인다. 자물쇠와 함정에 강하다.",
  },
  mage: {
    id: "mage",
    name: "마법사",
    primary: "int",
    hp: 14,
    ac: 12,
    potions: 2,
    weapon: "마력탄",
    weaponDice: "1d10",
    skill: "화염구",
    skillText: "빗나가지 않는 4d6 불꽃",
    blurb: "몸은 약해도 화염구 한 방이면 판이 뒤집힌다.",
  },
  bard: {
    id: "bard",
    name: "음유시인",
    primary: "cha",
    hp: 16,
    ac: 13,
    potions: 3,
    weapon: "레이피어",
    weaponDice: "1d8",
    skill: "영감의 노래",
    skillText: "2d6+매력 회복, 1d6 피해, 적의 다음 공격 불리",
    blurb: "말 한마디로 싸움을 피하고, 노래로 상처를 달랜다.",
  },
};

export function heroAc(hero: Hero) {
  return CLASSES[hero.classId].ac + (hero.flags.includes("shield") ? 1 : 0);
}

export function makeHero(name: string, classId: ClassId, base: Stats): Hero {
  const cls = CLASSES[classId];
  const stats = { ...base, [cls.primary]: Math.min(18, base[cls.primary] + 2) };
  return { name, classId, stats, hp: cls.hp, maxHp: cls.hp, potions: cls.potions, gold: 8, flags: [] };
}

export type CheckResult = {
  stat: StatId;
  dice: number[];
  natural: number;
  bonus: number;
  total: number;
  dc: number;
  success: boolean;
  crit: boolean;
  fumble: boolean;
  advantage: boolean;
};

// 20이 나오면 무조건 성공, 1이 나오면 무조건 실패.
export function abilityCheck(hero: Hero, stat: StatId, dc: number, advantage = false): CheckResult {
  const dice = advantage ? [die(20), die(20)] : [die(20)];
  const natural = Math.max(...dice);
  const bonus = mod(hero.stats[stat]);
  const total = natural + bonus;
  const crit = natural === 20;
  const fumble = natural === 1;
  return { stat, dice, natural, bonus, total, dc, success: crit || (!fumble && total >= dc), crit, fumble, advantage };
}

// ── 전투 ─────────────────────────────────────────

export type MonsterId = "wolf" | "slime" | "goblin" | "mimic" | "dragon";

export type MonsterDef = {
  id: MonsterId;
  name: string;
  hp: number;
  ac: number;
  atk: number;
  dmg: string;
  gold: number;
  attackVerb: string;
  boss?: boolean;
};

export const MONSTERS: Record<MonsterId, MonsterDef> = {
  wolf: { id: "wolf", name: "굶주린 늑대", hp: 11, ac: 12, atk: 3, dmg: "1d6+1", gold: 0, attackVerb: "물어뜯는다" },
  slime: { id: "slime", name: "늪 슬라임", hp: 13, ac: 9, atk: 2, dmg: "1d6", gold: 4, attackVerb: "덮친다" },
  goblin: { id: "goblin", name: "고블린 보초", hp: 12, ac: 13, atk: 3, dmg: "1d6+1", gold: 5, attackVerb: "창으로 찌른다" },
  mimic: { id: "mimic", name: "미믹", hp: 15, ac: 12, atk: 3, dmg: "1d6+2", gold: 15, attackVerb: "덥석 문다" },
  dragon: { id: "dragon", name: "새끼 용 잿불", hp: 24, ac: 13, atk: 4, dmg: "1d6+2", gold: 30, attackVerb: "발톱을 휘두른다", boss: true },
};

export type Fight = {
  monster: MonsterId;
  hp: number;
  maxHp: number;
  round: number;
  skillUsed: boolean;
  enemyDisadvantage: boolean;
  charging: boolean;
};

export type Action = "attack" | "skill" | "potion" | "flee";

export type RollShown = { natural: number; total: number; target: number; label: string; success: boolean; crit: boolean; fumble: boolean };

export type Step = {
  fight: Fight;
  hero: Hero;
  lines: string[];
  roll?: RollShown; // 영웅이 굴린 d20 (주사위 연출용)
  hitEnemy: boolean;
  hitHero: boolean;
  outcome?: "win" | "lose" | "fled";
  crits: number;
  fumbles: number;
  rolls: number;
};

export function startFight(id: MonsterId, surprise = false): Fight {
  const m = MONSTERS[id];
  const hp = surprise ? m.hp - 5 : m.hp;
  return { monster: id, hp, maxHp: m.hp, round: 1, skillUsed: false, enemyDisadvantage: false, charging: false };
}

export function potionHeal() {
  return rollExpr("2d4+3").total;
}

function heal(hero: Hero, amount: number): Hero {
  return { ...hero, hp: Math.min(hero.maxHp, hero.hp + amount) };
}

// 영웅의 행동 하나와 그에 이어지는 적의 차례를 한 번에 계산합니다.
export function takeTurn(fight0: Fight, hero0: Hero, action: Action): Step {
  let fight = { ...fight0 };
  let hero = { ...hero0 };
  const cls = CLASSES[hero.classId];
  const m = MONSTERS[fight.monster];
  const lines: string[] = [];
  const pm = mod(hero.stats[cls.primary]);
  let roll: RollShown | undefined;
  let hitEnemy = false;
  let crits = 0;
  let fumbles = 0;
  let rolls = 0;

  const attack = (opts: { toHit: number; advantage: boolean; dice: string; extra?: string; label: string }) => {
    const dice = opts.advantage ? [die(20), die(20)] : [die(20)];
    const natural = Math.max(...dice);
    rolls += dice.length;
    const total = natural + opts.toHit;
    const crit = natural === 20;
    const fumble = natural === 1;
    if (crit) crits += 1;
    if (fumble) fumbles += 1;
    const success = crit || (!fumble && total >= m.ac);
    roll = { natural, total, target: m.ac, label: opts.label, success, crit, fumble };
    const shown = dice.length > 1 ? `[${dice.join(", ")}]→${natural}` : `${natural}`;
    if (!success) {
      lines.push(`${opts.label}! d20 ${shown}${signed(opts.toHit)} = ${total}, 방어 ${m.ac}. ${fumble ? "대실패! 발이 꼬였다." : "빗나갔다."}`);
      return;
    }
    const base = rollExpr(opts.dice, crit);
    const extra = opts.extra ? rollExpr(opts.extra, crit).total : 0;
    const damage = Math.max(1, base.total + pm + extra);
    fight.hp -= damage;
    hitEnemy = true;
    lines.push(`${opts.label}! d20 ${shown}${signed(opts.toHit)} = ${total}. ${crit ? "치명타! " : "명중! "}${damage} 피해.`);
  };

  if (action === "attack") {
    attack({ toHit: pm + 2, advantage: false, dice: cls.weaponDice, label: cls.weapon });
  } else if (action === "skill") {
    fight.skillUsed = true;
    if (hero.classId === "warrior") {
      attack({ toHit: pm + 4, advantage: false, dice: "2d10", label: "강타" });
    } else if (hero.classId === "rogue") {
      attack({ toHit: pm + 2, advantage: true, dice: cls.weaponDice, extra: "2d6", label: "기습" });
    } else if (hero.classId === "mage") {
      const dmg = rollExpr("4d6").total;
      fight.hp -= dmg;
      hitEnemy = true;
      lines.push(`화염구! 불꽃이 ${josa(m.name, "을", "를")} 삼킨다. ${dmg} 피해.`);
    } else {
      const amount = Math.max(1, rollExpr("2d6").total + pm);
      const sonic = rollExpr("1d6").total;
      hero = heal(hero, amount);
      fight.hp -= sonic;
      hitEnemy = true;
      fight.enemyDisadvantage = true;
      lines.push(`영감의 노래! 체력 ${amount} 회복, 울려 퍼진 화음이 ${sonic} 피해. ${m.name}의 발걸음이 흐트러진다.`);
    }
  } else if (action === "potion") {
    const amount = potionHeal();
    hero = { ...heal(hero, amount), potions: hero.potions - 1 };
    lines.push(`물약을 마셨다. 체력 ${amount} 회복.`);
  } else {
    const dice = [die(20)];
    rolls += 1;
    const natural = dice[0];
    const bonus = mod(hero.stats.dex);
    const total = natural + bonus;
    const success = natural === 20 || (natural !== 1 && total >= 11);
    roll = { natural, total, target: 11, label: "도망", success, crit: natural === 20, fumble: natural === 1 };
    if (success) {
      lines.push(`도망! 민첩 d20 ${natural}${signed(bonus)} = ${total}. 무사히 빠져나왔다.`);
      return { fight, hero, lines, roll, hitEnemy, hitHero: false, outcome: "fled", crits, fumbles, rolls };
    }
    lines.push(`도망! 민첩 d20 ${natural}${signed(bonus)} = ${total}. 길이 막혔다!`);
  }

  if (fight.hp <= 0) {
    fight.hp = 0;
    lines.push(`${josa(m.name, "을", "를")} 쓰러뜨렸다!`);
    return { fight, hero, lines, roll, hitEnemy, hitHero: false, outcome: "win", crits, fumbles, rolls };
  }

  // 적의 차례
  let hitHero = false;
  const ac = heroAc(hero);
  if (m.boss && fight.charging) {
    fight.charging = false;
    const save = die(20) + mod(hero.stats.dex);
    rolls += 1;
    const full = rollExpr("2d6+2").total;
    const dmg = save >= 13 ? Math.floor(full / 2) : full;
    hero = { ...hero, hp: hero.hp - dmg };
    hitHero = true;
    lines.push(
      save >= 13
        ? `잿불이 불길을 뿜는다! 민첩 내성 ${save}, 몸을 굴려 절반만 받았다. ${dmg} 피해.`
        : `잿불이 불길을 뿜는다! 민첩 내성 ${save}, 피하지 못했다. ${dmg} 피해.`,
    );
  } else if (m.boss && fight.round % 3 === 0) {
    fight.charging = true;
    lines.push("잿불이 숨을 크게 들이마신다. 목구멍이 벌겋게 달아오른다…");
  } else {
    const dice = fight.enemyDisadvantage ? [die(20), die(20)] : [die(20)];
    const natural = fight.enemyDisadvantage ? Math.min(...dice) : dice[0];
    fight.enemyDisadvantage = false;
    const total = natural + m.atk;
    if (natural === 20 || (natural !== 1 && total >= ac)) {
      const dmg = rollExpr(m.dmg, natural === 20).total;
      hero = { ...hero, hp: hero.hp - dmg };
      hitHero = true;
      lines.push(`${josa(m.name, "이", "가")} ${m.attackVerb}. ${natural === 20 ? "치명타! " : ""}${dmg} 피해.`);
    } else {
      lines.push(`${josa(m.name, "이", "가")} ${m.attackVerb}. 막아냈다!`);
    }
  }
  fight.round += 1;
  if (hero.hp <= 0) {
    hero.hp = 0;
    return { fight, hero, lines, roll, hitEnemy, hitHero, outcome: "lose", crits, fumbles, rolls };
  }
  return { fight, hero, lines, roll, hitEnemy, hitHero, crits, fumbles, rolls };
}
