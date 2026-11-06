/**
 * External Data Validation
 *
 * This script extracts data that can be validated against external sources:
 * - UFC historical cut-off scores
 * - Termo de Adesão weights
 */

import { loadVagas, loadInscricoes } from './sisu-data.js';
import { getJoinedData } from './sisu-search.js';

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

function section(title) {
  console.log(`\n${BOLD}═══ ${title} ═══${RESET}\n`);
}

// ============================================
// EXTRACT UFC DATA FOR MANUAL VALIDATION
// ============================================

function extractUFCData() {
  section('UFC (Universidade Federal do Ceará) - Data for Manual Validation');

  const joined = getJoinedData();

  // Filter UFC vacancies
  const ufcVacancies = joined.filter(v =>
    v.instituicao.sigla === 'UFC' ||
    v.instituicao.nome.toLowerCase().includes('ceará')
  );

  console.log(`Found ${ufcVacancies.length} UFC vacancies\n`);

  // Group by course
  const byCourse = new Map();
  for (const v of ufcVacancies) {
    const key = `${v.curso.nome} - ${v.curso.turno}`;
    if (!byCourse.has(key)) {
      byCourse.set(key, []);
    }
    byCourse.get(key).push(v);
  }

  // Show sample courses with their cut-off scores
  console.log(`${CYAN}Sample UFC courses for validation against historical PDFs:${RESET}\n`);

  const coursesToShow = [
    'MEDICINA',
    'DIREITO',
    'ENGENHARIA',
    'PSICOLOGIA',
    'CIÊNCIA DA COMPUTAÇÃO'
  ];

  for (const search of coursesToShow) {
    const matches = [...byCourse.entries()]
      .filter(([name]) => name.toUpperCase().includes(search))
      .slice(0, 2);

    for (const [courseName, vacancies] of matches) {
      const amplaConc = vacancies.find(v => v.modalidade.tipo === 'A');
      if (amplaConc) {
        console.log(`${BOLD}${courseName}${RESET}`);
        console.log(`  Nota de Corte 2025 (Ampla): ${amplaConc.notaCorte > 0 ? amplaConc.notaCorte.toFixed(2) : 'N/A'}`);
        console.log(`  Pesos: R=${amplaConc.pesosNotas.pesoRedacao} L=${amplaConc.pesosNotas.pesoLinguagens} M=${amplaConc.pesosNotas.pesoMatematica} H=${amplaConc.pesosNotas.pesoCienciasHumanas} N=${amplaConc.pesosNotas.pesoCienciasNatureza}`);
        console.log(`  Vagas: ${amplaConc.vagasOfertadas}`);
        console.log('');
      }
    }
  }

  // Instructions for manual validation
  console.log(`${YELLOW}To validate, compare these with:${RESET}`);
  console.log(`  1. UFC historical PDFs: https://sisu.ufc.br/pt/notas-de-corte/`);
  console.log(`  2. Look for 2024 (or 2023) edition and compare trends`);
  console.log(`  3. Cut-off scores should be in similar range year-over-year\n`);
}

// ============================================
// EXTRACT UFSC DATA (Termo de Adesão available)
// ============================================

function extractUFSCData() {
  section('UFSC (Universidade Federal de Santa Catarina) - Termo de Adesão Validation');

  const joined = getJoinedData();

  // Filter UFSC vacancies
  const ufscVacancies = joined.filter(v =>
    v.instituicao.sigla === 'UFSC'
  );

  console.log(`Found ${ufscVacancies.length} UFSC vacancies\n`);

  // Show sample courses with their weights
  console.log(`${CYAN}Sample UFSC courses - compare weights with Termo de Adesão:${RESET}`);
  console.log(`(Termo available at: https://sisu2025.ufsc.br/files/2025/01/termo_adesao_sisu_2025.pdf)\n`);

  const coursesToShow = [
    'MEDICINA',
    'DIREITO',
    'ENGENHARIA',
    'LETRAS'
  ];

  for (const search of coursesToShow) {
    const match = ufscVacancies.find(v =>
      v.curso.nome.toUpperCase().includes(search) &&
      v.modalidade.tipo === 'A'
    );

    if (match) {
      const p = match.pesosNotas;
      console.log(`${BOLD}${match.curso.nome} - ${match.curso.turno}${RESET}`);
      console.log(`  Pesos: Redação=${p.pesoRedacao} Ling=${p.pesoLinguagens} Mat=${p.pesoMatematica} Hum=${p.pesoCienciasHumanas} Nat=${p.pesoCienciasNatureza}`);
      console.log(`  Mínimos: R=${p.notaMinimaRedacao} L=${p.notaMinimaLinguagens} M=${p.notaMinimaMatematica} H=${p.notaMinimaCienciasHumanas} N=${p.notaMinimaCienciasNatureza}`);
      console.log(`  Nota de Corte: ${match.notaCorte > 0 ? match.notaCorte.toFixed(2) : 'N/A'}`);
      console.log('');
    }
  }
}

// ============================================
// EXTRACT UFRJ DATA
// ============================================

function extractUFRJData() {
  section('UFRJ (Universidade Federal do Rio de Janeiro) - Data Validation');

  const joined = getJoinedData();

  // Filter UFRJ vacancies
  const ufrjVacancies = joined.filter(v =>
    v.instituicao.sigla === 'UFRJ'
  );

  console.log(`Found ${ufrjVacancies.length} UFRJ vacancies\n`);

  // Show top courses by cut-off
  const withCutoff = ufrjVacancies
    .filter(v => v.notaCorte > 0 && v.modalidade.tipo === 'A')
    .sort((a, b) => b.notaCorte - a.notaCorte);

  console.log(`${CYAN}Top 10 UFRJ courses by cut-off (Ampla Concorrência):${RESET}\n`);

  for (let i = 0; i < Math.min(10, withCutoff.length); i++) {
    const v = withCutoff[i];
    const p = v.pesosNotas;
    console.log(`${i+1}. ${v.curso.nome} - ${v.curso.turno}`);
    console.log(`   Nota de Corte: ${v.notaCorte.toFixed(2)}`);
    console.log(`   Pesos: R=${p.pesoRedacao} L=${p.pesoLinguagens} M=${p.pesoMatematica} H=${p.pesoCienciasHumanas} N=${p.pesoCienciasNatureza}`);
    console.log('');
  }
}

// ============================================
// DATA QUALITY SUMMARY
// ============================================

function dataQualitySummary() {
  section('DATA QUALITY SUMMARY');

  const vagas = loadVagas();
  const inscricoes = loadInscricoes();
  const joined = getJoinedData();

  // Check for anomalies
  console.log(`${BOLD}Record Counts:${RESET}`);
  console.log(`  Vagas ofertadas: ${vagas.length}`);
  console.log(`  Inscrições/Notas de corte: ${inscricoes.length}`);
  console.log(`  Joined records: ${joined.length}`);

  // Check weight anomalies
  const zeroWeights = vagas.filter(v => {
    const total = v.pesosNotas.pesoRedacao + v.pesosNotas.pesoLinguagens +
                  v.pesosNotas.pesoMatematica + v.pesosNotas.pesoCienciasHumanas +
                  v.pesosNotas.pesoCienciasNatureza;
    return total === 0;
  });

  console.log(`\n${BOLD}Weight Anomalies:${RESET}`);
  console.log(`  Records with zero total weights: ${zeroWeights.length}`);

  // Check cut-off anomalies
  const withCutoff = joined.filter(j => j.notaCorte > 0);
  const highCutoff = withCutoff.filter(j => j.notaCorte > 850);
  const lowCutoff = withCutoff.filter(j => j.notaCorte < 300);

  console.log(`\n${BOLD}Cut-off Score Anomalies:${RESET}`);
  console.log(`  Records with cut-off > 850: ${highCutoff.length}`);
  console.log(`  Records with cut-off < 300: ${lowCutoff.length}`);

  if (highCutoff.length > 0) {
    console.log(`\n  ${YELLOW}High cut-off examples (may include bonus):${RESET}`);
    for (const h of highCutoff.slice(0, 3)) {
      console.log(`    ${h.notaCorte.toFixed(2)} - ${h.curso.nome} (${h.instituicao.sigla}) - Mod: ${h.modalidade.tipo}`);
    }
  }

  if (lowCutoff.length > 0) {
    console.log(`\n  ${YELLOW}Low cut-off examples (may be new courses):${RESET}`);
    for (const l of lowCutoff.slice(0, 3)) {
      console.log(`    ${l.notaCorte.toFixed(2)} - ${l.curso.nome} (${l.instituicao.sigla})`);
    }
  }

  // Check minimum score patterns
  const withMinimum = vagas.filter(v =>
    v.pesosNotas.notaMinimaRedacao > 0 ||
    v.pesosNotas.mediaMinimaEnem > 0
  );

  console.log(`\n${BOLD}Minimum Score Requirements:${RESET}`);
  console.log(`  Records with minimum score requirements: ${withMinimum.length} (${(withMinimum.length/vagas.length*100).toFixed(1)}%)`);

  // Sample minimum values
  const minValues = vagas.map(v => v.pesosNotas.notaMinimaRedacao).filter(m => m > 0);
  if (minValues.length > 0) {
    const uniqueMins = [...new Set(minValues)].sort((a, b) => a - b);
    console.log(`  Unique minimum values for Redação: ${uniqueMins.slice(0, 10).join(', ')}...`);
  }

  // Institutions summary
  const institutions = [...new Set(vagas.map(v => v.instituicao.sigla))];
  console.log(`\n${BOLD}Institutions:${RESET}`);
  console.log(`  Total unique institutions: ${institutions.length}`);
  console.log(`  Sample: ${institutions.slice(0, 20).join(', ')}...`);
}

// ============================================
// CROSS-REFERENCE WITH KNOWN DATA
// ============================================

function crossReferenceKnownData() {
  section('CROSS-REFERENCE WITH KNOWN PUBLIC DATA');

  const joined = getJoinedData();

  // Based on public news and data, Medicina at top universities should have cut-offs around 800+
  console.log(`${CYAN}Medicina courses (should have highest cut-offs ~800+):${RESET}\n`);

  const medicinaCourses = joined
    .filter(v =>
      v.curso.nome.toLowerCase() === 'medicina' &&
      v.modalidade.tipo === 'A'
    )
    .sort((a, b) => b.notaCorte - a.notaCorte)
    .slice(0, 10);

  for (const m of medicinaCourses) {
    const status = m.notaCorte >= 780 ? GREEN + '✓' + RESET : YELLOW + '?' + RESET;
    console.log(`  ${status} ${m.notaCorte.toFixed(2)} - ${m.instituicao.sigla} (${m.campus.uf})`);
  }

  // Check if UFRJ Medicina is in the top (it's consistently one of the highest)
  const ufrjMedicina = medicinaCourses.find(m => m.instituicao.sigla === 'UFRJ');
  if (ufrjMedicina && ufrjMedicina.notaCorte > 800) {
    console.log(`\n${GREEN}✓ UFRJ Medicina has high cut-off (${ufrjMedicina.notaCorte.toFixed(2)}) as expected${RESET}`);
  }

  // Direito courses (typically 650-750 at top schools)
  console.log(`\n${CYAN}Direito at top institutions:${RESET}\n`);

  const topInstitutions = ['USP', 'UFRJ', 'UFMG', 'UnB', 'UFPR', 'UFRGS'];
  const direitoCourses = joined
    .filter(v =>
      v.curso.nome.toLowerCase().includes('direito') &&
      v.modalidade.tipo === 'A' &&
      topInstitutions.includes(v.instituicao.sigla)
    )
    .sort((a, b) => b.notaCorte - a.notaCorte);

  for (const d of direitoCourses.slice(0, 5)) {
    const status = d.notaCorte >= 700 ? GREEN + '✓' + RESET : YELLOW + '?' + RESET;
    console.log(`  ${status} ${d.notaCorte.toFixed(2)} - ${d.instituicao.sigla}`);
  }
}

// ============================================
// RUN ALL
// ============================================

console.log(`${BOLD}╔════════════════════════════════════════════════════╗${RESET}`);
console.log(`${BOLD}║     EXTERNAL DATA VALIDATION REPORT                ║${RESET}`);
console.log(`${BOLD}╚════════════════════════════════════════════════════╝${RESET}`);

extractUFCData();
extractUFSCData();
extractUFRJData();
dataQualitySummary();
crossReferenceKnownData();

section('VALIDATION INSTRUCTIONS');
console.log(`To complete external validation:`);
console.log(`1. ${BOLD}UFC Historical Data:${RESET}`);
console.log(`   - Visit: https://sisu.ufc.br/pt/notas-de-corte/`);
console.log(`   - Download 2024 PDF and compare with values above`);
console.log(`   - Cut-offs should be similar year-over-year (±5%)`);
console.log(`\n2. ${BOLD}UFSC Termo de Adesão:${RESET}`);
console.log(`   - Visit: https://sisu2025.ufsc.br/`);
console.log(`   - Download Termo de Adesão PDF`);
console.log(`   - Verify weights match the values shown above`);
console.log(`\n3. ${BOLD}UFRJ Data:${RESET}`);
console.log(`   - Visit: https://acessograduacao.ufrj.br/`);
console.log(`   - Compare cut-off scores and weights`);
console.log(`\n4. ${BOLD}Base dos Dados:${RESET}`);
console.log(`   - Visit: https://basedosdados.org/`);
console.log(`   - Query SISU microdata 2017-2022`);
console.log(`   - Compare historical trends`);
