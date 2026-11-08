// Offline tests: transpile real services/routes and replace only external APIs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const repository = path.resolve(process.argv[2] || __dirname);
const dependencies = path.resolve(process.argv[3] || repository);
const ts = require(path.join(dependencies, 'node_modules/typescript'));
const deductions = [{ id: 'test-wall', description: 'Wall scuff', amount: 350 }];
const photoPayload = {
  moveInBase64: 'data:image/jpeg;base64,aW4=', moveInMimeType: 'image/jpeg',
  moveOutBase64: 'data:image/jpeg;base64,b3V0', moveOutMimeType: 'image/jpeg',
  deductions,
};
const researchPayload = { managementCompany: 'Test Management', city: 'Austin', state: 'TX', deductions };

function harness(options = {}) {
  const modules = new Map();
  const calls = [];
  class GoogleGenAI {
    constructor() {
      this.models = { generateContent: async (request) => {
        calls.push(request);
        if (options.hang) return new Promise(() => {}); // Deliberately ignores abort.
        return { text: JSON.stringify({ comparable: true, findings: [], statutorySummary: 'Offline fixture.' }) };
      } };
    }
  }
  function load(relative) {
    const filename = path.resolve(repository, relative);
    assert.ok(filename.startsWith(path.join(repository, 'src') + path.sep));
    if (modules.has(filename)) return modules.get(filename).exports;
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      fileName: filename,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const module = { exports: {} };
    modules.set(filename, module);
    const localRequire = (name) => {
      if (name === '@google/genai') return { GoogleGenAI, ThinkingLevel: { LOW: 'LOW' } };
      if (name === 'next/server') return { NextResponse: { json: (body, init) => Response.json(body, init) } };
      assert.ok(name.startsWith('.'), `External dependency blocked: ${name}`);
      const dependency = path.resolve(path.dirname(filename), `${name}.ts`);
      const exports = load(dependency);
      if (options.shortDeadline && dependency.endsWith('/geminiDeadline.ts')) {
        return { ...exports, withGeminiDeadline: (work) => exports.withGeminiDeadline(work, 5) };
      }
      return exports;
    };
    vm.runInNewContext(compiled, {
      module, exports: module.exports, require: localRequire,
      process: { env: { GEMINI_API_KEY: 'offline-test-key-never-sent' } },
      AbortController,
      setTimeout: options.timers?.setTimeout || setTimeout,
      clearTimeout: options.timers?.clearTimeout || clearTimeout,
    }, { filename, timeout: 5000 });
    return module.exports;
  }
  return { load, calls };
}

function fakeTimers() {
  let nextId = 0;
  const active = new Map();
  const cleared = [];
  return {
    active, cleared,
    setTimeout: (callback, delay) => { const id = ++nextId; active.set(id, { callback, delay }); return id; },
    clearTimeout: (id) => { cleared.push(id); active.delete(id); },
    fire: () => { const [id, timer] = active.entries().next().value; active.delete(id); timer.callback(); return id; },
  };
}

(async () => {
  const timers = fakeTimers();
  const deadline = harness({ timers }).load('src/lib/geminiDeadline.ts');
  assert.equal(deadline.GEMINI_TIMEOUT_MS, 150_000);

  assert.equal(await deadline.withGeminiDeadline(async () => 'complete'), 'complete');
  assert.equal(timers.active.size, 0);
  assert.equal(timers.cleared.length, 1, 'Success clears its timer');
  const failure = new Error('Offline failure');
  await assert.rejects(deadline.withGeminiDeadline(async () => { throw failure; }), (error) => error === failure);
  await assert.rejects(deadline.withGeminiDeadline(() => { throw failure; }), (error) => error === failure);
  assert.equal(timers.active.size, 0);
  assert.equal(timers.cleared.length, 3, 'Rejected/synchronous work clears its timer');

  let signal;
  let rejectLate;
  const pending = deadline.withGeminiDeadline((value) => {
    signal = value;
    return new Promise((_, reject) => { rejectLate = reject; });
  }, 25);
  await Promise.resolve();
  assert.equal(signal.aborted, false);
  assert.equal([...timers.active.values()][0].delay, 25);
  const timerId = timers.fire();
  await assert.rejects(pending, (error) => error instanceof deadline.GeminiTimeoutError);
  assert.equal(signal.aborted, true, 'Deadline cancels the SDK signal');
  assert.equal(timers.active.size, 0);
  assert.equal(timers.cleared.at(-1), timerId, 'Timeout also clears its timer');
  rejectLate(new Error('Late SDK rejection')); // Promise.race must already handle it.
  await new Promise(setImmediate);
  console.log('PASS deadline resolves/rejects normally, cancels hanging work, and always clears timers.');

  const services = harness();
  const modelConfig = services.load('src/lib/geminiConfig.ts');
  assert.equal(modelConfig.DEFAULT_GEMINI_MODEL, 'gemini-3.5-flash-lite');
  assert.equal(modelConfig.getGeminiThinkingConfig('gemini-3.8-flash').thinkingLevel, 'LOW');
  assert.equal(modelConfig.getGeminiThinkingConfig('custom-model'), undefined);
  const controller = new AbortController();
  await services.load('src/lib/gemini.ts').analyzeEvidenceWithGemini(photoPayload, controller.signal);
  await services.load('src/lib/research.ts').researchPolicyAndPricing(researchPayload, controller.signal);
  assert.equal(services.calls.length, 2);
  for (const request of services.calls) {
    assert.equal(request.config.abortSignal, controller.signal);
    assert.equal(request.config.httpOptions.timeout, 150_000);
    assert.equal(request.config.httpOptions.retryOptions.attempts, 3);
    assert.equal(request.model, 'gemini-3.5-flash-lite');
    assert.equal(request.config.thinkingConfig, undefined);
    assert.equal(request.config.responseMimeType, 'application/json');
  }
  console.log('PASS both real services pass the deadline signal and bounded SDK retries and timeout.');

  for (const [kind, payload, code] of [
    ['analyze', photoPayload, 'ANALYSIS_TIMEOUT'],
    ['research', researchPayload, 'RESEARCH_TIMEOUT'],
  ]) {
    const routeHarness = harness({ hang: true, shortDeadline: true });
    const route = routeHarness.load(`src/app/api/${kind}/route.ts`);
    assert.equal(route.maxDuration, 180);
    const response = await route.POST({ json: async () => payload });
    assert.equal(response.status, 504);
    assert.match(response.headers.get('content-type'), /application\/json/);
    const body = await response.json();
    assert.equal(body.error, code);
    assert.match(body.message, /took too long.*try again/i);
    assert.ok(!body.message.includes('An error occurred'));
    assert.equal(routeHarness.calls.length, 1);
    assert.equal(routeHarness.calls[0].config.abortSignal.aborted, true);
    console.log(`PASS ${kind} returns JSON 504 when its SDK ignores cancellation.`);
  }
  console.log('All deadline checks passed. No credentials, environment files, or network used.');
})().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
