import { useState, useEffect, useRef } from "react";
import { useListTasks, useListFocusSessions, useCreateFocusSession, useUpdateFocusSession, getListFocusSessionsQueryKey, getListTasksQueryKey } from "@workspace/api-client-react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Square, Timer, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type TimerState = "idle" | "running" | "paused" | "done";

export default function Focus() {
  const [selectedTaskId, setSelectedTaskId] = useState<string>("none");
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasksData } = useListTasks({}, { query: { queryKey: getListTasksQueryKey({}) } });
  const tasks = (tasksData as any[])?.filter((t: any) => t.status !== "completed") ?? [];
  const { data: sessionsData } = useListFocusSessions({ period: "week" }, { query: { queryKey: getListFocusSessionsQueryKey({ period: "week" }) } });
  const sessions = (sessionsData as any[]) ?? [];

  const createSession = useCreateFocusSession();
  const updateSession = useUpdateFocusSession();

  useEffect(() => {
    if (timerState === "running") {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current!);
            handleComplete();
            return 0;
          }
          return t - 1;
        });
        setElapsed(e => e + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerState]);

  const handleStart = async () => {
    const taskId = selectedTaskId !== "none" ? parseInt(selectedTaskId, 10) : undefined;
    const session = await createSession.mutateAsync({ data: { durationMinutes: duration, taskId } });
    setSessionId((session as any).id);
    setTimeLeft(duration * 60);
    setElapsed(0);
    setTimerState("running");
    toast({ title: "Focus session started!", description: `${duration} minutes on the clock.` });
  };

  const handlePause = () => setTimerState("paused");
  const handleResume = () => setTimerState("running");

  const handleStop = async () => {
    setTimerState("idle");
    if (sessionId) {
      await updateSession.mutateAsync({ sessionId, data: { status: "cancelled", actualMinutes: Math.floor(elapsed / 60) } });
      queryClient.invalidateQueries({ queryKey: getListFocusSessionsQueryKey({ period: "week" }) });
    }
    setSessionId(null);
    setTimeLeft(duration * 60);
    setElapsed(0);
  };

  const handleComplete = async () => {
    setTimerState("done");
    const actualMinutes = Math.max(1, Math.floor(elapsed / 60));
    if (sessionId) {
      await updateSession.mutateAsync({ sessionId, data: { status: "completed", actualMinutes } });
      queryClient.invalidateQueries({ queryKey: getListFocusSessionsQueryKey({ period: "week" }) });
      toast({ title: `Great work! ${actualMinutes * 2} XP earned`, description: "Session complete. Take a break!" });
    }
    setSessionId(null);
    setElapsed(0);
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const totalSecs = duration * 60;
  const progressPct = ((totalSecs - timeLeft) / totalSecs) * 100;
  const circumference = 2 * Math.PI * 90;

  const completedToday = sessions.filter((s: any) => {
    const d = new Date(s.startedAt);
    const today = new Date();
    return d.toDateString() === today.toDateString() && s.status === "completed";
  });
  const totalMinToday = completedToday.reduce((acc: number, s: any) => acc + (s.actualMinutes ?? s.durationMinutes), 0);

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Focus Timer</h1>
          <p className="text-sm text-muted-foreground">Pomodoro-style deep work sessions</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card border border-card-border rounded-2xl p-8 flex flex-col items-center">
            <div className="relative w-48 h-48 mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="90" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <circle
                  cx="100" cy="100" r="90"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (progressPct / 100) * circumference}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span data-testid="text-timer" className="text-4xl font-bold font-mono text-foreground">
                  {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                </span>
                <span className="text-xs text-muted-foreground mt-1 capitalize">{timerState === "idle" ? "ready" : timerState}</span>
              </div>
            </div>

            {timerState === "idle" && (
              <div className="w-full space-y-3 mb-5">
                <Select value={String(duration)} onValueChange={(v) => { setDuration(Number(v)); setTimeLeft(Number(v) * 60); }}>
                  <SelectTrigger data-testid="select-duration"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[15, 20, 25, 30, 45, 50, 60].map(d => (
                      <SelectItem key={d} value={String(d)}>{d} minutes</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                  <SelectTrigger data-testid="select-task"><SelectValue placeholder="Select a task (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific task</SelectItem>
                    {tasks.map((t: any) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-3">
              {timerState === "idle" && (
                <Button data-testid="button-start-timer" onClick={handleStart} size="lg" className="gap-2">
                  <Play className="w-4 h-4" /> Start
                </Button>
              )}
              {timerState === "running" && (
                <>
                  <Button data-testid="button-pause-timer" onClick={handlePause} variant="outline" size="lg" className="gap-2">
                    <Pause className="w-4 h-4" /> Pause
                  </Button>
                  <Button data-testid="button-stop-timer" onClick={handleStop} variant="destructive" size="lg" className="gap-2">
                    <Square className="w-4 h-4" /> Stop
                  </Button>
                </>
              )}
              {timerState === "paused" && (
                <>
                  <Button data-testid="button-resume-timer" onClick={handleResume} size="lg" className="gap-2">
                    <Play className="w-4 h-4" /> Resume
                  </Button>
                  <Button data-testid="button-stop-timer-paused" onClick={handleStop} variant="outline" size="lg" className="gap-2">
                    <Square className="w-4 h-4" /> Stop
                  </Button>
                </>
              )}
              {timerState === "done" && (
                <Button data-testid="button-reset-timer" onClick={() => { setTimerState("idle"); setTimeLeft(duration * 60); }} size="lg" className="gap-2">
                  <Timer className="w-4 h-4" /> New Session
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-card border border-card-border rounded-xl p-5">
              <h2 className="font-semibold text-foreground mb-3">Today</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-foreground">{completedToday.length}</p>
                  <p className="text-xs text-muted-foreground">Sessions</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-foreground">{totalMinToday}</p>
                  <p className="text-xs text-muted-foreground">Minutes</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-card-border rounded-xl p-5 flex-1">
              <h2 className="font-semibold text-foreground mb-3">Recent Sessions</h2>
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No sessions this week yet</p>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto">
                  {[...sessions].reverse().slice(0, 10).map((s: any) => (
                    <div key={s.id} data-testid={`session-${s.id}`} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${s.status === "completed" ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground truncate">{s.taskTitle ?? "Free focus"}</p>
                        <p className="text-xs text-muted-foreground">{new Date(s.startedAt).toLocaleDateString()}</p>
                      </div>
                      <span className="flex-shrink-0 text-xs text-muted-foreground">
                        {s.actualMinutes ?? s.durationMinutes} min
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
