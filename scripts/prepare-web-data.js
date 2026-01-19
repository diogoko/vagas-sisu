/**
 * Prepares optimized data for web application
 * Reduces ~160MB to a much smaller size by:
 * 1. Removing unnecessary fields
 * 2. Using short field names
 * 3. Extracting lookup tables for repeated values
 * 4. Joining vagas + inscricoes
 * 5. Pre-computing normalized (accent-free) search terms
 */

import { loadVagasFromJson, loadInscricoesFromJson } from '../sisu-data.js';
import { writeFileSync, mkdirSync } from 'fs';

/**
 * Normalizes text for search matching:
 * - Removes diacritics (accents)
 * - Converts to lowercase
 * - Trims and collapses multiple spaces
 *
 * Examples:
 *   "São Paulo" → "sao paulo"
 *   "  HISTÓRIA  " → "historia"
 *   "Ciências  da   Natureza" → "ciencias da natureza"
 */
function normalize(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Remove diacritics
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');            // Collapse multiple spaces
}

console.log('Loading data...');
const vagas = loadVagasFromJson();
const inscricoes = loadInscricoesFromJson();

console.log(`Loaded ${vagas.length} vagas and ${inscricoes.length} inscricoes`);

// Create lookup map for inscricoes
const inscMap = new Map();
for (const insc of inscricoes) {
  const key = [
    insc.instituicao.codigo,
    insc.curso.codigo,
    insc.modalidade.tipoConcorrencia.trim(),
    insc.curso.turno
  ].join('|');
  inscMap.set(key, insc);
}

// Extract unique values for lookup tables
const instituicoes = new Map();
const cursos = new Set();
const municipios = new Set();

for (const v of vagas) {
  instituicoes.set(v.instituicao.sigla, v.instituicao.nome);
  cursos.add(v.curso.nome);
  municipios.add(`${v.campus.municipio}|${v.campus.uf}`);
}

// Create lookup arrays (index becomes the ID)
// Include normalized versions for accent-insensitive search
const instList = [...instituicoes.entries()].map(([sigla, nome]) => ({
  s: sigla,
  n: nome,
  _s: normalize(sigla),  // normalized sigla for search
  _n: normalize(nome)    // normalized nome for search
}));
const instIndex = new Map(instList.map((inst, i) => [inst.s, i]));

const cursoList = [...cursos].sort();
const cursoListWithNorm = cursoList.map(c => ({
  n: c,
  _n: normalize(c)  // normalized for search
}));
const cursoIndex = new Map(cursoList.map((c, i) => [c, i]));

const munListSorted = [...municipios].sort();
const munList = munListSorted.map(m => {
  const [nome, uf] = m.split('|');
  return {
    m: nome,
    u: uf,
    _m: normalize(nome)  // normalized for search
  };
});
const munIndex = new Map(munListSorted.map((m, i) => [m, i]));

console.log(`Unique institutions: ${instList.length}`);
console.log(`Unique courses: ${cursoList.length}`);
console.log(`Unique locations: ${munList.length}`);

// Build optimized vacancy records
const optimizedVagas = [];

for (const v of vagas) {
  const key = [
    v.instituicao.codigo,
    v.curso.codigo,
    v.modalidade.tipoConcorrencia.trim(),
    v.curso.turno
  ].join('|');
  const insc = inscMap.get(key);

  // Skip if no cut-off score (no applicants last year)
  const notaCorte = insc?.notaCorte || 0;

  optimizedVagas.push({
    // Institution (index to lookup)
    i: instIndex.get(v.instituicao.sigla),
    // Location (index to lookup)
    l: munIndex.get(`${v.campus.municipio}|${v.campus.uf}`),
    // Course (index to lookup)
    c: cursoIndex.get(v.curso.nome),
    // Grau: B=Bacharelado, L=Licenciatura, T=Tecnológico, A=ABI
    g: v.curso.grau[0],
    // Turno: M=Matutino, V=Vespertino, N=Noturno, I=Integral
    t: v.curso.turno[0],
    // Modalidade tipo: A, L, V, B
    m: v.modalidade.tipo,
    // Tipo concorrência (trimmed)
    tc: v.modalidade.tipoConcorrencia.trim(),
    // Weights (as array for compactness): [red, lin, mat, hum, nat]
    p: [
      v.pesosNotas.pesoRedacao,
      v.pesosNotas.pesoLinguagens,
      v.pesosNotas.pesoMatematica,
      v.pesosNotas.pesoCienciasHumanas,
      v.pesosNotas.pesoCienciasNatureza
    ],
    // Minimum scores (as array): [red, lin, mat, hum, nat]
    mn: [
      v.pesosNotas.notaMinimaRedacao,
      v.pesosNotas.notaMinimaLinguagens,
      v.pesosNotas.notaMinimaMatematica,
      v.pesosNotas.notaMinimaCienciasHumanas,
      v.pesosNotas.notaMinimaCienciasNatureza
    ],
    // Nota de corte (rounded to 2 decimals)
    nc: Math.round(notaCorte * 100) / 100,
    // Vagas ofertadas
    v: v.vagasOfertadas,
    // Inscricoes
    n: insc?.inscricoes || 0
  });
}

// Create output directory
mkdirSync('sisu-web/public/data', { recursive: true });

// Save lookup tables
const lookups = {
  instituicoes: instList,
  cursos: cursoListWithNorm,
  municipios: munList
};
writeFileSync('sisu-web/public/data/lookups.json', JSON.stringify(lookups));
console.log(`Lookups: ${(JSON.stringify(lookups).length / 1024).toFixed(1)} KB`);

// Save vacancies (compact JSON)
const vagasJson = JSON.stringify(optimizedVagas);
writeFileSync('sisu-web/public/data/vagas.json', vagasJson);
console.log(`Vagas: ${(vagasJson.length / 1024 / 1024).toFixed(2)} MB`);

// Also create chunked version (5k records each)
const CHUNK_SIZE = 5000;
const chunks = [];
for (let i = 0; i < optimizedVagas.length; i += CHUNK_SIZE) {
  const chunk = optimizedVagas.slice(i, i + CHUNK_SIZE);
  const chunkIndex = Math.floor(i / CHUNK_SIZE);
  writeFileSync(`sisu-web/public/data/vagas-${chunkIndex}.json`, JSON.stringify(chunk));
  chunks.push(chunk.length);
}
console.log(`Created ${chunks.length} chunks: ${chunks.join(', ')} records each`);

// Calculate total size
const totalSize =
  JSON.stringify(lookups).length +
  vagasJson.length;
console.log(`\nTotal size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`Reduction: ${(159 / (totalSize / 1024 / 1024)).toFixed(1)}x smaller than original`);

// Sample output to verify
console.log('\n=== Sample optimized record ===');
console.log(JSON.stringify(optimizedVagas[0], null, 2));

console.log('\n=== Lookup example ===');
const sample = optimizedVagas[0];
console.log(`Institution: ${instList[sample.i].s} - ${instList[sample.i].n}`);
console.log(`  (search: "${instList[sample.i]._s}" or "${instList[sample.i]._n}")`);
console.log(`Location: ${munList[sample.l].m}/${munList[sample.l].u}`);
console.log(`  (search: "${munList[sample.l]._m}")`);
console.log(`Course: ${cursoListWithNorm[sample.c].n}`);
console.log(`  (search: "${cursoListWithNorm[sample.c]._n}")`);

console.log('\n=== Normalization examples ===');
console.log(`"São Paulo" → "${normalize('São Paulo')}"`);
console.log(`"  História  " → "${normalize('  História  ')}"`);
console.log(`"Ciências  da   Natureza" → "${normalize('Ciências  da   Natureza')}"`);
console.log(`"MATEMÁTICA" → "${normalize('MATEMÁTICA')}"`);
console.log(`"  LETRAS - PORTUGUÊS  " → "${normalize('  LETRAS - PORTUGUÊS  ')}"`);
