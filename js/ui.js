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
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-draft-id');
        const existingIdx = state.playerSelection.indexOf(id);
        if (existingIdx >= 0) {
          state.playerSelection.splice(existingIdx, 1);
        } else if (state.playerSelection.length < 4) {
          state.playerSelection.push(id);
        }
        // Auto-arrange: left = furthest back (highest rangeCenter), right = closest to center
        state.playerSelection.sort((a, b) => {
          const za = POSITION_ZONES.find((p) => p.id === getTemplateById(a).positionZone)?.rangeCenter ?? 465;
          const zb = POSITION_ZONES.find((p) => p.id === getTemplateById(b).positionZone)?.rangeCenter ?? 465;
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
  if (cutinEl && (!battle.cutscene || battle.cutscene.remaining <= 0)) {
    cutinEl.innerHTML = '';
    cutinEl.classList.add('hidden');
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
    const isUbSpotlight = Boolean(battle.cutscene && battle.cutscene.remaining > 0 && battle.cutscene.casterUid === u.uid);
    const dimForUb = Boolean(battle.cutscene && battle.cutscene.remaining > 0 && !isUbSpotlight);
    // Grounded on the stone colosseum floor inside the full-height #arena-stage
    const yStaggerPx = (u.slotIndex - 1.5) * 16;
    const totalOffsetPx = u.lungeOffset + u.knockbackOffset;

    spriteNode.style.left = `calc(${u.visualX.toFixed(2)}% + ${totalOffsetPx.toFixed(1)}px)`;
    spriteNode.style.top = `calc(64% + ${yStaggerPx}px)`;
    spriteNode.style.opacity = !u.alive ? '0.28' : dimForUb ? '0.52' : '1';
    spriteNode.style.zIndex = isUbSpotlight ? '28' : isWindup ? '24' : isSelected ? '20' : '12';

    const animClass = !u.alive
      ? 'anim-defeated'
      : u.animState === 'windup' || isWindup
      ? 'anim-windup'
      : u.animState === 'strike'
      ? 'anim-strike'
      : u.animState === 'hit'
      ? 'anim-hit'
      : u.animState === 'knockback'
      ? 'anim-knockback'
      : u.animState === 'walk'
      ? 'anim-walk'
      : 'anim-idle';

    const dirSign = u.side === 'player' ? 1 : -1;
    const koRotDeg = -28 * dirSign;
    const spriteStyleVars = `--windup-x:${-7 * dirSign}px; --windup-rot:${-9 * dirSign}deg; --strike-x:${16 * dirSign}px; --strike-rot:${12 * dirSign}deg; --recoil-x:${-10 * dirSign}px; --recoil-rot:${-8 * dirSign}deg; --kb-x:${-15 * dirSign}px; --kb-rot:${-12 * dirSign}deg; --ko-rot:${koRotDeg}deg;`;

    // Borderless close-up chibi character sprite grounded on the stone arena floor
    spriteNode.innerHTML = `
      <div class="chibi-closeup-sprite relative flex flex-col items-center justify-center ${
        isUbSpotlight ? 'scale-115 drop-shadow-[0_0_22px_rgba(253,224,71,0.95)]' : ''
      } ${isWindup ? 'unit-windup-glow' : ''} ${
        isSelected ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.85)]' : ''
      }" data-sprite-vars="${spriteStyleVars}">
        <div class="${animClass}" data-sprite-vars="${spriteStyleVars}">
          ${renderCharacterSpriteSVG(u, battle.ended && u.alive)}
        </div>
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
      const hpPct = Math.max(0, Math.min(100, (u.hp / u.maxHp) * 100));
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
          </button>          <!-- HP Bar -->
          <div class="w-20 sm:w-24 h-2.5 rounded-full bg-slate-900/95 border border-slate-700 overflow-hidden p-[1px]">
            <div class="h-full rounded-full bg-lime-400 transition-all duration-100" data-ub-hp="${hpPct.toFixed(1)}%"></div>
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

function computePartyPower(ids) {
  return ids.reduce((sum, id) => {
    const c = getTemplateById(id);
    if (!c) return sum;
    return sum + Math.round(c.stats.maxHp * 0.45 + (c.stats.patk + c.stats.matk) * 4.2 + (c.stats.pdef + c.stats.mdef) * 3.1);
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
    const za = POSITION_ZONES.find((p) => p.id === getTemplateById(a).positionZone)?.rangeCenter ?? 465;
    const zb = POSITION_ZONES.find((p) => p.id === getTemplateById(b).positionZone)?.rangeCenter ?? 465;
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
      const za = POSITION_ZONES.find((p) => p.id === getTemplateById(a).positionZone)?.rangeCenter ?? 465;
      const zb = POSITION_ZONES.find((p) => p.id === getTemplateById(b).positionZone)?.rangeCenter ?? 465;
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
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
            c.damageType === 'physical' ? 'bg-rose-500/20 text-rose-300' : 'bg-sky-500/20 text-sky-300'
          }">${c.damageType.toUpperCase()}</span>
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

function renderAllUI() {
  renderPageViews();
  renderArena();
  renderUbDeck();
  renderUnitInspector();
}
