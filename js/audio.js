// =========================================================================
// COMBAT SFX & SINGLE-CHANNEL VOICE-OVER AUDIO MANAGER
// =========================================================================
const SFX_FOLDERS = ['sound_files/sfx', 'sound_files'];
const VOICE_FOLDERS = ['sound_files/voice', 'sound_files'];
const VOICE_EXTENSIONS = ['.mp3', '.wav'];

const VOICE_PRIORITY = {
  ENEMY_SKILL: 1,
  PLAYER_SKILL: 2,
  UNION_BURST: 3,
};

const sfxState = {
  enabled: true,
  volume: 0.65,
  ubVolume: 0.85,
  voiceVolume: 0.9,
  ubVoiceVolume: 1.0,
  globalSkillVoCooldownMs: 1650,
  unitSkillVoCooldownMs: 5500,
  playerSkillVoChance: 0.68,
  enemySkillVoChance: 0.30,
  missingUrls: new Set(),
  activeVoice: null, // { audio, priority, unitKey, fadeTimer }
  lastGlobalSkillVoAt: 0,
  unitVoTimestamps: new Map(),
};

function slugifySkillName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function getSkillSfxPrefix(skillKey, isUb) {
  if (isUb || skillKey === 'ub') return 'ub';
  if (skillKey === 'skill1') return 's1';
  if (skillKey === 'skill2') return 's2';
  return 'auto';
}

function getPlaybackRateForBattle() {
  const spd = typeof state !== 'undefined' && Number.isFinite(state.speed) ? state.speed : 1;
  if (spd <= 1) return 1.0;
  return Math.min(1.35, 1 + (spd - 1) * 0.18);
}

function fadeOutAndStopVoice(voiceEntry, durationMs = 80) {
  if (!voiceEntry || !voiceEntry.audio) return;
  if (voiceEntry.fadeTimer) {
    clearInterval(voiceEntry.fadeTimer);
    voiceEntry.fadeTimer = null;
  }

  const audio = voiceEntry.audio;
  const startVol = audio.volume;
  if (startVol <= 0.02 || audio.paused) {
    audio.pause();
    return;
  }

  const steps = 4;
  const stepMs = Math.max(15, Math.floor(durationMs / steps));
  let step = 0;

  voiceEntry.fadeTimer = setInterval(() => {
    step++;
    const nextVol = startVol * Math.max(0, 1 - step / steps);
    audio.volume = Math.max(0, Math.min(1, nextVol));
    if (step >= steps) {
      clearInterval(voiceEntry.fadeTimer);
      voiceEntry.fadeTimer = null;
      audio.pause();
    }
  }, stepMs);
}

function stopActiveVoice(immediate = false) {
  const current = sfxState.activeVoice;
  if (!current) return;
  sfxState.activeVoice = null;
  if (immediate) {
    if (current.fadeTimer) clearInterval(current.fadeTimer);
    current.audio.pause();
  } else {
    fadeOutAndStopVoice(current, 80);
  }
}

function hasPlayerSkillWindupInProgress(excludeUid) {
  if (typeof battle === 'undefined' || !Array.isArray(battle.units)) return false;
  return battle.units.some(
    (u) =>
      u.alive &&
      u.side === 'player' &&
      u.uid !== excludeUid &&
      u.actionPhase === 'WINDUP' &&
      u.queuedAction &&
      u.queuedAction.stepKey !== 'auto'
  );
}

function canTriggerVoice(unit, priority, isUb) {
  if (isUb) return true;

  // Never interrupt an active voice line with a regular skill
  if (sfxState.activeVoice) return false;

  const now = performance.now();
  if (now - sfxState.lastGlobalSkillVoAt < sfxState.globalSkillVoCooldownMs) {
    return false;
  }

  const unitKey = unit.uid || unit.templateId;
  const lastUnitAt = sfxState.unitVoTimestamps.get(unitKey) || 0;
  if (now - lastUnitAt < sfxState.unitSkillVoCooldownMs) {
    return false;
  }

  // Let player skill windups claim the channel over enemy regular skills
  if (priority === VOICE_PRIORITY.ENEMY_SKILL && hasPlayerSkillWindupInProgress(unit.uid)) {
    return false;
  }

  const chance =
    priority === VOICE_PRIORITY.PLAYER_SKILL
      ? sfxState.playerSkillVoChance
      : sfxState.enemySkillVoChance;

  return Math.random() <= chance;
}

function playSfxCandidates(candidates, volume, index = 0) {
  if (!sfxState.enabled || index >= candidates.length) return;

  const url = candidates[index];
  if (sfxState.missingUrls.has(url)) {
    playSfxCandidates(candidates, volume, index + 1);
    return;
  }

  const audio = new Audio(url);
  audio.volume = Math.max(0, Math.min(1, volume));
  audio.addEventListener(
    'error',
    () => {
      sfxState.missingUrls.add(url);
      playSfxCandidates(candidates, volume, index + 1);
    },
    { once: true }
  );

  const playPromise = audio.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {});
  }
}

function playVoiceCandidates(candidates, volume, meta, index = 0) {
  if (!sfxState.enabled || index >= candidates.length) return;

  const url = candidates[index];
  if (sfxState.missingUrls.has(url)) {
    playVoiceCandidates(candidates, volume, meta, index + 1);
    return;
  }

  const audio = new Audio(url);
  audio.volume = Math.max(0, Math.min(1, volume));
  audio.playbackRate = meta.playbackRate || 1.0;

  // Fade out any lower/previous voice cleanly when a UB takes over
  if (sfxState.activeVoice && sfxState.activeVoice.audio !== audio) {
    stopActiveVoice(false);
  }

  const entry = {
    audio,
    priority: meta.priority,
    unitKey: meta.unitKey,
    fadeTimer: null,
  };
  sfxState.activeVoice = entry;

  let committed = false;
  const commitStart = () => {
    if (committed) return;
    committed = true;
    if (!meta.isUb) {
      const now = performance.now();
      sfxState.lastGlobalSkillVoAt = now;
      sfxState.unitVoTimestamps.set(meta.unitKey, now);
    }
  };

  const cleanup = () => {
    if (entry.fadeTimer) {
      clearInterval(entry.fadeTimer);
      entry.fadeTimer = null;
    }
    if (sfxState.activeVoice === entry) {
      sfxState.activeVoice = null;
    }
  };

  audio.addEventListener('ended', cleanup, { once: true });
  audio.addEventListener(
    'error',
    () => {
      sfxState.missingUrls.add(url);
      cleanup();
      playVoiceCandidates(candidates, volume, meta, index + 1);
    },
    { once: true }
  );

  const playPromise = audio.play();
  if (playPromise && typeof playPromise.then === 'function') {
    playPromise.then(commitStart).catch(() => {
      cleanup();
    });
  } else {
    commitStart();
  }
}

function playUnitSkillVo(unit, skillKey, skillDef, isUb = false) {
  if (!sfxState.enabled || !unit || !skillDef || !skillDef.name) return;
  if (unit.templateId === 'training_dummy') return;

  const prefix = getSkillSfxPrefix(skillKey, isUb);
  if (prefix === 'auto') return;

  const priority = isUb
    ? VOICE_PRIORITY.UNION_BURST
    : unit.side === 'player'
    ? VOICE_PRIORITY.PLAYER_SKILL
    : VOICE_PRIORITY.ENEMY_SKILL;

  if (!canTriggerVoice(unit, priority, isUb)) return;

  const slug = slugifySkillName(skillDef.name);
  const baseName = `${unit.templateId}_${prefix}_${slug}_vo`;
  const candidates = [];

  for (const folder of VOICE_FOLDERS) {
    for (const ext of VOICE_EXTENSIONS) {
      candidates.push(`${folder}/${baseName}${ext}`);
    }
  }

  const vol = isUb ? sfxState.ubVoiceVolume : sfxState.voiceVolume;
  playVoiceCandidates(candidates, vol, {
    priority,
    isUb,
    unitKey: unit.uid || unit.templateId,
    playbackRate: getPlaybackRateForBattle(),
  });
}

function playUnitSkillSfx(unit, skillKey, skillDef, isUb = false) {
  if (!sfxState.enabled || !unit || !skillDef || !skillDef.name) return;
  if (unit.templateId === 'training_dummy') return;

  const prefix = getSkillSfxPrefix(skillKey, isUb);
  const slug = slugifySkillName(skillDef.name);
  const filename = `${unit.templateId}_${prefix}_${slug}.wav`;
  const candidates = SFX_FOLDERS.map((folder) => `${folder}/${filename}`);

  const baseVol = isUb ? sfxState.ubVolume : sfxState.volume;
  const duckMultiplier = sfxState.activeVoice ? 0.80 : 1.0;

  playSfxCandidates(candidates, baseVol * duckMultiplier);
}
