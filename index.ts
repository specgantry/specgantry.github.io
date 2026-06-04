/**
 * SpecGantry Plugin Entry Point
 *
 * AI-powered SDLC pipeline for Claude Code with enforced phase gates,
 * from ideation through deployment.
 */

// Export skill and agent definitions
export const skills = [
  'spec-gantry',
  'start-project',
  'bugfix',
  'reverse-engineer',
  'update-pricing',
];

export const agents = [
  'orchestrator',
  'ideation-agent',
  'architecture-agent',
  'feature-spec-agent',
  'dev-agent',
  'test-agent',
  'deployment-agent',
];

// Plugin metadata
export const metadata = {
  name: 'spec-gantry',
  version: '1.0.0',
  description: 'AI-powered SDLC pipeline for Claude Code with enforced phase gates, from ideation to deployment.',
  author: 'Mangesh Pise',
};
