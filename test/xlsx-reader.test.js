/**
 * Test suite for xlsx-reader.js
 * Uses Node.js native test runner (node:test)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import {
  validateFilePath,
  readWorkbook,
  listSheets,
  getSheetContent,
  getSheetInfo,
  FileError
} from '../xlsx-reader.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VALID_XLSX = join(__dirname, '..', 'portal-sisu-2026-vagas-ofertadas.xlsx');

// ============================================
// Input Validation Tests
// ============================================

describe('validateFilePath', () => {
  it('should accept valid xlsx file path', () => {
    const result = validateFilePath(VALID_XLSX);
    assert.equal(result, VALID_XLSX);
  });

  it('should reject null file path', () => {
    assert.throws(
      () => validateFilePath(null),
      FileError
    );
  });

  it('should reject undefined file path', () => {
    assert.throws(
      () => validateFilePath(undefined),
      (err) => {
        assert(err instanceof FileError);
        assert(err.message.includes('required'));
        return true;
      }
    );
  });

  it('should reject non-string file path', () => {
    assert.throws(
      () => validateFilePath(123),
      (err) => {
        assert(err instanceof FileError);
        assert(err.message.includes('string'));
        return true;
      }
    );
  });

  it('should reject empty string', () => {
    assert.throws(
      () => validateFilePath(''),
      (err) => {
        assert(err instanceof FileError);
        assert(err.message.includes('empty'));
        return true;
      }
    );
    assert.throws(
      () => validateFilePath('   '),
      FileError
    );
  });

  it('should reject non-xlsx files', () => {
    assert.throws(
      () => validateFilePath('file.txt'),
      (err) => {
        assert(err instanceof FileError);
        assert(err.message.includes('extension'));
        return true;
      }
    );
    assert.throws(
      () => validateFilePath('file.csv'),
      FileError
    );
  });

  it('should accept .xls extension', () => {
    // Will fail on "file not found", not on extension
    assert.throws(
      () => validateFilePath('nonexistent.xls'),
      (err) => {
        assert(err instanceof FileError);
        assert(err.message.includes('not found'));
        return true;
      }
    );
  });

  it('should reject non-existent file', () => {
    assert.throws(
      () => validateFilePath('nonexistent-file.xlsx'),
      (err) => {
        assert(err instanceof FileError);
        assert(err.message.includes('not found'));
        assert.equal(err.filePath, 'nonexistent-file.xlsx');
        return true;
      }
    );
  });

  it('should be case-insensitive for extensions', () => {
    // .XLSX should be accepted (will fail on file not found if path is wrong)
    assert.throws(
      () => validateFilePath('file.XLSX'),
      (err) => err.message.includes('not found')
    );
  });
});

// ============================================
// File Reading Tests
// ============================================

describe('readWorkbook', () => {
  it('should read valid xlsx file', () => {
    const workbook = readWorkbook(VALID_XLSX);
    assert(workbook);
    assert(Array.isArray(workbook.SheetNames));
    assert(workbook.SheetNames.length > 0);
  });

  it('should throw FileError for invalid path', () => {
    assert.throws(
      () => readWorkbook('nonexistent.xlsx'),
      FileError
    );
  });

  it('should throw FileError for null path', () => {
    assert.throws(
      () => readWorkbook(null),
      FileError
    );
  });
});

describe('listSheets', () => {
  it('should return array of sheet names', () => {
    const sheets = listSheets(VALID_XLSX);
    assert(Array.isArray(sheets));
    assert(sheets.length > 0);
    assert(sheets.every(s => typeof s === 'string'));
  });
});

describe('getSheetContent', () => {
  it('should return array of objects', () => {
    const content = getSheetContent(VALID_XLSX, 0);
    assert(Array.isArray(content));
    assert(content.length > 0);
    assert(typeof content[0] === 'object');
  });

  it('should accept sheet index', () => {
    const content = getSheetContent(VALID_XLSX, 0);
    assert(Array.isArray(content));
  });

  it('should accept sheet name', () => {
    const sheets = listSheets(VALID_XLSX);
    const content = getSheetContent(VALID_XLSX, sheets[0]);
    assert(Array.isArray(content));
  });

  it('should throw error for invalid sheet index', () => {
    assert.throws(
      () => getSheetContent(VALID_XLSX, 999),
      (err) => err.message.includes('not found')
    );
  });

  it('should throw error for invalid sheet name', () => {
    assert.throws(
      () => getSheetContent(VALID_XLSX, 'NonExistentSheet'),
      (err) => err.message.includes('not found')
    );
  });
});

describe('getSheetInfo', () => {
  it('should return sheet metadata', () => {
    const info = getSheetInfo(VALID_XLSX, 0);
    assert(typeof info === 'object');
    assert(typeof info.name === 'string');
    assert(typeof info.rowCount === 'number');
    assert(typeof info.columnCount === 'number');
    assert(info.rowCount > 0);
    assert(info.columnCount > 0);
  });

  it('should have valid range info', () => {
    const info = getSheetInfo(VALID_XLSX, 0);
    assert(info.range);
    assert(typeof info.startRow === 'number');
    assert(typeof info.endRow === 'number');
    assert(typeof info.startColumn === 'string');
    assert(typeof info.endColumn === 'string');
  });
});

// ============================================
// Data Integrity Tests
// ============================================

describe('SISU Data Integrity', () => {
  // Note: Sheet 0 is the data dictionary, Sheet 1 is the actual data
  it('should have expected columns in vagas file (sheet 1)', () => {
    const content = getSheetContent(VALID_XLSX, 1);
    const firstRow = content[0];
    const expectedColumns = [
      'CO_IES', 'NO_IES', 'SG_IES',
      'NO_CURSO', 'DS_GRAU', 'DS_TURNO',
      'PESO_REDACAO', 'PESO_LINGUAGENS', 'PESO_MATEMATICA',
      'PESO_CIENCIAS_HUMANAS', 'PESO_CIENCIAS_NATUREZA'
    ];

    for (const col of expectedColumns) {
      assert(col in firstRow, `Missing expected column: ${col}`);
    }
  });

  it('should have numeric weight values', () => {
    const content = getSheetContent(VALID_XLSX, 1);
    const sample = content.slice(0, 100);

    for (const row of sample) {
      const weights = [
        row.PESO_REDACAO,
        row.PESO_LINGUAGENS,
        row.PESO_MATEMATICA,
        row.PESO_CIENCIAS_HUMANAS,
        row.PESO_CIENCIAS_NATUREZA
      ];

      for (const w of weights) {
        if (w !== undefined && w !== null && w !== '') {
          const num = Number(w);
          assert(!isNaN(num), `Weight should be numeric: ${w}`);
          assert(num >= 0, `Weight should be non-negative: ${num}`);
        }
      }
    }
  });
});
