// =========================================================================
// CHROMA-KEY SPRITE SHEET SLICER + BESPOKE SVG FALLBACK RENDERER
// =========================================================================
// 4 rows x 2 cols chibi parts grids (Wave 1 & Wave 2)
const CHIBI_GRID_COLS = 2;
const CHIBI_GRID_ROWS = 4;

const CHIBI_SPRITE_SHEETS = [
  {
    sources: [
      'assets/chibi_parts_grid1.png',
      './assets/chibi_parts_grid1.png',
    ],
    cellMap: {
      bram_ironclad: { row: 0, col: 0 },
      kaelen_ashblade: { row: 0, col: 1 },
      vespera_nightstep: { row: 1, col: 0 },
      sylas_sunweaver: { row: 1, col: 1 },
      mirella_hexthread: { row: 2, col: 0 },
      orin_pyrecaster: { row: 2, col: 1 },
      lyra_windpiercer: { row: 3, col: 0 },
      talia_dewsong: { row: 3, col: 1 },
    },
  },
  {
    sources: [
      'assets/chibi_parts_grid2.png',
      './assets/chibi_parts_grid2.png',
    ],
    cellMap: {
      garrick_stoneguard: { row: 0, col: 0 },
      seraphina_dawnblade: { row: 0, col: 1 },
      zephyr_shadowstep: { row: 1, col: 0 },
      aurelia_starcaller: { row: 1, col: 1 },
      corvus_voidweaver: { row: 2, col: 0 },
      ignis_emberheart: { row: 2, col: 1 },
      sylvia_frostbow: { row: 3, col: 0 },
      elara_moonbloom: { row: 3, col: 1 },
    },
  },
  {
    sources: [
      'assets/chibi_parts_grid3.png',
      './assets/chibi_parts_grid3.png',
    ],
    cellMap: {
      yukari: { row: 0, col: 0 },
      ninon: { row: 0, col: 1 },
      llima: { row: 1, col: 0 },
      nozomi: { row: 1, col: 1 },
      tamaki: { row: 2, col: 0 },
      monica: { row: 2, col: 1 },
      kyouka: { row: 3, col: 0 },
      tsumugi: { row: 3, col: 1 },
    },
  },
];

const ACTION_FX_SHEET_SOURCES = [
  'assets/action_fx_grid.png',
  'image_d38c4d.jpg',
  './image_d38c4d.jpg',
];

// 8 rows x 6 cols mapping to the action FX sprite sheet
const ACTION_FX_CELL_MAP = {
  bram_slash: { row: 0, col: 0 },
  bram_shield: { row: 0, col: 1 },
  bram_slam: { row: 0, col: 2 },
  bram_ub: { row: 0, col: 5 },
  kaelen_slash: { row: 1, col: 0 },
  kaelen_rend: { row: 1, col: 1 },
  kaelen_ub: { row: 1, col: 5 },
  vespera_slash: { row: 2, col: 0 },
  vespera_flank: { row: 2, col: 2 },
  vespera_ub: { row: 2, col: 3 },
  sylas_orb: { row: 3, col: 0 },
  sylas_heal: { row: 3, col: 1 },
  sylas_ub: { row: 3, col: 4 },
  mirella_orb: { row: 4, col: 0 },
  mirella_haste: { row: 4, col: 1 },
  mirella_slow: { row: 4, col: 2 },
  mirella_ub: { row: 4, col: 3 },
  orin_orb: { row: 5, col: 0 },
  orin_burn: { row: 5, col: 3 },
  orin_ub: { row: 5, col: 4 },
  lyra_orb: { row: 6, col: 0 },
  lyra_volley: { row: 6, col: 1 },
  lyra_ub: { row: 6, col: 5 },
  talia_orb: { row: 7, col: 0 },
  talia_heal: { row: 7, col: 1 },
  talia_shield: { row: 7, col: 2 },
  talia_ub: { row: 7, col: 5 },
  dummy_orb: { row: 4, col: 0 },
  dummy_ub: { row: 0, col: 2 },
};

const spriteSheetCache = {
  status: 'loading', // 'loading' | 'ready' | 'failed'
  cutouts: {},
  headCutouts: {},
  fxCutouts: {},
  listeners: [],
};

function notifySpriteListeners() {
  const list = [...spriteSheetCache.listeners];
  spriteSheetCache.listeners = [];
  list.forEach((fn) => {
    try {
      fn();
    } catch (_) {}
  });
}

function registerSpriteReadyCallback(fn) {
  if (spriteSheetCache.status !== 'loading') {
    fn();
    return;
  }
  spriteSheetCache.listeners.push(fn);
}

function keyOutGreenScreenCanvas(img) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) return null;

  const work = document.createElement('canvas');
  work.width = w;
  work.height = h;
  const ctx = work.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);

  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;

  // Chroma-key green removal with anti-aliased edge feathering
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const a = d[i + 3];
    if (a === 0) continue;

    const greenExcess = g - Math.max(r, b);
    if (g > 110 && greenExcess > 55) {
      d[i + 3] = 0;
    } else if (g > 90 && greenExcess > 25) {
      const ratio = Math.max(0, Math.min(1, (greenExcess - 25) / 30));
      d[i + 3] = Math.round(a * ratio);
      // Despill green tint on edge pixels
      d[i + 1] = Math.min(d[i + 1], Math.round(Math.max(r, b) * 1.15));
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return work;
}

function extractMainChibiCutout(keyedCanvas, row, col) {
  const totalW = keyedCanvas.width;
  const totalH = keyedCanvas.height;
  const cellW = totalW / CHIBI_GRID_COLS;
  const cellH = totalH / CHIBI_GRID_ROWS;

  // Each 4x2 cell contains the front standing character on the far left (~25.5% of cell width)
  // followed by side view, exploded parts, and weapons. Crop the front standing character tightly.
  const sx = Math.floor(col * cellW + cellW * 0.008);
  const sy = Math.floor(row * cellH + cellH * 0.01);
  const sw = Math.max(16, Math.floor(cellW * 0.255));
  const sh = Math.max(16, Math.floor(cellH * 0.98));

  const srcCtx = keyedCanvas.getContext('2d');
  const px = srcCtx.getImageData(sx, sy, sw, sh).data;

  let minX = sw;
  let minY = sh;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const alpha = px[(y * sw + x) * 4 + 3];
      if (alpha > 20) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  const outCanvas = document.createElement('canvas');
  const outSize = 128;
  outCanvas.width = outSize;
  outCanvas.height = outSize;
  const outCtx = outCanvas.getContext('2d');
  outCtx.imageSmoothingEnabled = true;

  if (maxX >= minX && maxY >= minY) {
    const padX = Math.max(2, Math.floor((maxX - minX + 1) * 0.06));
    const padY = Math.max(2, Math.floor((maxY - minY + 1) * 0.06));
    const cx = Math.max(0, minX - padX);
    const cy = Math.max(0, minY - padY);
    const cw = Math.min(sw - cx, maxX - minX + 1 + padX * 2);
    const ch = Math.min(sh - cy, maxY - minY + 1 + padY * 2);

    const scale = Math.min((outSize - 12) / cw, (outSize - 12) / ch);
    const dw = cw * scale;
    const dh = ch * scale;
    const dx = (outSize - dw) / 2;
    const dy = outSize - dh - 5;

    outCtx.drawImage(keyedCanvas, sx + cx, sy + cy, cw, ch, dx, dy, dw, dh);
  } else {
    outCtx.drawImage(keyedCanvas, sx, sy, sw, sh, 6, 6, outSize - 12, outSize - 12);
  }

  return outCanvas.toDataURL('image/png');
}

function extractHeadChibiCutout(keyedCanvas, row, col) {
  const totalW = keyedCanvas.width;
  const totalH = keyedCanvas.height;
  const cellW = totalW / CHIBI_GRID_COLS;
  const cellH = totalH / CHIBI_GRID_ROWS;

  const sx = Math.floor(col * cellW + cellW * 0.008);
  const sy = Math.floor(row * cellH + cellH * 0.01);
  const sw = Math.max(16, Math.floor(cellW * 0.255));
  const sh = Math.max(16, Math.floor(cellH * 0.98));

  const srcCtx = keyedCanvas.getContext('2d');
  const px = srcCtx.getImageData(sx, sy, sw, sh).data;

  let minX = sw;
  let minY = sh;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      if (px[(y * sw + x) * 4 + 3] > 20) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  const outCanvas = document.createElement('canvas');
  const outSize = 128;
  outCanvas.width = outSize;
  outCanvas.height = outSize;
  const outCtx = outCanvas.getContext('2d');
  outCtx.imageSmoothingEnabled = true;

  if (maxX >= minX && maxY >= minY) {
    const fullH = maxY - minY + 1;
    // Crop top 58% of the standing sprite so full head, chin, and hair fit cleanly
    const headH = Math.max(16, Math.floor(fullH * 0.58));
    let hMinX = maxX;
    let hMaxX = minX;
    for (let y = minY; y < minY + headH && y < sh; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (px[(y * sw + x) * 4 + 3] > 20) {
          if (x < hMinX) hMinX = x;
          if (x > hMaxX) hMaxX = x;
        }
      }
    }
    const cw = Math.max(16, hMaxX - hMinX + 1);
    const ch = headH;
    const scale = Math.min((outSize - 8) / cw, (outSize - 8) / ch);
    const dw = cw * scale;
    const dh = ch * scale;
    outCtx.drawImage(
      keyedCanvas,
      sx + hMinX,
      sy + minY,
      cw,
      ch,
      (outSize - dw) / 2,
      outSize - dh,
      dw,
      dh
    );
  } else {
    outCtx.drawImage(keyedCanvas, sx, sy, sw, Math.floor(sh * 0.58), 4, 8, outSize - 8, outSize - 8);
  }

  return outCanvas.toDataURL('image/png');
}

function extractActionFxCutout(keyedCanvas, row, col, cols = 6, rows = 8) {
  const totalW = keyedCanvas.width;
  const totalH = keyedCanvas.height;
  const cellW = totalW / cols;
  const cellH = totalH / rows;

  const sx = Math.floor(col * cellW + cellW * 0.04);
  const sy = Math.floor(row * cellH + cellH * 0.05);
  const sw = Math.max(16, Math.floor(cellW * 0.92));
  const sh = Math.max(16, Math.floor(cellH * 0.90));

  const srcCtx = keyedCanvas.getContext('2d');
  const px = srcCtx.getImageData(sx, sy, sw, sh).data;

  let minX = sw;
  let minY = sh;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      if (px[(y * sw + x) * 4 + 3] > 20) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  const outCanvas = document.createElement('canvas');
  outCanvas.width = 128;
  outCanvas.height = 128;
  const outCtx = outCanvas.getContext('2d');
  outCtx.imageSmoothingEnabled = true;

  if (maxX >= minX && maxY >= minY) {
    const padX = Math.max(2, Math.floor((maxX - minX + 1) * 0.05));
    const padY = Math.max(2, Math.floor((maxY - minY + 1) * 0.05));
    const cx = Math.max(0, minX - padX);
    const cy = Math.max(0, minY - padY);
    const cw = Math.min(sw - cx, maxX - minX + 1 + padX * 2);
    const ch = Math.min(sh - cy, maxY - minY + 1 + padY * 2);

    const scale = Math.min(116 / cw, 116 / ch);
    const dw = cw * scale;
    const dh = ch * scale;
    outCtx.drawImage(keyedCanvas, sx + cx, sy + cy, cw, ch, (128 - dw) / 2, (128 - dh) / 2, dw, dh);
  } else {
    outCtx.drawImage(keyedCanvas, sx, sy, sw, sh, 6, 6, 116, 116);
  }

  return outCanvas.toDataURL('image/png');
}

function loadActionFxSheet(sourceIndex = 0) {
  if (sourceIndex >= ACTION_FX_SHEET_SOURCES.length) return;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      const keyed = keyOutGreenScreenCanvas(img);
      if (!keyed) {
        loadActionFxSheet(sourceIndex + 1);
        return;
      }
      for (const [fxKey, cell] of Object.entries(ACTION_FX_CELL_MAP)) {
        spriteSheetCache.fxCutouts[fxKey] = extractActionFxCutout(keyed, cell.row, cell.col, 6, 8);
      }
      if (typeof renderAllUI === 'function') renderAllUI();
    } catch (_) {
      loadActionFxSheet(sourceIndex + 1);
    }
  };
  img.onerror = () => {
    loadActionFxSheet(sourceIndex + 1);
  };
  img.src = ACTION_FX_SHEET_SOURCES[sourceIndex];
}

function getActionFxSpriteSrc(fxKey) {
  return spriteSheetCache.fxCutouts[fxKey] || null;
}

function loadSingleChibiSheet(sheetConfig, sourceIndex = 0, onDone = null) {
  if (sourceIndex >= sheetConfig.sources.length) {
    if (onDone) onDone(false);
    return;
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      const keyed = keyOutGreenScreenCanvas(img);
      if (!keyed) {
        loadSingleChibiSheet(sheetConfig, sourceIndex + 1, onDone);
        return;
      }
      for (const [tplId, cell] of Object.entries(sheetConfig.cellMap)) {
        spriteSheetCache.cutouts[tplId] = extractMainChibiCutout(keyed, cell.row, cell.col);
        spriteSheetCache.headCutouts[tplId] = extractHeadChibiCutout(keyed, cell.row, cell.col);
      }
      if (onDone) onDone(true);
    } catch (_) {
      loadSingleChibiSheet(sheetConfig, sourceIndex + 1, onDone);
    }
  };
  img.onerror = () => {
    loadSingleChibiSheet(sheetConfig, sourceIndex + 1, onDone);
  };
  img.src = sheetConfig.sources[sourceIndex];
}

function loadChibiSpriteSheet() {
  let remaining = CHIBI_SPRITE_SHEETS.length;
  let loadedCount = 0;

  CHIBI_SPRITE_SHEETS.forEach((sheetConfig) => {
    loadSingleChibiSheet(sheetConfig, 0, (ok) => {
      if (ok) loadedCount++;
      remaining--;
      if (ok && typeof renderAllUI === 'function') {
        renderAllUI();
      }
      if (remaining === 0) {
        spriteSheetCache.status = loadedCount > 0 ? 'ready' : 'failed';
        notifySpriteListeners();
        if (typeof renderAllUI === 'function') {
          renderAllUI();
        }
      }
    });
  });
}

function renderFallbackChibiSVG(unit, isVictory = false) {
  const id = unit.templateId;
  const flip = unit.side === 'enemy' ? 'transform="scale(-1, 1)" transform-origin="32 32"' : '';

  const palettes = {
    bram_ironclad: { primary: '#64748b', secondary: '#cbd5e1', accent: '#38bdf8', trim: '#f59e0b' },
    kaelen_ashblade: { primary: '#991b1b', secondary: '#fca5a5', accent: '#f97316', trim: '#fde047' },
    vespera_nightstep: { primary: '#312e81', secondary: '#c4b5fd', accent: '#22d3ee', trim: '#e879f9' },
    sylas_sunweaver: { primary: '#b45309', secondary: '#fef08a', accent: '#fbbf24', trim: '#38bdf8' },
    mirella_hexthread: { primary: '#581c87', secondary: '#e9d5ff', accent: '#c084fc', trim: '#34d399' },
    orin_pyrecaster: { primary: '#7c2d12', secondary: '#fed7aa', accent: '#fb923c', trim: '#ef4444' },
    lyra_windpiercer: { primary: '#065f46', secondary: '#a7f3d0', accent: '#34d399', trim: '#facc15' },
    talia_dewsong: { primary: '#0f766e', secondary: '#99f6e4', accent: '#2dd4bf', trim: '#fef08a' },
    yukari: { primary: '#0284c7', secondary: '#bae6fd', accent: '#38bdf8', trim: '#facc15' },
    ninon: { primary: '#b91c1c', secondary: '#fecaca', accent: '#f97316', trim: '#facc15' },
    llima: { primary: '#ec4899', secondary: '#fce7f3', accent: '#f472b6', trim: '#fde047' },
    nozomi: { primary: '#db2777', secondary: '#fbcfe8', accent: '#facc15', trim: '#38bdf8' },
    tamaki: { primary: '#7e22ce', secondary: '#f3e8ff', accent: '#f59e0b', trim: '#38bdf8' },
    monica: { primary: '#1d4ed8', secondary: '#dbeafe', accent: '#facc15', trim: '#f43f5e' },
    kyouka: { primary: '#0369a1', secondary: '#e0f2fe', accent: '#38bdf8', trim: '#c084fc' },
    tsumugi: { primary: '#be123c', secondary: '#ffe4e6', accent: '#fb7185', trim: '#fde047' },
    training_dummy: { primary: '#78350f', secondary: '#fde68a', accent: '#f59e0b', trim: '#94a3b8' },
  };
  const pal = palettes[id] || palettes.bram_ironclad;

  const eyeExpression = isVictory
    ? `<path d="M27 23 Q29 20 31 23" stroke="#0f172a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
       <path d="M36 23 Q38 20 40 23" stroke="#0f172a" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
    : `<circle cx="29" cy="23" r="2.2" fill="#0f172a"/>
       <circle cx="38" cy="23" r="2.2" fill="#0f172a"/>
       <circle cx="29.7" cy="22.3" r="0.8" fill="#ffffff"/>
       <circle cx="38.7" cy="22.3" r="0.8" fill="#ffffff"/>`;

  return `
    <svg viewBox="0 0 66 64" class="w-12 h-12 sm:w-14 sm:h-14 overflow-visible drop-shadow">
      <g ${flip}>
        <ellipse cx="33" cy="58" rx="16" ry="4.5" fill="rgba(2, 6, 23, 0.62)"/>
        <rect x="26.5" y="45" width="5" height="9.5" rx="2.5" fill="${pal.primary}" stroke="#0f172a" stroke-width="1.2"/>
        <rect x="34.5" y="45" width="5" height="9.5" rx="2.5" fill="${pal.primary}" stroke="#0f172a" stroke-width="1.2"/>
        <rect x="23.5" y="33" width="19" height="13.5" rx="6.5" fill="${pal.primary}" stroke="${pal.secondary}" stroke-width="1.4"/>
        <circle cx="33" cy="22" r="13" fill="${pal.secondary}" stroke="#0f172a" stroke-width="1.5"/>
        ${eyeExpression}
      </g>
    </svg>
  `;
}

function renderCharacterHeadSprite(unit) {
  const headSrc = spriteSheetCache.headCutouts[unit.templateId];
  if (headSrc) {
    return `
      <img
        src="${headSrc}"
        alt="${unit.name}"
        draggable="false"
        class="w-full h-full object-contain select-none pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)]"
      />
    `;
  }
  return renderCharacterSpriteSVG(unit, false);
}

function renderCharacterSpriteSVG(unit, isVictory = false) {
  const tplId = unit.templateId;
  const cutoutSrc = spriteSheetCache.cutouts[tplId];

  if (cutoutSrc) {
    const flipClass = unit.side === 'enemy' ? '-scale-x-100' : '';
    const winGlow = isVictory ? 'brightness-110' : '';
    return `
      <img
        src="${cutoutSrc}"
        alt="${unit.name}"
        draggable="false"
        class="w-12 h-12 sm:w-14 sm:h-14 object-contain select-none pointer-events-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.75)] ${flipClass} ${winGlow}"
      />
    `;
  }

  return renderFallbackChibiSVG(unit, isVictory);
}

loadChibiSpriteSheet(0);
loadActionFxSheet(0);
