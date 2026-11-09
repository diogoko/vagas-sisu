/**
 * Compare our data with external sources
 */

import { getJoinedData } from './sisu-search.js';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

// External data from VestibulandoWeb (SISU 2025)
// STALE: reference values are 2025; not valid against 2026 data, so excluded from test:all until refreshed
const externalData = {
  UFRJ: [
    { curso: 'MEDICINA', turno: 'Integral', notaCorte: 823.79, campus: 'Cidade Universitária' },
    { curso: 'ENGENHARIA DE COMPUTAÇÃO E INFORMAÇÃO', turno: 'Integral', notaCorte: 807.50 },
    { curso: 'CIÊNCIAS ECONÔMICAS', turno: 'Integral', notaCorte: 796.28 },
    { curso: 'ODONTOLOGIA', turno: 'Integral', notaCorte: 793.28 },
    { curso: 'CIÊNCIAS ECONÔMICAS', turno: 'Noturno', notaCorte: 788.23 },
    { curso: 'ENGENHARIA QUÍMICA', turno: 'Integral', notaCorte: 779.29 },
    { curso: 'DIREITO', turno: 'Integral', notaCorte: 777.29 },
    { curso: 'PSICOLOGIA', turno: 'Integral', notaCorte: 770.43 },
    { curso: 'ENGENHARIA MECÂNICA', turno: 'Integral', notaCorte: 768.03 },
    { curso: 'LETRAS - PORTUGUÊS E ÁRABE', turno: 'Integral', notaCorte: 591.51 }
  ],
  UFC: [
    { curso: 'MEDICINA', turno: 'Integral', notaCorte: 804.14, campus: 'Fortaleza' },
    { curso: 'MEDICINA', turno: 'Integral', notaCorte: 798.96, campus: 'Sobral' },
    { curso: 'DIREITO', turno: 'Integral', notaCorte: 774.00, campus: 'Fortaleza' },
    { curso: 'DIREITO', turno: 'Noturno', notaCorte: 769.06, campus: 'Fortaleza' },
    { curso: 'PSICOLOGIA', turno: 'Integral', notaCorte: 744.36, campus: 'Fortaleza' },
    { curso: 'PSICOLOGIA', turno: 'Integral', notaCorte: 722.46, campus: 'Sobral' },
    { curso: 'ENGENHARIA CIVIL', turno: 'Integral', notaCorte: 707.28, campus: 'Fortaleza' },
    { curso: 'CIÊNCIA DA COMPUTAÇÃO', turno: 'Integral', notaCorte: 765.82, campus: 'Fortaleza' }
  ]
};

console.log(`${BOLD}╔════════════════════════════════════════════════════╗${RESET}`);
console.log(`${BOLD}║  EXTERNAL DATA VALIDATION COMPARISON               ║${RESET}`);
console.log(`${BOLD}╚════════════════════════════════════════════════════╝${RESET}`);

const joined = getJoinedData();

let matches = 0;
let mismatches = 0;
let notFound = 0;

for (const [instituicao, cursos] of Object.entries(externalData)) {
  console.log(`\n${BOLD}═══ ${instituicao} ═══${RESET}\n`);

  for (const ext of cursos) {
    // Find matching record in our data
    const ourRecords = joined.filter(v =>
      v.instituicao.sigla === instituicao &&
      v.curso.nome.toUpperCase().includes(ext.curso.toUpperCase().split(' - ')[0].split(' ')[0]) &&
      v.curso.turno === ext.turno &&
      v.modalidade.tipo === 'A' // Ampla concorrência
    );

    if (ourRecords.length === 0) {
      console.log(`${YELLOW}?${RESET} ${ext.curso} (${ext.turno})`);
      console.log(`  External: ${ext.notaCorte}`);
      console.log(`  Our data: NOT FOUND`);
      notFound++;
      continue;
    }

    // Find best match (by campus if specified, or closest score)
    let bestMatch = ourRecords[0];
    if (ext.campus) {
      const campusMatch = ourRecords.find(r =>
        r.campus.municipio.toUpperCase().includes(ext.campus.toUpperCase()) ||
        r.campus.nome.toUpperCase().includes(ext.campus.toUpperCase())
      );
      if (campusMatch) bestMatch = campusMatch;
    }

    // Check if exact match by score
    const exactMatch = ourRecords.find(r =>
      Math.abs(r.notaCorte - ext.notaCorte) < 0.01
    );

    if (exactMatch) {
      console.log(`${GREEN}✓${RESET} ${ext.curso} (${ext.turno})${ext.campus ? ' - ' + ext.campus : ''}`);
      console.log(`  External: ${ext.notaCorte.toFixed(2)} = Our data: ${exactMatch.notaCorte.toFixed(2)}`);
      console.log(`  Campus: ${exactMatch.campus.municipio}`);
      matches++;
    } else {
      const diff = bestMatch.notaCorte - ext.notaCorte;
      const diffPercent = (diff / ext.notaCorte * 100).toFixed(2);

      if (Math.abs(diff) < 5) {
        console.log(`${YELLOW}≈${RESET} ${ext.curso} (${ext.turno})${ext.campus ? ' - ' + ext.campus : ''}`);
        console.log(`  External: ${ext.notaCorte.toFixed(2)} ≈ Our data: ${bestMatch.notaCorte.toFixed(2)} (diff: ${diff > 0 ? '+' : ''}${diff.toFixed(2)})`);
        console.log(`  Campus: ${bestMatch.campus.municipio}`);
        matches++; // Close enough
      } else {
        console.log(`${RED}✗${RESET} ${ext.curso} (${ext.turno})${ext.campus ? ' - ' + ext.campus : ''}`);
        console.log(`  External: ${ext.notaCorte.toFixed(2)} ≠ Our data: ${bestMatch.notaCorte.toFixed(2)} (diff: ${diff > 0 ? '+' : ''}${diff.toFixed(2)} = ${diffPercent}%)`);
        console.log(`  Campus: ${bestMatch.campus.municipio}`);

        // Show all matches
        if (ourRecords.length > 1) {
          console.log(`  ${YELLOW}Other matches:${RESET}`);
          for (const r of ourRecords.slice(0, 3)) {
            console.log(`    - ${r.notaCorte.toFixed(2)} (${r.campus.municipio})`);
          }
        }
        mismatches++;
      }
    }
  }
}

console.log(`\n${BOLD}═══ SUMMARY ═══${RESET}\n`);
console.log(`${GREEN}Matches: ${matches}${RESET}`);
console.log(`${RED}Mismatches: ${mismatches}${RESET}`);
console.log(`${YELLOW}Not found: ${notFound}${RESET}`);

const total = matches + mismatches + notFound;
const accuracy = ((matches / total) * 100).toFixed(1);
console.log(`\n${BOLD}Accuracy: ${accuracy}%${RESET}`);

if (accuracy >= 80) {
  console.log(`\n${GREEN}${BOLD}✓ Data validation passed!${RESET}`);
  console.log(`The cut-off scores in our database match external sources.`);
} else if (accuracy >= 60) {
  console.log(`\n${YELLOW}${BOLD}⚠ Data validation partially passed${RESET}`);
  console.log(`Some discrepancies found - review the mismatches above.`);
} else {
  console.log(`\n${RED}${BOLD}✗ Data validation failed${RESET}`);
  console.log(`Significant discrepancies found - investigate data sources.`);
}
