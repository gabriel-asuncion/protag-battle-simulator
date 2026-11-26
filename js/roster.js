// =========================================================================
// POSITION ZONES, PCRD CONSTANTS & ROSTER REGISTRY
// =========================================================================
const POSITION_ZONES = [
  { id: 'vanguard', label: 'Vanguard', index: 0, rangeCenter: 95 },
  { id: 'frontline', label: 'Frontline', index: 1, rangeCenter: 215 },
  { id: 'flank', label: 'Flank', index: 2, rangeCenter: 340 },
  { id: 'center', label: 'Center', index: 3, rangeCenter: 465 },
  { id: 'pivot', label: 'Pivot', index: 4, rangeCenter: 595 },
  { id: 'backline', label: 'Backline', index: 5, rangeCenter: 725 },
  { id: 'rearguard', label: 'Rearguard', index: 6, rangeCenter: 865 },
];

const MAX_TP = 1000;
const BATTLE_DURATION_SEC = 90;

const TP_GAIN = {
  hitDealtBase: 92,
  damageTakenScale: 0.24,
  damageTakenCap: 220,
  killBonus: 250,
};

const PACE_CONFIG = {
  // ~70% of previous combat speed for clearer action readability
  idleGaugeMultiplier: 0.36,
  phaseDurationMultiplier: 2.05,
  minWindupSec: 0.42,
  minFollowThroughSec: 0.42,
  windupBaseRate: 0.48,
  windupMinRate: 0.43,
};

const CHARACTER_TEMPLATES = [];
let TRAINING_DUMMY_TEMPLATE = null;

function registerCharacterTemplate(template) {
  if (template.id === 'training_dummy') {
    TRAINING_DUMMY_TEMPLATE = template;
  } else {
    CHARACTER_TEMPLATES.push(template);
  }
}

function getTemplateById(id) {
  if (id === 'training_dummy') return TRAINING_DUMMY_TEMPLATE;
  return CHARACTER_TEMPLATES.find((c) => c.id === id) || CHARACTER_TEMPLATES[0];
}
