import { getSheetContent, getSheetInfo } from './xlsx-reader.js';
import { writeFileSync, readFileSync, existsSync } from 'fs';

// ============ INPUT VALIDATION ============

/**
 * Custom error class for data-related errors
 */
export class DataError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'DataError';
    this.details = details;
  }
}

/**
 * Validates that a JSON file path is a non-empty string with a .json extension
 * @param {string} jsonPath - Path to JSON file
 * @returns {string} Validated path
 * @throws {DataError} If validation fails
 */
function validateJsonPath(jsonPath) {
  if (typeof jsonPath !== 'string' || jsonPath.trim() === '') {
    throw new DataError('JSON file path must be a non-empty string');
  }
  if (!jsonPath.toLowerCase().endsWith('.json')) {
    throw new DataError(`File must be a JSON file: ${jsonPath}`);
  }
  return jsonPath;
}

// File paths
// SISU edition year: change this (and drop the new xlsx files in the repo root) to update the data
export const SISU_YEAR = 2026;
const INSCRICOES_FILE = `portal-sisu-${SISU_YEAR}-inscricoes-e-nota-de-corte.xlsx`;
const VAGAS_FILE = `portal-sisu-${SISU_YEAR}-vagas-ofertadas.xlsx`;

// Default JSON output paths
const INSCRICOES_JSON = 'sisu-inscricoes-nota-corte.json';
const VAGAS_JSON = 'sisu-vagas-ofertadas.json';
const COMBINED_JSON = 'sisu-data-combined.json';

/**
 * @typedef {Object} Instituicao
 * @property {string} codigo - Institution code (CO_IES)
 * @property {string} nome - Institution name (NO_IES)
 * @property {string} sigla - Institution abbreviation (SG_IES)
 * @property {string} organizacaoAcademica - Academic organization type
 * @property {string} categoriaAdministrativa - Administrative category (public/private)
 */

/**
 * @typedef {Object} Campus
 * @property {string} nome - Campus name
 * @property {string} municipio - City name
 * @property {string} uf - State abbreviation
 * @property {string} regiao - Region name
 */

/**
 * @typedef {Object} Curso
 * @property {string} codigo - Course code (CO_IES_CURSO)
 * @property {string} nome - Course name
 * @property {string} grau - Degree type (Licenciatura, Bacharelado, etc.)
 * @property {string} turno - Shift (Matutino, Vespertino, Noturno, Integral)
 */

/**
 * @typedef {Object} Modalidade
 * @property {string} tipo - Competition type (A=Ampla, L=Lei de Cotas, V=Reserva, B=Bônus)
 * @property {string} tipoConcorrencia - Detailed competition type (AC, LB_PPI, LI_PPI, etc.)
 * @property {string} descricao - Full description of the modality
 * @property {number} percentualBonus - Bonus percentage for affirmative actions
 */

/**
 * @typedef {Object} InscricaoNotaCorte
 * @property {string} edicao - SISU edition year
 * @property {Instituicao} instituicao - Institution data
 * @property {Campus} campus - Campus data
 * @property {Curso} curso - Course data
 * @property {Modalidade} modalidade - Competition modality
 * @property {number} vagasOfertadas - Number of offered vacancies
 * @property {number} notaCorte - Cut-off score
 * @property {number} inscricoes - Number of applications
 */

/**
 * @typedef {Object} PesosNotas
 * @property {number} pesoRedacao - Essay weight
 * @property {number} notaMinimaRedacao - Minimum essay score
 * @property {number} pesoLinguagens - Languages weight
 * @property {number} notaMinimaLinguagens - Minimum languages score
 * @property {number} pesoMatematica - Math weight
 * @property {number} notaMinimaMatematica - Minimum math score
 * @property {number} pesoCienciasHumanas - Human sciences weight
 * @property {number} notaMinimaCienciasHumanas - Minimum human sciences score
 * @property {number} pesoCienciasNatureza - Natural sciences weight
 * @property {number} notaMinimaCienciasNatureza - Minimum natural sciences score
 * @property {number} mediaMinimaEnem - Minimum ENEM average
 */

/**
 * @typedef {Object} PercentuaisIBGE
 * @property {number} ppiUF - PPI percentage for the state (IBGE)
 * @property {number} ppUF - PP percentage for the state (IBGE)
 * @property {number} indigenaUF - Indigenous percentage for the state (IBGE)
 * @property {number} quilombolaUF - Quilombola percentage for the state (IBGE)
 * @property {number} pcdUF - PCD percentage for the state (IBGE)
 */

/**
 * @typedef {Object} PercentuaisInstituicao
 * @property {number} lei - Law percentage registered by institution
 * @property {number} ppi - PPI percentage registered by institution
 * @property {number} quilombola - Quilombola percentage registered by institution
 * @property {number} pcd - PCD percentage registered by institution
 */

/**
 * @typedef {Object} VagaOfertada
 * @property {string} edicao - SISU edition year
 * @property {Instituicao} instituicao - Institution data
 * @property {Campus} campus - Campus data
 * @property {Curso} curso - Course data
 * @property {string} periodicidade - Course periodicity
 * @property {number} semestres - Number of semesters
 * @property {number} vagasAutorizadas - Authorized vacancies (e-MEC)
 * @property {number} vagasOfertadas - Offered vacancies in SISU
 * @property {Modalidade} modalidade - Competition modality
 * @property {PesosNotas} pesosNotas - Weights and minimum scores for ENEM
 * @property {PercentuaisIBGE} percentuaisIBGE - IBGE percentages for the state
 * @property {PercentuaisInstituicao} percentuaisInstituicao - Institution registered percentages
 */

/**
 * Parses a numeric value, returning 0 if empty or invalid
 * @param {any} value - Value to parse
 * @returns {number}
 */
function parseNumber(value) {
  if (value === undefined || value === null || value === '') return 0;
  const num = parseFloat(String(value).replace(',', '.'));
  return isNaN(num) ? 0 : num;
}

/**
 * Trims string value or returns empty string
 * @param {any} value - Value to trim
 * @returns {string}
 */
function trimString(value) {
  return value ? String(value).trim() : '';
}

/**
 * Loads inscriptions and cut-off scores data
 * @param {string} [filePath] - Path to the xlsx file (default: portal-sisu-<SISU_YEAR>-inscricoes-e-nota-de-corte.xlsx)
 * @returns {InscricaoNotaCorte[]} Array of inscription records
 */
export function loadInscricoesNotaCorte(filePath = INSCRICOES_FILE) {
  const rawData = getSheetContent(filePath, 1);

  return rawData.map(row => ({
    edicao: trimString(row.EDICAO),
    instituicao: {
      codigo: trimString(row.CO_IES),
      nome: trimString(row.NO_IES),
      sigla: trimString(row.SG_IES),
      organizacaoAcademica: trimString(row.DS_ORGANIZACAO_ACADEMICA),
      categoriaAdministrativa: trimString(row.DS_CATEGORIA_ADM)
    },
    campus: {
      nome: trimString(row.NO_CAMPUS),
      municipio: trimString(row.NO_MUNICIPIO_CAMPUS),
      uf: trimString(row.SG_UF_CAMPUS),
      regiao: trimString(row.DS_REGIAO_CAMPUS)
    },
    curso: {
      codigo: trimString(row.CO_IES_CURSO),
      nome: trimString(row.NO_CURSO),
      grau: trimString(row.DS_GRAU),
      turno: trimString(row.DS_TURNO)
    },
    modalidade: {
      tipo: trimString(row.TP_MOD_CONCORRENCIA),
      tipoConcorrencia: trimString(row.TIPO_CONCORRENCIA),
      descricao: trimString(row.DS_MOD_CONCORRENCIA),
      percentualBonus: parseNumber(row.NU_PERCENTUAL_BONUS)
    },
    vagasOfertadas: parseNumber(row.QT_VAGAS_OFERTADAS || row.QT_VAGAS_CONCORRENCIA),
    notaCorte: parseNumber(row.NU_NOTACORTE),
    inscricoes: parseNumber(row.QT_INSCRICAO)
  }));
}

/**
 * Loads offered vacancies data
 * @param {string} [filePath] - Path to the xlsx file (default: portal-sisu-<SISU_YEAR>-vagas-ofertadas.xlsx)
 * @returns {VagaOfertada[]} Array of vacancy records
 */
export function loadVagasOfertadas(filePath = VAGAS_FILE) {
  const rawData = getSheetContent(filePath, 1);

  return rawData.map(row => ({
    edicao: trimString(row.EDICAO),
    instituicao: {
      codigo: trimString(row.CO_IES),
      nome: trimString(row.NO_IES),
      sigla: trimString(row.SG_IES),
      organizacaoAcademica: trimString(row.DS_ORGANIZACAO_ACADEMICA),
      categoriaAdministrativa: trimString(row.DS_CATEGORIA_ADM)
    },
    campus: {
      nome: trimString(row.NO_CAMPUS),
      municipio: trimString(row.NO_MUNICIPIO_CAMPUS),
      uf: trimString(row.SG_UF_CAMPUS),
      regiao: trimString(row.DS_REGIAO)
    },
    curso: {
      codigo: trimString(row.CO_IES_CURSO),
      nome: trimString(row.NO_CURSO),
      grau: trimString(row.DS_GRAU),
      turno: trimString(row.DS_TURNO)
    },
    periodicidade: trimString(row.DS_PERIODICIDADE),
    semestres: parseNumber(row.QT_SEMESTRE),
    vagasAutorizadas: parseNumber(row.NU_VAGAS_AUTORIZADAS),
    vagasOfertadas: parseNumber(row.QT_VAGAS_OFERTADAS),
    modalidade: {
      tipo: trimString(row.TP_MOD_CONCORRENCIA),
      tipoConcorrencia: trimString(row.TP_COTA),
      descricao: trimString(row.DS_MOD_CONCORRENCIA),
      percentualBonus: parseNumber(row.NU_PERCENTUAL_BONUS)
    },
    pesosNotas: {
      pesoRedacao: parseNumber(row.PESO_REDACAO),
      notaMinimaRedacao: parseNumber(row.NOTA_MINIMA_REDACAO),
      pesoLinguagens: parseNumber(row.PESO_LINGUAGENS),
      notaMinimaLinguagens: parseNumber(row.NOTA_MINIMA_LINGUAGENS),
      pesoMatematica: parseNumber(row.PESO_MATEMATICA),
      notaMinimaMatematica: parseNumber(row.NOTA_MINIMA_MATEMATICA),
      pesoCienciasHumanas: parseNumber(row.PESO_CIENCIAS_HUMANAS),
      notaMinimaCienciasHumanas: parseNumber(row.NOTA_MINIMA_CIENCIAS_HUMANAS),
      pesoCienciasNatureza: parseNumber(row.PESO_CIENCIAS_NATUREZA),
      notaMinimaCienciasNatureza: parseNumber(row.NOTA_MINIMA_CIENCIAS_NATUREZA),
      mediaMinimaEnem: parseNumber(row.NU_MEDIA_MINIMA_ENEM)
    },
    percentuaisIBGE: {
      ppiUF: parseNumber(row.PERC_UF_IBGE_PPI || row.PERC_UF_PRE_PPI),
      ppUF: parseNumber(row.PERC_UF_IBGE_PP || row.PERC_UF_PP),
      indigenaUF: parseNumber(row.PERC_UF_IBGE_I || row.PERC_UF_I),
      quilombolaUF: parseNumber(row.PERC_UF_IBGE_Q || row.PERC_UF_Q),
      pcdUF: parseNumber(row.PERC_UF_IBGE_PCD || row.PERC_UF_PCD)
    },
    percentuaisInstituicao: {
      lei: parseNumber(row.NU_PERC_LEI),
      ppi: parseNumber(row.NU_PERC_PPI),
      quilombola: parseNumber(row.NU_PERC_Q),
      pcd: parseNumber(row.NU_PERC_PCD)
    }
  }));
}

/**
 * Gets metadata about the inscriptions file
 * @param {string} [filePath] - Path to the xlsx file
 * @returns {Object} File metadata
 */
export function getInscricoesInfo(filePath = INSCRICOES_FILE) {
  return getSheetInfo(filePath, 1);
}

/**
 * Gets metadata about the vacancies file
 * @param {string} [filePath] - Path to the xlsx file
 * @returns {Object} File metadata
 */
export function getVagasInfo(filePath = VAGAS_FILE) {
  return getSheetInfo(filePath, 1);
}

// ============ HELPER FILTER FUNCTIONS ============

/**
 * Filters records by state (UF)
 * @template {InscricaoNotaCorte|VagaOfertada} T
 * @param {T[]} records - Array of records
 * @param {string} uf - State abbreviation (e.g., 'SP', 'RJ', 'MG')
 * @returns {T[]} Filtered records
 */
export function filterByUF(records, uf) {
  const ufUpper = uf.toUpperCase();
  return records.filter(r => r.campus.uf === ufUpper);
}

/**
 * Filters records by institution name or abbreviation
 * @template {InscricaoNotaCorte|VagaOfertada} T
 * @param {T[]} records - Array of records
 * @param {string} search - Search term (matches name or abbreviation)
 * @returns {T[]} Filtered records
 */
export function filterByInstituicao(records, search) {
  const searchLower = search.toLowerCase();
  return records.filter(r =>
    r.instituicao.nome.toLowerCase().includes(searchLower) ||
    r.instituicao.sigla.toLowerCase().includes(searchLower)
  );
}

/**
 * Filters records by course name
 * @template {InscricaoNotaCorte|VagaOfertada} T
 * @param {T[]} records - Array of records
 * @param {string} search - Search term
 * @returns {T[]} Filtered records
 */
export function filterByCurso(records, search) {
  const searchLower = search.toLowerCase();
  return records.filter(r => r.curso.nome.toLowerCase().includes(searchLower));
}

/**
 * Filters records by competition modality type
 * @template {InscricaoNotaCorte|VagaOfertada} T
 * @param {T[]} records - Array of records
 * @param {string} tipo - Modality type: 'A' (Ampla), 'L' (Lei de Cotas), 'V' (Reserva), 'B' (Bônus)
 * @returns {T[]} Filtered records
 */
export function filterByModalidade(records, tipo) {
  return records.filter(r => r.modalidade.tipo === tipo);
}

/**
 * Filters inscricoes by minimum cut-off score
 * @param {InscricaoNotaCorte[]} records - Array of inscription records
 * @param {number} minScore - Minimum cut-off score
 * @returns {InscricaoNotaCorte[]} Filtered records
 */
export function filterByNotaCorteMinima(records, minScore) {
  return records.filter(r => r.notaCorte >= minScore);
}

/**
 * Filters inscricoes by maximum cut-off score
 * @param {InscricaoNotaCorte[]} records - Array of inscription records
 * @param {number} maxScore - Maximum cut-off score
 * @returns {InscricaoNotaCorte[]} Filtered records
 */
export function filterByNotaCorteMaxima(records, maxScore) {
  return records.filter(r => r.notaCorte > 0 && r.notaCorte <= maxScore);
}

// ============ AGGREGATION FUNCTIONS ============

/**
 * Gets unique list of institutions
 * @template {InscricaoNotaCorte|VagaOfertada} T
 * @param {T[]} records - Array of records
 * @returns {Instituicao[]} Unique institutions
 */
export function getInstituicoes(records) {
  const map = new Map();
  for (const r of records) {
    if (!map.has(r.instituicao.codigo)) {
      map.set(r.instituicao.codigo, r.instituicao);
    }
  }
  return Array.from(map.values());
}

/**
 * Gets unique list of courses
 * @template {InscricaoNotaCorte|VagaOfertada} T
 * @param {T[]} records - Array of records
 * @returns {string[]} Unique course names
 */
export function getCursos(records) {
  return [...new Set(records.map(r => r.curso.nome))].sort();
}

/**
 * Gets unique list of states
 * @template {InscricaoNotaCorte|VagaOfertada} T
 * @param {T[]} records - Array of records
 * @returns {string[]} Unique state abbreviations
 */
export function getUFs(records) {
  return [...new Set(records.map(r => r.campus.uf))].sort();
}

/**
 * Groups records by a key function
 * @template {InscricaoNotaCorte|VagaOfertada} T
 * @param {T[]} records - Array of records
 * @param {function(T): string} keyFn - Function to extract group key
 * @returns {Map<string, T[]>} Grouped records
 */
export function groupBy(records, keyFn) {
  const groups = new Map();
  for (const r of records) {
    const key = keyFn(r);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(r);
  }
  return groups;
}

/**
 * Calculates statistics for cut-off scores
 * @param {InscricaoNotaCorte[]} records - Array of inscription records
 * @returns {Object} Statistics (min, max, avg, median)
 */
export function calcularEstatisticasNotaCorte(records) {
  const scores = records.map(r => r.notaCorte).filter(s => s > 0);
  if (scores.length === 0) {
    return { min: 0, max: 0, media: 0, mediana: 0, total: 0 };
  }

  scores.sort((a, b) => a - b);
  const sum = scores.reduce((a, b) => a + b, 0);
  const mid = Math.floor(scores.length / 2);

  return {
    min: scores[0],
    max: scores[scores.length - 1],
    media: sum / scores.length,
    mediana: scores.length % 2 ? scores[mid] : (scores[mid - 1] + scores[mid]) / 2,
    total: scores.length
  };
}

// ============ JSON EXPORT FUNCTIONS ============

/**
 * @typedef {Object} ExportMetadata
 * @property {string} exportedAt - ISO timestamp of export
 * @property {string} sourceFile - Original xlsx file name
 * @property {number} recordCount - Number of records exported
 * @property {string} edicao - SISU edition
 */

/**
 * @typedef {Object} ExportedData
 * @property {ExportMetadata} metadata - Export metadata
 * @property {InscricaoNotaCorte[]|VagaOfertada[]} data - The exported records
 */

/**
 * @typedef {Object} ExportOptions
 * @property {boolean} [compact=false] - If true, outputs minified JSON (smaller file, same load speed)
 */

/**
 * Exports inscriptions data to JSON file
 * @param {string} [outputPath] - Output JSON file path (default: sisu-inscricoes-nota-corte.json)
 * @param {string} [xlsxPath] - Source xlsx file path
 * @param {ExportOptions} [options] - Export options
 * @returns {ExportMetadata} Export metadata
 */
export function exportInscricoesToJson(outputPath = INSCRICOES_JSON, xlsxPath = INSCRICOES_FILE, options = {}) {
  const { compact = false } = options;
  const data = loadInscricoesNotaCorte(xlsxPath);

  const metadata = {
    exportedAt: new Date().toISOString(),
    sourceFile: xlsxPath,
    recordCount: data.length,
    edicao: data[0]?.edicao || 'unknown'
  };

  const exported = { metadata, data };
  const jsonStr = compact ? JSON.stringify(exported) : JSON.stringify(exported, null, 2);
  writeFileSync(outputPath, jsonStr, 'utf-8');

  return metadata;
}

/**
 * Exports vacancies data to JSON file
 * @param {string} [outputPath] - Output JSON file path (default: sisu-vagas-ofertadas.json)
 * @param {string} [xlsxPath] - Source xlsx file path
 * @param {ExportOptions} [options] - Export options
 * @returns {ExportMetadata} Export metadata
 */
export function exportVagasToJson(outputPath = VAGAS_JSON, xlsxPath = VAGAS_FILE, options = {}) {
  const { compact = false } = options;
  const data = loadVagasOfertadas(xlsxPath);

  const metadata = {
    exportedAt: new Date().toISOString(),
    sourceFile: xlsxPath,
    recordCount: data.length,
    edicao: data[0]?.edicao || 'unknown'
  };

  const exported = { metadata, data };
  const jsonStr = compact ? JSON.stringify(exported) : JSON.stringify(exported, null, 2);
  writeFileSync(outputPath, jsonStr, 'utf-8');

  return metadata;
}

/**
 * Exports both datasets to a single combined JSON file
 * @param {string} [outputPath] - Output JSON file path (default: sisu-data-combined.json)
 * @param {ExportOptions} [options] - Export options
 * @returns {Object} Combined export metadata
 */
export function exportAllToJson(outputPath = COMBINED_JSON, options = {}) {
  const { compact = false } = options;
  const inscricoes = loadInscricoesNotaCorte();
  const vagas = loadVagasOfertadas();

  const metadata = {
    exportedAt: new Date().toISOString(),
    edicao: inscricoes[0]?.edicao || 'unknown',
    inscricoes: {
      sourceFile: INSCRICOES_FILE,
      recordCount: inscricoes.length
    },
    vagas: {
      sourceFile: VAGAS_FILE,
      recordCount: vagas.length
    }
  };

  const exported = {
    metadata,
    inscricoes,
    vagas
  };

  const jsonStr = compact ? JSON.stringify(exported) : JSON.stringify(exported, null, 2);
  writeFileSync(outputPath, jsonStr, 'utf-8');

  return metadata;
}

/**
 * Exports both datasets to separate JSON files
 * @param {string} [inscricoesPath] - Output path for inscriptions
 * @param {string} [vagasPath] - Output path for vacancies
 * @param {ExportOptions} [options] - Export options
 * @returns {Object} Export results with metadata for both files
 */
export function exportToSeparateJsonFiles(inscricoesPath = INSCRICOES_JSON, vagasPath = VAGAS_JSON, options = {}) {
  const inscricoesMetadata = exportInscricoesToJson(inscricoesPath, undefined, options);
  const vagasMetadata = exportVagasToJson(vagasPath, undefined, options);

  return {
    inscricoes: { path: inscricoesPath, ...inscricoesMetadata },
    vagas: { path: vagasPath, ...vagasMetadata }
  };
}

// ============ JSON IMPORT FUNCTIONS ============

/**
 * Loads inscriptions data from JSON file (faster than xlsx)
 * @param {string} [jsonPath] - JSON file path (default: sisu-inscricoes-nota-corte.json)
 * @returns {InscricaoNotaCorte[]} Array of inscription records
 * @throws {DataError} If file cannot be read or parsed
 */
export function loadInscricoesFromJson(jsonPath = INSCRICOES_JSON) {
  validateJsonPath(jsonPath);
  if (!existsSync(jsonPath)) {
    throw new DataError(`JSON file not found: ${jsonPath}. Run exportToSeparateJsonFiles() first.`);
  }
  try {
    const content = readFileSync(jsonPath, 'utf-8');
    const parsed = JSON.parse(content);
    if (!parsed.data || !Array.isArray(parsed.data)) {
      throw new DataError(`Invalid JSON structure: expected { data: [...] }`);
    }
    return parsed.data;
  } catch (error) {
    if (error instanceof DataError) throw error;
    throw new DataError(`Failed to load inscricoes from JSON: ${error.message}`);
  }
}

/**
 * Loads vacancies data from JSON file (faster than xlsx)
 * @param {string} [jsonPath] - JSON file path (default: sisu-vagas-ofertadas.json)
 * @returns {VagaOfertada[]} Array of vacancy records
 * @throws {DataError} If file cannot be read or parsed
 */
export function loadVagasFromJson(jsonPath = VAGAS_JSON) {
  validateJsonPath(jsonPath);
  if (!existsSync(jsonPath)) {
    throw new DataError(`JSON file not found: ${jsonPath}. Run exportToSeparateJsonFiles() first.`);
  }
  try {
    const content = readFileSync(jsonPath, 'utf-8');
    const parsed = JSON.parse(content);
    if (!parsed.data || !Array.isArray(parsed.data)) {
      throw new DataError(`Invalid JSON structure: expected { data: [...] }`);
    }
    return parsed.data;
  } catch (error) {
    if (error instanceof DataError) throw error;
    throw new DataError(`Failed to load vagas from JSON: ${error.message}`);
  }
}

/**
 * Loads both datasets from combined JSON file
 * @param {string} [jsonPath] - JSON file path (default: sisu-data-combined.json)
 * @returns {Object} Object with inscricoes and vagas arrays
 */
export function loadAllFromJson(jsonPath = COMBINED_JSON) {
  const content = readFileSync(jsonPath, 'utf-8');
  const parsed = JSON.parse(content);
  return {
    inscricoes: parsed.inscricoes,
    vagas: parsed.vagas,
    metadata: parsed.metadata
  };
}

/**
 * Loads inscriptions data from JSON if available, otherwise from xlsx
 * @param {string} [jsonPath] - JSON file path
 * @param {string} [xlsxPath] - Fallback xlsx file path
 * @returns {InscricaoNotaCorte[]} Array of inscription records
 */
export function loadInscricoes(jsonPath = INSCRICOES_JSON, xlsxPath = INSCRICOES_FILE) {
  if (existsSync(jsonPath)) {
    return loadInscricoesFromJson(jsonPath);
  }
  return loadInscricoesNotaCorte(xlsxPath);
}

/**
 * Loads vacancies data from JSON if available, otherwise from xlsx
 * @param {string} [jsonPath] - JSON file path
 * @param {string} [xlsxPath] - Fallback xlsx file path
 * @returns {VagaOfertada[]} Array of vacancy records
 */
export function loadVagas(jsonPath = VAGAS_JSON, xlsxPath = VAGAS_FILE) {
  if (existsSync(jsonPath)) {
    return loadVagasFromJson(jsonPath);
  }
  return loadVagasOfertadas(xlsxPath);
}

/**
 * Gets metadata from exported JSON file without loading all data
 * @param {string} jsonPath - JSON file path
 * @returns {ExportMetadata|null} Metadata or null if file doesn't exist
 */
export function getJsonMetadata(jsonPath) {
  if (!existsSync(jsonPath)) {
    return null;
  }
  const content = readFileSync(jsonPath, 'utf-8');
  const parsed = JSON.parse(content);
  return parsed.metadata;
}
