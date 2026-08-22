import type { Challenge, ChallengeDifficulty, ChallengeStatus, ChallengeSurface } from "./challenges.js";

export interface THUser {
  id: string;
  email: string;
  displayName: string;
  publicRealName: boolean;
  role: "learner" | "admin";
  createdAt: string;
}

export interface THRegisterRequest {
  email: string;
  password: string;
}

export interface THLoginRequest {
  email: string;
  password: string;
}

export interface THAuthResponse {
  user: THUser;
  accessToken: string;
}

export interface ChallengeListItem extends Challenge {
  status?: ChallengeStatus;
}

export interface ChallengeListResponse {
  challenges: ChallengeListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ChallengeListQuery {
  module?: string;
  class?: ChallengeDifficulty;
  surface?: ChallengeSurface;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface ModuleProgressSummary {
  module: string;
  totalChallenges: number;
  cleared: number;
}

export interface ProfileSummary {
  userId: string;
  displayName: string;
  totalChallenges: number;
  totalCleared: number;
  byModule: ModuleProgressSummary[];
}

export const LEADERBOARD_RANGES = ["all", "month", "week"] as const;
export type LeaderboardRange = (typeof LEADERBOARD_RANGES)[number];

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  clearedCount: number;
}

export interface DiscussionPost {
  id: string;
  challengeId: string;
  authorId: string;
  authorName: string;
  body: string;
  upvotes: number;
  createdAt: string;
}

export interface CreateDiscussionPostRequest {
  body: string;
}

// Recent solved-challenge activity, shown on the Community page (FR-401).
export interface ActivityEntry {
  userId: string;
  name: string;
  challengeId: string;
  challengeTitle: string;
  clearedAt: string;
}
