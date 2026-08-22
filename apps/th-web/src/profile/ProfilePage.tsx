import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { ProfileSummary } from "@assertquest/shared";
import { Alert, Badge, Button, Card, PageHeader, StatTile } from "@assertquest/shared/ui";
import { useAuth } from "../auth/AuthContext.js";
import { api, ApiRequestError } from "../lib/api.js";

export function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user, accessToken, refreshUser } = useAuth();
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isOwnProfile = user?.id === userId;

  function reload() {
    if (!userId) return;
    api
      .getProfile(userId)
      .then(setProfile)
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Could not load this profile."));
  }

  useEffect(reload, [userId]);

  async function onResetModule(module?: string) {
    if (!accessToken) return;
    setNotice(null);
    try {
      await api.resetProgress(accessToken, module);
      setNotice(module ? `Progress for "${module}" reset.` : "All progress reset.");
      reload();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not reset progress.");
    }
  }

  async function onTogglePublicRealName() {
    if (!accessToken || !user) return;
    await api.updateProfile(accessToken, !user.publicRealName);
    await refreshUser();
  }

  if (error)
    return (
      <main>
        <Alert tone="error">{error}</Alert>
      </main>
    );
  if (!profile) return null;

  return (
    <main>
      <div className="motion-safe:animate-fade-in-up">
        <PageHeader title={`${profile.displayName}'s Profile`} />

        <div className="mb-6 grid grid-cols-2 gap-4 sm:max-w-sm">
          <StatTile value={profile.totalCleared} label="Cleared" />
          <StatTile value={profile.totalChallenges} label="Total challenges" />
        </div>

        {isOwnProfile && user && (
          <Card className="mb-6">
            <label className="flex items-center gap-3 text-sm text-navy-700">
              <input
                type="checkbox"
                checked={user.publicRealName}
                onChange={onTogglePublicRealName}
                className="h-4 w-4 rounded border-mist-300 text-teal-600 focus:outline focus:outline-2 focus:outline-teal-200"
              />
              Show my email instead of my anonymized name on the leaderboard and in discussions
            </label>
          </Card>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-mist-200 shadow-sm transition-colors hover:border-navy-300">
        <table className="w-full divide-y divide-mist-200 bg-white text-sm">
          <thead className="bg-mist-100 text-xs uppercase tracking-wide text-navy-600">
            <tr>
              <th className="px-4 py-3 text-left">Module</th>
              <th className="px-4 py-3 text-left">Cleared</th>
              {isOwnProfile && <th className="px-4 py-3 text-left">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-mist-200">
            {profile.byModule.map((m) => (
              <tr key={m.module} className="transition-colors hover:bg-foam-100 focus-within:bg-foam-100">
                <td className="px-4 py-3 font-mono text-xs text-navy-600">{m.module}</td>
                <td className="px-4 py-3">
                  <Badge tone={m.cleared >= m.totalChallenges && m.totalChallenges > 0 ? "success" : "neutral"}>
                    {m.cleared} / {m.totalChallenges}
                  </Badge>
                </td>
                {isOwnProfile && (
                  <td className="px-4 py-3">
                    <Button type="button" variant="ghost" onClick={() => onResetModule(m.module)}>
                      Reset progress
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {notice && (
        <div className="mt-6">
          <Alert tone="success">{notice}</Alert>
        </div>
      )}
    </main>
  );
}
