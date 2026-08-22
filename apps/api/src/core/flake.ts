import type { FastifyInstance } from "fastify";

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function moduleFlakeConfig(moduleName: string) {
  const upper = moduleName.toUpperCase();
  const latencyMs = envNumber(`FLAKE_LATENCY_MS_${upper}`, envNumber("FLAKE_LATENCY_MS", 0));
  const failureRate = envNumber(`FLAKE_FAILURE_RATE_${upper}`, envNumber("FLAKE_FAILURE_RATE", 0));
  return { latencyMs, failureRate };
}

// Applies configurable latency and random-failure injection per module (FR-1403).
// Off by default; enabled via FLAKE_LATENCY_MS[_<MODULE>] / FLAKE_FAILURE_RATE[_<MODULE>] env vars.
export function registerFlakeHook(app: FastifyInstance, moduleName: string) {
  app.addHook("onRequest", async (request, reply) => {
    const { latencyMs, failureRate } = moduleFlakeConfig(moduleName);
    if (latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, latencyMs));
    }
    if (failureRate > 0 && Math.random() < failureRate) {
      reply.code(503).send({ error: { code: "INTERNAL_ERROR", message: "Simulated transient failure" } });
    }
  });
}
