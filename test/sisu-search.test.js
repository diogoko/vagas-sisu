/**
 * Test suite for sisu-search.js
 * Uses Node.js native test runner (node:test)
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  calcularNotaPonderada,
  verificarNotasMinimas,
  buscarVagas,
  buscarMelhoresChances,
  getJoinedData,
  validateEnemScores,
  validateFilters,
  ValidationError
} from '../sisu-search.js';

// ============================================
// Test Data
// ============================================

const validScores = {
  redacao: 720,
  linguagens: 650,
  matematica: 580,
  cienciasHumanas: 690,
  cienciasNatureza: 610
};

const equalWeights = {
  pesoRedacao: 1,
  pesoLinguagens: 1,
  pesoMatematica: 1,
  pesoCienciasHumanas: 1,
  pesoCienciasNatureza: 1,
  notaMinimaRedacao: 0,
  notaMinimaLinguagens: 0,
  notaMinimaMatematica: 0,
  notaMinimaCienciasHumanas: 0,
  notaMinimaCienciasNatureza: 0,
  mediaMinimaEnem: 0
};

const engineeringWeights = {
  pesoRedacao: 1,
  pesoLinguagens: 1,
  pesoMatematica: 3,
  pesoCienciasHumanas: 1,
  pesoCienciasNatureza: 2,
  notaMinimaRedacao: 400,
  notaMinimaLinguagens: 400,
  notaMinimaMatematica: 400,
  notaMinimaCienciasHumanas: 400,
  notaMinimaCienciasNatureza: 400,
  mediaMinimaEnem: 450
};

// ============================================
// Input Validation Tests
// ============================================

describe('validateEnemScores', () => {
  it('should accept valid scores', () => {
    const result = validateEnemScores(validScores);
    assert.deepEqual(result, validScores);
  });

  it('should reject null scores', () => {
    assert.throws(
      () => validateEnemScores(null),
      ValidationError
    );
  });

  it('should reject non-object scores', () => {
    assert.throws(
      () => validateEnemScores('invalid'),
      ValidationError
    );
    assert.throws(
      () => validateEnemScores(123),
      ValidationError
    );
  });

  it('should reject missing required fields', () => {
    assert.throws(
      () => validateEnemScores({ redacao: 600 }),
      ValidationError
    );
  });

  it('should reject scores below 0', () => {
    assert.throws(
      () => validateEnemScores({ ...validScores, redacao: -10 }),
      (err) => {
        assert(err instanceof ValidationError);
        assert(err.message.includes('redacao'));
        assert(err.message.includes('between 0 and 1000'));
        return true;
      }
    );
  });

  it('should reject scores above 1000', () => {
    assert.throws(
      () => validateEnemScores({ ...validScores, matematica: 1500 }),
      (err) => {
        assert(err instanceof ValidationError);
        assert(err.message.includes('matematica'));
        return true;
      }
    );
  });

  it('should reject non-numeric scores', () => {
    assert.throws(
      () => validateEnemScores({ ...validScores, linguagens: 'abc' }),
      ValidationError
    );
  });

  it('should reject empty, blank and non-finite scores', () => {
    for (const bad of ['', '   ', NaN, Infinity]) {
      assert.throws(
        () => validateEnemScores({ ...validScores, linguagens: bad }),
        ValidationError,
        `should reject ${JSON.stringify(bad)}`
      );
    }
  });

  it('should accept boundary values (0 and 1000)', () => {
    const boundaryScores = {
      redacao: 0,
      linguagens: 1000,
      matematica: 500,
      cienciasHumanas: 0,
      cienciasNatureza: 1000
    };
    const result = validateEnemScores(boundaryScores);
    assert.deepEqual(result, boundaryScores);
  });
});

describe('validateFilters', () => {
  it('should accept empty filters', () => {
    assert.deepEqual(validateFilters({}), {});
    assert.deepEqual(validateFilters(undefined), {});
    assert.deepEqual(validateFilters(null), {});
  });

  it('should accept valid filters', () => {
    const filters = {
      ufs: ['SP', 'RJ'],
      cursos: ['medicina', 'direito'],
      modalidades: ['A', 'L']
    };
    const result = validateFilters(filters);
    assert.deepEqual(result, filters);
  });

  it('should reject non-object filters', () => {
    assert.throws(
      () => validateFilters('invalid'),
      ValidationError
    );
    assert.throws(
      () => validateFilters([1, 2, 3]),
      ValidationError
    );
  });

  it('should reject non-array filter values', () => {
    assert.throws(
      () => validateFilters({ ufs: 'SP' }),
      (err) => {
        assert(err instanceof ValidationError);
        assert(err.message.includes('ufs'));
        assert(err.message.includes('array'));
        return true;
      }
    );
  });

  it('should reject non-string array elements', () => {
    assert.throws(
      () => validateFilters({ ufs: ['SP', 123] }),
      ValidationError
    );
  });

  it('should reject invalid modalidades', () => {
    assert.throws(
      () => validateFilters({ modalidades: ['A', 'X'] }),
      (err) => {
        assert(err instanceof ValidationError);
        assert(err.message.includes('Invalid modalidade'));
        assert(err.message.includes('X'));
        return true;
      }
    );
  });

  it('should accept all valid modalidades', () => {
    const filters = { modalidades: ['A', 'L', 'V', 'B'] };
    const result = validateFilters(filters);
    assert.deepEqual(result.modalidades, ['A', 'L', 'V', 'B']);
  });
});

// ============================================
// Calculation Tests
// ============================================

describe('calcularNotaPonderada', () => {
  it('should calculate simple average with equal weights', () => {
    const scores = {
      redacao: 600,
      linguagens: 500,
      matematica: 700,
      cienciasHumanas: 550,
      cienciasNatureza: 650
    };
    // (600+500+700+550+650) / 5 = 600
    const result = calcularNotaPonderada(scores, equalWeights);
    assert.equal(result, 600);
  });

  it('should calculate weighted average correctly', () => {
    const scores = {
      redacao: 600,
      linguagens: 500,
      matematica: 700,
      cienciasHumanas: 550,
      cienciasNatureza: 650
    };
    // (600*1 + 500*1 + 700*3 + 550*1 + 650*2) / 8 = 631.25
    const result = calcularNotaPonderada(scores, engineeringWeights);
    assert.equal(result, 631.25);
  });

  it('should return 0 when all weights are 0', () => {
    const zeroWeights = {
      pesoRedacao: 0,
      pesoLinguagens: 0,
      pesoMatematica: 0,
      pesoCienciasHumanas: 0,
      pesoCienciasNatureza: 0
    };
    const result = calcularNotaPonderada(validScores, zeroWeights);
    assert.equal(result, 0);
  });

  it('should handle high weight on single component', () => {
    const scores = {
      redacao: 800,
      linguagens: 500,
      matematica: 500,
      cienciasHumanas: 500,
      cienciasNatureza: 500
    };
    const highRedacaoWeight = {
      pesoRedacao: 10,
      pesoLinguagens: 1,
      pesoMatematica: 1,
      pesoCienciasHumanas: 1,
      pesoCienciasNatureza: 1
    };
    // (800*10 + 500*1 + 500*1 + 500*1 + 500*1) / 14 = 10000/14 = 714.28...
    const result = calcularNotaPonderada(scores, highRedacaoWeight);
    assert(Math.abs(result - 714.2857) < 0.01);
  });

  it('should handle decimal weights', () => {
    const scores = {
      redacao: 700,
      linguagens: 700,
      matematica: 700,
      cienciasHumanas: 700,
      cienciasNatureza: 700
    };
    const decimalWeights = {
      pesoRedacao: 1.5,
      pesoLinguagens: 1.5,
      pesoMatematica: 2.5,
      pesoCienciasHumanas: 1.5,
      pesoCienciasNatureza: 2
    };
    // All 700, so result should be 700 regardless of weights
    const result = calcularNotaPonderada(scores, decimalWeights);
    assert.equal(result, 700);
  });
});

describe('verificarNotasMinimas', () => {
  it('should approve when all scores meet minimums', () => {
    const scores = {
      redacao: 500,
      linguagens: 500,
      matematica: 500,
      cienciasHumanas: 500,
      cienciasNatureza: 500
    };
    const result = verificarNotasMinimas(scores, engineeringWeights);
    assert.equal(result.aprovado, true);
  });

  it('should reject when one score is below minimum', () => {
    const scores = {
      redacao: 350, // Below 400 minimum
      linguagens: 500,
      matematica: 500,
      cienciasHumanas: 500,
      cienciasNatureza: 500
    };
    const result = verificarNotasMinimas(scores, engineeringWeights);
    assert.equal(result.aprovado, false);
    assert.equal(result.detalhes.redacao, false);
  });

  it('should check average minimum', () => {
    const scores = {
      redacao: 400,
      linguagens: 400,
      matematica: 400,
      cienciasHumanas: 400,
      cienciasNatureza: 400
    };
    // Average is 400, minimum is 450
    const result = verificarNotasMinimas(scores, engineeringWeights);
    assert.equal(result.aprovado, false);
    assert.equal(result.detalhes.mediaMinima, false);
  });

  it('should pass when no minimums are set', () => {
    const scores = {
      redacao: 100,
      linguagens: 100,
      matematica: 100,
      cienciasHumanas: 100,
      cienciasNatureza: 100
    };
    const result = verificarNotasMinimas(scores, equalWeights);
    assert.equal(result.aprovado, true);
  });
});

// ============================================
// Integration Tests
// ============================================

describe('buscarVagas', () => {
  it('should throw ValidationError for invalid scores', () => {
    assert.throws(
      () => buscarVagas({ redacao: 2000 }),
      ValidationError
    );
  });

  it('should throw ValidationError for invalid filters', () => {
    assert.throws(
      () => buscarVagas(validScores, { ufs: 'SP' }),
      ValidationError
    );
  });

  it('should return array of results with valid inputs', () => {
    const results = buscarVagas(validScores, { ufs: ['SP'] }, { limit: 5 });
    assert(Array.isArray(results));
  });

  it('should respect limit option', () => {
    const results = buscarVagas(validScores, {}, { limit: 10 });
    assert(results.length <= 10);
  });

  it('should filter by UF correctly', () => {
    const results = buscarVagas(validScores, { ufs: ['CE'] }, { limit: 50 });
    for (const r of results) {
      assert.equal(r.campus.uf, 'CE');
    }
  });

  it('should filter by modalidade correctly', () => {
    const results = buscarVagas(validScores, { modalidades: ['A'] }, { limit: 50 });
    for (const r of results) {
      assert.equal(r.modalidade.tipo, 'A');
    }
  });
});

describe('buscarMelhoresChances', () => {
  it('should return results sorted by margin (best chances first)', () => {
    const results = buscarMelhoresChances(validScores, {}, 20);
    for (let i = 1; i < results.length; i++) {
      assert(results[i - 1].margemPercent >= results[i].margemPercent,
        `Results not sorted: ${results[i - 1].margemPercent} should be >= ${results[i].margemPercent}`);
    }
  });

  it('should only return results with positive margin', () => {
    const results = buscarMelhoresChances(validScores, {}, 50);
    for (const r of results) {
      assert(r.margemPercent >= 0, `Found negative margin: ${r.margemPercent}`);
    }
  });
});

describe('getJoinedData', () => {
  it('should return array of joined records', () => {
    const data = getJoinedData();
    assert(Array.isArray(data));
    assert(data.length > 0);
  });

  it('should have required fields in each record', () => {
    const data = getJoinedData();
    const sample = data[0];

    assert(sample.instituicao, 'Missing instituicao');
    assert(sample.campus, 'Missing campus');
    assert(sample.curso, 'Missing curso');
    assert(sample.modalidade, 'Missing modalidade');
    assert(sample.pesosNotas, 'Missing pesosNotas');
    assert(typeof sample.notaCorte === 'number', 'notaCorte should be number');
    assert(typeof sample.vagasOfertadas === 'number', 'vagasOfertadas should be number');
  });

  it('should have valid weight values', () => {
    const data = getJoinedData();
    for (const record of data.slice(0, 100)) { // Sample first 100
      const p = record.pesosNotas;
      const totalWeight = p.pesoRedacao + p.pesoLinguagens + p.pesoMatematica +
                          p.pesoCienciasHumanas + p.pesoCienciasNatureza;
      assert(totalWeight >= 0, `Invalid total weight: ${totalWeight}`);
    }
  });
});
