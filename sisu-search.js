import {
  loadInscricoes,
  loadVagas
} from './sisu-data.js';

/**
 * @typedef {Object} EnemScores
 * @property {number} redacao - Essay score (0-1000)
 * @property {number} linguagens - Languages score (0-1000)
 * @property {number} matematica - Math score (0-1000)
 * @property {number} cienciasHumanas - Human sciences score (0-1000)
 * @property {number} cienciasNatureza - Natural sciences score (0-1000)
 */

/**
 * @typedef {Object} SearchFilters
 * @property {string[]} [ufs] - Filter by state abbreviations (e.g., ['SP', 'RJ', 'MG'])
 * @property {string[]} [municipios] - Filter by city names
 * @property {string[]} [cursos] - Filter by course names (partial match)
 * @property {string[]} [instituicoes] - Filter by institution names or abbreviations (partial match)
 * @property {string[]} [modalidades] - Filter by competition type: 'A' (Ampla), 'L' (Cotas), 'V' (Reserva), 'B' (Bônus)
 * @property {string[]} [tiposConcorrencia] - Filter by detailed competition type: 'AC', 'LB_PPI', 'LI_PPI', 'LB_Q', etc.
 * @property {string[]} [graus] - Filter by degree type: 'Bacharelado', 'Licenciatura', 'Tecnológico'
 * @property {string[]} [turnos] - Filter by shift: 'Matutino', 'Vespertino', 'Noturno', 'Integral'
 */

/**
 * @typedef {Object} SearchOptions
 * @property {number} [marginPercent=0] - Minimum margin above cut-off score (e.g., 5 means score must be 5% above cut-off)
 * @property {boolean} [includeNoScore=false] - Include vacancies without cut-off score (no applicants last year)
 * @property {number} [limit=100] - Maximum number of results to return
 * @property {'margin'|'notaCorte'|'curso'|'instituicao'} [sortBy='margin'] - Sort results by
 * @property {'asc'|'desc'} [sortOrder='desc'] - Sort order
 */

/**
 * @typedef {Object} VacancyMatch
 * @property {Object} instituicao - Institution data
 * @property {Object} campus - Campus data
 * @property {Object} curso - Course data
 * @property {Object} modalidade - Competition modality
 * @property {number} vagasOfertadas - Number of offered vacancies
 * @property {number} notaCorte - Cut-off score from last edition
 * @property {number} inscricoes - Number of applications last edition
 * @property {number} notaCalculada - Calculated weighted average for the student
 * @property {number} margem - Margin above cut-off (positive = above, negative = below)
 * @property {number} margemPercent - Margin as percentage
 * @property {boolean} atendeMinimos - Whether student meets all minimum score requirements
 * @property {Object} pesosNotas - The weights and minimum scores used
 * @property {string} chanceSummary - Human-readable chance assessment
 */

/**
 * Calculates the weighted average ENEM score for a specific vacancy
 * @param {EnemScores} scores - Student's ENEM scores
 * @param {Object} pesos - Vacancy weight configuration
 * @returns {number} Weighted average score
 */
export function calcularNotaPonderada(scores, pesos) {
  const totalPeso =
    pesos.pesoRedacao +
    pesos.pesoLinguagens +
    pesos.pesoMatematica +
    pesos.pesoCienciasHumanas +
    pesos.pesoCienciasNatureza;

  if (totalPeso === 0) return 0;

  const notaPonderada =
    (scores.redacao * pesos.pesoRedacao +
      scores.linguagens * pesos.pesoLinguagens +
      scores.matematica * pesos.pesoMatematica +
      scores.cienciasHumanas * pesos.pesoCienciasHumanas +
      scores.cienciasNatureza * pesos.pesoCienciasNatureza) /
    totalPeso;

  return notaPonderada;
}

/**
 * Checks if student's scores meet all minimum requirements for a vacancy
 * @param {EnemScores} scores - Student's ENEM scores
 * @param {Object} pesos - Vacancy weight configuration with minimum scores
 * @returns {Object} Object with overall result and details per subject
 */
export function verificarNotasMinimas(scores, pesos) {
  const checks = {
    redacao: scores.redacao >= pesos.notaMinimaRedacao,
    linguagens: scores.linguagens >= pesos.notaMinimaLinguagens,
    matematica: scores.matematica >= pesos.notaMinimaMatematica,
    cienciasHumanas: scores.cienciasHumanas >= pesos.notaMinimaCienciasHumanas,
    cienciasNatureza: scores.cienciasNatureza >= pesos.notaMinimaCienciasNatureza
  };

  // Check minimum average if specified
  const mediaSimples =
    (scores.redacao + scores.linguagens + scores.matematica +
      scores.cienciasHumanas + scores.cienciasNatureza) / 5;

  checks.mediaMinima = pesos.mediaMinimaEnem <= 0 || mediaSimples >= pesos.mediaMinimaEnem;

  return {
    aprovado: Object.values(checks).every(v => v),
    detalhes: checks,
    mediaSimples
  };
}

/**
 * Generates a human-readable chance assessment
 * @param {number} margemPercent - Margin percentage above cut-off
 * @param {boolean} atendeMinimos - Whether minimum scores are met
 * @param {number} inscricoes - Number of applications
 * @param {number} vagas - Number of vacancies
 * @returns {string} Chance summary
 */
function gerarResumoChance(margemPercent, atendeMinimos, inscricoes, vagas) {
  if (!atendeMinimos) {
    return 'Não atende notas mínimas';
  }

  const concorrencia = vagas > 0 ? inscricoes / vagas : 0;

  if (margemPercent >= 10) {
    return 'Muito alta';
  } else if (margemPercent >= 5) {
    return 'Alta';
  } else if (margemPercent >= 2) {
    return 'Boa';
  } else if (margemPercent >= 0) {
    if (concorrencia < 3) {
      return 'Razoável (baixa concorrência)';
    }
    return 'Razoável';
  } else if (margemPercent >= -2) {
    return 'Arriscada';
  } else if (margemPercent >= -5) {
    return 'Baixa';
  } else {
    return 'Muito baixa';
  }
}

/**
 * Creates a unique key for joining vagas and inscricoes
 * @param {Object} record - Vaga or Inscricao record
 * @returns {string} Unique key
 */
function createJoinKey(record) {
  return [
    record.instituicao.codigo,
    record.curso.codigo,
    record.modalidade.tipoConcorrencia.trim(),
    record.curso.turno
  ].join('|');
}

/**
 * Joins vagas and inscricoes data to get complete vacancy information
 * @returns {Map} Map of joined records
 */
function joinVagasInscricoes() {
  const vagas = loadVagas();
  const inscricoes = loadInscricoes();

  // Create a map of inscricoes by key for fast lookup
  const inscricoesMap = new Map();
  for (const insc of inscricoes) {
    const key = createJoinKey(insc);
    inscricoesMap.set(key, insc);
  }

  // Join with vagas
  const joined = [];
  for (const vaga of vagas) {
    const key = createJoinKey(vaga);
    const insc = inscricoesMap.get(key);

    joined.push({
      ...vaga,
      notaCorte: insc?.notaCorte || 0,
      inscricoes: insc?.inscricoes || 0
    });
  }

  return joined;
}

// Cache for joined data
let joinedDataCache = null;

/**
 * Gets joined data (with caching)
 * @param {boolean} [forceReload=false] - Force reload from files
 * @returns {Array} Joined vacancy records
 */
export function getJoinedData(forceReload = false) {
  if (!joinedDataCache || forceReload) {
    joinedDataCache = joinVagasInscricoes();
  }
  return joinedDataCache;
}

/**
 * Clears the joined data cache
 */
export function clearCache() {
  joinedDataCache = null;
}

/**
 * Applies text filter (partial match, case-insensitive)
 * @param {string} value - Value to check
 * @param {string[]} filters - Filter values
 * @returns {boolean} True if matches any filter
 */
function matchesTextFilter(value, filters) {
  if (!filters || filters.length === 0) return true;
  const valueLower = value.toLowerCase();
  return filters.some(f => valueLower.includes(f.toLowerCase()));
}

/**
 * Applies exact filter (case-insensitive for strings)
 * @param {string} value - Value to check
 * @param {string[]} filters - Filter values
 * @returns {boolean} True if matches any filter
 */
function matchesExactFilter(value, filters) {
  if (!filters || filters.length === 0) return true;
  const valueLower = value.toLowerCase();
  return filters.some(f => valueLower === f.toLowerCase());
}

/**
 * Main search function: finds vacancies matching filters and calculates chances
 * @param {EnemScores} scores - Student's ENEM scores
 * @param {SearchFilters} [filters={}] - Search filters
 * @param {SearchOptions} [options={}] - Search options
 * @returns {VacancyMatch[]} Array of matching vacancies with calculated scores
 */
export function buscarVagas(scores, filters = {}, options = {}) {
  const {
    marginPercent = -100,  // Default: show all, even below cut-off
    includeNoScore = false,
    limit = 100,
    sortBy = 'margin',
    sortOrder = 'desc'
  } = options;

  const data = getJoinedData();
  const results = [];

  for (const vaga of data) {
    // Apply filters
    if (!matchesExactFilter(vaga.campus.uf, filters.ufs)) continue;
    if (!matchesTextFilter(vaga.campus.municipio, filters.municipios)) continue;
    if (!matchesTextFilter(vaga.curso.nome, filters.cursos)) continue;
    if (!matchesTextFilter(vaga.instituicao.nome, filters.instituicoes) &&
        !matchesTextFilter(vaga.instituicao.sigla, filters.instituicoes)) continue;
    if (!matchesExactFilter(vaga.modalidade.tipo, filters.modalidades)) continue;
    if (filters.tiposConcorrencia && filters.tiposConcorrencia.length > 0) {
      const tipoConc = vaga.modalidade.tipoConcorrencia.trim();
      if (!filters.tiposConcorrencia.some(f => tipoConc.startsWith(f.trim()))) continue;
    }
    if (!matchesExactFilter(vaga.curso.grau, filters.graus)) continue;
    if (!matchesExactFilter(vaga.curso.turno, filters.turnos)) continue;

    // Skip vacancies without cut-off score unless explicitly included
    if (vaga.notaCorte === 0 && !includeNoScore) continue;

    // Calculate weighted score
    const notaCalculada = calcularNotaPonderada(scores, vaga.pesosNotas);

    // Check minimum scores
    const verificacao = verificarNotasMinimas(scores, vaga.pesosNotas);
    const atendeMinimos = verificacao.aprovado;

    // Calculate margin
    const margem = vaga.notaCorte > 0 ? notaCalculada - vaga.notaCorte : 0;
    const margemPercent = vaga.notaCorte > 0 ? (margem / vaga.notaCorte) * 100 : 0;

    // Filter by margin
    if (margemPercent < marginPercent) continue;

    // Generate chance summary
    const chanceSummary = gerarResumoChance(
      margemPercent,
      atendeMinimos,
      vaga.inscricoes,
      vaga.vagasOfertadas
    );

    results.push({
      instituicao: vaga.instituicao,
      campus: vaga.campus,
      curso: vaga.curso,
      modalidade: vaga.modalidade,
      vagasOfertadas: vaga.vagasOfertadas,
      notaCorte: vaga.notaCorte,
      inscricoes: vaga.inscricoes,
      notaCalculada: Math.round(notaCalculada * 100) / 100,
      margem: Math.round(margem * 100) / 100,
      margemPercent: Math.round(margemPercent * 100) / 100,
      atendeMinimos,
      verificacaoMinimos: verificacao.detalhes,
      pesosNotas: vaga.pesosNotas,
      chanceSummary,
      concorrencia: vaga.vagasOfertadas > 0
        ? Math.round((vaga.inscricoes / vaga.vagasOfertadas) * 10) / 10
        : 0
    });
  }

  // Sort results
  results.sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'margin':
        comparison = a.margemPercent - b.margemPercent;
        break;
      case 'notaCorte':
        comparison = a.notaCorte - b.notaCorte;
        break;
      case 'curso':
        comparison = a.curso.nome.localeCompare(b.curso.nome);
        break;
      case 'instituicao':
        comparison = a.instituicao.nome.localeCompare(b.instituicao.nome);
        break;
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  // Apply limit
  return results.slice(0, limit);
}

/**
 * Convenience function: find vacancies where student has good chances
 * @param {EnemScores} scores - Student's ENEM scores
 * @param {SearchFilters} [filters={}] - Search filters
 * @param {number} [limit=50] - Maximum results
 * @returns {VacancyMatch[]} Vacancies sorted by best chances
 */
export function buscarMelhoresChances(scores, filters = {}, limit = 50) {
  return buscarVagas(scores, filters, {
    marginPercent: 0,  // Only show where score >= cut-off
    limit,
    sortBy: 'margin',
    sortOrder: 'desc'
  });
}

/**
 * Convenience function: find competitive vacancies (close to cut-off)
 * @param {EnemScores} scores - Student's ENEM scores
 * @param {SearchFilters} [filters={}] - Search filters
 * @param {number} [limit=50] - Maximum results
 * @returns {VacancyMatch[]} Vacancies within ±5% of cut-off
 */
export function buscarVagasCompetitivas(scores, filters = {}, limit = 50) {
  const results = buscarVagas(scores, filters, {
    marginPercent: -5,
    limit: limit * 2,  // Get more to filter
    sortBy: 'margin',
    sortOrder: 'asc'
  });

  // Filter to only competitive range (-5% to +5%)
  return results
    .filter(r => r.margemPercent >= -5 && r.margemPercent <= 5)
    .slice(0, limit);
}

/**
 * Gets summary statistics for search results
 * @param {VacancyMatch[]} results - Search results
 * @returns {Object} Summary statistics
 */
export function getResultsSummary(results) {
  if (results.length === 0) {
    return { total: 0 };
  }

  const atendeMinimos = results.filter(r => r.atendeMinimos);
  const acimaCorte = results.filter(r => r.margem > 0);
  const altaChance = results.filter(r =>
    r.atendeMinimos && r.margemPercent >= 5
  );

  const ufs = [...new Set(results.map(r => r.campus.uf))];
  const instituicoes = [...new Set(results.map(r => r.instituicao.sigla))];
  const cursos = [...new Set(results.map(r => r.curso.nome))];

  return {
    total: results.length,
    atendeMinimos: atendeMinimos.length,
    acimaNotaCorte: acimaCorte.length,
    altaChance: altaChance.length,
    estados: ufs.length,
    instituicoes: instituicoes.length,
    cursosUnicos: cursos.length,
    margemMedia: results.reduce((sum, r) => sum + r.margemPercent, 0) / results.length,
    notaCorteMedia: results.reduce((sum, r) => sum + r.notaCorte, 0) / results.length
  };
}

/**
 * Formats a vacancy match for display
 * @param {VacancyMatch} match - Vacancy match
 * @returns {string} Formatted string
 */
export function formatarResultado(match) {
  const lines = [
    `${match.curso.nome} - ${match.curso.grau} (${match.curso.turno})`,
    `${match.instituicao.sigla} - ${match.instituicao.nome}`,
    `${match.campus.municipio}/${match.campus.uf}`,
    `Modalidade: ${match.modalidade.tipoConcorrencia.trim()} - ${match.modalidade.tipo === 'A' ? 'Ampla' : match.modalidade.tipo === 'L' ? 'Cotas' : match.modalidade.tipo}`,
    `Nota de Corte: ${match.notaCorte.toFixed(2)} | Sua Nota: ${match.notaCalculada.toFixed(2)}`,
    `Margem: ${match.margem >= 0 ? '+' : ''}${match.margem.toFixed(2)} (${match.margemPercent >= 0 ? '+' : ''}${match.margemPercent.toFixed(1)}%)`,
    `Vagas: ${match.vagasOfertadas} | Inscrições: ${match.inscricoes} | Concorrência: ${match.concorrencia}:1`,
    `Chance: ${match.chanceSummary}${!match.atendeMinimos ? ' ⚠️' : match.margemPercent >= 5 ? ' ✓' : ''}`
  ];
  return lines.join('\n');
}
