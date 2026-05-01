const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const clearBtn = document.getElementById('clearBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const playBtn = document.getElementById('playBtn');
const copyBtn = document.getElementById('copyBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const jsonInput = document.getElementById('jsonInput');
const termsRange = document.getElementById('termsRange');
const termsValue = document.getElementById('termsValue');
const durationInput = document.getElementById('durationInput');
const sampleInput = document.getElementById('sampleInput');
const statusEl = document.getElementById('status');

let drawing = false;
let rawPoints = [];
let sampledPoints = [];
let epicycles = [];
let resultTrail = [];
let isPlaying = false;
let startTime = 0;
let pausedProgress = 0;
let lastEndpoint = null;

function setStatus(text) {
  statusEl.textContent = 'Status: ' + text;
}

function resizeForDevicePixelRatio() {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawScene();
}
window.addEventListener('resize', resizeForDevicePixelRatio);

function getPointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
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

function drawRawStroke() {
  if (rawPoints.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(rawPoints[0].x, rawPoints[0].y);
  for (let i = 1; i < rawPoints.length; i++) {
    ctx.lineTo(rawPoints[i].x, rawPoints[i].y);
  }
  ctx.strokeStyle = 'rgba(37,99,235,0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawTrail() {
  if (resultTrail.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(resultTrail[0].x, resultTrail[0].y);
  for (let i = 1; i < resultTrail.length; i++) {
    ctx.lineTo(resultTrail[i].x, resultTrail[i].y);
  }
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

function drawEpicycles(positions) {
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 1;
  for (const p of positions) {
    ctx.beginPath();
    ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(p.cx, p.cy);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
}

function drawScene() {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);
  drawRawStroke();
  drawTrail();
  if (lastEndpoint?.positions) {
    drawEpicycles(lastEndpoint.positions);
    ctx.beginPath();
    ctx.arc(lastEndpoint.x, lastEndpoint.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
  }
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
    setStatus(progress >= 1 ? 'playback complete. You can copy JSON or change terms to replay.' : 'paused.');
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

function pause() {
  isPlaying = false;
}

function buildExportPayload() {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    source: {
      rawPoints,
      sampledPoints,
    },
    settings: {
      duration: Number(durationInput.value) || 12000,
      sampleCount: Number(sampleInput.value) || 512,
      termCount: getTermCount(),
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
  const preferredTermCount = data.settings?.termCount || Math.min(80, epicycles.length);
  termsRange.max = String(epicycles.length);
  termsRange.value = String(Math.max(1, Math.min(preferredTermCount, epicycles.length)));
  termsValue.textContent = termsRange.value;
  resetPlayback();
  lastEndpoint = computeEndpoint(0, getTermCount());
  drawScene();
  setStatus('import successful. You can replay it now.');
}

canvas.addEventListener('pointerdown', (e) => {
  drawing = true;
  isPlaying = false;
  rawPoints = [];
  sampledPoints = [];
  epicycles = [];
  resultTrail = [];
  lastEndpoint = null;
  pausedProgress = 0;
  const p = getPointerPos(e);
  rawPoints.push(p);
  drawScene();
  setStatus('drawing...');
});

canvas.addEventListener('pointermove', (e) => {
  if (!drawing) return;
  const p = getPointerPos(e);
  const last = rawPoints[rawPoints.length - 1];
  if (!last || distance(last, p) > 1.5) {
    rawPoints.push(p);
    drawScene();
  }
});

function finishDrawing() {
  if (!drawing) return;
  drawing = false;
  setStatus(rawPoints.length > 1 ? 'drawing complete. Click “Generate Fourier”.' : 'too few points. Please draw again.');
}
canvas.addEventListener('pointerup', finishDrawing);
canvas.addEventListener('pointerleave', finishDrawing);
canvas.addEventListener('pointercancel', finishDrawing);

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
  if (Number(termsRange.value) > epicycles.length) {
    termsRange.value = String(epicycles.length);
  }
  termsValue.textContent = termsRange.value;
  resetPlayback();
  lastEndpoint = computeEndpoint(0, getTermCount());
  setStatus(`Fourier generated with ${epicycles.length} terms. Ready to replay or export.`);
  drawScene();
});

playBtn.addEventListener('click', () => {
  if (isPlaying) {
    pause();
  } else {
    if (pausedProgress >= 1) resetPlayback();
    play();
  }
});

termsRange.addEventListener('input', () => {
  termsValue.textContent = termsRange.value;
  if (epicycles.length) {
    resetPlayback();
    const endpoint = computeEndpoint(0, getTermCount());
    lastEndpoint = endpoint;
    drawScene();
    setStatus(`switched to the top ${getTermCount()} terms. Replay to compare the approximation.`);
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
    setStatus('clipboard unavailable. JSON has been placed in the textarea for manual copy.');
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
    const data = JSON.parse(jsonInput.value);
    loadReplayData(data);
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
      const data = JSON.parse(text);
      loadReplayData(data);
    } catch (err) {
      setStatus('file import failed: ' + err.message);
    }
  });
}

resizeForDevicePixelRatio();
setStatus('draw a continuous path in the canvas area.');
