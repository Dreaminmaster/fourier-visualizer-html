const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const clearBtn = document.getElementById('clearBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const playBtn = document.getElementById('playBtn');
const copyBtn = document.getElementById('copyBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const resetViewBtn = document.getElementById('resetViewBtn');
const centerPathBtn = document.getElementById('centerPathBtn');
const jsonInput = document.getElementById('jsonInput');
const termsRange = document.getElementById('termsRange');
const termsValue = document.getElementById('termsValue');
const durationInput = document.getElementById('durationInput');
const sampleInput = document.getElementById('sampleInput');
const statusEl = document.getElementById('status');

const VIRTUAL_WIDTH = 2400;
const VIRTUAL_HEIGHT = 1800;
const MIN_SCALE = 0.2;
const MAX_SCALE = 4;

let drawing = false;
let rawPoints = [];
let sampledPoints = [];
let epicycles = [];
let resultTrail = [];
let isPlaying = false;
let startTime = 0;
let pausedProgress = 0;
let lastEndpoint = null;
let isSpacePressed = false;
let gesture = null;
let view = { offsetX: 220, offsetY: 180, scale: 0.55 };

function setStatus(text) {
  statusEl.textContent = 'Status: ' + text;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawScene();
}
window.addEventListener('resize', resizeCanvas);

function getScreenPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function screenToWorld(point) {
  return {
    x: point.x / view.scale + view.offsetX,
    y: point.y / view.scale + view.offsetY,
  };
}

function worldToScreen(point) {
  return {
    x: (point.x - view.offsetX) * view.scale,
    y: (point.y - view.offsetY) * view.scale,
  };
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function normalizeWheel(event) {
  return event.deltaY > 0 ? 0.92 : 1.08;
}

function zoomAt(screenPoint, factor) {
  const oldScale = view.scale;
  const newScale = clamp(oldScale * factor, MIN_SCALE, MAX_SCALE);
  if (newScale === oldScale) return;
  const worldX = screenPoint.x / oldScale + view.offsetX;
  const worldY = screenPoint.y / oldScale + view.offsetY;
  view.scale = newScale;
  view.offsetX = worldX - screenPoint.x / newScale;
  view.offsetY = worldY - screenPoint.y / newScale;
  drawScene();
}

function panBy(deltaScreenX, deltaScreenY) {
  view.offsetX -= deltaScreenX / view.scale;
  view.offsetY -= deltaScreenY / view.scale;
  drawScene();
}

function fitPointsToViewport(points) {
  if (!points.length) return;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  const rect = canvas.getBoundingClientRect();
  const padding = 60;
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const scaleX = (rect.width - padding * 2) / width;
  const scaleY = (rect.height - padding * 2) / height;
  view.scale = clamp(Math.min(scaleX, scaleY), MIN_SCALE, MAX_SCALE);
  view.offsetX = minX - (rect.width / view.scale - width) / 2;
  view.offsetY = minY - (rect.height / view.scale - height) / 2;
  drawScene();
}

function samplePolyline(points, targetCount) {
  if (points.length < 2) return points.slice();
  const segLengths = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const len = distance(points[i - 1], points[i]);
    segLengths.push(len);
    total += len;
  }
  if (total === 0) return points.slice(0, targetCount);
  const sampled = [];
  for (let i = 0; i < targetCount; i++) {
    const target = (i / targetCount) * total;
    let acc = 0;
    let segIndex = 0;
    while (segIndex < segLengths.length && acc + segLengths[segIndex] < target) {
      acc += segLengths[segIndex];
      segIndex++;
    }
    if (segIndex >= segLengths.length) {
      sampled.push({ ...points[points.length - 1] });
      continue;
    }
    const p1 = points[segIndex];
    const p2 = points[segIndex + 1];
    const segLen = segLengths[segIndex] || 1;
    const t = (target - acc) / segLen;
    sampled.push({
      x: p1.x + (p2.x - p1.x) * t,
      y: p1.y + (p2.y - p1.y) * t,
    });
  }
  return sampled;
}

function dft(points) {
  const N = points.length;
  const out = [];
  for (let k = 0; k < N; k++) {
    let re = 0;
    let im = 0;
    for (let n = 0; n < N; n++) {
      const phi = (-2 * Math.PI * k * n) / N;
      const x = points[n].x;
      const y = points[n].y;
      re += x * Math.cos(phi) - y * Math.sin(phi);
      im += x * Math.sin(phi) + y * Math.cos(phi);
    }
    out.push({ re, im, k });
  }
  return out;
}

function extractEpicycles(complex) {
  const N = complex.length;
  const res = [];
  for (let i = 0; i < N; i++) {
    const j = i % 2 === 0 ? i / 2 : N - (i + 1) / 2;
    const { re, im } = complex[j];
    const freq = ((j + N / 2) % N) - N / 2;
    res.push({
      frequency: freq,
      amplitude: Math.hypot(re, im) / N,
      phase: Math.atan2(im, re),
    });
  }
  return res.sort((a, b) => b.amplitude - a.amplitude);
}

function getTermCount() {
  return Math.min(Number(termsRange.value), epicycles.length || Number(termsRange.value));
}

function computeEndpoint(t, count) {
  let x = 0;
  let y = 0;
  const positions = [];
  for (let i = 0; i < count; i++) {
    const e = epicycles[i];
    const prevX = x;
    const prevY = y;
    x += e.amplitude * Math.cos(e.frequency * t + e.phase);
    y += e.amplitude * Math.sin(e.frequency * t + e.phase);
    positions.push({ cx: prevX, cy: prevY, x, y, r: e.amplitude });
  }
  return { x, y, positions };
}

function drawWorldGrid(rect) {
  ctx.save();
  ctx.strokeStyle = 'rgba(37,99,235,0.09)';
  ctx.lineWidth = 1;
  const step = 120;
  const startX = Math.floor(view.offsetX / step) * step;
  const startY = Math.floor(view.offsetY / step) * step;
  for (let x = startX; x <= view.offsetX + rect.width / view.scale; x += step) {
    const sx = (x - view.offsetX) * view.scale;
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, rect.height);
    ctx.stroke();
  }
  for (let y = startY; y <= view.offsetY + rect.height / view.scale; y += step) {
    const sy = (y - view.offsetY) * view.scale;
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.lineTo(rect.width, sy);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPolyline(points, color, lineWidth) {
  if (points.length < 2) return;
  ctx.beginPath();
  const first = worldToScreen(points[0]);
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < points.length; i++) {
    const sp = worldToScreen(points[i]);
    ctx.lineTo(sp.x, sp.y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function drawEpicycles(positions) {
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 1;
  for (const p of positions) {
    const c = worldToScreen({ x: p.cx, y: p.cy });
    const end = worldToScreen({ x: p.x, y: p.y });
    ctx.beginPath();
    ctx.arc(c.x, c.y, p.r * view.scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }
}

function drawViewportHint(rect) {
  ctx.save();
  ctx.strokeStyle = 'rgba(37,99,235,0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, rect.width - 1, rect.height - 1);
  ctx.restore();
}

function drawScene() {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);
  drawWorldGrid(rect);
  drawPolyline(rawPoints, 'rgba(37,99,235,0.3)', 2);
  drawPolyline(resultTrail, '#111827', 2.5);
  if (lastEndpoint?.positions) {
    drawEpicycles(lastEndpoint.positions);
    const finalPoint = worldToScreen({ x: lastEndpoint.x, y: lastEndpoint.y });
    ctx.beginPath();
    ctx.arc(finalPoint.x, finalPoint.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
  }
  drawViewportHint(rect);
}

function animateFrame(now) {
  if (!isPlaying || epicycles.length === 0) return;
  const duration = Math.max(1000, Number(durationInput.value) || 12000);
  const elapsed = now - startTime;
  let progress = pausedProgress + elapsed / duration;
  if (progress >= 1) {
    progress = 1;
    isPlaying = false;
  }
  const t = progress * Math.PI * 2;
  const endpoint = computeEndpoint(t, getTermCount());
  lastEndpoint = endpoint;
  if (!resultTrail.length || distance(resultTrail[resultTrail.length - 1], endpoint) > 0.8) {
    resultTrail.push({ x: endpoint.x, y: endpoint.y });
  }
  drawScene();
  if (isPlaying) {
    requestAnimationFrame(animateFrame);
  } else {
    pausedProgress = progress;
    setStatus(progress >= 1 ? 'playback complete. You can export the replay or compare different term counts.' : 'paused.');
  }
}

function resetPlayback() {
  resultTrail = [];
  pausedProgress = 0;
  lastEndpoint = null;
}

function play() {
  if (!epicycles.length) {
    setStatus('no Fourier data yet. Generate or import a replay first.');
    return;
  }
  isPlaying = true;
  startTime = performance.now();
  setStatus('playing Fourier reconstruction animation.');
  requestAnimationFrame(animateFrame);
}

function buildExportPayload() {
  return {
    version: 2,
    createdAt: new Date().toISOString(),
    source: { rawPoints, sampledPoints },
    settings: {
      duration: Number(durationInput.value) || 12000,
      sampleCount: Number(sampleInput.value) || 512,
      termCount: getTermCount(),
      view,
      canvas: {
        width: canvas.getBoundingClientRect().width,
        height: canvas.getBoundingClientRect().height,
      },
    },
    epicycles,
  };
}

function loadReplayData(data) {
  if (!Array.isArray(data.epicycles)) throw new Error('missing epicycles array');
  rawPoints = data.source?.rawPoints || [];
  sampledPoints = data.source?.sampledPoints || [];
  epicycles = data.epicycles;
  if (data.settings?.duration) durationInput.value = String(data.settings.duration);
  if (data.settings?.sampleCount) sampleInput.value = String(data.settings.sampleCount);
  if (data.settings?.view) view = { ...view, ...data.settings.view };
  const preferredTermCount = data.settings?.termCount || Math.min(80, epicycles.length);
  termsRange.max = String(epicycles.length);
  termsRange.value = String(Math.max(1, Math.min(preferredTermCount, epicycles.length)));
  termsValue.textContent = termsRange.value;
  resetPlayback();
  lastEndpoint = computeEndpoint(0, getTermCount());
  drawScene();
  setStatus('import successful. Replay is ready.');
}

function resetView() {
  view = { offsetX: 220, offsetY: 180, scale: 0.55 };
  drawScene();
}

function beginDrawing(screenPoint) {
  drawing = true;
  isPlaying = false;
  rawPoints = [];
  sampledPoints = [];
  epicycles = [];
  resultTrail = [];
  lastEndpoint = null;
  pausedProgress = 0;
  rawPoints.push(screenToWorld(screenPoint));
  drawScene();
  setStatus('drawing...');
}

function continueDrawing(screenPoint) {
  const p = screenToWorld(screenPoint);
  const last = rawPoints[rawPoints.length - 1];
  if (!last || distance(last, p) > 2 / view.scale) {
    rawPoints.push(p);
    drawScene();
  }
}

function finishDrawing() {
  if (!drawing) return;
  drawing = false;
  setStatus(rawPoints.length > 1 ? 'drawing complete. Click “Generate Fourier”.' : 'too few points. Please draw again.');
}

canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  zoomAt(getScreenPoint(event), normalizeWheel(event));
}, { passive: false });

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') isSpacePressed = true;
});
window.addEventListener('keyup', (event) => {
  if (event.code === 'Space') isSpacePressed = false;
});

canvas.addEventListener('pointerdown', (event) => {
  canvas.setPointerCapture(event.pointerId);
  const p = getScreenPoint(event);
  if (event.pointerType === 'touch') {
    if (!gesture) {
      gesture = { pointers: new Map(), mode: 'pending' };
    }
    gesture.pointers.set(event.pointerId, p);
    if (gesture.pointers.size === 1) {
      gesture.mode = 'draw';
      beginDrawing(p);
    } else if (gesture.pointers.size === 2) {
      finishDrawing();
      const pts = [...gesture.pointers.values()];
      gesture.mode = 'panzoom';
      gesture.startMid = midpoint(pts[0], pts[1]);
      gesture.startDistance = distance(pts[0], pts[1]);
      gesture.startOffsetX = view.offsetX;
      gesture.startOffsetY = view.offsetY;
      gesture.startScale = view.scale;
      setStatus('navigating canvas...');
    }
    return;
  }

  if (event.button === 1 || isSpacePressed) {
    gesture = { mode: 'pan', lastPoint: p };
    setStatus('panning viewport...');
    return;
  }

  beginDrawing(p);
});

canvas.addEventListener('pointermove', (event) => {
  const p = getScreenPoint(event);
  if (event.pointerType === 'touch' && gesture?.pointers) {
    gesture.pointers.set(event.pointerId, p);
    if (gesture.mode === 'draw' && drawing && gesture.pointers.size === 1) {
      continueDrawing(p);
    } else if (gesture.mode === 'panzoom' && gesture.pointers.size >= 2) {
      const pts = [...gesture.pointers.values()];
      const mid = midpoint(pts[0], pts[1]);
      const dist = Math.max(10, distance(pts[0], pts[1]));
      view.scale = clamp(gesture.startScale * (dist / gesture.startDistance), MIN_SCALE, MAX_SCALE);
      view.offsetX = gesture.startOffsetX - (mid.x / view.scale - gesture.startMid.x / gesture.startScale);
      view.offsetY = gesture.startOffsetY - (mid.y / view.scale - gesture.startMid.y / gesture.startScale);
      drawScene();
    }
    return;
  }

  if (gesture?.mode === 'pan') {
    panBy(p.x - gesture.lastPoint.x, p.y - gesture.lastPoint.y);
    gesture.lastPoint = p;
    return;
  }

  if (drawing) continueDrawing(p);
});

function endPointer(event) {
  if (event.pointerType === 'touch' && gesture?.pointers) {
    gesture.pointers.delete(event.pointerId);
    if (gesture.pointers.size === 0) {
      finishDrawing();
      gesture = null;
      return;
    }
    if (gesture.mode === 'panzoom' && gesture.pointers.size === 1) {
      gesture = { pointers: new Map(gesture.pointers), mode: 'pending' };
      setStatus('canvas navigation ended.');
    }
    return;
  }
  if (gesture?.mode === 'pan') {
    gesture = null;
    setStatus('viewport ready.');
    return;
  }
  finishDrawing();
}

canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('pointerleave', (event) => {
  if (event.pointerType !== 'touch' && !gesture?.mode) finishDrawing();
});

clearBtn.addEventListener('click', () => {
  drawing = false;
  rawPoints = [];
  sampledPoints = [];
  epicycles = [];
  resultTrail = [];
  lastEndpoint = null;
  pausedProgress = 0;
  isPlaying = false;
  jsonInput.value = '';
  if (importFile) importFile.value = '';
  drawScene();
  setStatus('cleared. Draw a new path to begin.');
});

analyzeBtn.addEventListener('click', () => {
  if (rawPoints.length < 2) {
    setStatus('draw a continuous path first.');
    return;
  }
  const sampleCount = Math.max(64, Number(sampleInput.value) || 512);
  sampledPoints = samplePolyline(rawPoints, sampleCount);
  const complex = dft(sampledPoints);
  epicycles = extractEpicycles(complex);
  termsRange.max = String(epicycles.length);
  if (Number(termsRange.value) > epicycles.length) termsRange.value = String(epicycles.length);
  termsValue.textContent = termsRange.value;
  resetPlayback();
  lastEndpoint = computeEndpoint(0, getTermCount());
  fitPointsToViewport(rawPoints);
  setStatus(`Fourier generated with ${epicycles.length} terms. Ready to replay or export.`);
});

playBtn.addEventListener('click', () => {
  if (isPlaying) {
    isPlaying = false;
  } else {
    if (pausedProgress >= 1) resetPlayback();
    play();
  }
});

termsRange.addEventListener('input', () => {
  termsValue.textContent = termsRange.value;
  if (epicycles.length) {
    resetPlayback();
    lastEndpoint = computeEndpoint(0, getTermCount());
    drawScene();
    setStatus(`switched to the top ${getTermCount()} terms. Replay to compare approximation quality.`);
  }
});

copyBtn.addEventListener('click', async () => {
  if (!epicycles.length) {
    setStatus('nothing to copy yet. Generate or import a replay first.');
    return;
  }
  const text = JSON.stringify(buildExportPayload(), null, 2);
  try {
    await navigator.clipboard.writeText(text);
    jsonInput.value = text;
    setStatus('JSON copied to clipboard.');
  } catch {
    jsonInput.value = text;
    setStatus('clipboard unavailable. JSON was placed in the textarea for manual copy.');
  }
});

exportBtn.addEventListener('click', () => {
  if (!epicycles.length) {
    setStatus('nothing to export yet. Generate or import a replay first.');
    return;
  }
  const blob = new Blob([JSON.stringify(buildExportPayload(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fourier-visualizer-data.json';
  a.click();
  URL.revokeObjectURL(url);
  setStatus('JSON exported.');
});

importBtn.addEventListener('click', () => {
  try {
    loadReplayData(JSON.parse(jsonInput.value));
  } catch (err) {
    setStatus('import failed: ' + err.message);
  }
});

if (importFile) {
  importFile.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      jsonInput.value = text;
      loadReplayData(JSON.parse(text));
    } catch (err) {
      setStatus('file import failed: ' + err.message);
    }
  });
}

resetViewBtn.addEventListener('click', () => {
  resetView();
  setStatus('viewport reset.');
});

centerPathBtn.addEventListener('click', () => {
  if (!rawPoints.length) {
    setStatus('draw or import a path first.');
    return;
  }
  fitPointsToViewport(rawPoints);
  setStatus('path centered in the viewport.');
});

resizeCanvas();
setStatus('draw a continuous path in the canvas viewport.');
