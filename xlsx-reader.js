import * as XLSX from 'xlsx';
import { readFileSync, existsSync } from 'fs';

// ============ INPUT VALIDATION ============

/**
 * Custom error class for file-related errors
 */
export class FileError extends Error {
  constructor(message, filePath = null) {
    super(message);
    this.name = 'FileError';
    this.filePath = filePath;
  }
}

/**
 * Validates that a file path is valid and the file exists
 * @param {any} filePath - File path to validate
 * @param {string[]} [allowedExtensions=['.xlsx', '.xls']] - Allowed file extensions
 * @returns {string} Validated file path
 * @throws {FileError} If validation fails
 */
export function validateFilePath(filePath, allowedExtensions = ['.xlsx', '.xls']) {
  if (filePath === undefined || filePath === null) {
    throw new FileError('File path is required');
  }
  if (typeof filePath !== 'string') {
    throw new FileError(`File path must be a string, got: ${typeof filePath}`);
  }
  if (filePath.trim() === '') {
    throw new FileError('File path cannot be empty');
  }

  // Check extension
  const lowerPath = filePath.toLowerCase();
  const hasValidExtension = allowedExtensions.some(ext => lowerPath.endsWith(ext.toLowerCase()));
  if (!hasValidExtension) {
    throw new FileError(`File must have one of these extensions: ${allowedExtensions.join(', ')}. Got: ${filePath}`, filePath);
  }

  // Check if file exists
  if (!existsSync(filePath)) {
    throw new FileError(`File not found: ${filePath}`, filePath);
  }

  return filePath;
}

/**
 * Reads an xlsx file and returns the workbook object
 * @param {string} filePath - Path to the .xlsx file
 * @returns {XLSX.WorkBook} The workbook object
 * @throws {FileError} If file path is invalid or file cannot be read
 */
export function readWorkbook(filePath) {
  const validPath = validateFilePath(filePath);
  try {
    const buffer = readFileSync(validPath);
    return XLSX.read(buffer, { type: 'buffer' });
  } catch (error) {
    if (error instanceof FileError) throw error;
    throw new FileError(`Failed to read xlsx file: ${error.message}`, filePath);
  }
}

/**
 * Lists all sheet names in an xlsx file
 * @param {string} filePath - Path to the .xlsx file
 * @returns {string[]} Array of sheet names
 */
export function listSheets(filePath) {
  const workbook = readWorkbook(filePath);
  return workbook.SheetNames;
}

/**
 * Gets the content of a specific sheet as an array of objects
 * @param {string} filePath - Path to the .xlsx file
 * @param {string|number} sheet - Sheet name or index (0-based)
 * @param {object} options - Options for parsing
 * @param {boolean} options.header - Use first row as header (default: true)
 * @param {boolean} options.raw - Return raw values without formatting (default: false)
 * @returns {object[]} Array of row objects
 */
export function getSheetContent(filePath, sheet = 0, options = {}) {
  const { header = true, raw = false } = options;
  const workbook = readWorkbook(filePath);

  let sheetName;
  if (typeof sheet === 'number') {
    sheetName = workbook.SheetNames[sheet];
    if (!sheetName) {
      throw new Error(`Sheet index ${sheet} not found. Available sheets: ${workbook.SheetNames.join(', ')}`);
    }
  } else {
    sheetName = sheet;
    if (!workbook.SheetNames.includes(sheetName)) {
      throw new Error(`Sheet "${sheetName}" not found. Available sheets: ${workbook.SheetNames.join(', ')}`);
    }
  }

  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet, {
    header: header ? undefined : 1,
    raw
  });
}

/**
 * Gets content from all sheets in the file
 * @param {string} filePath - Path to the .xlsx file
 * @param {object} options - Options for parsing
 * @param {boolean} options.header - Use first row as header (default: true)
 * @param {boolean} options.raw - Return raw values without formatting (default: false)
 * @returns {object} Object with sheet names as keys and arrays of row objects as values
 */
export function getAllSheetsContent(filePath, options = {}) {
  const workbook = readWorkbook(filePath);
  const result = {};

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    result[sheetName] = XLSX.utils.sheet_to_json(worksheet, {
      header: options.header === false ? 1 : undefined,
      raw: options.raw || false
    });
  }

  return result;
}

/**
 * Gets sheet content as a 2D array (rows and columns)
 * @param {string} filePath - Path to the .xlsx file
 * @param {string|number} sheet - Sheet name or index (0-based)
 * @returns {any[][]} 2D array of cell values
 */
export function getSheetAsArray(filePath, sheet = 0) {
  const workbook = readWorkbook(filePath);

  let sheetName;
  if (typeof sheet === 'number') {
    sheetName = workbook.SheetNames[sheet];
  } else {
    sheetName = sheet;
  }

  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
}

/**
 * Gets metadata about a sheet (dimensions, row count, column count)
 * @param {string} filePath - Path to the .xlsx file
 * @param {string|number} sheet - Sheet name or index (0-based)
 * @returns {object} Sheet metadata
 */
export function getSheetInfo(filePath, sheet = 0) {
  const workbook = readWorkbook(filePath);

  let sheetName;
  if (typeof sheet === 'number') {
    sheetName = workbook.SheetNames[sheet];
  } else {
    sheetName = sheet;
  }

  const worksheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

  return {
    name: sheetName,
    range: worksheet['!ref'],
    rowCount: range.e.r - range.s.r + 1,
    columnCount: range.e.c - range.s.c + 1,
    startRow: range.s.r + 1,
    endRow: range.e.r + 1,
    startColumn: XLSX.utils.encode_col(range.s.c),
    endColumn: XLSX.utils.encode_col(range.e.c)
  };
}

/**
 * Lists all xlsx files in the current directory
 * @param {string} directory - Directory path (default: current directory)
 * @returns {Promise<string[]>} Array of xlsx file paths
 */
export async function listXlsxFiles(directory = '.') {
  const { readdir } = await import('fs/promises');
  const { join } = await import('path');

  const files = await readdir(directory);
  return files
    .filter(file => file.toLowerCase().endsWith('.xlsx'))
    .map(file => join(directory, file));
}
