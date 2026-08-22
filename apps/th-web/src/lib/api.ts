import type {
  THAuthResponse,
  THRegisterRequest,
  THLoginRequest,
  THUser,
  ChallengeListResponse,
  ChallengeListQuery,
  ChallengeListItem,
  Challenge,
  ProfileSummary,
  LeaderboardEntry,
  LeaderboardRange,
  DiscussionPost,
  ActivityEntry,
  ApiErrorBody,
} from "@assertquest/shared";

export class ApiRequestError extends Error {
  code: string;
  status: number;

  constructor(body: ApiErrorBody, status: number) {
    super(body.error.message);
    this.code = body.error.code;
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/th${path}`, {
    ...init,
    headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
  });
  if (!res.ok) {
    const body = (await res.json()) as ApiErrorBody;
    throw new ApiRequestError(body, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function authed<T>(path: string, accessToken: string | null, init?: RequestInit): Promise<T> {
  return request<T>(path, {
    ...init,
    headers: { ...init?.headers, ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
  });
}

export const api = {
  register: (payload: THRegisterRequest) =>
    request<THAuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(payload) }),

  login: (payload: THLoginRequest) =>
    request<THAuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(payload) }),

  me: (accessToken: string) => authed<{ user: THUser }>("/auth/me", accessToken),

  updateProfile: (accessToken: string, publicRealName: boolean) =>
    authed<{ user: THUser }>("/auth/me", accessToken, { method: "PATCH", body: JSON.stringify({ publicRealName }) }),

  listChallenges: (query: ChallengeListQuery, accessToken: string | null) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) search.set(key, String(value));
    }
    const qs = search.toString();
    return authed<ChallengeListResponse>(`/challenges${qs ? `?${qs}` : ""}`, accessToken);
  },

  getChallenge: (id: string, accessToken: string | null) =>
    authed<{ challenge: ChallengeListItem }>(`/challenges/${id}`, accessToken),

  getRelatedChallenges: (id: string) => request<{ challenges: Challenge[] }>(`/challenges/${id}/related`),

  resetChallenge: (id: string) => request<{ reset: string }>(`/challenges/${id}/reset`, { method: "POST" }),

  startChallenge: (id: string, accessToken: string) =>
    authed<void>(`/challenges/${id}/start`, accessToken, { method: "POST" }),

  clearChallenge: (id: string, accessToken: string) =>
    authed<void>(`/challenges/${id}/clear`, accessToken, { method: "POST" }),

  getProfile: (userId: string) => request<ProfileSummary>(`/profile/${userId}`),

  resetProgress: (accessToken: string, module?: string) =>
    authed<{ reset: boolean; module: string }>(`/profile/me/reset-progress${module ? `?module=${module}` : ""}`, accessToken, {
      method: "POST",
    }),

  getLeaderboard: (module: string | undefined, range: LeaderboardRange) => {
    const search = new URLSearchParams({ range });
    if (module) search.set("module", module);
    return request<{ entries: LeaderboardEntry[] }>(`/leaderboard?${search.toString()}`);
  },

  listDiscussionPosts: (challengeId: string) => request<{ posts: DiscussionPost[] }>(`/discussion/${challengeId}`),

  createDiscussionPost: (challengeId: string, body: string, accessToken: string) =>
    authed<{ post: DiscussionPost }>(`/discussion/${challengeId}`, accessToken, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),

  upvotePost: (postId: string, accessToken: string) =>
    authed<{ post: DiscussionPost }>(`/discussion/posts/${postId}/upvote`, accessToken, { method: "POST" }),

  getRecentActivity: (limit = 20) => request<{ entries: ActivityEntry[] }>(`/activity?limit=${limit}`),
};

// The live SwiftCargo instance to send learners to (FR-304) — configurable per
// deployment since a self-hosted AssertQuest points at its own SwiftCargo, not the
// public demo's.
export const SWIFTCARGO_URL: string = import.meta.env.VITE_SWIFTCARGO_URL ?? "http://localhost:5173";
