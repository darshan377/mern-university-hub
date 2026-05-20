import { useGetGamificationStats, useListBadges, useGetLeaderboard, getGetGamificationStatsQueryKey, getListBadgesQueryKey, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import Layout from "@/components/layout";
import { Flame, Star, Crown, Zap, Clock, CheckSquare, Trophy, Target, Medal, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap: Record<string, any> = {
  CheckCircle: CheckSquare, Star, Flame, Trophy, Zap, Clock, Target, Crown, TrendingUp, Medal
};

function BadgeCard({ badge }: { badge: any }) {
  const Icon = iconMap[badge.icon] ?? Star;
  return (
    <div
      data-testid={`badge-${badge.id}`}
      className={`border rounded-xl p-4 flex flex-col items-center text-center transition-all ${
        badge.earned
          ? "bg-primary/5 border-primary/30 hover:shadow-md"
          : "bg-muted/30 border-border opacity-50 grayscale"
      }`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${badge.earned ? "bg-primary/10" : "bg-muted"}`}>
        <Icon className={`w-6 h-6 ${badge.earned ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <p className="text-sm font-semibold text-foreground mb-1">{badge.name}</p>
      <p className="text-xs text-muted-foreground leading-snug">{badge.description}</p>
      <span className={`mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${badge.earned ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
        +{badge.xpReward} XP
      </span>
    </div>
  );
}

export default function Gamification() {
  const { data: statsData, isLoading: statsLoading } = useGetGamificationStats({ query: { queryKey: getGetGamificationStatsQueryKey() } });
  const { data: badgesData } = useListBadges({ query: { queryKey: getListBadgesQueryKey() } });
  const { data: leaderboardData } = useGetLeaderboard({ query: { queryKey: getGetLeaderboardQueryKey() } });

  const stats = statsData as any;
  const badges = (badgesData as any[]) ?? [];
  const leaderboard = (leaderboardData as any[]) ?? [];

  const xpPct = stats ? Math.min(100, ((stats.xp - getXpAtLevel(stats.level)) / stats.xpToNextLevel) * 100) : 0;

  function getXpAtLevel(level: number) {
    let total = 0;
    for (let l = 1; l < level; l++) total += l * 200;
    return total;
  }

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Achievements</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Earn XP, badges, and climb the leaderboard</p>
        </div>

        {statsLoading ? (
          <Skeleton className="h-32 rounded-xl mb-6" />
        ) : (
          <div className="bg-gradient-to-r from-primary to-primary/70 rounded-2xl p-6 mb-6 text-primary-foreground">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-primary-foreground/70 text-sm">Level {stats?.level ?? 1}</p>
                <p className="text-3xl font-bold">{stats?.rank ?? "Bronze I"}</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <Crown className="w-8 h-8 text-yellow-300" />
              </div>
            </div>
            <div className="flex items-center gap-6 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-300" />
                <span>{stats?.streakCount ?? 0} day streak</span>
                <span className="text-primary-foreground/50">(best: {stats?.longestStreak ?? 0})</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-300" />
                <span>{stats?.badgesEarned ?? 0}/{stats?.totalBadges ?? 0} badges</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-primary-foreground/70 mb-1.5">
                <span>{stats?.xp ?? 0} XP</span>
                <span>{stats?.xpToNextLevel ?? 0} XP to next level</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2.5">
                <div
                  data-testid="xp-progress-bar"
                  className="bg-yellow-300 h-2.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, xpPct)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="font-semibold text-foreground mb-4">Badges</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {badges.map((b: any) => <BadgeCard key={b.id} badge={b} />)}
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-foreground mb-4">Leaderboard</h2>
            <div className="bg-card border border-card-border rounded-xl divide-y divide-border">
              {leaderboard.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No data yet</p>
              ) : (
                leaderboard.map((entry: any) => (
                  <div
                    key={entry.userId}
                    data-testid={`leaderboard-${entry.rank}`}
                    className={`flex items-center gap-3 p-3 ${entry.isCurrentUser ? "bg-primary/5" : ""}`}
                  >
                    <span className={`w-6 text-center font-bold text-sm ${
                      entry.rank === 1 ? "text-yellow-500" :
                      entry.rank === 2 ? "text-gray-400" :
                      entry.rank === 3 ? "text-amber-600" : "text-muted-foreground"
                    }`}>
                      {entry.rank}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                      {entry.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${entry.isCurrentUser ? "text-primary" : "text-foreground"}`}>
                        {entry.name} {entry.isCurrentUser && "(you)"}
                      </p>
                      <p className="text-xs text-muted-foreground">Lv.{entry.level} • {entry.streakCount}d streak</p>
                    </div>
                    <span className="text-xs font-semibold text-foreground">{entry.xp.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
