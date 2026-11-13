import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * Custom hook to safely auto-save and restore form drafts in sessionStorage.
 * Prevents staff from losing partially filled forms if a modal is accidentally closed or tab refreshed.
 *
 * @param {string} formKey - Unique key identifier (e.g. 'draft_tour_create')
 * @param {object} formData - Current form state object
 * @param {function} setFormData - State updater function
 * @param {boolean} isEnabled - Whether draft persistence is active (e.g. only when modal is open)
 */
export const useFormDraft = (formKey, formData, setFormData, isEnabled = true) => {
  const storageKey = `travelops_draft_${formKey}`;
  const debounceTimerRef = useRef(null);

  // Read initial draft status directly in lazy useState initializers (React 19 compliant)
  const [hasSavedDraft, setHasSavedDraft] = useState(() => {
    if (!isEnabled) return false;
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Boolean(parsed?.data && Object.keys(parsed.data).length > 0);
      }
    } catch {
      // Ignore
    }
    return false;
  });

  const [draftSavedAt, setDraftSavedAt] = useState(() => {
    if (!isEnabled) return null;
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.savedAt ? new Date(parsed.savedAt) : null;
      }
    } catch {
      // Ignore
    }
    return null;
  });

  // Debounced auto-save when formData changes
  useEffect(() => {
    if (!isEnabled || !formData) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        // Only save if at least one field has a non-empty value
        const hasValues = Object.values(formData).some(
          (val) => val !== null && val !== undefined && val !== '' && (Array.isArray(val) ? val.length > 0 : true)
        );

        if (hasValues) {
          const payload = {
            data: formData,
            savedAt: new Date().toISOString()
          };
          sessionStorage.setItem(storageKey, JSON.stringify(payload));
          setDraftSavedAt(new Date());
        }
      } catch {
        // Ignore quota or serialization errors
      }
    }, 600);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [formData, isEnabled, storageKey]);

  // Restore draft into form state
  const restoreDraft = useCallback(() => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.data) {
          setFormData((prev) => ({
            ...prev,
            ...parsed.data
          }));
          setHasSavedDraft(false);
          return true;
        }
      }
    } catch {
      // Ignore
    }
    return false;
  }, [storageKey, setFormData]);

  // Clear saved draft from sessionStorage (call upon successful submit or explicit discard)
  const clearDraft = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey);
      setHasSavedDraft(false);
      setDraftSavedAt(null);
    } catch {
      // Ignore
    }
  }, [storageKey]);

  return {
    hasSavedDraft,
    draftSavedAt,
    restoreDraft,
    clearDraft
  };
};

export default useFormDraft;
