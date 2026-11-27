// =========================================================================
// FULL-SCREEN BATTLE CONTROLS, MENU MODAL, NAVIGATION & RAF LOOP
// =========================================================================
const SPEED_STEPS = [0.5, 1, 2, 3];

document.querySelectorAll('.page-nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const targetPage = btn.getAttribute('data-page') || 'battle';
    document.getElementById('hud-menu-modal')?.classList.add('hidden');
    navigateToPage(targetPage);
  });
});

document.getElementById('lobby-go-draft-btn')?.addEventListener('click', () => {
  navigateToPage('draft');
});

document.getElementById('lobby-quick-battle-btn')?.addEventListener('click', () => {
  state.mode = '4v4';
  navigateToPage('battle');
});

document.getElementById('lobby-quick-dummy-btn')?.addEventListener('click', () => {
  state.mode = 'dummy';
  navigateToPage('battle');
});

document.getElementById('draft-mode-4v4-btn')?.addEventListener('click', () => {
  state.mode = '4v4';
  renderTeamBuilders();
  renderPageViews();
});

document.getElementById('draft-mode-dummy-btn')?.addEventListener('click', () => {
  state.mode = 'dummy';
  renderTeamBuilders();
  renderPageViews();
});

document.getElementById('draft-cancel-btn')?.addEventListener('click', () => {
  navigateToPage('lobby');
});

document.querySelectorAll('.draft-filter-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.draftFilter = btn.getAttribute('data-draft-filter') || 'all';
    renderPageViews();
  });
});

document.getElementById('draft-launch-battle-btn')?.addEventListener('click', () => {
  if (!state.playerSelection.length) return;
  navigateToPage('battle');
});

document.getElementById('dummy-count-select')?.addEventListener('change', (e) => {
  state.dummyCount = Number(e.target.value) || 4;
  renderTeamBuilders();
  initBattle({ autoStart: false });
});

document.getElementById('hud-menu-btn')?.addEventListener('click', () => {
  renderUnitInspector();
  renderBattleLog();
  document.getElementById('hud-menu-modal')?.classList.remove('hidden');
});

document.getElementById('close-hud-menu-btn')?.addEventListener('click', () => {
  document.getElementById('hud-menu-modal')?.classList.add('hidden');
});

document.getElementById('menu-toggle-mode-btn')?.addEventListener('click', () => {
  state.mode = state.mode === '4v4' ? 'dummy' : '4v4';
  renderTeamBuilders();
  initBattle({ autoStart: state.page === 'battle' });
});

document.getElementById('pause-toggle-btn')?.addEventListener('click', (e) => {
  state.paused = !state.paused;
  e.target.textContent = state.paused ? 'Resume' : 'Pause';
  if (!battle.ended) {
    setBattleStatus(
      state.paused ? 'PAUSED' : 'LIVE',
      state.paused
        ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
        : 'bg-slate-950/75 text-emerald-300 border-emerald-400/35'
    );
  }
});

function applySpeedSelection(newSpeed) {
  state.speed = newSpeed;
  document.querySelectorAll('.speed-btn').forEach((b) => {
    const active = Number(b.getAttribute('data-speed')) === state.speed;
    b.className = `speed-btn px-2.5 py-1 rounded-lg text-xs font-mono-num font-bold ${
      active ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white'
    }`;
  });
  renderPageViews();
}

document.querySelectorAll('.speed-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    applySpeedSelection(Number(btn.getAttribute('data-speed')) || 1);
  });
});

document.getElementById('speed-cycle-btn')?.addEventListener('click', () => {
  const curIdx = SPEED_STEPS.indexOf(state.speed);
  const nextSpeed = SPEED_STEPS[(curIdx + 1) % SPEED_STEPS.length];
  applySpeedSelection(nextSpeed);
});

document.getElementById('prev-action-btn')?.addEventListener('click', () => {
  stepPrevActionSnapshot();
});

document.getElementById('next-action-btn')?.addEventListener('click', () => {
  if (state.page !== 'battle') navigateToPage('battle');
  jumpToNextWindupAction();
});

document.getElementById('auto-ub-btn')?.addEventListener('click', () => {
  state.autoUb = !state.autoUb;
  renderPageViews();
});

document.getElementById('reset-battle-btn')?.addEventListener('click', () => {
  document.getElementById('hud-menu-modal')?.classList.add('hidden');
  if (state.mode === '4v4' && typeof applySmartEnemyStrategy === 'function') {
    applySmartEnemyStrategy();
  }
  initBattle({ autoStart: true });
});

document.getElementById('overlay-restart-btn')?.addEventListener('click', () => {
  if (state.mode === '4v4' && typeof applySmartEnemyStrategy === 'function') {
    applySmartEnemyStrategy();
  }
  initBattle({ autoStart: true });
});

document.getElementById('overlay-draft-btn')?.addEventListener('click', () => {
  navigateToPage('draft');
});

document.getElementById('clear-log-btn')?.addEventListener('click', () => {
  battle.logs = [];
  renderBattleLog();
});

document.getElementById('draft-strategy-pick-btn')?.addEventListener('click', () => {
  const strat = document.getElementById('draft-strategy-select')?.value || 'balanced';
  state.playerSelection = buildStrategyTeam(strat);
  if (state.mode === '4v4' && typeof applySmartEnemyStrategy === 'function') {
    applySmartEnemyStrategy();
  }
  renderTeamBuilders();
  renderPageViews();
});

document.querySelectorAll('.open-codex-trigger').forEach((btn) => {
  btn.addEventListener('click', () => {
    openCharacterViewer();
  });
});

document.getElementById('close-character-viewer-btn')?.addEventListener('click', () => {
  if (characterViewerState.mode === 'detail') {
    characterViewerState.mode = 'grid';
    renderCharacterViewer();
  } else {
    closeCharacterViewer();
  }
});

document.getElementById('viewer-grid-btn')?.addEventListener('click', () => {
  characterViewerState.mode = 'grid';
  renderCharacterViewer();
});

document.getElementById('close-skill-preview-btn')?.addEventListener('click', () => {
  closeSkillPreview();
});

document.getElementById('replay-skill-preview-btn')?.addEventListener('click', () => {
  playSkillPreviewAnimation();
});

document.getElementById('close-codex-btn')?.addEventListener('click', () => {
  document.getElementById('codex-modal')?.classList.add('hidden');
});

window.addEventListener('keydown', (e) => {
  const previewModal = document.getElementById('skill-preview-modal');
  if (previewModal && !previewModal.classList.contains('hidden')) {
    if (e.key === 'Escape') closeSkillPreview();
    return;
  }
  const viewerModal = document.getElementById('character-viewer-modal');
  if (viewerModal && !viewerModal.classList.contains('hidden')) {
    if (e.key === 'Escape') {
      if (characterViewerState.mode === 'detail') {
        characterViewerState.mode = 'grid';
        renderCharacterViewer();
      } else {
        closeCharacterViewer();
      }
    } else if (characterViewerState.mode === 'detail' && e.key === 'ArrowLeft') {
      stepCharacterViewer(-1);
    } else if (characterViewerState.mode === 'detail' && e.key === 'ArrowRight') {
      stepCharacterViewer(1);
    }
    return;
  }
  if (state.page !== 'battle') return;
  if (['1', '2', '3', '4'].includes(e.key)) {
    const idx = Number(e.key) - 1;
    const playerUnits = battle.units.filter((u) => u.side === 'player');
    if (playerUnits[idx]) {
      state.selectedUnitId = playerUnits[idx].uid;
      triggerUnionBurst(playerUnits[idx]);
      renderAllUI();
    }
  } else if (e.code === 'Space') {
    e.preventDefault();
    document.getElementById('pause-toggle-btn')?.click();
  }
});

let lastTimestamp = performance.now();
function mainLoop(now) {
  const rawDt = Math.min(0.05, Math.max(0, (now - lastTimestamp) / 1000));
  lastTimestamp = now;

  if (state.page === 'battle') {
    updateBattle(rawDt);
    renderArena();
    renderUbDeck();
  }

  if (typeof updatePreviewAndViewerRigs === 'function') {
    updatePreviewAndViewerRigs(rawDt);
  }

  requestAnimationFrame(mainLoop);
}

state.page = 'lobby';
if (typeof applySmartEnemyStrategy === 'function') {
  applySmartEnemyStrategy();
}
renderTeamBuilders();
initBattle({ autoStart: false });
renderAllUI();
requestAnimationFrame(mainLoop);
