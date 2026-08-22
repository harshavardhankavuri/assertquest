import type { FastifyInstance } from "fastify";
import { createPostSchema } from "./discussionSchema.js";
import * as discussionService from "./discussionService.js";
import { authenticate } from "./middleware.js";
import { ApiError } from "../../core/errors.js";

export async function thDiscussionRoutes(app: FastifyInstance) {
  app.get<{ Params: { challengeId: string } }>("/:challengeId", async (request, reply) => {
    reply.send({ posts: await discussionService.listPosts(request.params.challengeId) });
  });

  app.post<{ Params: { challengeId: string } }>(
    "/:challengeId",
    { preHandler: authenticate },
    async (request, reply) => {
      const parsed = createPostSchema.safeParse(request.body);
      if (!parsed.success) {
        throw ApiError.validation("Invalid post payload", parsed.error.flatten());
      }
      const post = await discussionService.createPost(request.params.challengeId, request.thAuth!.userId, parsed.data);
      reply.code(201).send({ post });
    },
  );

  app.post<{ Params: { postId: string } }>(
    "/posts/:postId/upvote",
    { preHandler: authenticate },
    async (request, reply) => {
      reply.send({ post: await discussionService.upvotePost(request.params.postId) });
    },
  );
}
