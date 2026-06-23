/* genTest.js — testes Node do gerador de formas do TMT-B.
 * Roda com: node genTest.js  (sai com código ≠ 0 se algo falhar). */
'use strict';
const fs = require('fs');
const G = require('./layoutGenerator.js');

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? '  → ' + extra : '')); }
}

console.log('\n== Determinismo ==');
{
  const a = G.generateLayout({ seed: 42 });
  const b = G.generateLayout({ seed: 42 });
  ok('mesmo seed → pontos idênticos', JSON.stringify(a.points) === JSON.stringify(b.points));
  const c = G.generateLayout({ seed: 43 });
  ok('seeds diferentes → formas diferentes', JSON.stringify(a.points) !== JSON.stringify(c.points));
}

console.log('\n== Referência (TMT-B original) ==');
{
  const ref = G.REFERENCE_TMT_B.metrics;
  ok('referência tem 25 itens', ref.nItems === 25);
  ok('referência sem cruzamentos', ref.crossings === 0, 'crossings=' + ref.crossings);
  ok('hull da referência ~74%', ref.hullPct > 65 && ref.hullPct < 85, 'hull=' + ref.hullPct);
}

console.log('\n== Banco congelado (forms.generated.json) ==');
{
  const bank = JSON.parse(fs.readFileSync('forms.generated.json', 'utf8'));
  const ref = G.REFERENCE_TMT_B.metrics;
  ok('banco tem >= 6 formas', bank.forms.length >= 6, 'n=' + bank.forms.length);
  ok('forma de aquecimento presente (8 itens)', bank.practice && bank.practice.points.length === 8);

  let allEquiv = true, allNoCross = true, allMinPair = true, allHull = true;
  let highVar = true, sharpTurns = true;
  for (const f of bank.forms) {
    const m = G.computeMetrics(f.points);
    const eq = G.isEquivalent(m, ref, bank.tolerances || G.DEFAULT_TOLERANCES);
    if (!eq.equivalent) { allEquiv = false; console.log('     forma seed ' + f.seed + ' não-equiv:', JSON.stringify(eq.deltas)); }
    if (m.crossings !== 0) allNoCross = false;
    if (m.minPair < 0.11) allMinPair = false;
    if (m.hullPct < 66 || m.hullPct > 82) allHull = false;
    // assinatura do original: alta variância de passo e viradas acentuadas
    if (m.sdStep < 0.10) highVar = false;
    if (m.meanTurn > 110) sharpTurns = false;
  }
  ok('todas as formas equivalentes à referência', allEquiv);
  ok('todas as formas com 0 cruzamentos', allNoCross);
  ok('todas as formas sem sobreposição (minPair ≥ 0.11)', allMinPair);
  ok('todas as formas com hull na janela 66–82%', allHull);
  ok('alta variância de passo (sd ≥ 0.10), como o original', highVar);
  ok('viradas acentuadas (≤110°), como o original', sharpTurns);

  // consistência: metas embutidas batem com recomputação
  let metaOk = true;
  for (const f of bank.forms) {
    const m = G.computeMetrics(f.points);
    if (Math.abs(m.pathLength - f.metrics.pathLength) > 1e-3) metaOk = false;
  }
  ok('métricas do JSON consistentes com recomputação', metaOk);
}

console.log('\n== isEquivalent ==');
{
  const ref = G.REFERENCE_TMT_B.metrics;
  ok('referência é equivalente a si mesma', G.isEquivalent(ref, ref).equivalent);
  // forma deliberadamente degenerada (linha quase reta) não é equivalente
  const line = Array.from({ length: 25 }, (_, i) => ({ x: 0.05 + i * 0.035, y: 0.5 }));
  ok('forma degenerada NÃO é equivalente', !G.isEquivalent(G.computeMetrics(line), ref).equivalent);
}

console.log('\n== Rotulagem B (alternância) ==');
{
  const seq = G.labelSequenceB();
  ok('sequência tem 25 itens', seq.length === 25);
  ok('começa em 1 e termina em 13', seq[0].v === '1' && seq[24].v === '13');
  ok('alterna número→letra→número', seq[0].t === 'number' && seq[1].t === 'letter' && seq[2].t === 'number');
  ok('par 12 → L correto', seq[22].v === '12' && seq[23].v === 'L');
}

console.log(`\n== Resultado: ${pass} passaram, ${fail} falharam ==\n`);
process.exit(fail ? 1 : 0);
