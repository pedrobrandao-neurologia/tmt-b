/* =============================================================================
 * layoutGenerator.js — Gerador de formas paralelas para o TMT-B
 * -----------------------------------------------------------------------------
 * Gera arranjos de 25 itens (esqueleto geométrico) estatisticamente equivalentes
 * à forma original do TMT-B, via amostragem-com-rejeição sobre uma grade fina,
 * controlando os invariantes geométricos que tornam duas formas intercambiáveis
 * para reteste longitudinal sem efeito de memorização do layout.
 *
 * Funciona em Node (CLI / testes) e no navegador (qa.html / index.html).
 * Sem dependências. RNG determinístico por seed (reprodutibilidade total).
 *
 * Esquema de rotulagem B (atenção alternada): o caminho-solução percorre os 25
 * itens na ordem 1 → A → 2 → B → 3 → C ... → 12 → L → 13. A geometria é gerada
 * de forma agnóstica ao rótulo; a alternância número/letra é aplicada por cima.
 *
 * Invariantes controlados (requisitos #1–#6):
 *   1. Não-cruzamento da trilha-solução.
 *   2. Não-sobreposição (distância mínima entre centros).
 *   3. Cobertura espacial (convex hull dentro de uma janela-alvo).
 *   4. Deslocamento Poisson(μ) entre consecutivos, com piso e teto.
 *   5. Densidade de near-distractors dentro de um raio crítico.
 *   6. Distribuição angular das mudanças de direção, calibrada ao original.
 *
 * Coordenadas normalizadas no campo unitário [0,1] × [0,1] (área = 1).
 * O app mapeia (x,y) → arena escalando cada eixo independentemente, exatamente
 * como o posicionamento aleatório anterior já fazia.
 * ===========================================================================*/
'use strict';

/* ------------------------------------------------------------------ *
 * RNG determinístico (Mulberry32) — mesma família usada no index.html *
 * ------------------------------------------------------------------ */
function seededRand(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ *
 * Parâmetros padrão (config nomeada/comentada, requisito D)          *
 * Todos deriváveis de seed; tolerâncias calibradas no qa.html.       *
 * ------------------------------------------------------------------ */
const DEFAULT_PARAMS = {
  nItems: 25,            // 13 números + 12 letras
  gridFine: 200,         // grade fina de snap (1/200 = 0.005)
  gridCoarse: 16,        // grade grosseira p/ deslocamento (unidade ≈ 0.0625)
  circleDiameter: 0.11,  // diâmetro normalizado (≈ minPairwise do original)
  margin: 0.04,          // margem interna do campo
  minDist: 0.11,         // distância mínima entre centros (= circleDiameter)
  poissonMu: 6.4,        // μ do deslocamento em unidades de grade grosseira
                         // (μ·unidade ≈ 0.40 = passo médio do original TMT-B)
  floorDist: 0.15,       // piso de distância entre item N e N+1
  ceilDist: 0.62,        // teto de distância entre item N e N+1
  // raios críticos para a contagem de near-distractors:
  nearRadii: [0.15, 0.20, 0.25],
  nearRadiusKey: 0.20,   // raio usado para a restrição em cada passo
  nearMaxPerStep: 6,     // teto de near-distractors no passo corrente
  // janela do convex hull (% do campo) — casa o original do TMT-B (~74%):
  hullMin: 0.66,
  hullMax: 0.82,
  maxAttemptsPerItem: 400,
  maxBacktrack: 4000
};

/* ------------------------------------------------------------------ *
 * Tolerâncias de equivalência (requisito #9). Janelas em torno da    *
 * forma de referência. Calibráveis via qa.html.                      *
 * ------------------------------------------------------------------ */
const DEFAULT_TOLERANCES = {
  pathLengthPct: 0.12,     // ±12% do comprimento total
  meanStepPct: 0.12,       // ±12% do passo médio
  sdStepPct: 0.30,         // ±30% do desvio do passo
  hullPctAbs: 0.07,        // ±7 pontos percentuais de hull
  nearKeyAbs: 0.7,         // ±0.7 near-distractors (raio-chave)
  meanTurnAbs: 18,         // ±18° na virada média
  crossings: 0             // exato: zero cruzamentos
};

/* ============================== GEOMETRIA ============================== */

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

// Orientação do tripleto (p,q,r): 0 colinear, 1 horário, 2 anti-horário.
function orient(p, q, r) {
  const v = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  if (Math.abs(v) < 1e-12) return 0;
  return v > 0 ? 1 : 2;
}
function onSeg(p, q, r) {
  return q.x <= Math.max(p.x, r.x) + 1e-12 && q.x >= Math.min(p.x, r.x) - 1e-12 &&
         q.y <= Math.max(p.y, r.y) + 1e-12 && q.y >= Math.min(p.y, r.y) - 1e-12;
}
// Interseção própria de segmentos [p1,p2] e [p3,p4].
function segmentsIntersect(p1, p2, p3, p4) {
  const o1 = orient(p1, p2, p3), o2 = orient(p1, p2, p4);
  const o3 = orient(p3, p4, p1), o4 = orient(p3, p4, p2);
  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSeg(p1, p3, p2)) return true;
  if (o2 === 0 && onSeg(p1, p4, p2)) return true;
  if (o3 === 0 && onSeg(p3, p1, p4)) return true;
  if (o4 === 0 && onSeg(p3, p2, p4)) return true;
  return false;
}

// Conta autointerseções da polilinha (segmentos não-adjacentes).
function countCrossings(pts) {
  let c = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    for (let j = i + 2; j < pts.length - 1; j++) {
      if (i === 0 && j === pts.length - 2) continue; // extremos não se tocam
      if (segmentsIntersect(pts[i], pts[i + 1], pts[j], pts[j + 1])) c++;
    }
  }
  return c;
}

// Convex hull (monotone chain) → polígono.
function convexHull(points) {
  const p = points.map(o => ({ x: o.x, y: o.y })).sort((a, b) => a.x - b.x || a.y - b.y);
  if (p.length < 3) return p;
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower = [];
  for (const pt of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pt) <= 0) lower.pop();
    lower.push(pt);
  }
  const upper = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const pt = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pt) <= 0) upper.pop();
    upper.push(pt);
  }
  upper.pop(); lower.pop();
  return lower.concat(upper);
}
function polygonArea(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const j = (i + 1) % poly.length;
    a += poly[i].x * poly[j].y - poly[j].x * poly[i].y;
  }
  return Math.abs(a) / 2;
}

/* ============================== MÉTRICAS ============================== */
/**
 * computeMetrics(points) — todos os itens do requisito #8.
 * points: array em ordem de caminho [{x,y}, ...].
 */
function computeMetrics(points, params = DEFAULT_PARAMS) {
  const n = points.length;
  // comprimento total + passos
  const steps = [];
  let pathLength = 0;
  for (let i = 1; i < n; i++) {
    const d = dist(points[i - 1], points[i]);
    steps.push(d); pathLength += d;
  }
  const meanStep = steps.reduce((a, b) => a + b, 0) / steps.length;
  const sdStep = Math.sqrt(steps.reduce((a, b) => a + (b - meanStep) ** 2, 0) / steps.length);

  // cruzamentos
  const crossings = countCrossings(points);

  // convex hull
  const hull = convexHull(points);
  const hullArea = polygonArea(hull);
  const hullPct = hullArea; // campo unitário ⇒ área já é fração do campo

  // near-distractors: média, por raio, do nº de outros itens dentro do raio
  const nearByRadius = {};
  for (const R of params.nearRadii) {
    let total = 0;
    for (let i = 0; i < n; i++) {
      let c = 0;
      for (let j = 0; j < n; j++) {
        if (i !== j && dist(points[i], points[j]) <= R) c++;
      }
      total += c;
    }
    nearByRadius[R] = total / n;
  }

  // distribuição angular das mudanças de direção (graus, 0–180)
  const turns = [];
  for (let i = 1; i < n - 1; i++) {
    const v1 = { x: points[i].x - points[i - 1].x, y: points[i].y - points[i - 1].y };
    const v2 = { x: points[i + 1].x - points[i].x, y: points[i + 1].y - points[i].y };
    const m1 = Math.hypot(v1.x, v1.y), m2 = Math.hypot(v2.x, v2.y);
    if (m1 < 1e-9 || m2 < 1e-9) continue;
    let cos = (v1.x * v2.x + v1.y * v2.y) / (m1 * m2);
    cos = Math.max(-1, Math.min(1, cos));
    // ângulo interno entre segmentos (180° = reta; pequeno = virada acentuada)
    turns.push(180 - Math.acos(cos) * 180 / Math.PI);
  }
  const meanTurn = turns.reduce((a, b) => a + b, 0) / turns.length;
  // histograma em faixas de 30°
  const turnHistogram = [0, 0, 0, 0, 0, 0]; // 0–30,30–60,...,150–180
  for (const t of turns) turnHistogram[Math.min(5, Math.floor(t / 30))]++;

  // menor distância par-a-par (controle de sobreposição)
  let minPair = Infinity;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      minPair = Math.min(minPair, dist(points[i], points[j]));

  return {
    nItems: n,
    pathLength: +pathLength.toFixed(4),
    meanStep: +meanStep.toFixed(4),
    sdStep: +sdStep.toFixed(4),
    crossings,
    hullArea: +hullArea.toFixed(4),
    hullPct: +(hullPct * 100).toFixed(2),
    nearDistractors: Object.fromEntries(Object.entries(nearByRadius).map(([k, v]) => [k, +v.toFixed(3)])),
    nearKey: +nearByRadius[params.nearRadiusKey].toFixed(3),
    meanTurn: +meanTurn.toFixed(2),
    turnHistogram,
    minPair: +minPair.toFixed(4)
  };
}

/* ====================== REFERÊNCIA — TMT-B ORIGINAL ====================== */
/**
 * Coordenadas digitalizadas (aproximadas) da figura original do TMT-B
 * fornecida pelo autor, normalizadas em [0,1] (x/543, y/662), em ordem de
 * caminho 1→A→2→B→...→12→L→13. Refináveis se houver coordenadas oficiais.
 */
const REFERENCE_TMT_B_POINTS = [
  { label: '1',  x: 0.530, y: 0.447 },
  { label: 'A',  x: 0.720, y: 0.728 },
  { label: '2',  x: 0.298, y: 0.796 },
  { label: 'B',  x: 0.455, y: 0.189 },
  { label: '3',  x: 0.459, y: 0.325 },
  { label: 'C',  x: 0.676, y: 0.557 },
  { label: '4',  x: 0.567, y: 0.160 },
  { label: 'D',  x: 0.821, y: 0.124 },
  { label: '5',  x: 0.816, y: 0.480 },
  { label: 'E',  x: 0.843, y: 0.873 },
  { label: '6',  x: 0.457, y: 0.829 },
  { label: 'F',  x: 0.208, y: 0.893 },
  { label: '7',  x: 0.333, y: 0.424 },
  { label: 'G',  x: 0.219, y: 0.639 },
  { label: '8',  x: 0.162, y: 0.131 },
  { label: 'H',  x: 0.236, y: 0.509 },
  { label: '9',  x: 0.328, y: 0.125 },
  { label: 'I',  x: 0.674, y: 0.118 },
  { label: '10', x: 0.945, y: 0.057 },
  { label: 'J',  x: 0.895, y: 0.733 },
  { label: '11', x: 0.961, y: 0.941 },
  { label: 'K',  x: 0.123, y: 0.947 },
  { label: '12', x: 0.107, y: 0.600 },
  { label: 'L',  x: 0.169, y: 0.829 },
  { label: '13', x: 0.096, y: 0.071 }
];

const REFERENCE_TMT_B = {
  points: REFERENCE_TMT_B_POINTS,
  metrics: computeMetrics(REFERENCE_TMT_B_POINTS)
};

/* ====================== ROTULAGEM (esquema B) ====================== */
// Ordem alternada do TMT-B: 1, A, 2, B, ..., 12, L, 13.
function labelSequenceB() {
  const seq = [];
  for (let i = 1; i <= 12; i++) {
    seq.push({ v: String(i), t: 'number' });
    seq.push({ v: String.fromCharCode(64 + i), t: 'letter' }); // A=65
  }
  seq.push({ v: '13', t: 'number' });
  return seq;
}
// Aplica rótulos B sobre o esqueleto geométrico (pontos em ordem de caminho).
function applyLabelsB(points) {
  const seq = labelSequenceB();
  return points.map((p, i) => ({ x: p.x, y: p.y, v: seq[i].v, t: seq[i].t }));
}

/* ====================== AMOSTRAGEM ====================== */
function poisson(rng, mu) {
  // Algoritmo de Knuth.
  const L = Math.exp(-mu);
  let k = 0, p = 1;
  do { k++; p *= rng(); } while (p > L);
  return k - 1;
}

/**
 * generateLayout({seed, params}) — constrói o caminho 1→25 sequencialmente
 * por amostragem-com-rejeição, com backtracking. Retorna {points, metrics,
 * seed, ok} onde points está em ordem de caminho (geometria pura).
 */
function generateLayout({ seed = 1, params = {} } = {}) {
  const P = Object.assign({}, DEFAULT_PARAMS, params);
  const rng = seededRand(seed);
  const snap = v => Math.round(v * P.gridFine) / P.gridFine;
  const lo = P.margin, hi = 1 - P.margin;
  const coarseUnit = 1 / P.gridCoarse;

  // turnos empíricos do original (em graus, internos) p/ calibrar a forma
  const refTurns = [];
  {
    const pts = REFERENCE_TMT_B.points;
    for (let i = 1; i < pts.length - 1; i++) {
      const v1 = { x: pts[i].x - pts[i - 1].x, y: pts[i].y - pts[i - 1].y };
      const v2 = { x: pts[i + 1].x - pts[i].x, y: pts[i + 1].y - pts[i].y };
      const m1 = Math.hypot(v1.x, v1.y), m2 = Math.hypot(v2.x, v2.y);
      let cos = (v1.x * v2.x + v1.y * v2.y) / (m1 * m2);
      cos = Math.max(-1, Math.min(1, cos));
      refTurns.push(180 - Math.acos(cos) * 180 / Math.PI);
    }
  }

  const pts = [];
  // primeiro ponto: amostrado na região central (como o "Início" do original)
  pts.push({ x: snap(0.35 + rng() * 0.3), y: snap(0.35 + rng() * 0.3) });

  let heading = rng() * 2 * Math.PI; // direção inicial aleatória
  let backtracks = 0;

  function fits(cand, upto) {
    if (cand.x < lo || cand.x > hi || cand.y < lo || cand.y > hi) return false;
    for (let i = 0; i < upto; i++) if (dist(cand, pts[i]) < P.minDist) return false;
    // não-cruzamento: novo segmento [pts[upto-1], cand] x segmentos anteriores
    if (upto >= 2) {
      const a = pts[upto - 1];
      for (let i = 0; i < upto - 2; i++) {
        if (segmentsIntersect(pts[i], pts[i + 1], a, cand)) return false;
      }
    }
    // near-distractors: nº de itens já colocados dentro do raio-chave de cand
    let near = 0;
    for (let i = 0; i < upto; i++) if (dist(cand, pts[i]) <= P.nearRadiusKey) near++;
    if (near > P.nearMaxPerStep) return false;
    return true;
  }

  while (pts.length < P.nItems) {
    const idx = pts.length;
    let placed = false;
    let lastHeading = heading;

    for (let attempt = 0; attempt < P.maxAttemptsPerItem; attempt++) {
      // distância ~ Poisson(μ) em unidades de grade grosseira, com piso/teto
      let stepUnits = poisson(rng, P.poissonMu);
      let stepLen = stepUnits * coarseUnit;
      stepLen = Math.max(P.floorDist, Math.min(P.ceilDist, stepLen));

      // ângulo de virada amostrado do conjunto empírico do original + ruído
      const baseTurn = refTurns[Math.floor(rng() * refTurns.length)];
      const turn = baseTurn + (rng() - 0.5) * 30; // ±15° de jitter
      const sign = rng() < 0.5 ? 1 : -1;
      const deltaDir = sign * (180 - turn) * Math.PI / 180; // desvio do "seguir reto"
      const newHeading = lastHeading + deltaDir;

      const cand = {
        x: snap(pts[idx - 1].x + Math.cos(newHeading) * stepLen),
        y: snap(pts[idx - 1].y + Math.sin(newHeading) * stepLen)
      };
      if (fits(cand, idx)) {
        pts.push(cand);
        heading = newHeading;
        placed = true;
        break;
      }
    }

    if (!placed) {
      // backtracking: remove o último ponto e tenta de novo com nova direção
      if (pts.length > 1 && backtracks < P.maxBacktrack) {
        pts.pop();
        heading = rng() * 2 * Math.PI;
        backtracks++;
      } else {
        return { points: null, metrics: null, seed, ok: false, reason: 'stuck' };
      }
    }
  }

  const metrics = computeMetrics(pts, P);
  const ok = metrics.crossings === 0 &&
             metrics.hullPct >= P.hullMin * 100 &&
             metrics.hullPct <= P.hullMax * 100;
  return { points: pts, metrics, seed, ok, backtracks };
}

/* ====================== EQUIVALÊNCIA ====================== */
/**
 * isEquivalent(A, B, tolerances) — A,B são objetos de métricas (computeMetrics).
 * Retorna {equivalent, deltas}. Aceita uma forma só se cair nas janelas em
 * todos os invariantes relativos à referência B.
 */
function isEquivalent(A, B, tol = DEFAULT_TOLERANCES) {
  const deltas = {
    pathLength: Math.abs(A.pathLength - B.pathLength) / B.pathLength,
    meanStep: Math.abs(A.meanStep - B.meanStep) / B.meanStep,
    sdStep: Math.abs(A.sdStep - B.sdStep) / B.sdStep,
    hullPct: Math.abs(A.hullPct - B.hullPct),
    nearKey: Math.abs(A.nearKey - B.nearKey),
    meanTurn: Math.abs(A.meanTurn - B.meanTurn),
    crossings: A.crossings
  };
  const equivalent =
    deltas.pathLength <= tol.pathLengthPct &&
    deltas.meanStep <= tol.meanStepPct &&
    deltas.sdStep <= tol.sdStepPct &&
    deltas.hullPct <= tol.hullPctAbs * 100 &&
    deltas.nearKey <= tol.nearKeyAbs &&
    deltas.meanTurn <= tol.meanTurnAbs &&
    deltas.crossings === tol.crossings;
  return { equivalent, deltas };
}

/**
 * generateEquivalentSet({count, seedStart, tolerances, params}) — varre seeds
 * a partir de seedStart e coleta `count` formas equivalentes à referência.
 */
function generateEquivalentSet({ count = 6, seedStart = 1, tolerances = DEFAULT_TOLERANCES,
                                 params = {}, maxSeeds = 20000 } = {}) {
  const ref = REFERENCE_TMT_B.metrics;
  const forms = [];
  let seed = seedStart, scanned = 0;
  while (forms.length < count && scanned < maxSeeds) {
    const r = generateLayout({ seed, params });
    scanned++;
    if (r.ok) {
      const eq = isEquivalent(r.metrics, ref, tolerances);
      if (eq.equivalent) {
        forms.push({
          seed: r.seed,
          points: r.points.map(p => ({ x: +p.x.toFixed(4), y: +p.y.toFixed(4) })),
          labeled: applyLabelsB(r.points).map(p => ({ x: +p.x.toFixed(4), y: +p.y.toFixed(4), v: p.v, t: p.t })),
          metrics: r.metrics,
          deltas: eq.deltas
        });
      }
    }
    seed++;
  }
  return { reference: REFERENCE_TMT_B, forms, scanned, tolerances };
}

/* ====================== EXPORT ====================== */
function toJSON(set) { return JSON.stringify(set, null, 2); }

function toCSV(set) {
  const lines = ['seed,pathLength,meanStep,sdStep,crossings,hullPct,nearKey,meanTurn,minPair'];
  const ref = set.reference.metrics;
  lines.push(`REFERENCE,${ref.pathLength},${ref.meanStep},${ref.sdStep},${ref.crossings},${ref.hullPct},${ref.nearKey},${ref.meanTurn},${ref.minPair}`);
  for (const f of set.forms) {
    const m = f.metrics;
    lines.push(`${f.seed},${m.pathLength},${m.meanStep},${m.sdStep},${m.crossings},${m.hullPct},${m.nearKey},${m.meanTurn},${m.minPair}`);
  }
  return lines.join('\n');
}

/* ====================== EXPORTS / CLI ====================== */
const API = {
  seededRand, computeMetrics, generateLayout, isEquivalent, generateEquivalentSet,
  applyLabelsB, labelSequenceB, convexHull, polygonArea, countCrossings, segmentsIntersect,
  toJSON, toCSV, REFERENCE_TMT_B, DEFAULT_PARAMS, DEFAULT_TOLERANCES
};

if (typeof module !== 'undefined' && module.exports) module.exports = API;
if (typeof window !== 'undefined') window.TMTBLayout = API;

/* CLI: node layoutGenerator.js --seed S --count K --out forms.generated.json */
if (typeof require !== 'undefined' && require.main === module) {
  const args = process.argv.slice(2);
  const get = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
  if (args.includes('--probe')) {
    // sonda de viabilidade/calibração
    const N = parseInt(get('--probe-n', '300'), 10);
    let complete = 0, hullCross = 0, equiv = 0;
    const t0 = Date.now();
    for (let s = 1; s <= N; s++) {
      const r = generateLayout({ seed: s });
      if (r.points) complete++;
      if (r.ok) {
        hullCross++;
        if (isEquivalent(r.metrics, REFERENCE_TMT_B.metrics).equivalent) equiv++;
      }
    }
    const ms = (Date.now() - t0) / N;
    console.log('REFERENCE metrics:', JSON.stringify(REFERENCE_TMT_B.metrics, null, 2));
    console.log(`\nProbe over ${N} seeds: complete=${complete}, hull+cross ok=${hullCross}, equivalent=${equiv}, ${ms.toFixed(1)}ms/seed`);
  } else {
    const count = parseInt(get('--count', '6'), 10);
    const seedStart = parseInt(get('--seedStart', '1'), 10);
    const out = get('--out', 'forms.generated.json');
    const set = generateEquivalentSet({ count, seedStart });
    const fs = require('fs');
    fs.writeFileSync(out, toJSON(set));
    console.log(`Generated ${set.forms.length}/${count} equivalent forms (scanned ${set.scanned} seeds) → ${out}`);
    console.log('Seeds:', set.forms.map(f => f.seed).join(', '));
    console.log(toCSV(set));
  }
}
