import { rollExpr, type Hero } from "./engine";
import type { Choice, Effects, SceneId } from "./story";
import { SCENES } from "./story";

export function usedKey(scene: SceneId, index: number) {
  return `used:${scene}:${index}`;
}

// 지금 고를 수 있는 선택지와 원래 순번. 순번은 한 번만 고르는 선택지를 기억할 때 씁니다.
export function visibleChoices(sceneId: SceneId, hero: Hero): { choice: Choice; index: number }[] {
  return SCENES[sceneId].choices
    .map((choice, index) => ({ choice, index }))
    .filter(({ choice, index }) => {
      if (choice.once && hero.flags.includes(usedKey(sceneId, index))) return false;
      const r = choice.requires;
      if (!r) return true;
      if (r.flag && !hero.flags.includes(r.flag)) return false;
      if (r.notFlag && hero.flags.includes(r.notFlag)) return false;
      return true;
    });
}

export function affordable(choice: Choice, hero: Hero) {
  return !choice.requires?.gold || hero.gold >= choice.requires.gold;
}

export function hasAdvantage(choice: Choice, hero: Hero) {
  return !!choice.check?.advantageIf?.some((f) => hero.flags.includes(f));
}

export function addFlag(hero: Hero, flag: string): Hero {
  return hero.flags.includes(flag) ? hero : { ...hero, flags: [...hero.flags, flag] };
}

export function applyEffects(hero0: Hero, effects: Effects | undefined): { hero: Hero; notes: string[] } {
  let hero = { ...hero0 };
  const notes: string[] = [];
  if (!effects) return { hero, notes };
  if (effects.damage) {
    const dmg = rollExpr(effects.damage).total;
    hero.hp = Math.max(0, hero.hp - dmg);
    notes.push(`체력 −${dmg}`);
  }
  if (effects.heal) {
    const before = hero.hp;
    hero.hp = effects.heal === "full" ? hero.maxHp : Math.min(hero.maxHp, hero.hp + Math.ceil(hero.maxHp / 2));
    notes.push(`체력 +${hero.hp - before}`);
  }
  if (effects.gold) {
    hero.gold = Math.max(0, hero.gold + effects.gold);
    notes.push(`금화 ${effects.gold > 0 ? "+" : "−"}${Math.abs(effects.gold)}`);
  }
  if (effects.potion) {
    hero.potions += effects.potion;
    notes.push(`물약 +${effects.potion}`);
  }
  if (effects.flag) {
    hero = addFlag(hero, effects.flag);
    if (effects.flag === "shield") notes.push("방어 +1");
  }
  return { hero, notes };
}
