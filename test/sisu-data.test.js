/**
 * Test suite for sisu-data.js
 * Uses Node.js native test runner (node:test)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  loadVagas,
  loadInscricoes,
  loadVagasFromJson,
  loadInscricoesFromJson,
  filterByUF,
  filterByInstituicao,
  filterByCurso,
  filterByModalidade,
  getInstituicoes,
  getCursos,
  getUFs,
  calcularEstatisticasNotaCorte,
  DataError
} from '../sisu-data.js';

// ============================================
// Data Loading Tests
// ============================================

describe('loadVagas', () => {
  it('should return array of vacancy records', () => {
    const vagas = loadVagas();
    assert(Array.isArray(vagas));
    assert(vagas.length > 0);
  });

  it('should have required fields in each record', () => {
    const vagas = loadVagas();
    const sample = vagas[0];

    assert(sample.instituicao, 'Missing instituicao');
    assert(sample.instituicao.codigo, 'Missing instituicao.codigo');
    assert(sample.instituicao.nome, 'Missing instituicao.nome');
    assert(sample.instituicao.sigla, 'Missing instituicao.sigla');

    assert(sample.campus, 'Missing campus');
    assert(sample.campus.uf, 'Missing campus.uf');
    assert(sample.campus.municipio, 'Missing campus.municipio');

    assert(sample.curso, 'Missing curso');
    assert(sample.curso.nome, 'Missing curso.nome');
    assert(sample.curso.grau, 'Missing curso.grau');
    assert(sample.curso.turno, 'Missing curso.turno');

    assert(sample.modalidade, 'Missing modalidade');
    assert(sample.pesosNotas, 'Missing pesosNotas');
  });

  it('should have valid pesosNotas structure', () => {
    const vagas = loadVagas();
    const sample = vagas[0].pesosNotas;

    assert(typeof sample.pesoRedacao === 'number');
    assert(typeof sample.pesoLinguagens === 'number');
    assert(typeof sample.pesoMatematica === 'number');
    assert(typeof sample.pesoCienciasHumanas === 'number');
    assert(typeof sample.pesoCienciasNatureza === 'number');
  });

  it('should have non-negative weights', () => {
    const vagas = loadVagas();
    for (const vaga of vagas.slice(0, 1000)) {
      const p = vaga.pesosNotas;
      assert(p.pesoRedacao >= 0, `Negative pesoRedacao: ${p.pesoRedacao}`);
      assert(p.pesoLinguagens >= 0, `Negative pesoLinguagens: ${p.pesoLinguagens}`);
      assert(p.pesoMatematica >= 0, `Negative pesoMatematica: ${p.pesoMatematica}`);
      assert(p.pesoCienciasHumanas >= 0, `Negative pesoCienciasHumanas: ${p.pesoCienciasHumanas}`);
      assert(p.pesoCienciasNatureza >= 0, `Negative pesoCienciasNatureza: ${p.pesoCienciasNatureza}`);
    }
  });
});

describe('loadInscricoes', () => {
  it('should return array of inscription records', () => {
    const inscricoes = loadInscricoes();
    assert(Array.isArray(inscricoes));
    assert(inscricoes.length > 0);
  });

  it('should have required fields', () => {
    const inscricoes = loadInscricoes();
    const sample = inscricoes[0];

    assert(sample.instituicao, 'Missing instituicao');
    assert(sample.curso, 'Missing curso');
    assert(sample.modalidade, 'Missing modalidade');
    assert(typeof sample.notaCorte === 'number', 'notaCorte should be number');
  });
});

describe('loadVagasFromJson', () => {
  it('should load data from JSON file', () => {
    const vagas = loadVagasFromJson();
    assert(Array.isArray(vagas));
    assert(vagas.length > 0);
  });

  it('should throw DataError for non-existent file', () => {
    assert.throws(
      () => loadVagasFromJson('nonexistent.json'),
      DataError
    );
  });

  it('should throw DataError for invalid path type', () => {
    assert.throws(
      () => loadVagasFromJson(123),
      DataError
    );
  });

  it('should throw DataError for non-JSON extension', () => {
    assert.throws(
      () => loadVagasFromJson('file.txt'),
      (err) => {
        assert(err instanceof DataError);
        assert(err.message.includes('JSON'));
        return true;
      }
    );
  });
});

describe('loadInscricoesFromJson', () => {
  it('should load data from JSON file', () => {
    const inscricoes = loadInscricoesFromJson();
    assert(Array.isArray(inscricoes));
    assert(inscricoes.length > 0);
  });
});

// ============================================
// Filter Function Tests
// ============================================

describe('filterByUF', () => {
  it('should filter records by state', () => {
    const vagas = loadVagas();
    const filtered = filterByUF(vagas, 'SP');

    assert(filtered.length > 0);
    for (const v of filtered) {
      assert.equal(v.campus.uf, 'SP');
    }
  });

  it('should be case-insensitive', () => {
    const vagas = loadVagas();
    const filtered = filterByUF(vagas, 'sp');

    assert(filtered.length > 0);
    for (const v of filtered) {
      assert.equal(v.campus.uf, 'SP');
    }
  });

  it('should return empty array for non-existent UF', () => {
    const vagas = loadVagas();
    const filtered = filterByUF(vagas, 'XX');
    assert.equal(filtered.length, 0);
  });
});

describe('filterByInstituicao', () => {
  it('should filter by institution name', () => {
    const vagas = loadVagas();
    const filtered = filterByInstituicao(vagas, 'Federal');

    assert(filtered.length > 0);
    for (const v of filtered) {
      assert(
        v.instituicao.nome.toLowerCase().includes('federal') ||
        v.instituicao.sigla.toLowerCase().includes('federal')
      );
    }
  });

  it('should filter by institution sigla', () => {
    const vagas = loadVagas();
    const filtered = filterByInstituicao(vagas, 'UFRJ');

    assert(filtered.length > 0);
    for (const v of filtered) {
      assert(
        v.instituicao.nome.toLowerCase().includes('ufrj') ||
        v.instituicao.sigla === 'UFRJ'
      );
    }
  });
});

describe('filterByCurso', () => {
  it('should filter by course name (partial match)', () => {
    const vagas = loadVagas();
    const filtered = filterByCurso(vagas, 'medicina');

    assert(filtered.length > 0);
    for (const v of filtered) {
      assert(v.curso.nome.toLowerCase().includes('medicina'));
    }
  });
});

describe('filterByModalidade', () => {
  it('should filter by competition type', () => {
    const vagas = loadVagas();
    const filtered = filterByModalidade(vagas, 'A');

    assert(filtered.length > 0);
    for (const v of filtered) {
      assert.equal(v.modalidade.tipo, 'A');
    }
  });

  it('should filter Lei de Cotas', () => {
    const vagas = loadVagas();
    const filtered = filterByModalidade(vagas, 'L');

    assert(filtered.length > 0);
    for (const v of filtered) {
      assert.equal(v.modalidade.tipo, 'L');
    }
  });
});

// ============================================
// Aggregation Function Tests
// ============================================

describe('getInstituicoes', () => {
  it('should return unique institutions', () => {
    const vagas = loadVagas();
    const instituicoes = getInstituicoes(vagas);

    assert(Array.isArray(instituicoes));
    assert(instituicoes.length > 0);

    // Check uniqueness
    const codigos = instituicoes.map(i => i.codigo);
    const uniqueCodigos = [...new Set(codigos)];
    assert.equal(codigos.length, uniqueCodigos.length);
  });

  it('should have required fields', () => {
    const vagas = loadVagas();
    const instituicoes = getInstituicoes(vagas);

    for (const inst of instituicoes) {
      assert(inst.codigo);
      assert(inst.nome);
      assert(inst.sigla);
    }
  });
});

describe('getCursos', () => {
  it('should return unique sorted course names', () => {
    const vagas = loadVagas();
    const cursos = getCursos(vagas);

    assert(Array.isArray(cursos));
    assert(cursos.length > 0);
    assert(cursos.every(c => typeof c === 'string'));

    // Check sorted
    const sorted = [...cursos].sort();
    assert.deepEqual(cursos, sorted);

    // Check uniqueness
    const unique = [...new Set(cursos)];
    assert.equal(cursos.length, unique.length);
  });
});

describe('getUFs', () => {
  it('should return unique sorted state abbreviations', () => {
    const vagas = loadVagas();
    const ufs = getUFs(vagas);

    assert(Array.isArray(ufs));
    assert(ufs.length > 0);
    assert(ufs.every(uf => typeof uf === 'string' && uf.length === 2));
  });

  it('should include major states', () => {
    const vagas = loadVagas();
    const ufs = getUFs(vagas);

    assert(ufs.includes('SP'), 'Should include SP');
    assert(ufs.includes('RJ'), 'Should include RJ');
    assert(ufs.includes('MG'), 'Should include MG');
  });
});

describe('calcularEstatisticasNotaCorte', () => {
  it('should calculate statistics correctly', () => {
    const inscricoes = loadInscricoes();
    const stats = calcularEstatisticasNotaCorte(inscricoes);

    assert(typeof stats.min === 'number');
    assert(typeof stats.max === 'number');
    assert(typeof stats.media === 'number');
    assert(typeof stats.mediana === 'number');
    assert(typeof stats.total === 'number');

    assert(stats.min <= stats.media);
    assert(stats.media <= stats.max);
    assert(stats.min <= stats.mediana);
    assert(stats.mediana <= stats.max);
  });

  it('should handle records without cut-off scores', () => {
    const mockRecords = [
      { notaCorte: 0 },
      { notaCorte: 500 },
      { notaCorte: 600 },
      { notaCorte: 0 }
    ];
    const stats = calcularEstatisticasNotaCorte(mockRecords);

    // Should exclude zero scores
    assert.equal(stats.total, 2);
    assert.equal(stats.min, 500);
    assert.equal(stats.max, 600);
  });

  it('should return zeros for empty array', () => {
    const stats = calcularEstatisticasNotaCorte([]);
    assert.equal(stats.min, 0);
    assert.equal(stats.max, 0);
    assert.equal(stats.media, 0);
  });
});

// ============================================
// Data Consistency Tests
// ============================================

describe('Data Consistency', () => {
  it('should have matching record counts between vagas and inscricoes', () => {
    const vagas = loadVagas();
    const inscricoes = loadInscricoes();

    // They should be equal or very close (same edition)
    assert.equal(vagas.length, inscricoes.length,
      `Vagas (${vagas.length}) and Inscricoes (${inscricoes.length}) should have same count`);
  });

  it('should have valid UF codes (2 letters)', () => {
    const vagas = loadVagas();
    for (const v of vagas.slice(0, 1000)) {
      assert(
        /^[A-Z]{2}$/.test(v.campus.uf),
        `Invalid UF: ${v.campus.uf}`
      );
    }
  });

  it('should have valid modalidade types', () => {
    const validTypes = ['A', 'L', 'V', 'B'];
    const vagas = loadVagas();

    for (const v of vagas.slice(0, 1000)) {
      assert(
        validTypes.includes(v.modalidade.tipo),
        `Invalid modalidade: ${v.modalidade.tipo}`
      );
    }
  });

  it('should have non-negative vacancy counts', () => {
    const vagas = loadVagas();
    for (const v of vagas) {
      assert(v.vagasOfertadas >= 0, `Negative vacancy count: ${v.vagasOfertadas}`);
    }
  });
});
