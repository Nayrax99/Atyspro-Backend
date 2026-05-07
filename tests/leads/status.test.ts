import { describe, it, expect } from 'vitest';
import { determineLeadStatus } from '@/domain/leads/status';

describe('determineLeadStatus', () => {
  /**
   * Test 1: lead complet avec type, délai et tous les localisateurs
   * → doit retourner "a_traiter"
   */
  it('lead complet → a_traiter', () => {
    const result = determineLeadStatus(1, 2, '11 rue Chanzi', 'Mathieu');
    expect(result).toBe('a_traiter');
  });

  /**
   * Test 2: lead complet avec type, délai et seulement adresse
   * → doit retourner "a_traiter"
   */
  it('lead complet avec seulement adresse → a_traiter', () => {
    const result = determineLeadStatus(1, 2, '11 rue Chanzi', null);
    expect(result).toBe('a_traiter');
  });

  /**
   * Test 3: lead complet avec type, délai et seulement nom
   * → doit retourner "a_traiter"
   */
  it('lead complet avec seulement nom → a_traiter', () => {
    const result = determineLeadStatus(1, 2, null, 'Mathieu');
    expect(result).toBe('a_traiter');
  });

  /**
   * Test 4: type présent (1) mais pas délai (null)
   * → doit retourner "incomplet" (au moins un parmi type/délai)
   */
  it('type présent mais pas délai → incomplet', () => {
    const result = determineLeadStatus(1, null, 'addr', 'name');
    expect(result).toBe('incomplet');
  });

  /**
   * Test 5: délai présent (2) mais pas type (null)
   * → doit retourner "incomplet"
   */
  it('délai présent mais pas type → incomplet', () => {
    const result = determineLeadStatus(null, 2, 'addr', 'name');
    expect(result).toBe('incomplet');
  });

  /**
   * Test 6: ni type ni délai (tous null)
   * → doit retourner "a_traiter" (fallback, aucune info structurée)
   */
  it('ni type ni délai → a_traiter (fallback)', () => {
    const result = determineLeadStatus(null, null, 'addr', 'name');
    expect(result).toBe('a_traiter');
  });

  /**
   * Test 7: type + délai présents mais pas de localisateur (adresse et nom tous null)
   * → doit retourner "incomplet" (manque le localisateur)
   */
  it('type + délai mais sans localisateur → incomplet', () => {
    const result = determineLeadStatus(1, 2, null, null);
    expect(result).toBe('incomplet');
  });

  /**
   * Test 8: aucune information fournie
   * → doit retourner "a_traiter" (fallback)
   */
  it('aucune info → a_traiter', () => {
    const result = determineLeadStatus(null, null, null, null);
    expect(result).toBe('a_traiter');
  });

  /**
   * Test 9: type_code=0 (falsy en JS) avec délai=2 et localisateurs
   * → doit retourner "incomplet" (0 est falsy, donc `type_code && delay_code` échoue,
   *   mais `type_code || delay_code` = 2 → vrai)
   */
  it('type_code=0 is falsy → incomplet with delay', () => {
    const result = determineLeadStatus(0, 2, 'addr', 'name');
    expect(result).toBe('incomplet');
  });
});
