/* appTest.js — harness jsdom do index.html (TMT-B v4).
 * Verifica que a administração (forma do banco, não-cruzamento/sobreposição na
 * arena, ciclagem de formas, sequência alternada, execução completa com seed no
 * relatório, detecção de erro) continua íntegra com o banco de formas paralelas.
 * Roda com: node appTest.js  (requer jsdom). */
'use strict';
const fs = require('fs');
const { JSDOM } = require('jsdom');

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? '  → ' + extra : '')); }
}
function segInt(p1, p2, p3, p4) {
  const o = (a, b, c) => { const v = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y); return Math.abs(v) < 1e-9 ? 0 : (v > 0 ? 1 : 2); };
  return o(p1, p2, p3) !== o(p1, p2, p4) && o(p3, p4, p1) !== o(p3, p4, p2);
}

async function makeApp({ W = 900, H = 520, seed = null } = {}) {
  const html = fs.readFileSync('index.html', 'utf8');
  const url = 'https://example.org/' + (seed != null ? `?seed=${seed}` : '');
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url });
  const win = dom.window;
  // Stub de layout: jsdom não faz layout, então fixamos o tamanho da arena.
  win.HTMLElement.prototype.getBoundingClientRect = function () {
    if (this.id === 'stage') return { width: W, height: H, left: 0, top: 0, right: W, bottom: H };
    return { width: 0, height: 0, left: 0, top: 0, right: 0, bottom: 0 };
  };
  if (!win.performance) win.performance = { now: () => Date.now() };
  await new Promise(r => { win.document.addEventListener('DOMContentLoaded', r); if (win.document.readyState !== 'loading') r(); });
  await new Promise(r => setTimeout(r, 0));
  return dom;
}

// Extrai centros (px) dos nós a partir do estado interno (state.pos).
function positions(app) { return app.state.pos.map(p => ({ x: p.x, y: p.y, v: p.item.v, t: p.item.t })); }

function checkGeometry(app, label, minSepFloor) {
  const pos = positions(app);
  // não-cruzamento da trilha-solução (ordem de caminho = ordem de pos)
  let crossings = 0;
  for (let i = 0; i < pos.length - 1; i++)
    for (let j = i + 2; j < pos.length - 1; j++) {
      if (i === 0 && j === pos.length - 2) continue;
      if (segInt(pos[i], pos[i + 1], pos[j], pos[j + 1])) crossings++;
    }
  // sobreposição: menor distância par-a-par vs diâmetro do nó renderizado
  let minPair = Infinity;
  for (let i = 0; i < pos.length; i++)
    for (let j = i + 1; j < pos.length; j++)
      minPair = Math.min(minPair, Math.hypot(pos[i].x - pos[j].x, pos[i].y - pos[j].y));
  ok(`${label}: 0 cruzamentos na arena`, crossings === 0, 'crossings=' + crossings);
  ok(`${label}: sem sobreposição (minPair ${minPair.toFixed(1)} ≥ ${minSepFloor})`, minPair >= minSepFloor);
}

(async () => {
  console.log('\n== Carregamento / construção ==');
  let dom = await makeApp({});
  let win = dom.window, app = win.tmtbApp;
  ok('app instanciado e exposto', !!app);
  ok('FORM_BANK com 6 formas', win.FORM_BANK.length === 6);

  console.log('\n== Aquecimento (8 itens) ==');
  app.startPractice();
  ok('sequência de aquecimento tem 8 itens', app.state.seq.length === 8);
  ok('nós de aquecimento posicionados', app.state.pos.length === 8);
  ok('aquecimento alterna número/letra', app.state.pos[0].item.t === 'number' && app.state.pos[1].item.t === 'letter');
  checkGeometry(app, 'aquecimento', 26 * 0.95);

  console.log('\n== Teste principal: desktop 900×520 ==');
  app.startTest();
  ok('sequência principal tem 25 itens', app.state.seq.length === 25);
  ok('25 nós posicionados', app.state.pos.length === 25);
  ok('forma do banco registrada (formSeed)', win.FORM_BANK.map(f => f.seed).includes(app.state.formSeed), 'formSeed=' + app.state.formSeed);
  ok('sequência alternada correta (1,A,2,B,…,13)', app.state.seq.map(s => s.v).join('') === '1A2B3C4D5E6F7G8H9I10J11K12L13');
  checkGeometry(app, 'desktop', 26 * 0.95);

  console.log('\n== Ciclagem de formas ==');
  const seeds = [];
  for (let k = 0; k < 7; k++) { app.startTest(); seeds.push(app.state.formSeed); }
  const distinct = new Set(seeds.slice(0, 6));
  ok('6 formas distintas ao ciclar', distinct.size === 6, 'seeds=' + seeds.join(','));
  ok('7ª execução volta ao início (ciclo)', seeds[6] === seeds[0]);

  console.log('\n== Telas pequenas (toque) ==');
  for (const sz of [{ W: 600, H: 440 }, { W: 360, H: 440 }, { W: 294, H: 440 }]) {
    const d2 = await makeApp(sz);
    const a2 = d2.window.tmtbApp;
    a2.startTest();
    checkGeometry(a2, `${sz.W}×${sz.H}`, 26 * 0.92);
  }

  console.log('\n== Seed determinístico → forma fixa ==');
  {
    const dA = await makeApp({ seed: 2 }); dA.window.tmtbApp.startTest();
    const dB = await makeApp({ seed: 2 }); dB.window.tmtbApp.startTest();
    ok('seed=2 escolhe a mesma forma', dA.window.tmtbApp.state.formSeed === dB.window.tmtbApp.state.formSeed);
    ok('seed=2 → índice 2 do banco', dA.window.tmtbApp.state.formIndex === 2);
  }

  console.log('\n== Execução completa + erro + relatório ==');
  {
    const d3 = await makeApp({}); const a3 = d3.window.tmtbApp;
    a3.startTest();
    a3.state.isRunning = true; a3.state.start = d3.window.performance.now();
    const seq = a3.state.seq;
    // clique errado no 1º passo (clicar no item esperado em 2º lugar → erro de sequência/categoria)
    const wrong = a3.state.nodes.find(n => n.item.v === seq[1].v);
    a3.onClick(wrong.item, wrong.node);
    ok('erro detectado e contabilizado', a3.state.errors.length === 1);
    // agora percorre toda a sequência correta
    for (let i = 0; i < seq.length; i++) {
      const n = a3.state.nodes.find(nd => nd.item.v === seq[i].v && nd.item.t === seq[i].t);
      a3.onClick(n.item, n.node);
    }
    ok('teste finaliza (resultados gerados)', !!a3.results);
    ok('relatório expõe formSeed', a3.results.meta.formSeed != null);
    ok('relatório expõe métricas da forma', !!a3.results.meta.formMetrics);
    ok('precisão < 100% (houve erro)', a3.results.accuracyPct < 100);
    ok('eficiência espacial calculada', a3.results.spatialEfficiencyPct > 0);
    // métricas avançadas portadas do TMT-A
    const r = a3.results;
    ok('coef. de variação calculado', typeof r.cvPct === 'number' && r.cvPct >= 0);
    ok('índice de fadiga calculado', typeof r.fatigueIndexPct === 'number');
    ok('velocidade por terços presente', r.speedInitialMs >= 0 && r.speedFinalMs >= 0);
    ok('RT mín ≤ RT máx', r.minRtMs <= r.maxRtMs);
    ok('tempo até 1º erro registrado', r.firstErrorMs != null && r.firstErrorMs >= 0);
    ok('captura ambiental (device/refresh)', !!r.meta.deviceType && 'refreshRateHz' in r.meta);
    ok('switch cost ainda presente (B)', typeof r.switchCostMs === 'number');
    ok('avaliação de validade presente', typeof r.validity.valid === 'boolean' && Array.isArray(r.validity.reasons));
  }

  console.log('\n== Validade / sinalizadores ==');
  {
    const d = await makeApp({}); const a = d.window.tmtbApp;
    a.startTest();
    a.state.fastResponses = 3; a.state.focusLossCount = 2; a.state.resizeDuringTest = true;
    const v = a.computeValidity(25, 25, 5);
    ok('detecta respostas rápidas', v.reasons.some(x => /150 ms/.test(x)));
    ok('detecta perda de foco', v.reasons.some(x => /foco/.test(x)));
    ok('detecta redimensionamento', v.reasons.some(x => /redimension/i.test(x)));
    ok('resultado marcado inválido', v.valid === false);
    const v2 = a.computeValidity(25, 25, 1);
    a.state.fastResponses = 0; a.state.focusLossCount = 0; a.state.resizeDuringTest = false;
    const v3 = a.computeValidity(25, 25, 1);
    ok('sem sinalizadores → válido', v3.valid === true);
  }

  console.log('\n== Normas (Tombaugh 2004, idade + escolaridade) ==');
  {
    const d = await makeApp({}); const a = d.window.tmtbApp;
    const ND = d.window.NORMATIVE_DATA_TMTB;
    ok('11 faixas etárias na tabela', Object.keys(ND).length === 11);
    ok('cada faixa tem lo (≤12) e hi (>12)', Object.values(ND).every(o => o.lo && o.hi && o.lo.mean && o.hi.mean));
    ok('escolaridade maior → tempo esperado menor', Object.values(ND).every(o => o.hi.mean <= o.lo.mean));
    // valores oficiais Tombaugh (2004), Trail B
    ok('18-24 = 48.97 (12.69), não-estratificado', ND['18-24'].lo.mean === 48.97 && ND['18-24'].lo.sd === 12.69 && ND['18-24'].eduStratified === false && ND['18-24'].lo.mean === ND['18-24'].hi.mean);
    ok('55-59 lo/hi = 78.84/68.74, estratificado', ND['55-59'].lo.mean === 78.84 && ND['55-59'].hi.mean === 68.74 && ND['55-59'].eduStratified === true);
    ok('65-69 hi = 67.12 (9.31)', ND['65-69'].hi.mean === 67.12 && ND['65-69'].hi.sd === 9.31);
    ok('85-89 lo = 167.69 (78.50)', ND['85-89'].lo.mean === 167.69 && ND['85-89'].lo.sd === 78.50);
    // z-score → percentil: mediana ≈ 50%
    ok('z=0 → ~50º percentil', Math.abs(a.zScoreToPercentile(0) - 50) < 1);
    ok('z=+1 → ~84º percentil', Math.abs(a.zScoreToPercentile(1) - 84) < 2);
    ok('classificação por percentil', a.classifyPerformance(99).label === 'Muito Superior' && a.classifyPerformance(1).label === 'Muito Baixo');
    // tempo rápido (bom) num idoso pouco escolarizado → percentil alto
    a.results = { totalTimeMs: 60000, meta: {} };
    a.el.ageRes.value = '70-74'; a.el.eduRes.value = 'lo'; a.renderNorms();
    ok('tabela de normas renderiza 11 linhas', a.el.normTable.querySelectorAll('tr').length === 11);
    ok('linha da idade selecionada destacada', !!a.el.normTable.querySelector('tr.highlighted'));
  }

  console.log('\n== Reset ==');
  {
    const d4 = await makeApp({}); const a4 = d4.window.tmtbApp;
    a4.startTest(); a4.reset(true);
    ok('reset limpa a arena', a4.el.stage.children.length === 0);
    ok('reset volta à fase de instruções', a4.state.phase === 'instructions');
  }

  console.log(`\n== Resultado: ${pass} passaram, ${fail} falharam ==\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
