import { useState } from "react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CalendarDays, CheckCircle2, Clock, Sparkles, PlayCircle, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type Block = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  taskId: number | null;
  goalText: string;
  status: string;
  taskTitle?: string;
  taskCourse?: string;
};

type Plan = {
  plan_id: number;
  blocks: Block[];
  explanation: string;
  meta: { horizonDays: number; sessionMinutes: number; blockCount: number };
};

const statusColor: Record<string, string> = {
  scheduled: "bg-blue-50 border-blue-200",
  completed: "bg-green-50 border-green-200",
  missed: "bg-red-50 border-red-200",
  skipped: "bg-gray-50 border-gray-200",
};

export default function StudyPlans() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [horizonDays, setHorizonDays] = useState("7");
  const [sessionMinutes, setSessionMinutes] = useState("25");
  const [maxSessions, setMaxSessions] = useState("4");
  const [updatingBlock, setUpdatingBlock] = useState<number | null>(null);
  const { toast } = useToast();
  const token = localStorage.getItem("procrastistop_token");

  const generatePlan = async () => {
    setLoading(true);
    try {
      const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/api/study-plans/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          horizon_days: parseInt(horizonDays),
          session_minutes: parseInt(sessionMinutes),
          max_sessions_per_day: parseInt(maxSessions),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setPlan(data);
      toast({ title: "Study plan generated!", description: `${data.blocks.length} sessions scheduled over ${horizonDays} days.` });
    } catch {
      toast({ title: "Failed to generate plan", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateBlockStatus = async (blockId: number, status: string) => {
    if (!plan) return;
    setUpdatingBlock(blockId);
    try {
      const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "");
      await fetch(`${baseUrl}/api/study-plans/${plan.plan_id}/blocks/${blockId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      setPlan(p => p ? {
        ...p,
        blocks: p.blocks.map(b => b.id === blockId ? { ...b, status } : b),
      } : p);
    } catch {
      toast({ title: "Failed to update block", variant: "destructive" });
    } finally {
      setUpdatingBlock(null);
    }
  };

  const byDate = plan?.blocks.reduce((acc, block) => {
    if (!acc[block.date]) acc[block.date] = [];
    acc[block.date].push(block);
    return acc;
  }, {} as Record<string, Block[]>) ?? {};

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Smart Study Planner
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">AI generates a personalized schedule based on your tasks and deadlines</p>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-foreground mb-4">Configure your plan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Plan Duration</label>
              <Select value={horizonDays} onValueChange={setHorizonDays}>
                <SelectTrigger data-testid="select-horizon"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="5">5 days</SelectItem>
                  <SelectItem value="7">1 week</SelectItem>
                  <SelectItem value="14">2 weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Session Length</label>
              <Select value={sessionMinutes} onValueChange={setSessionMinutes}>
                <SelectTrigger data-testid="select-session"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 minutes</SelectItem>
                  <SelectItem value="25">25 minutes (Pomodoro)</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="50">50 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Max Sessions/Day</label>
              <Select value={maxSessions} onValueChange={setMaxSessions}>
                <SelectTrigger data-testid="select-max-sessions"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6, 8].map(n => <SelectItem key={n} value={String(n)}>{n} sessions</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button data-testid="button-generate-plan" onClick={generatePlan} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "Generating your plan..." : "Generate Study Plan"}
          </Button>
        </div>

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        )}

        {plan && !loading && (
          <div>
            {plan.explanation && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-5 flex gap-3">
                <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{plan.explanation}</p>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">
                {plan.meta.blockCount} sessions scheduled
              </h2>
              <div className="flex gap-4 text-xs text-muted-foreground">
                {[["scheduled", "blue"], ["completed", "green"], ["missed", "red"]].map(([s, c]) => (
                  <span key={s} className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full bg-${c}-400`} />
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, blocks]) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">
                      {new Date(date + "T12:00:00").toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" })}
                    </span>
                    <span className="text-xs text-muted-foreground">• {blocks.length} session{blocks.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="space-y-2 ml-5">
                    {blocks.map(block => (
                      <div
                        key={block.id}
                        data-testid={`study-block-${block.id}`}
                        className={`border rounded-xl p-4 flex items-start gap-3 ${statusColor[block.status] ?? "bg-card border-card-border"}`}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {block.status === "completed"
                            ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                            : <Clock className="w-4 h-4 text-blue-500" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{block.goalText}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{block.startTime} – {block.endTime}</span>
                            {block.taskCourse && <span>{block.taskCourse}</span>}
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          {block.status === "scheduled" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-green-600 hover:bg-green-100"
                                onClick={() => updateBlockStatus(block.id, "completed")}
                                disabled={updatingBlock === block.id}
                              >
                                {updatingBlock === block.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                                Done
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-red-500 hover:bg-red-50"
                                onClick={() => updateBlockStatus(block.id, "missed")}
                                disabled={updatingBlock === block.id}
                              >
                                Skip
                              </Button>
                            </>
                          )}
                          {block.status !== "scheduled" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => updateBlockStatus(block.id, "scheduled")}
                              disabled={updatingBlock === block.id}
                            >
                              Reset
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!plan && !loading && (
          <div className="text-center py-16 text-muted-foreground">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No plan generated yet</p>
            <p className="text-sm">Configure your preferences above and click Generate</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
