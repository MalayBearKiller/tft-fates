import { DROP_RATES, CHOSEN_DROP_RATES, LEVEL_EXP, TRAITS, CHAMPIONS, ROUNDS } from './data.js';
import { sound } from './audio.js';

// ==========================================
// 공용 상수 & 헬퍼
// ==========================================
const STAR_MULT = { 1: 1, 2: 1.8, 3: 3.24, 4: 5.8 };
const STAR_TEXT = { 1: "★", 2: "★★", 3: "★★★", 4: "★★★★" };
const COST_BORDER_COLORS = { 1: "#94a3b8", 2: "#22c55e", 3: "#38bdf8", 4: "#c084fc", 5: "#fbbf24" };
const TICK_MS = 100;
const COMBAT_TIME_LIMIT_MS = 40000;
const CHOSEN_BONUS = { hp: 200, ad: 15 };

function makeUid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

// 성급/선택받은 자 여부에 맞는 유닛 객체 생성
function makeUnit(champ, star, side, { isChosen = false, chosenTrait = null } = {}) {
  const unit = {
    uid: makeUid(side === "player" ? "u" : "enemy"),
    champ,
    star,
    isChosen,
    chosenTrait,
    as: champ.as,
    mana: champ.startMana,
    maxMana: champ.maxMana,
    shield: 0,
    side
  };
  applyStarStats(unit);
  return unit;
}

function applyStarStats(unit) {
  const mult = STAR_MULT[unit.star] || 1;
  unit.maxHp = Math.round(unit.champ.hp * mult + (unit.isChosen ? CHOSEN_BONUS.hp : 0));
  unit.hp = unit.maxHp;
  unit.ad = Math.round(unit.champ.ad * mult + (unit.isChosen ? CHOSEN_BONUS.ad : 0));
}

// 시너지 카운트 (같은 챔피언은 1번만, 선택받은 자 특성은 +1)
function countTraits(units) {
  const counts = {};
  const seen = new Set();
  units.forEach(u => {
    if (!seen.has(u.champ.id)) {
      seen.add(u.champ.id);
      u.champ.traits.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
    }
    if (u.isChosen && u.chosenTrait) {
      counts[u.chosenTrait] = (counts[u.chosenTrait] || 0) + 1;
    }
  });
  return counts;
}

// 활성화된 시너지 단계 (-1 = 비활성)
function traitTier(counts, traitKey) {
  const trait = TRAITS[traitKey];
  const count = counts[traitKey] || 0;
  let tier = -1;
  if (trait) trait.thresholds.forEach((th, idx) => { if (count >= th.count) tier = idx; });
  return tier;
}

// 유닛 토큰 내부 마크업 (준비 단계 & 전투 공용)
function unitTokenInnerHTML(unit) {
  const borderColor = unit.side === 'enemy' ? '#ef4444' : (unit.isChosen ? "#ffd700" : (COST_BORDER_COLORS[unit.champ.cost] || "#94a3b8"));
  const avatarHtml = unit.champ.image
    ? `<img class="unit-avatar-img" src="${unit.champ.image}" alt="${unit.champ.name}" draggable="false" style="--border-color: ${borderColor}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
       <span class="unit-icon" style="display:none;">${unit.champ.icon}</span>`
    : `<span class="unit-icon">${unit.champ.icon}</span>`;
  const hpPct = Math.max(0, Math.min(100, (unit.hp / unit.maxHp) * 100));
  const manaPct = unit.maxMana > 0 ? Math.min(100, (unit.mana / unit.maxMana) * 100) : 0;
  return `
    <div class="unit-stars ${unit.star === 4 ? 'star-4' : ''}">${STAR_TEXT[unit.star] || ''}</div>
    <div class="unit-bars">
      <div class="unit-hp-bar"><div class="unit-hp-fill" style="width: ${hpPct}%"></div><div class="unit-shield-fill" style="width: 0%"></div></div>
      <div class="unit-mana-bar ${manaPct >= 100 ? 'mana-full' : ''}"><div class="unit-mana-fill" style="width: ${manaPct}%"></div></div>
    </div>
    ${avatarHtml}
    <div class="unit-name">${unit.champ.name}</div>
  `;
}

// 8인 로비 상대 덱 풀 (플레이어와 동일하게 Lv.1부터 Lv.9까지 동적 성장)
const CHAMPION_SPLASH_KEYS = {
  yasuo: "Yasuo",
  diana: "Diana",
  tf: "TwistedFate",
  garen: "Garen",
  lissandra: "Lissandra",
  sylas: "Sylas",
  annie: "Annie",
  jax: "Jax",
  pyke: "Pyke",
  katarina: "Katarina",
  kalista: "Kalista",
  warwick: "Warwick",
  sejuani: "Sejuani",
  jhin: "Jhin",
  sett: "Sett",
  leesin: "LeeSin"
};

const OPPONENT_COMP_POOLS = {
  opp_sett: {
    name: "세트",
    levels: {
      1: { board: [{ champId: "garen", star: 1, row: 5, col: 3 }], bench: [] },
      2: { board: [{ champId: "garen", star: 1, row: 5, col: 3 }, { champId: "sylas", star: 1, row: 5, col: 4 }], bench: [{ champId: "pyke", star: 1, index: 0 }] },
      3: { board: [{ champId: "garen", star: 2, row: 5, col: 3 }, { champId: "sylas", star: 1, row: 5, col: 4 }, { champId: "pyke", star: 1, row: 4, col: 2 }], bench: [] },
      4: { board: [{ champId: "garen", star: 2, row: 5, col: 3 }, { champId: "sylas", star: 2, row: 5, col: 4 }, { champId: "pyke", star: 1, row: 4, col: 2 }, { champId: "katarina", star: 1, row: 4, col: 4 }], bench: [] },
      5: { board: [{ champId: "garen", star: 2, row: 5, col: 3 }, { champId: "katarina", star: 2, row: 4, col: 4 }, { champId: "sejuani", star: 1, row: 5, col: 2 }, { champId: "pyke", star: 2, row: 4, col: 2 }, { champId: "sylas", star: 2, row: 5, col: 4 }], bench: [{ champId: "warwick", star: 1, index: 0 }] },
      6: { board: [{ champId: "garen", star: 2, row: 5, col: 1 }, { champId: "katarina", star: 2, row: 4, col: 3 }, { champId: "sejuani", star: 2, row: 5, col: 5 }, { champId: "warwick", star: 1, row: 5, col: 2 }, { champId: "jhin", star: 1, row: 3, col: 5 }, { champId: "pyke", star: 2, row: 4, col: 1 }], bench: [{ champId: "sett", star: 1, index: 0 }] },
      7: { board: [{ champId: "sett", star: 2, row: 5, col: 3 }, { champId: "leesin", star: 2, row: 5, col: 4 }, { champId: "katarina", star: 2, row: 5, col: 2 }, { champId: "garen", star: 2, row: 5, col: 1 }, { champId: "sejuani", star: 2, row: 4, col: 5 }, { champId: "warwick", star: 2, row: 4, col: 1 }, { champId: "jhin", star: 2, row: 3, col: 5 }], bench: [{ champId: "annie", star: 2, index: 0 }] },
      8: { board: [{ champId: "sett", star: 2, row: 5, col: 3 }, { champId: "leesin", star: 2, row: 5, col: 4 }, { champId: "katarina", star: 2, row: 5, col: 2 }, { champId: "garen", star: 2, row: 5, col: 1 }, { champId: "sejuani", star: 2, row: 4, col: 5 }, { champId: "warwick", star: 2, row: 4, col: 1 }, { champId: "jhin", star: 2, row: 3, col: 5 }, { champId: "kalista", star: 2, row: 3, col: 2 }], bench: [] },
      9: { board: [{ champId: "sett", star: 2, row: 5, col: 3 }, { champId: "leesin", star: 2, row: 5, col: 4 }, { champId: "katarina", star: 2, row: 5, col: 2 }, { champId: "garen", star: 2, row: 5, col: 1 }, { champId: "sejuani", star: 2, row: 4, col: 5 }, { champId: "warwick", star: 2, row: 4, col: 1 }, { champId: "jhin", star: 2, row: 3, col: 5 }, { champId: "kalista", star: 2, row: 3, col: 2 }, { champId: "annie", star: 2, row: 4, col: 3 }], bench: [] }
    }
  },
  opp_warwick: {
    name: "워윅",
    levels: {
      1: { board: [{ champId: "jax", star: 1, row: 5, col: 3 }], bench: [] },
      2: { board: [{ champId: "jax", star: 1, row: 5, col: 3 }, { champId: "yasuo", star: 1, row: 5, col: 4 }], bench: [] },
      3: { board: [{ champId: "jax", star: 2, row: 5, col: 3 }, { champId: "yasuo", star: 1, row: 5, col: 4 }, { champId: "garen", star: 1, row: 5, col: 2 }], bench: [] },
      4: { board: [{ champId: "jax", star: 2, row: 5, col: 2 }, { champId: "yasuo", star: 2, row: 5, col: 4 }, { champId: "annie", star: 1, row: 4, col: 3 }, { champId: "garen", star: 1, row: 5, col: 1 }], bench: [] },
      5: { board: [{ champId: "warwick", star: 2, row: 5, col: 3 }, { champId: "jax", star: 2, row: 5, col: 2 }, { champId: "yasuo", star: 2, row: 5, col: 4 }, { champId: "sejuani", star: 1, row: 4, col: 3 }, { champId: "annie", star: 1, row: 4, col: 1 }], bench: [] },
      6: { board: [{ champId: "warwick", star: 2, row: 5, col: 3 }, { champId: "jax", star: 2, row: 5, col: 2 }, { champId: "yasuo", star: 2, row: 5, col: 4 }, { champId: "sejuani", star: 2, row: 4, col: 3 }, { champId: "annie", star: 1, row: 4, col: 1 }, { champId: "leesin", star: 1, row: 5, col: 5 }], bench: [] },
      7: { board: [{ champId: "warwick", star: 2, row: 5, col: 3 }, { champId: "jax", star: 2, row: 5, col: 2 }, { champId: "yasuo", star: 2, row: 5, col: 4 }, { champId: "sejuani", star: 2, row: 4, col: 3 }, { champId: "annie", star: 2, row: 4, col: 1 }, { champId: "leesin", star: 2, row: 5, col: 5 }, { champId: "sett", star: 1, row: 5, col: 1 }], bench: [] },
      8: { board: [{ champId: "warwick", star: 2, row: 5, col: 3 }, { champId: "jax", star: 2, row: 5, col: 2 }, { champId: "yasuo", star: 2, row: 5, col: 4 }, { champId: "sejuani", star: 2, row: 4, col: 3 }, { champId: "annie", star: 2, row: 4, col: 1 }, { champId: "leesin", star: 2, row: 5, col: 5 }, { champId: "sett", star: 2, row: 5, col: 1 }, { champId: "kalista", star: 2, row: 3, col: 3 }], bench: [] },
      9: { board: [{ champId: "warwick", star: 2, row: 5, col: 3 }, { champId: "jax", star: 2, row: 5, col: 2 }, { champId: "yasuo", star: 2, row: 5, col: 4 }, { champId: "sejuani", star: 2, row: 4, col: 3 }, { champId: "annie", star: 2, row: 4, col: 1 }, { champId: "leesin", star: 2, row: 5, col: 5 }, { champId: "sett", star: 2, row: 5, col: 1 }, { champId: "kalista", star: 2, row: 3, col: 3 }, { champId: "jhin", star: 2, row: 3, col: 5 }], bench: [] }
    }
  },
  opp_cultist: {
    name: "트페",
    levels: {
      1: { board: [{ champId: "tf", star: 1, row: 3, col: 3 }], bench: [] },
      2: { board: [{ champId: "tf", star: 1, row: 3, col: 3 }, { champId: "pyke", star: 1, row: 5, col: 3 }], bench: [] },
      3: { board: [{ champId: "tf", star: 2, row: 3, col: 3 }, { champId: "pyke", star: 1, row: 5, col: 2 }, { champId: "garen", star: 1, row: 5, col: 4 }], bench: [] },
      4: { board: [{ champId: "tf", star: 2, row: 3, col: 2 }, { champId: "pyke", star: 1, row: 5, col: 4 }, { champId: "kalista", star: 1, row: 3, col: 1 }, { champId: "garen", star: 2, row: 5, col: 3 }], bench: [] },
      5: { board: [{ champId: "tf", star: 2, row: 3, col: 2 }, { champId: "pyke", star: 2, row: 5, col: 4 }, { champId: "kalista", star: 1, row: 3, col: 1 }, { champId: "jhin", star: 1, row: 3, col: 5 }, { champId: "garen", star: 2, row: 5, col: 3 }], bench: [] },
      6: { board: [{ champId: "tf", star: 2, row: 3, col: 2 }, { champId: "pyke", star: 2, row: 5, col: 4 }, { champId: "kalista", star: 2, row: 3, col: 1 }, { champId: "jhin", star: 1, row: 3, col: 5 }, { champId: "garen", star: 2, row: 5, col: 3 }, { champId: "sejuani", star: 1, row: 5, col: 2 }], bench: [] },
      7: { board: [{ champId: "tf", star: 2, row: 3, col: 2 }, { champId: "pyke", star: 2, row: 5, col: 4 }, { champId: "kalista", star: 2, row: 3, col: 1 }, { champId: "jhin", star: 2, row: 3, col: 5 }, { champId: "garen", star: 2, row: 5, col: 3 }, { champId: "sejuani", star: 2, row: 5, col: 2 }, { champId: "leesin", star: 1, row: 5, col: 5 }], bench: [] },
      8: { board: [{ champId: "tf", star: 3, row: 3, col: 2 }, { champId: "pyke", star: 2, row: 5, col: 4 }, { champId: "kalista", star: 2, row: 3, col: 1 }, { champId: "jhin", star: 2, row: 3, col: 5 }, { champId: "garen", star: 2, row: 5, col: 3 }, { champId: "sejuani", star: 2, row: 5, col: 2 }, { champId: "leesin", star: 2, row: 5, col: 5 }, { champId: "sett", star: 2, row: 5, col: 1 }], bench: [] },
      9: { board: [{ champId: "tf", star: 3, row: 3, col: 2 }, { champId: "pyke", star: 2, row: 5, col: 4 }, { champId: "kalista", star: 2, row: 3, col: 1 }, { champId: "jhin", star: 2, row: 3, col: 5 }, { champId: "garen", star: 2, row: 5, col: 3 }, { champId: "sejuani", star: 2, row: 5, col: 2 }, { champId: "leesin", star: 2, row: 5, col: 5 }, { champId: "sett", star: 2, row: 5, col: 1 }, { champId: "warwick", star: 2, row: 4, col: 3 }], bench: [] }
    }
  },
  opp_yasuo: {
    name: "야스오",
    levels: {
      1: { board: [{ champId: "yasuo", star: 1, row: 5, col: 3 }], bench: [] },
      2: { board: [{ champId: "yasuo", star: 1, row: 5, col: 3 }, { champId: "jax", star: 1, row: 5, col: 4 }], bench: [] },
      3: { board: [{ champId: "yasuo", star: 2, row: 5, col: 3 }, { champId: "jax", star: 1, row: 5, col: 4 }, { champId: "diana", star: 1, row: 5, col: 2 }], bench: [] },
      4: { board: [{ champId: "yasuo", star: 2, row: 5, col: 3 }, { champId: "jax", star: 1, row: 5, col: 4 }, { champId: "kalista", star: 1, row: 3, col: 1 }, { champId: "garen", star: 1, row: 5, col: 2 }], bench: [] },
      5: { board: [{ champId: "yasuo", star: 2, row: 5, col: 3 }, { champId: "jax", star: 1, row: 5, col: 4 }, { champId: "kalista", star: 1, row: 3, col: 1 }, { champId: "garen", star: 2, row: 5, col: 2 }, { champId: "diana", star: 1, row: 5, col: 5 }], bench: [] },
      6: { board: [{ champId: "yasuo", star: 3, row: 5, col: 3 }, { champId: "jax", star: 2, row: 5, col: 4 }, { champId: "kalista", star: 2, row: 3, col: 1 }, { champId: "garen", star: 2, row: 5, col: 2 }, { champId: "diana", star: 2, row: 5, col: 5 }, { champId: "leesin", star: 1, row: 5, col: 1 }], bench: [] },
      7: { board: [{ champId: "yasuo", star: 3, row: 5, col: 3 }, { champId: "jax", star: 2, row: 5, col: 4 }, { champId: "kalista", star: 2, row: 3, col: 1 }, { champId: "garen", star: 2, row: 5, col: 2 }, { champId: "diana", star: 2, row: 5, col: 5 }, { champId: "leesin", star: 2, row: 5, col: 1 }, { champId: "sett", star: 1, row: 4, col: 3 }], bench: [] },
      8: { board: [{ champId: "yasuo", star: 3, row: 5, col: 3 }, { champId: "jax", star: 3, row: 5, col: 4 }, { champId: "kalista", star: 2, row: 3, col: 1 }, { champId: "garen", star: 2, row: 5, col: 2 }, { champId: "diana", star: 2, row: 5, col: 5 }, { champId: "leesin", star: 2, row: 5, col: 1 }, { champId: "sett", star: 2, row: 4, col: 3 }, { champId: "warwick", star: 2, row: 4, col: 5 }], bench: [] },
      9: { board: [{ champId: "yasuo", star: 3, row: 5, col: 3 }, { champId: "jax", star: 3, row: 5, col: 4 }, { champId: "kalista", star: 3, row: 3, col: 1 }, { champId: "garen", star: 2, row: 5, col: 2 }, { champId: "diana", star: 2, row: 5, col: 5 }, { champId: "leesin", star: 2, row: 5, col: 1 }, { champId: "sett", star: 2, row: 4, col: 3 }, { champId: "warwick", star: 2, row: 4, col: 5 }, { champId: "sejuani", star: 2, row: 4, col: 1 }], bench: [] }
    }
  },
  opp_diana: {
    name: "다이애나",
    levels: {
      1: { board: [{ champId: "diana", star: 1, row: 5, col: 3 }], bench: [] },
      2: { board: [{ champId: "diana", star: 1, row: 5, col: 3 }, { champId: "sylas", star: 1, row: 5, col: 4 }], bench: [] },
      3: { board: [{ champId: "diana", star: 2, row: 5, col: 3 }, { champId: "sylas", star: 1, row: 5, col: 4 }, { champId: "lissandra", star: 1, row: 3, col: 4 }], bench: [] },
      4: { board: [{ champId: "diana", star: 2, row: 5, col: 2 }, { champId: "lissandra", star: 1, row: 3, col: 5 }, { champId: "sylas", star: 1, row: 5, col: 4 }, { champId: "garen", star: 1, row: 5, col: 3 }], bench: [] },
      5: { board: [{ champId: "diana", star: 3, row: 5, col: 2 }, { champId: "lissandra", star: 2, row: 3, col: 5 }, { champId: "sylas", star: 2, row: 5, col: 4 }, { champId: "garen", star: 2, row: 5, col: 3 }, { champId: "pyke", star: 1, row: 4, col: 2 }], bench: [] },
      6: { board: [{ champId: "diana", star: 3, row: 5, col: 2 }, { champId: "lissandra", star: 2, row: 3, col: 5 }, { champId: "sylas", star: 2, row: 5, col: 4 }, { champId: "garen", star: 2, row: 5, col: 3 }, { champId: "pyke", star: 2, row: 4, col: 2 }, { champId: "sejuani", star: 1, row: 4, col: 4 }], bench: [] },
      7: { board: [{ champId: "diana", star: 3, row: 5, col: 2 }, { champId: "lissandra", star: 3, row: 3, col: 5 }, { champId: "sylas", star: 3, row: 5, col: 4 }, { champId: "garen", star: 2, row: 5, col: 3 }, { champId: "pyke", star: 2, row: 4, col: 2 }, { champId: "sejuani", star: 2, row: 4, col: 4 }, { champId: "warwick", star: 1, row: 5, col: 1 }], bench: [] },
      8: { board: [{ champId: "diana", star: 3, row: 5, col: 2 }, { champId: "lissandra", star: 3, row: 3, col: 5 }, { champId: "sylas", star: 3, row: 5, col: 4 }, { champId: "garen", star: 3, row: 5, col: 3 }, { champId: "pyke", star: 2, row: 4, col: 2 }, { champId: "sejuani", star: 2, row: 4, col: 4 }, { champId: "warwick", star: 2, row: 5, col: 1 }, { champId: "sett", star: 2, row: 5, col: 5 }], bench: [] },
      9: { board: [{ champId: "diana", star: 3, row: 5, col: 2 }, { champId: "lissandra", star: 3, row: 3, col: 5 }, { champId: "sylas", star: 3, row: 5, col: 4 }, { champId: "garen", star: 3, row: 5, col: 3 }, { champId: "pyke", star: 2, row: 4, col: 2 }, { champId: "sejuani", star: 2, row: 4, col: 4 }, { champId: "warwick", star: 2, row: 5, col: 1 }, { champId: "sett", star: 2, row: 5, col: 5 }, { champId: "leesin", star: 2, row: 4, col: 1 }], bench: [] }
    }
  },
  opp_garen: {
    name: "가렌",
    levels: {
      1: { board: [{ champId: "garen", star: 1, row: 5, col: 3 }], bench: [] },
      2: { board: [{ champId: "garen", star: 1, row: 5, col: 3 }, { champId: "pyke", star: 1, row: 5, col: 2 }], bench: [] },
      3: { board: [{ champId: "garen", star: 2, row: 5, col: 3 }, { champId: "pyke", star: 1, row: 5, col: 2 }, { champId: "tf", star: 1, row: 3, col: 3 }], bench: [] },
      4: { board: [{ champId: "garen", star: 2, row: 5, col: 3 }, { champId: "pyke", star: 1, row: 5, col: 2 }, { champId: "tf", star: 1, row: 3, col: 3 }, { champId: "katarina", star: 1, row: 4, col: 4 }], bench: [] },
      5: { board: [{ champId: "garen", star: 2, row: 5, col: 3 }, { champId: "pyke", star: 2, row: 5, col: 2 }, { champId: "tf", star: 2, row: 3, col: 3 }, { champId: "katarina", star: 1, row: 4, col: 4 }, { champId: "sejuani", star: 1, row: 5, col: 4 }], bench: [] },
      6: { board: [{ champId: "garen", star: 3, row: 5, col: 3 }, { champId: "pyke", star: 2, row: 5, col: 2 }, { champId: "tf", star: 2, row: 3, col: 3 }, { champId: "katarina", star: 2, row: 4, col: 4 }, { champId: "sejuani", star: 2, row: 5, col: 4 }, { champId: "sett", star: 1, row: 5, col: 1 }], bench: [] },
      7: { board: [{ champId: "garen", star: 3, row: 5, col: 3 }, { champId: "pyke", star: 2, row: 5, col: 2 }, { champId: "tf", star: 2, row: 3, col: 3 }, { champId: "katarina", star: 2, row: 4, col: 4 }, { champId: "sejuani", star: 2, row: 5, col: 4 }, { champId: "sett", star: 2, row: 5, col: 1 }, { champId: "leesin", star: 1, row: 5, col: 5 }], bench: [] },
      8: { board: [{ champId: "garen", star: 3, row: 5, col: 3 }, { champId: "pyke", star: 2, row: 5, col: 2 }, { champId: "tf", star: 3, row: 3, col: 3 }, { champId: "katarina", star: 2, row: 4, col: 4 }, { champId: "sejuani", star: 2, row: 5, col: 4 }, { champId: "sett", star: 2, row: 5, col: 1 }, { champId: "leesin", star: 2, row: 5, col: 5 }, { champId: "jhin", star: 2, row: 3, col: 5 }], bench: [] },
      9: { board: [{ champId: "garen", star: 3, row: 5, col: 3 }, { champId: "pyke", star: 3, row: 5, col: 2 }, { champId: "tf", star: 3, row: 3, col: 3 }, { champId: "katarina", star: 2, row: 4, col: 4 }, { champId: "sejuani", star: 2, row: 5, col: 4 }, { champId: "sett", star: 2, row: 5, col: 1 }, { champId: "leesin", star: 2, row: 5, col: 5 }, { champId: "jhin", star: 2, row: 3, col: 5 }, { champId: "warwick", star: 2, row: 4, col: 1 }], bench: [] }
    }
  },
  opp_fortune: {
    name: "카타리나",
    levels: {
      1: { board: [{ champId: "annie", star: 1, row: 5, col: 3 }], bench: [] },
      2: { board: [{ champId: "annie", star: 1, row: 5, col: 3 }, { champId: "tf", star: 1, row: 3, col: 3 }], bench: [] },
      3: { board: [{ champId: "annie", star: 1, row: 5, col: 3 }, { champId: "katarina", star: 1, row: 4, col: 4 }, { champId: "tf", star: 1, row: 3, col: 3 }], bench: [] },
      4: { board: [{ champId: "katarina", star: 2, row: 5, col: 3 }, { champId: "annie", star: 1, row: 5, col: 2 }, { champId: "garen", star: 1, row: 5, col: 4 }, { champId: "pyke", star: 1, row: 4, col: 2 }], bench: [] },
      5: { board: [{ champId: "katarina", star: 2, row: 5, col: 3 }, { champId: "annie", star: 2, row: 5, col: 2 }, { champId: "garen", star: 2, row: 5, col: 4 }, { champId: "pyke", star: 1, row: 4, col: 2 }, { champId: "sejuani", star: 1, row: 5, col: 1 }], bench: [] },
      6: { board: [{ champId: "katarina", star: 2, row: 5, col: 3 }, { champId: "annie", star: 2, row: 5, col: 2 }, { champId: "garen", star: 2, row: 5, col: 4 }, { champId: "pyke", star: 2, row: 4, col: 2 }, { champId: "sejuani", star: 2, row: 5, col: 1 }, { champId: "jhin", star: 1, row: 3, col: 5 }], bench: [] },
      7: { board: [{ champId: "katarina", star: 2, row: 5, col: 3 }, { champId: "annie", star: 3, row: 5, col: 2 }, { champId: "garen", star: 2, row: 5, col: 4 }, { champId: "pyke", star: 2, row: 4, col: 2 }, { champId: "sejuani", star: 2, row: 5, col: 1 }, { champId: "jhin", star: 2, row: 3, col: 5 }, { champId: "sett", star: 2, row: 5, col: 5 }], bench: [] },
      8: { board: [{ champId: "katarina", star: 3, row: 5, col: 3 }, { champId: "annie", star: 3, row: 5, col: 2 }, { champId: "garen", star: 2, row: 5, col: 4 }, { champId: "pyke", star: 2, row: 4, col: 2 }, { champId: "sejuani", star: 2, row: 5, col: 1 }, { champId: "jhin", star: 2, row: 3, col: 5 }, { champId: "sett", star: 2, row: 5, col: 5 }, { champId: "leesin", star: 2, row: 4, col: 4 }], bench: [] },
      9: { board: [{ champId: "katarina", star: 3, row: 5, col: 3 }, { champId: "annie", star: 3, row: 5, col: 2 }, { champId: "garen", star: 3, row: 5, col: 4 }, { champId: "pyke", star: 2, row: 4, col: 2 }, { champId: "sejuani", star: 2, row: 5, col: 1 }, { champId: "jhin", star: 2, row: 3, col: 5 }, { champId: "sett", star: 2, row: 5, col: 5 }, { champId: "leesin", star: 2, row: 4, col: 4 }, { champId: "warwick", star: 2, row: 4, col: 1 }], bench: [] }
    }
  }
};


class TFTGame {
  constructor() {
    this.player = {
      hp: 100,
      gold: 10,
      level: 2,
      exp: 0,
      maxExp: LEVEL_EXP[2],
      chosenChamp: null, // 현재 소유한 선택받은 자 기물 (1개만 소유 가능)
      winStreak: 0,
      lossStreak: 0,
      fortuneStreak: 0,
      warlordWins: 0 // 대장군 활성 상태 승리 횟수 (최대 5회 중첩)
    };

    this.synergyPage = 0;
    this.roundIdx = 0;
    this.phase = "planning"; // "planning" | "combat"
    this.shopLocked = false;
    this.shopSlots = [null, null, null, null, null];

    // 6행 x 7열 전장 (0~2 적군, 3~5 아군)
    this.board = Array(6).fill(null).map(() => Array(7).fill(null));
    // 벤치 (9칸)
    this.bench = Array(9).fill(null);

    // 드래그 중인 유닛 정보
    this.draggedUnit = null;
    this.dragSource = null; // { type: 'bench', index: 0 } or { type: 'board', row: 3, col: 0 }
    this.selectedUnitInfo = null; // 클릭으로 선택된 유닛 정보 (Click-to-Move 지원)
    this.hoveredUnit = null;

    // 전투 시뮬레이션 객체
    this.battle = null;
    this.combatInterval = null;
    this.battleSeq = 0;

    // 8인 로비 플레이어 & 정찰(Scouting) 상태
    this.scoutedPlayerId = null; // null 또는 "player"면 내 결투장
    this.initLobbyOpponents();

    this.initDOM();
    this.setupEventListeners();
    this.initGame();
  }

  initDOM() {
    this.dom = {
      stageNumber: document.getElementById("stage-number"),
      stageTrackerCenter: document.getElementById("stage-tracker-center"),
      stageSubname: document.getElementById("stage-subname"),
      playerHpFill: document.getElementById("player-hp-fill"),
      playerHpText: document.getElementById("player-hp-text"),
      goldDisplay: document.getElementById("gold-display"),
      fortuneBadge: document.getElementById("fortune-badge"),
      fortuneCount: document.getElementById("fortune-count"),
      synergyList: document.getElementById("synergy-list"),
      synergyItemsContainer: document.getElementById("synergy-items-container"),
      synergyTitleText: document.getElementById("synergy-title-text"),
      synergyBoardCount: document.getElementById("synergy-board-count"),
      boardGrid: document.getElementById("board-grid"),
      boardScaler: document.getElementById("board-scaler"),
      boardContainer: document.querySelector(".board-container"),
      benchContainer: document.getElementById("bench-container"),
      benchOwnerLabel: document.getElementById("bench-owner-label"),
      enemyBenchContainer: document.getElementById("enemy-bench-container"),
      enemyBenchLabel: document.getElementById("enemy-bench-label"),
      shopCards: document.getElementById("shop-cards"),
      levelNumber: document.getElementById("level-number"),
      deployChip: document.getElementById("deploy-chip"),
      deployCount: document.getElementById("deploy-count"),
      expBarFill: document.getElementById("exp-bar-fill"),
      expText: document.getElementById("exp-text"),
      rateLevelLabel: document.getElementById("rate-level-label"),
      levelBadge: document.getElementById("level-badge"),
      expBtn: document.getElementById("btn-buy-exp"),
      rerollBtn: document.getElementById("btn-reroll"),
      lockBtn: document.getElementById("btn-lock"),
      startCombatBtn: document.getElementById("btn-start-combat"),
      skipCombatBtn: document.getElementById("btn-skip-combat"),
      resetGameBtn: document.getElementById("btn-reset-game"),
      sellDropzone: document.getElementById("sell-dropzone"),
      bgmExpandableBox: document.getElementById("bgm-expandable-box"),
      bgmMuteBtn: document.getElementById("btn-bgm-mute"),
      bgmVolume: document.getElementById("bgm-volume"),
      bgmVolText: document.getElementById("bgm-vol-text"),
      overlayContainer: document.getElementById("overlay-container"),
      modalContainer: document.getElementById("modal-container"),
      ratesDisplay: document.getElementById("shop-rates-display"),
      stageTimeline: document.getElementById("stage-round-timeline"),
      btnSynergyPrev: document.getElementById("btn-synergy-prev"),
      btnSynergyNext: document.getElementById("btn-synergy-next"),
      synergyPageText: document.getElementById("synergy-page-text"),
      scoreboardList: document.getElementById("scoreboard-list"),
      scoutBanner: document.getElementById("scout-banner"),
      scoutBannerText: document.getElementById("scout-banner-text"),
      btnReturnHome: document.getElementById("btn-return-home"),
      playerInterestPods: document.getElementById("player-interest-pods"),
      enemyInterestPods: document.getElementById("enemy-interest-pods")
    };
  }

  // 기물 배치/이동 중에만 전장 육각 격자를 점등 (평소엔 성소 석조 바닥 노출)
  setPlacingMode(active) {
    if (!this.dom.boardGrid) return;
    const isScouting = (this.scoutedPlayerId && this.scoutedPlayerId !== "player");
    const shouldShow = !!(active && this.phase === "planning" && !isScouting);
    this.dom.boardGrid.classList.toggle("placing-active", shouldShow);
  }

  initGame() {
    this.buildBoardGrid();
    this.buildBenchGrid();

    this.previewEnemyUnits(ROUNDS[this.roundIdx]);
    this.refreshShop(true);
    this.updateHUD();
    this.updateSynergies();
    this.updateScoreboardUI();
    this.updateScoutBanner();
    this.renderUnits();
    this.fitBoardToScreen();

    // BGM은 기본 항상 ON (볼륨 0 = 꺼짐)
    sound.initBGM();
    this.updateBGMUI(sound.bgmVolume);

    // 브라우저 정책 대응: 화면 클릭이나 아무 키 입력 시 즉시 자동 시작
    const startBGM = () => {
      sound.playBGMAuto();
    };
    window.addEventListener("click", startBGM, { passive: true });
    window.addEventListener("keydown", startBGM, { passive: true });
    sound.playBGMAuto(); // 브라우저가 허용하면 즉시 재생
  }

  updateBGMUI(vol) {
    if (this.dom.bgmVolume) {
      this.dom.bgmVolume.value = vol;
    }
    if (this.dom.bgmVolText) {
      this.dom.bgmVolText.textContent = `${Math.round(vol * 100)}%`;
    }
    if (this.dom.bgmMuteBtn) {
      this.dom.bgmMuteBtn.textContent = vol === 0 ? "🔇" : vol < 0.5 ? "🔉" : "🔊";
      this.dom.bgmMuteBtn.title = vol === 0 ? "음소거 해제 [B]" : "음소거 [B]";
    }
  }

  // 전체 화면(플로팅 HUD 사이 공간)에 맞춰 성소 결투장을 화면 중앙에 확대/축소
  fitBoardToScreen() {
    const scaler = this.dom.boardScaler;
    const container = this.dom.boardContainer;
    if (!scaler || !container) return;
    const availW = Math.max(280, window.innerWidth - 260);
    const availH = Math.max(240, window.innerHeight - 280);
    const baseW = 790;
    const baseH = 550;
    const s = Math.min(availW / baseW, availH / baseH);
    const finalScale = Math.max(0.42, Math.min(1.25, s));
    scaler.style.transform = `scale(${finalScale.toFixed(3)})`;
  }

  buildBoardGrid() {
    this.dom.boardGrid.innerHTML = '';

    // 6행 (0~2 적군, 3~5 아군) x 7열
    for (let r = 0; r < 6; r++) {
      const rowEl = document.createElement("div");
      rowEl.className = `board-row ${r % 2 === 1 ? 'odd-row' : 'even-row'}`;
      for (let c = 0; c < 7; c++) {
        const cell = document.createElement("div");
        cell.className = `grid-cell ${r < 3 ? 'enemy-zone' : 'player-zone'}`;
        cell.dataset.row = r;
        cell.dataset.col = c;
        rowEl.appendChild(cell);
      }
      this.dom.boardGrid.appendChild(rowEl);
    }

    // 육각 타일은 clip-path로 잘려 있고 행이 겹쳐 있어서 타일 사이 틈/모서리를 누르면
    // 타일이 아닌 행(row)이 클릭된다. 그래서 보드 전체에서 이벤트를 받고 가장 가까운 아군 타일로 보정한다.
    const grid = this.dom.boardGrid;
    grid.addEventListener("click", (e) => {
      if (this.phase !== "planning") return;
      if (this.scoutedPlayerId && this.scoutedPlayerId !== "player") {
        this.showToastNotification("🔍 현재 상대 결투장 정찰 중입니다. 내 결투장으로 복귀하려면 상단 버튼이나 Space를 누르세요.", "info");
        return;
      }
      if (e.target.closest(".unit-token")) return; // 토큰 클릭은 토큰 핸들러가 처리
      const cell = this.resolvePlayerCell(e);
      if (!cell) return;
      const r = +cell.dataset.row, c = +cell.dataset.col;
      if (this.selectedUnitInfo) {
        this.executeMoveToBoard(this.selectedUnitInfo.unit, this.selectedUnitInfo.source, r, c);
        this.clearSelection();
      } else if (this.board[r][c] && this.board[r][c].side === "player") {
        this.selectUnit(this.board[r][c], { type: "board", row: r, col: c });
      }
    });

    grid.addEventListener("dragover", (e) => {
      if (this.phase !== "planning" || !this.draggedUnit || (this.scoutedPlayerId && this.scoutedPlayerId !== "player")) return;
      const cell = this.resolvePlayerCell(e);
      this.setDragOver(cell);
      if (!cell) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    });
    grid.addEventListener("dragleave", (e) => {
      if (!grid.contains(e.relatedTarget)) this.setDragOver(null);
    });
    grid.addEventListener("drop", (e) => {
      e.preventDefault();
      this.setDragOver(null);
      if (this.scoutedPlayerId && this.scoutedPlayerId !== "player") return;
      const cell = this.resolvePlayerCell(e);
      if (cell && this.draggedUnit && this.dragSource) {
        this.executeMoveToBoard(this.draggedUnit, this.dragSource, +cell.dataset.row, +cell.dataset.col);
      }
      this.draggedUnit = null;
      this.dragSource = null;
      this.clearSelection();
    });
  }

  // 포인터 위치에서 가장 가까운 아군 진영 타일 찾기 (적 진영이면 null)
  resolvePlayerCell(e) {
    let cell = e.target.closest ? e.target.closest(".grid-cell") : null;
    if (!cell) {
      let best = null, bestD = Infinity;
      this.dom.boardGrid.querySelectorAll(".grid-cell").forEach(el => {
        const rect = el.getBoundingClientRect();
        const d = Math.hypot(e.clientX - (rect.left + rect.width / 2), e.clientY - (rect.top + rect.height / 2));
        if (d < bestD) { bestD = d; best = el; }
      });
      if (best && bestD <= best.getBoundingClientRect().width * 0.75) cell = best;
    }
    if (!cell || +cell.dataset.row < 3) return null;
    return cell;
  }

  setDragOver(el) {
    if (this.dragOverEl === el) return;
    if (this.dragOverEl) this.dragOverEl.classList.remove("drag-over");
    this.dragOverEl = el;
    if (el) el.classList.add("drag-over");
  }

  buildBenchGrid() {
    // 1. 아군 대기석 (체스판 하단에 밀착 도킹된 9칸)
    const bench = this.dom.benchContainer;
    if (bench) {
      bench.innerHTML = '';
      for (let i = 0; i < 9; i++) {
        const cell = document.createElement("div");
        cell.className = "bench-cell player-bench-cell";
        cell.dataset.benchIndex = i;
        bench.appendChild(cell);
      }
    }

    // 2. 적 대기석 (체스판 상단 적 진영 위에 위치한 9칸)
    const enemyBench = this.dom.enemyBenchContainer;
    if (enemyBench) {
      enemyBench.innerHTML = '';
      for (let i = 0; i < 9; i++) {
        const cell = document.createElement("div");
        cell.className = "bench-cell enemy-bench-cell";
        cell.dataset.benchIndex = i;
        enemyBench.appendChild(cell);
      }
    }

    // 칸 사이 틈을 눌러도 가장 가까운 벤치 칸으로 보정
    const resolve = (e) => {
      let cell = e.target.closest(".bench-cell");
      if (!cell && bench) {
        let bestD = Infinity;
        bench.querySelectorAll(".bench-cell").forEach(el => {
          const rect = el.getBoundingClientRect();
          const d = Math.abs(e.clientX - (rect.left + rect.width / 2));
          if (d < bestD) { bestD = d; cell = el; }
        });
      }
      return cell;
    };

    bench.addEventListener("click", (e) => {
      if (this.phase !== "planning") return;
      if (this.scoutedPlayerId && this.scoutedPlayerId !== "player") {
        this.showToastNotification("🔍 현재 상대 대기석 정찰 중입니다. 내 결투장으로 복귀하려면 상단 버튼이나 Space를 누르세요.", "info");
        return;
      }
      if (e.target.closest(".unit-token")) return;
      const cell = resolve(e);
      if (!cell) return;
      const i = +cell.dataset.benchIndex;
      if (this.selectedUnitInfo) {
        this.executeMoveToBench(this.selectedUnitInfo.unit, this.selectedUnitInfo.source, i);
        this.clearSelection();
      } else if (this.bench[i]) {
        this.selectUnit(this.bench[i], { type: "bench", index: i });
      }
    });
    bench.addEventListener("dragover", (e) => {
      if (this.phase !== "planning" || !this.draggedUnit || (this.scoutedPlayerId && this.scoutedPlayerId !== "player")) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      this.setDragOver(resolve(e));
    });
    bench.addEventListener("dragleave", (e) => {
      if (!bench.contains(e.relatedTarget)) this.setDragOver(null);
    });
    bench.addEventListener("drop", (e) => {
      e.preventDefault();
      this.setDragOver(null);
      if (this.scoutedPlayerId && this.scoutedPlayerId !== "player") return;
      const cell = resolve(e);
      if (cell && this.draggedUnit && this.dragSource) {
        this.executeMoveToBench(this.draggedUnit, this.dragSource, +cell.dataset.benchIndex);
      }
      this.draggedUnit = null;
      this.dragSource = null;
      this.clearSelection();
    });
  }

  setupEventListeners() {
    window.addEventListener("resize", () => this.fitBoardToScreen());

    if (this.dom.btnReturnHome) {
      this.dom.btnReturnHome.addEventListener("click", () => this.scoutPlayer("player"));
    }

    // 키보드 단축키
    window.addEventListener("keydown", (e) => {
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
      if (this.dom.modalContainer.children.length > 0) return; // 모달 열려 있으면 단축키 무시
      const key = e.key.toUpperCase();
      if (key === " " || key === "TAB") e.preventDefault(); // 스크롤 & 포커스 방지
      if (e.repeat && key !== "D") return;

      // 특성 페이지 넘김 ([ 이전, ] 다음)
      if (e.key === "[" && this.synergyPage > 0) {
        this.synergyPage--;
        this.updateSynergies();
        return;
      }
      if (e.key === "]") {
        const totalPages = Math.ceil(Object.keys(TRAITS).length / 4);
        if (this.synergyPage < totalPages - 1) {
          this.synergyPage++;
          this.updateSynergies();
        }
        return;
      }

      // Tab 또는 Q: 8인 로비 순환 정찰
      if (key === "TAB" || key === "Q") {
        this.cycleScouting(1);
        return;
      }

      if (key === "D") {
        this.rerollShop();
      } else if (key === "F") {
        this.buyExp();
      } else if (["1", "2", "3", "4", "5"].includes(e.key)) {
        if (e.key === "1" && this.scoutedPlayerId && this.scoutedPlayerId !== "player") {
          this.scoutPlayer("player");
          return;
        }
        const slotIdx = parseInt(e.key, 10) - 1;
        this.buyShopCard(slotIdx);
      } else if (key === "E") {
        const target = this.hoveredUnit || (this.selectedUnitInfo ? this.selectedUnitInfo.unit : null);
        if (target) {
          this.sellUnit(target);
        } else {
          this.showToastNotification("판매할 챔피언 위에 마우스를 올리거나 선택한 뒤 E를 누르세요.", "info");
        }
      } else if (key === "B") {
        const newVol = sound.toggleMute();
        this.updateBGMUI(newVol);
      } else if (key === " ") {
        if (this.scoutedPlayerId && this.scoutedPlayerId !== "player") {
          this.scoutPlayer("player");
          return;
        }
        if (this.phase === "planning") {
          this.startCombat();
        }
      }
    });

    if (this.dom.btnSynergyPrev) {
      this.dom.btnSynergyPrev.addEventListener("click", () => {
        if (this.synergyPage > 0) {
          this.synergyPage--;
          this.updateSynergies();
        }
      });
    }
    if (this.dom.btnSynergyNext) {
      this.dom.btnSynergyNext.addEventListener("click", () => {
        const totalPages = Math.ceil(Object.keys(TRAITS).length / 4);
        if (this.synergyPage < totalPages - 1) {
          this.synergyPage++;
          this.updateSynergies();
        }
      });
    }
    if (this.dom.synergyList) {
      this.dom.synergyList.addEventListener("wheel", (e) => {
        const totalPages = Math.ceil(Object.keys(TRAITS).length / 4);
        if (e.deltaY > 0 && this.synergyPage < totalPages - 1) {
          this.synergyPage++;
          this.updateSynergies();
        } else if (e.deltaY < 0 && this.synergyPage > 0) {
          this.synergyPage--;
          this.updateSynergies();
        }
      }, { passive: true });
    }

    this.dom.rerollBtn.addEventListener("click", () => this.rerollShop());
    this.dom.expBtn.addEventListener("click", () => this.buyExp());
    this.dom.lockBtn.addEventListener("click", () => {
      this.shopLocked = !this.shopLocked;
      this.dom.lockBtn.textContent = this.shopLocked ? "🔒" : "🔓";
      this.dom.lockBtn.title = this.shopLocked ? "상점 잠금 해제" : "상점 잠금";
      this.dom.lockBtn.classList.toggle("active", this.shopLocked);
    });
    this.dom.startCombatBtn.addEventListener("click", (e) => {
      e.currentTarget.blur(); // 스페이스바가 버튼을 다시 누르지 않도록
      if (this.phase === "planning") this.startCombat();
    });
    if (this.dom.skipCombatBtn) {
      this.dom.skipCombatBtn.addEventListener("click", (e) => {
        e.currentTarget.blur();
        this.skipCombat();
      });
    }
    if (this.dom.resetGameBtn) {
      this.dom.resetGameBtn.addEventListener("click", (e) => {
        e.currentTarget.blur();
        if (confirm("정말 게임을 처음(1-1)부터 다시 시작하시겠습니까?")) {
          this.resetGame();
        }
      });
    }
    if (this.dom.bgmMuteBtn) {
      this.dom.bgmMuteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const newVol = sound.toggleMute();
        this.updateBGMUI(newVol);
      });
    }
    if (this.dom.bgmVolume) {
      this.dom.bgmVolume.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        sound.setBGMVolume(val);
        this.updateBGMUI(val);
      });
    }
    if (this.dom.bgmExpandableBox) {
      this.dom.bgmExpandableBox.addEventListener("click", (e) => {
        if (e.target === this.dom.bgmVolume || e.target === this.dom.bgmMuteBtn) return;
        this.dom.bgmExpandableBox.classList.toggle("expanded");
      });
      document.addEventListener("click", (e) => {
        if (this.dom.bgmExpandableBox && !this.dom.bgmExpandableBox.contains(e.target)) {
          this.dom.bgmExpandableBox.classList.remove("expanded");
        }
      });
    }

    // 빈 화면 클릭 시 선택 해제
    window.addEventListener("click", (e) => {
      if (!e.target.closest(".unit-token") && !e.target.closest(".board-grid") && !e.target.closest(".bench-container")) {
        this.clearSelection();
      }
    });
    window.addEventListener("pointerup", () => {
      setTimeout(() => {
        if (!this.selectedUnitInfo && !this.draggedUnit) {
          this.setPlacingMode(false);
        }
      }, 30);
    });

    // 상점 영역으로 드래그하여 유닛 판매 (TFT 공식 조작감)
    const shopCenter = document.querySelector(".shop-center-wrapper");
    if (shopCenter) {
      shopCenter.addEventListener("dragover", (e) => {
        if (this.draggedUnit && this.draggedUnit.side === "player") {
          e.preventDefault();
        }
      });
      shopCenter.addEventListener("drop", (e) => {
        if (this.draggedUnit && this.draggedUnit.side === "player" && this.phase === "planning") {
          e.preventDefault();
          this.sellUnit(this.draggedUnit);
          this.draggedUnit = null;
          this.dragSource = null;
          this.clearSelection();
        }
      });
    }

    if (this.dom.sellDropzone) {
      this.dom.sellDropzone.addEventListener("click", () => {
        if (this.phase !== "planning") return;
        const target = this.selectedUnitInfo ? this.selectedUnitInfo.unit : this.hoveredUnit;
        if (target) {
          this.sellUnit(target);
        }
      });
    }
  }

  // 상점 리롤
  rerollShop(free = false) {
    if (this.phase !== "planning") return;
    if (!free) {
      if (this.player.gold < 2) return;
      this.player.gold -= 2;
      sound.playReroll();
    }
    this.refreshShop(false);
    this.updateHUD();
  }

  // 상점 새로고침 로직 (시즌 4 패치 11.8 공식 확률표 & 선택받은 자 코스트 룰 적용)
  refreshShop(force = false) {
    if (this.shopLocked && !force) return;

    const rates = DROP_RATES[this.player.level] || DROP_RATES[1];
    const chosenRates = CHOSEN_DROP_RATES[this.player.level] || CHOSEN_DROP_RATES[1];
    this.shopSlots = [];

    // 플레이어가 선택받은 자를 보유하지 않은 경우, 상점 롤 시 약 33% 확률로 1장의 '선택받은 자' 슬롯 결정
    const canSpawnChosen = (this.player.chosenChamp === null);
    const chosenSlotIndex = (canSpawnChosen && Math.random() < 0.33) ? Math.floor(Math.random() * 5) : -1;

    for (let slot = 0; slot < 5; slot++) {
      const isChosen = (slot === chosenSlotIndex);
      const activeRates = isChosen ? chosenRates : rates;

      // 코스트 결정
      const rand = Math.random();
      let cost = 1;
      let cum = 0;
      for (let c = 0; c < activeRates.length; c++) {
        cum += activeRates[c];
        if (rand <= cum) {
          cost = c + 1;
          break;
        }
      }

      // 해당 코스트 챔피언 중 랜덤 선택
      const pool = CHAMPIONS.filter(ch => ch.cost === cost);
      if (pool.length === 0) {
        // 폴백
        const anyPool = CHAMPIONS.filter(ch => ch.cost === 1);
        const fallback = anyPool[Math.floor(Math.random() * anyPool.length)];
        this.shopSlots.push({ baseChamp: fallback, isChosen: false, chosenTrait: null, cost: fallback.cost, star: 1 });
        continue;
      }
      const baseChamp = pool[Math.floor(Math.random() * pool.length)];

      let chosenTrait = null;
      if (isChosen) {
        // 챔피언의 특성 중 하나를 선택받은 자 특성(x2)으로 지정
        chosenTrait = baseChamp.traits[Math.floor(Math.random() * baseChamp.traits.length)];
      }

      this.shopSlots.push({
        baseChamp,
        isChosen,
        chosenTrait,
        cost: isChosen ? baseChamp.cost * 3 : baseChamp.cost,
        star: isChosen ? 2 : 1
      });
    }

    this.renderShop();
  }

  renderShop() {
    this.dom.shopCards.innerHTML = '';

    if (this.dom.rerollBtn) this.dom.rerollBtn.disabled = (this.player.gold < 2 || this.phase !== "planning");
    if (this.dom.expBtn) this.dom.expBtn.disabled = (this.player.level >= 9 || this.player.gold < 4 || this.phase !== "planning");

    this.shopSlots.forEach((slotData, index) => {
      if (!slotData) {
        const empty = document.createElement("div");
        empty.className = "shop-card empty";
        empty.style.opacity = "0.2";
        this.dom.shopCards.appendChild(empty);
        return;
      }

      const { baseChamp, isChosen, chosenTrait, cost, star } = slotData;
      const card = document.createElement("div");
      card.className = `shop-card cost-${baseChamp.cost} ${isChosen ? 'chosen-card' : ''}`;

      const splashKey = CHAMPION_SPLASH_KEYS[baseChamp.id] || "Yasuo";
      const splashUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${splashKey}_0.jpg`;

      const traitsHtml = baseChamp.traits.map(tKey => {
        const t = TRAITS[tKey];
        if (isChosen && tKey === chosenTrait) {
          return `<span class="trait-pill chosen-trait">★ ${t ? t.icon + ' ' + t.name : tKey} (x2)</span>`;
        }
        return `<span class="trait-pill">${t ? t.icon + ' ' + t.name : tKey}</span>`;
      }).join("");

      card.innerHTML = `
        <img class="shop-card-splash" src="${splashUrl}" alt="${baseChamp.name}" onerror="this.src='${baseChamp.image}'">
        <div class="shop-card-overlay"></div>
        ${isChosen ? '<div class="chosen-ribbon">★ 선택받은 자</div>' : ''}
        <div class="card-content-wrap">
          <div class="card-top">
            <div class="card-name-group">
              <span class="card-hotkey">${index + 1}</span>
              <span class="card-name">${baseChamp.name} ${star > 1 ? '★★' : ''}</span>
            </div>
            <span class="card-cost">${cost} 🪙</span>
          </div>
          <div class="card-bottom">
            <div class="card-traits">${traitsHtml}</div>
          </div>
        </div>
      `;

      // 마우스 누르는 순간 0ms 즉각 구매 (pointerdown) & 클릭 지원
      card.addEventListener("pointerdown", (e) => {
        if (e.button === 0) {
          this.buyShopCard(index, card);
        }
      });
      card.addEventListener("click", () => this.buyShopCard(index, card));
      this.dom.shopCards.appendChild(card);
    });
  }

  // 상점 특정 슬롯만 0ms 즉시 비우기 (전체 카드 재성성으로 인한 레이아웃 지연 및 깜빡임 방지)
  clearShopSlotDOM(slotIndex) {
    if (!this.dom.shopCards) return;
    const cardEl = this.dom.shopCards.children[slotIndex];
    if (cardEl) {
      cardEl.className = "shop-card empty";
      cardEl.style.opacity = "0.22";
      cardEl.innerHTML = "";
    }
  }

  buyShopCard(slotIndex, cardEl) {
    if (this.phase !== "planning") return;
    const cardData = this.shopSlots[slotIndex];
    if (!cardData) return;

    if (this.player.gold < cardData.cost) {
      this.showToastNotification("골드가 부족합니다!");
      sound.playDefeat();
      return;
    }
    if (cardData.isChosen && this.player.chosenChamp) {
      this.showToastNotification("선택받은 자는 한 번에 1명만 소유할 수 있습니다!");
      return;
    }

    // 빈 벤치 슬롯 찾기 (벤치가 가득 차도 구매 즉시 합성되면 구매 허용 - 실제 TFT 규칙)
    let emptyBenchIdx = this.bench.findIndex(b => b === null);
    if (emptyBenchIdx === -1 && !this.wouldCombineOnBuy(cardData)) {
      this.showToastNotification("대기석(벤치)이 가득 찼습니다!");
      return;
    }

    this.player.gold -= cardData.cost;
    sound.playBuy();
    if (cardData.isChosen) sound.playCombine(3);

    const unit = makeUnit(cardData.baseChamp, cardData.star, "player", {
      isChosen: cardData.isChosen,
      chosenTrait: cardData.chosenTrait
    });
    unit.isNewBuy = true;

    if (unit.isChosen) {
      this.player.chosenChamp = unit;
      document.body.classList.add("screen-shake");
      setTimeout(() => document.body.classList.remove("screen-shake"), 300);
    }

    if (emptyBenchIdx === -1) {
      // 벤치가 꽉 찬 상태: 임시로 합성 그룹에 포함시켜 바로 합성
      this.pendingBuyUnit = unit;
    } else {
      this.bench[emptyBenchIdx] = unit;
    }

    // 구매 슬롯 0ms 즉각 처리
    this.shopSlots[slotIndex] = null;
    this.clearShopSlotDOM(slotIndex);

    // 3성/2성 합성 검사
    this.checkChampionCombinations();
    this.pendingBuyUnit = null;

    this.renderUnits();
    this.updateHUD();
    this.updateSynergies();
  }

  // 구매하는 카드가 기존 유닛 2개와 즉시 합성되는지 확인
  wouldCombineOnBuy(cardData) {
    const owned = this.getAllPlayerUnitRefs().filter(item =>
      item.unit.champ.id === cardData.baseChamp.id && item.unit.star === cardData.star
    );
    return owned.length >= 2;
  }

  // 플레이어 소유 유닛 위치 목록 (벤치 + 아군 필드)
  getAllPlayerUnitRefs() {
    const refs = [];
    for (let r = 3; r < 6; r++) {
      for (let c = 0; c < 7; c++) {
        const u = this.board[r][c];
        if (u) refs.push({ unit: u, loc: 'board', row: r, col: c });
      }
    }
    this.bench.forEach((u, i) => { if (u) refs.push({ unit: u, loc: 'bench', index: i }); });
    return refs;
  }

  // 챔피언 3개 모이면 자동 합성 (필드 유닛 우선 유지, 선택받은 자 속성 보존)
  checkChampionCombinations() {
    const allUnits = this.getAllPlayerUnitRefs();
    if (this.pendingBuyUnit) allUnits.push({ unit: this.pendingBuyUnit, loc: 'pending' });

    const grouped = {};
    allUnits.forEach(item => {
      if (item.unit.star >= 3) return;
      const key = item.unit.champ.id + '_star' + item.unit.star;
      (grouped[key] = grouped[key] || []).push(item);
    });

    for (const key in grouped) {
      const items = grouped[key];
      if (items.length < 3) continue;

      const trio = items.slice(0, 3);
      // 선택받은 자가 포함되어 있으면 그 유닛을 메인으로 (특성 x2 유지)
      const chosenItem = trio.find(it => it.unit.isChosen);
      const placed = trio.find(it => it.loc !== 'pending');
      const main = chosenItem || placed;
      trio.forEach(it => { if (it !== main) this.removeUnitFromSource(it); });

      if (main.loc === 'pending') {
        // 벤치가 꽉 찬 채 구매한 선택받은 자가 메인인 경우: 재료가 빠진 자리에 배치
        const idx = this.bench.findIndex(b => b === null);
        if (idx !== -1) this.bench[idx] = main.unit;
      }

      main.unit.star += 1;
      applyStarStats(main.unit);
      main.unit.mana = main.unit.champ.startMana;
      main.unit.isNewBuy = true;

      sound.playCombine(main.unit.star);
      this.showToastNotification(`${main.unit.champ.name} ${STAR_TEXT[main.unit.star]} 합성 완료!`, "success");

      // 연쇄 합성 재검사 (2성 3개 → 3성)
      this.checkChampionCombinations();
      return;
    }
  }

  removeUnitFromSource(item) {
    if (item.loc === 'bench') {
      this.bench[item.index] = null;
    } else if (item.loc === 'board') {
      this.board[item.row][item.col] = null;
    } else if (item.loc === 'pending') {
      this.pendingBuyUnit = null;
    }
  }

  buyExp() {
    if (this.phase !== "planning") return;
    if (this.player.level >= 9) return;
    if (this.player.gold < 4) return;

    this.player.gold -= 4;
    sound.playLevelUp();
    this.gainExp(4);
    this.updateHUD();
  }

  gainExp(amount) {
    if (this.player.level >= 9) return;
    this.player.exp += amount;
    while (this.player.level < 9 && this.player.exp >= this.player.maxExp) {
      this.player.exp -= this.player.maxExp;
      this.player.level++;
      this.player.maxExp = LEVEL_EXP[this.player.level] || 999;
      this.showToastNotification(`레벨 업! Lv.${this.player.level} - 최대 ${this.player.level}명 배치 가능`, "success");
      this.syncLobbyOpponentsGrowth();
    }
    if (this.player.level >= 9) this.player.exp = 0;
  }

  getUnitSellPrice(unit) {
    if (!unit || !unit.champ) return 0;
    if (unit.isChosen) {
      return unit.champ.cost * (unit.star === 2 ? 3 : 9);
    }
    return unit.champ.cost * (unit.star === 1 ? 1 : unit.star === 2 ? 3 : 9);
  }

  updateSellZoneUI(unit = null) {
    if (!this.dom.sellDropzone) return;
    const target = unit || (this.selectedUnitInfo ? this.selectedUnitInfo.unit : this.hoveredUnit);
    if (target && this.phase === "planning" && target.side === "player") {
      const price = this.getUnitSellPrice(target);
      this.dom.sellDropzone.classList.add("can-sell");
      this.dom.sellDropzone.innerHTML = `
        <span style="font-size: 15px;">💰</span>
        <span style="font-weight: 900; color: #854d0e;">${target.champ.name} 판매 (+${price}G)</span>
        <span style="font-size: 10px; color: #a16207;">클릭 / 드래그 / E키</span>
      `;
    } else {
      this.dom.sellDropzone.classList.remove("can-sell");
      this.dom.sellDropzone.innerHTML = `
        <span class="sell-icon">🗑️</span>
        <span class="sell-text">판매 구역 [E]</span>
        <span style="font-size: 9px; color: #ef4444; opacity: 0.85;">드래그 또는 유닛 선택 후 클릭</span>
      `;
    }
  }

  sellUnit(unit) {
    if (!unit || this.phase !== "planning" || unit.side !== "player") return;
    const refund = this.getUnitSellPrice(unit);

    // 벤치 또는 필드에서 찾아서 제거
    let found = false;
    for (let i = 0; i < 9; i++) {
      if (this.bench[i] && this.bench[i].uid === unit.uid) {
        this.bench[i] = null;
        found = true;
        break;
      }
    }
    if (!found) {
      for (let r = 3; r < 6; r++) {
        for (let c = 0; c < 7; c++) {
          if (this.board[r][c] && this.board[r][c].uid === unit.uid) {
            this.board[r][c] = null;
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }

    if (found) {
      if (unit.isChosen) {
        this.player.chosenChamp = null;
      }
      this.player.gold += refund;

      // 선택 상태 및 호버 상태 완전 해제 (버그 방지: 유닛 부활 방지)
      if (this.selectedUnitInfo && this.selectedUnitInfo.unit.uid === unit.uid) {
        this.selectedUnitInfo = null;
        const targets = document.querySelectorAll(".highlight-target");
        targets.forEach(el => el.classList.remove("highlight-target"));
      }
      if (this.hoveredUnit && this.hoveredUnit.uid === unit.uid) {
        this.hoveredUnit = null;
      }

      sound.playSell();
      this.showToastNotification(`💰 ${unit.champ.name} ${STAR_TEXT[unit.star] || ''} 판매 완료! (+${refund} 골드)`, "success");

      this.updateSellZoneUI();
      this.updateHUD();
      this.renderUnits();
      this.updateSynergies();
    }
  }

  // 통합 이동/배치 처리 (보드로 이동)
  executeMoveToBoard(unit, source, targetRow, targetCol) {
    if (!unit || !source || this.phase !== "planning") return;
    if (targetRow < 3) return; // 적 진영 불가

    const existingUnit = this.board[targetRow][targetCol];

    // 같은 자리 클릭 시 무시
    if (source.type === "board" && source.row === targetRow && source.col === targetCol) {
      return;
    }

    // 벤치에서 빈 자리로 이동할 때만 인원수 제한 체크 (스왑은 인원수 변화 없음)
    const currentBoardUnits = this.getBoardUnits("player").length;
    if (source.type === "bench" && !existingUnit && currentBoardUnits >= this.player.level) {
      this.showToastNotification(`현재 레벨(${this.player.level})에서는 최대 ${this.player.level}명까지만 배치할 수 있습니다! [F키로 레벨업]`);
      sound.playDefeat();
      return;
    }

    // 1. 출발지 비우기 (또는 기존 유닛과 맞교환)
    if (source.type === "bench") {
      this.bench[source.index] = existingUnit; // 기존 유닛이 있으면 벤치로
    } else if (source.type === "board") {
      this.board[source.row][source.col] = existingUnit; // 기존 유닛이 있으면 원래 보드 자리로 스왑
    }

    // 2. 목적지에 유닛 배치
    this.board[targetRow][targetCol] = unit;
    sound.playTone(340, "sine", 0.08, 0.12, false);

    this.renderUnits();
    this.updateSynergies();
  }

  // 통합 이동/배치 처리 (벤치로 이동)
  executeMoveToBench(unit, source, targetBenchIdx) {
    if (!unit || !source || this.phase !== "planning") return;

    // 같은 벤치 자리 클릭 시 무시
    if (source.type === "bench" && source.index === targetBenchIdx) {
      return;
    }

    const existingUnit = this.bench[targetBenchIdx];

    // 1. 출발지 비우기 (또는 기존 유닛과 맞교환)
    if (source.type === "bench") {
      this.bench[source.index] = existingUnit;
    } else if (source.type === "board") {
      this.board[source.row][source.col] = existingUnit;
    }

    // 2. 목적지에 유닛 배치
    this.bench[targetBenchIdx] = unit;
    sound.playTone(280, "sine", 0.08, 0.12, false);

    this.renderUnits();
    this.updateSynergies();
  }

  // 클릭으로 유닛 선택 토글 (Click-to-Move)
  selectUnit(unit, source) {
    if (this.phase !== "planning" || unit.side !== "player") return;

    // 이미 선택된 유닛 다시 누르면 해제
    if (this.selectedUnitInfo && this.selectedUnitInfo.unit.uid === unit.uid) {
      this.clearSelection();
      return;
    }

    this.selectedUnitInfo = { unit, source };
    this.setPlacingMode(true);
    this.renderUnits();

    // 배치 가능 타일 하이라이트 (아군 진영 3~5행)
    const boardCells = this.dom.boardGrid.querySelectorAll(".grid-cell");
    boardCells.forEach(cell => {
      const r = parseInt(cell.dataset.row);
      if (r >= 3) cell.classList.add("highlight-target");
    });
    const benchCells = this.dom.benchContainer.querySelectorAll(".bench-cell");
    benchCells.forEach(cell => cell.classList.add("highlight-target"));

    this.updateSellZoneUI(unit);
    sound.playTone(440, "triangle", 0.05, 0.08, false);
  }

  clearSelection() {
    this.selectedUnitInfo = null;
    if (!this.draggedUnit) {
      this.setPlacingMode(false);
    }
    const targets = document.querySelectorAll(".highlight-target");
    targets.forEach(el => el.classList.remove("highlight-target"));
    this.renderUnits();
    this.updateSellZoneUI();
  }

  showToastNotification(msg, type = "error") {
    const toast = document.createElement("div");
    toast.className = `toast-notification toast-${type}`;
    toast.textContent = msg;
    // 여러 토스트가 겹치지 않도록 아래로 쌓기
    const existing = document.querySelectorAll(".toast-notification").length;
    toast.style.top = `${70 + existing * 40}px`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  handleDropOnBoard(targetRow, targetCol) {
    if (this.draggedUnit && this.dragSource) {
      this.executeMoveToBoard(this.draggedUnit, this.dragSource, targetRow, targetCol);
      this.draggedUnit = null;
      this.dragSource = null;
    }
  }

  handleDropOnBench(targetBenchIdx) {
    if (this.draggedUnit && this.dragSource) {
      this.executeMoveToBench(this.draggedUnit, this.dragSource, targetBenchIdx);
      this.draggedUnit = null;
      this.dragSource = null;
    }
  }

  getBoardUnits(side = "player") {
    let units = [];
    const minRow = side === "player" ? 3 : 0;
    const maxRow = side === "player" ? 6 : 3;
    for (let r = minRow; r < maxRow; r++) {
      for (let c = 0; c < 7; c++) {
        if (this.board[r][c]) {
          units.push({ ...this.board[r][c], r, c });
        }
      }
    }
    return units;
  }

  // 시너지 계산 (선택받은 자 x2 적용, 정찰 중에는 정찰 대상 유닛 기준 계산)
  updateSynergies() {
    const isScouting = (this.scoutedPlayerId && this.scoutedPlayerId !== "player");
    const currentOpp = isScouting ? this.lobbyOpponents.find(o => o.id === this.scoutedPlayerId) : null;

    let units = [];
    if (!isScouting) {
      units = this.getBoardUnits("player");
    } else if (currentOpp && currentOpp.board) {
      currentOpp.board.forEach(p => {
        const base = CHAMPIONS.find(ch => ch.id === p.champId);
        if (base) units.push(makeUnit(base, p.star || 1, "enemy"));
      });
    }

    const counts = countTraits(units);
    const placed = units.length;
    const maxUnits = isScouting ? (currentOpp ? currentOpp.level : 5) : this.player.level;

    if (!isScouting) {
      if (this.dom.deployCount) {
        this.dom.deployCount.textContent = `${placed} / ${maxUnits}`;
      }
      if (this.dom.deployChip) {
        this.dom.deployChip.classList.toggle("full", placed === maxUnits && placed > 0);
        this.dom.deployChip.classList.toggle("over", placed > maxUnits);
      }
    }

    const headerTitle = isScouting ? `🔍 [${currentOpp ? currentOpp.name : '상대'}] 특성` : `활성 시너지`;
    if (this.dom.synergyTitleText) {
      this.dom.synergyTitleText.textContent = headerTitle;
    }
    if (this.dom.synergyBoardCount) {
      this.dom.synergyBoardCount.textContent = `${placed}/${maxUnits}`;
      this.dom.synergyBoardCount.className = `board-count ${(!isScouting && placed > maxUnits) ? 'over' : ''}`;
    }

    const targetList = this.dom.synergyItemsContainer || this.dom.synergyList;
    if (!targetList) return counts;

    targetList.innerHTML = "";

    // 활성 시너지 & 진행 중 & 대기 중 시너지 분류 (TFT 공식 스타일 원형 엠블럼)
    const activeTraits = [];
    const pendingTraits = [];
    const zeroTraits = [];

    for (const tKey in TRAITS) {
      const trait = TRAITS[tKey];
      const count = counts[tKey] || 0;
      let activeTier = -1;
      trait.thresholds.forEach((th, idx) => {
        if (count >= th.count) activeTier = idx;
      });

      const data = { tKey, trait, count, activeTier };
      if (activeTier >= 0) {
        activeTraits.push(data);
      } else if (count > 0) {
        pendingTraits.push(data);
      } else {
        zeroTraits.push(data);
      }
    }

    // 활성 티어 높은 순으로 정렬 (크로마틱 -> 골드 -> 실버 -> 브론즈), 그 다음 개수 순
    activeTraits.sort((a, b) => (b.activeTier - a.activeTier) || (b.count - a.count));
    pendingTraits.sort((a, b) => b.count - a.count);

    // 전체 특성 목록 구성: 활성 특성 최상단 -> 진행 중 특성 -> 비활성 대기 특성
    // 기물이 비어있어도 특성이 날아가지 않고 언제나 원형 엠블럼 레일이 정갈하게 표시됩니다
    const displayList = [...activeTraits, ...pendingTraits, ...zeroTraits];

    // 페이지네이션 처리 (페이지당 4개씩 표시하여 화면 잘림 방지)
    const pageSize = 4;
    const totalPages = Math.max(1, Math.ceil(displayList.length / pageSize));
    if (this.synergyPage >= totalPages) this.synergyPage = totalPages - 1;
    if (this.synergyPage < 0) this.synergyPage = 0;

    const pageItems = displayList.slice(this.synergyPage * pageSize, (this.synergyPage + 1) * pageSize);

    pageItems.forEach(({ tKey, trait, count, activeTier }) => {
      let tierClass = "tier-zero";
      if (activeTier === 0) tierClass = "tier-bronze";
      else if (activeTier === 1) tierClass = "tier-silver";
      else if (activeTier === 2) tierClass = "tier-gold";
      else if (activeTier >= 3) tierClass = "tier-chromatic";
      else if (count > 0) tierClass = "tier-partial";

      const orbItem = document.createElement("div");
      orbItem.className = `synergy-orb-item ${tierClass}`;

      // 툴팁 구성
      const thresholdsText = trait.thresholds.map(th => {
        const isActive = count >= th.count ? "✓" : "•";
        return `${isActive} (${th.count}) ${th.effect}`;
      }).join("\n");
      orbItem.title = `${trait.name} [${count}]\n${trait.desc}\n\n${thresholdsText}`;

      // 행운 시너지 연패 정보 (활성화되었거나 패배 스택이 있을 때 표시)
      const isFortune = (tKey === "fortune" && !isScouting);
      const fortuneText = (isFortune && (activeTier >= 0 || this.player.fortuneStreak > 0)) ? `${this.player.fortuneStreak}연패` : "";

      orbItem.innerHTML = `
        <div class="synergy-orb-crest">
          <span class="synergy-orb-icon">${trait.icon}</span>
          <span class="synergy-orb-count">${count}</span>
        </div>
        <span class="synergy-orb-name">${trait.name}</span>
        ${fortuneText ? `<span class="synergy-fortune-tag">${fortuneText}</span>` : ""}
      `;

      targetList.appendChild(orbItem);
    });

    // 특성 페이지 번호 및 이전/다음 버튼 상태 갱신
    if (this.dom.synergyPageText) {
      this.dom.synergyPageText.textContent = `${this.synergyPage + 1} / ${totalPages}`;
    }
    if (this.dom.btnSynergyPrev) {
      this.dom.btnSynergyPrev.disabled = (this.synergyPage === 0);
    }
    if (this.dom.btnSynergyNext) {
      this.dom.btnSynergyNext.disabled = (this.synergyPage >= totalPages - 1);
    }

    return counts;
  }

  // 챔피언 유닛 렌더링 (내 결투장 또는 상대 결투장/대기석 정찰 렌더링)
  // 현재 라운드 매칭된 AI 상대 정보 조회
  getCurrentRoundOpponent() {
    if (!this.lobbyOpponents) return null;
    const round = ROUNDS[this.roundIdx];
    if (!round || !round.isPvP) return null;
    if (round.opponentId) {
      const match = this.lobbyOpponents.find(o => o.id === round.opponentId);
      if (match) return match;
    }
    return this.lobbyOpponents.find(o => !o.isPlayer && o.isAlive) || this.lobbyOpponents[1] || null;
  }

  renderUnits() {
    const isScouting = (this.scoutedPlayerId && this.scoutedPlayerId !== "player");
    const scoutedOpp = isScouting ? this.lobbyOpponents.find(o => o.id === this.scoutedPlayerId) : null;
    const currentPvPOpp = this.getCurrentRoundOpponent();

    // 1. 보드 셀 그리기 (6행 x 7열: 0~2행 적 진영, 3~5행 아군 진영)
    const cells = this.dom.boardGrid.querySelectorAll(".grid-cell");
    cells.forEach(cell => {
      const r = parseInt(cell.dataset.row);
      const c = parseInt(cell.dataset.col);

      // 기존 유닛 토큰 제거
      const oldToken = cell.querySelector(".unit-token");
      if (oldToken) oldToken.remove();

      let unit = null;
      if (!isScouting) {
        unit = this.board[r][c];
      } else if (scoutedOpp && scoutedOpp.board) {
        // 상대 결투장 정찰 중: 적 기물이 배치된 칸 표시
        const placed = scoutedOpp.board.find(p => p.row === r && p.col === c);
        if (placed) {
          const base = CHAMPIONS.find(ch => ch.id === placed.champId);
          if (base) {
            unit = makeUnit(base, placed.star || 1, "enemy");
            unit.isScoutedUnit = true;
          }
        }
      }

      if (unit) {
        const token = this.createUnitToken(unit, { type: 'board', row: r, col: c });
        cell.appendChild(token);
      }
    });

    // 2. 아군 대기석 셀 그리기 (체스판 하단 9칸)
    if (this.dom.benchContainer) {
      const benchCells = this.dom.benchContainer.querySelectorAll(".bench-cell");
      benchCells.forEach(cell => {
        const idx = parseInt(cell.dataset.benchIndex);

        const oldToken = cell.querySelector(".unit-token");
        if (oldToken) oldToken.remove();

        let unit = null;
        if (!isScouting) {
          unit = this.bench[idx];
        } else if (scoutedOpp && scoutedOpp.bench) {
          const benchItem = scoutedOpp.bench.find(b => b.index === idx);
          if (benchItem) {
            const base = CHAMPIONS.find(ch => ch.id === benchItem.champId);
            if (base) {
              unit = makeUnit(base, benchItem.star || 1, "enemy");
              unit.isScoutedUnit = true;
            }
          }
        }

        if (unit) {
          const token = this.createUnitToken(unit, { type: 'bench', index: idx });
          cell.appendChild(token);
        }
      });
    }

    // 3. 적군 대기석 셀 그리기 (체스판 상단 9칸: 정찰 중인 상대 또는 이번 라운드 상대 AI의 대기석)
    if (this.dom.enemyBenchContainer) {
      const enemyBenchCells = this.dom.enemyBenchContainer.querySelectorAll(".bench-cell");
      const activeOpp = isScouting ? scoutedOpp : currentPvPOpp;
      enemyBenchCells.forEach(cell => {
        const idx = parseInt(cell.dataset.benchIndex);

        const oldToken = cell.querySelector(".unit-token");
        if (oldToken) oldToken.remove();

        let unit = null;
        if (activeOpp && activeOpp.bench) {
          const benchItem = activeOpp.bench.find(b => b.index === idx);
          if (benchItem) {
            const base = CHAMPIONS.find(ch => ch.id === benchItem.champId);
            if (base) {
              unit = makeUnit(base, benchItem.star || 1, "enemy");
              unit.isScoutedUnit = true;
            }
          }
        }

        if (unit) {
          const token = this.createUnitToken(unit, { type: 'enemy_bench', index: idx });
          cell.appendChild(token);
        }
      });
    }

    this.updateScoutBanner();
  }

  createUnitToken(unit, source) {
    const token = document.createElement("div");
    const landingClass = unit.isNewBuy ? "unit-landing-anim" : "";
    if (unit.isNewBuy) unit.isNewBuy = false; // 일회성 애니메이션

    const isSelected = (this.selectedUnitInfo && this.selectedUnitInfo.unit.uid === unit.uid);
    const isScouted = !!unit.isScoutedUnit;
    token.className = `unit-token ${unit.side === 'enemy' ? 'enemy' : ''} ${unit.isChosen ? 'chosen' : ''} ${isSelected ? 'selected' : ''} ${landingClass} ${isScouted ? 'scouted-token' : ''}`;
    token.draggable = (!isScouted && this.phase === "planning" && unit.side === "player");

    token.style.background = unit.champ.color ? `linear-gradient(135deg, ${unit.champ.color} 0%, #111827 100%)` : '#374151';
    token.innerHTML = unitTokenInnerHTML(unit);
    token.title = this.describeUnit(unit);

    // 클릭으로 선택 (Click-to-Move 지원 또는 정찰 툴팁 안내)
    token.addEventListener("click", (e) => {
      e.stopPropagation(); // 타일 클릭으로의 전파 방지
      if (isScouted) {
        this.showToastNotification(`🔍 [정찰 정보] ${unit.champ.name} ${STAR_TEXT[unit.star] || ''} · ${unit.champ.skillName || '스킬'}`, "info");
        return;
      }
      if (this.phase === "planning" && unit.side === "player") {
        if (this.selectedUnitInfo && this.selectedUnitInfo.unit.uid !== unit.uid) {
          // 이미 선택된 다른 유닛이 있고, 이 유닛을 클릭했다면 -> 둘의 위치 스왑!
          if (source.type === "board") {
            this.executeMoveToBoard(this.selectedUnitInfo.unit, this.selectedUnitInfo.source, source.row, source.col);
          } else if (source.type === "bench") {
            this.executeMoveToBench(this.selectedUnitInfo.unit, this.selectedUnitInfo.source, source.index);
          }
          this.clearSelection();
        } else {
          this.selectUnit(unit, source);
        }
      }
    });

    // 마우스로 기물을 잡는 즉시(pointerdown) 전장 육각 격자 점등
    token.addEventListener("pointerdown", () => {
      if (!isScouted && this.phase === "planning" && unit.side === "player") {
        this.setPlacingMode(true);
      }
    });

    // 드래그 이벤트 (DnD 지원)
    token.addEventListener("dragstart", (e) => {
      this.draggedUnit = unit;
      this.dragSource = source;
      this.setPlacingMode(true);
      if (e.dataTransfer) {
        e.dataTransfer.setData("text/plain", unit.uid);
        e.dataTransfer.effectAllowed = "move";
      }
      token.style.opacity = "0.5";
      if (unit.side === "player") this.updateSellZoneUI(unit);
    });
    token.addEventListener("dragend", () => {
      token.style.opacity = "1";
      // 유효하지 않은 곳에 놓은 경우에도 드래그 상태 정리
      this.draggedUnit = null;
      this.dragSource = null;
      this.setDragOver(null);
      if (!this.selectedUnitInfo) {
        this.setPlacingMode(false);
      }
      this.updateSellZoneUI();
    });

    token.addEventListener("mouseenter", () => {
      if (unit.side === "player") {
        this.hoveredUnit = unit;
        this.updateSellZoneUI(unit);
      }
    });
    token.addEventListener("mouseleave", () => {
      if (this.hoveredUnit === unit) {
        this.hoveredUnit = null;
        this.updateSellZoneUI();
      }
    });

    return token;
  }

  // 유닛 툴팁 (스킬 설명 포함)
  describeUnit(unit) {
    const c = unit.champ;
    const traits = c.traits.map(t => TRAITS[t] ? TRAITS[t].name + (unit.isChosen && unit.chosenTrait === t ? '(x2)' : '') : t).join(", ");
    return `${c.name} ${STAR_TEXT[unit.star] || ''}${unit.isChosen ? ' [선택받은 자]' : ''}\n` +
      `체력 ${unit.maxHp} · 공격력 ${unit.ad} · 공속 ${c.as} · 사거리 ${c.range || 1}\n` +
      (traits ? `특성: ${traits}\n` : '') +
      (c.skillName ? `스킬 - ${c.skillName}: ${c.skillDesc}` : '');
  }

  setCombatButtonState(isCombat) {
    if (isCombat) {
      this.setPlacingMode(false);
    }
    if (!this.dom.startCombatBtn) return;
    this.dom.startCombatBtn.disabled = isCombat;
    if (isCombat) {
      this.dom.startCombatBtn.innerHTML = `
        <span class="combat-btn-icon">⚔️</span>
        <span class="combat-btn-text">진행 중...</span>
      `;
    } else {
      this.dom.startCombatBtn.innerHTML = `
        <span class="combat-btn-icon">⚔️</span>
        <span class="combat-btn-text">전투 시작</span>
        <span class="combat-btn-key">Space</span>
      `;
    }
  }

  // 상단 STAGE 그래픽 타임라인 렌더링 (TFT 공식 롤토체스 아이콘 라운드 트래커)
  renderStageTimeline() {
    if (!this.dom.stageTimeline) return;
    const currentRound = ROUNDS[this.roundIdx];
    if (!currentRound) return;

    // 현재 스테이지 (예: "1-2" -> stagePrefix "1")
    const stagePrefix = String(currentRound.stage || "1").split("-")[0];

    // 현재 스테이지에 속하는 모든 라운드
    const stageRounds = ROUNDS.filter(r => String(r.stage).split("-")[0] === stagePrefix);

    this.dom.stageTimeline.innerHTML = "";
    stageRounds.forEach(r => {
      const node = document.createElement("div");
      node.className = "round-node";

      const rIdx = ROUNDS.findIndex(item => item.stage === r.stage);
      if (rIdx < this.roundIdx) {
        node.classList.add("completed");
      } else if (rIdx === this.roundIdx) {
        node.classList.add("current");
      } else {
        node.classList.add("upcoming");
      }

      node.textContent = r.typeIcon || (r.isPvP ? "⚔️" : "👾");
      node.title = `${r.stage} ${r.name}\n${r.opponentName} (${r.roundType === 'pvp' ? 'PvP 대전' : '크립 라운드'})${r.rewardGold ? '\n골드 보상: +' + r.rewardGold + 'G' : ''}`;

      this.dom.stageTimeline.appendChild(node);
    });
  }

  updateHUD() {
    const currentRound = ROUNDS[this.roundIdx] || { stage: "완료", name: "최종전 승리!" };
    if (this.dom.stageNumber) this.dom.stageNumber.textContent = currentRound.stage;

    if (this.dom.playerHpText) this.dom.playerHpText.textContent = `${this.player.hp} HP`;
    if (this.dom.playerHpFill) this.dom.playerHpFill.style.width = `${Math.max(0, this.player.hp)}%`;

    if (this.dom.goldDisplay) {
      this.dom.goldDisplay.innerHTML = `<span class="gold-icon">🪙</span> <span class="gold-amount">${this.player.gold}</span><span class="gold-unit">G</span>`;
    }

    // 좌/우 이자 골드 등불(10G~50G 포드) 점등 갱신
    if (this.dom.playerInterestPods) {
      const pInterest = Math.min(5, Math.floor(this.player.gold / 10));
      this.dom.playerInterestPods.querySelectorAll(".interest-pod").forEach(pod => {
        const idx = parseInt(pod.dataset.pod, 10);
        pod.classList.toggle("active", idx <= pInterest);
      });
    }
    if (this.dom.enemyInterestPods) {
      const eInterest = Math.min(5, Math.floor((this.roundIdx + 1) * 0.7));
      this.dom.enemyInterestPods.querySelectorAll(".interest-pod").forEach(pod => {
        const idx = parseInt(pod.dataset.pod, 10);
        pod.classList.toggle("active", idx <= eInterest);
      });
    }

    // 레벨 및 배치 인원 수치 갱신 (중복 Lv. 표기 완전 제거!)
    if (this.dom.levelNumber) this.dom.levelNumber.textContent = this.player.level;
    if (this.dom.rateLevelLabel) this.dom.rateLevelLabel.textContent = `Lv. ${this.player.level}`;

    const isMaxLevel = this.player.level >= 9;
    const expPct = isMaxLevel ? 100 : Math.min(100, Math.round((this.player.exp / this.player.maxExp) * 100));
    if (this.dom.expBarFill) this.dom.expBarFill.style.width = `${expPct}%`;
    if (this.dom.expText) {
      this.dom.expText.textContent = isMaxLevel ? "최대 레벨 (MAX)" : `${this.player.exp} / ${this.player.maxExp} EXP`;
    }

    const placed = this.getBoardUnits("player").length;
    const maxUnits = this.player.level;
    if (this.dom.deployCount) this.dom.deployCount.textContent = `${placed} / ${maxUnits}`;
    if (this.dom.deployChip) {
      this.dom.deployChip.classList.toggle("full", placed === maxUnits);
      this.dom.deployChip.classList.toggle("over", placed > maxUnits);
    }

    if (this.dom.levelBadge) {
      this.dom.levelBadge.textContent = `Lv.${this.player.level} (${this.player.exp}/${this.player.maxExp} EXP)`;
    }

    this.dom.expBtn.disabled = (isMaxLevel || this.player.gold < 4 || this.phase !== "planning");
    this.dom.rerollBtn.disabled = (this.player.gold < 2 || this.phase !== "planning");

    if (this.dom.fortuneCount) {
      this.dom.fortuneCount.textContent = `${this.player.fortuneStreak} 연패 중`;
    }

    // 상점 상단 확률 바 갱신
    const rates = DROP_RATES[this.player.level];
    if (this.dom.ratesDisplay) {
      this.dom.ratesDisplay.innerHTML = `
        <span class="rate-item cost-1"><span class="rate-dot">⚪</span>1코 ${Math.round(rates[0]*100)}%</span>
        <span class="rate-item cost-2"><span class="rate-dot">🟢</span>2코 ${Math.round(rates[1]*100)}%</span>
        <span class="rate-item cost-3"><span class="rate-dot">🔵</span>3코 ${Math.round(rates[2]*100)}%</span>
        <span class="rate-item cost-4"><span class="rate-dot">🟣</span>4코 ${Math.round(rates[3]*100)}%</span>
        <span class="rate-item cost-5"><span class="rate-dot">🟡</span>5코 ${Math.round(rates[4]*100)}%</span>
      `;
      this.renderStageTimeline();
    }
  }

  // ==========================================
  // 전투 페이즈 (오토배틀 엔진)
  // ==========================================

  // 벤치에서 필드로 자동 배치: 배치된 기물이 레벨보다 적으면 벤치 가장 왼쪽부터 무작위 빈 칸에 출전
  autoDeployFromBench() {
    let boardUnits = this.getBoardUnits("player");
    let boardCount = boardUnits.length;
    const maxUnits = this.player.level;
    if (boardCount >= maxUnits) return 0;

    let deployed = 0;

    // 벤치 왼쪽(0번 슬롯)부터 차례대로 확인
    for (let b = 0; b < 9 && boardCount < maxUnits; b++) {
      const u = this.bench[b];
      if (!u) continue;

      // 아군 진영 (행 3~5, 열 0~6) 중 현재 비어있는 칸 목록 수집
      const emptyCells = [];
      for (let r = 3; r < 6; r++) {
        for (let c = 0; c < 7; c++) {
          if (!this.board[r][c]) {
            emptyCells.push({ r, c });
          }
        }
      }

      if (emptyCells.length === 0) break;

      // 무작위 빈 칸 선정
      const pick = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.board[pick.r][pick.c] = u;
      this.bench[b] = null;
      boardCount++;
      deployed++;
    }

    if (deployed > 0) {
      this.renderUnits();
      this.updateHUD();
      this.updateSynergies();
    }
    return deployed;
  }

  startCombat() {
    if (this.phase !== "planning") return;
    // 정찰 중이었다면 전투 시작 전 즉시 내 결투장으로 복귀
    if (this.scoutedPlayerId && this.scoutedPlayerId !== "player") {
      this.scoutedPlayerId = null;
      this.renderUnits();
      this.updateSynergies();
      this.updateScoreboardUI();
      this.updateScoutBanner();
    }

    let playerUnits = this.getBoardUnits("player");

    // 기물이 레벨보다 적은 경우: 벤치 가장 왼쪽 기물부터 무작위 빈 칸에 자동 배치 후 시작
    if (playerUnits.length < this.player.level) {
      const deployed = this.autoDeployFromBench();
      if (deployed > 0) {
        playerUnits = this.getBoardUnits("player");
        this.showToastNotification(`📢 배치 인원 부족: 대기석의 왼쪽 챔피언 ${deployed}명을 무작위 칸에 자동 출전시켰습니다!`, "info");
      } else if (playerUnits.length === 0) {
        // 대기석에도 기물이 전혀 없는 경우 (오픈 포트)
        this.showToastNotification("⚠️ 출전한 챔피언이 없어 패배 처리됩니다! (오픈 포트)", "warning");
      }
    }

    // 2. 배치 인원 초과 체크 (레벨보다 많이 올려둔 경우)
    if (playerUnits.length > this.player.level) {
      this.showToastNotification(`배치 인원 초과! 현재 레벨에서는 ${this.player.level}명까지만 출전할 수 있습니다.`);
      return;
    }

    this.clearSelection();
    this.hoveredUnit = null;
    this.updateSellZoneUI();
    this.phase = "combat";
    this.setCombatButtonState(true);
    this.updateHUD();

    // 1. 적 기물 스폰 (스카우팅용으로 배치된 상대를 새 체력으로 다시 배치)
    this.spawnEnemyUnits(ROUNDS[this.roundIdx]);

    // 2. 전투 시뮬레이션 인스턴스 생성
    this.initBattleInstance();
  }

  // 준비 단계에서 현재 라운드 적 미리 배치 (스카우팅)
  previewEnemyUnits(roundInfo) {
    if (!roundInfo) return;
    this.spawnEnemyUnits(roundInfo);
    this.updateScoreboardUI();
  }

  // 8인 로비 상대 정보 초기화 (플레이어와 동일하게 1-1에서는 Lv.1로 시작!)
  initLobbyOpponents() {
    const startLvl = this.player ? this.player.level : 1;
    this.lobbyOpponents = [
      {
        id: "player",
        name: "나",
        isPlayer: true,
        hp: this.player ? this.player.hp : 100,
        maxHp: 100,
        level: startLvl,
        avatar: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/588.png",
        winStreak: 0,
        lossStreak: 0,
        isAlive: true
      },
      {
        id: "opp_sett",
        name: "세트",
        isPlayer: false,
        hp: 100,
        maxHp: 100,
        level: startLvl,
        avatar: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Sett.png",
        winStreak: 0,
        lossStreak: 0,
        isAlive: true,
        board: [],
        bench: []
      },
      {
        id: "opp_warwick",
        name: "워윅",
        isPlayer: false,
        hp: 100,
        maxHp: 100,
        level: startLvl,
        avatar: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Warwick.png",
        winStreak: 0,
        lossStreak: 0,
        isAlive: true,
        board: [],
        bench: []
      },
      {
        id: "opp_cultist",
        name: "트페",
        isPlayer: false,
        hp: 100,
        maxHp: 100,
        level: startLvl,
        avatar: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/TwistedFate.png",
        winStreak: 0,
        lossStreak: 0,
        isAlive: true,
        board: [],
        bench: []
      },
      {
        id: "opp_yasuo",
        name: "야스오",
        isPlayer: false,
        hp: 100,
        maxHp: 100,
        level: startLvl,
        avatar: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Yasuo.png",
        winStreak: 0,
        lossStreak: 0,
        isAlive: true,
        board: [],
        bench: []
      },
      {
        id: "opp_diana",
        name: "다이애나",
        isPlayer: false,
        hp: 100,
        maxHp: 100,
        level: startLvl,
        avatar: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Diana.png",
        winStreak: 0,
        lossStreak: 0,
        isAlive: true,
        board: [],
        bench: []
      },
      {
        id: "opp_garen",
        name: "가렌",
        isPlayer: false,
        hp: 100,
        maxHp: 100,
        level: startLvl,
        avatar: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Garen.png",
        winStreak: 0,
        lossStreak: 0,
        isAlive: true,
        board: [],
        bench: []
      },
      {
        id: "opp_fortune",
        name: "카타리나",
        isPlayer: false,
        hp: 100,
        maxHp: 100,
        level: startLvl,
        avatar: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Katarina.png",
        winStreak: 0,
        lossStreak: 0,
        isAlive: true,
        board: [],
        bench: []
      }
    ];

    // 현재 플레이어 레벨에 맞춰 AI 플레이어 덱 및 배치 실시간 동기화
    this.syncLobbyOpponentsGrowth();
  }

  // 플레이어의 레벨 업 및 라운드 성장에 맞춰 8인 로비 AI들의 레벨 및 덱을 동적 성장시킴
  syncLobbyOpponentsGrowth() {
    if (!this.lobbyOpponents) return;
    const currentLvl = Math.max(1, Math.min(9, (this.player ? this.player.level : 1)));

    this.lobbyOpponents.forEach(p => {
      if (p.isPlayer) {
        if (this.player) {
          p.level = this.player.level;
          p.hp = this.player.hp;
        }
        return;
      }
      if (!p.isAlive) return;

      // AI 상대 레벨을 플레이어와 완전히 동일하게 동기화!
      p.level = currentLvl;
      const pool = OPPONENT_COMP_POOLS[p.id];
      if (pool && pool.levels) {
        const comp = pool.levels[p.level] || pool.levels[1];
        if (comp) {
          p.board = comp.board ? JSON.parse(JSON.stringify(comp.board)) : [];
          p.bench = comp.bench ? JSON.parse(JSON.stringify(comp.bench)) : [];
        }
      }
    });

    if (this.dom && this.dom.scoreboardList) {
      this.updateScoreboardUI();
    }
  }

  // 플레이어 또는 상대 결투장 정찰 전환 (불필요한 알림 팝업 완전 제거)
  scoutPlayer(playerId) {
    if (this.phase === "combat") {
      this.showToastNotification("⚔️ 전투 진행 중에는 정찰할 수 없습니다.", "warning");
      return;
    }

    if (playerId === "player" || playerId === this.scoutedPlayerId) {
      this.scoutedPlayerId = null;
    } else {
      this.scoutedPlayerId = playerId;
    }

    sound.playTone(520, "triangle", 0.05, 0.08, false);
    this.renderUnits();
    this.updateSynergies();
    this.updateScoreboardUI();
    this.updateScoutBanner();
  }

  // Tab 또는 Q 키로 8인 로비 순환 정찰
  cycleScouting(direction = 1) {
    if (this.phase === "combat") return;
    const alive = this.lobbyOpponents.filter(p => p.isAlive);
    if (alive.length === 0) return;
    const currentId = this.scoutedPlayerId || "player";
    let idx = alive.findIndex(p => p.id === currentId);
    if (idx === -1) idx = 0;
    const nextIdx = (idx + direction + alive.length) % alive.length;
    this.scoutPlayer(alive[nextIdx].id);
  }

  // 정찰 안내 플로팅 배너 및 상/하단 대기석 라벨 갱신 (알림 배너 제거 & 스테이지 상시 노출)
  updateScoutBanner() {
    if (this.dom.stageTrackerCenter) {
      this.dom.stageTrackerCenter.style.display = "flex";
    }
  }

  // 8인 로비 순위표 UI 갱신 (체력순 정렬, 탈락자 처리)
  updateScoreboardUI() {
    if (!this.dom.scoreboardList) return;

    // 플레이어 실시간 정보 동기화
    const playerEntry = this.lobbyOpponents.find(o => o.id === "player");
    if (playerEntry) {
      playerEntry.hp = this.player.hp;
      playerEntry.level = this.player.level;
      playerEntry.isAlive = (this.player.hp > 0);
      playerEntry.winStreak = this.player.winStreak;
      playerEntry.lossStreak = this.player.lossStreak;
    }

    // 생존자(체력 내림차순) 우선, 탈락자는 최하단 정렬
    const sorted = [...this.lobbyOpponents].sort((a, b) => {
      if (a.isAlive && !b.isAlive) return -1;
      if (!a.isAlive && b.isAlive) return 1;
      return b.hp - a.hp;
    });

    this.dom.scoreboardList.innerHTML = "";
    sorted.forEach((p, idx) => {
      const isCurrent = (!this.scoutedPlayerId && p.id === "player") || (this.scoutedPlayerId === p.id);
      const item = document.createElement("div");
      item.className = `scoreboard-orb-item ${isCurrent ? 'active' : ''} ${!p.isAlive ? 'eliminated' : ''}`;
      item.dataset.playerId = p.id;
      item.title = `${p.name} (Lv.${p.level || 1}) · 체력: ${p.hp} HP - 클릭하여 결투장 정찰`;

      const hpStatusClass = p.hp <= 25 ? 'critical' : (p.hp <= 50 ? 'warning' : 'healthy');

      item.innerHTML = `
        <div class="orb-hp-badge ${hpStatusClass} ${!p.isAlive ? 'dead' : ''}">
          ${p.isAlive ? p.hp : '0'}
        </div>
        <div class="orb-avatar-box">
          <img class="orb-avatar-img" src="${p.avatar}" alt="${p.name}" onerror="this.src='https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/588.png'">
          ${p.isPlayer ? '<span class="orb-me-tag">나</span>' : ''}
          ${!p.isAlive ? '<span class="orb-dead-tag">💀</span>' : ''}
          ${p.winStreak >= 2 ? `<span class="orb-streak-tag">🔥${p.winStreak}</span>` : ''}
          ${p.lossStreak >= 2 ? `<span class="orb-streak-tag loss">💧${p.lossStreak}</span>` : ''}
        </div>
      `;

      item.addEventListener("click", () => {
        this.scoutPlayer(p.id);
      });

      this.dom.scoreboardList.appendChild(item);
    });
  }

  // 라운드 종료 시 로비 AI 플레이어들 간의 전투 피해 시뮬레이션
  simulateLobbyDamage(currentPvPOpp = null, playerWon = false, pvpDamage = 0, stageNum = null) {
    if (stageNum === null) {
      const stageStr = String(ROUNDS[this.roundIdx]?.stage || "1").split("-")[0];
      stageNum = parseInt(stageStr, 10) || 1;
    }
    if (stageNum <= 1) return; // 미니언 크립 라운드는 데미지 없음

    this.lobbyOpponents.forEach(p => {
      if (p.isPlayer || !p.isAlive) return;

      // 이번 라운드에 플레이어와 직접 PvP를 진행한 상대
      if (currentPvPOpp && p.id === currentPvPOpp.id) {
        if (playerWon) {
          const dmg = pvpDamage > 0 ? pvpDamage : ((stageNum * 4) + Math.floor(Math.random() * 6));
          p.hp = Math.max(0, p.hp - dmg);
          if (p.hp === 0) p.isAlive = false;
          p.lossStreak++;
          p.winStreak = 0;
        } else {
          p.winStreak++;
          p.lossStreak = 0;
        }
        return;
      }

      // 나머지 AI 상대들 간의 시뮬레이션: 55% 확률로 패배하여 체력 차감
      if (Math.random() < 0.55) {
        const dmg = (stageNum * 4) + Math.floor(Math.random() * 6);
        p.hp = Math.max(0, p.hp - dmg);
        if (p.hp === 0) p.isAlive = false;
        p.lossStreak++;
        p.winStreak = 0;
      } else {
        p.winStreak++;
        p.lossStreak = 0;
      }
    });
    this.updateScoreboardUI();
  }

  spawnEnemyUnits(roundInfo) {
    // 기존 적군 제거
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 7; c++) {
        this.board[r][c] = null;
      }
    }
    if (!roundInfo) return;

    if (roundInfo.isPvP) {
      roundInfo.enemies.forEach(e => {
        const base = CHAMPIONS.find(c => c.id === e.champId);
        if (!base) return;
        this.board[e.row][e.col] = makeUnit(base, e.star || 1, "enemy");
      });
    } else {
      // 크립/몬스터 라운드
      roundInfo.enemies.forEach(m => {
        const champ = {
          id: 'monster_' + m.name,
          name: m.name,
          cost: 1,
          traits: [],
          icon: m.icon,
          image: m.image,
          color: '#475569',
          hp: m.hp,
          ad: m.ad,
          as: m.as,
          armor: m.armor || 20,
          mr: 10,
          range: m.range || 1,
          startMana: 0,
          maxMana: 100,
          skillName: "돌진 공격",
          skillDesc: "적에게 강한 일격을 가합니다.",
          skill: (caster, target, battle) => {
            battle.dealDamage(caster, target, caster.ad * 1.5, "physical");
          }
        };
        const unit = makeUnit(champ, 1, "enemy");
        unit.uid = makeUid('monster');
        this.board[m.row][m.col] = unit;
      });
    }

    this.renderUnits();
  }

  // 실제 화면상의 육각 타일 중심 좌표를 측정 (전투 좌표계 = board-grid 내부 px)
  measureBoardGeometry() {
    const grid = this.dom.boardGrid;
    const gridRect = grid.getBoundingClientRect();
    const scale = grid.offsetWidth ? gridRect.width / grid.offsetWidth : 1;
    const ox = gridRect.left + grid.clientLeft * scale;
    const oy = gridRect.top + grid.clientTop * scale;

    const centers = [];
    grid.querySelectorAll(".grid-cell").forEach(cell => {
      const r = +cell.dataset.row;
      const c = +cell.dataset.col;
      const rect = cell.getBoundingClientRect();
      (centers[r] = centers[r] || [])[c] = {
        x: (rect.left + rect.width / 2 - ox) / scale,
        y: (rect.top + rect.height / 2 - oy) / scale
      };
    });

    const spacing = Math.hypot(centers[0][1].x - centers[0][0].x, centers[0][1].y - centers[0][0].y) || 100;
    const all = centers.flat();
    const bounds = {
      minX: Math.min(...all.map(p => p.x)),
      maxX: Math.max(...all.map(p => p.x)),
      minY: Math.min(...all.map(p => p.y)),
      maxY: Math.max(...all.map(p => p.y))
    };
    return { centers, spacing, bounds };
  }

  createBattleUnit(u, r, c, geo) {
    const p = geo.centers[r][c];
    return {
      ...u,                    // 원본 유닛 필드 얕은 복사 (champ 함수 참조 유지)
      champ: u.champ,
      hp: u.maxHp,
      mana: u.champ.startMana,
      shield: 0,
      as: u.champ.as,
      baseAs: u.champ.as,
      armor: u.champ.armor || 20,
      mr: u.champ.mr != null ? u.champ.mr : 20,
      ap: 0,
      r, c,
      x: p.x,
      y: p.y,
      targetUid: null,
      attackTimer: 0,
      attackCount: 0,
      stunnedUntil: 0,
      duelistStacks: 0,
      divineUntil: 0,
      divineUsed: false,
      bossUsed: false,
      isSittingUp: false,
      trueDamage: false,
      lifesteal: 0
    };
  }

  initBattleInstance() {
    const geo = this.measureBoardGeometry();
    const units = [];
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 7; c++) {
        const u = this.board[r][c];
        if (u) units.push(this.createBattleUnit(u, r, c, geo));
      }
    }

    const battle = {
      id: ++this.battleSeq,
      currentTime: 0, // 시뮬레이션 시간(ms) - 탭이 백그라운드여도 일관되게 동작
      units,
      geo,
      events: [],
      sides: {},
      audio: sound,
      lastAttackSoundAt: -999,
      playerStartedEmpty: (units.filter(u => u.side === "player").length === 0)
    };

    // 스킬(data.js)에서 사용하는 전투 API
    Object.assign(battle, {
      dealDamage: (attacker, defender, amount, type = "physical") => this.dealDamage(battle, attacker, defender, amount, type),
      spawnEffect: (x, y, emoji, duration = 600) => this.spawnBurstEffect(x, y, emoji, duration),
      // origin 주변 rangeCells(타일 수) 안의 적 (forSide 기준의 적). 가까운 순.
      getEnemiesInRange: (origin, rangeCells, maxCount = 99, forSide = origin.side) => {
        const maxDist = rangeCells * geo.spacing + 1;
        return this.targetableUnits(battle, u => u.side !== forSide)
          .map(u => ({ u, d: Math.hypot(u.x - origin.x, u.y - origin.y) }))
          .filter(o => o.d <= maxDist)
          .sort((a, b) => a.d - b.d)
          .slice(0, maxCount)
          .map(o => o.u);
      },
      getFarthestEnemy: (origin) => {
        const enemies = this.targetableUnits(battle, u => u.side !== origin.side);
        if (enemies.length === 0) return null;
        return enemies.reduce((best, u) =>
          Math.hypot(u.x - origin.x, u.y - origin.y) > Math.hypot(best.x - origin.x, best.y - origin.y) ? u : best
        );
      },
      instantEliminate: (target, reason = "즉사!") => {
        if (target.hp <= 0) return;
        target.hp = 0;
        this.spawnDamagePopup(target.x, target.y, reason, "true");
      },
      // 전장 가장자리 판정 (리 신 장외 홈런)
      isNearEdge: (target) => {
        const b = geo.bounds;
        const m = geo.spacing * 0.55;
        return target.x <= b.minX + m || target.x >= b.maxX - m || target.y <= b.minY + m || target.y >= b.maxY - m;
      },
      // from 반대 방향으로 cells 타일만큼 밀어냄. 장외로 나가면 true 반환
      knockback: (target, from, cells = 2) => {
        const angle = Math.atan2(target.y - from.y, target.x - from.x);
        const nx = target.x + Math.cos(angle) * geo.spacing * cells;
        const ny = target.y + Math.sin(angle) * geo.spacing * cells;
        const b = geo.bounds;
        const pad = geo.spacing * 0.4;
        const out = nx < b.minX - pad || nx > b.maxX + pad || ny < b.minY - pad || ny > b.maxY + pad;
        target.x = Math.max(b.minX, Math.min(b.maxX, nx));
        target.y = Math.max(b.minY, Math.min(b.maxY, ny));
        target.stunnedUntil = Math.max(target.stunnedUntil, battle.currentTime + 800);
        return out;
      },
      schedule: (delayMs, fn) => battle.events.push({ at: battle.currentTime + delayMs, fn })
    });

    // 양 진영 시너지 계산 & 전투 시작 효과 적용 (적에게도 동일하게 적용)
    ["player", "enemy"].forEach(side => {
      const sideUnits = units.filter(u => u.side === side);
      const counts = countTraits(sideUnits);
      const cultistTier = traitTier(counts, "cultist");
      battle.sides[side] = {
        counts,
        galioTier: cultistTier + 1, // 0 = 없음, 1 = 폭군, 2 = 마왕
        galioSpawned: false,
        duelistPct: [0.15, 0.25, 0.40][traitTier(counts, "duelist")] || 0,
        divineMs: [4000, 7000, 10000][traitTier(counts, "divine")] || 0,
        startHp: 0
      };
      this.applyStartTraits(battle, side, sideUnits, counts);
      battle.sides[side].startHp = sideUnits.reduce((sum, u) => sum + u.maxHp, 0);
    });

    this.battle = battle;
    this.dom.boardGrid.classList.add("in-combat");
    this.renderCombatState();
    this.combatInterval = setInterval(() => this.combatTick(), TICK_MS);
  }

  applyStartTraits(battle, side, sideUnits, counts) {
    // 1. 달빛 (Moonlight): 가장 낮은 성급의 달빛 챔피언 1단계 승급 (최대 4성)
    if (traitTier(counts, "moonlight") >= 0) {
      const moonlights = sideUnits.filter(u => u.champ.traits.includes("moonlight") && u.star < 4);
      if (moonlights.length > 0) {
        moonlights.sort((a, b) => a.star - b.star || a.maxHp - b.maxHp);
        const up = moonlights[0];
        const ratio = STAR_MULT[up.star + 1] / STAR_MULT[up.star];
        up.star += 1;
        up.maxHp = Math.round(up.maxHp * ratio);
        up.hp = up.maxHp;
        up.ad = Math.round(up.ad * ratio);
        up.ap += 25;
        sound.playCombine(up.star);
        this.spawnDamagePopup(up.x, up.y - 30, `🌙 달빛 승급! ${STAR_TEXT[up.star]}`, "magic");
      }
    }

    // 2. 대장군 (Warlord): 체력 & 주문력 보너스 (플레이어는 승리마다 10%씩 최대 5회 중첩)
    const warlordTier = traitTier(counts, "warlord");
    if (warlordTier >= 0) {
      const bonus = [{ hp: 200, ap: 20 }, { hp: 450, ap: 40 }][warlordTier];
      const stackMult = side === "player" ? 1 + 0.1 * Math.min(5, this.player.warlordWins) : 1;
      sideUnits.filter(u => u.champ.traits.includes("warlord")).forEach(u => {
        u.maxHp += Math.round(bonus.hp * stackMult);
        u.hp = u.maxHp;
        u.ap += Math.round(bonus.ap * stackMult);
      });
    }
  }

  targetableUnits(battle, predicate = () => true) {
    return battle.units.filter(u => u.hp > 0 && !u.isSittingUp && predicate(u));
  }

  findTarget(battle, unit) {
    // 기존 대상이 유효하면 유지 (TFT처럼 대상이 죽기 전까지 고정)
    if (unit.targetUid) {
      const cur = battle.units.find(u => u.uid === unit.targetUid);
      if (cur && cur.hp > 0 && !cur.isSittingUp) return cur;
    }
    const enemies = this.targetableUnits(battle, u => u.side !== unit.side);
    if (enemies.length === 0) return null;
    let best = enemies[0];
    let bestD = Infinity;
    enemies.forEach(e => {
      const d = Math.hypot(e.x - unit.x, e.y - unit.y);
      if (d < bestD) { bestD = d; best = e; }
    });
    unit.targetUid = best.uid;
    return best;
  }

  combatTick() {
    const battle = this.battle;
    if (this.phase !== "combat" || !battle) return;

    battle.currentTime += TICK_MS;
    const now = battle.currentTime;

    // 예약된 이벤트 처리 (갈리오 착지, 세트 복귀 등)
    const due = battle.events.filter(e => e.at <= now);
    battle.events = battle.events.filter(e => e.at > now);
    due.forEach(e => e.fn());

    // 승패 체크 (윗몸일으키기 중인 세트도 살아있는 유닛으로 취급)
    const alivePlayers = battle.units.filter(u => u.side === "player" && u.hp > 0);
    const aliveEnemies = battle.units.filter(u => u.side === "enemy" && u.hp > 0);
    if (aliveEnemies.length === 0) { this.endCombat(true); return; }
    if (alivePlayers.length === 0) {
      if (battle.playerStartedEmpty && now < 1200 && !battle.isHeadless) {
        // 오픈 포트(빈 필드) 시 1.2초 동안 상대 필드 모습을 보여준 뒤 패배 처리 (스킵 중에는 즉시 처리)
      } else {
        this.endCombat(false);
        return;
      }
    }
    if (now >= COMBAT_TIME_LIMIT_MS) {
      this.showToastNotification("⏱️ 전투 시간 초과! 무승부는 패배로 처리됩니다.");
      this.endCombat(false);
      return;
    }

    // 광신도: 아군 총 체력이 50% 이하로 떨어지면 갈리오 강림
    ["player", "enemy"].forEach(side => this.checkCultist(battle, side));

    const dt = TICK_MS / 1000;
    battle.units.forEach(unit => {
      if (unit.hp <= 0 || unit.isSittingUp) return;
      this.checkDivine(battle, unit);
      if (unit.stunnedUntil > now) return; // 기절 상태

      const target = this.findTarget(battle, unit);
      if (!target) return;

      const dist = Math.hypot(target.x - unit.x, target.y - unit.y);
      const rangePx = (unit.champ.range || 1) * battle.geo.spacing * 1.05;

      if (dist > rangePx) {
        // 민첩하고 다이내믹한 이동 (초당 3.2~4.0타일)
        const cellsPerSec = unit.champ.traits.includes("duelist") ? 4.0 : 3.2;
        const step = Math.min(battle.geo.spacing * cellsPerSec * dt, dist - rangePx * 0.9);
        const angle = Math.atan2(target.y - unit.y, target.x - unit.x);
        unit.x += Math.cos(angle) * step;
        unit.y += Math.sin(angle) * step;
      } else {
        unit.attackTimer += dt;
        const attackInterval = 1 / Math.max(0.4, (unit.as || 0.7) * 1.3);
        if (unit.attackTimer >= attackInterval) {
          unit.attackTimer -= attackInterval;
          this.executeUnitAttack(battle, unit, target);
        }
      }
    });

    this.separateUnits(battle);
    if (!battle.isHeadless) {
      this.renderCombatState();
    }
  }

  // 유닛끼리 겹치지 않도록 밀어내기
  separateUnits(battle) {
    const minDist = battle.geo.spacing * 0.7;
    const list = battle.units.filter(u => u.hp > 0 && !u.isSittingUp);
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        let d = Math.hypot(dx, dy);
        if (d >= minDist) continue;
        if (d < 0.01) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; d = Math.hypot(dx, dy); }
        const push = (minDist - d) / 2;
        const nx = dx / d, ny = dy / d;
        a.x -= nx * push; a.y -= ny * push;
        b.x += nx * push; b.y += ny * push;
      }
    }
    const bd = battle.geo.bounds;
    list.forEach(u => {
      u.x = Math.max(bd.minX, Math.min(bd.maxX, u.x));
      u.y = Math.max(bd.minY, Math.min(bd.maxY, u.y));
    });
  }

  checkCultist(battle, side) {
    const s = battle.sides[side];
    if (!s || s.galioTier <= 0 || s.galioSpawned) return;
    const currentHp = battle.units
      .filter(u => u.side === side && u.hp > 0 && u.champ.id !== "galio")
      .reduce((sum, u) => sum + u.hp, 0);
    if (currentHp <= s.startHp * 0.5) {
      s.galioSpawned = true;
      this.spawnGalio(battle, side, s.galioTier);
    }
  }

  checkDivine(battle, unit) {
    const ms = battle.sides[unit.side] ? battle.sides[unit.side].divineMs : 0;
    if (!ms || unit.divineUsed || !unit.champ.traits.includes("divine")) return;
    if (unit.attackCount >= 6 || unit.hp <= unit.maxHp * 0.5) {
      unit.divineUsed = true;
      unit.divineUntil = battle.currentTime + ms;
      unit.stunnedUntil = 0; // 군중 제어 해제
      this.spawnBurstEffect(unit.x, unit.y, "✨", 900);
      this.spawnDamagePopup(unit.x, unit.y - 30, "신성 강림!", "heal");
    }
  }

  executeUnitAttack(battle, unit, target) {
    unit.attackCount++;
    if (battle.currentTime - battle.lastAttackSoundAt >= 200) {
      battle.lastAttackSoundAt = battle.currentTime;
      sound.playAttack();
    }
    this.animateAttack(battle, unit, target);

    let damage = unit.ad;
    // 진: 매 4번째 공격은 잃은 체력 비례 치명타 탄환
    if (unit.champ.id === "jhin" && unit.attackCount % 4 === 0) {
      damage = unit.ad * (2 + unit.star * 0.5) + (target.maxHp - target.hp) * 0.25;
      this.spawnBurstEffect(target.x, target.y, "🎭💥", 700);
      sound.playSkillSound("slash");
    }
    this.dealDamage(battle, unit, target, damage, "physical");

    // 마나 충전 (평타당 10) → 스킬 시전
    if (unit.maxMana > 0 && unit.hp > 0) {
      unit.mana = Math.min(unit.maxMana, unit.mana + 10);
      if (unit.mana >= unit.maxMana) {
        unit.mana = 0;
        const skillTarget = target.hp > 0 ? target : this.findTarget(battle, unit);
        if (skillTarget) this.castUnitSkill(battle, unit, skillTarget);
      }
    }

    // 결투가: 시너지 활성 시 공격마다 공속 중첩 (최대 8회)
    const duelPct = battle.sides[unit.side].duelistPct;
    if (duelPct > 0 && unit.champ.traits.includes("duelist") && unit.duelistStacks < 8) {
      unit.duelistStacks++;
      unit.as = unit.baseAs * (1 + duelPct * unit.duelistStacks) + (unit.bonusAs || 0);
    }

    // 칼리스타: 창 누적 → 창 피해가 남은 체력 이상이면 즉시 뽑아 찢기
    if (unit.champ.id === "kalista" && target.hp > 0) {
      target.spearStacks = (target.spearStacks || 0) + 1;
      const executeDamage = target.spearStacks * 25 * unit.star;
      if (executeDamage >= target.hp) {
        this.spawnBurstEffect(target.x, target.y, "🏹💥", 600);
        sound.playSkillSound("slash");
        battle.instantEliminate(target, "뽑아찢기!");
      }
    }
  }

  castUnitSkill(battle, unit, target) {
    if (!unit.champ.skill) return;
    const el = battle.tokens && battle.tokens.get(unit.uid);
    if (el) {
      el.classList.remove("casting");
      void el.offsetWidth; // 애니메이션 재시작
      el.classList.add("casting");
    }

// 스킬 시전 시 시야를 가리는 스킬명 텍스트 배너 제거 (스킬 애니메이션 완전 노출)

    // 2. 5코스트 궁극기 및 대형 스킬 시전 시 화면 진동 (손맛 극대화)
    if (["sett", "leeSin", "galio", "warwick", "sejuani"].includes(unit.champ.id)) {
      document.body.classList.add("screen-shake");
      setTimeout(() => document.body.classList.remove("screen-shake"), 300);
    }

    // 3. 챔피언 고유 초대형 스페셜 VFX
    this.spawnChampionSpecialVFX(battle, unit, target);

    // 4. 챔피언 특성에 맞는 박진감 넘치는 스킬 효과음
    const slamChamps = ["sett", "leeSin", "galio"];
    const slashChamps = ["yasuo", "yone", "katarina", "garen", "diana"];
    const soundType = slamChamps.includes(unit.champ.id) ? "slam" : slashChamps.includes(unit.champ.id) ? "slash" : "burst";
    sound.playSkillSound(soundType);

    unit.champ.skill(unit, target, battle);
  }

  // 초대형 스킬 컷인 배너 (스킬 이름이 한눈에 띔)
  spawnSkillAnnouncement(x, y, champ, side) {
    if (this.battle && this.battle.isHeadless) return;
    const banner = document.createElement("div");
    banner.className = `skill-cutin-banner side-${side}`;
    banner.style.left = `${x}px`;
    banner.style.top = `${y - 30}px`;
    banner.innerHTML = `
      <span class="skill-cutin-tag">⚡ SKILL</span>
      <span class="skill-cutin-name">${champ.name}</span>
      <span class="skill-cutin-desc">${champ.skillName.split(" (")[0]}</span>
    `;
    this.dom.boardGrid.appendChild(banner);
    setTimeout(() => banner.remove(), 1200);
  }

  // 챔피언별 시각적 쾌감을 주는 거대 스페셜 이펙트
  spawnChampionSpecialVFX(battle, caster, target) {
    if (this.battle && this.battle.isHeadless) return;
    const cid = caster.champ.id;
    const tx = target ? target.x : caster.x;
    const ty = target ? target.y : caster.y;

    if (cid === "yasuo") {
      // 야스오: 황금빛 거대 회오리바람 폭풍 발사
      const vfx = document.createElement("div");
      vfx.className = "vfx-large-area vfx-yasuo-storm";
      vfx.style.left = `${caster.x}px`;
      vfx.style.top = `${caster.y}px`;
      vfx.style.setProperty("--dx", `${tx - caster.x}px`);
      vfx.style.setProperty("--dy", `${ty - caster.y}px`);
      vfx.textContent = "🌪️⚡🌪️";
      this.dom.boardGrid.appendChild(vfx);
      setTimeout(() => vfx.remove(), 850);
      this.spawnShockwave(tx, ty, "#f59e0b", 200);
    } else if (cid === "sett") {
      // 세트: 대지 분쇄 거대 크레이터 폭발
      const vfx = document.createElement("div");
      vfx.className = "vfx-large-area vfx-sett-crater";
      vfx.style.left = `${tx}px`;
      vfx.style.top = `${ty}px`;
      vfx.textContent = "💥🌋💥";
      this.dom.boardGrid.appendChild(vfx);
      setTimeout(() => vfx.remove(), 950);
      this.spawnShockwave(tx, ty, "#ef4444", 260);
    } else if (cid === "sejuani") {
      // 세주아니: 전장 전체를 뒤덮는 거대 눈보라 서리 링
      const vfx = document.createElement("div");
      vfx.className = "vfx-large-area vfx-sejuani-blizzard";
      vfx.style.left = `${tx}px`;
      vfx.style.top = `${ty}px`;
      vfx.textContent = "❄️🧊❄️";
      this.dom.boardGrid.appendChild(vfx);
      setTimeout(() => vfx.remove(), 1400);
      this.spawnShockwave(tx, ty, "#38bdf8", 280);
    } else if (cid === "katarina") {
      // 카타리나: 고속 회전 핏빛 단검 폭풍
      const vfx = document.createElement("div");
      vfx.className = "vfx-large-area vfx-katarina-lotus";
      vfx.style.left = `${caster.x}px`;
      vfx.style.top = `${caster.y}px`;
      vfx.textContent = "🗡️🌪️🗡️";
      this.dom.boardGrid.appendChild(vfx);
      setTimeout(() => vfx.remove(), 1100);
      this.spawnShockwave(caster.x, caster.y, "#e11d48", 220);
    } else if (cid === "garen") {
      // 가렌: 황금 대검 회오리 소용돌이
      const vfx = document.createElement("div");
      vfx.className = "vfx-large-area vfx-garen-spin";
      vfx.style.left = `${caster.x}px`;
      vfx.style.top = `${caster.y}px`;
      vfx.textContent = "⚔️✨⚔️";
      this.dom.boardGrid.appendChild(vfx);
      setTimeout(() => vfx.remove(), 950);
      this.spawnShockwave(caster.x, caster.y, "#f59e0b", 200);
    } else if (cid === "diana") {
      // 다이애나: 은빛 달빛 보호막 돔
      const vfx = document.createElement("div");
      vfx.className = "vfx-large-area vfx-diana-dome";
      vfx.style.left = `${caster.x}px`;
      vfx.style.top = `${caster.y}px`;
      vfx.textContent = "🛡️🌙✨";
      this.dom.boardGrid.appendChild(vfx);
      setTimeout(() => vfx.remove(), 1000);
      this.spawnShockwave(caster.x, caster.y, "#c084fc", 180);
    } else if (cid === "leeSin") {
      // 리 신: 강력한 전광 킥 충격파
      this.spawnShockwave(tx, ty, "#eab308", 240);
      this.spawnBurstEffect(tx, ty, "⚡🥋⚡", 900);
    } else if (cid === "annie") {
      // 애니: 거대한 화염 폭풍
      this.spawnShockwave(tx, ty, "#f97316", 220);
      this.spawnBurstEffect(tx, ty, "🔥🔥🔥", 900);
    } else {
      // 기본: 화려한 속성 충격파 + 대형 이펙트
      this.spawnShockwave(tx, ty, caster.champ.color || "#38bdf8", 180);
    }
  }

  // 평타 시 대상 방향으로 살짝 돌진하는 연출
  animateAttack(battle, unit, target) {
    const el = battle.tokens && battle.tokens.get(unit.uid);
    if (!el) return;
    const angle = Math.atan2(target.y - unit.y, target.x - unit.x);
    const lunge = (unit.champ.range || 1) > 1 ? 4 : 10;
    el.style.setProperty("--lx", `${Math.cos(angle) * lunge}px`);
    el.style.setProperty("--ly", `${Math.sin(angle) * lunge}px`);
    el.classList.remove("attacking");
    void el.offsetWidth;
    el.classList.add("attacking");
  }

  dealDamage(battle, attacker, defender, amount, type = "physical") {
    if (!defender || defender.hp <= 0 || defender.isSittingUp) return 0;
    const now = battle.currentTime;

    if (attacker) {
      // 주문력 증폭 (마법 피해)
      if (type === "magic") amount *= 1 + (attacker.ap || 0) / 100;
      // 투지 폭발 세트 / 신성 상태 → 고정 피해
      if (attacker.trueDamage || attacker.divineUntil > now) type = "true";
    }

    // 방어력 / 마법 저항력
    if (type === "physical") amount *= 100 / (100 + (defender.armor || 0));
    else if (type === "magic") amount *= 100 / (100 + (defender.mr || 0));

    // 신성 상태: 받는 피해 50% 감소
    if (defender.divineUntil > now) amount *= 0.5;

    amount = Math.max(0, amount);
    let hpDamage = amount;

    // 쉴드 흡수
    if (defender.shield > 0) {
      const absorbed = Math.min(defender.shield, hpDamage);
      defender.shield -= absorbed;
      hpDamage -= absorbed;
    }

    defender.hp -= hpDamage;
    if (amount >= 1) this.spawnDamagePopup(defender.x, defender.y, Math.round(amount), type);

    // 피격 시 마나 충전
    if (defender.maxMana > 0) {
      defender.mana = Math.min(defender.maxMana, defender.mana + Math.min(12, amount * 0.04));
    }

    // 흡혈 (워윅)
    if (attacker && attacker.lifesteal > 0 && attacker.hp > 0) {
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + amount * attacker.lifesteal);
    }

    if (defender.hp <= 0) {
      defender.hp = 0;
      return amount;
    }

    // 우두머리(세트) 윗몸일으키기 체크
    if (defender.champ.traits.includes("theBoss") && !defender.bossUsed && defender.hp <= defender.maxHp * 0.4) {
      defender.bossUsed = true;
      this.triggerSettSitups(battle, defender);
    }
    return amount;
  }

  // 우두머리(세트) 윗몸일으키기 연출: 전장 이탈 → 2.5초 후 풀피 & 고정 피해로 복귀
  triggerSettSitups(battle, sett) {
    const b = battle.geo.bounds;
    sett.isSittingUp = true;
    sett.stunnedUntil = 0;
    sett.targetUid = null;
    sett.returnX = sett.x;
    sett.returnY = sett.y;
    sett.x = sett.side === "player" ? b.minX : b.maxX;
    sett.y = sett.side === "player" ? b.maxY : b.minY;
    this.spawnBurstEffect(sett.x, sett.y, "🏋️", 2500);
    this.spawnDamagePopup(sett.x, sett.y - 30, "윗몸일으키기!", "skill");

    battle.schedule(2500, () => {
      if (sett.hp <= 0) return;
      sett.isSittingUp = false;
      sett.hp = sett.maxHp;
      sett.ad = Math.round(sett.ad * 1.3);
      sett.trueDamage = true;
      sett.x = sett.returnX;
      sett.y = sett.returnY;
      this.spawnBurstEffect(sett.x, sett.y, "🔥", 1000);
      this.spawnDamagePopup(sett.x, sett.y - 30, "투지 폭발!", "true");
    });
  }

  // 갈리오 낙하 연출 (광신도 시너지, 양 진영 공용)
  spawnGalio(battle, side, tier) {
    const isLord = tier >= 2;
    const hp = isLord ? 2800 : 1400;
    const ad = isLord ? 140 : 80;
    const isPlayer = side === "player";

    // 화면 오버레이 & 진동
    const overlay = document.createElement("div");
    overlay.className = `galio-landing-overlay ${isPlayer ? '' : 'enemy-galio'}`;
    overlay.innerHTML = `
      <div class="galio-avatar">🗿⚡</div>
      <div class="galio-banner">${isPlayer ? '' : '적 '}${isLord ? "마왕 갈리오 강림!" : "폭군 갈리오 강림!"}</div>
    `;
    this.dom.overlayContainer.appendChild(overlay);
    document.body.classList.add("screen-shake");
    sound.playSkillSound("galio");
    setTimeout(() => {
      overlay.remove();
      document.body.classList.remove("screen-shake");
    }, 1000);

    battle.schedule(1000, () => {
      // 착지 지점: 상대 진영 쪽 중앙 (적이 가장 많은 곳 근처)
      const foes = this.targetableUnits(battle, u => u.side !== side);
      const cx = foes.length ? foes.reduce((s, u) => s + u.x, 0) / foes.length : battle.geo.centers[isPlayer ? 2 : 3][3].x;
      const cy = foes.length ? foes.reduce((s, u) => s + u.y, 0) / foes.length : battle.geo.centers[isPlayer ? 2 : 3][3].y;

      const champ = {
        id: "galio",
        name: isLord ? "마왕 갈리오" : "폭군 갈리오",
        cost: 5,
        traits: ["cultist"],
        icon: "🗿",
        color: "#7e22ce",
        hp, ad,
        as: 0.8,
        armor: 60,
        mr: 60,
        range: 1,
        startMana: 50,
        maxMana: 100,
        skillName: "영웅출현 강타",
        skillDesc: "지면을 강타하여 주변 적들에게 강력한 마법 피해를 입힙니다.",
        skill: (caster, target, bt) => {
          bt.getEnemiesInRange(caster, 2, 5).forEach(t => bt.dealDamage(caster, t, isLord ? 400 : 250, "magic"));
          bt.spawnEffect(caster.x, caster.y, "⚡💥", 800);
        }
      };
      const galio = this.createBattleUnit(makeUnit(champ, isLord ? 3 : 2, side), 0, 0, battle.geo);
      galio.uid = `galio_${side}_${battle.id}`;
      galio.maxHp = hp;
      galio.hp = hp;
      galio.ad = ad;
      galio.x = cx;
      galio.y = cy;
      battle.units.push(galio);

      // 낙하 시 주변 적 광역 피해 & 기절
      this.spawnBurstEffect(cx, cy, "💥", 900);
      battle.getEnemiesInRange(galio, 2.2, 99).forEach(e => {
        this.dealDamage(battle, galio, e, isLord ? 200 : 100, "magic");
        e.stunnedUntil = battle.currentTime + (isLord ? 2500 : 1500);
      });
    });
  }

  // 전투 렌더링: 토큰을 한 번만 만들고 위치/체력만 갱신 (매 틱 DOM 재생성 X)
  renderCombatState() {
    const battle = this.battle;
    if (!battle) return;

    if (!battle.layer) {
      const layer = document.createElement("div");
      layer.id = "combat-layer";
      layer.className = "combat-layer";
      this.dom.boardGrid.appendChild(layer);
      battle.layer = layer;
      battle.tokens = new Map();
    }

    const now = battle.currentTime;
    battle.units.forEach(u => {
      let el = battle.tokens.get(u.uid);
      if (!el) {
        el = document.createElement("div");
        el.className = `unit-token combat-token ${u.side === 'enemy' ? 'enemy' : ''} ${u.isChosen ? 'chosen' : ''} ${u.champ.id === 'galio' ? 'galio-unit' : ''}`;
        el.style.background = u.champ.color ? `linear-gradient(135deg, ${u.champ.color} 0%, #111827 100%)` : '#374151';
        el.innerHTML = unitTokenInnerHTML(u);
        el.dataset.star = u.star;
        el._hp = el.querySelector(".unit-hp-fill");
        el._shield = el.querySelector(".unit-shield-fill");
        el._mana = el.querySelector(".unit-mana-fill");
        el._manaBar = el.querySelector(".unit-mana-bar");
        el._stars = el.querySelector(".unit-stars");
        battle.layer.appendChild(el);
        battle.tokens.set(u.uid, el);
      }

      if (u.hp <= 0) {
        if (!el.classList.contains("dead")) {
          el.classList.add("dead");
          setTimeout(() => el.remove(), 450);
        }
        return;
      }

      el.style.left = `${u.x}px`;
      el.style.top = `${u.y}px`;
      el._hp.style.width = `${Math.max(0, (u.hp / u.maxHp) * 100)}%`;
      el._shield.style.width = `${Math.min(100, (u.shield / u.maxHp) * 100)}%`;
      const manaPct = u.maxMana > 0 ? Math.min(100, (u.mana / u.maxMana) * 100) : 0;
      el._mana.style.width = `${manaPct}%`;
      if (el._manaBar) {
        el._manaBar.classList.toggle("mana-full", manaPct >= 100);
      }
      if (+el.dataset.star !== u.star) {
        el.dataset.star = u.star;
        el._stars.textContent = STAR_TEXT[u.star];
        el._stars.classList.toggle("star-4", u.star === 4);
      }
      el.classList.toggle("stunned", u.stunnedUntil > now);
      el.classList.toggle("divine", u.divineUntil > now);
      el.classList.toggle("sitting-up", u.isSittingUp);
      el.classList.toggle("true-damage", !!u.trueDamage);
    });
  }

  spawnDamagePopup(x, y, text, type = "physical") {
    if (this.battle && this.battle.isHeadless) return;
    const pop = document.createElement("div");
    pop.className = `damage-popup damage-${type}`;
    pop.style.left = `${x + (Math.random() - 0.5) * 24}px`;
    pop.style.top = `${y - 20}px`;
    pop.textContent = text;
    this.dom.boardGrid.appendChild(pop);
    setTimeout(() => pop.remove(), 800);
  }

  spawnShockwave(x, y, color = "#38bdf8", size = 180) {
    if (this.battle && this.battle.isHeadless) return;
    const sw = document.createElement("div");
    sw.className = "skill-shockwave";
    sw.style.left = `${x}px`;
    sw.style.top = `${y}px`;
    sw.style.width = `${size}px`;
    sw.style.height = `${size}px`;
    sw.style.setProperty("--sw-color", color);
    this.dom.boardGrid.appendChild(sw);
    setTimeout(() => sw.remove(), 550);
  }

  spawnBurstEffect(x, y, emoji, duration = 650) {
    if (this.battle && this.battle.isHeadless) return;

    // 이모지 속성에 따른 테마 색상 자동 감지
    let color = "#fbbf24";
    if (emoji.includes("❄️") || emoji.includes("🧊")) color = "#38bdf8";
    else if (emoji.includes("🔥") || emoji.includes("🌋")) color = "#f97316";
    else if (emoji.includes("⚡") || emoji.includes("🥋")) color = "#eab308";
    else if (emoji.includes("💥")) color = "#ef4444";
    else if (emoji.includes("🌊")) color = "#06b6d4";
    else if (emoji.includes("🛡️") || emoji.includes("✨")) color = "#c084fc";
    else if (emoji.includes("😱") || emoji.includes("🎴")) color = "#a855f7";

    // 대형 스킬 충격파 링 생성 (180px)
    this.spawnShockwave(x, y, color, 180);

    const eff = document.createElement("div");
    eff.className = "skill-effect-burst";
    eff.style.left = `${x}px`;
    eff.style.top = `${y}px`;
    eff.style.setProperty("--flare-color", color);
    eff.style.animationDuration = `${Math.min(duration, 1400)}ms`;
    eff.textContent = emoji;
    this.dom.boardGrid.appendChild(eff);

    // 8방향 방사형 스파크 파티클
    for (let deg = 0; deg < 360; deg += 45) {
      const rad = (deg + (Math.random() - 0.5) * 20) * Math.PI / 180;
      const dist = 38 + Math.random() * 28;
      const spark = document.createElement("div");
      spark.className = "skill-spark";
      spark.style.left = `${x}px`;
      spark.style.top = `${y}px`;
      spark.style.setProperty("--spark-color", color);
      spark.style.setProperty("--dx", `${Math.cos(rad) * dist}px`);
      spark.style.setProperty("--dy", `${Math.sin(rad) * dist}px`);
      this.dom.boardGrid.appendChild(spark);
      setTimeout(() => spark.remove(), 450);
    }

    setTimeout(() => eff.remove(), duration);
  }

  // 전투 종료 & 라운드 정산
  endCombat(playerWon) {
    if (this.phase !== "combat") return;

    if (this.combatInterval) {
      clearInterval(this.combatInterval);
      this.combatInterval = null;
    }

    const battle = this.battle;
    this.battle = null;
    if (battle && battle.layer) battle.layer.remove();
    this.dom.boardGrid.classList.remove("in-combat");

    const round = ROUNDS[this.roundIdx] || {};
    const currentPvPOpp = this.getCurrentRoundOpponent();
    const stageStr = String(round.stage || "1").split("-")[0];
    const stageNum = parseInt(stageStr, 10) || 1;
    const counts = battle ? battle.sides.player.counts : this.updateSynergies();
    const log = [];

    let pvpDamageToOpponent = 0;

    if (playerWon) {
      sound.playVictory();
      if (round.isPvP) {
        this.player.winStreak++;
        this.player.lossStreak = 0;
        this.player.gold += 1; // PvP 승리 수당 +1G
        log.push("승리 수당 +1");

        // 내가 이긴 PvP 상대에게 가할 데미지 계산 (기본 스테이지 피해 + 살아남은 아군 1기당 2)
        const alivePlayers = battle ? battle.units.filter(u => u.side === "player" && u.hp > 0).length : 1;
        pvpDamageToOpponent = (stageNum * 3) + alivePlayers * 2;
      }

      // 행운(Fortune) 시너지 보상
      if (traitTier(counts, "fortune") >= 0) {
        if (this.player.fortuneStreak > 0) {
          const jackpotGold = this.player.fortuneStreak * 6 + 5;
          this.player.gold += jackpotGold;
          log.push(`🎲 잭팟 +${jackpotGold}`);
          this.showJackpotModal(this.player.fortuneStreak, jackpotGold);
          this.player.fortuneStreak = 0;
        } else {
          const orb = Math.floor(Math.random() * 3) + 1;
          this.player.gold += orb;
          log.push(`🎲 행운 +${orb}`);
        }
      }

      // 대장군: 승리마다 보너스 중첩 (최대 5회)
      if (traitTier(counts, "warlord") >= 0 && this.player.warlordWins < 5) {
        this.player.warlordWins++;
      }

      // 크립 라운드 전리품 보상
      if (round.rewardGold) {
        this.player.gold += round.rewardGold;
        log.push(`💰 전리품 +${round.rewardGold}`);
      }
    } else {
      sound.playDefeat();
      if (round.isPvP) {
        this.player.lossStreak++;
        this.player.winStreak = 0;
      }

      // 패배 시 플레이어 HP 차감: 스테이지 기본 피해 + 살아남은 적 1기당 2
      const aliveEnemies = battle ? battle.units.filter(u => u.side === "enemy" && u.hp > 0).length : 1;
      const damageTaken = stageNum + aliveEnemies * 2;
      this.player.hp = Math.max(0, this.player.hp - damageTaken);
      log.push(`❤️ -${damageTaken}`);

      if (traitTier(counts, "fortune") >= 0) {
        this.player.fortuneStreak++;
      }
    }

    // 게임 오버 체크 (HP 소진 시 다음 라운드 골드/이자/경험치 없이 즉시 종료)
    if (this.player.hp <= 0) {
      this.phase = "gameover";
      this.setCombatButtonState(false);
      this.showToastNotification(`💔 패배... ${log.join("  ")}`, "error");
      this.updateHUD();
      this.updateScoreboardUI();
      this.showGameOverModal();
      return;
    }

    // 로비 AI 플레이어 피해 시뮬레이션 (내가 이긴 PvP 상대는 데미지 직접 적용)
    this.simulateLobbyDamage(currentPvPOpp, playerWon, pvpDamageToOpponent, stageNum);

    // 다음 라운드로 전환
    this.roundIdx++;
    this.syncLobbyOpponentsGrowth();

    // 완주 또는 로비 생존자 체크 (우승 / 최종 순위 판정)
    const aliveOpponents = this.lobbyOpponents ? this.lobbyOpponents.filter(o => !o.isPlayer && o.isAlive) : [];
    if (this.roundIdx >= ROUNDS.length || aliveOpponents.length === 0) {
      this.phase = "victory";
      this.setCombatButtonState(false);
      this.showToastNotification(`${playerWon ? "🏆 승리!" : "💔 패배..."}  ${log.join("  ")}`, playerWon ? "success" : "error");
      this.updateHUD();
      this.updateScoreboardUI();

      // 플레이어 및 상대 체력 기반 최종 순위 계산
      const playerEntry = this.lobbyOpponents ? this.lobbyOpponents.find(o => o.isPlayer || o.id === "player") : null;
      if (playerEntry) {
        playerEntry.hp = this.player.hp;
        playerEntry.isAlive = (this.player.hp > 0);
      }
      const sorted = this.lobbyOpponents ? [...this.lobbyOpponents].sort((a, b) => {
        if (a.isAlive && !b.isAlive) return -1;
        if (!a.isAlive && b.isAlive) return 1;
        return b.hp - a.hp;
      }) : [];
      const rank = Math.max(1, sorted.findIndex(o => o.isPlayer || o.id === "player") + 1);

      this.showVictoryModal(rank);
      return;
    }

    // 다음 라운드 공식 기본 골드 지급 (1-2: 2G, 1-3: 2G, 2-1: 4G, 2-2+: 5G)
    const nextRound = ROUNDS[this.roundIdx];
    const baseGold = (nextRound && nextRound.roundGold !== undefined) ? nextRound.roundGold : 5;

    // 이자 (10G당 1G, 최대 5G)
    const interest = Math.min(5, Math.floor(this.player.gold / 10));

    // 연승 / 연패 보너스 (2~3연: 1G, 4연: 2G, 5연+: 3G)
    const streak = Math.max(this.player.winStreak, this.player.lossStreak);
    const streakBonus = streak >= 5 ? 3 : streak >= 4 ? 2 : streak >= 2 ? 1 : 0;

    const roundGold = baseGold + interest + streakBonus;
    this.player.gold += roundGold;
    if (roundGold > 0) {
      log.push(`🪙 +${roundGold} (기본 ${baseGold} · 이자 ${interest} · 연속 ${streakBonus})`);
    }

    this.showToastNotification(`${playerWon ? "🏆 승리!" : "💔 패배..."}  ${log.join("  ")}`, playerWon ? "success" : "error");

    // 경험치 +2
    this.gainExp(2);

    // 준비 단계 복귀
    this.phase = "planning";
    this.setCombatButtonState(false);

    // 상점 자동 리롤 (잠금 시 유지)
    this.refreshShop(false);

    // 적 필드 청소 및 다음 라운드 상대 미리 스카우팅 배치
    this.previewEnemyUnits(ROUNDS[this.roundIdx]);

    this.renderUnits();
    this.updateHUD();
    this.updateSynergies();
    this.updateScoreboardUI();
  }

  showJackpotModal(streak, gold) {
    const modal = document.createElement("div");
    modal.className = "info-modal";
    modal.innerHTML = `
      <div class="modal-content">
        <h2>🎲 행운(Fortune) 잭팟 폭발!!</h2>
        <p><strong>${streak}연패</strong> 끝에 승리를 거머쥐었습니다!<br>행운의 여신이 잭팟 보상으로 <strong>+${gold} 골드</strong>를 쏟아붓습니다!</p>
        <button class="btn-action" id="btn-close-jackpot">달달하다!</button>
      </div>
    `;
    this.dom.modalContainer.appendChild(modal);
    document.getElementById("btn-close-jackpot").addEventListener("click", () => modal.remove());
  }

  showGameOverModal() {
    let rank = 8;
    if (this.lobbyOpponents) {
      const playerEntry = this.lobbyOpponents.find(o => o.isPlayer || o.id === "player");
      if (playerEntry) {
        playerEntry.hp = 0;
        playerEntry.isAlive = false;
      }
      const sorted = [...this.lobbyOpponents].sort((a, b) => {
        if (a.isAlive && !b.isAlive) return -1;
        if (!a.isAlive && b.isAlive) return 1;
        return b.hp - a.hp;
      });
      rank = Math.max(1, sorted.findIndex(o => o.isPlayer || o.id === "player") + 1);
    }

    const modal = document.createElement("div");
    modal.className = "info-modal";
    modal.innerHTML = `
      <div class="modal-content">
        <h2>💀 패배 (Game Over - ${rank}등)</h2>
        <p>체력이 모두 소진되었습니다.<br>최종 순위: <strong>${rank}등</strong> (도달 라운드: <strong>${ROUNDS[this.roundIdx]?.stage || '최종'}</strong>)</p>
        <button class="btn-action" onclick="location.reload()">다시 도전하기</button>
      </div>
    `;
    this.dom.modalContainer.appendChild(modal);
  }

  showVictoryModal(rank = 1) {
    const modal = document.createElement("div");
    modal.className = "info-modal";
    if (rank === 1) {
      modal.innerHTML = `
        <div class="modal-content">
          <h2>🏆 최종 우승 (1등 달성!)</h2>
          <p>TFT 시즌 4: 운명의 모든 라운드를 클리어하고 최종 <strong>1등</strong>으로 챔피언이 되었습니다!<br>완성 덱의 위력이 대단했습니다.</p>
          <button class="btn-action" onclick="location.reload()">새로운 덱으로 시작하기</button>
        </div>
      `;
    } else {
      modal.innerHTML = `
        <div class="modal-content">
          <h2>🎖️ 경기 종료 (최종 ${rank}등)</h2>
          <p>TFT 시즌 4: 운명의 모든 라운드를 완주했습니다!<br>최종 순위 <strong>${rank}등</strong>으로 경기를 마쳤습니다.</p>
          <button class="btn-action" onclick="location.reload()">다시 도전하기</button>
        </div>
      `;
    }
    this.dom.modalContainer.appendChild(modal);
  }

  // 스테이지 스킵 (전투 애니메이션 없이 결과만 즉시 계산하여 다음 라운드로 진행)
  skipCombat() {
    if (this.roundIdx >= ROUNDS.length || this.player.hp <= 0) return;

    // 만약 정찰 중이었다면 즉시 내 결투장으로 복귀
    if (this.scoutedPlayerId && this.scoutedPlayerId !== "player") {
      this.scoutedPlayerId = null;
      this.renderUnits();
      this.updateSynergies();
      this.updateScoreboardUI();
      this.updateScoutBanner();
    }

    // 만약 준비 단계라면 전투 시작 조건을 확인하고 배틀 인스턴스 초기화
    if (this.phase === "planning") {
      let playerUnits = this.getBoardUnits("player");
      if (playerUnits.length < this.player.level) {
        const deployed = this.autoDeployFromBench();
        if (deployed > 0) {
          playerUnits = this.getBoardUnits("player");
        }
      }

      if (playerUnits.length > this.player.level) {
        this.showToastNotification(`배치 인원 초과! 현재 레벨에서는 ${this.player.level}명까지만 출전할 수 있습니다.`);
        return;
      }

      this.clearSelection();
      this.hoveredUnit = null;
      this.updateSellZoneUI();
      this.phase = "combat";
      this.setCombatButtonState(true);
      this.updateHUD();

      // 적 기물 스폰 & 배틀 인스턴스 생성
      this.spawnEnemyUnits(ROUNDS[this.roundIdx]);
      this.initBattleInstance();
    }

    if (this.phase !== "combat" || !this.battle) return;

    // 진행 중인 tick 인터벌 중지
    if (this.combatInterval) {
      clearInterval(this.combatInterval);
      this.combatInterval = null;
    }

    const battle = this.battle;
    battle.isHeadless = true;

    // 효과음 일시 차단
    const origMuted = sound.muted;
    sound.muted = true;

    // 최대 450틱(45초) 동안 승패가 결정될 때까지 즉시 루프 실행
    let safetyCounter = 0;
    while (this.phase === "combat" && this.battle && safetyCounter < 450) {
      safetyCounter++;
      this.combatTick();
    }

    sound.muted = origMuted;

    // 시간 초과 등으로 여전히 전투 중이면 무승부/패배 강제 처리
    if (this.phase === "combat") {
      this.endCombat(false);
    }
  }

  // 게임 초기화 (1-1 처음 상태로 리셋, 기물 0개 완전 빈 보드로 초기화)
  resetGame() {
    this.synergyPage = 0;

    if (this.combatInterval) {
      clearInterval(this.combatInterval);
      this.combatInterval = null;
    }
    this.battle = null;
    this.dom.boardGrid.classList.remove("in-combat");

    // 보드 및 벤치 내의 모든 기존 DOM 토큰 및 레이어 완전 제거
    this.dom.boardGrid.querySelectorAll(".unit-token, .combat-token, #combat-layer, .combat-layer, .damage-popup, .skill-effect-burst").forEach(el => el.remove());
    this.dom.benchContainer.querySelectorAll(".unit-token").forEach(el => el.remove());

    // 모달창 닫기
    this.dom.modalContainer.innerHTML = "";

    // 플레이어 기본 정보 리셋
    this.player = {
      hp: 100,
      gold: 10,
      level: 2,
      exp: 0,
      maxExp: LEVEL_EXP[2],
      chosenChamp: null,
      winStreak: 0,
      lossStreak: 0,
      fortuneStreak: 0,
      warlordWins: 0
    };

    this.roundIdx = 0;
    this.phase = "planning";
    this.shopLocked = false;
    this.dom.lockBtn.textContent = "🔓";
    this.dom.lockBtn.classList.remove("active");

    // 보드 및 벤치 데이터 완전 비우기 (기물 0개 완전 빈 상태)
    this.board = Array(6).fill(null).map(() => Array(7).fill(null));
    this.bench = Array(9).fill(null);

    this.draggedUnit = null;
    this.dragSource = null;
    this.hoveredUnit = null;
    this.clearSelection();

    // 적 스카우팅 및 상점 리롤
    this.scoutedPlayerId = null;
    this.initLobbyOpponents();
    this.previewEnemyUnits(ROUNDS[this.roundIdx]);
    this.refreshShop(true);
    this.updateHUD();
    this.updateSynergies();
    this.updateScoreboardUI();
    this.updateScoutBanner();
    this.renderUnits();
    this.updateSellZoneUI();

    this.setCombatButtonState(false);

    sound.playCombine(1);
    this.showToastNotification("🔄 기물이 모두 비워지고 처음 상태로 초기화되었습니다! (기물 0개, 10G)", "info");
  }
}

// 게임 인스턴스 시작 (DOM 요소가 이미 로드된 상태이므로 즉시 안전 시작)
function bootGame() {
  if (!window.tftGame) {
    try {
      window.tftGame = new TFTGame();
      window.tftData = { CHAMPIONS, ROUNDS, TRAITS };
    } catch (e) {
      console.error("TFTGame Boot Error:", e);
      window.__bootError = e.stack || e.message;
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootGame);
} else {
  bootGame();
}
bootGame();
