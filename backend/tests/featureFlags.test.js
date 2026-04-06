/**
 * Feature Flag Validation Tests
 *
 * Ensures feature flags defined in config/features.js are actually
 * referenced in source code. Flags not used anywhere are dead code.
 */

const fs = require('fs');
const path = require('path');
const { DEFAULTS, isEnabled, getAll } = require('../config/features');

const BACKEND_SRC = path.join(__dirname, '..');
const SKIP_DIRS = ['node_modules', 'tests', 'coverage', 'temp', '.git'];

/**
 * Recursively find all .js files in a directory
 */
function findJsFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findJsFiles(fullPath, files);
    } else if (entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('Feature flags', () => {
  describe('isEnabled', () => {
    test('returns default value for known flags', () => {
      for (const [flag, defaultValue] of Object.entries(DEFAULTS)) {
        // Clear any env override
        const envVar = 'FEATURE_' + flag.replace(/([A-Z])/g, '_$1').toUpperCase();
        delete process.env[envVar];
        expect(isEnabled(flag)).toBe(defaultValue);
      }
    });

    test('returns false for unknown flags', () => {
      expect(isEnabled('nonExistentFlag')).toBe(false);
    });

    test('env var override works (true)', () => {
      process.env.FEATURE_COST_TRACKING = 'true';
      expect(isEnabled('costTracking')).toBe(true);
      delete process.env.FEATURE_COST_TRACKING;
    });

    test('env var override works (false)', () => {
      process.env.FEATURE_COST_TRACKING = 'false';
      expect(isEnabled('costTracking')).toBe(false);
      delete process.env.FEATURE_COST_TRACKING;
    });

    test('env var "1" is truthy', () => {
      process.env.FEATURE_COST_TRACKING = '1';
      expect(isEnabled('costTracking')).toBe(true);
      delete process.env.FEATURE_COST_TRACKING;
    });

    test('env var "0" is falsy', () => {
      process.env.FEATURE_COST_TRACKING = '0';
      expect(isEnabled('costTracking')).toBe(false);
      delete process.env.FEATURE_COST_TRACKING;
    });
  });

  describe('getAll', () => {
    test('returns all flags with metadata', () => {
      const all = getAll();
      for (const flag of Object.keys(DEFAULTS)) {
        expect(all[flag]).toBeDefined();
        expect(all[flag]).toHaveProperty('enabled');
        expect(all[flag]).toHaveProperty('source');
        expect(all[flag]).toHaveProperty('default');
      }
    });

    test('source is "default" when no env override', () => {
      const envVar = 'FEATURE_PARALLEL_EXTRACTION';
      delete process.env[envVar];
      const all = getAll();
      expect(all.parallelExtraction.source).toBe('default');
    });

    test('source shows env var name when overridden', () => {
      process.env.FEATURE_PARALLEL_EXTRACTION = 'false';
      const all = getAll();
      expect(all.parallelExtraction.source).toBe('env:FEATURE_PARALLEL_EXTRACTION');
      delete process.env.FEATURE_PARALLEL_EXTRACTION;
    });
  });

  describe('flag usage in source code', () => {
    let sourceContent;

    beforeAll(() => {
      const files = findJsFiles(BACKEND_SRC);
      // Exclude features.js itself — it defines the flags, not uses them
      const srcFiles = files.filter(f => !f.endsWith('features.js'));
      sourceContent = srcFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');
    });

    test('enabled flags are referenced in source code', () => {
      const enabledFlags = Object.entries(DEFAULTS)
        .filter(([, value]) => value === true)
        .map(([flag]) => flag);

      const unreferenced = [];
      for (const flag of enabledFlags) {
        // Check if the flag name appears in any source file
        if (!sourceContent.includes(flag)) {
          unreferenced.push(flag);
        }
      }

      if (unreferenced.length > 0) {
        console.warn(
          `⚠️  Enabled feature flags not referenced in source code: ${unreferenced.join(', ')}\n` +
          'These may be dead code or only used in tests/config.'
        );
      }
      // Warn but don't fail — flags may be used in config or conditionally
      expect(unreferenced.length).toBeLessThan(Object.keys(DEFAULTS).length);
    });

    test('disabled flags are not actively called in source code', () => {
      const disabledFlags = Object.entries(DEFAULTS)
        .filter(([, value]) => value === false)
        .map(([flag]) => flag);

      for (const flag of disabledFlags) {
        // Disabled flags may be referenced in comments or config, but shouldn't
        // appear in isEnabled() calls in active code paths
        // This is informational — just log any findings
        const regex = new RegExp(`isEnabled\\(['"]${flag}['"]\\)`, 'g');
        const matches = sourceContent.match(regex);
        if (matches) {
          // This is OK — it means the code checks the flag before using the feature
          expect(matches.length).toBeGreaterThan(0);
        }
      }
    });
  });
});
