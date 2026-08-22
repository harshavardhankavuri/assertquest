import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getModule, allModuleNames } from "./moduleRegistry.js";
import { ApiError } from "./errors.js";

const querySchema = z.object({ module: z.string().optional() });

// Test-control surface (FR-1401): seeds or resets one module's data, or all modules
// when `module` is omitted. Never exposed on a production-with-real-users deployment —
// this is a practice sandbox, so it's intentionally unauthenticated for self-host ease.
export async function testControlRoutes(app: FastifyInstance) {
  app.post("/seed", async (request, reply) => {
    const { module: moduleName } = querySchema.parse(request.query);
    const targets = moduleName ? [moduleName] : allModuleNames();

    for (const name of targets) {
      const mod = getModule(name);
      if (!mod) throw ApiError.notFound(`Unknown module "${name}"`);
      await mod.seed();
    }
    reply.send({ seeded: targets });
  });

  app.post("/reset", async (request, reply) => {
    const { module: moduleName } = querySchema.parse(request.query);
    const targets = moduleName ? [moduleName] : allModuleNames();

    for (const name of targets) {
      const mod = getModule(name);
      if (!mod) throw ApiError.notFound(`Unknown module "${name}"`);
      await mod.reset();
    }
    reply.send({ reset: targets });
  });
}
