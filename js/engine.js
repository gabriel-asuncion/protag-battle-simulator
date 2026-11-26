// =========================================================================
// BATTLE STATE, POSITIONING, 3-PHASE ACTION LOOP & COMBAT ENGINE
// =========================================================================
const state = {
  page: 'lobby', // 'lobby' | 'draft' | 'battle'
  draftTargetSide: 'player',
  draftNextSlot: 0,
  mode: '4v4',
  dummyCount: 4,
  playerSelection: ['bram_ironclad', 'vespera_nightstep', 'mirella_hexthread', 'talia_dewsong'],
  enemySelection: ['kaelen_ashblade', 'sylas_sunweaver', 'orin_pyrecaster', 'lyra_windpiercer'],
  selectedUnitId: null,
  speed: 1,
  paused: false,
  autoUb: true,
  ubPauseRemaining: 0,
};

let battle = {
  running: false,
  ended: false,
  timeRemaining: BATTLE_DURATION_SEC,
  units: [],
  popups: [],
  fxList: [],
  logs: [],
  hitstopTimer: 0,
  cutscene: null,
};

function createCombatUnit(templateId, side, slotIndex, customZoneOverride = null) {
  const tpl = getTemplateById(templateId);
  const zoneObj = POSITION_ZONES.find((z) => z.id === (customZoneOverride || tpl.positionZone)) || POSITION_ZONES[3];

  const unit = {
    uid: `${side}_${slotIndex}_${templateId}_${Math.random().toString(36).slice(2, 6)}`,
    templateId: tpl.id,
    name: tpl.name,
    title: tpl.title,
    side,
    slotIndex,
    positionZone: zoneObj.id,
    zoneIndex: zoneObj.index,
    alive: true,

    maxHp: tpl.stats.maxHp,
    hp: tpl.stats.maxHp,
    shield: 0,
    patk: tpl.stats.patk,
    matk: tpl.stats.matk,
    pdef: tpl.stats.pdef,
    mdef: tpl.stats.mdef,
    actionSpeed: tpl.stats.actionSpeed,
    critRate: tpl.stats.critRate,
    critMult: tpl.stats.critMult,
    tpGainRate: tpl.stats.tpGainRate,
    damageType: tpl.damageType,

    tp: 0,
    openingLoop: [...tpl.openingLoop],
    mainLoop: [...tpl.mainLoop],
    inOpening: tpl.openingLoop.length > 0,
    loopIndex: 0,
    actionGauge: 0,
    atkStacks: 0,

    actionPhase: 'IDLE',
    phaseTimer: 0,
    phaseDuration: 0,
    queuedAction: null,
    speechBubble: null,
    ccInterruptCount: 0,

    ub: tpl.ub,
    autoSkills: tpl.autoSkills,
    passives: tpl.passives,
    auraTimer: 0,

    buffs: [],
    debuffs: [],

    visualX: side === 'player' ? 20 : 80,
    targetVisualX: side === 'player' ? 20 : 80,
    lungeOffset: 0,
    knockbackOffset: 0,
    animState: 'idle',
    animTimer: 0,

    statsTracked: {
      damageDealt: 0,
      damageTaken: 0,
      healingDone: 0,
      shieldGranted: 0,
      tpGained: 0,
    },
  };

  for (const p of unit.passives) {
    if (p.type === 'battle_start') {
      if (unit.templateId === 'bram_ironclad') {
        unit.buffs.push({ type: 'defUp', val: 0.25, remaining: 999 });
        gainTp(unit, 140, 'Bastion Stance');
      } else if (unit.templateId === 'kaelen_ashblade') {
        unit.buffs.push({ type: 'atkUp', val: 0.18, remaining: 999 });
        unit.critRate += 0.12;
      } else if (unit.templateId === 'vespera_nightstep') {
        unit.buffs.push({ type: 'haste', val: 0.14, remaining: 999 });
        unit.critRate += 0.10;
      } else if (unit.templateId === 'sylas_sunweaver') {
        unit.buffs.push({ type: 'matkUp', val: 0.15, remaining: 999 });
        gainTp(unit, 180, 'Aether Conduit');
      } else if (unit.templateId === 'mirella_hexthread') {
        unit.buffs.push({ type: 'haste', val: 0.12, remaining: 999 });
        gainTp(unit, 120, 'Temporal Resonance');
      } else if (unit.templateId === 'orin_pyrecaster') {
        unit.buffs.push({ type: 'matkUp', val: 0.20, remaining: 999 });
        unit.critMult += 0.15;
      } else if (unit.templateId === 'lyra_windpiercer') {
        unit.buffs.push({ type: 'patkUp', val: 0.15, remaining: 999 });
        unit.critRate += 0.12;
      } else if (unit.templateId === 'talia_dewsong') {
        unit.buffs.push({ type: 'healUp', val: 0.22, remaining: 999 });
        gainTp(unit, 150, false);
      } else if (unit.templateId === 'garrick_stoneguard') {
        unit.buffs.push({ type: 'defUp', val: 0.28, remaining: 999 });
        gainTp(unit, 130, false);
      } else if (unit.templateId === 'seraphina_dawnblade') {
        unit.buffs.push({ type: 'patkUp', val: 0.16, remaining: 999 });
        unit.critRate += 0.10;
      } else if (unit.templateId === 'zephyr_shadowstep') {
        unit.buffs.push({ type: 'haste', val: 0.16, remaining: 999 });
        unit.critRate += 0.12;
      } else if (unit.templateId === 'aurelia_starcaller') {
        unit.buffs.push({ type: 'matkUp', val: 0.16, remaining: 999 });
        gainTp(unit, 160, false);
      } else if (unit.templateId === 'corvus_voidweaver') {
        unit.buffs.push({ type: 'haste', val: 0.14, remaining: 999 });
        gainTp(unit, 130, false);
      } else if (unit.templateId === 'ignis_emberheart') {
        unit.buffs.push({ type: 'matkUp', val: 0.22, remaining: 999 });
        unit.critMult += 0.15;
      } else if (unit.templateId === 'sylvia_frostbow') {
        unit.buffs.push({ type: 'patkUp', val: 0.16, remaining: 999 });
        unit.critRate += 0.14;
      } else if (unit.templateId === 'elara_moonbloom') {
        unit.buffs.push({ type: 'healUp', val: 0.24, remaining: 999 });
        gainTp(unit, 160, false);
      }
    }
  }

  return unit;
}

function navigateToPage(pageName) {
  state.page = pageName;
  if (pageName === 'battle') {
    state.paused = false;
    state.ubPauseRemaining = 0;
    initBattle({ autoStart: true });
  } else {
    state.ubPauseRemaining = 0;
    battle.running = false;
    battle.ended = false;
    initBattle({ autoStart: false });
  }
  renderAllUI();
}

function initBattle(opts = {}) {
  const autoStart = opts.autoStart ?? state.page === 'battle';
  const units = [];
  const sortedPlayer = [...state.playerSelection].sort((a, b) => {
    const za = POSITION_ZONES.find((p) => p.id === getTemplateById(a).positionZone)?.rangeCenter ?? 465;
    const zb = POSITION_ZONES.find((p) => p.id === getTemplateById(b).positionZone)?.rangeCenter ?? 465;
    return zb - za; // Left = furthest back, Right = closest to center
  });
  state.playerSelection = sortedPlayer;
  sortedPlayer.forEach((tplId, idx) => {
    units.push(createCombatUnit(tplId, 'player', idx));
  });

  if (state.mode === 'dummy') {
    const dummyZones = ['vanguard', 'frontline', 'center', 'backline'];
    for (let i = 0; i < state.dummyCount; i++) {
      const zOverride = state.dummyCount === 1 ? 'vanguard' : dummyZones[i % dummyZones.length];
      units.push(createCombatUnit('training_dummy', 'enemy', i, zOverride));
    }
  } else {
    const sortedEnemy = [...state.enemySelection].sort((a, b) => {
      const za = POSITION_ZONES.find((p) => p.id === getTemplateById(a).positionZone)?.rangeCenter ?? 465;
      const zb = POSITION_ZONES.find((p) => p.id === getTemplateById(b).positionZone)?.rangeCenter ?? 465;
      return za - zb;
    });
    state.enemySelection = sortedEnemy;
    sortedEnemy.forEach((tplId, idx) => {
      units.push(createCombatUnit(tplId, 'enemy', idx));
    });
  }

  // Start units off-screen so they charge into the middle clash on battle start
  if (autoStart) {
    for (const u of units) {
      const rc = getUnitRangeCenter(u);
      u.posX = u.side === 'player' ? -rc - 650 : rc + 650;
      u.visualX = u.side === 'player' ? -8 : 108;
      u.animState = 'walk';
    }
  }

  state.ubPauseRemaining = 0;
  state.paused = false;
  const pauseBtn = document.getElementById('pause-toggle-btn');
  if (pauseBtn) pauseBtn.textContent = 'Pause';

  battle = {
    running: autoStart,
    ended: false,
    timeRemaining: BATTLE_DURATION_SEC,
    units,
    popups: [],
    fxList: [],
    logs: [],
    hitstopTimer: 0,
    entranceTimer: autoStart ? 1.15 : 0,
    cutscene: null,
  };

  if (!state.selectedUnitId || !units.some((u) => u.uid === state.selectedUnitId)) {
    state.selectedUnitId = units[0]?.uid || null;
  }

  document.getElementById('battle-result-overlay')?.classList.add('hidden');
  const cutinEl = document.getElementById('ub-cutin-container');
  if (cutinEl) {
    cutinEl.innerHTML = '';
    cutinEl.classList.add('hidden');
  }
  if (autoStart) {
    setBattleStatus('LIVE COMBAT', 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30');
    addLog('system', `Battle started (${state.mode === '4v4' ? '4 vs 4' : `4 vs ${state.dummyCount} Training Dummy`}).`);
  } else {
    setBattleStatus(state.page === 'draft' ? 'DRAFTING' : 'LOBBY', 'bg-amber-500/20 text-amber-300 border-amber-400/40');
    updateFrontShiftAndVisualPositions(1, false);
  }
  renderAllUI();
}

function getLivingUnits(side = null) {
  return battle.units.filter((u) => u.alive && (!side || u.side === side));
}

function getActiveCcLabel(unit) {
  if (!unit || !unit.alive) return null;
  if (unit.debuffs.some((d) => d.type === 'stun')) return 'STUN';
  if (unit.debuffs.some((d) => d.type === 'knockback')) return 'KNOCKBACK';
  if (unit.debuffs.some((d) => d.type === 'silence')) return 'SILENCE';
  return null;
}

function isUnitIncapacitated(unit) {
  return unit.debuffs.some((d) => d.type === 'stun' || d.type === 'knockback');
}

function isUnitSilenced(unit) {
  return unit.debuffs.some((d) => d.type === 'silence');
}

function interruptActiveWindupIfAny(unit, ccReason) {
  if (!unit || !unit.alive) return;
  if (unit.actionPhase === 'WINDUP' && unit.queuedAction) {
    const cancelledName = unit.queuedAction.label;
    unit.queuedAction = null;
    unit.speechBubble = null;
    unit.actionPhase = 'IDLE';
    unit.phaseTimer = 0;
    unit.phaseDuration = 0;
    unit.actionGauge = 0;
    unit.ccInterruptCount = (unit.ccInterruptCount || 0) + 1;
    if (unit.animState === 'windup') {
      unit.animState = 'idle';
      unit.animTimer = 0;
    }
    spawnPopup(unit, 'INTERRUPTED!', 'text-rose-300 font-extrabold text-xs', -20);
    addLog('cc', `⚡ ${unit.name}'s ${cancelledName} windup was CANCELLED by ${ccReason}! Returns to IDLE.`);
  }
}

function getEffectiveStats(unit) {
  let patkMult = 1;
  let matkMult = 1;
  let pdefMult = 1;
  let mdefMult = 1;
  let hasteMult = 1;
  let healMult = 1;
  let bonusCrit = 0;

  for (const b of unit.buffs) {
    if (b.type === 'patkUp') patkMult += b.val;
    if (b.type === 'atkUp') {
      patkMult += b.val;
      matkMult += b.val;
    }
    if (b.type === 'matkUp') matkMult += b.val;
    if (b.type === 'defUp') {
      pdefMult += b.val;
      mdefMult += b.val;
    }
    if (b.type === 'haste') hasteMult += b.val;
    if (b.type === 'healUp') healMult += b.val;
    if (b.type === 'critUp') bonusCrit += b.val;
  }

  for (const d of unit.debuffs) {
    if (d.type === 'defDown') pdefMult = Math.max(0.25, pdefMult - d.val);
    if (d.type === 'mdefDown') mdefMult = Math.max(0.25, mdefMult - d.val);
    if (d.type === 'slow') hasteMult = Math.max(0.35, hasteMult - d.val);
  }

  return {
    patk: unit.patk * patkMult,
    matk: unit.matk * matkMult,
    pdef: unit.pdef * pdefMult,
    mdef: unit.mdef * mdefMult,
    hasteMult,
    healMult,
    critRate: Math.min(0.95, unit.critRate + bonusCrit),
  };
}

function getEngagementPosition(unit) {
  const allies = getLivingUnits(unit.side);
  const enemies = getLivingUnits(unit.side === 'player' ? 'enemy' : 'player');
  if (!enemies.length) return unit.zoneIndex;

  const minEnemyZone = Math.min(...enemies.map((e) => e.zoneIndex));
  const desiredZone = unit.zoneIndex;
  const frontmostAlliedZone = Math.min(...allies.map((a) => a.zoneIndex));
  const stepForward = Math.max(0, frontmostAlliedZone - 1);

  const effectiveZone = Math.min(desiredZone, Math.max(minEnemyZone, desiredZone - stepForward * 0.45));
  return Math.max(0, Math.min(6, effectiveZone));
}

function getUnitRangeCenter(unit) {
  const z = POSITION_ZONES.find((p) => p.id === unit.positionZone);
  return z ? z.rangeCenter : 465;
}

function getUnitAttackRange(unit) {
  // Position value (rangeCenter) directly determines the unit's attack range
  return Math.max(220, getUnitRangeCenter(unit) + 140);
}

function isTargetInRange(unit) {
  const enemies = getLivingUnits(unit.side === 'player' ? 'enemy' : 'player');
  if (!enemies.length) return true;
  const nearestDist = Math.min(...enemies.map((e) => Math.abs((e.posX ?? 0) - (unit.posX ?? 0))));
  return nearestDist <= getUnitAttackRange(unit);
}

function updateFrontShiftAndVisualPositions(dt, isEntrance = false) {
  // World coordinate system: 0 = center red line (50% screen X), -1000 = 10% left, +1000 = 90% right.
  for (const u of battle.units) {
    const rc = getUnitRangeCenter(u);
    if (typeof u.posX !== 'number') {
      u.posX = u.side === 'player' ? -rc : rc;
      u.visualX = 50 + (u.posX / 1000) * 40;
    }
    if (!u.alive) continue;

    let isMoving = false;
    if (isEntrance) {
      const homeX = u.side === 'player' ? -rc : rc;
      const diff = homeX - u.posX;
      const step = Math.sign(diff) * Math.min(Math.abs(diff), 680 * dt);
      u.posX += step;
      isMoving = Math.abs(homeX - u.posX) > 6;
      u.targetVisualX = 50 + (u.posX / 1000) * 40;
      u.visualX += (u.targetVisualX - u.visualX) * Math.min(1, dt * 9);
      u.animState = isMoving ? 'walk' : 'idle';
      continue;
    }

    const enemies = getLivingUnits(u.side === 'player' ? 'enemy' : 'player');
    if (battle.running && enemies.length > 0 && u.actionPhase === 'IDLE' && !isUnitIncapacitated(u)) {
      const nearestEnemy = [...enemies].sort(
        (a, b) => Math.abs((a.posX ?? 0) - u.posX) - Math.abs((b.posX ?? 0) - u.posX)
      )[0];
      const dist = Math.abs((nearestEnemy.posX ?? 0) - u.posX);
      const atkRange = getUnitAttackRange(u);
      if (dist > atkRange) {
        const dir = u.side === 'player' ? 1 : -1;
        const moveSpeed = 240 * u.actionSpeed;
        u.posX += dir * Math.min(dist - atkRange + 4, moveSpeed * dt);
        u.posX = Math.max(-920, Math.min(920, u.posX));
        isMoving = true;
      }
    }

    u.targetVisualX = Math.max(10, Math.min(90, 50 + (u.posX / 1000) * 40));
    const dx = u.targetVisualX - u.visualX;
    if (Math.abs(dx) > 0.25 && battle.running) isMoving = true;
    u.visualX += dx * Math.min(1, dt * 8);
    u.lungeOffset *= Math.pow(0.04, dt);
    u.knockbackOffset *= Math.pow(0.05, dt);

    if (u.speechBubble) {
      u.speechBubble.ttl -= dt;
      if (u.speechBubble.ttl <= 0) {
        u.speechBubble = null;
      }
    }

    if (u.animState !== 'idle' && u.animState !== 'victory' && u.actionPhase !== 'WINDUP') {
      u.animTimer -= dt;
      if (u.animTimer <= 0) {
        u.animState = isMoving ? 'walk' : 'idle';
      }
    } else if (u.animState === 'idle' && isMoving) {
      u.animState = 'walk';
    } else if (u.animState === 'walk' && !isMoving) {
      u.animState = 'idle';
    }
  }
}

function selectTargets(attacker, rule, count = 1) {
  const enemies = getLivingUnits(attacker.side === 'player' ? 'enemy' : 'player');
  if (!enemies.length) return [];

  const taunters = enemies.filter((e) => e.buffs.some((b) => b.type === 'taunt'));
  const byFront = [...enemies].sort((a, b) => a.zoneIndex - b.zoneIndex || a.slotIndex - b.slotIndex);

  if (rule === 'nearest') {
    if (taunters.length > 0 && count === 1) {
      return [taunters.sort((a, b) => a.zoneIndex - b.zoneIndex)[0]];
    }
    return byFront.slice(0, count);
  }
  if (rule === 'lowest_hp') {
    return [...enemies].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp).slice(0, count);
  }
  if (rule === 'flank_or_back') {
    const midBack = [...enemies].sort((a, b) => b.zoneIndex - a.zoneIndex);
    return midBack.slice(0, count);
  }
  if (rule === 'all_enemies') {
    return byFront;
  }
  return byFront.slice(0, count);
}

function selectAllies(caster, rule, count = 1) {
  const allies = getLivingUnits(caster.side);
  if (!allies.length) return [];
  if (rule === 'all_allies') return allies;
  if (rule === 'lowest_hp_pct') {
    return [...allies].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp).slice(0, count);
  }
  if (rule === 'highest_dps') {
    return [...allies]
      .sort((a, b) => Math.max(b.patk, b.matk) - Math.max(a.patk, a.matk))
      .slice(0, count);
  }
  if (rule === 'self') return [caster];
  return allies.slice(0, count);
}

function gainTp(unit, rawAmount, showSkillPopup = false) {
  if (!unit || !unit.alive || rawAmount <= 0) return 0;
  const before = unit.tp;
  const gained = Math.round(rawAmount * unit.tpGainRate);
  unit.tp = Math.min(MAX_TP, unit.tp + gained);
  const actual = unit.tp - before;
  if (actual > 0) {
    unit.statsTracked.tpGained += actual;
    // Only show TP gain popup for dedicated TP-granting skills/passives
    if (showSkillPopup === true) {
      spawnPopup(
        unit,
        `+${actual} TP`,
        'pcrd-num-tp font-mono-num text-base sm:text-lg',
        -46
      );
    }
  }
  return actual;
}

function spawnPopup(unit, text, className = 'text-white font-bold text-xs', offsetY = 0) {
  const safeX = Number.isFinite(unit?.visualX) ? Math.max(12, Math.min(88, unit.visualX)) : 50;
  const yStagger = ((unit?.slotIndex ?? 1.5) - 1.5) * 18;
  battle.popups.push({
    id: Math.random().toString(36).slice(2, 8),
    text,
    className,
    xPct: safeX,
    baseTopPct: 56 + yStagger * 0.32,
    offsetY: offsetY + (Math.random() * 10 - 5),
    age: 0,
    duration: 1.35,
  });
}

function resolveActionFxKey(unit, kind, isUb = false) {
  const prefixMap = {
    bram_ironclad: 'bram',
    kaelen_ashblade: 'kaelen',
    vespera_nightstep: 'vespera',
    sylas_sunweaver: 'sylas',
    mirella_hexthread: 'mirella',
    orin_pyrecaster: 'orin',
    lyra_windpiercer: 'lyra',
    talia_dewsong: 'talia',
    garrick_stoneguard: 'bram',
    seraphina_dawnblade: 'kaelen',
    zephyr_shadowstep: 'vespera',
    aurelia_starcaller: 'sylas',
    corvus_voidweaver: 'mirella',
    ignis_emberheart: 'orin',
    sylvia_frostbow: 'lyra',
    elara_moonbloom: 'talia',
    training_dummy: 'dummy',
  };
  const p = prefixMap[unit?.templateId] || 'bram';
  if (isUb) return `${p}_ub`;
  if (kind === 'slash') return `${p}_slash`;
  if (kind === 'beam') return `${p}_burn`;
  if (kind === 'aoe') return `${p}_shield`;
  return `${p}_orb`;
}

function spawnFx(kind, fromUnit, toUnit = null, color = '#38bdf8', fxKeyOverride = null) {
  const fxX = toUnit ? toUnit.visualX : fromUnit ? fromUnit.visualX : 50;
  const fxKey = fxKeyOverride || resolveActionFxKey(fromUnit, kind, false);
  battle.fxList.push({
    id: Math.random().toString(36).slice(2, 8),
    kind,
    fxKey,
    fromX: fromUnit ? fromUnit.visualX : 50,
    toX: fxX,
    side: fromUnit ? fromUnit.side : 'player',
    color,
    age: 0,
    duration: kind === 'beam' || kind === 'aoe' ? 0.52 : 0.42,
  });
}

function setUnitAnim(unit, stateName, duration = 0.35) {
  unit.animState = stateName;
  unit.animTimer = duration;
}

function applyCcDebuff(target, ccType, durationSec, sourceName) {
  if (!target || !target.alive) return;
  target.debuffs.push({ type: ccType, val: 1, remaining: durationSec });
  const labelMap = { stun: 'STUN', knockback: 'KNOCKBACK', silence: 'SILENCE' };
  const label = labelMap[ccType] || ccType.toUpperCase();
  spawnPopup(target, `${label}!`, 'text-fuchsia-300 font-extrabold text-xs', -12);
  interruptActiveWindupIfAny(target, `${sourceName} (${label})`);
}

function showUbCutscene(caster, affectedUnits = []) {
  const container = document.getElementById('ub-cutin-container');
  if (!container) return;

  const kind = caster.ub.cutsceneKind || 'single_strike';
  const isSupport = kind === 'ally_support';
  const durSec = Math.max(1.25, (caster.ub.windupSec || 0.48) * PACE_CONFIG.phaseDurationMultiplier + 0.55);

  battle.cutscene = { remaining: durSec, casterUid: caster.uid };
  // Pause other combatants while the Union Burst cutscene & impact play out
  state.ubPauseRemaining = Math.max(state.ubPauseRemaining, durSec * 0.85);

  const effectSummary = isSupport
    ? 'ALLIED BUFF / HEAL BURST'
    : kind === 'aoe_offense'
    ? 'AREA BURST STRIKE'
    : 'HIGH-IMPACT STRIKE';

  const isPlayer = caster.side === 'player';
  const modelDirClass = isPlayer ? 'from-left' : 'from-right';
  const titleDirClass = isPlayer ? 'from-right' : 'from-left';

  container.classList.remove('hidden');
  container.innerHTML = `
    <div class="ub-manga-dim relative w-full h-full flex items-center justify-center overflow-hidden">
      <div class="ub-manga-band ${isSupport ? 'is-support' : ''} relative w-full h-44 sm:h-56 flex items-center justify-center px-6 sm:px-16 overflow-hidden" data-cutscene-dur="${durSec.toFixed(2)}s">
        <div class="relative z-10 max-w-5xl w-full flex ${isPlayer ? 'flex-row' : 'flex-row-reverse'} items-center justify-between gap-4 sm:gap-10">
          <div class="ub-manga-model ${modelDirClass} chibi-closeup-sprite shrink-0 drop-shadow-[0_12px_18px_rgba(0,0,0,0.65)]" data-cutscene-dur="${durSec.toFixed(2)}s">
            ${renderCharacterSpriteSVG(caster, false)}
          </div>
          <div class="ub-manga-title-wrap ${titleDirClass} flex-1 ${isPlayer ? 'text-right' : 'text-left'}" data-cutscene-dur="${durSec.toFixed(2)}s">
            <div class="inline-block px-3 py-0.5 bg-zinc-950 text-amber-300 text-[10px] sm:text-xs font-black uppercase tracking-widest border-2 border-white shadow-md mb-1.5">
              UNION BURST • ${effectSummary}
            </div>
            <div class="ub-manga-title font-display text-3xl sm:text-6xl font-black tracking-tight uppercase leading-none">
              ${caster.ub.name}
            </div>
            <div class="inline-block mt-2 px-3 py-0.5 bg-white/95 text-zinc-950 border-2 border-zinc-950 text-xs sm:text-sm font-extrabold italic shadow">
              "${caster.ub.callout || caster.ub.name}"
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-cutscene-dur]').forEach((el) => {
    el.style.setProperty('--cutscene-dur', el.getAttribute('data-cutscene-dur') || '1.45s');
  });

  setTimeout(() => {
    if (!battle.cutscene || battle.cutscene.remaining <= 0.05) {
      const cutinEl = document.getElementById('ub-cutin-container');
      if (cutinEl) {
        cutinEl.innerHTML = '';
        cutinEl.classList.add('hidden');
      }
    }
  }, Math.round(durSec * 1000) + 60);
}

function dealDamage(attacker, defender, rawMultiplier, damageType, options = {}) {
  if (!defender || !defender.alive) return 0;

  const atkEff = getEffectiveStats(attacker);
  const defEff = getEffectiveStats(defender);

  const currentAtk = damageType === 'physical' ? atkEff.patk : atkEff.matk;
  const effectiveDef = Math.max(0, damageType === 'physical' ? defEff.pdef : defEff.mdef);

  // Base Damage = (Skill Multiplier * Current ATK) + (Skill Coefficient * (Skill Level + 1)) + Conditional Bonus
  const skillCoeff = options.skillCoeff || 0;
  const skillLevel = options.skillLevel || 1;
  const conditionalBonus = options.conditionalBonus || 0;
  const baseDamage = rawMultiplier * currentAtk + skillCoeff * (skillLevel + 1) + conditionalBonus;

  const critChance = Math.min(0.95, atkEff.critRate + (options.bonusCrit || 0));
  const isCrit = Math.random() < critChance;
  const critMultiplier = isCrit ? attacker.critMult : 1;
  const damageDealtMultiplier = 1 + (options.damageDealtBonus || 0);

  // Master Formula: floor((Base Damage * Crit Multiplier * Damage Dealt Multiplier) / (1 + max(0, Effective Defense) / 100)) - Damage Barriers
  const mitigatedDmg = Math.max(
    1,
    Math.floor((baseDamage * critMultiplier * damageDealtMultiplier) / (1 + effectiveDef / 100))
  );

  let absorbed = 0;
  if (defender.shield > 0) {
    absorbed = Math.min(defender.shield, mitigatedDmg);
    defender.shield -= absorbed;
  }

  const finalDmg = Math.max(0, mitigatedDmg - absorbed);
  const dmg = finalDmg;

  defender.hp = Math.max(0, defender.hp - finalDmg);
  attacker.statsTracked.damageDealt += finalDmg;
  defender.statsTracked.damageTaken += mitigatedDmg;

  if (options.knockbackPx) {
    const dir = attacker.side === 'player' ? 1 : -1;
    defender.knockbackOffset += dir * options.knockbackPx;
    setUnitAnim(defender, 'knockback', 0.35);
    interruptActiveWindupIfAny(defender, `${attacker.name} (Knockback)`);
  } else {
    setUnitAnim(defender, 'hit', 0.26);
  }

  if (options.ccType) {
    applyCcDebuff(defender, options.ccType, options.ccDuration || 1.2, attacker.name);
  }

  if (isCrit) {
    spawnPopup(defender, 'CRITICAL', 'pcrd-num-crit-label text-sm sm:text-base', -36);
    spawnPopup(defender, `${dmg}`, 'pcrd-num-crit-val font-mono-num text-3xl sm:text-4xl', -8);
  } else if (damageType === 'magical') {
    spawnPopup(defender, `${dmg}`, 'pcrd-num-magic font-mono-num text-2xl sm:text-3xl', -10);
  } else {
    spawnPopup(defender, `${dmg}`, 'pcrd-num-phys font-mono-num text-2xl sm:text-3xl', -10);
  }

  if (options.baseHitTp) {
    gainTp(attacker, options.baseHitTp, false);
  }

  const takenTp = Math.min(
    TP_GAIN.damageTakenCap,
    Math.round(dmg * TP_GAIN.damageTakenScale)
  );
  if (takenTp > 0 && defender.hp > 0) {
    gainTp(defender, takenTp, false);
  }

  if (defender.hp <= 0 && defender.alive) {
    defender.alive = false;
    defender.actionPhase = 'IDLE';
    defender.queuedAction = null;
    defender.speechBubble = null;
    defender.phaseTimer = 0;
    defender.actionGauge = 0;
    spawnPopup(defender, 'KO!', 'text-red-500 font-extrabold text-sm', -18);
    addLog('ko', `💀 ${defender.name} (${defender.side.toUpperCase()}) was defeated!`);
    gainTp(attacker, TP_GAIN.killBonus);
  }

  return dmg;
}

function healUnit(healer, target, rawHealAmount, label = 'Heal') {
  if (!target || !target.alive) return 0;
  const eff = getEffectiveStats(healer);
  const amount = Math.max(15, Math.round(rawHealAmount * eff.healMult));
  const before = target.hp;
  target.hp = Math.min(target.maxHp, target.hp + amount);
  const actualHeal = target.hp - before;
  healer.statsTracked.healingDone += actualHeal;
  spawnPopup(target, `+${actualHeal}`, 'pcrd-num-heal font-mono-num text-2xl sm:text-3xl', -18);
  if (label) {
    addLog('heal', `💚 ${healer.name} healed ${target.name} for ${actualHeal} HP (${label}).`);
  }
  return actualHeal;
}

function grantShield(caster, target, amount) {
  if (!target || !target.alive) return;
  const eff = getEffectiveStats(caster);
  const finalShield = Math.max(20, Math.round(amount * eff.healMult));
  target.shield += finalShield;
  caster.statsTracked.shieldGranted += finalShield;
  spawnPopup(target, `+${finalShield}`, 'pcrd-num-shield font-mono-num text-xl sm:text-2xl', -26);
}

function triggerUnionBurst(unit) {
  if (!battle.running || battle.ended || !unit || !unit.alive) return;
  if (unit.tp < MAX_TP) return;
  if (unit.actionPhase === 'WINDUP' && unit.queuedAction?.kind === 'ub') return;

  if (isUnitIncapacitated(unit) || isUnitSilenced(unit)) {
    spawnPopup(unit, isUnitSilenced(unit) ? 'SILENCED!' : 'CC LOCKED!', 'text-rose-300 font-bold text-xs');
    return;
  }

  unit.tp = 0;
  const ubWindup = Math.max(PACE_CONFIG.minWindupSec, (unit.ub.windupSec ?? 0.48) * PACE_CONFIG.phaseDurationMultiplier);
  const ubFollow = Math.max(PACE_CONFIG.minFollowThroughSec, (unit.ub.followThroughSec ?? 0.48) * PACE_CONFIG.phaseDurationMultiplier);

  const previewTargets =
    unit.ub.cutsceneKind === 'ally_support'
      ? selectAllies(unit, 'all_allies')
      : unit.ub.cutsceneKind === 'aoe_offense'
      ? selectTargets(unit, 'all_enemies')
      : selectTargets(unit, 'nearest', 1);

  unit.queuedAction = {
    kind: 'ub',
    stepKey: 'ub',
    skillDef: unit.ub,
    label: unit.ub.name,
    callout: unit.ub.callout || `${unit.ub.name}!`,
    windupSec: ubWindup,
    followThroughSec: ubFollow,
  };
  unit.actionPhase = 'WINDUP';
  unit.phaseTimer = 0;
  unit.phaseDuration = ubWindup;
  const ubBubbleDur = ubWindup + ubFollow + 0.65;
  unit.speechBubble = {
  text: unit.ub.callout || `★ ${unit.ub.name}!`,
  isUb: true,
  ttl: ubBubbleDur,
  };
  setUnitAnim(unit, 'windup', ubWindup);

  // Emphasize Union Burst by briefly pausing other combatant actions while cutscene/UB plays
  state.ubPauseRemaining = Math.max(state.ubPauseRemaining, 0.85);
  battle.hitstopTimer = 0.08;
  showUbCutscene(unit, previewTargets);
  addLog('ub', `★ ${unit.name} winds up Union Burst: ${unit.ub.name} (${ubWindup.toFixed(2)}s windup; others held for emphasis)!`);
  renderAllUI();
  }

  function stepPredeterminedLoop(unit) {
  if (!unit.alive || !battle.running) return;

  let stepKey = null;
  if (unit.inOpening) {
  stepKey = unit.openingLoop[unit.loopIndex];
  unit.loopIndex++;
  if (unit.loopIndex >= unit.openingLoop.length) {
  unit.inOpening = false;
  unit.loopIndex = 0;
  }
  } else {
  stepKey = unit.mainLoop[unit.loopIndex];
  unit.loopIndex = (unit.loopIndex + 1) % unit.mainLoop.length;
  }

  let resolvedKey = stepKey;
  if (stepKey !== 'auto' && isUnitSilenced(unit)) {
  spawnPopup(unit, 'SILENCED', 'text-fuchsia-300 font-bold text-[11px]', -16);
  addLog('cc', `${unit.name} is Silenced and cannot cast ${stepKey.toUpperCase()} — falling back to Auto.`);
  resolvedKey = 'auto';
  }

  const skillDef = unit.autoSkills[resolvedKey] || unit.autoSkills.auto;
  const baseWindup = skillDef.windupSec ?? (resolvedKey === 'auto' ? 0.24 : 0.38);
  const baseFollow = skillDef.followThroughSec ?? (resolvedKey === 'auto' ? 0.24 : 0.42);
  const windupSec = Math.max(PACE_CONFIG.minWindupSec, baseWindup * PACE_CONFIG.phaseDurationMultiplier);
  const followThroughSec = Math.max(PACE_CONFIG.minFollowThroughSec, baseFollow * PACE_CONFIG.phaseDurationMultiplier);

  unit.queuedAction = {
  kind: 'skill',
  stepKey: resolvedKey,
  skillDef,
  label: skillDef.name,
  callout: skillDef.callout || skillDef.name,
  windupSec,
  followThroughSec,
  };
  unit.actionPhase = 'WINDUP';
  unit.phaseTimer = 0;
  unit.phaseDuration = windupSec;
  const isSkill = resolvedKey !== 'auto';
  const bubbleLinger = isSkill ? windupSec + followThroughSec + 0.85 : windupSec + 0.55;
  unit.speechBubble = {
  text: skillDef.callout || skillDef.name,
  isUb: false,
  ttl: bubbleLinger,
  };
  setUnitAnim(unit, 'windup', windupSec);
  }

  function jumpToNextWindupAction() {
  if (!battle.running || battle.ended) return;
  let guard = 0;
  while (guard < 400 && battle.running && !battle.ended) {
  guard++;
  const hasWindup = battle.units.some((u) => u.alive && u.actionPhase === 'WINDUP');
  if (hasWindup && guard > 1) break;
  updateBattle(0.05);
  if (battle.units.some((u) => u.alive && u.actionPhase === 'WINDUP')) break;
  }
  renderAllUI();
  }

  function stepPrevActionSnapshot() {
  if (battle.ended) return;
  // Step backward smoothly by resetting active windups to early windup or rewinding idle gauges slightly
  let rewoundAny = false;
  for (const u of battle.units) {
  if (!u.alive) continue;
  if (u.actionPhase === 'WINDUP') {
  u.phaseTimer = 0;
  rewoundAny = true;
  } else if (u.actionPhase === 'FOLLOWTHROUGH') {
  u.actionPhase = 'WINDUP';
  u.phaseTimer = 0;
  u.phaseDuration = Math.max(0.3, u.phaseDuration || 0.45);
  rewoundAny = true;
  } else if (u.actionPhase === 'IDLE') {
  u.actionGauge = Math.max(0, u.actionGauge - 28);
  rewoundAny = true;
  }
  }
  if (rewoundAny) {
  addLog('system', '◀ Rewound action progression toward prior windup state.');
  }
  renderAllUI();
  }

function executeActionCode(unit, actionCode, skillLabel, isUb) {
  const dir = unit.side === 'player' ? 1 : -1;
  unit.lungeOffset = dir * (isUb ? 26 : 16);
  setUnitAnim(unit, 'strike', isUb ? 0.45 : 0.32);

  const sk = isUb ? unit.ub : unit.autoSkills[
    Object.keys(unit.autoSkills).find((k) => unit.autoSkills[k].action === actionCode) || 'auto'
  ];

  switch (actionCode) {
    case 'phys_nearest': {
      const [t] = selectTargets(unit, 'nearest', 1);
      if (t) {
        const isRangedAuto = getUnitRangeCenter(unit) >= 400;
        spawnFx(isRangedAuto ? 'orb' : 'slash', unit, t, isRangedAuto ? '#38bdf8' : '#fca5a5');
        const d = dealDamage(unit, t, sk.mult || 1.0, 'physical', {
          baseHitTp: sk.baseHitTp || 92,
          label: skillLabel,
        });
        addLog('action', `${unit.name} used ${skillLabel} on ${t.name} for ${d} DMG.`);
      }
      break;
    }
    case 'phys_lowest_hp': {
      const [t] = selectTargets(unit, 'lowest_hp', 1);
      if (t) {
        spawnFx('slash', unit, t, '#fb923c');
        const d = dealDamage(unit, t, sk.mult || 1.6, 'physical', {
          baseHitTp: sk.baseHitTp || 118,
          label: skillLabel,
        });
        addLog('skill', `${unit.name} cast ${skillLabel} on ${t.name} for ${d} DMG.`);
      }
      break;
    }
    case 'phys_def_shred': {
      const [t] = selectTargets(unit, 'nearest', 1);
      if (t) {
        spawnFx('slash', unit, t, '#f59e0b');
        const d = dealDamage(unit, t, sk.mult || 1.4, 'physical', {
          knockbackPx: sk.knockbackPx || 18,
          baseHitTp: sk.baseHitTp || 115,
          label: skillLabel,
        });
        if (t.alive) {
          t.debuffs.push({ type: 'defDown', val: sk.shredPct || 0.2, remaining: 5 });
        }
        addLog('skill', `${unit.name} used ${skillLabel} on ${t.name} (${d} DMG, DEF shred).`);
      }
      break;
    }
    case 'phys_lifesteal': {
      const [t] = selectTargets(unit, 'nearest', 1);
      if (t) {
        spawnFx('slash', unit, t, '#f87171');
        const d = dealDamage(unit, t, sk.mult || 1.5, 'physical', {
          baseHitTp: sk.baseHitTp || 120,
          label: skillLabel,
        });
        const leech = Math.round(d * (sk.leechPct || 0.35));
        if (leech > 0) healUnit(unit, unit, leech, skillLabel);
        addLog('skill', `${unit.name} drained ${d} DMG with ${skillLabel} (stole ${leech} HP).`);
      }
      break;
    }
    case 'flank_shred_strike': {
      const [t] = selectTargets(unit, 'flank_or_back', 1);
      if (t) {
        spawnFx('slash', unit, t, '#22d3ee');
        const d = dealDamage(unit, t, sk.mult || 1.3, 'physical', {
          baseHitTp: sk.baseHitTp || 112,
          label: skillLabel,
        });
        if (t.alive) {
          t.debuffs.push({ type: 'defDown', val: sk.shredPct || 0.22, remaining: 5 });
        }
        addLog('skill', `${unit.name} flanked ${t.name} with ${skillLabel} (${d} DMG, -DEF).`);
      }
      break;
    }
    case 'buff_self_def_shield': {
      spawnFx('aoe', unit, unit, '#38bdf8');
      unit.buffs.push({ type: 'defUp', val: sk.defPct || 0.35, remaining: 6 });
      grantShield(unit, unit, unit.matk * (sk.shieldMult || 1.3) + 180);
      gainTp(unit, sk.tpBoost || 110, true);
      addLog('skill', `${unit.name} activated ${skillLabel} (+DEF, Shield & TP).`);
      break;
    }
    case 'mag_nearest': {
      const [t] = selectTargets(unit, 'nearest', 1);
      if (t) {
        spawnFx('orb', unit, t, '#38bdf8');
        const d = dealDamage(unit, t, sk.mult || 1.0, 'magical', {
          baseHitTp: sk.baseHitTp || 92,
          label: skillLabel,
        });
        addLog('action', `${unit.name} cast ${skillLabel} on ${t.name} for ${d} MATK DMG.`);
      }
      break;
    }
    case 'heal_lowest_shield': {
      const [ally] = selectAllies(unit, 'lowest_hp_pct', 1);
      if (ally) {
        spawnFx('orb', unit, ally, '#34d399');
        healUnit(unit, ally, unit.matk * (sk.healMult || 1.35), skillLabel);
        grantShield(unit, ally, unit.matk * (sk.shieldMult || 1.15));
        gainTp(ally, sk.tpBoost || 115, true);
      }
      break;
    }
    case 'buff_ally_haste_tp': {
      const [ally] = selectAllies(unit, 'highest_dps', 1);
      if (ally) {
        spawnFx('orb', unit, ally, '#c084fc');
        ally.buffs.push({ type: 'haste', val: sk.hastePct || 0.22, remaining: 5 });
        gainTp(ally, sk.tpGrant || 135, true);
        spawnPopup(ally, 'HASTE!', 'text-purple-300 font-bold text-xs', -8);
        addLog('skill', `${unit.name} cast ${skillLabel} on ${ally.name} (+Haste & +TP).`);
      }
      break;
    }
    case 'mag_slow_enemy': {
      const [t] = selectTargets(unit, 'nearest', 1);
      if (t) {
        spawnFx('orb', unit, t, '#a855f7');
        const d = dealDamage(unit, t, sk.mult || 1.35, 'magical', {
          baseHitTp: sk.baseHitTp || 112,
          label: skillLabel,
        });
        if (t.alive) {
          t.debuffs.push({ type: 'slow', val: sk.slowPct || 0.20, remaining: 4.5 });
        }
        addLog('skill', `${unit.name} cast ${skillLabel} on ${t.name} (${d} DMG, Slowed).`);
      }
      break;
    }
    case 'mag_aoe_burn': {
      const targets = selectTargets(unit, 'nearest', 2);
      targets.forEach((t) => {
        spawnFx('orb', unit, t, '#fb923c');
        const d = dealDamage(unit, t, sk.mult || 1.45, 'magical', {
          baseHitTp: sk.baseHitTp || 114,
          label: skillLabel,
        });
        if (t.alive) {
          t.debuffs.push({
            type: 'burn',
            val: Math.max(25, Math.round(unit.matk * (sk.burnMult || 0.45))),
            remaining: 4.0,
            tickTimer: 1.0,
          });
        }
        addLog('skill', `${unit.name} hit ${t.name} with ${skillLabel} for ${d} DMG + Burn.`);
      });
      break;
    }
    case 'mag_mdef_shred': {
      const [t] = selectTargets(unit, 'lowest_hp', 1);
      if (t) {
        spawnFx('beam', unit, t, '#f97316');
        const d = dealDamage(unit, t, sk.mult || 1.70, 'magical', {
          baseHitTp: sk.baseHitTp || 122,
          label: skillLabel,
        });
        if (t.alive) {
          t.debuffs.push({ type: 'mdefDown', val: sk.shredPct || 0.20, remaining: 5 });
        }
        addLog('skill', `${unit.name} pierced ${t.name} with ${skillLabel} (${d} DMG, -MDEF).`);
      }
      break;
    }
    case 'heal_lowest_tp': {
      const [ally] = selectAllies(unit, 'lowest_hp_pct', 1);
      if (ally) {
        spawnFx('orb', unit, ally, '#2dd4bf');
        healUnit(unit, ally, unit.matk * (sk.healMult || 1.55), skillLabel);
        gainTp(ally, sk.tpGrant || 110, true);
      }
      break;
    }
    case 'shield_lowest_hp': {
      const [ally] = selectAllies(unit, 'lowest_hp_pct', 1);
      if (ally) {
        spawnFx('orb', unit, ally, '#38bdf8');
        grantShield(unit, ally, unit.matk * (sk.shieldMult || 1.40));
        ally.buffs.push({ type: 'defUp', val: sk.defPct || 0.20, remaining: 5 });
        gainTp(ally, sk.tpBoost || 95, true);
        addLog('skill', `${unit.name} protected ${ally.name} with ${skillLabel} (+Shield & +DEF).`);
      }
      break;
    }
    case 'dummy_vent': {
      spawnFx('aoe', unit, unit, '#94a3b8');
      gainTp(unit, sk.tpBoost || 90, true);
      addLog('action', `${unit.name} vented charge (${skillLabel}).`);
      break;
    }
    case 'ub_aegis_cataclysm': {
      const targets = selectTargets(unit, 'nearest', 3);
      spawnFx('aoe', unit, targets[0] || unit, '#f59e0b');
      targets.forEach((t, idx) => {
        dealDamage(unit, t, 2.25, 'physical', {
          knockbackPx: idx === 0 ? 22 : 10,
          ccType: idx === 0 ? 'stun' : null,
          ccDuration: 1.1,
        });
      });
      grantShield(unit, unit, unit.maxHp * 0.28);
      unit.buffs.push({ type: 'taunt', val: 1, remaining: 4.5 });
      addLog('ub', `★ ${unit.name} unleashed ${skillLabel} (AOE DMG, Stun, Barrier & Taunt)!`);
      break;
    }
    case 'ub_crimson_eclipse': {
      const [t] = selectTargets(unit, 'nearest', 1);
      if (t) {
        spawnFx('slash', unit, t, '#ef4444');
        const d1 = dealDamage(unit, t, 1.35, 'physical', { bonusCrit: 0.20 });
        const d2 = t.alive ? dealDamage(unit, t, 1.35, 'physical', { bonusCrit: 0.20 }) : 0;
        const total = d1 + d2;
        healUnit(unit, unit, total * 0.45, skillLabel);
        unit.buffs.push({ type: 'atkUp', val: 0.20, remaining: 6 });
        addLog('ub', `★ ${unit.name} executed ${skillLabel} on ${t.name} for ${total} total DMG!`);
      }
      break;
    }
    case 'ub_phantom_severance': {
      const [t] = selectTargets(unit, 'lowest_hp', 1);
      if (t) {
        spawnFx('beam', unit, t, '#22d3ee');
        const d = dealDamage(unit, t, 2.90, 'physical', {
          bonusCrit: 0.25,
          ccType: 'silence',
          ccDuration: 2.0,
        });
        if (t.alive) {
          t.debuffs.push({ type: 'defDown', val: 0.30, remaining: 6 });
        }
        addLog('ub', `★ ${unit.name} struck ${t.name} with ${skillLabel} for ${d} DMG (-30% DEF & Silence)!`);
      }
      break;
    }
    case 'ub_dawnstar_judgment': {
      const targets = selectTargets(unit, 'nearest', 2);
      targets.forEach((t) => {
        spawnFx('beam', unit, t, '#fbbf24');
        dealDamage(unit, t, 2.50, 'magical');
      });
      const allies = selectAllies(unit, 'all_allies');
      allies.forEach((a) => {
        healUnit(unit, a, unit.matk * 1.25, skillLabel);
        grantShield(unit, a, unit.matk * 0.9);
      });
      addLog('ub', `★ ${unit.name} invoked ${skillLabel} (Light strike + team heal & shield)!`);
      break;
    }
    case 'ub_hourglass_paradox': {
      const allies = selectAllies(unit, 'all_allies');
      allies.forEach((a) => {
        a.buffs.push({ type: 'haste', val: 0.25, remaining: 6 });
        gainTp(a, 220, true);
        spawnFx('orb', unit, a, '#c084fc');
      });
      const enemies = selectTargets(unit, 'all_enemies');
      enemies.forEach((e) => {
        e.debuffs.push({ type: 'slow', val: 0.25, remaining: 5 });
        e.debuffs.push({ type: 'mdefDown', val: 0.22, remaining: 5 });
      });
      addLog('ub', `★ ${unit.name} warped time with ${skillLabel} (+Haste & +220 TP to allies, Slow/MDEF break to foes)!`);
      break;
    }
    case 'ub_cataclysmic_meteor': {
      const enemies = selectTargets(unit, 'all_enemies');
      enemies.forEach((e) => {
        spawnFx('aoe', unit, e, '#f97316');
        dealDamage(unit, e, 2.40, 'magical', { bonusCrit: 0.15 });
        if (e.alive) {
          e.debuffs.push({ type: 'mdefDown', val: 0.25, remaining: 6 });
          e.debuffs.push({
            type: 'burn',
            val: Math.max(35, Math.round(unit.matk * 0.55)),
            remaining: 4.5,
            tickTimer: 1.0,
          });
        }
      });
      addLog('ub', `★ ${unit.name} dropped ${skillLabel} across ALL enemies!`);
      break;
    }
    case 'ub_tempest_piercer': {
      const targets = selectTargets(unit, 'nearest', 2);
      targets.forEach((t) => {
        spawnFx('beam', unit, t, '#34d399');
        dealDamage(unit, t, 3.10, 'physical', { bonusCrit: 0.30 });
      });
      addLog('ub', `★ ${unit.name} fired ${skillLabel} for massive piercing physical damage!`);
      break;
    }
    case 'ub_sanctuary_dew': {
      const allies = selectAllies(unit, 'all_allies');
      allies.forEach((a) => {
        spawnFx('orb', unit, a, '#2dd4bf');
        healUnit(unit, a, unit.matk * 1.90, skillLabel);
        grantShield(unit, a, unit.matk * 1.10);
        a.debuffs = a.debuffs.filter((d) => !['burn', 'defDown', 'mdefDown', 'slow', 'silence'].includes(d.type));
      });
      addLog('ub', `★ ${unit.name} blessed the team with ${skillLabel} (Mass heal, barrier & cleanse)!`);
      break;
    }
    case 'dummy_shockwave': {
      const enemies = selectTargets(unit, 'all_enemies');
      enemies.forEach((e) => {
        spawnFx('aoe', unit, e, '#f59e0b');
        dealDamage(unit, e, 0.85, 'magical');
      });
      addLog('action', `${unit.name} emitted ${skillLabel}.`);
      break;
    }
  }
}

function updateBuffsAndDebuffs(unit, dt) {
  if (!unit.alive) return;

  for (let i = unit.buffs.length - 1; i >= 0; i--) {
    unit.buffs[i].remaining -= dt;
    if (unit.buffs[i].remaining <= 0) {
      unit.buffs.splice(i, 1);
    }
  }

  for (let i = unit.debuffs.length - 1; i >= 0; i--) {
    const d = unit.debuffs[i];
    if (d.type === 'burn') {
      d.tickTimer = (d.tickTimer ?? 1.0) - dt;
      if (d.tickTimer <= 0) {
        d.tickTimer += 1.0;
        const burnDmg = Math.max(10, Math.round(d.val));
        unit.hp = Math.max(0, unit.hp - burnDmg);
        spawnPopup(unit, `${burnDmg} BURN`, 'text-orange-400 font-bold text-[11px]', 6);
        if (unit.hp <= 0 && unit.alive) {
          unit.alive = false;
          unit.actionPhase = 'IDLE';
          unit.queuedAction = null;
          unit.speechBubble = null;
          spawnPopup(unit, 'KO!', 'text-red-500 font-extrabold text-sm', -18);
          addLog('ko', `💀 ${unit.name} succumbed to Burn!`);
        }
      }
    }
    d.remaining -= dt;
    if (d.remaining <= 0) {
      unit.debuffs.splice(i, 1);
    }
  }

  if (!unit.alive) return;

  for (const p of unit.passives) {
    if (p.type === 'periodic_aura') {
      unit.auraTimer += dt;
      if (unit.auraTimer >= 6.2) {
        unit.auraTimer -= 6.2;
        if (unit.templateId === 'sylas_sunweaver') {
          const frontAlly = [...getLivingUnits(unit.side)].sort((a, b) => a.zoneIndex - b.zoneIndex)[0];
          if (frontAlly) {
            gainTp(frontAlly, 75);
            grantShield(unit, frontAlly, unit.matk * 0.55);
          }
        } else if (unit.templateId === 'lyra_windpiercer') {
          unit.buffs.push({ type: 'haste', val: 0.12, remaining: 3.5 });
          gainTp(unit, 70);
        }
      }
    }
  }
}

function updateBattle(rawDt) {
if (!battle.running || battle.ended || state.paused) return;

if (battle.entranceTimer > 0) {
  battle.entranceTimer = Math.max(0, battle.entranceTimer - rawDt);
  updateFrontShiftAndVisualPositions(rawDt, true);
  return;
}

if (battle.cutscene && battle.cutscene.remaining > 0) {
battle.cutscene.remaining = Math.max(0, battle.cutscene.remaining - rawDt);
if (battle.cutscene.remaining === 0) {
const el = document.getElementById('ub-cutin-container');
if (el) {
el.innerHTML = '';
el.classList.add('hidden');
}
}
}

if (battle.hitstopTimer > 0) {
battle.hitstopTimer -= rawDt;
updateFrontShiftAndVisualPositions(rawDt * 0.25);
return;
}

if (state.ubPauseRemaining > 0) {
state.ubPauseRemaining = Math.max(0, state.ubPauseRemaining - rawDt);
// While UB emphasis hold is active, only advance the UB caster's windup/speech bubble
for (const u of battle.units) {
if (!u.alive) continue;
if (u.speechBubble) {
u.speechBubble.ttl -= rawDt * 0.5;
if (u.speechBubble.ttl <= 0) u.speechBubble = null;
}
if (u.queuedAction?.kind === 'ub' && u.actionPhase === 'WINDUP') {
u.phaseTimer += rawDt * 0.65;
if (u.phaseTimer >= u.phaseDuration && u.queuedAction) {
const act = u.queuedAction;
u.speechBubble = {
text: act.callout || act.label,
isUb: true,
ttl: act.followThroughSec + 0.65,
};
executeActionCode(u, act.skillDef.action, act.label, true);
u.actionPhase = 'FOLLOWTHROUGH';
u.phaseTimer = 0;
u.phaseDuration = act.followThroughSec;
u.queuedAction = null;
state.ubPauseRemaining = 0;
checkBattleEnd();
}
}
}
updateFrontShiftAndVisualPositions(rawDt * 0.35);
return;

}

const dt = rawDt * state.speed;
battle.timeRemaining = Math.max(0, battle.timeRemaining - dt);

if (state.autoUb) {
for (const u of battle.units) {
if (u.alive && u.tp >= MAX_TP && u.actionPhase === 'IDLE' && !isUnitIncapacitated(u) && !isUnitSilenced(u)) {
triggerUnionBurst(u);
}
}
}

for (const u of battle.units) {
if (!u.alive) continue;
updateBuffsAndDebuffs(u, dt);
if (!u.alive) continue;

    if (isUnitIncapacitated(u)) {
      interruptActiveWindupIfAny(u, getActiveCcLabel(u) || 'Crowd Control');
      if (u.actionPhase === 'FOLLOWTHROUGH') {
        u.phaseTimer += dt * 0.25;
      }
      continue;
    }

    const eff = getEffectiveStats(u);

    if (u.actionPhase === 'IDLE') {
      // Only charge action gauge when a target is within the unit's position attack range
      if (isTargetInRange(u)) {
        u.actionGauge += u.actionSpeed * eff.hasteMult * dt * 100 * PACE_CONFIG.idleGaugeMultiplier;
        if (u.actionGauge >= 100) {
          u.actionGauge = 0;
          stepPredeterminedLoop(u);
        }
      }
    } else if (u.actionPhase === 'WINDUP') {
      const windupRate = Math.max(
        PACE_CONFIG.windupMinRate,
        PACE_CONFIG.windupBaseRate + (eff.hasteMult - 1) * 0.4
      );
      u.phaseTimer += dt * windupRate;

      if (u.phaseTimer >= u.phaseDuration && u.queuedAction) {
        const act = u.queuedAction;
        executeActionCode(u, act.skillDef.action, act.label, act.kind === 'ub');
        if (!battle.running || !u.alive) break;

        u.actionPhase = 'FOLLOWTHROUGH';
        u.phaseTimer = 0;
        u.phaseDuration = act.followThroughSec;
        u.queuedAction = null;
        checkBattleEnd();
      }
    } else if (u.actionPhase === 'FOLLOWTHROUGH') {
      u.phaseTimer += dt;
      if (u.phaseTimer >= u.phaseDuration) {
        u.actionPhase = 'IDLE';
        u.phaseTimer = 0;
        u.phaseDuration = 0;
        u.actionGauge = 0;
      }
    }
  }

  updateFrontShiftAndVisualPositions(dt);

  for (let i = battle.popups.length - 1; i >= 0; i--) {
    battle.popups[i].age += dt;
    if (battle.popups[i].age >= battle.popups[i].duration) {
      battle.popups.splice(i, 1);
    }
  }

  for (let i = battle.fxList.length - 1; i >= 0; i--) {
    battle.fxList[i].age += dt;
    if (battle.fxList[i].age >= battle.fxList[i].duration) {
      battle.fxList.splice(i, 1);
    }
  }

  checkBattleEnd();
}

function checkBattleEnd() {
  if (battle.ended) return;
  const playerAlive = getLivingUnits('player').length;
  const enemyAlive = getLivingUnits('enemy').length;

  if (enemyAlive === 0) {
    finishBattle('VICTORY', 'Your Squad Prevails!', 'All opposing targets have been defeated.');
  } else if (playerAlive === 0) {
    finishBattle('DEFEAT', 'Squad Fallen', 'Your entire 4-unit lineup was defeated.');
  } else if (battle.timeRemaining <= 0) {
    const playerHpPct = sumHpPct('player');
    const enemyHpPct = sumHpPct('enemy');
    if (playerHpPct >= enemyHpPct) {
      finishBattle('TIME VICTORY', 'Decision Victory!', `Time expired with higher remaining HP (${playerHpPct.toFixed(1)}% vs ${enemyHpPct.toFixed(1)}%).`);
    } else {
      finishBattle('TIME DEFEAT', 'Time Expired', `Opposing side held higher HP (${enemyHpPct.toFixed(1)}% vs ${playerHpPct.toFixed(1)}%).`);
    }
  }
}

function sumHpPct(side) {
  const sideUnits = battle.units.filter((u) => u.side === side);
  if (!sideUnits.length) return 0;
  const totalPct = sideUnits.reduce((acc, u) => acc + Math.max(0, u.hp) / u.maxHp, 0);
  return (totalPct / sideUnits.length) * 100;
}

function finishBattle(badge, title, subtitle) {
  battle.ended = true;
  battle.running = false;
  battle.cutscene = null;
  battle.hitstopTimer = 0;
  battle.entranceTimer = 0;
  state.ubPauseRemaining = 0;

  const cutinEl = document.getElementById('ub-cutin-container');
  if (cutinEl) {
    cutinEl.innerHTML = '';
    cutinEl.classList.add('hidden');
  }

  const isWin = badge.includes('VICTORY');
  setBattleStatus(badge, 'bg-amber-400/20 text-amber-300 border-amber-400/40');
  addLog('system', `🏁 ${title} — ${subtitle}`);

  const badgeEl = document.getElementById('result-badge');
  const titleEl = document.getElementById('result-title');
  const subtitleEl = document.getElementById('result-subtitle');
  const stripEl = document.getElementById('result-lineup-strip');
  const overlayEl = document.getElementById('battle-result-overlay');

  if (overlayEl) overlayEl.classList.remove('hidden');

  if (badgeEl) badgeEl.textContent = badge;
  if (titleEl) {
    titleEl.textContent = isWin ? 'WIN!' : 'LOSE';
    titleEl.className = `pcrd-result-banner font-display text-5xl sm:text-7xl font-extrabold tracking-wider uppercase ${
      isWin ? 'is-win' : 'is-lose'
    }`;
  }
  if (subtitleEl) subtitleEl.textContent = subtitle;
  if (stripEl) {
    const squad = battle.units.filter((u) => u.side === 'player');
    stripEl.innerHTML = squad
      .map(
        (u) => `
        <div class="flex flex-col items-center ${u.alive ? '' : 'opacity-85 grayscale-[45%]'}">
          <div class="chibi-closeup-sprite ${u.alive ? 'anim-idle' : ''}">
            ${renderCharacterSpriteSVG(u, isWin && u.alive)}
          </div>
          <span class="mt-1 px-2.5 py-0.5 rounded-full bg-slate-950/90 border border-slate-600 text-[11px] font-bold text-white">
            ${u.name.split(' ')[0]}${u.alive ? '' : ' (KO)'}
          </span>
        </div>
      `
      )
      .join('');
  }
  renderResultDamageSummary('player');
}

function renderResultDamageSummary(activeSide = 'player') {
  const summaryEl = document.getElementById('result-damage-summary');
  if (!summaryEl) return;

  const squad = battle.units.filter((u) => u.side === activeSide);
  const maxVal = Math.max(
    1,
    ...squad.flatMap((u) => [
      u.statsTracked.damageDealt || 0,
      u.statsTracked.damageTaken || 0,
      (u.statsTracked.healingDone || 0) + (u.statsTracked.shieldGranted || 0),
    ])
  );

  summaryEl.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-2 mb-2.5">
      <div class="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-700">
        <button data-report-tab="player" class="px-3 py-1 rounded-lg text-[11px] font-extrabold transition ${
          activeSide === 'player'
            ? 'bg-sky-500 text-slate-950 shadow'
            : 'text-slate-300 hover:text-white'
        }">My Team</button>
        <button data-report-tab="enemy" class="px-3 py-1 rounded-lg text-[11px] font-extrabold transition ${
          activeSide === 'enemy'
            ? 'bg-rose-500 text-white shadow'
            : 'text-slate-300 hover:text-white'
        }">Enemy Team</button>
      </div>
      <div class="flex items-center gap-3 text-[10px] font-bold text-slate-300">
        <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-rose-500"></span>Dealt</span>
        <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-sky-400"></span>Taken</span>
        <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-400"></span>Heal/Shield</span>
      </div>
    </div>
    <div class="space-y-2.5">
      ${squad
        .map((u) => {
          const dealt = Math.round(u.statsTracked.damageDealt || 0);
          const taken = Math.round(u.statsTracked.damageTaken || 0);
          const support = Math.round((u.statsTracked.healingDone || 0) + (u.statsTracked.shieldGranted || 0));
          const dealtPct = dealt > 0 ? Math.max(3, Math.round((dealt / maxVal) * 100)) : 0;
          const takenPct = taken > 0 ? Math.max(3, Math.round((taken / maxVal) * 100)) : 0;
          const supPct = support > 0 ? Math.max(3, Math.round((support / maxVal) * 100)) : 0;

          return `
            <div class="grid grid-cols-[76px_1fr] items-center gap-2.5">
              <div class="text-xs font-bold text-slate-100 truncate">${u.name.split(' ')[0]}</div>
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <div class="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-full" style="width:${dealtPct}%"></div>
                  </div>
                  <span class="w-16 text-right font-mono-num text-[10px] font-bold text-rose-300">${dealt.toLocaleString()}</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full" style="width:${takenPct}%"></div>
                  </div>
                  <span class="w-16 text-right font-mono-num text-[10px] font-bold text-sky-300">${taken.toLocaleString()}</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full" style="width:${supPct}%"></div>
                  </div>
                  <span class="w-16 text-right font-mono-num text-[10px] font-bold text-emerald-300">${support.toLocaleString()}</span>
                </div>
              </div>
            </div>
          `;
        })
        .join('')}
    </div>
  `;

  summaryEl.querySelectorAll('[data-report-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      renderResultDamageSummary(btn.getAttribute('data-report-tab') || 'player');
    });
  });
}

function setBattleStatus(text, classes) {
  const pill = document.getElementById('battle-status-pill');
  pill.textContent = text;
  pill.className = `px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${classes}`;
}
