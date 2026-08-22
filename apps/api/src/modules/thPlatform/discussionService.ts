import { prisma } from "../../core/db.js";
import { ApiError } from "../../core/errors.js";
import type { CreatePostInput } from "./discussionSchema.js";
import type { DiscussionPost } from "@assertquest/shared";
import type { THDiscussionPost as PrismaPost, THUser } from "@prisma/client";

function toPublicPost(p: PrismaPost & { user: THUser }): DiscussionPost {
  return {
    id: p.id,
    challengeId: p.challengeId,
    authorId: p.userId,
    authorName: p.user.publicRealName ? p.user.email : p.user.displayName,
    body: p.body,
    upvotes: p.upvotes,
    createdAt: p.createdAt.toISOString(),
  };
}

// Embedded discussion thread on a challenge page (FR-307) — post/view solutions,
// upvote. Moderation is manual/lightweight only for v1 (PRD §10), so there's no
// report/hide flow here.
export async function listPosts(challengeId: string): Promise<DiscussionPost[]> {
  const challenge = await prisma.tHChallenge.findUnique({ where: { id: challengeId } });
  if (!challenge) throw ApiError.notFound("Challenge not found");

  const posts = await prisma.tHDiscussionPost.findMany({
    where: { challengeId },
    include: { user: true },
    orderBy: [{ upvotes: "desc" }, { createdAt: "asc" }],
  });
  return posts.map(toPublicPost);
}

export async function createPost(challengeId: string, userId: string, input: CreatePostInput): Promise<DiscussionPost> {
  const challenge = await prisma.tHChallenge.findUnique({ where: { id: challengeId } });
  if (!challenge) throw ApiError.notFound("Challenge not found");

  const post = await prisma.tHDiscussionPost.create({
    data: { challengeId, userId, body: input.body },
    include: { user: true },
  });
  return toPublicPost(post);
}

export async function upvotePost(postId: string): Promise<DiscussionPost> {
  const existing = await prisma.tHDiscussionPost.findUnique({ where: { id: postId } });
  if (!existing) throw ApiError.notFound("Post not found");

  const post = await prisma.tHDiscussionPost.update({
    where: { id: postId },
    data: { upvotes: { increment: 1 } },
    include: { user: true },
  });
  return toPublicPost(post);
}
