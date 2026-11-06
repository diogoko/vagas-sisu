/**
 * SISU Calculation Validation Tests
 *
 * This script validates that our calculations match the official SISU formula:
 * Média Ponderada = (Σ nota × peso) / (Σ pesos)
 */

import {
  calcularNotaPonderada,
  verificarNotasMinimas,
  getJoinedData
} from './sisu-search.js';
import { loadVagas, loadInscricoes } from './sisu-data.js';

// Test colors for terminal output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

let passCount = 0;
let failCount = 0;

function pass(message) {
  passCount++;
  console.log(`${GREEN}✓${RESET} ${message}`);
}

function fail(message, details = '') {
  failCount++;
  console.log(`${RED}✗${RESET} ${message}`);
  if (details) console.log(`  ${RED}${details}${RESET}`);
}

function section(title) {
  console.log(`\n${BOLD}═══ ${title} ═══${RESET}\n`);
}

// ============================================
// TEST 1: Manual Calculation Verification
// ============================================

function testManualCalculations() {
  section('TEST 1: Manual Weighted Average Calculations');

  // Test case 1: Equal weights (should be simple average)
  const scores1 = {
    redacao: 600,
    linguagens: 500,
    matematica: 700,
    cienciasHumanas: 550,
    cienciasNatureza: 650
  };
  const pesos1 = {
    pesoRedacao: 1,
    pesoLinguagens: 1,
    pesoMatematica: 1,
    pesoCienciasHumanas: 1,
    pesoCienciasNatureza: 1
  };

  // Expected: (600+500+700+550+650) / 5 = 3000/5 = 600
  const result1 = calcularNotaPonderada(scores1, pesos1);
  const expected1 = 600;

  if (Math.abs(result1 - expected1) < 0.01) {
    pass(`Equal weights: Expected ${expected1}, got ${result1}`);
  } else {
    fail(`Equal weights: Expected ${expected1}, got ${result1}`);
  }

  // Test case 2: Different weights (typical engineering course)
  const pesos2 = {
    pesoRedacao: 1,
    pesoLinguagens: 1,
    pesoMatematica: 3,  // Higher weight
    pesoCienciasHumanas: 1,
    pesoCienciasNatureza: 2  // Higher weight
  };

  // Expected: (600*1 + 500*1 + 700*3 + 550*1 + 650*2) / (1+1+3+1+2)
  // = (600 + 500 + 2100 + 550 + 1300) / 8
  // = 5050 / 8 = 631.25
  const result2 = calcularNotaPonderada(scores1, pesos2);
  const expected2 = 631.25;

  if (Math.abs(result2 - expected2) < 0.01) {
    pass(`Different weights (engineering): Expected ${expected2}, got ${result2}`);
  } else {
    fail(`Different weights (engineering): Expected ${expected2}, got ${result2}`);
  }

  // Test case 3: Humanities course (different weights)
  const pesos3 = {
    pesoRedacao: 3,  // Higher weight
    pesoLinguagens: 2,
    pesoMatematica: 1,
    pesoCienciasHumanas: 2,
    pesoCienciasNatureza: 1
  };

  // Expected: (600*3 + 500*2 + 700*1 + 550*2 + 650*1) / (3+2+1+2+1)
  // = (1800 + 1000 + 700 + 1100 + 650) / 9
  // = 5250 / 9 = 583.33...
  const result3 = calcularNotaPonderada(scores1, pesos3);
  const expected3 = 5250 / 9;

  if (Math.abs(result3 - expected3) < 0.01) {
    pass(`Different weights (humanities): Expected ${expected3.toFixed(2)}, got ${result3.toFixed(2)}`);
  } else {
    fail(`Different weights (humanities): Expected ${expected3.toFixed(2)}, got ${result3.toFixed(2)}`);
  }

  // Test case 4: Edge case - very high weights
  const pesos4 = {
    pesoRedacao: 10,
    pesoLinguagens: 1,
    pesoMatematica: 1,
    pesoCienciasHumanas: 1,
    pesoCienciasNatureza: 1
  };

  // Expected: (600*10 + 500*1 + 700*1 + 550*1 + 650*1) / (10+1+1+1+1)
  // = (6000 + 500 + 700 + 550 + 650) / 14
  // = 8400 / 14 = 600
  const result4 = calcularNotaPonderada(scores1, pesos4);
  const expected4 = 8400 / 14;

  if (Math.abs(result4 - expected4) < 0.01) {
    pass(`High weight on redacao: Expected ${expected4.toFixed(2)}, got ${result4.toFixed(2)}`);
  } else {
    fail(`High weight on redacao: Expected ${expected4.toFixed(2)}, got ${result4.toFixed(2)}`);
  }

  // Test case 5: Zero weights edge case
  const pesos5 = {
    pesoRedacao: 0,
    pesoLinguagens: 0,
    pesoMatematica: 0,
    pesoCienciasHumanas: 0,
    pesoCienciasNatureza: 0
  };

  const result5 = calcularNotaPonderada(scores1, pesos5);
  if (result5 === 0) {
    pass(`Zero weights edge case: Returns 0 as expected`);
  } else {
    fail(`Zero weights edge case: Expected 0, got ${result5}`);
  }
}

// ============================================
// TEST 2: Real Data Verification
// ============================================

function testRealDataCalculations() {
  section('TEST 2: Real Vacancy Data Verification');

  const vagas = loadVagas();
  console.log(`Loaded ${vagas.length} vacancies\n`);

  // Sample diverse vacancies for testing
  const testScores = {
    redacao: 720,
    linguagens: 650,
    matematica: 580,
    cienciasHumanas: 690,
    cienciasNatureza: 610
  };

  // Find different types of courses to test
  const testCases = [];

  // 1. Find a Medicina course (high weights on Ciências)
  const medicina = vagas.find(v =>
    v.curso.nome.toLowerCase().includes('medicina') &&
    v.modalidade.tipo === 'A'
  );
  if (medicina) testCases.push({ name: 'Medicina', vaga: medicina });

  // 2. Find a Direito course (humanities weights)
  const direito = vagas.find(v =>
    v.curso.nome.toLowerCase().includes('direito') &&
    v.modalidade.tipo === 'A'
  );
  if (direito) testCases.push({ name: 'Direito', vaga: direito });

  // 3. Find an Engenharia course (math weights)
  const engenharia = vagas.find(v =>
    v.curso.nome.toLowerCase().includes('engenharia') &&
    v.modalidade.tipo === 'A'
  );
  if (engenharia) testCases.push({ name: 'Engenharia', vaga: engenharia });

  // 4. Find a Letras course
  const letras = vagas.find(v =>
    v.curso.nome.toLowerCase().includes('letras') &&
    v.modalidade.tipo === 'A'
  );
  if (letras) testCases.push({ name: 'Letras', vaga: letras });

  // 5. Find a course with equal weights
  const equalWeights = vagas.find(v => {
    const p = v.pesosNotas;
    return p.pesoRedacao === p.pesoLinguagens &&
           p.pesoLinguagens === p.pesoMatematica &&
           p.pesoMatematica === p.pesoCienciasHumanas &&
           p.pesoCienciasHumanas === p.pesoCienciasNatureza &&
           p.pesoRedacao > 0;
  });
  if (equalWeights) testCases.push({ name: 'Equal Weights', vaga: equalWeights });

  for (const tc of testCases) {
    const pesos = tc.vaga.pesosNotas;

    // Manual calculation
    const numerator =
      testScores.redacao * pesos.pesoRedacao +
      testScores.linguagens * pesos.pesoLinguagens +
      testScores.matematica * pesos.pesoMatematica +
      testScores.cienciasHumanas * pesos.pesoCienciasHumanas +
      testScores.cienciasNatureza * pesos.pesoCienciasNatureza;

    const denominator =
      pesos.pesoRedacao +
      pesos.pesoLinguagens +
      pesos.pesoMatematica +
      pesos.pesoCienciasHumanas +
      pesos.pesoCienciasNatureza;

    const manualResult = denominator > 0 ? numerator / denominator : 0;
    const functionResult = calcularNotaPonderada(testScores, pesos);

    console.log(`${tc.name}: ${tc.vaga.curso.nome} - ${tc.vaga.instituicao.sigla}`);
    console.log(`  Pesos: R=${pesos.pesoRedacao} L=${pesos.pesoLinguagens} M=${pesos.pesoMatematica} H=${pesos.pesoCienciasHumanas} N=${pesos.pesoCienciasNatureza}`);

    if (Math.abs(manualResult - functionResult) < 0.01) {
      pass(`  Manual: ${manualResult.toFixed(2)} = Function: ${functionResult.toFixed(2)}`);
    } else {
      fail(`  Manual: ${manualResult.toFixed(2)} ≠ Function: ${functionResult.toFixed(2)}`);
    }
    console.log('');
  }
}

// ============================================
// TEST 3: Minimum Score Verification
// ============================================

function testMinimumScores() {
  section('TEST 3: Minimum Score Requirements');

  const vagas = loadVagas();

  // Find vacancies with minimum score requirements
  const vagasWithMinimum = vagas.filter(v =>
    v.pesosNotas.notaMinimaRedacao > 0 ||
    v.pesosNotas.notaMinimaLinguagens > 0 ||
    v.pesosNotas.notaMinimaMatematica > 0 ||
    v.pesosNotas.notaMinimaCienciasHumanas > 0 ||
    v.pesosNotas.notaMinimaCienciasNatureza > 0 ||
    v.pesosNotas.mediaMinimaEnem > 0
  );

  console.log(`Found ${vagasWithMinimum.length} vacancies with minimum score requirements\n`);

  if (vagasWithMinimum.length > 0) {
    const sample = vagasWithMinimum[0];
    const pesos = sample.pesosNotas;

    console.log(`Sample: ${sample.curso.nome} - ${sample.instituicao.sigla}`);
    console.log(`  Min Redacao: ${pesos.notaMinimaRedacao}`);
    console.log(`  Min Linguagens: ${pesos.notaMinimaLinguagens}`);
    console.log(`  Min Matematica: ${pesos.notaMinimaMatematica}`);
    console.log(`  Min C.Humanas: ${pesos.notaMinimaCienciasHumanas}`);
    console.log(`  Min C.Natureza: ${pesos.notaMinimaCienciasNatureza}`);
    console.log(`  Media Minima: ${pesos.mediaMinimaEnem}`);

    // Test passing minimum scores
    const passingScores = {
      redacao: Math.max(pesos.notaMinimaRedacao + 50, 500),
      linguagens: Math.max(pesos.notaMinimaLinguagens + 50, 500),
      matematica: Math.max(pesos.notaMinimaMatematica + 50, 500),
      cienciasHumanas: Math.max(pesos.notaMinimaCienciasHumanas + 50, 500),
      cienciasNatureza: Math.max(pesos.notaMinimaCienciasNatureza + 50, 500)
    };

    const resultPassing = verificarNotasMinimas(passingScores, pesos);
    if (resultPassing.aprovado) {
      pass(`Scores above minimum are approved`);
    } else {
      fail(`Scores above minimum should be approved`, JSON.stringify(resultPassing.detalhes));
    }

    // Test failing minimum scores
    const failingScores = {
      redacao: pesos.notaMinimaRedacao > 0 ? pesos.notaMinimaRedacao - 10 : 100,
      linguagens: 200,
      matematica: 200,
      cienciasHumanas: 200,
      cienciasNatureza: 200
    };

    const resultFailing = verificarNotasMinimas(failingScores, pesos);
    if (!resultFailing.aprovado) {
      pass(`Scores below minimum are rejected`);
    } else {
      fail(`Scores below minimum should be rejected`);
    }
  }
}

// ============================================
// TEST 4: Data Join Integrity
// ============================================

function testDataJoinIntegrity() {
  section('TEST 4: Data Join Integrity');

  const vagas = loadVagas();
  const inscricoes = loadInscricoes();
  const joined = getJoinedData();

  console.log(`Vagas (ofertas): ${vagas.length}`);
  console.log(`Inscricoes (notas corte): ${inscricoes.length}`);
  console.log(`Joined records: ${joined.length}`);

  // Check how many joined records have cut-off scores
  const withCutoff = joined.filter(j => j.notaCorte > 0);
  const withoutCutoff = joined.filter(j => j.notaCorte === 0);

  console.log(`\nWith cut-off score: ${withCutoff.length} (${(withCutoff.length/joined.length*100).toFixed(1)}%)`);
  console.log(`Without cut-off score: ${withoutCutoff.length} (${(withoutCutoff.length/joined.length*100).toFixed(1)}%)`);

  // Check if all vagas have pesosNotas
  const withWeights = joined.filter(j =>
    j.pesosNotas &&
    (j.pesosNotas.pesoRedacao + j.pesosNotas.pesoLinguagens +
     j.pesosNotas.pesoMatematica + j.pesosNotas.pesoCienciasHumanas +
     j.pesosNotas.pesoCienciasNatureza) > 0
  );

  if (withWeights.length === joined.length) {
    pass(`All ${joined.length} records have valid weights`);
  } else {
    fail(`Only ${withWeights.length}/${joined.length} records have valid weights`);
  }

  // Verify join completeness
  if (joined.length >= vagas.length) {
    pass(`Join preserves all vagas (${vagas.length})`);
  } else {
    fail(`Join lost ${vagas.length - joined.length} vagas`);
  }
}

// ============================================
// TEST 5: Weight Distribution Analysis
// ============================================

function testWeightDistribution() {
  section('TEST 5: Weight Distribution Analysis');

  const vagas = loadVagas();

  // Analyze weight patterns
  const weightPatterns = new Map();

  for (const vaga of vagas) {
    const p = vaga.pesosNotas;
    const pattern = `R:${p.pesoRedacao} L:${p.pesoLinguagens} M:${p.pesoMatematica} H:${p.pesoCienciasHumanas} N:${p.pesoCienciasNatureza}`;

    if (!weightPatterns.has(pattern)) {
      weightPatterns.set(pattern, { count: 0, examples: [] });
    }
    const entry = weightPatterns.get(pattern);
    entry.count++;
    if (entry.examples.length < 2) {
      entry.examples.push(`${vaga.curso.nome} - ${vaga.instituicao.sigla}`);
    }
  }

  // Sort by frequency
  const sorted = [...weightPatterns.entries()].sort((a, b) => b[1].count - a[1].count);

  console.log(`Found ${weightPatterns.size} unique weight patterns\n`);
  console.log('Top 10 most common patterns:');

  for (let i = 0; i < Math.min(10, sorted.length); i++) {
    const [pattern, data] = sorted[i];
    console.log(`  ${pattern} - ${data.count} vacancies`);
    console.log(`    Ex: ${data.examples[0]}`);
  }

  // Check for equal weights pattern
  const equalWeightsPattern = sorted.find(([p]) => {
    const weights = p.match(/\d+/g).map(Number);
    return weights.every(w => w === weights[0] && w > 0);
  });

  if (equalWeightsPattern) {
    pass(`Found equal weights pattern: ${equalWeightsPattern[0]} (${equalWeightsPattern[1].count} vacancies)`);
  }
}

// ============================================
// TEST 6: Cut-off Score Plausibility
// ============================================

function testCutoffScorePlausibility() {
  section('TEST 6: Cut-off Score Plausibility');

  const joined = getJoinedData();
  const withCutoff = joined.filter(j => j.notaCorte > 0);

  // Check score ranges
  const scores = withCutoff.map(j => j.notaCorte);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

  console.log(`Cut-off score statistics:`);
  console.log(`  Min: ${min.toFixed(2)}`);
  console.log(`  Max: ${max.toFixed(2)}`);
  console.log(`  Average: ${avg.toFixed(2)}`);

  // ENEM scores should be between 0 and ~900 (practical max)
  // Cut-off scores can be higher due to bonus, but typically 400-850
  if (min >= 0 && min <= 1000) {
    pass(`Minimum score (${min.toFixed(2)}) is within expected range`);
  } else {
    fail(`Minimum score (${min.toFixed(2)}) outside expected range [0, 1000]`);
  }

  if (max >= 500 && max <= 900) {
    pass(`Maximum score (${max.toFixed(2)}) is within expected range for competitive courses`);
  } else if (max > 900) {
    console.log(`${YELLOW}⚠${RESET} Maximum score (${max.toFixed(2)}) is very high - may include bonus`);
  }

  // Find highest cut-off courses
  const topCourses = withCutoff
    .sort((a, b) => b.notaCorte - a.notaCorte)
    .slice(0, 5);

  console.log(`\nTop 5 highest cut-off scores:`);
  for (const c of topCourses) {
    console.log(`  ${c.notaCorte.toFixed(2)} - ${c.curso.nome} (${c.instituicao.sigla}) - ${c.modalidade.tipo}`);
  }

  // Medicina should be in top scores
  const medicinaCourses = topCourses.filter(c =>
    c.curso.nome.toLowerCase().includes('medicina')
  );
  if (medicinaCourses.length > 0) {
    pass(`Medicina courses appear in top cut-off scores (as expected)`);
  }
}

// ============================================
// RUN ALL TESTS
// ============================================

console.log(`${BOLD}╔════════════════════════════════════════════════════╗${RESET}`);
console.log(`${BOLD}║     SISU CALCULATION VALIDATION TEST SUITE         ║${RESET}`);
console.log(`${BOLD}╚════════════════════════════════════════════════════╝${RESET}`);
console.log(`\nDate: ${new Date().toISOString()}`);

try {
  testManualCalculations();
  testRealDataCalculations();
  testMinimumScores();
  testDataJoinIntegrity();
  testWeightDistribution();
  testCutoffScorePlausibility();

  section('SUMMARY');
  console.log(`${GREEN}Passed: ${passCount}${RESET}`);
  console.log(`${RED}Failed: ${failCount}${RESET}`);

  if (failCount === 0) {
    console.log(`\n${GREEN}${BOLD}All tests passed!${RESET} ✓`);
  } else {
    console.log(`\n${RED}${BOLD}Some tests failed.${RESET} Review the output above.`);
    process.exit(1);
  }
} catch (error) {
  console.error(`\n${RED}Error running tests:${RESET}`, error);
  process.exit(1);
}
