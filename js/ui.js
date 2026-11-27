// =========================================================================
// FULL-SCREEN PCRD BATTLE UI & LOBBY/DRAFT VIEWS
// =========================================================================
function renderPageViews() {
  const nonBattleHeader = document.getElementById('non-battle-header');
  const lobbyView = document.getElementById('lobby-view');
  const draftView = document.getElementById('draft-view');
  const battleView = document.getElementById('battle-view');

  const isBattle = state.page === 'battle';
  if (nonBattleHeader) {
    nonBattleHeader.classList.toggle('hidden', isBattle);
  }
  if (lobbyView) {
    lobbyView.classList.toggle('hidden', state.page !== 'lobby');
    lobbyView.style.display = state.page === 'lobby' ? 'flex' : 'none';
  }
  if (draftView) {
    draftView.classList.toggle('hidden', state.page !== 'draft');
    draftView.style.display = state.page === 'draft' ? 'flex' : 'none';
  }
  if (battleView) {
    battleView.classList.toggle('hidden', !isBattle);
    battleView.style.display = isBattle ? 'flex' : 'none';
  }

  document.querySelectorAll('.page-nav-btn').forEach((btn) => {
    const active = btn.getAttribute('data-page') === state.page;
    btn.className = `page-nav-btn px-3 py-1.5 rounded-lg text-xs font-bold transition ${
      active ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300 hover:text-white'
    }`;
  });

  const d4 = document.getElementById('draft-mode-4v4-btn');
  const dd = document.getElementById('draft-mode-dummy-btn');
  if (d4 && dd) {
    d4.className = `px-3 py-1.5 rounded-lg text-xs font-bold ${
      state.mode === '4v4' ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white'
    }`;
    dd.className = `px-3 py-1.5 rounded-lg text-xs font-bold ${
      state.mode === 'dummy' ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white'
    }`;
  }

  const modeHud = document.getElementById('hud-mode-label');
  if (modeHud) {
    modeHud.textContent = state.mode === '4v4' ? '4v4' : `4v${state.dummyCount}`;
  }

  const menuModeBtn = document.getElementById('menu-toggle-mode-btn');
  if (menuModeBtn) {
    menuModeBtn.textContent = state.mode === '4v4' ? 'Mode: 4v4' : `Mode: ${state.dummyCount} Dummy`;
  }

  const autoBtn = document.getElementById('auto-ub-btn');
  if (autoBtn) {
    autoBtn.classList.toggle('is-active', Boolean(state.autoUb));
    autoBtn.textContent = state.autoUb ? 'AUTO' : 'MANUAL';
  }

  const speedBtn = document.getElementById('speed-cycle-btn');
  if (speedBtn) {
    speedBtn.classList.toggle('is-active', state.speed !== 1);
    speedBtn.textContent = state.speed === 1 ? '▶▶' : `${state.speed}x`;
  }

  const showcase = document.getElementById('lobby-showcase-sprites');
  if (showcase) {
    const sampleIds = [
      'bram_ironclad',
      'vespera_nightstep',
      'mirella_hexthread',
      'orin_pyrecaster',
      'lyra_windpiercer',
      'talia_dewsong',
    ];
    showcase.innerHTML = sampleIds
      .map((id) => {
        const tpl = getTemplateById(id);
        return `
          <div class="bg-slate-950/75 border border-slate-800 rounded-2xl p-2.5 flex flex-col items-center text-center">
            <div class="anim-idle">${renderCharacterSpriteSVG({ templateId: id, side: 'player' }, false)}</div>
            <div class="text-[10px] font-bold text-slate-200 mt-1 truncate max-w-[78px]">${tpl.name.split(' ')[0]}</div>
          </div>
        `;
      })
      .join('');
  }

  const draftFilter = state.draftFilter || 'all';
  document.querySelectorAll('.draft-filter-btn').forEach((btn) => {
    const active = btn.getAttribute('data-draft-filter') === draftFilter;
    btn.className = `draft-filter-btn px-3.5 py-1 rounded-full text-xs font-extrabold transition ${
      active
        ? 'bg-blue-600 text-white shadow-sm'
        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
    }`;
  });

  const draftCards = document.getElementById('draft-roster-cards');
  if (draftCards) {
    const zoneGroup = (z) =>
      z === 'vanguard' || z === 'frontline'
        ? 'front'
        : z === 'flank' || z === 'center' || z === 'pivot'
        ? 'middle'
        : 'back';

    const filteredRoster = CHARACTER_TEMPLATES.filter(
      (c) => draftFilter === 'all' || zoneGroup(c.positionZone) === draftFilter
    );

    draftCards.innerHTML = filteredRoster
      .map((c) => {
        const inPlayer = state.playerSelection.includes(c.id);
        const grp = zoneGroup(c.positionZone).toUpperCase();
        return `
          <button data-draft-id="${c.id}" title="${c.name} (${c.positionZone})" class="relative aspect-square rounded-2xl border-2 ${
            inPlayer ? 'border-amber-400 ring-2 ring-amber-300/70' : 'border-slate-300 hover:border-sky-400'
          } bg-gradient-to-b from-blue-900 to-indigo-950 overflow-hidden transition active:scale-95">
            <div class="pcrd-head-portrait ${inPlayer ? 'brightness-75' : ''}">
              ${renderCharacterHeadSprite({ templateId: c.id, name: c.name })}
            </div>
            <span class="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-slate-950/80 text-[9px] font-extrabold text-amber-200">${grp}</span>
            ${
              inPlayer
                ? `<span class="absolute top-1 right-1 w-6 h-6 rounded-full bg-amber-400 border-2 border-white text-slate-950 font-black text-xs flex items-center justify-center shadow">✓</span>`
                : ''
            }
            <div class="absolute inset-x-0 bottom-0 bg-slate-950/80 text-[10px] font-bold text-white truncate px-1 py-0.5 text-center">
              ${c.name.split(' ')[0]}
            </div>
          </button>
        `;
      })
      .join('');

    draftCards.querySelectorAll('[data-draft-id]').forEach((btn) => {
      const id = btn.getAttribute('data-draft-id');
      const tpl = getTemplateById(id);
      if (tpl) bindCharacterTooltip(btn, tpl);
      btn.addEventListener('click', () => {
        hideCharacterTooltip();
        const existingIdx = state.playerSelection.indexOf(id);
        if (existingIdx >= 0) {
          state.playerSelection.splice(existingIdx, 1);
        } else if (state.playerSelection.length < 4) {
          state.playerSelection.push(id);
        }
        // Auto-arrange: left = furthest back (highest rangeCenter/distance), right = closest to center
        state.playerSelection.sort((a, b) => {
          const ta = getTemplateById(a);
          const tb = getTemplateById(b);
          const za = ta.distance ?? POSITION_ZONES.find((p) => p.id === ta.positionZone)?.rangeCenter ?? 465;
          const zb = tb.distance ?? POSITION_ZONES.find((p) => p.id === tb.positionZone)?.rangeCenter ?? 465;
          return zb - za;
        });
        renderTeamBuilders();
        renderPageViews();
      });
    });
  }
}

function renderWindupSpeechBubbles() {
  const layer = document.getElementById('speech-bubbles-layer');
  if (!layer) return;

  const activeSpeakers = battle.units.filter((u) => u.alive && u.speechBubble);
  layer.innerHTML = activeSpeakers
    .map((u) => {
      const yStagger = (u.slotIndex - 1.5) * 14;
      const totalOffsetPx = u.lungeOffset + u.knockbackOffset;
      const bubbleStyle = u.speechBubble.isUb
        ? 'bg-amber-300 text-slate-950 border-2 border-white font-extrabold'
        : 'bg-white text-slate-950 border-2 border-slate-800 font-extrabold';

      return `
        <div class="windup-speech-bubble absolute ${bubbleStyle} rounded-full px-3 py-1 text-[11px] sm:text-xs leading-tight shadow-xl" data-bubble-left="${u.visualX.toFixed(2)}% + ${totalOffsetPx.toFixed(1)}px" data-bubble-top="calc(64% + ${yStagger}px - 88px)">
          ${u.speechBubble.text}
        </div>
      `;
    })
    .join('');

  layer.querySelectorAll('[data-bubble-left]').forEach((el) => {
    const leftExpr = el.getAttribute('data-bubble-left') || '50% + 0px';
    el.style.left = `calc(${leftExpr})`;
    el.style.top = el.getAttribute('data-bubble-top') || '42%';
  });
}

function addLog(category, message) {
  const secElapsed = BATTLE_DURATION_SEC - Math.ceil(battle.timeRemaining);
  const mins = String(Math.floor(secElapsed / 60)).padStart(2, '0');
  const secs = String(secElapsed % 60).padStart(2, '0');
  battle.logs.unshift({ category, time: `${mins}:${secs}`, message });
  if (battle.logs.length > 120) battle.logs.pop();
  renderBattleLog();
}

function getUnifiedActionBarPct(unit) {
  if (!unit.alive) return 0;
  if (unit.actionPhase === 'IDLE') {
    const idleNorm = Math.max(0, Math.min(100, unit.actionGauge)) / 100;
    return idleNorm * 64;
  }
  if (unit.actionPhase === 'WINDUP') {
    const windNorm = unit.phaseDuration > 0 ? Math.max(0, Math.min(1, unit.phaseTimer / unit.phaseDuration)) : 0;
    return 64 + windNorm * 20;
  }
  const followNorm = unit.phaseDuration > 0 ? Math.max(0, Math.min(1, unit.phaseTimer / unit.phaseDuration)) : 0;
  return 84 + followNorm * 16;
}

function renderArena() {
  const cutinEl = document.getElementById('ub-cutin-container');
  const ubCameraActive = Boolean(
    battle.cutscene && (battle.cutscene.remaining > 0 || state.ubPauseRemaining > 0)
  );
  if (cutinEl && (!battle.cutscene || battle.cutscene.remaining <= 0)) {
    cutinEl.innerHTML = '';
    cutinEl.classList.add('hidden');
  }

  // Dynamic Camera Zoom & Framing during UB Cutscene / Impact
  const arenaStage = document.getElementById('arena-stage');
  if (arenaStage) {
    if (ubCameraActive) {
      const originX = battle.cutscene.cameraOriginX ?? 50;
      const scale = battle.cutscene.cameraScale ?? 1.22;
      arenaStage.style.transformOrigin = `${originX.toFixed(1)}% 62%`;
      arenaStage.style.transform = `scale(${scale.toFixed(2)})`;
    } else {
      arenaStage.style.transformOrigin = '50% 62%';
      arenaStage.style.transform = 'scale(1)';
    }
  }

  const timerEl = document.getElementById('battle-timer');
  if (timerEl) {
    const mins = String(Math.floor(battle.timeRemaining / 60)).padStart(2, '0');
    const secs = String(Math.ceil(battle.timeRemaining % 60) % 60).padStart(2, '0');
    timerEl.textContent = `${mins}:${secs}`;
  }

  const fxLayer = document.getElementById('fx-layer');
  if (fxLayer) {
    fxLayer.innerHTML = battle.fxList
      .map((fx) => {
        const p = Math.min(1, fx.age / fx.duration);
        const opacity = Math.max(0.12, 1 - p * 0.85).toFixed(2);
        const flipClass = fx.side === 'enemy' ? '-scale-x-100' : '';
        const spriteSrc = typeof getActionFxSpriteSrc === 'function' ? getActionFxSpriteSrc(fx.fxKey) : null;
        const xPos =
          fx.kind === 'orb'
            ? fx.fromX + (fx.toX - fx.fromX) * Math.min(1, p * 1.35)
            : fx.toX;
        const fxScale = (0.9 + p * 0.5).toFixed(2);

        if (spriteSrc) {
          return `
            <div class="absolute pointer-events-none" data-fx-left="${xPos.toFixed(2)}%" data-fx-opacity="${opacity}" data-fx-scale="${fxScale}">
              <img src="${spriteSrc}" alt="" draggable="false" class="w-28 h-28 sm:w-32 sm:h-32 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)] ${flipClass}" />
            </div>
          `;
        }

        // High-visibility action FX fallback when action_fx_grid.png is not yet in assets/
        if (fx.kind === 'slash') {
          return `
            <div class="absolute pointer-events-none" data-fx-left="${xPos.toFixed(2)}%" data-fx-opacity="${opacity}" data-fx-scale="${fxScale}">
              <svg viewBox="0 0 80 80" class="w-24 h-24 overflow-visible ${flipClass}">
                <path d="M12 64 Q42 18 70 12 Q46 36 20 70 Z" fill="${fx.color}" stroke="#0f172a" stroke-width="2"/>
                <path d="M20 50 Q46 24 66 22" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round"/>
              </svg>
            </div>
          `;
        }

        return `
          <div class="absolute pointer-events-none" data-fx-left="${xPos.toFixed(2)}%" data-fx-opacity="${opacity}" data-fx-scale="${fxScale}">
            <svg viewBox="0 0 96 72" class="w-28 h-24 overflow-visible">
              <ellipse cx="48" cy="38" rx="30" ry="13" fill="${fx.color}" fill-opacity="0.32" stroke="${fx.color}" stroke-width="3.5"/>
              <circle cx="48" cy="38" r="10" fill="#ffffff" fill-opacity="0.75"/>
            </svg>
          </div>
        `;
      })
      .join('');

    fxLayer.querySelectorAll('[data-fx-left]').forEach((el) => {
      el.style.left = el.getAttribute('data-fx-left') || '50%';
      el.style.top = '64%';
      const sc = el.getAttribute('data-fx-scale') || '1';
      el.style.transform = `translate(-50%, -50%) scale(${sc})`;
      el.style.opacity = el.getAttribute('data-fx-opacity') || '1';
    });
  }

  const unitsLayer = document.getElementById('arena-units-layer');
  if (!unitsLayer) return;

  // Ground AoE warning telegraphs (40% opacity red circle on the target floor during windup)
  let telegraphLayer = document.getElementById('aoe-telegraph-layer');
  if (!telegraphLayer && unitsLayer.parentElement) {
    telegraphLayer = document.createElement('div');
    telegraphLayer.id = 'aoe-telegraph-layer';
    telegraphLayer.className = 'absolute inset-0 pointer-events-none z-[5] overflow-hidden';
    unitsLayer.parentElement.insertBefore(telegraphLayer, unitsLayer);
  }

  if (telegraphLayer) {
    const AOE_ALL_ACTIONS = new Set(['ub_cataclysmic_meteor', 'ub_hourglass_paradox']);
    const AOE_NEAR_ACTIONS = new Set(['mag_aoe_burn', 'ub_aegis_cataclysm', 'ub_dawnstar_judgment']);
    const AOE_RANGE_ACTIONS = new Set([
      'phys_aoe_750_kill_tp',
      'ub_ninon_frontline_aoe',
      'phys_front_aoe_stun',
      'ub_monica_frontline_aoe',
      'phys_aoe_700_slow',
      'ub_tsumugi_capture_web',
    ]);
    const AOE_FRONT_50_ACTIONS = new Set(['ub_llima_frontline_aoe']);

    const telegraphs = [];
    for (const caster of battle.units) {
      if (!caster.alive || caster.enteringBattle || caster.actionPhase !== 'WINDUP' || !caster.queuedAction) continue;

      const qa = caster.queuedAction;
      let actionCode = qa.actionCode || qa.action || '';
      if (!actionCode && qa.kind === 'ub' && caster.ub) {
        actionCode = caster.ub.action || '';
      }
      if (!actionCode && caster.autoSkills) {
        const matched = Object.values(caster.autoSkills).find((s) => s && s.name === qa.label);
        if (matched) actionCode = matched.action || '';
      }

      const isAllAoe = AOE_ALL_ACTIONS.has(actionCode);
      const isNearAoe = AOE_NEAR_ACTIONS.has(actionCode);
      const isRangeAoe = AOE_RANGE_ACTIONS.has(actionCode);
      const isFront50Aoe = AOE_FRONT_50_ACTIONS.has(actionCode);
      if (!isAllAoe && !isNearAoe && !isRangeAoe && !isFront50Aoe) continue;

      const foes = battle.units
        .filter((t) => t.alive && !t.enteringBattle && t.side !== caster.side)
        .sort((a, b) => Math.abs(a.visualX - caster.visualX) - Math.abs(b.visualX - caster.visualX));
      if (!foes.length) continue;

      let affected = foes;
      if (isFront50Aoe) {
        const frontX = foes[0].posX ?? 0;
        const maxRange = qa.skillDef?.aoeRange || 50;
        const inFront = foes.filter((t) => Math.abs((t.posX ?? 0) - frontX) <= maxRange);
        affected = inFront.length > 0 ? inFront : foes.slice(0, 1);
      } else if (isRangeAoe) {
        const maxRange = qa.skillDef?.range || 750;
        const inRange = foes.filter(
          (t) => Math.abs((t.posX ?? 0) - (caster.posX ?? 0)) <= maxRange
        );
        affected = inRange.length > 0 ? inRange : foes.slice(0, 1);
      } else if (!isAllAoe) {
        affected = foes.slice(0, 2);
      }
      const xs = affected.map((t) => t.visualX);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const centerX = (minX + maxX) / 2;
      const widthPct = Math.max(18, maxX - minX + 14);
      const progress =
        caster.phaseDuration > 0
          ? Math.max(0.08, Math.min(1, caster.phaseTimer / caster.phaseDuration))
          : 0.5;
      const label = qa.label || (qa.kind === 'ub' ? caster.ub?.name : 'AoE') || 'AoE';

      telegraphs.push({
        centerX,
        widthPct,
        progress,
        label,
        isUb: qa.kind === 'ub',
      });
    }

    telegraphLayer.innerHTML = telegraphs
      .map(
        (tg) => `
        <div
          class="absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center"
          style="
            left: ${tg.centerX.toFixed(2)}%;
            top: 68%;
            width: ${tg.widthPct.toFixed(2)}%;
            height: ${tg.isUb ? '86px' : '68px'};
            background: rgba(239, 68, 68, 0.40);
            border: 2px solid rgba(252, 165, 165, 0.92);
            box-shadow: 0 0 22px rgba(239, 68, 68, 0.45), inset 0 0 18px rgba(185, 28, 28, 0.45);
          "
        >
          <div
            class="w-full h-full rounded-full"
            style="
              background: rgba(239, 68, 68, 0.35);
              border: 1.5px solid rgba(254, 202, 202, 0.85);
              transform: scale(${tg.progress.toFixed(3)});
            "
          ></div>
          <span
            class="absolute -bottom-5 px-2 py-0.5 rounded-full bg-red-950/90 border border-red-400/70 text-[10px] font-extrabold text-red-100 whitespace-nowrap shadow"
          >
            ⚠ ${tg.label}
          </span>
        </div>
      `
      )
      .join('');
  }

  const existingMap = new Map();
  unitsLayer.querySelectorAll('[data-uid]').forEach((el) => {
    existingMap.set(el.getAttribute('data-uid'), el);
  });

  const activeIds = new Set(battle.units.map((u) => u.uid));
  existingMap.forEach((el, uid) => {
    if (!activeIds.has(uid)) el.remove();
  });

  for (const u of battle.units) {
    let spriteNode = existingMap.get(u.uid);
    if (!spriteNode) {
      spriteNode = document.createElement('div');
      spriteNode.setAttribute('data-uid', u.uid);
      spriteNode.className = 'absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer transition-opacity duration-200';
      spriteNode.addEventListener('click', () => {
        state.selectedUnitId = u.uid;
        if (u.side === 'player' && u.tp >= MAX_TP && u.alive) {
          triggerUnionBurst(u);
        }
        renderAllUI();
      });
      unitsLayer.appendChild(spriteNode);
    }

    const isWindup = u.alive && u.actionPhase === 'WINDUP';
    const isSelected = state.selectedUnitId === u.uid;
    const isUbSpotlight = Boolean(
      ubCameraActive &&
        (battle.cutscene.casterUid === u.uid ||
          (Array.isArray(battle.cutscene.affectedUids) && battle.cutscene.affectedUids.includes(u.uid)))
    );
    const dimForUb = Boolean(ubCameraActive && !isUbSpotlight);
    // Grounded on the stone colosseum floor inside the full-height #arena-stage
    const yStaggerPx = (u.slotIndex - 1.5) * 16;
    const totalOffsetPx = u.lungeOffset + u.knockbackOffset;

    spriteNode.style.left = `calc(${u.visualX.toFixed(2)}% + ${totalOffsetPx.toFixed(1)}px)`;
    spriteNode.style.top = `calc(64% + ${yStaggerPx}px)`;
    spriteNode.style.opacity = !u.alive ? '0.28' : dimForUb ? '0.45' : '1';
    spriteNode.style.filter = dimForUb ? 'brightness(0.55)' : '';
    spriteNode.style.zIndex = isUbSpotlight ? '28' : isWindup ? '24' : isSelected ? '20' : '12';

    const usesRig = typeof hasCharacterRig === 'function' && hasCharacterRig(u.templateId);
    const animClass = !u.alive
      ? 'anim-defeated'
      : u.animState === 'hit'
      ? 'anim-hit'
      : u.animState === 'knockback'
      ? 'anim-knockback'
      : usesRig
      ? ''
      : u.animState === 'windup' || isWindup
      ? 'anim-windup'
      : u.animState === 'strike'
      ? 'anim-strike'
      : u.animState === 'walk'
      ? 'anim-walk'
      : 'anim-idle';

    const dirSign = u.side === 'player' ? 1 : -1;
    const koRotDeg = -28 * dirSign;
    const spriteStyleVars = `--windup-x:${-7 * dirSign}px; --windup-rot:${-9 * dirSign}deg; --strike-x:${16 * dirSign}px; --strike-rot:${12 * dirSign}deg; --recoil-x:${-10 * dirSign}px; --recoil-rot:${-8 * dirSign}deg; --kb-x:${-15 * dirSign}px; --kb-rot:${-12 * dirSign}deg; --ko-rot:${koRotDeg}deg;`;

    const univShield = Math.max(0, u.shield || 0);
    const magicShield = Math.max(0, u.magicShield || 0);
    const physShield = Math.max(0, u.physicalShield || 0);
    const totalShield = univShield + magicShield + physShield;
    const shieldDomeClass =
      totalShield <= 0
        ? ''
        : magicShield >= physShield && magicShield >= univShield && magicShield > 0
        ? 'is-magic'
        : physShield >= univShield && physShield > 0
        ? 'is-physical'
        : 'is-universal';

    const statusIconsHtml = u.alive ? renderStatusIconsHtml(u.buffs, u.debuffs) : '';

    // Borderless close-up chibi character sprite grounded on the stone arena floor
    spriteNode.innerHTML = `
      <div class="chibi-closeup-sprite relative flex flex-col items-center justify-center ${
        isUbSpotlight ? 'scale-115 drop-shadow-[0_0_22px_rgba(253,224,71,0.95)]' : ''
      } ${isWindup ? 'unit-windup-glow' : ''} ${
        isSelected ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.85)]' : ''
      }" data-sprite-vars="${spriteStyleVars}">
        ${statusIconsHtml}
        <div class="${animClass}" data-sprite-vars="${spriteStyleVars}">
          ${renderCharacterSpriteSVG(u, battle.ended && u.alive)}
        </div>
        ${u.alive && totalShield > 0 ? `<div class="unit-shield-bubble ${shieldDomeClass}"></div>` : ''}
        <div class="unit-ground-shadow"></div>
      </div>
    `;

  }

  const popupsLayer = document.getElementById('popups-layer');
  if (popupsLayer) {
    popupsLayer.innerHTML = battle.popups
      .map((p) => {
        const progress = Math.min(1, p.age / p.duration);
        const driftY = progress * 38;
        const opacity = progress < 0.72 ? 1 : Math.max(0, 1 - (progress - 0.72) / 0.28);
        const scale = progress < 0.14 ? 0.85 + (progress / 0.14) * 0.25 : 1.05 - progress * 0.1;
        const baseTop = Number.isFinite(p.baseTopPct) ? p.baseTopPct : 60;
        return `<div class="pcrd-popup-item absolute z-30 ${p.className}" data-popup-left="${p.xPct.toFixed(2)}%" data-popup-base-top="${baseTop.toFixed(2)}" data-popup-offset="${(p.offsetY - driftY).toFixed(1)}" data-popup-opacity="${opacity.toFixed(2)}" data-popup-scale="${scale.toFixed(2)}">${p.text}</div>`;
      })
      .join('');

    popupsLayer.querySelectorAll('[data-popup-left]').forEach((el) => {
      el.style.left = el.getAttribute('data-popup-left') || '50%';
      const baseTop = Number(el.getAttribute('data-popup-base-top') || '60');
      const topPx = Number(el.getAttribute('data-popup-offset') || '0');
      const sc = el.getAttribute('data-popup-scale') || '1';
      el.style.top = `calc(${baseTop}% + ${topPx.toFixed(1)}px)`;
      el.style.transform = `translate(-50%, -50%) scale(${sc})`;
      el.style.opacity = el.getAttribute('data-popup-opacity') || '1';
    });
  }

  renderWindupSpeechBubbles();

  unitsLayer.querySelectorAll('[data-sprite-vars]').forEach((el) => {
    const rawVars = el.getAttribute('data-sprite-vars') || '';
    rawVars.split(';').forEach((pair) => {
      const idx = pair.indexOf(':');
      if (idx > 0) {
        const prop = pair.slice(0, idx).trim();
        const val = pair.slice(idx + 1).trim();
        if (prop.startsWith('--') && val) el.style.setProperty(prop, val);
      }
    });
  });
}

// PCRD-style bottom portrait cards with HP bar, TP bar, and compact segmented action bar
function renderUbDeck() {
  const deck = document.getElementById('ub-deck');
  if (!deck) return;
  const playerUnits = battle.units.filter((u) => u.side === 'player');

  deck.innerHTML = playerUnits
    .map((u, idx) => {
      const curHp = Math.max(0, u.hp);
      const univShield = Math.max(0, u.shield || 0);
      const magicShield = Math.max(0, u.magicShield || 0);
      const physShield = Math.max(0, u.physicalShield || 0);
      const totalShield = univShield + magicShield + physShield;
      const barCap = Math.max(u.maxHp, curHp + totalShield);
      const hpPct = Math.max(0, Math.min(100, (curHp / barCap) * 100));
      const univPct = Math.max(0, Math.min(100 - hpPct, (univShield / barCap) * 100));
      const magicPct = Math.max(0, Math.min(100 - hpPct - univPct, (magicShield / barCap) * 100));
      const physPct = Math.max(0, Math.min(100 - hpPct - univPct - magicPct, (physShield / barCap) * 100));
      const hpTooltip = `HP: ${Math.ceil(curHp)}/${u.maxHp}${
        univShield > 0 ? ` • Universal Shield: ${Math.ceil(univShield)}` : ''
      }${magicShield > 0 ? ` • Magic Shield: ${Math.ceil(magicShield)}` : ''}${
        physShield > 0 ? ` • Physical Shield: ${Math.ceil(physShield)}` : ''
      }`;
      const tpPct = Math.max(0, Math.min(100, (u.tp / MAX_TP) * 100));
      const actPct = getUnifiedActionBarPct(u);
      const ready = u.alive && u.tp >= MAX_TP && battle.running && !battle.ended;
      const phaseColor =
        u.actionPhase === 'WINDUP'
          ? 'bg-sky-300'
          : u.actionPhase === 'FOLLOWTHROUGH'
          ? 'bg-amber-400'
          : 'bg-emerald-400';

      return `
        <div class="flex flex-col items-center gap-1.5 shrink-0">
          <button data-ub-uid="${u.uid}" title="[${idx + 1}] ${u.name} — ${u.ub.name}" class="pcrd-portrait-card ${
            ready ? 'ub-ready cursor-pointer' : 'cursor-pointer'
          } ${!u.alive ? 'opacity-35 grayscale' : ''} relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex items-center justify-center transition">
            <div class="pcrd-head-portrait">
              ${renderCharacterHeadSprite(u)}
            </div>
            ${ready ? `<span class="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-amber-300 text-slate-950 font-extrabold text-[9px] shadow">UB</span>` : ''}
          </button>          <!-- HP Bar + Color-Coded Shield Segments (Gray: Universal, Purple: Magic, Maroon: Physical) -->
          <div title="${hpTooltip}" class="w-20 sm:w-24 h-2.5 rounded-full bg-slate-900/95 border border-slate-700 overflow-hidden p-[1px] flex items-center">
            <div class="h-full bg-lime-400 transition-all duration-100 shrink-0 ${totalShield <= 0 ? 'rounded-full' : 'rounded-l-full'}" data-ub-hp="${hpPct.toFixed(1)}%"></div>
            ${univPct > 0 ? `<div class="h-full shield-seg-universal transition-all duration-100 shrink-0 ${magicPct <= 0 && physPct <= 0 ? 'rounded-r-full' : ''}" data-ub-shield="${univPct.toFixed(1)}%"></div>` : ''}
            ${magicPct > 0 ? `<div class="h-full shield-seg-magic transition-all duration-100 shrink-0 ${physPct <= 0 ? 'rounded-r-full' : ''}" data-ub-shield="${magicPct.toFixed(1)}%"></div>` : ''}
            ${physPct > 0 ? `<div class="h-full shield-seg-physical rounded-r-full transition-all duration-100 shrink-0" data-ub-shield="${physPct.toFixed(1)}%"></div>` : ''}
          </div>
          <!-- TP Bar -->
          <div class="w-20 sm:w-24 h-2.5 rounded-full bg-slate-900/95 border border-slate-700 overflow-hidden p-[1px]">
            <div class="h-full rounded-full ${ready ? 'bg-amber-300' : 'bg-sky-400'} transition-all duration-100" data-ub-tp="${tpPct.toFixed(1)}%"></div>
          </div>
          <!-- Single Segmented Action Bar (Idle / Windup / Follow) -->
          <div class="action-track-segmented w-20 sm:w-24 h-1.5 rounded-full overflow-hidden">
            <div class="h-full ${phaseColor} transition-all duration-75" data-ub-act="${actPct.toFixed(1)}%"></div>
          </div>
        </div>
      `;
    })
    .join('');

  deck.querySelectorAll('[data-ub-hp]').forEach((el) => {
    el.style.width = el.getAttribute('data-ub-hp') || '0%';
  });
  deck.querySelectorAll('[data-ub-shield]').forEach((el) => {
    el.style.width = el.getAttribute('data-ub-shield') || '0%';
  });
  deck.querySelectorAll('[data-ub-tp]').forEach((el) => {
    el.style.width = el.getAttribute('data-ub-tp') || '0%';
  });
  deck.querySelectorAll('[data-ub-act]').forEach((el) => {
    el.style.width = el.getAttribute('data-ub-act') || '0%';
  });

  deck.querySelectorAll('[data-ub-uid]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const uid = btn.getAttribute('data-ub-uid');
      state.selectedUnitId = uid;
      const unit = battle.units.find((x) => x.uid === uid);
      if (unit && unit.tp >= MAX_TP && unit.alive) {
        triggerUnionBurst(unit);
      }
      renderAllUI();
    });
  });

  // Enemy AI Profile Strip (visible only in offline/AI battles; hidden when state.isOnlineBattle is true)
  const enemyWrap = document.getElementById('enemy-ub-deck-wrap');
  const enemyDeck = document.getElementById('enemy-ub-deck');
  if (enemyWrap && enemyDeck) {
    const showEnemyProfiles = !state.isOnlineBattle;
    enemyWrap.classList.toggle('hidden', !showEnemyProfiles);
    if (!showEnemyProfiles) {
      enemyDeck.innerHTML = '';
      return;
    }

    const enemyUnits = battle.units.filter((u) => u.side === 'enemy');
    enemyDeck.innerHTML = enemyUnits
      .map((u) => {
        const curHp = Math.max(0, u.hp);
        const univShield = Math.max(0, u.shield || 0);
        const magicShield = Math.max(0, u.magicShield || 0);
        const physShield = Math.max(0, u.physicalShield || 0);
        const totalShield = univShield + magicShield + physShield;
        const barCap = Math.max(u.maxHp, curHp + totalShield);
        const hpPct = Math.max(0, Math.min(100, (curHp / barCap) * 100));
        const univPct = Math.max(0, Math.min(100 - hpPct, (univShield / barCap) * 100));
        const magicPct = Math.max(0, Math.min(100 - hpPct - univPct, (magicShield / barCap) * 100));
        const physPct = Math.max(0, Math.min(100 - hpPct - univPct - magicPct, (physShield / barCap) * 100));
        const hpTooltip = `${u.name} • HP: ${Math.ceil(curHp)}/${u.maxHp}${
          univShield > 0 ? ` • Universal Shield: ${Math.ceil(univShield)}` : ''
        }${magicShield > 0 ? ` • Magic Shield: ${Math.ceil(magicShield)}` : ''}${
          physShield > 0 ? ` • Physical Shield: ${Math.ceil(physShield)}` : ''
        }`;
        const tpPct = Math.max(0, Math.min(100, (u.tp / MAX_TP) * 100));
        const actPct = getUnifiedActionBarPct(u);
        const ready = u.alive && u.tp >= MAX_TP && battle.running && !battle.ended;
        const phaseColor =
          u.actionPhase === 'WINDUP'
            ? 'bg-sky-300'
            : u.actionPhase === 'FOLLOWTHROUGH'
            ? 'bg-amber-400'
            : 'bg-rose-400';

        return `
          <div class="flex flex-col items-center gap-1 shrink-0">
            <button data-enemy-profile-uid="${u.uid}" title="${u.name} (AI) — ${u.ub.name}" class="pcrd-portrait-card border-rose-400/75 ${
              ready ? 'ub-ready' : ''
            } ${!u.alive ? 'opacity-35 grayscale' : ''} relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden flex items-center justify-center transition cursor-pointer">
              <div class="pcrd-head-portrait -scale-x-100">
                ${renderCharacterHeadSprite(u)}
              </div>
              <span class="absolute bottom-0.5 left-0.5 px-1 rounded bg-rose-600/90 text-white font-extrabold text-[8px] leading-tight shadow">AI</span>
              ${ready ? `<span class="absolute top-0.5 right-0.5 px-1 rounded bg-amber-300 text-slate-950 font-extrabold text-[8px] shadow">UB</span>` : ''}
            </button>
            <div title="${hpTooltip}" class="w-14 sm:w-16 h-2 rounded-full bg-slate-900/95 border border-slate-700 overflow-hidden p-[1px] flex items-center">
              <div class="h-full bg-rose-400 transition-all duration-100 shrink-0 ${totalShield <= 0 ? 'rounded-full' : 'rounded-l-full'}" data-ub-hp="${hpPct.toFixed(1)}%"></div>
              ${univPct > 0 ? `<div class="h-full shield-seg-universal transition-all duration-100 shrink-0 ${magicPct <= 0 && physPct <= 0 ? 'rounded-r-full' : ''}" data-ub-shield="${univPct.toFixed(1)}%"></div>` : ''}
              ${magicPct > 0 ? `<div class="h-full shield-seg-magic transition-all duration-100 shrink-0 ${physPct <= 0 ? 'rounded-r-full' : ''}" data-ub-shield="${magicPct.toFixed(1)}%"></div>` : ''}
              ${physPct > 0 ? `<div class="h-full shield-seg-physical rounded-r-full transition-all duration-100 shrink-0" data-ub-shield="${physPct.toFixed(1)}%"></div>` : ''}
            </div>
            <div class="w-14 sm:w-16 h-2 rounded-full bg-slate-900/95 border border-slate-700 overflow-hidden p-[1px]">
              <div class="h-full rounded-full ${ready ? 'bg-amber-300' : 'bg-sky-400'} transition-all duration-100" data-ub-tp="${tpPct.toFixed(1)}%"></div>
            </div>
            <div class="action-track-segmented w-14 sm:w-16 h-1.5 rounded-full overflow-hidden">
              <div class="h-full ${phaseColor} transition-all duration-75" data-ub-act="${actPct.toFixed(1)}%"></div>
            </div>
          </div>
        `;
      })
      .join('');

    enemyDeck.querySelectorAll('[data-ub-hp]').forEach((el) => {
      el.style.width = el.getAttribute('data-ub-hp') || '0%';
    });
    enemyDeck.querySelectorAll('[data-ub-shield]').forEach((el) => {
      el.style.width = el.getAttribute('data-ub-shield') || '0%';
    });
    enemyDeck.querySelectorAll('[data-ub-tp]').forEach((el) => {
      el.style.width = el.getAttribute('data-ub-tp') || '0%';
    });
    enemyDeck.querySelectorAll('[data-ub-act]').forEach((el) => {
      el.style.width = el.getAttribute('data-ub-act') || '0%';
    });

    enemyDeck.querySelectorAll('[data-enemy-profile-uid]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.selectedUnitId = btn.getAttribute('data-enemy-profile-uid');
        renderAllUI();
      });
    });
  }
}

function renderUnitInspector() {
  const box = document.getElementById('unit-inspector');
  if (!box) return;
  const unit = battle.units.find((u) => u.uid === state.selectedUnitId) || battle.units[0];
  if (!unit) return;

  box.innerHTML = `
    <div class="flex items-center justify-between gap-2 mb-2">
      <div class="flex items-center gap-2.5">
        <div class="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
          ${renderCharacterSpriteSVG(unit, false)}
        </div>
        <div>
          <div class="font-display text-sm font-extrabold text-white">${unit.name}</div>
          <div class="text-[11px] text-slate-400">${unit.title} • <span class="text-amber-300 uppercase">${unit.positionZone}</span></div>
        </div>
      </div>
      <div class="text-right font-mono-num text-[11px]">
        <div class="text-emerald-300 font-bold">${Math.ceil(unit.hp)} / ${unit.maxHp} HP</div>
        ${
          (unit.shield || 0) + (unit.magicShield || 0) + (unit.physicalShield || 0) > 0
            ? `<div class="text-[10px] font-bold text-slate-200">${
                unit.shield > 0 ? `<span class="text-gray-300">U:${Math.ceil(unit.shield)}</span> ` : ''
              }${
                unit.magicShield > 0 ? `<span class="text-purple-300">M:${Math.ceil(unit.magicShield)}</span> ` : ''
              }${
                unit.physicalShield > 0 ? `<span class="text-rose-400">P:${Math.ceil(unit.physicalShield)}</span>` : ''
              }</div>`
            : ''
        }
        <div class="text-amber-300 font-bold">${Math.floor(unit.tp)} / ${MAX_TP} TP</div>
      </div>
    </div>
    <div class="text-[11px] text-amber-200 bg-amber-500/10 border border-amber-400/30 rounded-xl p-2">
      <strong>★ UB (${unit.ub.name}):</strong> ${unit.ub.desc}
    </div>
  `;
}

function renderBattleLog() {
  const logEl = document.getElementById('battle-log');
  if (!logEl) return;
  logEl.innerHTML = battle.logs
    .slice(0, 35)
    .map(
      (entry) => `
      <div class="leading-snug border-b border-slate-800/50 pb-1 text-slate-300">
        <span class="text-slate-500">[${entry.time}]</span> ${entry.message}
      </div>
    `
    )
    .join('');
}

function computeCharacterPower(c) {
  if (!c || !c.stats) return 0;
  const s = c.stats;
  const raw =
    (s.maxHp || 0) * 0.1 +
    ((s.patk || 0) + (s.matk || 0)) +
    ((s.pdef || 0) + (s.mdef || 0)) * 4.5 +
    ((s.pcrit || 0) + (s.mcrit || 0)) * 0.5 +
    (s.waveHpRecovery || 0) * 0.1 +
    (s.waveTpRecovery || 0) * 0.3 +
    (s.dodge || 0) * 6 +
    (s.hpReduceRate || 0) * 4.5 +
    (s.hpRecoveryRate || 0) * 1 +
    (s.tpRecoveryRate || 0) * 1.5 +
    (s.tpReduceRate || 0) * 3 +
    (s.accuracy || 0) * 2 +
    4000;
  return Math.round(raw);
}

function computePartyPower(ids) {
  return ids.reduce((sum, id) => {
    const c = getTemplateById(id);
    if (!c) return sum;
    return sum + computeCharacterPower(c);
  }, 0);
}

function renderTeamBuilders() {
  const playerContainer = document.getElementById('player-team-builder');
  const enemyContainer = document.getElementById('enemy-team-builder');
  const dummySelect = document.getElementById('dummy-count-select');
  const enemyLabel = document.getElementById('enemy-builder-label');
  const playerPowerEl = document.getElementById('player-party-power');
  const enemyPowerEl = document.getElementById('enemy-party-power');
  if (!playerContainer || !enemyContainer) return;

  // Ensure player squad is always sorted Back (left) -> Front (right) with no duplicates
  state.playerSelection = [...new Set(state.playerSelection)].slice(0, 4).sort((a, b) => {
    const ta = getTemplateById(a);
    const tb = getTemplateById(b);
    const za = ta.distance ?? POSITION_ZONES.find((p) => p.id === ta.positionZone)?.rangeCenter ?? 465;
    const zb = tb.distance ?? POSITION_ZONES.find((p) => p.id === tb.positionZone)?.rangeCenter ?? 465;
    return zb - za;
  });

  if (playerPowerEl) playerPowerEl.textContent = String(computePartyPower(state.playerSelection));

  const slots = [0, 1, 2, 3];
  playerContainer.innerHTML = slots
    .map((slotIdx) => {
      const tplId = state.playerSelection[slotIdx];
      if (!tplId) {
        return `<div class="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-200/70 flex items-center justify-center text-[10px] font-bold text-slate-400">Empty</div>`;
      }
      const c = getTemplateById(tplId);
      return `
        <button data-remove-player-id="${tplId}" title="Click to remove ${c.name}" class="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-blue-900 to-indigo-950 overflow-hidden shadow hover:brightness-110 transition">
          <div class="pcrd-head-portrait">${renderCharacterHeadSprite({ templateId: tplId, name: c.name })}</div>
          <span class="absolute inset-x-0 bottom-0 bg-slate-950/80 text-[9px] font-bold text-white truncate px-1">${c.name.split(' ')[0]}</span>
        </button>
      `;
    })
    .join('');

  playerContainer.querySelectorAll('[data-remove-player-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-remove-player-id');
      state.playerSelection = state.playerSelection.filter((x) => x !== id);
      renderTeamBuilders();
      renderPageViews();
    });
  });

  const launchBtn = document.getElementById('draft-launch-battle-btn');
  if (launchBtn) {
    const empty = state.playerSelection.length === 0;
    launchBtn.disabled = empty;
    launchBtn.classList.toggle('opacity-50', empty);
    launchBtn.classList.toggle('cursor-not-allowed', empty);
  }

  if (state.mode === 'dummy') {
    if (dummySelect) {
      dummySelect.classList.remove('hidden');
      dummySelect.value = String(state.dummyCount);
    }
    if (enemyLabel) enemyLabel.textContent = `Training Dummies (${state.dummyCount})`;
    if (enemyPowerEl) enemyPowerEl.textContent = String(state.dummyCount * 4200);
    enemyContainer.innerHTML = Array.from({ length: state.dummyCount })
      .map(
        (_, idx) => `
        <div class="w-14 h-14 rounded-xl border-2 border-amber-400 bg-slate-900 flex flex-col items-center justify-center text-[10px] font-extrabold text-amber-300 shadow">
          <span>D#${idx + 1}</span>
        </div>
      `
      )
      .join('');
  } else {
    if (dummySelect) dummySelect.classList.add('hidden');
    if (enemyLabel) enemyLabel.textContent = "Opponent's Party";
    state.enemySelection = [...new Set(state.enemySelection)].slice(0, 4).sort((a, b) => {
      const ta = getTemplateById(a);
      const tb = getTemplateById(b);
      const za = ta.distance ?? POSITION_ZONES.find((p) => p.id === ta.positionZone)?.rangeCenter ?? 465;
      const zb = tb.distance ?? POSITION_ZONES.find((p) => p.id === tb.positionZone)?.rangeCenter ?? 465;
      return za - zb;
    });
    if (enemyPowerEl) enemyPowerEl.textContent = String(computePartyPower(state.enemySelection));

    enemyContainer.innerHTML = state.enemySelection
      .map((tplId) => {
        const c = getTemplateById(tplId);
        return `
          <div title="${c.name} (${c.positionZone})" class="relative w-14 h-14 rounded-xl border-2 border-rose-400 bg-gradient-to-b from-slate-800 to-slate-950 overflow-hidden shadow">
            <div class="pcrd-head-portrait">${renderCharacterHeadSprite({ templateId: tplId, name: c.name })}</div>
          </div>
        `;
      })
      .join('');
  }
}

const STATUS_ICON_META = {
  patkUp: { icon: '⚔️', label: 'PATK Up', isDebuff: false },
  matkUp: { icon: '✨', label: 'MATK Up', isDebuff: false },
  atkUp: { icon: '⚔️', label: 'ATK Up', isDebuff: false },
  pdefUp: { icon: '🛡️', label: 'PDEF Up', isDebuff: false },
  mdefUp: { icon: '🔮', label: 'MDEF Up', isDebuff: false },
  defUp: { icon: '🛡️', label: 'DEF Up', isDebuff: false },
  haste: { icon: '⚡', label: 'Haste', isDebuff: false },
  healUp: { icon: '💚', label: 'Heal Up', isDebuff: false },
  critUp: { icon: '🎯', label: 'Crit Up', isDebuff: false },
  taunt: { icon: '💢', label: 'Taunt', isDebuff: false },
  stun: { icon: '💫', label: 'Stun', isDebuff: true },
  knockback: { icon: '💥', label: 'Knockback', isDebuff: true },
  silence: { icon: '🔇', label: 'Silence', isDebuff: true },
  defDown: { icon: '💔', label: 'DEF Down', isDebuff: true },
  mdefDown: { icon: '📉', label: 'MDEF Down', isDebuff: true },
  matkDown: { icon: '⬇️', label: 'MATK Down', isDebuff: true },
  slow: { icon: '❄️', label: 'Slow', isDebuff: true },
  burn: { icon: '🔥', label: 'Burn', isDebuff: true },
  poison: { icon: '☠️', label: 'Poison', isDebuff: true },
  bleed: { icon: '🩸', label: 'Bleed', isDebuff: true },
  windShear: { icon: '🌪️', label: 'Wind Shear', isDebuff: true },
  blind: { icon: '👁️', label: 'Blind', isDebuff: true },
  miss: { icon: '❌', label: 'Miss', isDebuff: true },
};

function renderStatusIconsHtml(buffs = [], debuffs = []) {
  const merged = new Map();
  const collect = (list, fallbackDebuff) => {
    for (const item of list || []) {
      if (!item || !item.type) continue;
      const rem = typeof item.remaining === 'number' ? item.remaining : 999;
      if (rem <= 0) continue;
      const key = `${fallbackDebuff ? 'd' : 'b'}:${item.type}`;
      const existing = merged.get(key);
      if (!existing || rem > existing.remaining) {
        merged.set(key, { type: item.type, remaining: rem, fallbackDebuff });
      }
    }
  };
  collect(buffs, false);
  collect(debuffs, true);
  if (merged.size === 0) return '';

  const badges = [];
  for (const entry of merged.values()) {
    const meta = STATUS_ICON_META[entry.type] || {
      icon: entry.fallbackDebuff ? '!' : '+',
      label: entry.type,
      isDebuff: entry.fallbackDebuff,
    };
    const isExpiring = entry.remaining <= 3 && entry.remaining < 100;
    // Logarithmic blink speed: slows near 3s (~0.65s cycle) and accelerates rapidly as remaining -> 0 (~0.10s)
    const blinkDur = isExpiring
      ? Math.max(0.1, 0.1 + 0.55 * (Math.log(1 + Math.max(0, entry.remaining)) / Math.log(4)))
      : 0;
    const styleAttr = isExpiring ? `style="animation-duration:${blinkDur.toFixed(3)}s;"` : '';
    badges.push(
      `<span class="status-icon-badge ${meta.isDebuff ? 'is-debuff' : 'is-buff'} ${
        isExpiring ? 'is-expiring' : ''
      }" ${styleAttr} title="${meta.label} (${entry.remaining >= 100 ? 'Passive' : `${entry.remaining.toFixed(1)}s`})">${meta.icon}</span>`
    );
  }
  return `<div class="unit-status-icons">${badges.join('')}</div>`;
}

const CHARACTER_CLASS_MAP = {
  bram_ironclad: 'General Tank',
  garrick_stoneguard: 'Physical Tank',
  llima: 'Vanguard Tank',
  nozomi: 'Taunt Tank',
  kaelen_ashblade: 'Frontline Bruiser',
  seraphina_dawnblade: 'Valkyrie Bruiser',
  tamaki: 'Mage-Killer Assassin',
  tsumugi: 'Disruptor / Puller',
  vespera_nightstep: 'Assassin',
  zephyr_shadowstep: 'Assassin',
  ninon: 'AoE Cleaver',
  monica: 'Haste Sub-DPS',
  sylas_sunweaver: 'Paladin Support',
  aurelia_starcaller: 'Shield Support',
  yukari: 'Magic-Ward Support',
  mirella_hexthread: 'Chrono Support',
  corvus_voidweaver: 'Debuff Mage',
  orin_pyrecaster: 'AoE Burn Mage',
  ignis_emberheart: 'AoE Burn Mage',
  kyouka: 'Single-Target Mage',
  lyra_windpiercer: 'Marksman',
  sylvia_frostbow: 'Marksman',
  talia_dewsong: 'Healer',
  elara_moonbloom: 'Healer / Haste',
};

function formatZoneLabel(zone) {
  if (!zone) return 'Frontline';
  return zone.charAt(0).toUpperCase() + zone.slice(1);
}

function getCharacterTooltipHtml(tpl) {
  const roleLabel = CHARACTER_CLASS_MAP[tpl.id] || tpl.title || 'Fighter';
  const dmgLabel = tpl.damageType === 'magical' ? 'Magical' : 'Physical';
  const zoneLabel = formatZoneLabel(tpl.positionZone);
  const power = computeCharacterPower(tpl);
  return `
    <div class="text-xs font-extrabold text-amber-300 leading-tight mb-1">${tpl.name}</div>
    <div class="text-[11px] text-slate-200 leading-snug"><span class="text-slate-400 font-bold">Class:</span> ${roleLabel}, ${dmgLabel}, ${zoneLabel}</div>
    <div class="text-[11px] text-slate-200 leading-snug mt-0.5"><span class="text-slate-400 font-bold">Power:</span> <span class="font-mono-num font-extrabold text-sky-300">${power.toLocaleString()}</span></div>
  `;
}

function getOrCreateCharTooltipEl() {
  let el = document.getElementById('char-hover-tooltip');
  if (!el) {
    el = document.createElement('div');
    el.id = 'char-hover-tooltip';
    el.className = 'char-hover-tooltip hidden';
    document.body.appendChild(el);
  }
  return el;
}

function positionCharacterTooltip(e) {
  const el = document.getElementById('char-hover-tooltip');
  if (!el || el.classList.contains('hidden')) return;
  const pad = 14;
  const rect = el.getBoundingClientRect();
  let left = e.clientX + pad;
  let top = e.clientY + pad;
  if (left + rect.width > window.innerWidth - 8) {
    left = Math.max(8, e.clientX - rect.width - pad);
  }
  if (top + rect.height > window.innerHeight - 8) {
    top = Math.max(8, e.clientY - rect.height - pad);
  }
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

function hideCharacterTooltip() {
  document.getElementById('char-hover-tooltip')?.classList.add('hidden');
}

function bindCharacterTooltip(el, tpl) {
  if (!el || !tpl) return;
  el.removeAttribute('title');
  el.addEventListener('mouseenter', (e) => {
    const tip = getOrCreateCharTooltipEl();
    tip.innerHTML = getCharacterTooltipHtml(tpl);
    tip.classList.remove('hidden');
    positionCharacterTooltip(e);
  });
  el.addEventListener('mousemove', positionCharacterTooltip);
  el.addEventListener('mouseleave', hideCharacterTooltip);
}

function buildStrategyTeam(strategy = 'balanced') {
  const pickRandom = (pool, count, excludeSet) => {
    const avail = pool.filter((id) => !excludeSet.has(id) && getTemplateById(id));
    for (let i = avail.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [avail[i], avail[j]] = [avail[j], avail[i]];
    }
    const chosen = avail.slice(0, count);
    chosen.forEach((id) => excludeSet.add(id));
    return chosen;
  };

  const tanks = ['bram_ironclad', 'garrick_stoneguard', 'llima', 'nozomi'];
  const bruisers = ['kaelen_ashblade', 'seraphina_dawnblade', 'tsumugi', 'ninon'];
  const assassins = ['vespera_nightstep', 'zephyr_shadowstep', 'tamaki'];
  const physDps = ['lyra_windpiercer', 'sylvia_frostbow', 'ninon', 'kaelen_ashblade', 'seraphina_dawnblade', 'monica'];
  const mages = ['orin_pyrecaster', 'ignis_emberheart', 'kyouka', 'corvus_voidweaver'];
  const supports = ['talia_dewsong', 'elara_moonbloom', 'yukari', 'sylas_sunweaver', 'aurelia_starcaller', 'mirella_hexthread', 'monica'];
  const healers = ['talia_dewsong', 'elara_moonbloom', 'yukari', 'sylas_sunweaver', 'aurelia_starcaller'];
  const allIds = CHARACTER_TEMPLATES.map((c) => c.id);

  const used = new Set();
  const team = [];

  if (strategy === 'aggro_dive') {
    team.push(...pickRandom(tanks, 1, used));
    team.push(...pickRandom([...bruisers, ...assassins], 2, used));
    team.push(...pickRandom(['monica', ...assassins, ...physDps], 1, used));
  } else if (strategy === 'magic_burst') {
    team.push(...pickRandom(tanks, 1, used));
    team.push(...pickRandom(mages, 2, used));
    team.push(...pickRandom(['mirella_hexthread', 'yukari', 'elara_moonbloom', 'monica'], 1, used));
  } else if (strategy === 'sustain_stall') {
    team.push(...pickRandom(tanks, 2, used));
    team.push(...pickRandom(healers, 2, used));
  } else if (strategy === 'anti_mage') {
    team.push(...pickRandom(tanks, 1, used));
    team.push(...pickRandom(['tamaki', 'yukari', 'tsumugi'], 2, used));
    team.push(...pickRandom([...assassins, ...supports], 1, used));
  } else if (strategy === 'random') {
    team.push(...pickRandom(allIds, 4, used));
  } else {
    // Balanced: 1 Tank + 1 Front/Mid DPS + 1 Backline DPS + 1 Support/Healer
    team.push(...pickRandom(tanks, 1, used));
    team.push(...pickRandom([...bruisers, ...assassins], 1, used));
    team.push(...pickRandom([...mages, 'lyra_windpiercer', 'sylvia_frostbow'], 1, used));
    team.push(...pickRandom(supports, 1, used));
  }

  if (team.length < 4) {
    team.push(...pickRandom(allIds, 4 - team.length, used));
  }
  return team.slice(0, 4);
}

const characterViewerState = {
  mode: 'grid',
  filter: 'all',
  index: 0,
  tab: 'skills',
};

const skillPreviewState = {
  character: null,
  skillKey: null,
  timers: [],
  casterRig: null,
};

function openCharacterViewer(initialIndex = null) {
  const modal = document.getElementById('character-viewer-modal');
  if (!modal) return;
  if (typeof initialIndex === 'number' && initialIndex >= 0 && initialIndex < CHARACTER_TEMPLATES.length) {
    characterViewerState.index = initialIndex;
    characterViewerState.mode = 'detail';
  } else {
    characterViewerState.mode = 'grid';
  }
  modal.classList.remove('hidden');
  renderCharacterViewer();
}

function closeCharacterViewer() {
  closeSkillPreview();
  document.getElementById('character-viewer-modal')?.classList.add('hidden');
}

function stepCharacterViewer(delta) {
  const total = CHARACTER_TEMPLATES.length;
  if (!total) return;
  characterViewerState.index = (characterViewerState.index + delta + total) % total;
  renderCharacterViewer();
}

function clearSkillPreviewTimers() {
  skillPreviewState.timers.forEach((t) => clearTimeout(t));
  skillPreviewState.timers = [];
}

function closeSkillPreview() {
  clearSkillPreviewTimers();
  skillPreviewState.casterRig = null;
  document.getElementById('skill-preview-modal')?.classList.add('hidden');
}

function classifySkillPreview(character, skillKey) {
  const isUb = skillKey === 'ub';
  const isPassive = skillKey.startsWith('passive_');
  const passiveIdx = isPassive ? Number(skillKey.split('_')[1] || 0) : -1;
  const skillObj = isUb
    ? character.ub
    : isPassive
    ? (character.passives || [])[passiveIdx]
    : (character.autoSkills || {})[skillKey];

  const action = skillObj?.action || '';
  const desc = (skillObj?.desc || '').toLowerCase();
  const isMagic = character.damageType === 'magical';
  const baseAtk = isMagic ? (character.stats?.matk || 6000) : (character.stats?.patk || 6000);

  if (isPassive) {
    return {
      skillObj,
      badge: 'Passive',
      scenario: 'self',
      fxColor: '#10b981',
      popupText: desc.includes('physical defense')
        ? '+30% PDEF'
        : desc.includes('magic defense')
        ? '+30% MDEF'
        : desc.includes('magic atk')
        ? '+MATK'
        : '+PATK',
      popupClass: 'text-emerald-300 font-extrabold text-lg sm:text-xl',
      grantsShield: null,
      displacement: null,
    };
  }

  const selfActions = new Set(['buff_self_def_shield', 'buff_self_matk']);
  const allyAoeActions = new Set([
    'ub_sanctuary_dew',
    'ub_magic_barrier_all',
    'ub_hourglass_paradox',
    'ub_nozomi_idol_stage',
    'buff_all_allies_atk_haste',
    'heal_allies_range',
  ]);
  const allySingleActions = new Set([
    'heal_lowest_hp',
    'heal_lowest_tp',
    'heal_lowest_shield',
    'shield_lowest_hp',
    'buff_ally_haste_tp',
    'buff_ally_tp',
  ]);
  const enemyAoeActions = new Set([
    'ub_aegis_cataclysm',
    'ub_cataclysmic_meteor',
    'ub_dawnstar_judgment',
    'ub_ninon_frontline_aoe',
    'ub_llima_frontline_aoe',
    'ub_monica_frontline_aoe',
    'ub_tsumugi_capture_web',
    'phys_aoe_750_kill_tp',
    'phys_aoe_700_slow',
    'phys_front_aoe_stun',
    'mag_aoe_burn',
  ]);

  let scenario = 'enemy_single';
  if (selfActions.has(action)) scenario = 'self';
  else if (allyAoeActions.has(action)) scenario = 'ally_aoe';
  else if (allySingleActions.has(action)) scenario = 'ally_single';
  else if (enemyAoeActions.has(action)) scenario = 'enemy_aoe';

  const grantsShield =
    action === 'ub_magic_barrier_all'
      ? 'magic'
      : action === 'buff_self_def_shield' ||
        action === 'heal_lowest_shield' ||
        action === 'shield_lowest_hp' ||
        action === 'ub_sanctuary_dew' ||
        action === 'ub_dawnstar_judgment'
      ? 'universal'
      : null;

  const grantsSelfShield =
    action === 'buff_self_def_shield' || action === 'ub_aegis_cataclysm' ? 'universal' : null;

  const displacement =
    action === 'ub_tsumugi_capture_web'
      ? 'tsumugi_ub'
      : action === 'phys_second_nearest_pull'
      ? 'pull'
      : action === 'phys_front_knockback' || (action === 'phys_def_shred' && Boolean(skillObj?.knockbackPos))
      ? 'knockback'
      : null;

  const mult = skillObj?.mult || (isUb ? 2.4 : 1.35);
  const estVal = Math.round(baseAtk * mult * 0.42);

  let popupText = `${estVal.toLocaleString()}`;
  let popupClass = isMagic
    ? 'pcrd-num-magic font-mono-num text-2xl sm:text-3xl'
    : 'pcrd-num-phys font-mono-num text-2xl sm:text-3xl';
  let fxColor = isMagic ? '#c084fc' : '#f43f5e';

  if (scenario === 'self') {
    fxColor = '#38bdf8';
    popupText = action === 'buff_self_matk' ? '+38% MATK' : '+DEF & SHIELD';
    popupClass = 'pcrd-num-shield font-mono-num text-lg sm:text-xl';
  } else if (scenario === 'ally_single' || scenario === 'ally_aoe') {
    fxColor = action.includes('barrier') || action.includes('shield') ? '#a855f7' : '#4ade80';
    if (action === 'buff_ally_tp') {
      popupText = `+${skillObj?.tpGrant || 260} TP`;
      popupClass = 'pcrd-num-tp font-mono-num text-lg sm:text-xl';
    } else if (action === 'buff_ally_haste_tp' || action === 'buff_all_allies_atk_haste' || action === 'ub_hourglass_paradox') {
      popupText = '+HASTE / +ATK';
      popupClass = 'pcrd-num-tp font-mono-num text-lg sm:text-xl';
    } else if (action === 'ub_magic_barrier_all') {
      popupText = `+${Math.round(baseAtk * 0.9).toLocaleString()} M.WARD`;
      popupClass = 'pcrd-num-shield font-mono-num text-lg sm:text-xl';
    } else if (action === 'ub_nozomi_idol_stage') {
      popupText = '+28% PATK & TAUNT';
      popupClass = 'pcrd-num-tp font-mono-num text-lg sm:text-xl';
    } else {
      popupText = `+${Math.round(baseAtk * (skillObj?.healMult || 1.4) * 0.55).toLocaleString()}`;
      popupClass = 'pcrd-num-heal font-mono-num text-2xl sm:text-3xl';
    }
  } else if (action === 'steal_tp_highest_matk') {
    fxColor = '#a855f7';
    popupText = `-${skillObj?.tpSteal || 260} TP`;
    popupClass = 'pcrd-num-tp font-mono-num text-lg sm:text-xl';
  }

  const targetBuffs = [];
  const targetDebuffs = [];
  const selfBuffs = [];

  if (action === 'buff_self_def_shield' || action === 'ub_llima_frontline_aoe') {
    selfBuffs.push({ type: 'defUp', remaining: 5 });
  }
  if (action === 'llima_opening_rush') {
    selfBuffs.push({ type: 'pdefUp', remaining: 5 });
  }
  if (action === 'buff_self_matk') {
    selfBuffs.push({ type: 'matkUp', remaining: 5 });
  }
  if (action === 'ub_aegis_cataclysm') {
    selfBuffs.push({ type: 'taunt', remaining: 4.5 });
  }
  if (action === 'ub_nozomi_idol_stage') {
    selfBuffs.push({ type: 'defUp', remaining: 6 }, { type: 'taunt', remaining: 6 });
    targetBuffs.push({ type: 'patkUp', remaining: 6 });
  }
  if (action === 'buff_ally_haste_tp' || action === 'ub_hourglass_paradox') {
    targetBuffs.push({ type: 'haste', remaining: 5 });
  }
  if (action === 'buff_all_allies_atk_haste') {
    targetBuffs.push({ type: 'atkUp', remaining: 6 }, { type: 'haste', remaining: 6 });
  }
  if (action === 'ub_magic_barrier_all') {
    targetBuffs.push({ type: 'mdefUp', remaining: 6 });
  }
  if (action === 'shield_lowest_hp') {
    targetBuffs.push({ type: 'defUp', remaining: 5 });
  }

  if (
    action === 'phys_front_stun' ||
    action === 'phys_front_aoe_stun' ||
    (action === 'ub_aegis_cataclysm' && desc.includes('stun')) ||
    action === 'ub_tsumugi_capture_web'
  ) {
    targetDebuffs.push({ type: 'stun', remaining: 2.5 });
  }
  if (displacement) {
    targetDebuffs.push({ type: 'knockback', remaining: 1.5 });
  }
  if (action === 'ub_phantom_severance') {
    targetDebuffs.push({ type: 'silence', remaining: 2.0 }, { type: 'defDown', remaining: 5 });
  }
  if (action === 'phys_def_shred' || action === 'flank_shred_strike') {
    targetDebuffs.push({ type: 'defDown', remaining: 5 });
  }
  if (action === 'mag_mdef_shred' || action === 'ub_cataclysmic_meteor') {
    targetDebuffs.push({ type: 'mdefDown', remaining: 5 });
  }
  if (action === 'phys_highest_matk_debuff' || action === 'ub_tamaki_cat_strike') {
    targetDebuffs.push({ type: 'matkDown', remaining: 5 });
  }
  if (action === 'mag_slow_enemy' || action === 'phys_aoe_700_slow') {
    targetDebuffs.push({ type: 'slow', remaining: 5 });
  }
  if (action === 'mag_aoe_burn' || action === 'ub_cataclysmic_meteor') {
    const burnSec = Math.round(skillObj?.burnDuration || (action === 'ub_cataclysmic_meteor' ? 5 : 4));
    targetDebuffs.push({ type: 'burn', remaining: burnSec });
  }

  // Determine how many enemy rows (1=Front, 2=Front+Mid, 3=Front+Mid+Back) an AoE reaches
  let aoeTargetCount = 1;
  if (scenario === 'enemy_aoe') {
    if (
      action === 'ub_llima_frontline_aoe' ||
      action === 'ub_ninon_frontline_aoe' ||
      action === 'ub_monica_frontline_aoe' ||
      action === 'phys_front_aoe_stun'
    ) {
      aoeTargetCount = 1;
    } else if (
      action === 'mag_aoe_burn' ||
      action === 'ub_dawnstar_judgment' ||
      action === 'ub_tempest_piercer'
    ) {
      aoeTargetCount = 2;
    } else {
      aoeTargetCount = 3;
    }
  }

  const isSelfDefBuff =
    action === 'buff_self_def_shield' ||
    (isPassive && (desc.includes('physical defense') || desc.includes('magic defense')));

  return {
    skillObj,
    badge: isUb ? 'Union Burst' : skillKey === 'auto' ? 'Auto' : skillKey === 'skill1' ? 'Skill 1' : 'Skill 2',
    scenario,
    fxColor,
    popupText,
    popupClass,
    grantsShield,
    grantsSelfShield,
    displacement,
    selfBuffs,
    targetBuffs,
    targetDebuffs,
    aoeTargetCount,
    isSelfDefBuff,
    mult,
    damageType: isMagic ? 'magical' : 'physical',
  };
}

const PREVIEW_DUMMY_ARCHETYPES = {
  front: { role: 'Tank', maxHp: 36000, patk: 3600, matk: 0, pdef: 660, mdef: 380 },
  middle: { role: 'Support', maxHp: 24000, patk: 0, matk: 6200, pdef: 300, mdef: 460 },
  back: { role: 'DPS', maxHp: 19500, patk: 7600, matk: 0, pdef: 210, mdef: 280 },
};

function computePreviewDamage(attackerStats, targetStats, mult, damageType, shredMult = 1.0, atkBuffMult = 1.0) {
  const isMag = damageType === 'magical';
  const atk = (isMag ? attackerStats?.matk || 6000 : attackerStats?.patk || 6000) * atkBuffMult;
  const pen = isMag ? attackerStats?.mpen || 0 : attackerStats?.ppen || 0;
  const rawDef = (isMag ? targetStats?.mdef || 250 : targetStats?.pdef || 250) * shredMult;
  const effDef = Math.max(0, rawDef - pen);
  const mitigation = 100 / (100 + effDef * 0.6);
  return Math.max(80, Math.round(atk * (mult || 1.0) * mitigation));
}

function openSkillPreview(character, skillKey) {
  skillPreviewState.character = character;
  skillPreviewState.skillKey = skillKey;
  const modal = document.getElementById('skill-preview-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  playSkillPreviewAnimation();
}

function buildPersonalizedPreviewSteps(c, skillKey) {
  if (skillKey === 'rotation_loop') {
    const opening = (c.openingLoop || []).map((k, i) => ({
      skillKey: k,
      phaseLabel: `INITIAL ${i + 1}`,
      phaseKind: 'opening',
    }));
    const main = (c.mainLoop || []).map((k, i) => ({
      skillKey: k,
      phaseLabel: `LOOP ${i + 1}`,
      phaseKind: 'main',
    }));
    return [...opening, ...main];
  }

  const info = classifySkillPreview(c, skillKey);
  const action = info.skillObj?.action || '';
  const hasDefShred =
    info.targetDebuffs.some((d) => d.type === 'defDown' || d.type === 'mdefDown') ||
    action === 'phys_def_shred' ||
    action === 'flank_shred_strike' ||
    action === 'mag_mdef_shred' ||
    action === 'ub_cataclysmic_meteor' ||
    action === 'ub_phantom_severance';
  const hasSelfAtkBuff =
    info.selfBuffs.some((b) => b.type === 'matkUp' || b.type === 'patkUp' || b.type === 'atkUp') ||
    action === 'buff_self_matk' ||
    action === 'buff_all_allies_atk_haste';

  // Self-buffing defensive skills: Dummy attacks before buff -> Cast buff -> Dummy attacks after buff
  if (info.isSelfDefBuff) {
    return [
      { skillKey: 'dummy_attack', phaseLabel: '1. Incoming Attack (Before Buff)', compareMode: 'def_before' },
      { skillKey, phaseLabel: `2. Cast ${info.skillObj.name}`, compareMode: 'def_apply' },
      { skillKey: 'dummy_attack', phaseLabel: '3. Incoming Attack (After Buff)', compareMode: 'def_after' },
    ];
  }

  // Personalized comparison sequence: Baseline AA -> Debuff/Buff Skill -> Boosted AA
  if (hasDefShred && c.autoSkills?.auto) {
    return [
      { skillKey: 'auto', phaseLabel: '1. Baseline Auto', compareMode: 'before' },
      { skillKey, phaseLabel: `2. Apply ${info.skillObj.name}`, compareMode: 'apply' },
      { skillKey: 'auto', phaseLabel: '3. Auto vs Shredded DEF', compareMode: 'after_shred' },
    ];
  }
  if (hasSelfAtkBuff && c.autoSkills?.auto) {
    return [
      { skillKey: 'auto', phaseLabel: '1. Baseline Auto', compareMode: 'before' },
      { skillKey, phaseLabel: `2. Cast ${info.skillObj.name}`, compareMode: 'apply' },
      { skillKey: 'auto', phaseLabel: '3. Buffed Auto', compareMode: 'after_buff' },
    ];
  }

  return [{ skillKey, phaseLabel: info.badge, compareMode: 'single' }];
}

function playSkillPreviewAnimation() {
  clearSkillPreviewTimers();
  const c = skillPreviewState.character;
  const skillKey = skillPreviewState.skillKey;
  if (!c || !skillKey) return;

  const steps = buildPersonalizedPreviewSteps(c, skillKey);
  if (!steps.length) return;

  const isLoopPreview = skillKey === 'rotation_loop';
  const primaryInfo = isLoopPreview ? null : classifySkillPreview(c, skillKey);
  if (!isLoopPreview && !primaryInfo?.skillObj) return;

  const titleEl = document.getElementById('skill-preview-title');
  const subEl = document.getElementById('skill-preview-subtitle');
  const descEl = document.getElementById('skill-preview-desc');
  const unitsLayer = document.getElementById('skill-preview-units');
  const fxLayer = document.getElementById('skill-preview-fx');
  if (!unitsLayer || !fxLayer) return;

  const stepInfos = steps.map((st) => ({
    ...st,
    info: st.skillKey === 'dummy_attack' ? null : classifySkillPreview(c, st.skillKey),
  }));
  const mainLoopStartIdx = isLoopPreview
    ? Math.max(0, stepInfos.findIndex((s) => s.phaseKind === 'main'))
    : 0;

  const needsEnemy = stepInfos.some(
    (s) => s.skillKey === 'dummy_attack' || s.info?.scenario === 'enemy_single' || s.info?.scenario === 'enemy_aoe'
  );
  const needsEnemyAoe = stepInfos.some((s) => s.info?.scenario === 'enemy_aoe');
  const needsAlly = stepInfos.some((s) => s.info?.scenario === 'ally_single' || s.info?.scenario === 'ally_aoe');
  const needsAllyAoe = stepInfos.some((s) => s.info?.scenario === 'ally_aoe');
  const isPureSelf = !needsEnemy && !needsAlly;

  const isMelee = c.positionZone === 'vanguard' || c.positionZone === 'frontline';
  const isMid = c.positionZone === 'flank' || c.positionZone === 'center' || c.positionZone === 'pivot';

  // Start vs engaged X positions so units walk into battle range accurately
  const casterStartX = isPureSelf ? 50 : needsAlly && !needsEnemy ? (needsAllyAoe ? 20 : 36) : 14;
  const casterEngagedX = isPureSelf
    ? 50
    : needsAlly && !needsEnemy
    ? needsAllyAoe
      ? 24
      : 40
    : isMelee
    ? 40
    : isMid
    ? 30
    : 20;

  const allyDummies = needsAlly
    ? needsAllyAoe && !needsEnemy
      ? [
          { id: 'ally-0', startX: 43, x: 43, y: 60, label: 'Ally #1', side: 'player' },
          { id: 'ally-1', startX: 56, x: 56, y: 66, label: 'Ally #2', side: 'player' },
          { id: 'ally-2', startX: 69, x: 69, y: 62, label: 'Ally #3', side: 'player' },
        ]
      : [{ id: 'ally-0', startX: needsEnemy ? 12 : 58, x: needsEnemy ? 14 : 58, y: 66, label: 'Ally Dummy', side: 'player' }]
    : [];

  const frontEngageX = isMelee ? 54 : 46;
  const enemyDummies = needsEnemy
    ? needsEnemyAoe
      ? [
          { id: 'enemy-0', startX: 78, x: frontEngageX, y: 62, label: 'Front (Tank)', side: 'enemy', stats: PREVIEW_DUMMY_ARCHETYPES.front },
          { id: 'enemy-1', startX: 88, x: Math.min(76, frontEngageX + 18), y: 66, label: 'Middle (Supp)', side: 'enemy', stats: PREVIEW_DUMMY_ARCHETYPES.middle },
          { id: 'enemy-2', startX: 95, x: Math.min(89, frontEngageX + 32), y: 60, label: 'Back (DPS)', side: 'enemy', stats: PREVIEW_DUMMY_ARCHETYPES.back },
        ]
      : [{ id: 'enemy-0', startX: 84, x: frontEngageX, y: 64, label: 'Front (Tank)', side: 'enemy', stats: PREVIEW_DUMMY_ARCHETYPES.front }]
    : [];

  const allDummies = [...allyDummies, ...enemyDummies];
  let currentCasterX = casterStartX;
  const currentDummyX = new Map(allDummies.map((d) => [d.id, d.startX]));

  if (titleEl) {
    titleEl.textContent = isLoopPreview
      ? `${c.name} — Sample Action Loop`
      : `${c.name} — ${primaryInfo.skillObj.name}`;
  }
  if (descEl) {
    descEl.textContent = isLoopPreview
      ? `Initial: ${(c.openingLoop || []).map((k) => k.toUpperCase()).join(' → ')}  |  Main Loop: ${(c.mainLoop || []).map((k) => k.toUpperCase()).join(' → ')} (loops continuously)`
      : primaryInfo.skillObj.desc || '';
  }

  const casterUsesRig = typeof hasCharacterRig === 'function' && hasCharacterRig(c.id);
  skillPreviewState.casterRig = {
    templateId: c.id,
    name: c.name,
    side: 'player',
    activeAnimKey: 'idle',
    animProgress: 0,
    rigIdleTime: 0,
    phase: 'idle',
    phaseElapsed: 0,
    phaseDuration: 0.5,
  };

  const setPreviewCasterState = (cssAnim, rigAnimKey = 'idle', rigPhase = 'idle', durationSec = 0.5) => {
    const casterAnimEl = document.getElementById('preview-caster-anim');
    if (skillPreviewState.casterRig) {
      skillPreviewState.casterRig.activeAnimKey = rigAnimKey;
      skillPreviewState.casterRig.phase = rigPhase;
      skillPreviewState.casterRig.phaseElapsed = 0;
      skillPreviewState.casterRig.phaseDuration = Math.max(0.05, durationSec);
      skillPreviewState.casterRig.animProgress = rigPhase === 'strike' ? 0.5 : 0;
    }
    if (!casterAnimEl) return;
    const riggedNow = typeof hasCharacterRig === 'function' && hasCharacterRig(c.id);
    if (riggedNow && cssAnim !== 'anim-hit' && cssAnim !== 'anim-knockback') {
      casterAnimEl.className = '';
    } else {
      casterAnimEl.className = cssAnim;
    }
  };

  unitsLayer.innerHTML = `
    <div id="preview-caster" class="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-500 ease-out" style="left:${casterStartX}%; top:64%;">
      <div id="preview-caster-sprite" class="chibi-closeup-sprite relative flex flex-col items-center justify-center">
        <div id="preview-caster-icons"></div>
        <div id="preview-caster-anim" class="${casterUsesRig ? '' : 'anim-idle'}">
          ${renderCharacterSpriteSVG(skillPreviewState.casterRig, false)}
        </div>
        <div id="preview-caster-shield" class="hidden unit-shield-bubble is-universal"></div>
        <div class="unit-ground-shadow"></div>
      </div>
      <span class="mt-1 px-2 py-0.5 rounded-full bg-slate-950/80 text-[10px] font-bold text-amber-200">${c.name.split(' ')[0]}</span>
    </div>
    ${allDummies
      .map(
        (d) => `
      <div id="preview-dummy-${d.id}" class="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-500 ease-out" style="left:${d.startX}%; top:${d.y}%;">
        <div class="chibi-closeup-sprite relative flex flex-col items-center justify-center">
          <div id="preview-dummy-icons-${d.id}"></div>
          <div id="preview-dummy-anim-${d.id}" class="anim-idle">
            ${renderCharacterSpriteSVG({ templateId: 'training_dummy', side: d.side }, false)}
          </div>
          <div id="preview-dummy-shield-${d.id}" class="hidden unit-shield-bubble is-universal"></div>
          <div class="unit-ground-shadow"></div>
        </div>
        <span class="mt-1 px-2 py-0.5 rounded-full bg-slate-950/80 text-[10px] font-bold ${d.side === 'player' ? 'text-emerald-300' : 'text-rose-300'}">${d.label}</span>
      </div>
    `
      )
      .join('')}
  `;

  const persistentCasterBuffs = [];
  const persistentAllyBuffs = [];
  const persistentEnemyDebuffs = [];

  function runStep(stepIdx) {
    if (stepIdx >= stepInfos.length) {
      const replayTimer = setTimeout(() => {
        const modal = document.getElementById('skill-preview-modal');
        if (!modal || modal.classList.contains('hidden')) return;
        if (isLoopPreview) {
          // Sample Action Loop: after Initial + Loop, repeat Main Loop continuously until Replay is clicked
          runStep(mainLoopStartIdx);
        } else {
          playSkillPreviewAnimation();
        }
      }, 1150);
      skillPreviewState.timers.push(replayTimer);
      return;
    }

    const step = stepInfos[stepIdx];

    // Special step: Front Dummy attacks caster (used for before/after defensive self-buff comparison)
    if (step.skillKey === 'dummy_attack') {
      const attackerDummy = enemyDummies[0];
      const casterAnim = document.getElementById('preview-caster-anim');
      const atkAnim = attackerDummy ? document.getElementById(`preview-dummy-anim-${attackerDummy.id}`) : null;
      const isAfterBuff = step.compareMode === 'def_after';

      if (subEl) {
        subEl.textContent = `${step.phaseLabel} (${stepIdx + 1}/${stepInfos.length}) • Auto-Replays`;
      }
      if (atkAnim) atkAnim.className = 'anim-windup';

      fxLayer.innerHTML = `
        <div class="absolute top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-slate-950/85 border border-amber-300/70 text-[11px] font-extrabold text-amber-200 shadow">
          ${step.phaseLabel}
        </div>
      `;

      const tDummyStrike = setTimeout(() => {
        if (atkAnim) atkAnim.className = 'anim-strike';
        if (casterAnim) casterAnim.className = 'anim-hit';

        const hasShield = !document.getElementById('preview-caster-shield')?.classList.contains('hidden');
        const defMult = isAfterBuff ? 1.35 : 1.0;
        const rawDmg = computePreviewDamage(
          PREVIEW_DUMMY_ARCHETYPES.front,
          { pdef: (c.stats?.pdef || 300) * defMult, mdef: (c.stats?.mdef || 300) * defMult },
          1.15,
          'physical'
        );

        const dmgText = isAfterBuff && hasShield ? 'ABSORBED!' : `${rawDmg.toLocaleString()}`;
        const dmgClass =
          isAfterBuff && hasShield
            ? 'pcrd-num-shield font-mono-num text-lg sm:text-xl'
            : 'pcrd-num-phys font-mono-num text-2xl sm:text-3xl';
        const badgeText = isAfterBuff ? (hasShield ? 'SHIELDED!' : 'REDUCED DMG!') : 'BEFORE BUFF';

        fxLayer.insertAdjacentHTML(
          'beforeend',
          `<div class="floating-popup absolute z-30 ${isAfterBuff ? 'text-sky-300' : 'text-slate-200'} font-extrabold text-xs" style="left:${currentCasterX}%; top:30%;">${badgeText}</div>
           <div class="floating-popup absolute z-30 ${dmgClass}" style="left:${currentCasterX}%; top:42%;">${dmgText}</div>`
        );

        const tDummyEnd = setTimeout(() => {
          if (atkAnim) atkAnim.className = 'anim-idle';
          setPreviewCasterState('anim-idle', 'idle', 'idle', 0.5);
          const tNext = setTimeout(() => runStep(stepIdx + 1), 620);
          skillPreviewState.timers.push(tNext);
        }, 480);
        skillPreviewState.timers.push(tDummyEnd);
      }, 420);
      skillPreviewState.timers.push(tDummyStrike);
      return;
    }

    const info = step.info;
    const isSelfStep = info.scenario === 'self';
    const isAllyStep = info.scenario === 'ally_single' || info.scenario === 'ally_aoe';
    const isAoeStep = info.scenario === 'enemy_aoe' || info.scenario === 'ally_aoe';

    if (subEl) {
      subEl.textContent = isLoopPreview
        ? `${step.phaseLabel}: ${info.skillObj.name} • Loops Main Rotation (Click Replay for Initial)`
        : `${step.phaseLabel}: ${info.skillObj.name} (${stepIdx + 1}/${stepInfos.length}) • Auto-Replays`;
    }

    const casterAnim = document.getElementById('preview-caster-anim');
    setPreviewCasterState('anim-windup', step.skillKey, 'windup', 0.52);

    // Red ground warning circle for enemy AoE skills showing exact range coverage
    let aoeWarningHtml = '';
    if (info.scenario === 'enemy_aoe' && enemyDummies.length > 0) {
      const hitDummies = enemyDummies.slice(0, info.aoeTargetCount || 3);
      const xs = hitDummies.map((d) => currentDummyX.get(d.id) ?? d.x);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const centerX = (minX + maxX) / 2;
      const widthPct = Math.max(18, maxX - minX + 18);
      aoeWarningHtml = `<div class="preview-aoe-warning" style="left:${centerX}%; top:71%; width:${widthPct}%;"></div>`;
    }

    const callout = info.skillObj.callout || info.skillObj.name;
    fxLayer.innerHTML = `
      ${aoeWarningHtml}
      <div class="absolute top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-slate-950/85 border border-amber-300/70 text-[11px] font-extrabold text-amber-200 shadow">
        ${step.phaseLabel} — ${info.skillObj.name}
      </div>
      <div class="windup-speech-bubble absolute z-30 px-3 py-1 rounded-2xl bg-white text-slate-950 border-2 border-amber-400 text-xs font-extrabold shadow-lg" style="left:${currentCasterX}%; top:26%;">
        "${callout}"
      </div>
    `;

    const tStrike = setTimeout(() => {
      setPreviewCasterState('anim-strike', step.skillKey, 'strike', 0.72);

      if (info.selfBuffs?.length) {
        persistentCasterBuffs.push(...info.selfBuffs);
      }
      if (isSelfStep && !info.selfBuffs?.length && step.skillKey.startsWith('passive_')) {
        const pType = info.popupText.includes('PDEF')
          ? 'pdefUp'
          : info.popupText.includes('MDEF')
          ? 'mdefUp'
          : info.popupText.includes('MATK')
          ? 'matkUp'
          : 'patkUp';
        persistentCasterBuffs.push({ type: pType, remaining: 5 });
      }

      const casterIconsEl = document.getElementById('preview-caster-icons');
      if (casterIconsEl && persistentCasterBuffs.length) {
        casterIconsEl.innerHTML = renderStatusIconsHtml(persistentCasterBuffs, []);
      }

      if (info.grantsSelfShield) {
        document.getElementById('preview-caster-shield')?.classList.remove('hidden');
      }

      const fxItems = [
        `<div class="absolute top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-slate-950/85 border border-amber-300/70 text-[11px] font-extrabold text-amber-200 shadow">${step.phaseLabel} — ${info.skillObj.name}</div>`,
      ];

      if (info.grantsSelfShield && !isSelfStep) {
        const shieldVal = Math.round((c.stats?.maxHp || 30000) * 0.28);
        fxItems.push(
          `<div class="floating-popup absolute z-30 pcrd-num-shield font-mono-num text-lg sm:text-xl" style="left:${currentCasterX}%; top:34%;">+${shieldVal.toLocaleString()}</div>`
        );
      }

      let displayPopup = info.popupText;
      let compareBadge = '';
      if (step.compareMode === 'before') {
        compareBadge = 'BASELINE';
      } else if (step.compareMode === 'after_shred' || step.compareMode === 'after_buff') {
        const numeric = Number(String(info.popupText).replace(/,/g, ''));
        if (Number.isFinite(numeric) && numeric > 0) {
          const mult = step.compareMode === 'after_shred' ? 1.28 : 1.35;
          displayPopup = Math.round(numeric * mult).toLocaleString();
          compareBadge = step.compareMode === 'after_shred' ? '+28% VS SHRED!' : '+35% BUFFED!';
        }
      }

      if (isSelfStep) {
        fxItems.push(`
          <div class="preview-fx-ring absolute" style="left:${currentCasterX}%; top:60%; border:4px solid ${info.fxColor}; box-shadow:0 0 24px ${info.fxColor};"></div>
          <div class="floating-popup absolute z-30 ${info.popupClass}" style="left:${currentCasterX}%; top:36%;">${displayPopup}</div>
        `);
        if (info.grantsShield) {
          document.getElementById('preview-caster-shield')?.classList.remove('hidden');
        }
      } else {
        const activeTargets = isAllyStep
          ? isAoeStep
            ? allyDummies
            : allyDummies.slice(0, 1)
          : isAoeStep
          ? enemyDummies.slice(0, info.aoeTargetCount || 3)
          : enemyDummies.slice(0, 1);

        if (activeTargets.length > 0 && !isMelee) {
          const t0 = activeTargets[0];
          const t0X = currentDummyX.get(t0.id) ?? t0.x;
          const beamLeft = Math.min(currentCasterX, t0X) + 4;
          const beamWidth = Math.max(8, Math.abs(t0X - currentCasterX) - 8);
          fxItems.push(`
            <div class="preview-fx-beam absolute" style="left:${beamLeft}%; top:60%; width:${beamWidth}%; background:linear-gradient(90deg, ${info.fxColor}, #ffffff); box-shadow:0 0 18px ${info.fxColor};"></div>
          `);
        }

        if (isAllyStep && info.targetBuffs?.length) {
          persistentAllyBuffs.push(...info.targetBuffs);
        }
        if (!isAllyStep && info.targetDebuffs?.length) {
          persistentEnemyDebuffs.push(...info.targetDebuffs);
        }

        activeTargets.forEach((d, idx) => {
          const dEl = document.getElementById(`preview-dummy-${d.id}`);
          const dAnim = document.getElementById(`preview-dummy-anim-${d.id}`);
          const dIcons = document.getElementById(`preview-dummy-icons-${d.id}`);
          const dShield = document.getElementById(`preview-dummy-shield-${d.id}`);
          let dx = currentDummyX.get(d.id) ?? d.x;

          if (isAllyStep) {
            if (info.grantsShield && dShield) {
              dShield.className = `unit-shield-bubble ${info.grantsShield === 'magic' ? 'is-magic' : 'is-universal'}`;
            }
            if (dIcons && persistentAllyBuffs.length) {
              dIcons.innerHTML = renderStatusIconsHtml(persistentAllyBuffs, []);
            }
          } else {
            if (dAnim) dAnim.className = info.displacement ? 'anim-knockback' : 'anim-hit';
            if (dIcons && persistentEnemyDebuffs.length) {
              dIcons.innerHTML = renderStatusIconsHtml([], persistentEnemyDebuffs);
            }
            if (dEl) {
              if (info.displacement === 'knockback') {
                dx = Math.min(92, dx + 12);
                currentDummyX.set(d.id, dx);
                dEl.style.left = `${dx}%`;
                fxItems.push(`<div class="floating-popup absolute z-30 text-amber-300 font-extrabold text-xs" style="left:${dx}%; top:${d.y - 34}%;">KNOCKBACK!</div>`);
              } else if (info.displacement === 'pull') {
                dx = Math.max(currentCasterX + 12, dx - 16);
                currentDummyX.set(d.id, dx);
                dEl.style.left = `${dx}%`;
                fxItems.push(`<div class="floating-popup absolute z-30 text-rose-300 font-extrabold text-xs" style="left:${dx}%; top:${d.y - 34}%;">PULL!</div>`);
              } else if (info.displacement === 'tsumugi_ub') {
                if (idx === 0) {
                  dx = Math.min(92, dx + 12);
                  currentDummyX.set(d.id, dx);
                  dEl.style.left = `${dx}%`;
                  fxItems.push(`<div class="floating-popup absolute z-30 text-amber-300 font-extrabold text-xs" style="left:${dx}%; top:${d.y - 34}%;">PUSH!</div>`);
                }
                if (idx === activeTargets.length - 1) {
                  dx = Math.max(currentCasterX + 14, dx - 16);
                  currentDummyX.set(d.id, dx);
                  dEl.style.left = `${dx}%`;
                  fxItems.push(`<div class="floating-popup absolute z-30 text-rose-300 font-extrabold text-xs" style="left:${dx}%; top:${d.y - 34}%;">PULL!</div>`);
                }
              }
            }
          }

          if (compareBadge) {
            fxItems.push(
              `<div class="floating-popup absolute z-30 ${
                step.compareMode === 'before' ? 'text-slate-200' : 'text-amber-300'
              } font-extrabold text-xs" style="left:${dx}%; top:${d.y - 36}%;">${compareBadge}</div>`
            );
          }

          // Compute per-dummy damage using each dummy's Tank/Support/DPS stats for offensive hits
          let targetPopup = displayPopup;
          if (!isAllyStep && d.stats && info.skillObj?.action !== 'steal_tp_highest_matk') {
            const shredMult = step.compareMode === 'after_shred' ? 0.72 : 1.0;
            const atkBuffMult = step.compareMode === 'after_buff' ? 1.35 : 1.0;
            const calcDmg = computePreviewDamage(c.stats, d.stats, info.mult, info.damageType, shredMult, atkBuffMult);
            targetPopup = calcDmg.toLocaleString();
          }

          fxItems.push(`
            <div class="preview-fx-ring absolute" style="left:${dx}%; top:60%; border:3px solid ${info.fxColor}; box-shadow:0 0 18px ${info.fxColor};"></div>
            <div class="floating-popup absolute z-30 ${info.popupClass}" style="left:${dx}%; top:${d.y - 20}%;">${targetPopup}</div>
          `);
        });
      }

      fxLayer.innerHTML = fxItems.join('');

      const tRecover = setTimeout(() => {
        setPreviewCasterState('anim-idle', 'idle', 'idle', 0.5);
        allDummies.forEach((d) => {
          const dAnim = document.getElementById(`preview-dummy-anim-${d.id}`);
          if (dAnim) dAnim.className = 'anim-idle';
        });

        // Realistic dummy counter-attack (skip during explicit dummy_attack comparison sequences)
        const shouldCounter =
          enemyDummies.length > 0 &&
          step.compareMode !== 'def_apply' &&
          !info.targetDebuffs?.some((deb) => deb.type === 'stun');

        if (shouldCounter) {
          const attackerDummy = enemyDummies[0];
          const atkEl = document.getElementById(`preview-dummy-${attackerDummy.id}`);
          const atkAnim = document.getElementById(`preview-dummy-anim-${attackerDummy.id}`);
          const atkX = currentDummyX.get(attackerDummy.id) ?? attackerDummy.x;

          // If the dummy was knocked back, walk it back into melee range before striking
          const needsWalkBack = atkX - currentCasterX > 22;
          if (needsWalkBack && atkEl && atkAnim) {
            const walkX = Math.max(currentCasterX + 14, frontEngageX);
            currentDummyX.set(attackerDummy.id, walkX);
            atkAnim.className = 'anim-walk';
            atkEl.style.left = `${walkX}%`;
          }

          const tCounterStrike = setTimeout(() => {
            if (atkAnim) atkAnim.className = 'anim-strike';
            if (casterAnim) casterAnim.className = 'anim-hit';

            const hasShield = !document.getElementById('preview-caster-shield')?.classList.contains('hidden');
            const counterText = hasShield ? 'ABSORBED!' : '420';
            const counterClass = hasShield
              ? 'pcrd-num-shield font-mono-num text-base sm:text-lg'
              : 'pcrd-num-phys font-mono-num text-xl sm:text-2xl';

            fxLayer.insertAdjacentHTML(
              'beforeend',
              `<div class="floating-popup absolute z-30 ${counterClass}" style="left:${currentCasterX}%; top:42%;">${counterText}</div>`
            );

            const tCounterEnd = setTimeout(() => {
              if (atkAnim) atkAnim.className = 'anim-idle';
              setPreviewCasterState('anim-idle', 'idle', 'idle', 0.5);

              const tNext = setTimeout(() => runStep(stepIdx + 1), stepInfos.length > 1 ? 650 : 350);
              skillPreviewState.timers.push(tNext);
            }, 420);
            skillPreviewState.timers.push(tCounterEnd);
          }, needsWalkBack ? 420 : 120);
          skillPreviewState.timers.push(tCounterStrike);
        } else {
          const tNext = setTimeout(() => runStep(stepIdx + 1), stepInfos.length > 1 ? 650 : 350);
          skillPreviewState.timers.push(tNext);
        }
      }, 720);
      skillPreviewState.timers.push(tRecover);
    }, 520);

    skillPreviewState.timers.push(tStrike);
  }

  // Opening walk-in phase so character and dummies walk into realistic engagement range
  const needsWalkIn = !isPureSelf && (casterStartX !== casterEngagedX || enemyDummies.length > 0);
  if (needsWalkIn) {
    const casterEl = document.getElementById('preview-caster');
    if (casterStartX !== casterEngagedX) {
      setPreviewCasterState('anim-walk', 'walk', 'loop', 0.54);
    }
    enemyDummies.forEach((d) => {
      const dAnim = document.getElementById(`preview-dummy-anim-${d.id}`);
      if (dAnim) dAnim.className = 'anim-walk';
    });

    const tMove = setTimeout(() => {
      currentCasterX = casterEngagedX;
      if (casterEl) casterEl.style.left = `${casterEngagedX}%`;
      enemyDummies.forEach((d) => {
        currentDummyX.set(d.id, d.x);
        const dEl = document.getElementById(`preview-dummy-${d.id}`);
        if (dEl) dEl.style.left = `${d.x}%`;
      });

      const tArrived = setTimeout(() => {
        setPreviewCasterState('anim-idle', 'idle', 'idle', 0.5);
        enemyDummies.forEach((d) => {
          const dAnim = document.getElementById(`preview-dummy-anim-${d.id}`);
          if (dAnim) dAnim.className = 'anim-idle';
        });
        runStep(0);
      }, 540);
      skillPreviewState.timers.push(tArrived);
    }, 60);
    skillPreviewState.timers.push(tMove);
  } else {
    runStep(0);
  }
}

function renderCharacterViewer() {
  const body = document.getElementById('character-viewer-body');
  const counter = document.getElementById('viewer-counter-pill');
  const headerTitle = document.getElementById('viewer-header-title');
  const gridBtn = document.getElementById('viewer-grid-btn');
  if (!body || !CHARACTER_TEMPLATES.length) return;

  const total = CHARACTER_TEMPLATES.length;

  // MODE 1: Clean Character Selection Grid (All / Front / Middle / Back)
  if (characterViewerState.mode === 'grid') {
    if (headerTitle) headerTitle.textContent = 'Character Roster';
    if (counter) counter.textContent = `${total} Fighters`;
    if (gridBtn) gridBtn.classList.add('hidden');

    const zoneGroup = (z) =>
      z === 'vanguard' || z === 'frontline'
        ? 'front'
        : z === 'flank' || z === 'center' || z === 'pivot'
        ? 'middle'
        : 'back';

    const activeFilter = characterViewerState.filter || 'all';
    const filtered = CHARACTER_TEMPLATES.map((tpl, idx) => ({ tpl, idx })).filter(
      ({ tpl }) => activeFilter === 'all' || zoneGroup(tpl.positionZone) === activeFilter
    );

    body.innerHTML = `
      <div class="w-full pcrd-viewer-card rounded-3xl p-4 sm:p-6 flex flex-col gap-4 overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div class="flex items-center gap-1.5 flex-wrap">
            ${['all', 'front', 'middle', 'back']
              .map((f) => {
                const isAct = activeFilter === f;
                const label = f.charAt(0).toUpperCase() + f.slice(1);
                return `<button data-viewer-filter="${f}" class="px-4 py-1.5 rounded-full text-xs font-extrabold transition ${
                  isAct
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }">${label}</button>`;
              })
              .join('')}
          </div>
          <span class="text-xs font-bold text-slate-500">Click any character to view skills, stats &amp; action previews</span>
        </div>

        <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 sm:gap-3 overflow-y-auto pr-1">
          ${filtered
            .map(({ tpl, idx }) => {
              const grp = zoneGroup(tpl.positionZone).toUpperCase();
              const pwr = computeCharacterPower(tpl);
              return `
                <button data-viewer-char-idx="${idx}" title="${tpl.name} (${tpl.positionZone}) • Power ${pwr.toLocaleString()}" class="relative aspect-square rounded-2xl border-2 border-slate-300 hover:border-blue-500 hover:ring-2 hover:ring-blue-300/70 bg-gradient-to-b from-blue-900 to-indigo-950 overflow-hidden transition active:scale-95">
                  <div class="pcrd-head-portrait">
                    ${renderCharacterHeadSprite({ templateId: tpl.id, name: tpl.name })}
                  </div>
                  <span class="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-slate-950/80 text-[9px] font-extrabold text-amber-200">${grp}</span>
                  <div class="absolute inset-x-0 bottom-0 bg-slate-950/85 text-[10px] font-bold text-white truncate px-1 py-0.5 text-center">
                    ${tpl.name.split(' ')[0]}
                  </div>
                </button>
              `;
            })
            .join('')}
        </div>
      </div>
    `;

    body.querySelectorAll('[data-viewer-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        characterViewerState.filter = btn.getAttribute('data-viewer-filter') || 'all';
        renderCharacterViewer();
      });
    });

    body.querySelectorAll('[data-viewer-char-idx]').forEach((btn) => {
      const idx = Number(btn.getAttribute('data-viewer-char-idx')) || 0;
      const tpl = CHARACTER_TEMPLATES[idx];
      if (tpl) bindCharacterTooltip(btn, tpl);
      btn.addEventListener('click', () => {
        hideCharacterTooltip();
        characterViewerState.index = idx;
        characterViewerState.mode = 'detail';
        renderCharacterViewer();
      });
    });
    return;
  }

  // MODE 2: Full-Screen Split Character Detail Viewer
  if (headerTitle) headerTitle.textContent = 'Characters';
  if (gridBtn) gridBtn.classList.remove('hidden');

  characterViewerState.index = ((characterViewerState.index % total) + total) % total;
  const c = CHARACTER_TEMPLATES[characterViewerState.index];
  const s = c.stats || {};
  const power = computeCharacterPower(c);
  const attackRange = typeof c.attackRange === 'number'
    ? c.attackRange
    : (c.distance ?? POSITION_ZONES.find((p) => p.id === c.positionZone)?.rangeCenter ?? 465);

  if (counter) {
    counter.textContent = `${characterViewerState.index + 1} / ${total}`;
  }

  const autoSkillsList = Object.entries(c.autoSkills || {}).map(([key, sk]) => {
    const badgeLabel = key === 'auto' ? 'Auto' : key === 'skill1' ? 'Skill 1' : 'Skill 2';
    return `
      <div data-preview-skill="${key}" class="pcrd-viewer-subcard pcrd-skill-card-interactive rounded-2xl p-3.5 flex flex-col gap-1.5" title="Click to preview ${sk.name}">
        <div class="flex items-center justify-between gap-2">
          <div class="font-extrabold text-sm sm:text-base text-slate-800">${sk.name}</div>
          <div class="flex items-center gap-1.5 shrink-0">
            <span class="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-extrabold text-[10px]">▶ Preview</span>
            <span class="px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-extrabold text-[11px] shadow-xs">${badgeLabel}</span>
            <span class="px-2 py-0.5 rounded-md bg-blue-500 text-white font-mono-num font-bold text-[11px]">Lvl 100</span>
          </div>
        </div>
        <p class="text-xs text-slate-600 leading-relaxed">${sk.desc}</p>
      </div>
    `;
  }).join('');

  const passivesList = (c.passives || []).map((p, idx) => `
    <div data-preview-skill="passive_${idx}" class="pcrd-viewer-subcard pcrd-skill-card-interactive rounded-2xl p-3.5 flex flex-col gap-1.5" title="Click to preview ${p.name}">
      <div class="flex items-center justify-between gap-2">
        <div class="font-extrabold text-sm sm:text-base text-slate-800">${p.name}</div>
        <div class="flex items-center gap-1.5 shrink-0">
          <span class="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-extrabold text-[10px]">▶ Preview</span>
          <span class="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-extrabold text-[11px] shadow-xs">Passive</span>
          <span class="px-2 py-0.5 rounded-md bg-blue-500 text-white font-mono-num font-bold text-[11px]">Lvl 100</span>
        </div>
      </div>
      <p class="text-xs text-slate-600 leading-relaxed">${p.desc}</p>
    </div>
  `).join('');

  const statRows = [
    ['HP', (s.maxHp || 0).toLocaleString()],
    ['Physical Attack', (s.patk || 0).toLocaleString()],
    ['Magic Attack', (s.matk || 0).toLocaleString()],
    ['Physical Critical', (s.pcrit || 0).toLocaleString()],
    ['Magic Critical', (s.mcrit || 0).toLocaleString()],
    ['Physical Defense', (s.pdef || 0).toLocaleString()],
    ['Magic Defense', (s.mdef || 0).toLocaleString()],
    ['Physical Penetration', (s.ppen || 0).toLocaleString()],
    ['Magic Penetration', (s.mpen || 0).toLocaleString()],
    ['Normal Attack Speed', `${(s.actionSpeed || 2.0).toFixed(2)}s`],
    ['Dodge', (s.dodge || 0).toLocaleString()],
    ['Accuracy', (s.accuracy || 0).toLocaleString()],
    ['HP Recovery Rate', `${s.hpRecoveryRate || 0}`],
    ['TP Recovery Rate', `${s.tpRecoveryRate || 0}`],
    ['Wave HP Recovery', (s.waveHpRecovery || 0).toLocaleString()],
    ['Wave TP Recovery', (s.waveTpRecovery || 0).toLocaleString()],
    ['HP Reduce Rate', `${s.hpReduceRate || 0}`],
    ['TP Reduce Rate', `${s.tpReduceRate || 0}`],
    ['Attack Range', `${attackRange}`],
    ['Move Speed', `${s.moveSpeed || 240}`],
  ];

  const statsGridHtml = `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
      ${statRows
        .map(
          ([label, val]) => `
        <div class="pcrd-viewer-subcard rounded-xl px-3 py-2 flex items-center justify-between gap-2">
          <span class="text-xs font-bold text-slate-600">${label}</span>
          <span class="font-mono-num text-xs sm:text-sm font-extrabold text-slate-900">${val}</span>
        </div>
      `
        )
        .join('')}
    </div>
  `;

  const rightPanelContent =
    characterViewerState.tab === 'stats'
      ? `
        <div class="space-y-3">
          <div class="text-xs font-extrabold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
            <span>♦</span> Character Attributes
          </div>
          ${statsGridHtml}
        </div>
      `
      : `
        <div class="space-y-4">
          <div class="space-y-2">
            <div class="text-xs font-extrabold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>♦</span> Union Burst <span class="text-[10px] font-semibold text-slate-400 normal-case">(Click any skill to preview)</span>
            </div>
            <div data-preview-skill="ub" class="pcrd-viewer-subcard pcrd-skill-card-interactive rounded-2xl p-3.5 flex flex-col gap-1.5 border-amber-300/80" title="Click to preview ${c.ub.name}">
              <div class="flex items-center justify-between gap-2">
                <div class="font-extrabold text-sm sm:text-base text-slate-900">${c.ub.name}</div>
                <div class="flex items-center gap-1.5 shrink-0">
                  <span class="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-extrabold text-[10px]">▶ Preview</span>
                  <span class="px-2.5 py-0.5 rounded-full bg-orange-500 text-white font-extrabold text-[11px] shadow-xs">Union Burst</span>
                  <span class="px-2 py-0.5 rounded-md bg-blue-500 text-white font-mono-num font-bold text-[11px]">Lvl 100</span>
                </div>
              </div>
              <p class="text-xs text-slate-600 leading-relaxed">${c.ub.desc}</p>
            </div>
          </div>

          <div class="space-y-2">
            <div class="text-xs font-extrabold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>♦</span> Skills
            </div>
            <div class="space-y-2.5">
              ${autoSkillsList}
              ${passivesList}
            </div>
          </div>

          <div class="space-y-2">
            <div class="text-xs font-extrabold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>♦</span> Sample Action Loop
            </div>
            <div data-preview-skill="rotation_loop" class="pcrd-viewer-subcard pcrd-skill-card-interactive rounded-2xl p-3.5 flex flex-col gap-2 border-sky-300/80" title="Click to preview the full Initial + Main Loop rotation">
              <div class="flex items-center justify-between gap-2">
                <div class="font-extrabold text-sm text-slate-900">Initial &amp; Main Loop Rotation</div>
                <span class="px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-extrabold text-[11px] shadow-xs">▶ Run Loop</span>
              </div>
              <div class="space-y-1.5 text-[11px]">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-extrabold">Initial:</span>
                  ${(c.openingLoop || [])
                    .map(
                      (k) =>
                        `<span class="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-300 font-bold text-slate-700">${
                          k === 'auto' ? 'AA' : k === 'skill1' ? 'S1' : 'S2'
                        }</span>`
                    )
                    .join('<span class="text-slate-400 font-bold">→</span>')}
                </div>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-extrabold">Loop:</span>
                  ${(c.mainLoop || [])
                    .map(
                      (k) =>
                        `<span class="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-300 font-bold text-slate-700">${
                          k === 'auto' ? 'AA' : k === 'skill1' ? 'S1' : 'S2'
                        }</span>`
                    )
                    .join('<span class="text-slate-400 font-bold">→</span>')}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

  body.innerHTML = `
    <!-- LEFT SIDE: Character Model + Bottom Portrait / Level / Power Card -->
    <div class="lg:w-[44%] flex flex-col justify-between items-center gap-4 shrink-0">
      <!-- Name Banner -->
      <div class="flex flex-col items-center gap-1">
        <div class="pcrd-name-banner px-10 py-1.5 rounded-full text-white font-display text-lg sm:text-xl font-extrabold tracking-wide text-center">
          ${c.name}
        </div>
        <div class="text-xs font-bold text-slate-800 bg-white/80 px-3 py-0.5 rounded-full border border-slate-300 shadow-xs">
          ${c.title} • <span class="uppercase text-blue-700">${c.positionZone}</span> • <span class="uppercase ${c.damageType === 'physical' ? 'text-rose-600' : 'text-purple-600'}">${c.damageType}</span>
        </div>
      </div>

      <!-- Center Pedestal + Chibi Model + Prev/Next Arrows -->
      <div class="relative w-full flex-1 min-h-[220px] flex items-center justify-center">
        <button id="viewer-prev-btn" title="Previous Character" class="absolute left-0 sm:left-2 w-11 h-16 rounded-2xl bg-white/85 hover:bg-white border-2 border-sky-300 text-sky-700 font-black text-2xl flex items-center justify-center shadow-lg active:scale-95 transition">
          ‹
        </button>

        <div class="relative flex flex-col items-center justify-center">
          <div id="viewer-rig-stage" data-tpl-id="${c.id}" class="pcrd-viewer-model ${typeof hasCharacterRig === 'function' && hasCharacterRig(c.id) ? '' : 'anim-idle'} relative z-10 drop-shadow-[0_12px_16px_rgba(15,23,42,0.35)]">
            ${renderCharacterSpriteSVG({ templateId: c.id, side: 'player' }, false)}
          </div>
          <div class="pcrd-pedestal-ring -mt-7"></div>
        </div>

        <button id="viewer-next-btn" title="Next Character" class="absolute right-0 sm:right-2 w-11 h-16 rounded-2xl bg-white/85 hover:bg-white border-2 border-sky-300 text-sky-700 font-black text-2xl flex items-center justify-center shadow-lg active:scale-95 transition">
          ›
        </button>
      </div>

      <!-- Bottom Summary Card: Portrait, Level, Power -->
      <div class="pcrd-viewer-card w-full max-w-md rounded-3xl p-3.5 flex items-center gap-4">
        <div class="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-blue-900 to-indigo-950 overflow-hidden shrink-0 shadow-md">
          <div class="pcrd-head-portrait">
            ${renderCharacterHeadSprite({ templateId: c.id, name: c.name })}
          </div>
        </div>
        <div class="flex-1 space-y-2">
          <div class="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
            <span class="pcrd-stat-pill-label px-3 py-0.5 rounded-md text-xs font-extrabold">Level</span>
            <span class="font-mono-num text-base font-extrabold text-slate-800">100</span>
          </div>
          <div class="flex items-center justify-between gap-2">
            <span class="pcrd-stat-pill-label px-3 py-0.5 rounded-md text-xs font-extrabold">Power</span>
            <span class="font-mono-num text-base font-extrabold text-slate-900">${power.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- RIGHT SIDE: Tabs (Skills / Stats) + Content Card -->
    <div class="lg:w-[56%] flex flex-col min-h-0">
      <div class="flex items-center gap-2 px-3 mb-2">
        <button data-viewer-tab="skills" class="pcrd-tab-btn ${characterViewerState.tab === 'skills' ? 'is-active' : ''} flex-1 sm:flex-none sm:w-36 py-2 rounded-t-2xl rounded-b-lg font-extrabold text-sm transition">
          Skills
        </button>
        <button data-viewer-tab="stats" class="pcrd-tab-btn ${characterViewerState.tab === 'stats' ? 'is-active' : ''} flex-1 sm:flex-none sm:w-36 py-2 rounded-t-2xl rounded-b-lg font-extrabold text-sm transition">
          Stats
        </button>
      </div>

      <div class="pcrd-viewer-card flex-1 rounded-3xl p-4 sm:p-5 overflow-y-auto">
        ${rightPanelContent}
      </div>
    </div>
  `;

  document.getElementById('viewer-prev-btn')?.addEventListener('click', () => stepCharacterViewer(-1));
  document.getElementById('viewer-next-btn')?.addEventListener('click', () => stepCharacterViewer(1));
  body.querySelectorAll('[data-viewer-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      characterViewerState.tab = btn.getAttribute('data-viewer-tab') || 'skills';
      renderCharacterViewer();
    });
  });
  body.querySelectorAll('[data-preview-skill]').forEach((card) => {
    card.addEventListener('click', () => {
      const skKey = card.getAttribute('data-preview-skill');
      if (skKey) openSkillPreview(c, skKey);
    });
  });
}

function renderCodexModal() {
  const content = document.getElementById('codex-content');
  if (!content) return;
  content.innerHTML = CHARACTER_TEMPLATES.map((c) => {
    const autoEntries = Object.entries(c.autoSkills)
      .map(([k, v]) => `<li><strong class="text-sky-300">${k.toUpperCase()} (${v.name}):</strong> ${v.desc}</li>`)
      .join('');
    const passiveEntries = c.passives
      .map((p) => `<li><strong class="text-emerald-300">Passive (${p.name}):</strong> ${p.desc}</li>`)
      .join('');

    return `
      <div class="bg-slate-950/85 border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-2">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2.5">
            <div class="w-11 h-11 flex items-center justify-center shrink-0">
              ${renderCharacterSpriteSVG({ templateId: c.id, side: 'player' }, false)}
            </div>
            <div>
              <div class="font-display font-bold text-sm text-white">${c.name}</div>
              <div class="text-[11px] text-slate-400">${c.title} • <span class="text-amber-300 uppercase">${c.positionZone}</span></div>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="px-2 py-0.5 rounded text-[10px] font-mono-num font-bold bg-amber-500/20 text-amber-300">PWR ${computeCharacterPower(c).toLocaleString()}</span>
            <div class="flex items-center gap-1.5">
              <span class="px-2 py-0.5 rounded text-[10px] font-mono-num font-bold bg-amber-500/20 text-amber-300">PWR ${computeCharacterPower(c).toLocaleString()}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                c.damageType === 'physical' ? 'bg-rose-500/20 text-rose-300' : 'bg-sky-500/20 text-sky-300'
              }">${c.damageType.toUpperCase()}</span>
            </div>

          </div>
        </div>
        <ul class="text-[11px] text-slate-300 space-y-1 list-disc pl-4">
          <li><strong class="text-amber-300">UB (${c.ub.name}):</strong> ${c.ub.desc}</li>
          ${autoEntries}
          ${passiveEntries}
        </ul>
      </div>
    `;
  }).join('');
}

let viewerIdleClock = 0;

function updatePreviewAndViewerRigs(rawDt) {
  viewerIdleClock += rawDt * 2.4;

  const previewModal = document.getElementById('skill-preview-modal');
  if (previewModal && !previewModal.classList.contains('hidden') && skillPreviewState.casterRig) {
    const rigUnit = skillPreviewState.casterRig;
    if (typeof hasCharacterRig === 'function' && hasCharacterRig(rigUnit.templateId)) {
      rigUnit.rigIdleTime = (rigUnit.rigIdleTime || 0) + rawDt * 2.4;
      if (rigUnit.phase === 'windup') {
        rigUnit.phaseElapsed += rawDt;
        rigUnit.animProgress = Math.min(0.5, (rigUnit.phaseElapsed / rigUnit.phaseDuration) * 0.5);
      } else if (rigUnit.phase === 'strike') {
        rigUnit.phaseElapsed += rawDt;
        rigUnit.animProgress = Math.min(1, 0.5 + (rigUnit.phaseElapsed / rigUnit.phaseDuration) * 0.5);
      } else {
        rigUnit.animProgress = 0;
      }
      const casterAnimEl = document.getElementById('preview-caster-anim');
      if (casterAnimEl) {
        if (!casterAnimEl.classList.contains('anim-hit') && !casterAnimEl.classList.contains('anim-knockback')) {
          casterAnimEl.className = '';
        }
        casterAnimEl.innerHTML = renderCharacterSpriteSVG(rigUnit, false);
      }
    }
  }

  const viewerModal = document.getElementById('character-viewer-modal');
  if (viewerModal && !viewerModal.classList.contains('hidden') && characterViewerState.mode === 'detail') {
    const viewerStage = document.getElementById('viewer-rig-stage');
    const tplId = viewerStage?.getAttribute('data-tpl-id');
    if (viewerStage && tplId && typeof hasCharacterRig === 'function' && hasCharacterRig(tplId)) {
      viewerStage.classList.remove('anim-idle');
      viewerStage.innerHTML = renderCharacterSpriteSVG(
        { templateId: tplId, side: 'player', activeAnimKey: 'idle', rigIdleTime: viewerIdleClock },
        false
      );
    }
  }
}

function renderAllUI() {
  renderPageViews();
  renderArena();
  renderUbDeck();
  renderUnitInspector();
}
