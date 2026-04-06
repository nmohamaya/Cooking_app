/**
 * Agent Knowledge Consistency Tests
 *
 * Validates that agent instruction files are well-formed and consistent
 * with project conventions. Run as part of CI to catch drift.
 */

const fs = require('fs');
const path = require('path');

const AGENTS_DIR = path.join(__dirname, '..', '..', '.claude', 'agents');
const CONTRACTS_DIR = path.join(__dirname, '..', '..', 'contracts');
const CLAUDE_MD = path.join(__dirname, '..', '..', 'CLAUDE.md');

// Known valid agent roles
const EXPECTED_ROLES = [
  'tech-lead',
  'backend-dev',
  'frontend-dev',
  'reviewer',
  'reviewer-quick',
  'qa-engineer',
  'devops',
  'health-check',
];

const VALID_MODELS = ['opus', 'sonnet', 'haiku'];

/**
 * Extract model from agent file — supports two formats:
 *   1. YAML frontmatter: model: opus
 *   2. Markdown heading: ## Model: claude-opus-4-6
 */
function extractModel(content) {
  // Try YAML frontmatter first
  if (content.startsWith('---')) {
    const endIdx = content.indexOf('---', 3);
    if (endIdx > 3) {
      const fm = content.substring(3, endIdx);
      const match = fm.match(/^model:\s*(.+)$/m);
      if (match) return match[1].trim();
    }
  }
  // Try markdown heading format: ## Model: claude-<model>-4-6
  const headingMatch = content.match(/^##\s*Model:\s*claude-(\w+)/m);
  if (headingMatch) return headingMatch[1].trim();
  return null;
}

describe('Agent instruction files', () => {
  let agentFiles;

  beforeAll(() => {
    agentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
  });

  test('all expected agent files exist', () => {
    for (const role of EXPECTED_ROLES) {
      expect(agentFiles).toContain(`${role}.md`);
    }
  });

  test('no unexpected agent files exist', () => {
    const expectedFiles = EXPECTED_ROLES.map(r => `${r}.md`);
    for (const file of agentFiles) {
      expect(expectedFiles).toContain(file);
    }
  });

  test.each(EXPECTED_ROLES)('%s specifies a valid model', (role) => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, `${role}.md`), 'utf8');
    const model = extractModel(content);
    expect(model).not.toBeNull();
    expect(VALID_MODELS).toContain(model);
  });

  test.each(EXPECTED_ROLES)('%s has a role/description section', (role) => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, `${role}.md`), 'utf8');
    // Must describe what the agent does
    expect(content.toLowerCase()).toMatch(/role|description|you are/);
  });

  test.each(EXPECTED_ROLES)('%s has boundary section', (role) => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, `${role}.md`), 'utf8');
    expect(content.toLowerCase()).toMatch(/boundar|scope|read-only|do not modify/);
  });

  test.each(EXPECTED_ROLES)('%s references commit format', (role) => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, `${role}.md`), 'utf8');
    // Read-only agents are exempt from commit format requirements
    const readOnly = ['reviewer', 'reviewer-quick', 'health-check'];
    if (!readOnly.includes(role)) {
      expect(content).toMatch(/commit|feat\(|fix\(/i);
    }
  });
});

describe('Contract schemas', () => {
  test('recipe.schema.json exists and is valid JSON', () => {
    const content = fs.readFileSync(path.join(CONTRACTS_DIR, 'recipe.schema.json'), 'utf8');
    const schema = JSON.parse(content);
    expect(schema.$schema).toBeDefined();
    expect(schema.properties).toBeDefined();
    expect(schema.required).toContain('title');
    expect(schema.required).toContain('ingredients');
    expect(schema.required).toContain('instructions');
  });

  test('extraction-job.schema.json exists and is valid JSON', () => {
    const content = fs.readFileSync(path.join(CONTRACTS_DIR, 'extraction-job.schema.json'), 'utf8');
    const schema = JSON.parse(content);
    expect(schema.$schema).toBeDefined();
    expect(schema.properties.status).toBeDefined();
    expect(schema.properties.steps).toBeDefined();
  });

  test('recipe schema includes servings field', () => {
    const content = fs.readFileSync(path.join(CONTRACTS_DIR, 'recipe.schema.json'), 'utf8');
    const schema = JSON.parse(content);
    expect(schema.properties.servings).toBeDefined();
  });

  test('extraction-job schema includes completeness field', () => {
    const content = fs.readFileSync(path.join(CONTRACTS_DIR, 'extraction-job.schema.json'), 'utf8');
    const schema = JSON.parse(content);
    expect(schema.properties.result.properties.completeness).toBeDefined();
  });
});

describe('CLAUDE.md consistency', () => {
  let claudeContent;

  beforeAll(() => {
    claudeContent = fs.readFileSync(CLAUDE_MD, 'utf8');
  });

  test('documents agent roles', () => {
    // Check that key roles are mentioned (hyphenated names may appear without hyphens)
    const keyRoles = ['tech-lead', 'backend', 'frontend', 'reviewer', 'qa', 'devops'];
    for (const role of keyRoles) {
      expect(claudeContent.toLowerCase()).toContain(role);
    }
  });

  test('mentions commit format convention', () => {
    // Commit format: type(#issue): subject
    expect(claudeContent).toMatch(/feat|fix|refactor|chore/);
    expect(claudeContent).toMatch(/#\d+/);
  });

  test('mentions PR size limits', () => {
    expect(claudeContent).toMatch(/500/);
  });

  test('has multi-agent section', () => {
    expect(claudeContent.toLowerCase()).toMatch(/multi.agent/);
  });
});
