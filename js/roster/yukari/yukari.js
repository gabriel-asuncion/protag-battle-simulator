registerCharacterTemplate({
  id: 'yukari',
  name: 'Yukari',
  title: 'Aegis Brewer',
  positionZone: 'center',
  distance: 405,
  spriteGrid: { row: 0, col: 0 },
  assetsDir: 'js/roster/yukari/assets',
  soundDir: 'js/roster/yukari/sound_files',
  vfxDir: 'js/roster/yukari/sound_files/vfx',
  voiceDir: 'js/roster/yukari/sound_files/voice',
  damageType: 'magical',
  kitFormat: '1 UB • 2 Auto Skills • 1 Passive',
  stats: {
    maxHp: 26000,
    patk: 0,
    matk: 6000,
    pcrit: 0,
    mcrit: 300,
    pdef: 310,
    mdef: 530,
    ppen: 0,
    mpen: 15,
    actionSpeed: 2.25,
    dodge: 35,
    accuracy: 0,
    hpRecoveryRate: 75,
    tpRecoveryRate: 40,
    waveHpRecovery: 1700,
    waveTpRecovery: 260,
    hpReduceRate: 15,
    tpReduceRate: 25,
    moveSpeed: 240,
    critMult: 2.0,
  },
  openingLoop: ['skill2', 'auto'],
  mainLoop: ['skill2', 'auto', 'auto', 'skill1', 'auto'],
  ub: {
    name: 'Sevenfold Veil',
    callout: 'Seven veils, guard us!',
    cutsceneKind: 'ally_support',
    windupSec: 0.48,
    followThroughSec: 0.46,
    desc: 'Deploys a Magic Barrier across ALL allies that absorbs incoming Magical damage and boosts Magic DEF.',
    action: 'ub_magic_barrier_all',
  },
  autoSkills: {
    auto: {
      name: 'Azure Strike',
      callout: 'Cheers!',
      windupSec: 0.25,
      followThroughSec: 0.23,
      desc: 'Deals 98% Magical ATK to nearest enemy (~92 base TP on hit).',
      action: 'mag_nearest',
      mult: 0.98,
      baseHitTp: 92,
    },
    skill1: {
      name: 'Aqua Vitae',
      callout: 'Drink up and recover!',
      windupSec: 0.34,
      followThroughSec: 0.34,
      desc: 'Recovers HP for the ally with the lowest HP% (185% MATK scaling).',
      action: 'heal_lowest_hp',
      healMult: 1.85,
    },
    skill2: {
      name: 'Moonlight Brew',
      callout: 'Spirit surge!',
      windupSec: 0.34,
      followThroughSec: 0.34,
      desc: 'Grants +260 TP to the ally with the lowest current TP.',
      action: 'buff_ally_tp',
      tpGrant: 260,
    },
  },
  passives: [
    {
      name: 'Amber Ward',
      type: 'battle_start',
      desc: 'Increases own Magic Defense by +32% from the start of battle.',
    },
  ],
  rig: {
    assetsDir: 'js/roster/yukari/assets',
    viewBox: '-115 -202 230 218',
    parts: {
      legBack: { file: 'leg_back.png', z: 1, pivot: [0.5, 0.14], baseX: 7, baseY: 3, parent: 'torso' },
      armBack: { file: 'arm_back.png', z: 2, pivot: [0.48, 0.18], baseX: 16, baseY: -22, parent: 'torso' },
      torso: { file: 'torso.png', z: 3, pivot: [0.5, 0.72], baseX: 0, baseY: -50 },
      legFront: { file: 'leg_front.png', z: 4, pivot: [0.5, 0.14], baseX: -6, baseY: 4, parent: 'torso' },
      armFront: { file: 'arm_front.png', z: 5, pivot: [0.52, 0.18], baseX: -16, baseY: -21, parent: 'torso' },
      weapon: { file: 'Weapon.png', z: 6, scale: 0.56, pivot: [0.52, 0.56], baseX: 12, baseY: 26, parent: 'armBack' },
      head: { file: 'Head.png', z: 7, pivot: [0.5, 0.84], baseX: 1, baseY: -36, parent: 'torso' },
    },
    animations: {
      idle: {
        mode: 'loop',
        speed: 2.4,
        sample(t) {
          const s = Math.sin(t);
          const c = Math.cos(t);
          return {
            torso: { dx: 0, dy: s * 2.0, rot: s * 0.02 },
            head: { dx: 0, dy: -c * 0.7, rot: -s * 0.035 },
            armFront: { dx: 0, dy: 0, rot: 0.22 + s * 0.07 },
            armBack: { dx: 0, dy: 0, rot: -0.28 - s * 0.06 },
            weapon: { dx: 0, dy: 0, rot: 0.22 + s * 0.05 },
            legFront: { dx: 0, dy: -s * 1.1, rot: -0.03 },
            legBack: { dx: 0, dy: -s * 1.1, rot: 0.04 },
          };
        },
      },
      walk: {
        mode: 'loop',
        speed: 8.5,
        sample(t) {
          const s = Math.sin(t);
          const bounce = Math.abs(Math.cos(t));
          return {
            torso: { dx: 2, dy: -bounce * 3.5, rot: 0.06 + s * 0.03 },
            head: { dx: 0, dy: 0, rot: -0.04 - s * 0.03 },
            armFront: { dx: 0, dy: 0, rot: 0.18 - s * 0.42 },
            armBack: { dx: 0, dy: 0, rot: -0.22 + s * 0.36 },
            weapon: { dx: 0, dy: 0, rot: 0.28 - s * 0.18 },
            legFront: { dx: 0, dy: 0, rot: s * 0.45 },
            legBack: { dx: 0, dy: 0, rot: -s * 0.45 },
          };
        },
      },
      auto: {
        mode: 'action',
        sample(p) {
          const t = Math.max(0, Math.min(1, p));
          let swing = 0;
          if (t < 0.48) {
            const w = t / 0.48;
            swing = -w * 0.62;
          } else if (t < 0.76) {
            const k = (t - 0.48) / 0.28;
            swing = -0.62 + k * 1.55;
          } else {
            const r = (t - 0.76) / 0.24;
            swing = 0.93 * (1 - r);
          }
          return {
            torso: { dx: swing * 6, dy: -Math.abs(swing) * 1.5, rot: swing * 0.14 },
            head: { dx: 0, dy: 0, rot: -swing * 0.08 },
            armFront: { dx: 0, dy: 0, rot: 0.22 - swing * 0.45 },
            armBack: { dx: 0, dy: 0, rot: -0.28 - swing * 0.85 },
            weapon: { dx: 0, dy: 0, rot: 0.22 + swing * 1.15 },
            legFront: { dx: 0, dy: 0, rot: -swing * 0.22 },
            legBack: { dx: 0, dy: 0, rot: swing * 0.18 },
          };
        },
      },
      skill1: {
        mode: 'action',
        sample(p) {
          const t = Math.max(0, Math.min(1, p));
          const lift = Math.sin(t * Math.PI);
          const flourish = Math.sin(t * Math.PI * 2) * 0.1;
          return {
            torso: { dx: 0, dy: -lift * 5.5, rot: -lift * 0.07 },
            head: { dx: 0, dy: 0, rot: -lift * 0.14 + flourish * 0.35 },
            armFront: { dx: 0, dy: -lift * 1.5, rot: 0.18 - lift * 0.85 },
            armBack: { dx: 0, dy: -lift * 3, rot: -0.28 - lift * 0.95 + flourish },
            weapon: { dx: 0, dy: -lift * 4, rot: 0.22 + lift * 0.85 },
            legFront: { dx: 0, dy: lift * 2, rot: 0.1 * lift },
            legBack: { dx: 0, dy: lift * 2, rot: -0.1 * lift },
          };
        },
      },
      skill2: {
        mode: 'action',
        sample(p) {
          const t = Math.max(0, Math.min(1, p));
          const charge = t < 0.5 ? t / 0.5 : 1 - (t - 0.5) / 0.5;
          const burst = t >= 0.45 ? Math.sin(((t - 0.45) / 0.55) * Math.PI) : 0;
          return {
            torso: { dx: burst * 5 - charge * 2, dy: -burst * 4 + charge * 2, rot: burst * 0.12 - charge * 0.06 },
            head: { dx: 0, dy: 0, rot: -burst * 0.1 + charge * 0.08 },
            armFront: { dx: 0, dy: 0, rot: 0.25 + charge * 0.3 - burst * 0.75 },
            armBack: { dx: 0, dy: 0, rot: -0.28 + charge * 0.35 - burst * 1.05 },
            weapon: { dx: 0, dy: -burst * 3, rot: 0.22 - charge * 0.25 + burst * 1.1 },
            legFront: { dx: 0, dy: 0, rot: -burst * 0.22 + charge * 0.1 },
            legBack: { dx: 0, dy: 0, rot: burst * 0.22 - charge * 0.1 },
          };
        },
      },
      ub: {
        mode: 'action',
        sample(p) {
          const t = Math.max(0, Math.min(1, p));
          const arc = Math.sin(t * Math.PI);
          return {
            torso: { dx: 0, dy: -arc * 8, rot: -arc * 0.1 },
            head: { dx: 0, dy: 0, rot: -arc * 0.16 },
            armFront: { dx: 0, dy: -arc * 2, rot: 0.18 - arc * 0.95 },
            armBack: { dx: 0, dy: -arc * 4, rot: -0.28 - arc * 1.2 },
            weapon: { dx: 0, dy: -arc * 6, rot: 0.22 + arc * 1.15 },
            legFront: { dx: 0, dy: arc * 3, rot: 0.14 * arc },
            legBack: { dx: 0, dy: arc * 3, rot: -0.14 * arc },
          };
        },
      },
    },
  },
});