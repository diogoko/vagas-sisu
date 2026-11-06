# SISU Vacancy Search - Validation Plan

## Executive Summary

This document presents a comprehensive validation plan to ensure the correctness of the SISU Vacancy Search system before public advertisement. The plan addresses all critical calculation paths, data integrity issues, and potential edge cases that could produce incorrect results.

**Status:** Ready for discussion and implementation prioritization.

---

## 1. Critical Validation Areas

### 1.1 Weighted Average Calculation (HIGHEST PRIORITY)

**Current Implementation** (`sisu-search.js`, lines 59-78):
```javascript
notaPonderada = (
  redacao * pesoRedacao +
  linguagens * pesoLinguagens +
  matematica * pesoMatematica +
  cienciasHumanas * pesoCienciasHumanas +
  cienciasNatureza * pesoCienciasNatureza
) / totalPeso
```

**Concerns:**
1. **No official SISU formula documentation found** in the codebase
2. Implementation assumes a simple weighted average
3. Need to verify this matches SISU's actual formula

**Validation Tasks:**

- [ ] **Task 1.1.1: Obtain Official Formula**
  - Search SISU official portal documentation for calculation methodology
  - Reference: https://sisu.mec.gov.br/ and MEC regulations
  - Document the exact formula used by SISU system
  - Compare with current implementation

- [ ] **Task 1.1.2: Manual Calculation Cross-Check**
  - Select 10 diverse vacancies (different institutions, different weight patterns)
  - Manually calculate weighted scores using known ENEM scores
  - Compare manual results with system output
  - Document any discrepancies

- [ ] **Task 1.1.3: Edge Case Testing**
  - Test with all weights equal (should equal simple average)
  - Test with one weight = 0 (should ignore that component)
  - Test with extreme weight ratios (e.g., 5:1:1:1:1)
  - Test with minimum valid scores (avoid division by zero)
  - Test with maximum scores (1000 in all components)

- [ ] **Task 1.1.4: Precision and Rounding**
  - Verify rounding is applied consistently (currently: 2 decimal places)
  - Check if SISU uses different rounding rules
  - Test boundary cases where rounding could affect ranking

**Risk Level:** 🔴 **CRITICAL** - Core calculation affects all results

---

### 1.2 Minimum Score Validation

**Current Implementation** (`sisu-search.js`, lines 86-107):

**Concerns:**
1. Simple score >= minimum check per component
2. Simple arithmetic average for `mediaMinimaEnem` (line 96-98)
3. Need to verify if SISU uses weighted average for minimum check

**Validation Tasks:**

- [ ] **Task 1.2.1: Verify Minimum Score Logic**
  - Confirm that SISU uses individual component minimums (per subject)
  - Verify if `mediaMinimaEnem` should be simple or weighted average
  - Check official SISU documentation for minimum score rules

- [ ] **Task 1.2.2: Test Minimum Score Edge Cases**
  - Student exactly at minimum (should pass)
  - Student 0.01 below minimum (should fail)
  - Student fails only one minimum (should be rejected)
  - Student passes all minimums but fails average minimum
  - Vacancies with no minimums specified (all zeros)

- [ ] **Task 1.2.3: Cross-Reference with Source Data**
  - Select 20 vacancies with minimum score requirements
  - Verify minimum values are correctly parsed from xlsx
  - Check for any missing or zero values that should be populated

**Risk Level:** 🟠 **HIGH** - Incorrect rejection/acceptance of candidates

---

### 1.3 Data Join Integrity

**Current Implementation** (`sisu-search.js`, lines 149-187):

Join key: `instituicao.codigo | curso.codigo | modalidade.tipoConcorrencia.trim() | curso.turno`

**Known Data Points:**
- Total joined records: 58,203
- Records without cut-off score: 20,230 (34.8%)
- Records with zero weights: 0 (good)

**Concerns:**
1. 34.8% of vacancies have no cut-off score (no applicants last year?)
2. Join might miss some records if keys don't match exactly
3. Whitespace handling with `.trim()` - is it sufficient?

**Validation Tasks:**

- [ ] **Task 1.3.1: Join Completeness Audit**
  - Count total records in `vagas` file
  - Count total records in `inscricoes` file
  - Compare with joined output (should equal vagas count)
  - Identify any vagas without matching inscricoes
  - Analyze if unmatched records are expected (new courses?)

- [ ] **Task 1.3.2: Join Key Uniqueness**
  - Verify join key uniqueness in both files
  - Check for duplicate keys that could cause incorrect matching
  - Test case-sensitivity issues
  - Test for extra whitespace or special characters

- [ ] **Task 1.3.3: Missing Cut-Off Scores Investigation**
  - Analyze the 20,230 records without cut-off scores
  - Determine if these are legitimately new offerings (no history)
  - Verify system correctly handles them (excluded by default)
  - Document expected behavior for users

- [ ] **Task 1.3.4: Data Consistency Between Files**
  - For matched records, verify institution names match
  - Verify course names match
  - Check for discrepancies in metadata (campus, shift, etc.)
  - Document any known inconsistencies from source data

**Risk Level:** 🟠 **HIGH** - Could show wrong cut-off scores or miss vacancies

---

### 1.4 Filter Logic Correctness

**Current Implementation** (`sisu-search.js`, lines 217-267):

**Concerns:**
1. Modality filtering uses exact match vs. partial match for `tiposConcorrencia`
2. Text filters use partial, case-insensitive matching
3. Could produce unexpected results with certain search terms

**Validation Tasks:**

- [ ] **Task 1.4.1: Modality Filter Testing**
  - Test all modality values: 'A', 'L', 'V', 'B'
  - Test tiposConcorrencia partial matching (line 263-264)
  - Verify filter combinations work correctly
  - Document the full list of valid tipoConcorrencia values

- [ ] **Task 1.4.2: Course Name Matching**
  - Test accent-insensitive search ("historia" matches "História")
  - Test partial matching ("eng" matches "Engenharia Civil")
  - Test multiple course filters (OR logic)
  - Verify all Portuguese special characters work

- [ ] **Task 1.4.3: Institution Matching**
  - Test matching by abbreviation (e.g., "USP")
  - Test matching by full name
  - Test matching by partial name
  - Verify both sigla and nome are checked

- [ ] **Task 1.4.4: UF (State) Filter**
  - Test all 27 Brazilian states
  - Verify exact match requirement (case-insensitive)
  - Test invalid UF codes (should return empty)

**Risk Level:** 🟡 **MEDIUM** - Could miss or incorrectly include vacancies

---

### 1.5 Margin and Chance Calculation

**Current Implementation** (`sisu-search.js`, lines 280-292, 117-142):

**Concerns:**
1. Margin calculation depends on accurate weighted score
2. Percentage calculation: `(margin / notaCorte) * 100`
3. Chance summary thresholds are arbitrary (10%, 5%, 2%, 0%, -2%, -5%)

**Validation Tasks:**

- [ ] **Task 1.5.1: Margin Calculation Verification**
  - Test with score exactly at cut-off (margin = 0, 0%)
  - Test with score above cut-off (positive margin)
  - Test with score below cut-off (negative margin)
  - Verify percentage calculation accuracy
  - Test boundary values (very small margins)

- [ ] **Task 1.5.2: Chance Summary Calibration**
  - Analyze historical data to validate thresholds
  - Check if 10% margin really means "Muito alta" chance
  - Consider competition ratio in chance assessment (implemented)
  - Document the reasoning behind thresholds

- [ ] **Task 1.5.3: Competition Ratio Accuracy**
  - Verify competition calculation: `inscricoes / vagasOfertadas`
  - Test with zero vacancies (should handle gracefully)
  - Verify how it affects chance summary (line 131-132)
  - Test edge case: more vacancies than applicants

**Risk Level:** 🟡 **MEDIUM** - Affects user expectations and decisions

---

## 2. Data Integrity Validation

### 2.1 Source Data Parsing

**Current Implementation** (`sisu-data.js`, lines 107-233):

**Validation Tasks:**

- [ ] **Task 2.1.1: Field Mapping Audit**
  - Verify all xlsx column names match expectations
  - Check for renamed columns between SISU editions
  - Test with actual 2025 files
  - Document any column name variations handled

- [ ] **Task 2.1.2: Number Parsing Edge Cases**
  - Test parseNumber with: "", null, undefined, "N/A", text values
  - Test comma vs. period decimal separators
  - Verify negative numbers are handled (shouldn't exist)
  - Test very large numbers (no overflow)

- [ ] **Task 2.1.3: String Trimming and Encoding**
  - Verify UTF-8 encoding for Portuguese characters
  - Check for extra whitespace issues
  - Test institution names with special characters
  - Verify empty strings vs. undefined handling

- [ ] **Task 2.1.4: Weight and Minimum Score Extraction**
  - Sample 100 random vacancies
  - Manually verify weights from xlsx match parsed values
  - Check for transposed values (e.g., math weight in humanities field)
  - Verify zeros represent "not required" vs. parsing errors

**Risk Level:** 🟠 **HIGH** - Garbage in, garbage out

---

### 2.2 JSON Export/Import Fidelity

**Current Implementation** (`sisu-data.js`, lines 406-608):

**Validation Tasks:**

- [ ] **Task 2.2.1: Round-Trip Testing**
  - Export xlsx to JSON
  - Load from JSON
  - Compare with direct xlsx load (should be identical)
  - Test with sample queries
  - Verify results match exactly

- [ ] **Task 2.2.2: Data Loss Detection**
  - Check for any fields lost in export
  - Verify nested objects maintain structure
  - Test with special characters
  - Verify number precision maintained

- [ ] **Task 2.2.3: Performance Validation**
  - Measure xlsx load time vs. JSON load time
  - Verify JSON is actually faster
  - Check memory usage with both methods

**Risk Level:** 🟢 **LOW** - Performance optimization, not correctness

---

## 3. Cross-Validation with Official Sources

### 3.1 Historical Results Comparison

**Validation Tasks:**

- [ ] **Task 3.1.1: Collect Known Outcomes**
  - Gather 2024 SISU admission results (if available)
  - Identify students who were accepted at specific cut-off scores
  - Collect at least 50 known admission cases

- [ ] **Task 3.1.2: Simulate Known Cases**
  - Input actual student scores into system
  - Compare system's ranking with actual admission outcome
  - Verify system would have correctly identified acceptance
  - Document any discrepancies

- [ ] **Task 3.1.3: Cut-Off Score Validation**
  - Compare system's displayed cut-off scores with official SISU portal
  - Test at least 100 vacancies across different institutions
  - Verify scores match exactly
  - Document source of truth for cut-off scores

**Risk Level:** 🔴 **CRITICAL** - Real-world validation

---

### 3.2 Official Calculator Comparison

**Validation Tasks:**

- [ ] **Task 3.2.1: Find Official Calculator**
  - Search for official SISU score calculator
  - Check university websites for calculators
  - Identify third-party validated calculators

- [ ] **Task 3.2.2: Compare Calculations**
  - Select 50 vacancies with different weight configurations
  - Calculate weighted scores using both tools
  - Compare results (should match to at least 2 decimal places)
  - Document any systematic differences

- [ ] **Task 3.2.3: Test Edge Cases Against Official**
  - Test minimum score scenarios
  - Test extreme weight configurations
  - Test boundary scores
  - Document expected vs. actual behavior

**Risk Level:** 🔴 **CRITICAL** - Validates core algorithm

---

## 4. Edge Cases and Boundary Conditions

### 4.1 Input Validation Edge Cases

**Validation Tasks:**

- [ ] **Task 4.1.1: Score Boundary Testing**
  - Scores at 0, 1, 999, 1000
  - Scores with decimals (should system accept?)
  - Negative scores (should reject)
  - Scores above 1000 (should reject)
  - Non-numeric inputs

- [ ] **Task 4.1.2: Missing or Incomplete Data**
  - Vacancy with missing weight (handled: returns 0)
  - Vacancy with missing minimum scores
  - Vacancy with missing cut-off score
  - Student with missing scores (how should system behave?)

- [ ] **Task 4.1.3: Filter Combination Edge Cases**
  - All filters empty (should return all)
  - Contradictory filters (should return empty)
  - Very restrictive filters (should handle gracefully)
  - Very permissive filters (should not crash)

**Risk Level:** 🟡 **MEDIUM** - User experience and robustness

---

### 4.2 Numeric Precision Issues

**Validation Tasks:**

- [ ] **Task 4.2.1: Floating Point Precision**
  - Test calculations that could expose floating-point errors
  - Verify margin calculations near zero
  - Test with weights that don't sum to whole numbers
  - Document any known precision limitations

- [ ] **Task 4.2.2: Rounding Consistency**
  - Verify all displayed numbers use same rounding rules
  - Check for different rounding in calculation vs. display
  - Test ranking with very close margins (0.01 difference)

**Risk Level:** 🟢 **LOW** - Unlikely to affect results significantly

---

## 5. Testing Strategy

### 5.1 Automated Test Suite

**Recommendation:** Create comprehensive test files (currently only manual tests exist)

**Test Categories:**

1. **Unit Tests for Core Functions**
   - `calcularNotaPonderada()` - 20+ test cases
   - `verificarNotasMinimas()` - 15+ test cases
   - `joinVagasInscricoes()` - 10+ test cases
   - Filter functions - 30+ test cases

2. **Integration Tests**
   - Full search workflow
   - Data loading and caching
   - Filter combinations

3. **Regression Tests**
   - Known good results from previous runs
   - Prevent breaking changes

**Test Framework Recommendation:**
- Use Node.js built-in `assert` module (no dependencies)
- Or add Vitest for better developer experience

**Implementation:**
```bash
# New test structure
tests/
├── unit/
│   ├── calculator.test.js       # Weighted average tests
│   ├── minimum-scores.test.js   # Minimum validation tests
│   ├── filters.test.js          # Filter logic tests
│   └── data-join.test.js        # Join logic tests
├── integration/
│   ├── search-flow.test.js      # Full search tests
│   └── data-loading.test.js     # Data loading tests
├── fixtures/
│   ├── sample-vagas.json        # Sample data for tests
│   ├── sample-inscricoes.json
│   └── known-results.json       # Expected outputs
└── run-all-tests.js             # Test runner
```

**Risk Level:** 🔴 **CRITICAL** - Foundation for all other validation

---

### 5.2 Manual Validation Protocol

**For Each Critical Update:**

1. **Pre-deployment Checklist**
   - [ ] Run full automated test suite (when implemented)
   - [ ] Manually test 10 diverse search scenarios
   - [ ] Verify top 5 results make logical sense
   - [ ] Check edge cases (no results, all filters, etc.)
   - [ ] Compare with previous version results (regression check)

2. **Sample Test Cases**
   - High-scoring student (800+ average) → should see many "Muito alta"
   - Low-scoring student (500 average) → should see limited options
   - Medicine search → should show very high cut-off scores
   - Specific institution → should only show that institution
   - Multiple state filters → should show union of states

---

## 6. Documentation and Transparency

### 6.1 Formula Documentation

**Create User-Facing Documentation:**

- [ ] **Task 6.1.1: Document Calculation Method**
  - Explain weighted average in plain Portuguese
  - Provide example calculation step-by-step
  - Show how to manually verify a result
  - Link to official SISU documentation

- [ ] **Task 6.1.2: Document Limitations**
  - Explain that system uses previous year's cut-off scores
  - Note that actual admission depends on competition
  - Clarify that results are estimates, not guarantees
  - Explain what happens with new courses (no cut-off)

- [ ] **Task 6.1.3: Create FAQ**
  - "Why does my score differ from the official portal?"
  - "What does 'Chance: Boa' really mean?"
  - "Why don't some vacancies have a cut-off score?"
  - "How accurate are these results?"

**Risk Level:** 🟡 **MEDIUM** - Manages user expectations

---

### 6.2 Data Provenance

**Document Data Sources:**

- [ ] **Task 6.2.1: Record Data Download Details**
  - Exact URL where data was downloaded
  - Date of download
  - SISU edition (currently 2025)
  - File checksums for verification

- [ ] **Task 6.2.2: Version Control for Data**
  - Keep original xlsx files in version control (or note why not)
  - Document any manual corrections applied
  - Track when data is updated

**Risk Level:** 🟢 **LOW** - Transparency and reproducibility

---

## 7. Priority Implementation Order

### Phase 1: Critical Validation (DO FIRST - BEFORE LAUNCH)
1. ✅ Task 1.1.1: Obtain and verify official SISU formula
2. ✅ Task 1.1.2: Manual calculation cross-check (10 cases)
3. ✅ Task 3.2.2: Compare with official calculator (if available)
4. ✅ Task 1.3.1: Verify data join completeness
5. ✅ Task 2.1.1: Verify field mapping from xlsx

### Phase 2: Core Testing (BEFORE LAUNCH)
6. ✅ Task 5.1: Implement automated test suite basics
7. ✅ Task 1.1.3: Edge case testing for calculations
8. ✅ Task 1.2.2: Minimum score edge cases
9. ✅ Task 3.1.3: Cut-off score validation (sample)

### Phase 3: Polish (CAN LAUNCH WITHOUT, BUT DO SOON)
10. ⏳ Task 1.4.1-1.4.4: Comprehensive filter testing
11. ⏳ Task 1.5.2: Chance summary calibration
12. ⏳ Task 6.1: User-facing documentation
13. ⏳ Task 2.2.1: Round-trip export/import testing

### Phase 4: Advanced Validation (POST-LAUNCH REFINEMENT)
14. ⏳ Task 3.1.1-3.1.2: Collect and test historical outcomes
15. ⏳ Task 4.2: Numeric precision analysis
16. ⏳ Task 6.2: Complete data provenance documentation

---

## 8. Known Issues to Investigate

### Issue 1: 34.8% of Vacancies Have No Cut-Off Score
- **Finding:** 20,230 out of 58,203 records have `notaCorte = 0`
- **Possible Causes:**
  - New courses offered for the first time
  - Courses that had no applicants last year
  - Data quality issues
- **Action:** Investigate a sample and document expected behavior
- **Current Handling:** Excluded by default (correct behavior)

### Issue 2: No Official Formula Documentation Found
- **Finding:** No SISU formula reference in codebase
- **Risk:** Implementation might not match official calculation
- **Action:** HIGH PRIORITY - Find and document official formula

### Issue 3: Simple Average for Minimum ENEM Check
- **Finding:** Line 96-98 uses simple arithmetic average for `mediaMinimaEnem`
- **Question:** Should this be weighted average instead?
- **Action:** Verify with SISU documentation

### Issue 4: Join Key Relies on Exact String Matching
- **Finding:** Join uses trimmed strings but no other normalization
- **Risk:** Case sensitivity or encoding issues could cause mismatches
- **Action:** Test with diverse institution/course names

---

## 9. Success Criteria

Before advertising this tool publicly, ensure:

- ✅ **Formula Accuracy:** Verified against official SISU documentation
- ✅ **Test Coverage:** 80%+ code coverage with automated tests
- ✅ **Manual Validation:** 50+ known cases produce expected results
- ✅ **Data Integrity:** Join produces complete, correct results
- ✅ **Edge Cases:** All boundary conditions handled gracefully
- ✅ **Documentation:** Users understand how calculations work and limitations
- ✅ **Performance:** Searches complete in < 3 seconds for typical queries

---

## 10. Ongoing Monitoring

**After Launch:**

1. **User Feedback Collection**
   - Monitor for reports of incorrect results
   - Track most common questions/confusion
   - Identify systematic issues

2. **Periodic Validation**
   - Re-validate when new SISU data is released
   - Check for changes in official calculation methodology
   - Update test suite with new edge cases

3. **Performance Monitoring**
   - Track search response times
   - Monitor for memory issues with large datasets
   - Optimize based on actual usage patterns

---

## Appendix A: Test Data Requirements

### Sample Test Cases Needed

1. **Known Good Results** (collect 50+)
   - Student scores → Expected vacancies where accepted
   - Diverse institutions, courses, modalities
   - Include edge cases (exactly at cut-off, etc.)

2. **Boundary Cases**
   - Minimum possible scores (0 or minimum required)
   - Maximum possible scores (1000)
   - Extreme weight configurations
   - All modality types

3. **Filter Combinations**
   - Single filter scenarios
   - Multiple filters combined
   - Empty filters
   - No results scenarios

---

## Appendix B: Resources for Validation

### Official Sources
- SISU Portal: https://sisu.mec.gov.br/
- MEC Documentation: Check for SISU methodology documents
- Previous SISU editions: Compare calculation methods across years

### Third-Party Validators
- Search for existing SISU calculators
- University admissions offices may have validation data
- Student forums may have reported actual vs. expected results

### Testing Tools
- Sample data generator (create controlled test cases)
- Diff tools for comparing results across versions
- Performance profiling tools

---

## Appendix C: Risk Assessment Summary

| Risk Area | Impact | Likelihood | Priority |
|-----------|--------|------------|----------|
| Incorrect weighted average formula | 🔴 Critical | 🟡 Medium | P0 |
| Data join producing wrong matches | 🔴 Critical | 🟢 Low | P1 |
| Minimum score validation errors | 🟠 High | 🟡 Medium | P1 |
| Filter logic missing vacancies | 🟡 Medium | 🟡 Medium | P2 |
| Margin calculation errors | 🟡 Medium | 🟢 Low | P2 |
| User misunderstanding results | 🟡 Medium | 🟠 High | P2 |
| Data parsing errors | 🟠 High | 🟢 Low | P1 |
| Numeric precision issues | 🟢 Low | 🟢 Low | P3 |

**Priority Legend:**
- P0: Must fix before any launch
- P1: Should fix before public launch
- P2: Can launch with documented limitations
- P3: Post-launch refinement

---

## Next Steps

**Immediate Actions:**
1. Review this plan with team/stakeholders
2. Prioritize which validation tasks to implement first
3. Allocate time for critical validations (Phase 1)
4. Begin searching for official SISU formula documentation
5. Set up automated test framework

**Decision Points:**
- Can we find official SISU calculation documentation?
- Do we have access to validated historical data?
- Is there an official calculator we can use for comparison?
- What is our risk tolerance for launching with current validation?

---

**Document Version:** 1.0
**Created:** 2026-01-20
**Author:** Claude (Code Analysis)
**Status:** Draft for Review
