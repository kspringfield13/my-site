#!/usr/bin/env tsx
import assert from "node:assert/strict";

async function main() {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GROQ_API_KEY;
  const originalModel = process.env.AGENT_KYLE_MODEL;
  process.env.GROQ_API_KEY = "test-only-key";
  delete process.env.AGENT_KYLE_MODEL;

  try {
    const { createGroqJsonCompletion, GroqRequestError } = await import("../lib/agent-kyle/groq");
    const input = { systemPrompt: "Return JSON.", userPrompt: "What does Kyle build?" };
    globalThis.fetch = async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      assert.equal(body.model, "openai/gpt-oss-20b");
      assert.deepEqual(body.response_format, { type: "json_object" });
      return Response.json({
        model: body.model,
        choices: [{ message: { content: '{"answer":"Portfolio evidence"}' } }],
        usage: { prompt_tokens: 100, completion_tokens: 25, total_tokens: 125 }
      });
    };
    const completion = await createGroqJsonCompletion(input);
    assert.equal(JSON.parse(completion.content).answer, "Portfolio evidence");
    assert.equal(completion.usage.totalTokens, 125);

    // A retired model must retain its real status for diagnosis, without
    // leaking provider response bodies or misclassifying it as a rate limit.
    for (const status of [401, 404, 429, 503]) {
      globalThis.fetch = async () => Response.json({ error: { message: "private echoed input" } }, { status });
      await assert.rejects(createGroqJsonCompletion(input), (error: unknown) => {
        assert.ok(error instanceof GroqRequestError);
        assert.equal(error.status, status);
        assert.equal(error.model, "openai/gpt-oss-20b");
        assert.ok(!error.message.includes("private echoed input"));
        return true;
      });
    }

    globalThis.fetch = async (_url, init) => {
      assert.equal(JSON.parse(String(init?.body)).model, "configured-model");
      return Response.json({ choices: [{ message: { content: "{}" } }] });
    };
    assert.equal((await createGroqJsonCompletion({ ...input, model: "configured-model" })).model, "configured-model");
    console.log("Agent provider checks passed: replacement model, JSON response, usage, overrides, and safe provider errors.");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.AGENT_KYLE_MODEL;
    else process.env.AGENT_KYLE_MODEL = originalModel;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
