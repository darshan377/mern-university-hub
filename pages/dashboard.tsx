import { useGetDashboardSummary, useGetUpcomingDeadlines, useGetProductivityTrend, useGetCourseProgress, getGetDashboardSummaryQueryKey, getGetUpcomingDeadlinesQueryKey, getGetProductivityTrendQueryKey, getGetCourseProgressQueryKey } from "@workspace/api-client-react";
import Layout from "@/components/layout";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Flame, Zap, Clock, CheckSquare, AlertCircle, Trophy, Bell } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

function StatCard({ icon: Icon, label, value, color, sub }: { icon: any; label: string; value: string | number; color: string; sub?: string }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: sumLoading } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: deadlines } = useGetUpcomingDeadlines({}, { query: { queryKey: getGetUpcomingDeadlinesQueryKey({}) } });
  const { data: trend } = useGetProductivityTrend({}, { query: { queryKey: getGetProductivityTrendQueryKey({}) } });
  const { data: courseProgress } = useGetCourseProgress({ query: { queryKey: getGetCourseProgressQueryKey() } });

  const s = summary as any;
  const dl = (deadlines as any[]) ?? [];
  const trendData = (trend as any[]) ?? [];
  const courses = (courseProgress as any[]) ?? [];

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your productivity overview at a glance</p>
        </div>

        {sumLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={Flame} label="Streak" value={`${s?.currentStreak ?? 0} days`} color="bg-orange-100 text-orange-600" />
            <StatCard icon={Zap} label="Level" value={`Lv. ${s?.level ?? 1}`} color="bg-yellow-100 text-yellow-600" sub={`${s?.xp ?? 0} XP`} />
            <StatCard icon={Clock} label="Focus Today" value={`${s?.todayFocusMinutes ?? 0} min`} color="bg-blue-100 text-blue-600" sub={`${s?.weekFocusMinutes ?? 0} min this week`} />
            <StatCard icon={CheckSquare} label="Tasks Done" value={s?.completedTasks ?? 0} color="bg-green-100 text-green-600" sub={`${s?.pendingTasks ?? 0} pending`} />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-5">
            <h2 className="font-semibold text-foreground mb-4">Focus Time This Week</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={trendData.slice(-7)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => new Date(v).toLocaleDateString("en", { weekday: "short" })} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} min`, "Focus"]} />
                <Bar dataKey="focusMinutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-card-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Upcoming Deadlines</h2>
              {s?.unreadNotifications > 0 && (
                <Link href="/notifications">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <Bell className="w-3.5 h-3.5" />
                    {s.unreadNotifications}
                  </span>
                </Link>
              )}
            </div>
            {dl.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No upcoming deadlines</p>
            ) : (
              <div className="space-y-2.5">
                {dl.slice(0, 5).map((task: any) => {
                  const daysLeft = task.deadline ? Math.ceil((new Date(task.deadline).getTime() - Date.now()) / 86400000) : null;
                  return (
                    <Link key={task.id} href={`/tasks/${task.id}`}>
                      <div data-testid={`deadline-task-${task.id}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          task.priority === "critical" ? "bg-red-500" :
                          task.priority === "high" ? "bg-orange-400" :
                          task.priority === "medium" ? "bg-yellow-400" : "bg-green-400"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                          {task.course && <p className="text-xs text-muted-foreground">{task.course}</p>}
                        </div>
                        {daysLeft !== null && (
                          <span className={`text-xs font-medium flex-shrink-0 ${
                            daysLeft <= 1 ? "text-red-500" : daysLeft <= 3 ? "text-orange-500" : "text-muted-foreground"
                          }`}>
                            {daysLeft === 0 ? "Today" : daysLeft < 0 ? "Overdue" : `${daysLeft}d`}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
                {dl.length > 5 && (
                  <Link href="/tasks">
                    <p className="text-xs text-primary text-center pt-1 hover:underline">View all {dl.length} deadlines</p>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {courses.length > 0 && (
          <div className="bg-card border border-card-border rounded-xl p-5">
            <h2 className="font-semibold text-foreground mb-4">Course Progress</h2>
            <div className="space-y-3">
              {courses.map((c: any) => (
                <div key={c.course} data-testid={`course-progress-${c.course}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-foreground">{c.course}</span>
                    <span className="text-xs text-muted-foreground">{c.completionPercent}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${c.completionPercent}%` }}
                    />
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                    <span>{c.completedTasks} done</span>
                    <span>{c.pendingTasks} pending</span>
                    {c.overdueTasks > 0 && <span className="text-red-500">{c.overdueTasks} overdue</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
