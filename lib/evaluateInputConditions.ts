// lib/evaluateInputConditions.ts

import type { PageInputConfig, InputCondition, InputConditionType } from '@/shared/store/useAppStore';

// Returns a JSON-serialisable config object for one page's input conditions
// This is embedded verbatim into the runtime script as a JS object literal
export function serializeConditionsForRuntime(
  pageId: string,
  inputConditions: PageInputConfig[]
): Record<string, InputCondition[]> {
  const pageConfig = inputConditions.find((c) => c.pageId === pageId);
  if (!pageConfig) return {};

  // Group by fieldId
  const grouped: Record<string, InputCondition[]> = {};
  pageConfig.conditions.forEach((cond) => {
    if (!cond.enabled) return;
    if (!grouped[cond.fieldId]) grouped[cond.fieldId] = [];
    grouped[cond.fieldId].push(cond);
  });

  return grouped;
}

// The runtime evaluator code as a string
// This is injected into every page's iframe as a <script> block
// It reads window.__INPUT_CONDITIONS__ and overrides the widget's behaviour
export const INPUT_CONDITION_RUNTIME = `
(function() {
  var CONDITIONS = window.__INPUT_CONDITIONS__ || {};
  var BINS = window.__BINS__ || {};

  function getFieldConditions(fieldId) {
    return CONDITIONS[fieldId] || [];
  }

  function evaluateConditions(fieldId, rawValue, allValues) {
    var conds = getFieldConditions(fieldId);
    for (var i = 0; i < conds.length; i++) {
      var c = conds[i];
      var result = evaluateOne(c, rawValue, allValues);
      if (!result.pass) return result;
    }
    return { pass: true, message: '' };
  }

  function evaluateOne(cond, rawValue, allValues) {
    var len = rawValue.length;
    switch (cond.conditionType) {
      case 'min_length':
        return len >= Number(cond.value)
          ? { pass: true }
          : { pass: false, message: cond.errorMessage || 'Too short' };

      case 'max_length':
        return len <= Number(cond.value)
          ? { pass: true }
          : { pass: false, message: cond.errorMessage || 'Too long' };

      case 'exact_length': {
        var allowed = String(cond.value).split(',').map(function(s) { return parseInt(s.trim(), 10); });
        return allowed.indexOf(len) !== -1
          ? { pass: true }
          : { pass: false, message: cond.errorMessage || ('Must be ' + allowed.join(' or ') + ' digits') };
      }

      case 'allowed_chars': {
        var pattern = new RegExp('^[' + cond.value + ']*$');
        return pattern.test(rawValue)
          ? { pass: true }
          : { pass: false, message: cond.errorMessage || 'Invalid characters' };
      }

      case 'input_type': {
        if (cond.value === 'any') return { pass: true };
        var expectedLen = cond.value === 'phone' ? 12 : 16;
        return len === expectedLen
          ? { pass: true }
          : { pass: false, message: cond.errorMessage || ('Must be a ' + cond.value + ' number') };
      }

      case 'require_bin_match': {
        if (len < 16) return { pass: true }; // only check on 16-digit input
        var bin = rawValue.slice(0, 6);
        return BINS[bin]
          ? { pass: true }
          : { pass: false, message: cond.errorMessage || 'Card provider not recognised' };
      }

      case 'require_confirmation': {
        var primaryValue = allValues['primary'] || '';
        return rawValue === primaryValue
          ? { pass: true }
          : { pass: false, message: cond.errorMessage || 'Numbers do not match' };
      }

      case 'mask_after_n_chars': {
        // This condition type is handled by the display logic, not by validation
        return { pass: true };
      }

      default:
        return { pass: true };
    }
  }

  // Expose globally so the widget can call it
  window.__evaluateInputConditions__ = evaluateConditions;
  window.__getFieldConditions__ = getFieldConditions;

  // Override widget behaviour after it initialises
  // Poll until the widget root exists in the DOM
  function patchWidget() {
    var roots = document.querySelectorAll('[data-widget="number-input-widget"]');
    if (!roots.length) {
      setTimeout(patchWidget, 100);
      return;
    }

    roots.forEach(function(root) {
      var primaryInput = root.querySelector('#niw-primary');
      var confirmInput = root.querySelector('#niw-confirm');
      var hintPrimary  = root.querySelector('#niw-hint-primary');
      var hintConfirm  = root.querySelector('#niw-hint-confirm');
      var submitBtn    = root.querySelector('#niw-submit');
      if (!primaryInput || !submitBtn) return;

      // Find the mask_after_n_chars condition for the primary field
      var maskCond = getFieldConditions('niw-primary').find(function(c) {
        return c.conditionType === 'mask_after_n_chars';
      });
      var maskAfter = maskCond ? Number(maskCond.value) : 6;

      // Store the mask value on the widget root so the widget JS can read it
      root.setAttribute('data-mask-after', String(maskAfter));

      // Hook into the submit button's click
      // The widget's own script enables/disables the button based on hardcoded logic
      // We add an additional validation layer here that re-checks against our conditions
      submitBtn.addEventListener('click', function(e) {
        var rawValue = primaryInput.getAttribute('data-raw') || '';
        var confirmRaw = confirmInput ? confirmInput.value.replace(/[^0-9]/g, '') : '';

        var primaryResult = evaluateConditions('niw-primary', rawValue, { primary: rawValue });
        if (!primaryResult.pass) {
          e.stopImmediatePropagation();
          if (hintPrimary) {
            hintPrimary.textContent = primaryResult.message;
            hintPrimary.className = 'niw-hint niw-hint-error';
          }
          return;
        }

        if (confirmInput) {
          var confirmResult = evaluateConditions('niw-confirm', confirmRaw, { primary: rawValue });
          if (!confirmResult.pass) {
            e.stopImmediatePropagation();
            if (hintConfirm) {
              hintConfirm.textContent = confirmResult.message;
              hintConfirm.className = 'niw-hint niw-hint-error';
            }
            return;
          }
        }

        // All conditions pass — annotate the button with the determined type
        var len = rawValue.length;
        var detectedType = len === 12 ? 'phone' : len === 16 ? 'card' : 'unknown';
        var bin = rawValue.slice(0, 6);
        var detectedBank = BINS[bin] || '';
        submitBtn.setAttribute('data-resolved-type', detectedType);
        submitBtn.setAttribute('data-resolved-bank', detectedBank);
        submitBtn.setAttribute('data-resolved-value', rawValue);
      }, true); // capture phase so we run before the runtime navigation handler
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', patchWidget);
  } else {
    patchWidget();
  }
})();
`;
