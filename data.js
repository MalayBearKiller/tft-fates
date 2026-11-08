// TFT 시즌 4: 운명 (Fates) 데이터 정의 - 패치 11.8 최종 버전 기준

export const DROP_RATES = {
  1: [1.00, 0.00, 0.00, 0.00, 0.00],
  2: [1.00, 0.00, 0.00, 0.00, 0.00],
  3: [0.75, 0.25, 0.00, 0.00, 0.00],
  4: [0.55, 0.30, 0.15, 0.00, 0.00],
  5: [0.45, 0.33, 0.20, 0.02, 0.00],
  6: [0.35, 0.35, 0.25, 0.05, 0.00],
  7: [0.19, 0.35, 0.30, 0.15, 0.01],
  8: [0.16, 0.25, 0.35, 0.20, 0.04],
  9: [0.12, 0.16, 0.30, 0.30, 0.12]
};

// 시즌 4 최종 패치(11.2~11.8) 선택받은 자(Chosen) 코스트별 등장 확률표
// (6렙 1코 선받자 삭제, 8렙 2코 선받자 삭제, 9렙 3코 선받자 삭제 반영)
export const CHOSEN_DROP_RATES = {
  1: [1.00, 0.00, 0.00, 0.00, 0.00],
  2: [1.00, 0.00, 0.00, 0.00, 0.00],
  3: [1.00, 0.00, 0.00, 0.00, 0.00],
  4: [1.00, 0.00, 0.00, 0.00, 0.00],
  5: [0.60, 0.40, 0.00, 0.00, 0.00],
  6: [0.00, 0.60, 0.40, 0.00, 0.00],
  7: [0.00, 0.40, 0.55, 0.05, 0.00],
  8: [0.00, 0.00, 0.60, 0.40, 0.00],
  9: [0.00, 0.00, 0.00, 0.60, 0.40]
};

export const LEVEL_EXP = {
  1: 2,
  2: 2,
  3: 6,
  4: 10,
  5: 20,
  6: 36,
  7: 56,
  8: 80,
  9: 999
};

export const TRAITS = {
  cultist: {
    name: "광신도",
    enName: "Cultist",
    icon: "👁️",
    desc: "아군의 총 체력이 감소하면 광신도들의 군주 '갈리오'가 하늘에서 소환되어 전장을 강타합니다.",
    thresholds: [
      { count: 3, effect: "폭군 갈리오 소환 (체력 1400, 광역 기절 1.5초)" },
      { count: 6, effect: "마왕 갈리오 소환 (체력 2800, 강력한 광역 강타 & 기절 2.5초)" }
    ]
  },
  moonlight: {
    name: "달빛",
    enName: "Moonlight",
    icon: "🌙",
    desc: "전투 시작 시 가장 성급이 낮은 달빛 챔피언의 성급이 1단계 증가합니다. (모두 3성이면 사상 최초의 4성 탄생!)",
    thresholds: [
      { count: 3, effect: "가장 낮은 등급의 달빛 챔피언 1명 등급 +1 (최대 4성)" }
    ]
  },
  fortune: {
    name: "행운",
    enName: "Fortune",
    icon: "🎲",
    desc: "전투에서 승리할 때마다 보너스 골드 구체를 획득합니다. 패배할 때마다 행운 스택이 쌓이며, 연패를 끊고 승리하면 대박 잭팟 보상이 터집니다!",
    thresholds: [
      { count: 3, effect: "승리 시 보너스 골드 및 연패 보상 잭팟" }
    ]
  },
  warlord: {
    name: "대장군",
    enName: "Warlord",
    icon: "🚩",
    desc: "대장군은 추가 체력과 주문력을 얻으며, 전투에서 승리할 때마다 보너스가 10%씩 최대 5회 중첩됩니다.",
    thresholds: [
      { count: 3, effect: "체력 +200, 주문력 +20" },
      { count: 6, effect: "체력 +450, 주문력 +40" }
    ]
  },
  duelist: {
    name: "결투가",
    enName: "Duelist",
    icon: "⚔️",
    desc: "결투가는 이동 속도가 빠르며, 기본 공격을 할 때마다 공격 속도가 증가합니다 (최대 8회 중첩).",
    thresholds: [
      { count: 2, effect: "중첩당 공격 속도 +15%" },
      { count: 4, effect: "중첩당 공격 속도 +25%" },
      { count: 6, effect: "중첩당 공격 속도 +40%" }
    ]
  },
  divine: {
    name: "신성",
    enName: "Divine",
    icon: "✨",
    desc: "6회 공격하거나 체력이 50% 이하가 되면 모든 군중 제어 효과를 해제하고, 받는 피해 50% 감소 및 고정 피해를 입힙니다.",
    thresholds: [
      { count: 2, effect: "4초 동안 신성 상태 지속" },
      { count: 4, effect: "7초 동안 신성 상태 지속" },
      { count: 6, effect: "10초 동안 신성 상태 지속" }
    ]
  },
  theBoss: {
    name: "우두머리",
    enName: "The Boss",
    icon: "💪",
    desc: "세트의 고유 특성. 체력이 40% 이하로 떨어지면 전투에서 빠져나와 맵 구석에서 윗몸일으키기를 하여 체력을 회복한 후, 모든 피해가 고정 피해로 바뀌는 '투지 폭발' 상태로 복귀합니다.",
    thresholds: [
      { count: 1, effect: "체력 40% 이하 시 윗몸일으키기로 풀피 회복 & 고정 피해 복귀" }
    ]
  }
};

export const CHAMPIONS = [
  // 1코스트
  {
    id: "yasuo",
    name: "야스오",
    cost: 1,
    traits: ["duelist"],
    icon: "🌪️",
    image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Yasuo.png",
    color: "#6b8af7",
    hp: 600,
    maxMana: 45,
    startMana: 0,
    ad: 50,
    as: 0.75,
    range: 1,
    armor: 30,
    skillName: "강철 폭풍",
    skillDesc: "대상에게 180/200/220%의 물리 피해를 입히는 검기를 발사합니다.",
    skill: (caster, target, battle) => {
      battle.dealDamage(caster, target, caster.ad * (1.8 + caster.star * 0.3), "physical");
      battle.spawnEffect(target.x, target.y, "🌪️", 600);
      battle.audio.playSkillSound("slash");
    }
  },
  {
    id: "diana",
    name: "다이애나",
    cost: 1,
    traits: ["moonlight"],
    icon: "🌙",
    image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Diana.png",
    color: "#a0b2d6",
    hp: 550,
    maxMana: 70,
    startMana: 0,
    ad: 50,
    as: 0.7,
    range: 1,
    armor: 30,
    skillName: "은빛 가호",
    skillDesc: "보호막을 얻고 주위에 구체를 소환해 접촉하는 적에게 마법 피해를 입힙니다.",
    skill: (caster, target, battle) => {
      const shieldAmount = 200 * caster.star;
      caster.shield += shieldAmount;
      battle.spawnEffect(caster.x, caster.y, "🛡️", 800);
      battle.dealDamage(caster, target, 90 * caster.star, "magic");
      battle.audio.playSkillSound("shield");
    }
  },
  {
    id: "tf",
    name: "트위스티드 페이트",
    cost: 1,
    traits: ["cultist"],
    icon: "🃏",
    image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/TwistedFate.png",
    color: "#9c27b0",
    hp: 500,
    maxMana: 70,
    startMana: 0,
    ad: 40,
    as: 0.65,
    range: 3,
    armor: 20,
    skillName: "와일드 카드",
    skillDesc: "3갈래의 카드를 던져 관통하는 모든 적에게 마법 피해를 입힙니다.",
    skill: (caster, target, battle) => {
      const targets = battle.getEnemiesInRange(caster, 5, 3);
      targets.forEach(t => {
        battle.dealDamage(caster, t, 120 * caster.star, "magic");
        battle.spawnEffect(t.x, t.y, "🎴", 500);
      });
      battle.audio.playSkillSound("card");
    }
  },
  {
    id: "garen",
    name: "가렌",
    cost: 1,
    traits: ["warlord"],
    icon: "🗡️",
    image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Garen.png",
    color: "#4caf50",
    hp: 650,
    maxMana: 100,
    startMana: 40,
    ad: 50,
    as: 0.6,
    range: 1,
    armor: 40,
    skillName: "심판",
    skillDesc: "칼을 들고 회전하며 마법 피해 감소 효과를 얻고 주변 모든 적에게 지속 마법 피해를 입힙니다.",
    skill: (caster, target, battle) => {
      const enemies = battle.getEnemiesInRange(caster, 1.8, 4);
      enemies.forEach(e => {
        battle.dealDamage(caster, e, 150 * caster.star, "magic");
        battle.spawnEffect(e.x, e.y, "⚔️", 600);
      });
      battle.audio.playSkillSound("spin");
    }
  },
  {
    id: "lissandra",
    name: "리산드라",
    cost: 1,
    traits: ["moonlight"],
    icon: "❄️",
    image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Lissandra.png",
    color: "#4dd0e1",
    hp: 500,
    maxMana: 90,
    startMana: 30,
    ad: 40,
    as: 0.65,
    range: 3,
    armor: 20,
    skillName: "천 개의 단검",
    skillDesc: "공격력이 가장 높은 적에게 단검을 날려 폭발 피해를 입히고 공격력을 둔화시킵니다.",
    skill: (caster, target, battle) => {
      const enemies = battle.getEnemiesInRange(target, 1.5, 3, caster.side);
      enemies.forEach(e => {
        battle.dealDamage(caster, e, 160 * caster.star, "magic");
        battle.spawnEffect(e.x, e.y, "❄️", 600);
      });
      battle.audio.playSkillSound("frost");
    }
  },

  // 2코스트
  {
    id: "sylas",
    name: "사일러스",
    cost: 2,
    traits: ["moonlight"],
    icon: "⛓️",
    image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Sylas.png",
    color: "#795548",
    hp: 750,
    maxMana: 80,
    startMana: 30,
    ad: 60,
    as: 0.65,
    range: 1,
    armor: 40,
    skillName: "사슬 후려치기",
    skillDesc: "사슬을 휘둘러 일직선상의 적들에게 마법 피해를 입히고 다음 스킬 마나 소모량을 늘립니다.",
    skill: (caster, target, battle) => {
      const targets = battle.getEnemiesInRange(caster, 2, 2);
      targets.forEach(t => {
        battle.dealDamage(caster, t, 175 * caster.star, "magic");
        battle.spawnEffect(t.x, t.y, "⛓️", 500);
      });
      battle.audio.playSkillSound("chain");
    }
  },
  {
    id: "annie",
    name: "애니",
    cost: 2,
    traits: ["fortune"],
    icon: "🔥",
    image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Annie.png",
    color: "#ff5722",
    hp: 750,
    maxMana: 75,
    startMana: 0,
    ad: 45,
    as: 0.6,
    range: 2,
    armor: 40,
    skillName: "소각 & 용암 방패",
    skillDesc: "전방 원뿔 형태의 적들에게 화염 피해를 입히고 자신에게 거대한 보호막을 씌웁니다.",
    skill: (caster, target, battle) => {
      caster.shield += 300 * caster.star;
      const targets = battle.getEnemiesInRange(target, 1.5, 3, caster.side);
      targets.forEach(t => {
        battle.dealDamage(caster, t, 180 * caster.star, "magic");
        battle.spawnEffect(t.x, t.y, "🔥", 700);
      });
      battle.audio.playSkillSound("fire");
    }
  },
  {
    id: "jax",
    name: "잭스",
    cost: 2,
    traits: ["divine", "duelist"],
    icon: "🏮",
    image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Jax.png",
    color: "#fbc02d",
    hp: 750,
    maxMana: 100,
    startMana: 50,
    ad: 60,
    as: 0.75,
    range: 1,
    armor: 40,
    skillName: "반격",
    skillDesc: "2초간 모든 기본 공격을 회피한 후, 주변 모든 적을 1.5초간 기절시키고 마법 피해를 입힙니다.",
    skill: (caster, target, battle) => {
      const targets = battle.getEnemiesInRange(caster, 1.5, 4);
      targets.forEach(t => {
        battle.dealDamage(caster, t, 160 * caster.star, "magic");
        t.stunnedUntil = battle.currentTime + 1500;
        battle.spawnEffect(t.x, t.y, "💫", 1500);
      });
      battle.audio.playSkillSound("stun");
    }
  },
  {
    id: "pyke",
    name: "파이크",
    cost: 2,
    traits: ["cultist"],
    icon: "🦈",
    image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Pyke.png",
    color: "#00897b",
    hp: 700,
    maxMana: 120,
    startMana: 60,
    ad: 55,
    as: 0.65,
    range: 1,
    armor: 35,
    skillName: "망자의 물살",
    skillDesc: "가장 먼 적의 뒤로 돌진하며 경로 상의 모든 적을 1.5초간 기절시키고 피해를 줍니다.",
    skill: (caster, target, battle) => {
      const farthest = battle.getFarthestEnemy(caster);
      if (farthest) {
        caster.x = farthest.x + (Math.random() - 0.5) * 20;
        caster.y = farthest.y + (caster.side === "player" ? -30 : 30);
        caster.targetUid = farthest.uid;
      }
      const targets = battle.getEnemiesInRange(caster, 1.5, 4);
      targets.forEach(t => {
        battle.dealDamage(caster, t, 150 * caster.star, "magic");
        t.stunnedUntil = battle.currentTime + 1500;
        battle.spawnEffect(t.x, t.y, "💧", 800);
      });
      battle.audio.playSkillSound("water");
    }
  },

  // 3코스트
  {
    id: "katarina",
    name: "카타리나",
    cost: 3,
    traits: ["warlord", "fortune"],
    icon: "🗡️",
    image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Katarina.png",
    color: "#e91e63",
    hp: 700,
    maxMana: 90,
    startMana: 0,
    ad: 65,
    as: 0.7,
    range: 1,
    armor: 35,
    skillName: "죽음의 연꽃 (Death Lotus)",
    skillDesc: "적진 한가운데로 순간이동하여 회전 단검을 난사해 주변 4명에게 강력한 폭풍 마법 피해를 입힙니다.",
    skill: (caster, target, battle) => {
      // 대상 곁으로 순간이동 후 주변 적에게 단검 폭풍
      caster.x = target.x + (Math.random() - 0.5) * 30;
      caster.y = target.y + (caster.side === "player" ? 35 : -35);
      const targets = battle.getEnemiesInRange(caster, 1.6, 4);
      battle.spawnEffect(caster.x, caster.y, "🌪️🗡️", 1200);
      targets.forEach(t => {
        battle.dealDamage(caster, t, 220 * caster.star, "magic");
      });
      battle.audio.playSkillSound("lotus");
    }
  },
  {
    id: "kalista",
    name: "칼리스타",
    cost: 3,
    traits: ["cultist", "duelist"],
    icon: "🏹",
    image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Kalista.png",
    color: "#00bfa5",
    hp: 650,
    maxMana: 0,
    startMana: 0,
    ad: 65,
    as: 0.8,
    range: 3,
    armor: 25,
    skillName: "뽑아 찢기 (패시브)",
    skillDesc: "대상의 몸에 창을 박습니다. 박힌 창의 피해량이 대상의 남은 체력보다 커지는 순간 즉사시킵니다!",
    skill: (caster, target, battle) => {}
  },

  // 4코스트
  {
    id: "warwick",
    name: "워윅",
    cost: 4,
    traits: ["divine"],
    icon: "🐺",
    image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Warwick.png",
    color: "#ff9800",
    hp: 950,
    maxMana: 100,
    startMana: 40,
    ad: 75,
    as: 0.85,
    range: 1,
    armor: 45,
    skillName: "원시의 포효 (공포 & 폭주)",
    skillDesc: "포효하여 주변 적들을 1.5초간 공포에 빠뜨리고, 폭주하여 공격 속도와 모든 피해 흡혈을 대폭 얻습니다.",
    skill: (caster, target, battle) => {
      const enemies = battle.getEnemiesInRange(caster, 2, 4);
      enemies.forEach(e => {
        e.stunnedUntil = battle.currentTime + 1500;
        battle.spawnEffect(e.x, e.y, "😱", 1500);
      });
      caster.as += 0.8;
      caster.lifesteal = 0.5;
      battle.spawnEffect(caster.x, caster.y, "🐺💥", 1000);
      battle.audio.playSkillSound("roar");
    }
  },
  {
    id: "sejuani",
    name: "세주아니",
    cost: 4,
    traits: ["fortune"],
    icon: "🐗",
    image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Sejuani.png",
    color: "#00acc1",
    hp: 1000,
    maxMana: 130,
    startMana: 60,
    ad: 60,
    as: 0.55,
    range: 1,
    armor: 60,
    skillName: "빙하 폭풍",
    skillDesc: "거대한 얼음 덫을 던져 전장의 적들에게 폭발 마법 피해를 입히고 2초 동안 얼려버립니다.",
    skill: (caster, target, battle) => {
      const enemies = battle.getEnemiesInRange(target, 2, 6, caster.side);
      enemies.forEach(e => {
        battle.dealDamage(caster, e, 250 * caster.star, "magic");
        e.stunnedUntil = battle.currentTime + 2000;
        battle.spawnEffect(e.x, e.y, "🧊", 2000);
      });
      battle.audio.playSkillSound("freeze");
    }
  },
  {
    id: "jhin",
    name: "진",
    cost: 4,
    traits: ["cultist"],
    icon: "🎭",
    image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Jhin.png",
    color: "#d32f2f",
    hp: 750,
    maxMana: 0,
    startMana: 0,
    ad: 90,
    as: 0.85,
    range: 4,
    armor: 30,
    skillName: "속삭임 4타 (패시브)",
    skillDesc: "매 4번째 공격마다 거대한 치명타 탄환을 발사하여 대상의 잃은 체력에 비례한 추가 피해를 입힙니다.",
    skill: (caster, target, battle) => {}
  },

  // 5코스트
  {
    id: "sett",
    name: "세트",
    cost: 5,
    traits: ["theBoss", "warlord"],
    icon: "🥊",
    image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Sett.png",
    color: "#ff1744",
    hp: 1100,
    maxMana: 120,
    startMana: 50,
    ad: 80,
    as: 0.75,
    range: 1,
    armor: 60,
    skillName: "대미 장식 (Showstopper)",
    skillDesc: "주 대상을 붙잡아 공중으로 솟구친 후 적진 가장 밀집된 지역에 내리꽂아 최대 체력 비례 광역 피해를 입힙니다!",
    skill: (caster, target, battle) => {
      battle.spawnEffect(target.x, target.y, "💥🌋", 1000);
      const splash = battle.getEnemiesInRange(target, 1.5, 6, caster.side);
      splash.forEach(s => {
        battle.dealDamage(caster, s, 450 * caster.star, "magic");
      });
      battle.audio.playSkillSound("slam");
    }
  },
  {
    id: "leesin",
    name: "리 신",
    cost: 5,
    traits: ["divine", "duelist"],
    icon: "🥋",
    image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/LeeSin.png",
    color: "#ffd700",
    hp: 1000,
    maxMana: 80,
    startMana: 30,
    ad: 75,
    as: 0.8,
    range: 1,
    armor: 50,
    skillName: "용의 분노 (장외 홈런 킥!)",
    skillDesc: "대상을 강력하게 발로 차 전장 밖으로 날려버립니다. 이미 전장 가장자리에 있던 적은 즉시 장외로 탈락(즉사)합니다!",
    skill: (caster, target, battle) => {
      battle.spawnEffect(target.x, target.y, "🥋⚡", 800);
      // 가장자리에 있거나 차서 전장 밖으로 날아가면 즉사 (단, 체력 비례로 너무 단단한 대상은 버팀)
      const wasOnEdge = battle.isNearEdge(target);
      const knockedOut = battle.knockback(target, caster, 2);
      if ((wasOnEdge || knockedOut) && target.champ.id !== "galio") {
        battle.instantEliminate(target, "장외 홈런!!");
      } else {
        battle.dealDamage(caster, target, 300 * caster.star, "magic");
      }
      battle.audio.playSkillSound("kick");
    }
  }
];

// 적 몬스터 및 라운드 구성 (공식 시즌 4 타임라인 및 크립 라운드)
export const ROUNDS = [
  {
    stage: "1-1",
    name: "첫 관문: 미니언 라운드 1",
    roundType: "minion",
    typeIcon: "👾",
    opponentName: "야생 미니언",
    opponentDesc: "초반 기본 자원을 주는 야생 미니언입니다.",
    opponentSynergies: "정글 크립",
    roundGold: 0,
    isPvP: false,
    enemies: [
      { name: "근접 미니언", hp: 180, ad: 14, as: 0.6, armor: 5, icon: "👾", image: "https://raw.communitydragon.org/latest/game/assets/loot/companions/minion/loot_minion_base_variant1_tier1.png", col: 2, row: 1 },
      { name: "근접 미니언", hp: 180, ad: 14, as: 0.6, armor: 5, icon: "👾", image: "https://raw.communitydragon.org/latest/game/assets/loot/companions/minion/loot_minion_base_variant1_tier1.png", col: 4, row: 1 }
    ]
  },
  {
    stage: "1-2",
    name: "미니언 라운드 2 (상점 오픈)",
    roundType: "minion",
    typeIcon: "👾",
    opponentName: "미니언 무리",
    opponentDesc: "클리어 시 상점이 활성화되며 2골드가 지급됩니다.",
    opponentSynergies: "정글 크립",
    roundGold: 2,
    isPvP: false,
    enemies: [
      { name: "근접 미니언", hp: 220, ad: 16, as: 0.6, armor: 10, icon: "👾", image: "https://raw.communitydragon.org/latest/game/assets/loot/companions/minion/loot_minion_base_variant1_tier1.png", col: 2, row: 1 },
      { name: "근접 미니언", hp: 220, ad: 16, as: 0.6, armor: 10, icon: "👾", image: "https://raw.communitydragon.org/latest/game/assets/loot/companions/minion/loot_minion_base_variant1_tier1.png", col: 4, row: 1 },
      { name: "원거리 미니언", hp: 180, ad: 20, as: 0.7, armor: 5, icon: "🔮", image: "https://raw.communitydragon.org/latest/game/assets/loot/companions/minion/loot_minion_base_variant2_tier1.png", col: 3, row: 0 }
    ]
  },
  {
    stage: "1-3",
    name: "미니언 라운드 3 (자원 정산)",
    roundType: "minion",
    typeIcon: "👾",
    opponentName: "강화 미니언 무리",
    opponentDesc: "미니언 최종전입니다. 처치 시 2골드와 보너스 자원이 제공됩니다.",
    opponentSynergies: "정글 크립",
    roundGold: 2,
    rewardGold: 1,
    isPvP: false,
    enemies: [
      { name: "대형 미니언", hp: 450, ad: 24, as: 0.6, armor: 15, icon: "🗿", image: "https://raw.communitydragon.org/latest/game/assets/loot/companions/minion/loot_minion_base_variant3_tier1.png", col: 3, row: 1 },
      { name: "원거리 미니언", hp: 200, ad: 22, as: 0.7, armor: 5, icon: "🔮", image: "https://raw.communitydragon.org/latest/game/assets/loot/companions/minion/loot_minion_base_variant2_tier1.png", col: 1, row: 0 },
      { name: "원거리 미니언", hp: 200, ad: 22, as: 0.7, armor: 5, icon: "🔮", image: "https://raw.communitydragon.org/latest/game/assets/loot/companions/minion/loot_minion_base_variant2_tier1.png", col: 5, row: 0 }
    ]
  },
  {
    stage: "2-1",
    name: "첫 PvP 결투",
    roundType: "pvp",
    typeIcon: "⚔️",
    opponentId: "opp_garen",
    opponentName: "가렌 (Lv.3)",
    opponentDesc: "선봉대 가렌과 파이크의 전열 방어 덱입니다.",
    opponentSynergies: "🚩 1대장군 | 🛡️ 1선봉대",
    roundGold: 4,
    isPvP: true,
    enemies: [
      { champId: "garen", star: 2, col: 3, row: 2 },
      { champId: "pyke", star: 1, col: 2, row: 2 },
      { champId: "tf", star: 1, col: 3, row: 0 }
    ]
  },
  {
    stage: "2-2",
    name: "달빛 리롤 도전자",
    roundType: "pvp",
    typeIcon: "⚔️",
    opponentId: "opp_diana",
    opponentName: "다이애나 (Lv.3)",
    opponentDesc: "달빛 발동 시 가장 낮은 성급의 달빛 챔피언이 전투 중 한 단계 승급합니다.",
    opponentSynergies: "🌙 3달빛 (최저 성급 +1 진화!)",
    roundGold: 5,
    isPvP: true,
    enemies: [
      { champId: "diana", star: 2, col: 2, row: 2 },
      { champId: "lissandra", star: 1, col: 5, row: 0 },
      { champId: "sylas", star: 1, col: 4, row: 2 }
    ]
  },
  {
    stage: "2-3",
    name: "결투가 야스오 도전자",
    roundType: "pvp",
    typeIcon: "⚔️",
    opponentId: "opp_yasuo",
    opponentName: "야스오 (Lv.4)",
    opponentDesc: "결투가 야스오와 칼리스타의 빠른 공격 속도를 자랑하는 덱입니다.",
    opponentSynergies: "⚔️ 2결투가 | 🌙 1달빛",
    roundGold: 5,
    isPvP: true,
    enemies: [
      { champId: "yasuo", star: 2, col: 3, row: 2 },
      { champId: "jax", star: 1, col: 4, row: 2 },
      { champId: "kalista", star: 1, col: 1, row: 0 },
      { champId: "garen", star: 1, col: 2, row: 2 }
    ]
  },
  {
    stage: "2-4",
    name: "돌거북 라운드 (크립)",
    roundType: "krugs",
    typeIcon: "🪨",
    opponentName: "돌거북 무리",
    opponentDesc: "단단한 바위 장갑을 지닌 돌거북 무리입니다. 처치 시 대량의 골드와 전리품이 지급됩니다.",
    opponentSynergies: "정글 크립 (바위 장갑)",
    roundGold: 5,
    rewardGold: 3,
    isPvP: false,
    enemies: [
      { name: "고대 돌거북", hp: 1200, ad: 50, as: 0.65, armor: 30, icon: "🪨", image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/1592.png", col: 3, row: 1 },
      { name: "작은 돌거북", hp: 550, ad: 32, as: 0.7, armor: 20, icon: "🪨", image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/1592.png", col: 1, row: 1 },
      { name: "작은 돌거북", hp: 550, ad: 32, as: 0.7, armor: 20, icon: "🪨", image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/1592.png", col: 5, row: 1 }
    ]
  },
  {
    stage: "3-1",
    name: "광신도 갈리오 도전자",
    roundType: "pvp",
    typeIcon: "⚔️",
    opponentId: "opp_cultist",
    opponentName: "트페 (Lv.5)",
    opponentDesc: "팀 전체 체력이 50% 이하로 떨어지면 마왕 갈리오가 하늘에서 강림합니다!",
    opponentSynergies: "👁️ 6광신도 (마왕 갈리오 강림) | ⚔️ 2결투가",
    roundGold: 5,
    isPvP: true,
    enemies: [
      { champId: "tf", star: 2, col: 2, row: 0 },
      { champId: "pyke", star: 2, col: 4, row: 2 },
      { champId: "kalista", star: 1, col: 1, row: 0 },
      { champId: "jhin", star: 1, col: 5, row: 0 },
      { champId: "garen", star: 2, col: 3, row: 2 }
    ]
  },
  {
    stage: "3-2",
    name: "신성 워윅 폭주 도전자",
    roundType: "pvp",
    typeIcon: "⚔️",
    opponentId: "opp_warwick",
    opponentName: "워윅 (Lv.5)",
    opponentDesc: "워윅이 포효하여 받는 피해를 50% 감소시키고 무자비한 흡혈로 진형을 붕괴시킵니다.",
    opponentSynergies: "✨ 4신성 (피해감소 50%) | ⚔️ 2결투가",
    roundGold: 5,
    isPvP: true,
    enemies: [
      { champId: "warwick", star: 2, col: 3, row: 2 },
      { champId: "jax", star: 2, col: 2, row: 2 },
      { champId: "yasuo", star: 2, col: 4, row: 2 },
      { champId: "sejuani", star: 1, col: 3, row: 1 },
      { champId: "annie", star: 1, col: 1, row: 1 }
    ]
  },
  {
    stage: "3-3",
    name: "어스름 늑대 무리 (크립)",
    roundType: "wolves",
    typeIcon: "🐺",
    opponentName: "어스름 늑대 무리",
    opponentDesc: "재빠른 공격 속도를 지닌 늑대 무리입니다. 처치 시 추가 골드와 전리품을 획득합니다.",
    opponentSynergies: "정글 크립 (늑대의 이빨)",
    roundGold: 5,
    rewardGold: 4,
    isPvP: false,
    enemies: [
      { name: "거대 어스름 늑대", hp: 1300, ad: 55, as: 0.85, armor: 25, icon: "🐺", image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/1595.png", col: 3, row: 1 },
      { name: "어스름 늑대", hp: 500, ad: 35, as: 0.9, armor: 15, icon: "🐺", image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/1595.png", col: 1, row: 1 },
      { name: "어스름 늑대", hp: 500, ad: 35, as: 0.9, armor: 15, icon: "🐺", image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/1595.png", col: 5, row: 1 },
      { name: "어스름 늑대", hp: 500, ad: 35, as: 0.9, armor: 15, icon: "🐺", image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/1595.png", col: 2, row: 0 },
      { name: "어스름 늑대", hp: 500, ad: 35, as: 0.9, armor: 15, icon: "🐺", image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/1595.png", col: 4, row: 0 }
    ]
  },
  {
    stage: "4-1",
    name: "칼날부리 라운드 (크립)",
    roundType: "raptors",
    typeIcon: "🦅",
    opponentName: "칼날부리 어미와 둥지",
    opponentDesc: "처치 시 보너스 골드 6개를 지급합니다.",
    opponentSynergies: "골드 보상 몬스터",
    roundGold: 5,
    rewardGold: 6,
    isPvP: false,
    enemies: [
      { name: "어미 칼날부리", hp: 1600, ad: 70, as: 0.8, armor: 40, icon: "🦅", image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/1594.png", col: 3, row: 1 },
      { name: "새끼 칼날부리", hp: 600, ad: 40, as: 0.9, armor: 20, icon: "🐥", image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/1593.png", col: 1, row: 1 },
      { name: "새끼 칼날부리", hp: 600, ad: 40, as: 0.9, armor: 20, icon: "🐥", image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/1593.png", col: 5, row: 1 },
      { name: "새끼 칼날부리", hp: 600, ad: 40, as: 0.9, armor: 20, icon: "🐥", image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/1593.png", col: 2, row: 0 },
      { name: "새끼 칼날부리", hp: 600, ad: 40, as: 0.9, armor: 20, icon: "🐥", image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/1593.png", col: 4, row: 0 }
    ]
  },
  {
    stage: "5-1",
    name: "결승전: 5코스트 올스타 (PvP)",
    roundType: "pvp",
    typeIcon: "⚔️",
    opponentId: "opp_sett",
    opponentName: "세트 (Lv.7)",
    opponentDesc: "윗몸일으키기 세트와 장외 홈런 리 신이 버티는 최강의 완성 덱입니다.",
    opponentSynergies: "💪 1우두머리 | 🚩 3대장군 | ✨ 2신성",
    roundGold: 5,
    isPvP: true,
    enemies: [
      { champId: "sett", star: 2, col: 3, row: 2 },
      { champId: "leesin", star: 2, col: 4, row: 2 },
      { champId: "katarina", star: 2, col: 2, row: 2 },
      { champId: "garen", star: 2, col: 1, row: 2 },
      { champId: "sejuani", star: 2, col: 5, row: 1 },
      { champId: "warwick", star: 2, col: 1, row: 1 },
      { champId: "jhin", star: 2, col: 5, row: 0 }
    ]
  },
  {
    stage: "5-2",
    name: "최종 에픽 보스: 장로 드래곤 (크립)",
    roundType: "dragon",
    typeIcon: "🐉",
    opponentName: "고대 장로 드래곤",
    opponentDesc: "신화급 생명체! 강력한 브레스와 막강한 체력을 지닌 최종 보스입니다.",
    opponentSynergies: "신화급 보스",
    roundGold: 5,
    rewardGold: 10,
    isPvP: false,
    enemies: [
      { name: "장로 드래곤", hp: 4200, ad: 110, as: 0.75, armor: 50, icon: "🐉", image: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/1596.png", col: 3, row: 1 }
    ]
  }
];

// ==========================================
// TFT 시즌 4: 운명 (Fates) 아이템 시스템 정의
// ==========================================

export const BASE_ITEMS = ["bf", "bow", "rod", "tear", "vest", "cloak", "belt", "glove", "spatula"];

export const ITEMS = {
  // --- 기본 아이템 (9종) ---
  bf: {
    id: "bf",
    name: "B.F. 대검",
    icon: "🗡️",
    isComponent: true,
    stats: { ad: 15 },
    desc: "공격력 +15"
  },
  bow: {
    id: "bow",
    name: "곡궁",
    icon: "🏹",
    isComponent: true,
    stats: { as: 0.15 },
    desc: "공격 속도 +15%"
  },
  rod: {
    id: "rod",
    name: "쓸데없이 큰 지팡이",
    icon: "🪄",
    isComponent: true,
    stats: { ap: 15 },
    desc: "주문력 +15"
  },
  tear: {
    id: "tear",
    name: "여신의 눈물",
    icon: "💧",
    isComponent: true,
    stats: { mana: 15 },
    desc: "시작 마나 +15"
  },
  vest: {
    id: "vest",
    name: "쇠사슬 조끼",
    icon: "🛡️",
    isComponent: true,
    stats: { armor: 20 },
    desc: "방어력 +20"
  },
  cloak: {
    id: "cloak",
    name: "음전자 망토",
    icon: "🧥",
    isComponent: true,
    stats: { mr: 20 },
    desc: "마법 저항력 +20"
  },
  belt: {
    id: "belt",
    name: "거인의 허리띠",
    icon: "🥋",
    isComponent: true,
    stats: { hp: 150 },
    desc: "체력 +150"
  },
  glove: {
    id: "glove",
    name: "연습용 장갑",
    icon: "🥊",
    isComponent: true,
    stats: { critChance: 0.10, dodge: 0.10 },
    desc: "치명타 확률 +10%, 회피율 +10%"
  },
  spatula: {
    id: "spatula",
    name: "뒤집개",
    icon: "🥄",
    isComponent: true,
    stats: {},
    desc: "신비한 상징을 조합할 수 있는 특수 재료 아이템입니다."
  },

  // --- 완성 아이템 (45종) ---
  deathblade: {
    id: "deathblade",
    name: "죽음의 검",
    icon: "⚔️",
    recipe: ["bf", "bf"],
    stats: { ad: 30 },
    desc: "처치 또는 처치 관여 시 전투 중 공격력이 영구적으로 20 증가합니다 (무제한 중첩)."
  },
  giant_slayer: {
    id: "giant_slayer",
    name: "거인 학살자",
    icon: "🏹💥",
    recipe: ["bf", "bow"],
    stats: { ad: 15, as: 0.15 },
    desc: "기본 공격과 스킬이 대상 최대 체력이 1600 이상이면 70%, 미만이면 10%의 추가 피해를 입힙니다."
  },
  hextech_gunblade: {
    id: "hextech_gunblade",
    name: "마법공학 총검",
    icon: "🔫✨",
    recipe: ["bf", "rod"],
    stats: { ad: 15, ap: 15 },
    desc: "스킬 피해의 33%만큼 체력을 회복합니다. 초과 회복량은 최대 400의 보호막으로 전환됩니다."
  },
  spear_of_shojin: {
    id: "spear_of_shojin",
    name: "쇼진의 창",
    icon: "🔱",
    recipe: ["bf", "tear"],
    stats: { ad: 15, mana: 15 },
    desc: "스킬 사용 후, 기본 공격을 할 때마다 마나를 5 추가로 회복합니다."
  },
  guardian_angel: {
    id: "guardian_angel",
    name: "수호천사",
    icon: "👼",
    recipe: ["bf", "vest"],
    stats: { ad: 15, armor: 20 },
    desc: "사망 시 2초 후 400의 체력을 얻고 부활하며 모든 부정적 효과를 제거합니다 (전투당 1회)."
  },
  bloodthirster: {
    id: "bloodthirster",
    name: "피바라기",
    icon: "🩸🗡️",
    recipe: ["bf", "cloak"],
    stats: { ad: 15, mr: 20 },
    desc: "물리 피해를 입히면 피해량의 40%만큼 체력을 회복합니다."
  },
  zekes_herald: {
    id: "zekes_herald",
    name: "지크의 전령",
    icon: "🚩⚡",
    recipe: ["bf", "belt"],
    stats: { ad: 15, hp: 150 },
    desc: "전투 시작 시 동일한 열 좌우 1칸 내 아군의 공격 속도를 +30% 증가시킵니다."
  },
  infinity_edge: {
    id: "infinity_edge",
    name: "무한의 대검",
    icon: "🗡️💎",
    recipe: ["bf", "glove"],
    stats: { ad: 15, critChance: 0.75, critDamage: 0.10 },
    desc: "치명타 확률이 75% 증가합니다. 치명타 확률이 100%를 초과하면 초과분 1%당 치명타 피해량이 0.5% 증가합니다."
  },
  divine_spat: {
    id: "divine_spat",
    name: "신성의 검 (상징)",
    icon: "✨🗡️",
    recipe: ["bf", "spatula"],
    stats: { ad: 15 },
    grantTrait: "divine",
    desc: "착용자에게 [신성] 특성을 부여합니다."
  },

  rapid_firecannon: {
    id: "rapid_firecannon",
    name: "고속 연사포",
    icon: "🎯",
    recipe: ["bow", "bow"],
    stats: { as: 0.30 },
    cannotMiss: true,
    rangeBonus: 1,
    desc: "사거리가 1칸 증가하고, 기본 공격이 절대 빗나가지(회피) 않습니다."
  },
  guinsoos_rageblade: {
    id: "guinsoos_rageblade",
    name: "구인수의 격노검",
    icon: "⚔️🔥",
    recipe: ["bow", "rod"],
    stats: { as: 0.15, ap: 15 },
    desc: "기본 공격 시 공격 속도가 6%씩 무제한(상한 5.0) 중첩 증가합니다."
  },
  statikk_shiv: {
    id: "statikk_shiv",
    name: "스태틱의 단검",
    icon: "⚡🏹",
    recipe: ["bow", "tear"],
    stats: { as: 0.15, mana: 15 },
    desc: "매 3번째 공격마다 번개를 연쇄 방출하여 4명의 적에게 80의 마법 피해를 입힙니다."
  },
  titans_resolve: {
    id: "titans_resolve",
    name: "거인의 결의",
    icon: "🗿⚡",
    recipe: ["bow", "vest"],
    stats: { as: 0.15, armor: 20 },
    desc: "공격하거나 피해를 입을 때마다 피해량이 +2%씩 최대 25회 중첩됩니다. 25중첩 시 방어력과 마법 저항력이 +25 증가합니다."
  },
  runaans_hurricane: {
    id: "runaans_hurricane",
    name: "루난의 허리케인",
    icon: "🌪️🏹",
    recipe: ["bow", "cloak"],
    stats: { as: 0.15, mr: 20 },
    desc: "기본 공격 시 주변 적 1명에게 탄환을 발사하여 공격력의 70% 피해를 입힙니다."
  },
  zzrot_portal: {
    id: "zzrot_portal",
    name: "즈롯 차원문",
    icon: "👾🌀",
    recipe: ["bow", "belt"],
    stats: { as: 0.15, hp: 150 },
    desc: "사망 시 체력 1800의 공허 생명체를 소환하여 주변 적을 도발합니다."
  },
  last_whisper: {
    id: "last_whisper",
    name: "최후의 속삭임",
    icon: "🏹💨",
    recipe: ["bow", "glove"],
    stats: { as: 0.15, critChance: 0.10, dodge: 0.10 },
    desc: "치명타 공격 시 대상의 방어력을 3초 동안 70% 감소시킵니다."
  },
  duelist_spat: {
    id: "duelist_spat",
    name: "결투가의 열정 (상징)",
    icon: "⚔️🥄",
    recipe: ["bow", "spatula"],
    stats: { as: 0.15 },
    grantTrait: "duelist",
    desc: "착용자에게 [결투가] 특성을 부여합니다."
  },

  rabadons_deathcap: {
    id: "rabadons_deathcap",
    name: "라바돈의 죽음모자",
    icon: "🧙‍♂️👑",
    recipe: ["rod", "rod"],
    stats: { ap: 70 },
    desc: "주문력이 70 증가합니다."
  },
  ludens_echo: {
    id: "ludens_echo",
    name: "루덴의 메아리",
    icon: "🔮💥",
    recipe: ["rod", "tear"],
    stats: { ap: 15, mana: 15 },
    desc: "스킬 사용 시 대상과 주변 적들에게 180의 마법 피해를 입힙니다."
  },
  locket_of_solari: {
    id: "locket_of_solari",
    name: "강철의 솔라리 펜던트",
    icon: "🛡️☀️",
    recipe: ["rod", "vest"],
    stats: { ap: 15, armor: 20 },
    desc: "전투 시작 시 동일한 열 2칸 이내의 아군에게 8초 동안 300의 보호막을 씌웁니다."
  },
  ionic_spark: {
    id: "ionic_spark",
    name: "이온 충격기",
    icon: "⚡🧙",
    recipe: ["rod", "cloak"],
    stats: { ap: 15, mr: 20 },
    desc: "2칸 이내 적의 마법 저항력을 40% 감소시키며, 적이 스킬 사용 시 최대 마나의 225% 마법 피해를 입힙니다."
  },
  morellonomicon: {
    id: "morellonomicon",
    name: "모렐로노미콘",
    icon: "📖🔥",
    recipe: ["rod", "belt"],
    stats: { ap: 15, hp: 150 },
    desc: "스킬 피해를 입히면 10초간 적 최대 체력의 25% 고정 화상 피해를 입히고 치유량을 50% 감소시킵니다."
  },
  jeweled_gauntlet: {
    id: "jeweled_gauntlet",
    name: "보석 건틀릿",
    icon: "🥊💎",
    recipe: ["rod", "glove"],
    stats: { ap: 15, critChance: 0.10, dodge: 0.10, critDamage: 0.40 },
    spellCrit: true,
    desc: "스킬 피해에 치명타가 적용될 수 있으며, 치명타 피해량이 40% 증가합니다."
  },
  cultist_spat: {
    id: "cultist_spat",
    name: "광신도의 가면 (상징)",
    icon: "👁️🥄",
    recipe: ["rod", "spatula"],
    stats: { ap: 15 },
    grantTrait: "cultist",
    desc: "착용자에게 [광신도] 특성을 부여합니다."
  },

  blue_buff: {
    id: "blue_buff",
    name: "푸른 파수꾼",
    icon: "💧💙",
    recipe: ["tear", "tear"],
    stats: { mana: 30 },
    desc: "스킬을 시전한 후 마나를 20 회복합니다."
  },
  frozen_heart: {
    id: "frozen_heart",
    name: "얼어붙은 심장",
    icon: "❄️💙",
    recipe: ["tear", "vest"],
    stats: { mana: 15, armor: 20 },
    desc: "2칸 이내 적들의 공격 속도를 35% 둔화시킵니다."
  },
  chalice_of_power: {
    id: "chalice_of_power",
    name: "권능의 성배",
    icon: "🏆✨",
    recipe: ["tear", "cloak"],
    stats: { mana: 15, mr: 20 },
    desc: "전투 시작 시 동일한 열 좌우 1칸 내 아군에게 주문력 +30을 부여합니다."
  },
  redemption: {
    id: "redemption",
    name: "구원",
    icon: "🕊️💚",
    recipe: ["tear", "belt"],
    stats: { mana: 15, hp: 150 },
    desc: "체력이 25% 이하로 떨어지면 2.5초 후 2칸 내 모든 아군의 체력을 800 회복합니다 (전투당 1회)."
  },
  hand_of_justice: {
    id: "hand_of_justice",
    name: "정의의 손길",
    icon: "🤲⚖️",
    recipe: ["tear", "glove"],
    stats: { mana: 15, critChance: 0.10, dodge: 0.10 },
    desc: "전투마다 [피해량 +40% 증가] 또는 [모든 피해 흡혈 +40%] 중 하나를 무작위로 획득합니다."
  },
  moonlight_spat: {
    id: "moonlight_spat",
    name: "달빛의 정수 (상징)",
    icon: "🌙🥄",
    recipe: ["tear", "spatula"],
    stats: { mana: 15 },
    grantTrait: "moonlight",
    desc: "착용자에게 [달빛] 특성을 부여합니다."
  },

  bramble_vest: {
    id: "bramble_vest",
    name: "덤불 조끼",
    icon: "🛡️🌵",
    recipe: ["vest", "vest"],
    stats: { armor: 40 },
    critImmune: true,
    desc: "받는 치명타 추가 피해를 무효화하고, 기본 공격에 피격 시 주변 적들에게 100의 마법 피해를 입힙니다 (2.5초 재사용 대기시간)."
  },
  gargoyle_stoneplate: {
    id: "gargoyle_stoneplate",
    name: "가고일 돌갑옷",
    icon: "🗿🛡️",
    recipe: ["vest", "cloak"],
    stats: { armor: 20, mr: 20 },
    desc: "자신을 공격 대상으로 삼는 적 1명당 방어력과 마법 저항력이 +15씩 증가합니다."
  },
  sunfire_cape: {
    id: "sunfire_cape",
    name: "태양불꽃 망토",
    icon: "🔥🧥",
    recipe: ["vest", "belt"],
    stats: { armor: 20, hp: 150 },
    desc: "2초마다 2칸 내 무작위 적 1명에게 10초간 최대 체력의 25% 고정 화상 피해와 50% 치유 감소를 적용합니다."
  },
  shroud_of_stillness: {
    id: "shroud_of_stillness",
    name: "침묵의 장막",
    icon: "🟣🛡️",
    recipe: ["vest", "glove"],
    stats: { armor: 20, critChance: 0.10, dodge: 0.10 },
    desc: "전투 시작 시 전방 일직선상의 적들에게 빔을 쏘아 첫 스킬 마나 소모량을 33% 증가시킵니다."
  },
  warlord_spat: {
    id: "warlord_spat",
    name: "대장군의 깃발 (상징)",
    icon: "🚩🛡️",
    recipe: ["vest", "spatula"],
    stats: { armor: 20 },
    grantTrait: "warlord",
    desc: "착용자에게 [대장군] 특성을 부여합니다."
  },

  dragons_claw: {
    id: "dragons_claw",
    name: "용의 발톱",
    icon: "🐉🛡️",
    recipe: ["cloak", "cloak"],
    stats: { mr: 40 },
    desc: "받는 마법 피해를 60% 감소시킵니다."
  },
  zephyr: {
    id: "zephyr",
    name: "서풍",
    icon: "🌪️👟",
    recipe: ["cloak", "belt"],
    stats: { mr: 20, hp: 150 },
    desc: "전투 시작 시 맞은편 대칭 위치의 적 1명을 5초 동안 전장에서 추방합니다 (행동 불가, 타겟 불가)."
  },
  quicksilver: {
    id: "quicksilver",
    name: "수은",
    icon: "🔮🧤",
    recipe: ["cloak", "glove"],
    stats: { mr: 20, critChance: 0.10, dodge: 0.10 },
    desc: "전투 시작 후 10초 동안 모든 군중 제어(CC) 효과에 면역이 됩니다."
  },
  fortune_spat: {
    id: "fortune_spat",
    name: "행운의 주사위 (상징)",
    icon: "🎲🥄",
    recipe: ["cloak", "spatula"],
    stats: { mr: 20 },
    grantTrait: "fortune",
    desc: "착용자에게 [행운] 특성을 부여합니다."
  },

  warmogs_armor: {
    id: "warmogs_armor",
    name: "워모그의 갑옷",
    icon: "💚🥋",
    recipe: ["belt", "belt"],
    stats: { hp: 1000 },
    desc: "체력이 1000 증가합니다."
  },
  trap_claw: {
    id: "trap_claw",
    name: "덫 발톱",
    icon: "🪤🥊",
    recipe: ["belt", "glove"],
    stats: { hp: 150, critChance: 0.10, dodge: 0.10 },
    desc: "전투 시작 시 스킬 방어막을 얻습니다. 방어막을 파괴한 적을 4초 동안 기절시킵니다."
  },
  the_boss_spat: {
    id: "the_boss_spat",
    name: "우두머리의 벨트 (상징)",
    icon: "💪🥄",
    recipe: ["belt", "spatula"],
    stats: { hp: 150 },
    grantTrait: "theBoss",
    desc: "착용자에게 [우두머리] 특성을 부여합니다."
  },

  thiefs_gloves: {
    id: "thiefs_gloves",
    name: "도적의 장갑",
    icon: "🥊🥊",
    recipe: ["glove", "glove"],
    stats: { critChance: 0.20, dodge: 0.20 },
    isThiefsGloves: true,
    desc: "아이템 슬롯 3칸을 모두 차지합니다. 매 전투 시작 시 무작위 완성 아이템 2개를 임시 장착합니다."
  },
  glove_spat: {
    id: "glove_spat",
    name: "결투가의 장갑 (상징)",
    icon: "🥊🥄",
    recipe: ["glove", "spatula"],
    stats: { critChance: 0.10, dodge: 0.10 },
    grantTrait: "duelist",
    desc: "착용자에게 [결투가] 특성을 부여합니다."
  },
  force_of_nature: {
    id: "force_of_nature",
    name: "자연의 힘",
    icon: "👑🥄",
    recipe: ["spatula", "spatula"],
    stats: {},
    teamSize: 1,
    desc: "팀의 최대 배치 인원 제한이 1명 증가합니다."
  }
};

// 기본 아이템 조합 레시피 맵 (알파벳 정렬 키: "itemA+itemB")
export const ITEM_RECIPES = {};
Object.values(ITEMS).forEach(item => {
  if (item.recipe && item.recipe.length === 2) {
    const key = [...item.recipe].sort().join("+");
    ITEM_RECIPES[key] = item.id;
  }
});

// 도적의 장갑 등에서 롤할 수 있는 완성 아이템 목록 (상징 및 도적의 장갑, 자연의 힘 제외)
export const CRAFTABLE_ITEMS = Object.keys(ITEMS).filter(id => {
  const item = ITEMS[id];
  return !item.isComponent && !item.grantTrait && !item.isThiefsGloves && item.id !== "force_of_nature";
});

