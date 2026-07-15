/**
 * smartIterator.js — Portable iterative self-correction engine
 *
 * Implements a structured evaluate → plan → execute pipeline over any
 * problem type. Returns an AsyncGenerator so callers can inspect each
 * iteration, inject feedback, or break early.
 *
 * DESIGN
 *   Each iteration (after the first) is three separate AI calls:
 *     1. Evaluate  — skeptical judge; checks the prior answer against a
 *                    structured rubric and identifies failing dimensions.
 *                    Uses a cheaper/faster model by default (evaluatorModel).
 *     2. Plan      — strategist; turns the evaluation into a concrete,
 *                    minimal remediation plan (≤3 fix steps).
 *     3. Execute   — solver; follows the plan and produces a new answer,
 *                    then verifies it by substitution.
 *
 *   Iteration 1 skips evaluate and plan — there is nothing to judge yet.
 *   It runs execute directly against the raw problem statement.
 *
 *   This separation prevents the solver from being both judge and defendant
 *   in the same prompt, which is the main failure mode of single-prompt loops.
 *
 * DEPENDENCIES
 *   Required: aiClient.js (AIClient class) — must be importable from the same project.
 *
 *   Prompts — you have two options:
 *
 *   Option A — copy as a bundle (simplest, use bundled prompts as-is):
 *     Copy smartIterator.js + the prompts/ directory as a unit.
 *     The three files prompts/evaluate.md, prompts/plan.md, prompts/execute.md
 *     must sit in a prompts/ subdirectory next to smartIterator.js.
 *     No code changes needed.
 *
 *   Option B — inject prompts at runtime (domain-specific, no file copy needed):
 *     Copy smartIterator.js only. Pass your own prompt strings via config.prompts:
 *       smartIterate(problem, ai, {
 *         prompts: {
 *           evaluate: '...your evaluate prompt string...',
 *           plan:     '...your plan prompt string...',
 *           execute:  '...your execute prompt string...',
 *         }
 *       })
 *     Each key is independently optional — omitted keys fall back to the bundled file.
 *     Prompt strings must contain the {{template_variable}} placeholders listed below
 *     and must instruct the AI to respond with the expected JSON schema.
 *
 *   Prompt template variables:
 *     evaluate.md — {{problem}}, {{answer}}, {{steps}}, {{verification}}, {{prior_summary}}
 *                   Response schema: { overall, overall_reason, failing_dimensions[],
 *                   dimensions[{name,verdict,reason}] }
 *     plan.md     — {{problem}}, {{answer}}, {{overall}}, {{failing_dimensions}},
 *                   {{overall_reason}}, {{same_mistake_as_prior}}, {{same_mistake_reason}}
 *                   Response schema: { root_cause, fix_steps[], preserve, approach_change }
 *     execute.md  — {{problem}}, {{prior_context}}, {{root_cause}}, {{fix_steps}}, {{preserve}}
 *                   Response schema: { steps, answer, verification, confidence, plan_followed }
 *                   (interpretation is optional — omit from custom prompts if not needed)
 *
 * QUICK START
 *   import { smartIterate } from './smartIterator.js'
 *   import { AIClient, MODELS } from './aiClient.js'
 *
 *   const ai = new AIClient({ apiKey, baseURL })
 *
 *   // Works for any request type: math, Q&A, analysis, summarisation, code, etc.
 *   for await (const state of smartIterate(request, ai)) {
 *     console.log(`Attempt ${state.iterationNumber}: ${state.answer} (${state.confidence}%)`)
 *     if (state.done) break
 *   }
 *
 * CUSTOM EXIT CONDITION
 *   Pass exitCondition: (state, history) => boolean to override the default.
 *   The function receives the current state and all prior states.
 *   Return true to stop the loop after the current iteration.
 *
 *   Example — exit when confidence >= 90 for two consecutive iterations:
 *     exitCondition: (state, history) =>
 *       history.length >= 1 &&
 *       state.confidence >= 90 &&
 *       history[history.length - 1].confidence >= 90
 *
 * CUSTOM STREAMING
 *   Pass onChunk: (text) => void to receive AI tokens as they stream from
 *   the execute phase. Tokens are raw text fragments — buffer them yourself
 *   if you need the full response before displaying.
 *
 * USING YOUR OWN PROMPTS (different domain)
 *   smartIterator is domain-agnostic — the engine has no concept of math,
 *   Q&A, code, or any other domain. The bundled prompts default to a
 *   general-purpose rubric that works for most request types; see Option B
 *   in DEPENDENCIES to substitute your own domain-specific prompts.
 *   See Option B in DEPENDENCIES above for the runtime injection approach.
 *   To adapt the bundled prompts for a new domain:
 *     - In evaluate.md: replace the rubric dimensions with domain-relevant ones
 *       (e.g. for code review: syntax_valid, requirements_met, no_security_issues)
 *     - In execute.md: update the response schema fields to match your output
 *     - Keep all {{template_variable}} placeholders — the renderer fills them in
 *
 * EXIT CONDITIONS (built-in, checked after each iteration)
 *   The loop stops when ANY of these is true:
 *     - exitCondition(state, history) returns true  (caller-supplied)
 *     - state.confidence === 100 AND state.verificationPassed === true
 *     - !state.converging AND iterationNumber >= 3  (cycling, no progress)
 *     - iterationNumber >= maxIterations  (hard cap, default 6)
 *
 * STATE OBJECT (yielded after each iteration)
 *   iterationNumber      {number}   1-based iteration counter
 *   answer               {string}   current best answer
 *   confidence           {number}   0–100; gated: 100 requires verification
 *   interpretation       {string|null}  solver's restatement if provided (optional field)
 *   steps                {string}   solver's numbered working steps
 *   verification         {string|null}  substitution check; null if skipped
 *   verificationPassed   {boolean}  true if evaluator confirmed verification_valid=PASS
 *   planFollowed         {string|null}  solver's confirmation of which fix steps it applied
 *   evaluation           {object|null}  full evaluator response (null on iteration 1)
 *     .overall           {string}   'PASS' | 'FAIL' | 'PARTIAL'
 *     .overall_reason    {string}   one-sentence summary of the key issue
 *     .failing_dimensions {string[]} dimension names that are FAIL or PARTIAL
 *     .same_mistake_as_prior {boolean}
 *     .same_mistake_reason  {string|null}
 *     .dimensions        {object[]} per-dimension verdicts from the rubric
 *   plan                 {object|null}  full planner response (null on iteration 1)
 *     .root_cause        {string}   precise root cause of the failure
 *     .fix_steps         {string[]} ≤3 concrete fix instructions
 *     .preserve          {string}   what the next attempt should keep
 *     .approach_change   {boolean}  true if entire approach must change
 *   failingDimensions    {string[]} shortcut to evaluation.failing_dimensions
 *   sameMistakeAsPrior   {boolean}  true if the same dimensions failed in both this and the prior iteration — detected by the library, not the evaluator
 *   converging           {boolean}  confidence non-decreasing or answer changing
 *   answerStable         {boolean}  same answer as previous iteration
 *   done                 {boolean}  exit condition was met after this iteration
 *   exitReason           {string|null}  human-readable reason the loop stopped
 *   truncated            {boolean}  true if AI response was truncated mid-JSON
 *
 * EXPORTS
 *   smartIterate(problem, ai, config?) — async generator (main entry point)
 *   DEFAULT_EXIT_CONDITION            — built-in exit function, exported for composition
 *   parseJsonResponse(raw)            — JSON parser with truncation recovery, exported for reuse
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------

function ts() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}.${String(d.getMilliseconds()).padStart(3,'0')}`
}
const log = {
  info:  (...a) => console.log( `${ts()}  INFO  [iter]`, ...a),
  warn:  (...a) => console.warn(`${ts()}  WARN  [iter]`, ...a),
  error: (...a) => console.error(`${ts()} ERROR  [iter]`, ...a),
}

// ---------------------------------------------------------------------------
// Prompt templates
//
// Loaded from the bundled prompts/ directory at module init.
// Each prompt can be overridden per-call via config.prompts — see smartIterate()
// JSDoc. This lets a new project inject its own domain-specific prompts without
// editing this file or copying the prompts/ directory.
//
// If you are porting this library, you have two options:
//   Option A (simplest): copy smartIterator.js + prompts/ as a unit. No code changes.
//   Option B (domain-specific): copy smartIterator.js only, then pass your own
//     prompts via config.prompts: { evaluate, plan, execute } as strings.
// ---------------------------------------------------------------------------

const BUNDLED_PROMPTS = {
  evaluate: readFileSync(resolve(__dirname, 'prompts/evaluate.md'), 'utf8'),
  plan:     readFileSync(resolve(__dirname, 'prompts/plan.md'),     'utf8'),
  execute:  readFileSync(resolve(__dirname, 'prompts/execute.md'),  'utf8'),
}

// ---------------------------------------------------------------------------
// JSON parsing — robust against markdown fences and truncation
// ---------------------------------------------------------------------------

/**
 * Parse a JSON object from an AI response string.
 * Strips markdown fences, finds the outermost {}, and falls back to
 * regex field extraction if the JSON is truncated.
 *
 * @param {string} raw
 * @returns {{ parsed: object, truncated: boolean }}
 * @throws {Error} if no JSON structure can be found at all
 */
export function parseJsonResponse(raw) {
  let text = raw.trim()
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) text = fence[1].trim()

  const start = text.indexOf('{')
  const end   = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return { parsed: JSON.parse(text.slice(start, end + 1)), truncated: false }
    } catch {
      // Malformed JSON — fall through to field extraction
    }
  }

  // Regex-based partial extraction for truncated responses
  function str(key) {
    const m = text.match(new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"?`))
    return m ? m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : null
  }
  function num(key) {
    const m = text.match(new RegExp(`"${key}"\\s*:\\s*(\\d+)`))
    return m ? parseInt(m[1], 10) : null
  }
  function bool(key) {
    const m = text.match(new RegExp(`"${key}"\\s*:\\s*(true|false)`))
    return m ? m[1] === 'true' : null
  }

  // _partial:true is set on objects recovered via regex extraction (truncated responses).
  // Callers can check state.truncated instead — this sentinel is internal to parseJsonResponse.
  const partial = { _partial: true }
  for (const k of ['answer','steps','interpretation','verification','overall',
                    'overall_reason','root_cause','preserve','plan_followed']) {
    const v = str(k); if (v !== null) partial[k] = v
  }
  for (const k of ['confidence']) {
    const v = num(k); if (v !== null) partial[k] = v
  }
  for (const k of ['same_mistake_as_prior','approach_change']) {
    const v = bool(k); if (v !== null) partial[k] = v
  }

  if (Object.keys(partial).length <= 1) {
    throw new Error('AI response contained no parseable JSON')
  }
  return { parsed: partial, truncated: true }
}

// ---------------------------------------------------------------------------
// Prompt rendering helpers
//
// Each function fills the {{template_variable}} placeholders in the
// corresponding prompt file. Variables that are missing from a prompt
// template are silently left unreplaced — check the .md files if a
// placeholder appears verbatim in the AI response.
// ---------------------------------------------------------------------------

/**
 * Builds a compact prior-attempts summary for the execute prompt.
 * Only includes what the executor needs to avoid repeating mistakes:
 * the answer each attempt produced and the one-line evaluator verdict.
 * Full steps are intentionally excluded — the plan already tells the
 * executor what was wrong and what to fix; re-sending steps wastes tokens.
 */
function renderPriorContext(history) {
  if (history.length === 0) return 'None — this is the first attempt.'
  return history.map(s =>
    `Attempt ${s.iterationNumber}: answer="${s.answer}" confidence=${s.confidence}%` +
    (s.evaluation?.overall_reason ? ` | issue: ${s.evaluation.overall_reason}` : '')
  ).join('\n')
}

/**
 * Renders the evaluate prompt for the most recent completed iteration.
 * prior_summary is a one-line digest of all earlier attempts (not the latest),
 * giving the evaluator context about the history without flooding it.
 */
function renderEvaluatePrompt(problem, latest, prompts) {
  const priorSummary = latest.iterationNumber === 1 ? 'None' :
    `Attempt ${latest.iterationNumber}: confidence=${latest.confidence}%`
  return prompts.evaluate
    .replace('{{problem}}',        problem)
    .replace('{{answer}}',         latest.answer ?? '')
    .replace('{{steps}}',          latest.steps ?? '')
    .replace('{{verification}}',   latest.verification ?? 'not provided')
    .replace('{{prior_summary}}',  priorSummary)
}

/**
 * Detects cycling by comparing failing dimension names across the last two evaluations.
 * Returns { cycling: boolean, reason: string|null }.
 * Cycling = the same dimension names are failing in this evaluation as in the prior one.
 * Derived entirely from history — no AI call needed.
 */
function detectCycling(evaluation, history) {
  if (history.length === 0) return { cycling: false, reason: null }
  const prev = history[history.length - 1]
  if (!prev.evaluation) return { cycling: false, reason: null }

  const currentFailing = new Set(evaluation.failing_dimensions ?? [])
  const priorFailing   = new Set(prev.evaluation.failing_dimensions ?? [])

  if (currentFailing.size === 0) return { cycling: false, reason: null }

  const overlap = [...currentFailing].filter(d => priorFailing.has(d))
  if (overlap.length === currentFailing.size && overlap.length > 0) {
    return {
      cycling: true,
      reason: `Same dimension(s) still failing as in attempt ${prev.iterationNumber}: ${overlap.join(', ')}`,
    }
  }
  return { cycling: false, reason: null }
}

/**
 * Renders the plan prompt from the evaluation result.
 * Cycling signal is injected by the library (not the evaluator) based on history comparison.
 */
function renderPlanPrompt(problem, latest, evaluation, cyclingSignal, prompts) {
  return prompts.plan
    .replace('{{problem}}',              problem)
    .replace('{{answer}}',               latest.answer ?? '')
    .replace('{{overall}}',              evaluation.overall ?? 'UNKNOWN')
    .replace('{{failing_dimensions}}',   (evaluation.failing_dimensions ?? []).join(', ') || 'none')
    .replace('{{overall_reason}}',       evaluation.overall_reason ?? '')
    .replace('{{same_mistake_as_prior}}',String(cyclingSignal.cycling))
    .replace('{{same_mistake_reason}}',  cyclingSignal.reason ?? '')
}

/**
 * Renders the execute prompt for iterations 2+.
 * fix_steps from the plan are numbered and injected as a concrete instruction list.
 * prior_context gives the executor full visibility of all previous attempts
 * so it does not repeat already-tried approaches.
 */
function renderExecutePrompt(problem, plan, history, prompts) {
  const fixSteps = (plan.fix_steps ?? []).map((s, i) => `${i + 1}. ${s}`).join('\n')
  return prompts.execute
    .replace('{{problem}}',       problem)
    .replace('{{prior_context}}', renderPriorContext(history))
    .replace('{{root_cause}}',    plan.root_cause ?? 'unknown')
    .replace('{{fix_steps}}',     fixSteps)
    .replace('{{preserve}}',      plan.preserve ?? 'none specified')
}

/**
 * Renders the execute prompt for iteration 1 only.
 * No evaluate/plan context exists yet. Uses the same generic schema as
 * subsequent iterations so renderPriorContext can format all attempts uniformly.
 * Not math-specific — works for any request type.
 */
function renderFirstExecutePrompt(problem) {
  return (
    `You are a careful, precise responder. Respond to the following request as accurately and completely as possible.\n\n` +
    `## Request\n${problem}\n\n` +
    `Respond with a JSON object ONLY — no markdown fences, no prose outside the JSON:\n\n` +
    `{\n` +
    `  "steps": "<your reasoning, step by step — show how you arrived at your answer>",\n` +
    `  "answer": "<your complete, direct response to the request>",\n` +
    `  "verification": "<how you confirmed correctness>",\n` +
    `  "confidence": <integer 0–100>,\n` +
    `  "plan_followed": "initial attempt"\n` +
    `}\n\n` +
    `Rules:\n` +
    `- answer must be complete and standalone.\n` +
    `- verification is mandatory.\n` +
    `- confidence === 100 only if you are certain the answer satisfies all aspects of the request.\n`
  )
}

// ---------------------------------------------------------------------------
// Convergence detection
// ---------------------------------------------------------------------------

/**
 * Returns true if the iteration sequence is making forward progress.
 *
 * Diverging means BOTH of these are true simultaneously:
 *   - confidence dropped vs the prior iteration (going backwards)
 *   - the answer changed (not a stable correction, just thrashing)
 * If either condition is false the loop is still considered converging —
 * a drop in confidence while the answer stays the same is acceptable
 * (the solver is recalibrating), and a new answer with higher confidence
 * is forward progress.
 */
function isConverging(history, current) {
  if (history.length === 0) return true
  const prev = history[history.length - 1]
  const confidenceDropped = current.confidence < prev.confidence
  const answerChanged     = current.answer !== prev.answer
  return !(confidenceDropped && answerChanged)  // diverging only if both are true
}

// ---------------------------------------------------------------------------
// Default exit condition
// ---------------------------------------------------------------------------

/**
 * Exit when confidence is 100 and verification passed, or when
 * the answer has been stable for 2 consecutive iterations with
 * confidence >= 90 and no failing dimensions.
 *
 * @param {object} state - current iteration state
 * @param {object[]} history - all prior states
 * @returns {boolean}
 */
export function DEFAULT_EXIT_CONDITION(state, history) {
  // Perfect: verified 100%
  if (state.confidence === 100 && state.verificationPassed) return true

  // Stable convergence: same answer twice, high confidence, no failures
  if (
    history.length >= 1 &&
    state.answerStable &&
    state.confidence >= 90 &&
    state.failingDimensions.length === 0
  ) return true

  return false
}

// ---------------------------------------------------------------------------
// smartIterate — the main async generator
// ---------------------------------------------------------------------------

/**
 * Iteratively refines an answer to a problem using evaluate→plan→execute.
 *
 * @param {string}    problem               - The problem statement
 * @param {AIClient}  ai                    - An AIClient instance
 * @param {object}   [config]
 * @param {number}   [config.maxIterations] - Hard cap (default 6)
 * @param {function} [config.exitCondition] - (state, history) => boolean
 * @param {function} [config.onChunk]       - (text: string) => void — streaming callback for execute phase
 * @param {function} [config.onIteration]   - async (state) => void — called after each completed iteration
 * @param {function} [config.onPhase]       - (phase: string, iteration: number) => void — called when each
 *                                            phase starts. phase is one of: 'evaluate', 'plan', 'execute'.
 * @param {function} [config.onEvaluation]  - (iterationNumber: number, evaluation: object) => void — called
 *                                            after each evaluate phase completes (including the post-execute
 *                                            self-verify on final iterations). Use this to update a previously
 *                                            broadcast attempt card with the judge's verdict.
 * @param {object}  [config.prompts]        - Override the bundled prompt templates with your own strings.
 *                                            All three keys are optional — omitted keys fall back to the
 *                                            bundled prompts/evaluate.md, plan.md, execute.md files.
 *                                            Use this to adapt smartIterate to a different problem domain
 *                                            without editing this file or copying the prompts/ directory.
 *   @param {string} [config.prompts.evaluate] - Evaluation prompt template. Must contain the placeholder
 *                                               variables: {{problem}}, {{answer}}, {{steps}},
 *                                               {{verification}}, {{prior_summary}}. Must instruct the AI
 *                                               to respond with a JSON object matching the evaluation schema
 *                                               (overall, overall_reason, failing_dimensions, dimensions[]).
 *   @param {string} [config.prompts.plan]     - Planning prompt template. Must contain: {{problem}},
 *                                               {{answer}}, {{overall}}, {{failing_dimensions}},
 *                                               {{overall_reason}}, {{same_mistake_as_prior}},
 *                                               {{same_mistake_reason}}. Must instruct the AI to respond
 *                                               with JSON matching the plan schema (root_cause, fix_steps[],
 *                                               preserve, approach_change).
 *   @param {string} [config.prompts.execute]  - Execute prompt template. Must contain: {{problem}},
 *                                               {{prior_context}}, {{root_cause}}, {{fix_steps}},
 *                                               {{preserve}}. Must instruct the AI to respond with JSON
 *                                               matching the execute schema (interpretation, steps, answer,
 *                                               verification, confidence, plan_followed).
 * @param {string}   [config.model]         - Override model for all calls
 * @param {string}   [config.evaluatorModel]- Override model for evaluate calls (default: same as model)
 *
 * @yields {IterationState} after each completed iteration
 */
export async function* smartIterate(problem, ai, config = {}) {
  const {
    maxIterations  = 6,
    exitCondition  = DEFAULT_EXIT_CONDITION,
    onChunk        = null,
    onIteration    = null,
    onPhase        = null,
    onEvaluation   = null,
    prompts: customPrompts = {},
    model          = undefined,
    evaluatorModel = undefined,
  } = config

  // Merge caller-supplied prompts with bundled defaults — per-key override
  const prompts = {
    evaluate: customPrompts.evaluate ?? BUNDLED_PROMPTS.evaluate,
    plan:     customPrompts.plan     ?? BUNDLED_PROMPTS.plan,
    execute:  customPrompts.execute  ?? BUNDLED_PROMPTS.execute,
  }

  const problemPreview = String(problem ?? '').slice(0, 120).replace(/\n/g, '↵')
  log.info(`smartIterate  call  maxIterations=${maxIterations}  model=${model ?? '(default)'}  evaluatorModel=${evaluatorModel ?? '(same as model)'}  onChunk=${!!onChunk}  onIteration=${!!onIteration}  onPhase=${!!onPhase}`)
  log.info(`smartIterate  problem="${problemPreview}"`)

  const history = []  // completed IterationState objects
  let iterationNumber = 0

  while (iterationNumber < maxIterations) {
    iterationNumber++
    const isFirst = iterationNumber === 1
    const t0 = Date.now()
    log.info(`━━ iteration ${iterationNumber}/${maxIterations} start ━━`)

    // ------------------------------------------------------------------
    // Phase 1: Evaluate (skip on first iteration — nothing to evaluate)
    // ------------------------------------------------------------------
    let evaluation = null
    if (!isFirst) {
      log.info(`  [1/3] evaluate  — calling evaluator`)
      if (onPhase) onPhase('evaluate', iterationNumber)
      const t1 = Date.now()
      const evalPrompt = renderEvaluatePrompt(problem, history[history.length - 1], prompts)
      const evalRaw    = await ai.chat(evalPrompt, { model: evaluatorModel ?? model })
      try {
        const { parsed } = parseJsonResponse(evalRaw)
        evaluation = parsed
        const failing = (parsed.failing_dimensions ?? [])
        log.info(`  [1/3] evaluate  done  ms=${Date.now()-t1} overall=${parsed.overall} failing=[${failing.join(',')||'none'}]`)
        if (parsed.overall_reason) log.info(`  [1/3] evaluate  reason="${parsed.overall_reason}"`)
        if (onEvaluation) onEvaluation(iterationNumber - 1, parsed)
      } catch (err) {
        log.warn(`  [1/3] evaluate  parse failed — treating as PARTIAL | ${err.message}`)
        evaluation = { overall: 'PARTIAL', overall_reason: 'evaluation unavailable', failing_dimensions: [], same_mistake_as_prior: false }
      }

      // If evaluator says PASS, trust it — skip plan+execute and exit
      if (evaluation.overall === 'PASS' && (evaluation.failing_dimensions ?? []).length === 0) {
        log.info(`  [1/3] evaluate  → PASS confirmed — exiting loop early`)
        const prev  = history[history.length - 1]
        const state = {
          ...prev,
          iterationNumber,
          evaluation,
          plan:               null,
          failingDimensions:  [],
          verificationPassed: true,
          converging:         true,
          answerStable:       true,
          done:               true,
          exitReason:         'evaluator confirmed PASS',
        }
        if (onIteration) await onIteration(state)
        yield state
        return
      }
    }

    // ------------------------------------------------------------------
    // Phase 2: Plan (skip on first iteration)
    // ------------------------------------------------------------------
    let plan = null
    if (!isFirst && evaluation) {
      log.info(`  [2/3] plan      — building remediation plan`)
      if (onPhase) onPhase('plan', iterationNumber)
      const t2 = Date.now()
      const cyclingSignal = detectCycling(evaluation, history)
      if (cyclingSignal.cycling) log.info(`  [2/3] plan      cycling detected: ${cyclingSignal.reason}`)
      const planPrompt = renderPlanPrompt(problem, history[history.length - 1], evaluation, cyclingSignal, prompts)
      const planRaw    = await ai.chat(planPrompt, { model })
      try {
        const { parsed } = parseJsonResponse(planRaw)
        plan = parsed
        log.info(`  [2/3] plan      done  ms=${Date.now()-t2} root_cause="${parsed.root_cause}" approach_change=${parsed.approach_change}`)
        if (parsed.fix_steps?.length) {
          parsed.fix_steps.forEach((s, i) => log.info(`  [2/3] plan      fix[${i+1}] ${s}`))
        }
      } catch (err) {
        log.warn(`  [2/3] plan      parse failed — using empty plan | ${err.message}`)
        plan = { root_cause: 'unknown', fix_steps: [], preserve: 'none', approach_change: false }
      }
    }

    // ------------------------------------------------------------------
    // Phase 3: Execute (always runs — streams if onChunk provided)
    // ------------------------------------------------------------------
    log.info(`  [3/3] execute   — ${isFirst ? 'initial attempt' : 'applying plan'}`)
    if (onPhase) onPhase('execute', iterationNumber)
    const t3 = Date.now()
    const execPrompt = isFirst
      ? renderFirstExecutePrompt(problem)
      : renderExecutePrompt(problem, plan, history, prompts)

    let execRaw
    if (onChunk) {
      execRaw = await ai.chatStream(execPrompt, onChunk, { model })
    } else {
      execRaw = await ai.chat(execPrompt, { model })
    }

    let execParsed
    let truncated = false
    try {
      const result = parseJsonResponse(execRaw)
      execParsed = result.parsed
      truncated  = result.truncated
      if (truncated) log.warn(`  [3/3] execute   response truncated — confidence forced to 0`)
      log.info(`  [3/3] execute   done  ms=${Date.now()-t3} confidence=${execParsed.confidence} answer="${String(execParsed.answer ?? '').slice(0, 80)}"`)
      if (execParsed.verification) log.info(`  [3/3] execute   verification="${String(execParsed.verification).slice(0, 100)}"`)
    } catch (err) {
      log.warn(`  [3/3] execute   parse failed — yielding zero-confidence state | ${err.message}`)
      execParsed = {
        interpretation: '(parse failed)',
        steps:          '(parse failed)',
        answer:         '(truncated)',
        verification:   null,
        confidence:     0,
        plan_followed:  'parse error',
      }
      truncated = true
    }

    // ------------------------------------------------------------------
    // Derive state fields
    // ------------------------------------------------------------------
    const prev              = history.length > 0 ? history[history.length - 1] : null
    const confidence        = truncated ? 0 : (parseInt(execParsed.confidence, 10) || 0)
    const answerStable      = prev ? execParsed.answer === prev.answer : false
    const converging        = isConverging(history, { confidence, answer: execParsed.answer })
    const failingDimensions = evaluation ? (evaluation.failing_dimensions ?? []) : []

    const verificationPassed = isFirst
      ? Boolean(execParsed.verification)
      : (evaluation?.dimensions ?? []).find(d => d.name === 'verification_valid')?.verdict === 'PASS'
        || (evaluation?.overall === 'PASS')

    const gatedConfidence = (confidence === 100 && !execParsed.verification) ? 85 : confidence
    if (gatedConfidence !== confidence) {
      log.warn(`  confidence gated 100→85 (verification missing)`)
    }

    const state = {
      iterationNumber,
      answer:             execParsed.answer         ?? '(no answer)',
      confidence:         gatedConfidence,
      interpretation:     execParsed.interpretation ?? null,  // optional — not required by execute prompt
      steps:              execParsed.steps           ?? '',
      verification:       execParsed.verification    ?? null,
      verificationPassed,
      planFollowed:       execParsed.plan_followed   ?? null,
      evaluation,
      plan,
      failingDimensions,
      sameMistakeAsPrior: detectCycling(evaluation ?? { failing_dimensions: [] }, history).cycling,
      converging,
      answerStable,
      done:               false,
      exitReason:         null,
      truncated,
    }

    // ------------------------------------------------------------------
    // Exit condition evaluation
    // ------------------------------------------------------------------
    const hardCapReached  = iterationNumber >= maxIterations
    const cycling         = !converging && iterationNumber >= 3 && state.sameMistakeAsPrior
    const callerSaysDone  = exitCondition(state, history)

    if (callerSaysDone || hardCapReached || cycling) {
      state.done = true
      state.exitReason = callerSaysDone  ? 'exit condition met'
                       : cycling         ? 'cycling detected — same mistake repeated'
                       :                   `max iterations (${maxIterations}) reached`
    }

    // ------------------------------------------------------------------
    // Post-execute self-verification judge
    // Runs when we are about to yield a final answer with no evaluation.
    // This covers: single-attempt solves, max-cap exits, and any done
    // state where the evaluator hasn't seen the final answer yet.
    // ------------------------------------------------------------------
    if (state.done && state.evaluation === null) {
      log.info(`  [post] self-verify — running judge on final answer`)
      if (onPhase) onPhase('evaluate', iterationNumber)
      const t4 = Date.now()
      try {
        const evalPrompt = renderEvaluatePrompt(problem, state, prompts)
        const evalRaw    = await ai.chat(evalPrompt, { model: evaluatorModel ?? model })
        const { parsed } = parseJsonResponse(evalRaw)
        state.evaluation        = parsed
        state.failingDimensions = parsed.failing_dimensions ?? []
        state.verificationPassed = (parsed.dimensions ?? [])
          .find(d => d.name === 'verification_valid')?.verdict === 'PASS'
          || parsed.overall === 'PASS'
        log.info(`  [post] self-verify done  ms=${Date.now()-t4} overall=${parsed.overall} failing=[${state.failingDimensions.join(',')||'none'}]`)
        if (parsed.overall_reason) log.info(`  [post] self-verify reason="${parsed.overall_reason}"`)
        // Notify caller — they can update the already-broadcast attempt card in place
        if (onEvaluation) onEvaluation(iterationNumber, parsed)
      } catch (err) {
        log.warn(`  [post] self-verify failed — skipping | ${err.message}`)
      }
    }

    log.info(`━━ iteration ${iterationNumber} complete  confidence=${state.confidence}% verificationPassed=${state.verificationPassed} converging=${state.converging} answerStable=${state.answerStable} ms=${Date.now()-t0}`)
    if (state.done) log.info(`━━ loop exit  reason="${state.exitReason}"`)

    history.push(state)
    if (onIteration) await onIteration(state)
    yield state

    if (state.done) return
  }
}
