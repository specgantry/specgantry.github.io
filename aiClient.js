/**
 * aiClient.js — Portable AI client for Node.js projects
 *
 * Wraps an Anthropic-compatible LLM proxy and an OpenAI-compatible embeddings
 * endpoint behind a single, dependency-light class. Designed to be dropped into
 * any Node.js project without modification.
 *
 * REQUIREMENTS
 *   Node.js 18+ (uses native fetch for embeddings)
 *   @anthropic-ai/sdk  (LLM calls only — not needed if you only use embed())
 *
 * QUICK START
 *   import { AIClient, MODELS } from './aiClient.js'
 *
 *   const ai = new AIClient({
 *     apiKey:  process.env.AI_API_KEY,
 *     baseURL: 'http://localhost:6655',        // proxy base URL
 *   })
 *
 *   // One-shot completion
 *   const answer = await ai.chat('What is 2 + 2?')
 *
 *   // Streaming completion (token by token)
 *   const full = await ai.chatStream('Write a haiku.', chunk => process.stdout.write(chunk))
 *
 *   // Embeddings
 *   const vector = await ai.embed('hello world')            // → number[]
 *   const batch  = await ai.embed(['hello', 'world'])       // → number[][]
 *
 * PROXY CONVENTIONS
 *   The proxy must expose two sub-paths under baseURL:
 *     {baseURL}/anthropic   → forwarded to Anthropic Messages API  (LLM)
 *     {baseURL}/openai/v1   → forwarded to OpenAI-compatible API   (embeddings)
 *   Both accept the same apiKey as a Bearer token or x-api-key header.
 *
 * ERROR HANDLING
 *   All methods throw with a descriptive message on unrecoverable failure.
 *   Transient errors (connection drops, rate limits, proxy resets) are retried
 *   automatically with exponential backoff — up to MAX_RETRIES attempts.
 *   Callers only see errors that persisted through all retries.
 *
 * EXPORTS
 *   AIClient  — main class (see constructor JSDoc for options)
 *   MODELS    — convenience constants for the three Claude tiers
 *   callAI()  — one-shot functional wrapper around AIClient.chat()
 */

import Anthropic from '@anthropic-ai/sdk'

// ---------------------------------------------------------------------------
// Model constants
//
// Pass these to the AIClient constructor or to individual chat() calls.
// Use the lowest tier that produces acceptable output — haiku is ~10x cheaper
// than opus and fast enough for most classification / extraction tasks.
// ---------------------------------------------------------------------------

/**
 * Symbolic model identifiers for the three Claude tiers.
 *
 * @example
 * const ai = new AIClient({ apiKey, baseURL, defaultModel: MODELS.sonnet })
 * const answer = await ai.chat(prompt, { model: MODELS.opus })
 */
export const MODELS = {
  /** Fast, cheap — summarisation, classification, lightweight extraction. */
  haiku:  'anthropic--claude-haiku-latest',
  /** Balanced — reasoning, moderate complexity, default for most tasks. */
  sonnet: 'anthropic--claude-sonnet-latest',
  /** Most capable — deep multi-step reasoning, complex analysis. */
  opus:   'anthropic--claude-opus-latest',
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

// Compact, timestamped logger — [HH:MM:SS.mmm] LEVEL [ai] message
function ts() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}.${String(d.getMilliseconds()).padStart(3,'0')}`
}
const log = {
  info:  (...a) => console.log( `${ts()}  INFO  [ai]`, ...a),
  warn:  (...a) => console.warn(`${ts()}  WARN  [ai]`, ...a),
  error: (...a) => console.error(`${ts()} ERROR  [ai]`, ...a),
}

/**
 * Returns true for errors that are safe to retry transparently.
 * Covers rate limits (429), connection drops, proxy resets, and stream closes.
 * Hard errors (4xx auth failures, bad requests) are NOT retryable.
 *
 * @param {string} msg - error message, lowercased before matching
 * @returns {boolean}
 */
function isRetryableError(msg) {
  if (msg.includes('429') || msg.toLowerCase().includes('rate limit')) return true
  const transient = [
    'premature close',   // proxy closed stream before completion
    'econnreset',        // TCP connection reset
    'econnrefused',      // proxy not reachable (transient during restarts)
    'etimedout',         // connection timeout
    'socket hang up',    // Node HTTP keep-alive dropped
    'network error',     // generic fetch failure
    'fetch failed',      // undici/Node fetch wrapper
  ]
  return transient.some(t => msg.toLowerCase().includes(t))
}

// ---------------------------------------------------------------------------
// AIClient
// ---------------------------------------------------------------------------

/**
 * Portable AI client — wraps LLM completions and embeddings behind a single class.
 *
 * Instantiate once per process and reuse — the underlying Anthropic SDK client
 * and the max_tokens cache are both held on the instance.
 *
 * @example
 * // Minimal setup
 * const ai = new AIClient({ apiKey: 'sk-...', baseURL: 'http://localhost:6655' })
 *
 * @example
 * // Explicit model
 * const ai = new AIClient({
 *   apiKey:       'sk-...',
 *   baseURL:      'http://localhost:6655',
 *   defaultModel: MODELS.opus,
 * })
 */
export class AIClient {
  /**
   * @param {object} opts

   * @param {string}  opts.apiKey         - API key forwarded as Bearer / x-api-key.
   * @param {string}  opts.baseURL        - Proxy base URL (no trailing slash).
   *                                        LLM path:        {baseURL}/anthropic
   *                                        Embeddings path: {baseURL}/openai/v1/embeddings
   * @param {string} [opts.defaultModel]  - Model used when callers omit `model`.
   *                                        Defaults to MODELS.haiku.
   */
  constructor({ apiKey, baseURL, defaultModel = MODELS.haiku } = {}) {
    if (!apiKey)   throw new Error('AIClient: apiKey is required')
    if (!baseURL)  throw new Error('AIClient: baseURL is required')

    this._apiKey       = apiKey
    this._baseURL      = baseURL.replace(/\/$/, '')
    this._defaultModel = defaultModel

    // Caches proxy-reported max_output_tokens per model so we only call
    // listModels() once per model per process lifetime.
    this._maxTokensCache = new Map()

    this._llmClient = new Anthropic({
      apiKey,
      baseURL: `${this._baseURL}/anthropic`,
    })
  }

  // ---------------------------------------------------------------------------
  // Private — max token resolution
  // ---------------------------------------------------------------------------

  /**
   * Returns the max_output_tokens for a model, fetching from the proxy once
   * and caching the result. Falls back to 16 000 if the proxy call fails.
   *
   * @private
   * @param {string} model
   * @returns {Promise<number>}
   */
  async _resolveMaxTokens(model) {
    if (this._maxTokensCache.has(model)) return this._maxTokensCache.get(model)
    try {
      const models = await this.listModels()
      for (const m of models) {
        if (m.id === model && m.max_output_tokens) {
          this._maxTokensCache.set(model, m.max_output_tokens)
        }
      }
    } catch {
      // listModels unavailable — use safe default
    }
    if (!this._maxTokensCache.has(model)) this._maxTokensCache.set(model, 16000)
    return this._maxTokensCache.get(model)
  }

  // ---------------------------------------------------------------------------
  // chat() — blocking completion
  // ---------------------------------------------------------------------------

  /**
   * Send a prompt and return the complete response text.
   *
   * max_tokens is resolved automatically from the model's reported limit.
   * Retries automatically on transient errors (rate limits, connection drops).
   *
   * @example
   * const text = await ai.chat('Translate "hello" to French.')
   *
   * @example
   * // Override model for a single call
   * const text = await ai.chat('Summarise this document: ...', { model: MODELS.haiku })
   *
   * @example
   * // Pass a full message history (e.g. multi-turn conversation)
   * const text = await ai.chat(null, {
   *   messages: [
   *     { role: 'user',      content: 'My name is Alice.' },
   *     { role: 'assistant', content: 'Nice to meet you, Alice.' },
   *     { role: 'user',      content: 'What is my name?' },
   *   ],
   * })
   *
   * @param {string}    prompt           - User message. Ignored when `messages` is provided.
   * @param {object}   [opts]
   * @param {string}   [opts.model]      - Override the instance default model.
   * @param {number}   [opts.maxTokens]  - Override max output tokens (skips auto-resolve).
   * @param {object[]} [opts.messages]   - Full message array; overrides `prompt` when set.
   * @returns {Promise<string>} Complete response text.
   * @throws {Error} On non-retryable failure or exhausted retries.
   */
  async chat(prompt, { model, maxTokens, messages } = {}) {
    const resolvedModel     = model     ?? this._defaultModel
    const resolvedMaxTokens = maxTokens ?? await this._resolveMaxTokens(resolvedModel)

    const preview = messages
      ? `[messages array, ${messages.length} item(s)]`
      : String(prompt ?? '').slice(0, 120).replace(/\n/g, '↵')
    log.info(`chat  call  model=${model ?? '(default)→' + resolvedModel}  max_tokens=${resolvedMaxTokens}  prompt="${preview}"`)
    const t0 = Date.now()

    const payload = {
      model:      resolvedModel,
      max_tokens: resolvedMaxTokens,
      messages:   messages ?? [{ role: 'user', content: prompt }],
    }

    const MAX_RETRIES = 5
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const chunks = []
        const stream = await this._llmClient.messages.stream(payload)
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            chunks.push(event.delta.text)
          }
        }
        const response = chunks.join('')
        log.info(`chat  done  chars=${response.length} ms=${Date.now() - t0}`)
        return response
      } catch (err) {
        const msg        = err.message ?? String(err)
        const retryMatch = msg.match(/"seconds"\s*:\s*(\d+)/) ?? msg.match(/retry after (\d+) second/i)
        if (isRetryableError(msg) && attempt < MAX_RETRIES) {
          const waitSecs = retryMatch ? parseInt(retryMatch[1], 10) + 1 : Math.min(Math.pow(2, attempt), 16)
          log.warn(`chat  retryable error (attempt ${attempt + 1}/${MAX_RETRIES}) — retrying in ${waitSecs}s | ${msg}`)
          await new Promise(resolve => setTimeout(resolve, waitSecs * 1000))
          continue
        }
        log.error(`chat  failed after ${attempt} attempt(s) | ${msg}`)
        throw new Error(`AI chat error: ${msg}`)
      }
    }
  }

  // ---------------------------------------------------------------------------
  // chatStream() — streaming completion
  // ---------------------------------------------------------------------------

  /**
   * Stream a prompt token-by-token, invoking `onChunk` for each text fragment.
   * Returns the full accumulated response when the stream completes.
   *
   * Use this instead of chat() when you want to display output progressively
   * (e.g. typewriter effect in a UI, piping to stdout). The return value is
   * identical to what chat() would have returned — you don't need to accumulate
   * chunks yourself.
   *
   * On a retryable error mid-stream, the partial tokens already delivered to
   * `onChunk` are discarded and the entire request is retried from the start.
   * Your onChunk handler should treat its output as a live preview only; use
   * the final return value as the authoritative complete response.
   *
   * @example
   * // Print tokens to stdout as they arrive
   * const full = await ai.chatStream('Write a haiku.', chunk => process.stdout.write(chunk))
   * console.log('\nFull response:', full)
   *
   * @example
   * // Collect tokens and update a UI element
   * let buffer = ''
   * await ai.chatStream(prompt, chunk => {
   *   buffer += chunk
   *   myElement.textContent = buffer
   * })
   *
   * @param {string}    prompt           - User message. Ignored when `messages` is provided.
   * @param {function}  onChunk          - Called with each text token as it arrives: (text: string) => void.
   * @param {object}   [opts]
   * @param {string}   [opts.model]      - Override the instance default model.
   * @param {number}   [opts.maxTokens]  - Override max output tokens (skips auto-resolve).
   * @param {object[]} [opts.messages]   - Full message array; overrides `prompt` when set.
   * @returns {Promise<string>} Complete accumulated response text.
   * @throws {Error} On non-retryable failure or exhausted retries.
   */
  async chatStream(prompt, onChunk, { model, maxTokens, messages } = {}) {
    const resolvedModel     = model     ?? this._defaultModel
    const resolvedMaxTokens = maxTokens ?? await this._resolveMaxTokens(resolvedModel)

    const preview = messages
      ? `[messages array, ${messages.length} item(s)]`
      : String(prompt ?? '').slice(0, 120).replace(/\n/g, '↵')
    log.info(`stream  call  model=${model ?? '(default)→' + resolvedModel}  max_tokens=${resolvedMaxTokens}  prompt="${preview}"`)
    const t0 = Date.now()

    const payload = {
      model:      resolvedModel,
      max_tokens: resolvedMaxTokens,
      messages:   messages ?? [{ role: 'user', content: prompt }],
    }

    const MAX_RETRIES = 5
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const chunks = []
      try {
        const stream = await this._llmClient.messages.stream(payload)
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            const text = event.delta.text
            chunks.push(text)
            onChunk(text)
          }
        }
        const response = chunks.join('')
        log.info(`stream  done  chars=${response.length} ms=${Date.now() - t0}`)
        return response
      } catch (err) {
        const msg        = err.message ?? String(err)
        const retryMatch = msg.match(/"seconds"\s*:\s*(\d+)/) ?? msg.match(/retry after (\d+) second/i)
        if (isRetryableError(msg) && attempt < MAX_RETRIES) {
          const waitSecs = retryMatch ? parseInt(retryMatch[1], 10) + 1 : Math.min(Math.pow(2, attempt), 16)
          log.warn(`stream  retryable error (attempt ${attempt + 1}/${MAX_RETRIES}) — retrying in ${waitSecs}s | ${msg}`)
          await new Promise(resolve => setTimeout(resolve, waitSecs * 1000))
          continue
        }
        log.error(`stream  failed after ${attempt} attempt(s) | ${msg}`)
        throw new Error(`AI chat error: ${msg}`)
      }
    }
  }

  // ---------------------------------------------------------------------------
  // embed() — text embeddings
  // ---------------------------------------------------------------------------

  /**
   * Generate an embedding vector (or batch of vectors) for one or more texts.
   *
   * Uses the OpenAI-compatible embeddings endpoint at {baseURL}/openai/v1/embeddings.
   * Does NOT use the Anthropic SDK — only requires Node 18+ native fetch.
   *
   * @example
   * // Single text → number[]
   * const vec = await ai.embed('The quick brown fox')
   *
   * @example
   * // Batch → number[][]
   * const [v1, v2] = await ai.embed(['hello', 'world'])
   *
   * @example
   * // Custom embedding model
   * const vec = await ai.embed('hello', { model: 'text-embedding-3-large' })
   *
   * @param {string|string[]} input        - One text string or an array of strings.
   * @param {object}         [opts]
   * @param {string}         [opts.model]  - Embedding model ID.
   *                                         Defaults to 'text-embedding-3-small'.
   * @returns {Promise<number[]>}   When input is a string — a single embedding vector.
   * @returns {Promise<number[][]>} When input is an array — one vector per input string.
   * @throws {Error} On network failure or non-200 response.
   */
  async embed(input, { model = 'text-embedding-3-small' } = {}) {
    const url  = `${this._baseURL}/openai/v1/embeddings`
    const body = JSON.stringify({ model, input })

    let res
    try {
      res = await fetch(url, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${this._apiKey}`,
        },
        body,
      })
    } catch (err) {
      throw new Error(`AI embed error (network): ${err.message ?? String(err)}`)
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => res.statusText)
      throw new Error(`AI embed error (${res.status}): ${detail}`)
    }

    const json    = await res.json()
    const vectors = json.data.map(item => item.embedding)
    // Mirror the input shape: single string → single vector, array → array of vectors.
    return Array.isArray(input) ? vectors : vectors[0]
  }

  // ---------------------------------------------------------------------------
  // listModels() — proxy model catalogue
  // ---------------------------------------------------------------------------

  /**
   * Fetch the list of LLM models available from the proxy.
   *
   * Primarily used internally to resolve max_output_tokens. Call it directly
   * if you need to discover which models are available at runtime.
   *
   * @example
   * const models = await ai.listModels()
   * console.log(models.map(m => m.id))
   *
   * @returns {Promise<object[]>} Array of model descriptor objects.
   *                              Each object has at minimum: { id, display_name }.
   * @throws {Error} On non-200 response.
   */
  async listModels() {
    const url = `${this._baseURL}/anthropic/v1/models`
    const res = await fetch(url, {
      headers: {
        'x-api-key':     this._apiKey,
        'Authorization': `Bearer ${this._apiKey}`,
      },
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => res.statusText)
      throw new Error(`listModels error (${res.status}): ${detail}`)
    }
    const json = await res.json()
    return json.data ?? json
  }
}

// ---------------------------------------------------------------------------
// callAI() — one-shot functional convenience wrapper
// ---------------------------------------------------------------------------

/**
 * One-shot LLM call without managing an AIClient instance.
 *
 * Creates a temporary AIClient, calls chat(), and returns the result.
 * Convenient for scripts or one-off calls. For multiple calls in the same
 * process, instantiate AIClient directly — it caches the SDK client and the
 * max_tokens lookup, so repeated instantiation wastes work.
 *
 * @example
 * import { callAI, MODELS } from './aiClient.js'
 *
 * const answer = await callAI({
 *   prompt:  'What is the capital of France?',
 *   model:   MODELS.haiku,
 *   apiKey:  process.env.AI_API_KEY,
 *   baseURL: 'http://localhost:6655',
 * })
 *
 * @param {object} opts
 * @param {string} opts.prompt
 * @param {string} opts.model
 * @param {string} opts.apiKey
 * @param {string} opts.baseURL
 * @returns {Promise<string>}
 */
export async function callAI({ prompt, model, apiKey, baseURL }) {
  const ai = new AIClient({ apiKey, baseURL, defaultModel: model })
  return ai.chat(prompt)
}
