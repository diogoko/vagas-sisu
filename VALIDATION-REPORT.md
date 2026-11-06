# SISU Calculation Validation Report

**Date:** 2026-01-20
**Status:** ✅ PASSED

## Executive Summary

All validation tests passed. The SISU vacancy search system produces correct results according to official SISU methodology and verified against external data sources.

---

## 1. Formula Verification ✅

### Official SISU Formula (Confirmed)
```
Média Ponderada = (Σ nota × peso) / (Σ pesos)
```

Where:
- `nota` = ENEM score for each component (Redação, Linguagens, Matemática, Ciências Humanas, Ciências da Natureza)
- `peso` = Weight assigned by the institution for each component

### Our Implementation (sisu-search.js:59-78)
```javascript
const notaPonderada =
  (scores.redacao * pesos.pesoRedacao +
    scores.linguagens * pesos.pesoLinguagens +
    scores.matematica * pesos.pesoMatematica +
    scores.cienciasHumanas * pesos.pesoCienciasHumanas +
    scores.cienciasNatureza * pesos.pesoCienciasNatureza) /
  totalPeso;
```

**Result:** ✅ Formula matches official SISU methodology

### Sources Confirming Formula:
- [Quero Bolsa - Média Ponderada](https://querobolsa.com.br/revista/media-ponderada-do-enem-veja-como-calcular-sua-nota-final)
- [Calculadora Brasil](https://calculadorabrasil.com.br/enem-sisu/)
- [MEC Official Explanation](https://www.gov.br/mec/pt-br/assuntos/noticias/2025/janeiro/sisu-entenda-como-funciona-o-sistema-de-selecao)

---

## 2. Manual Calculation Tests ✅

| Test Case | Expected | Calculated | Status |
|-----------|----------|------------|--------|
| Equal weights (1,1,1,1,1) | 600.00 | 600.00 | ✅ |
| Engineering weights (1,1,3,1,2) | 631.25 | 631.25 | ✅ |
| Humanities weights (3,2,1,2,1) | 583.33 | 583.33 | ✅ |
| High single weight (10,1,1,1,1) | 600.00 | 600.00 | ✅ |
| Zero weights edge case | 0 | 0 | ✅ |

**Result:** 5/5 manual calculations passed

---

## 3. Real Data Verification ✅

Tested weighted average calculation against real vacancies from different course types:

| Course Type | Institution | Manual Calc | Function | Status |
|-------------|-------------|-------------|----------|--------|
| Medicina | IFAP | 634.29 | 634.29 | ✅ |
| Direito | UFS | 664.50 | 664.50 | ✅ |
| Engenharia | UFRA | 661.67 | 661.67 | ✅ |
| Letras | UFS | 670.00 | 670.00 | ✅ |
| Equal Weights | IF SUL DE MINAS | 650.00 | 650.00 | ✅ |

**Result:** 5/5 real data verifications passed

---

## 4. External Data Cross-Validation ✅

Compared our cut-off scores against published SISU 2025 results from [VestibulandoWeb](https://www.vestibulandoweb.com.br/):

### UFRJ (10 courses tested)
| Course | External | Our Data | Status |
|--------|----------|----------|--------|
| Medicina | 823.79 | 823.79 | ✅ EXACT |
| Eng. Computação e Informação | 807.50 | 807.50 | ✅ EXACT |
| Ciências Econômicas (Int) | 796.28 | 796.28 | ✅ EXACT |
| Odontologia | 793.28 | 793.28 | ✅ EXACT |
| Ciências Econômicas (Not) | 788.23 | 788.23 | ✅ EXACT |
| Engenharia Química | 779.29 | 779.29 | ✅ EXACT |
| Direito | 777.29 | 777.29 | ✅ EXACT |
| Psicologia | 770.43 | 770.43 | ✅ EXACT |
| Engenharia Mecânica | 768.03 | 768.03 | ✅ EXACT |
| Letras - Português e Árabe | 591.51 | 591.51 | ✅ EXACT |

### UFC (8 courses tested)
| Course | External | Our Data | Status |
|--------|----------|----------|--------|
| Medicina (Fortaleza) | 804.14 | 804.14 | ✅ EXACT |
| Medicina (Sobral) | 798.96 | 798.96 | ✅ EXACT |
| Direito (Integral) | 774.00 | 774.00 | ✅ EXACT |
| Direito (Noturno) | 769.06 | 769.06 | ✅ EXACT |
| Psicologia (Fortaleza) | 744.36 | 744.36 | ✅ EXACT |
| Psicologia (Sobral) | 722.46 | 722.46 | ✅ EXACT |
| Engenharia Civil | 707.28 | 707.28 | ✅ EXACT |
| Ciência da Computação | 765.82 | 765.82 | ✅ EXACT |

**Result:** 18/18 external validations passed (100% accuracy)

---

## 5. Data Quality Analysis ✅

### Dataset Statistics
- Total vacancies: 58,203
- Total institutions: 124
- Unique weight patterns: 587
- Records with valid weights: 100%
- Records with cut-off scores: 65.2%
- Records without cut-off: 34.8% (expected for new courses/modalities)

### Cut-off Score Distribution
- Minimum: 155.00 (some low-demand courses)
- Maximum: 856.44 (Medicina UNILAB with bonus)
- Average: 590.36
- Top courses are Medicina (as expected)

### Weight Patterns
- Most common: Equal weights (1,1,1,1,1) - 22,505 vacancies (38.7%)
- 587 unique weight combinations used by institutions

---

## 6. Minimum Score Validation ✅

- 100% of vacancies have minimum score requirements defined
- System correctly validates scores against minimums
- Uses simple arithmetic average for `mediaMinimaEnem` check (standard practice)

---

## 7. Known Limitations

1. **New courses without historical data**: ~35% of vacancies have no cut-off score (new courses or no applicants in 2024)
2. **Bonus modality**: Some courses show higher cut-offs due to institutional bonus programs
3. **Campus disambiguation**: Some institutions have multiple campuses offering the same course with different cut-offs

---

## Validation Scripts

Run these scripts to reproduce validation:

```bash
# Full calculation test suite
node validation-tests.js

# External data comparison
node validation-compare-external.js

# Data quality report
node validation-external.js
```

---

## Conclusion

✅ **The SISU vacancy search system is ready for public use.**

- Formula: Verified against official SISU methodology
- Calculations: 100% accurate in all test cases
- Data: 100% match with external sources (VestibulandoWeb)
- Quality: All records have valid weights, expected distribution of cut-off scores

The system correctly implements the official SISU weighted average formula and contains accurate cut-off score data from the 2025 edition.

---

## References

1. [MEC - SISU Official Portal](https://sisu.mec.gov.br/)
2. [Portaria nº 2.027/2023](https://sisu.mec.gov.br/static/pdf/PORTARIA%20Nº%202.027,%20DE%2016%20DE%20NOVEMBRO%20DE%202023.pdf)
3. [VestibulandoWeb - SISU 2025 Results](https://www.vestibulandoweb.com.br/sisu/)
4. [Conexão UFRJ - SISU 2025](https://conexao.ufrj.br/2025/02/notas-de-corte-da-ufrj-no-sisu-2025-destacam-pluralidade-de-areas-e-diversidade-de-interesses/)
5. [UFC SISU Portal](https://sisu.ufc.br/)
