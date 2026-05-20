import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { useGetStudyGroup, useJoinStudyGroup, useLeaveStudyGroup, getGetStudyGroupQueryKey } from "@workspace/api-client-react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Users, BookOpen, UserPlus, UserMinus, Crown, Loader2, Trash2, Plus, Bot, Timer, CheckSquare, KanbanSquare, Play, Square, LogOut, Sparkles, ChevronRight, TriangleAlert } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useGetMe } from "@workspace/api-client-react";
import { getToken } from "@/lib/auth";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");
const headers = (token: string | null) => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` });

type Column = "todo" | "in_progress" | "done";
const COLUMNS: { key: Column; label: string; color: string }[] = [
  { key: "todo", label: "To Do", color: "border-t-slate-400" },
  { key: "in_progress", label: "In Progress", color: "border-t-yellow-400" },
  { key: "done", label: "Completed", color: "border-t-emerald-400" },
];

function TaskBoard({ groupId, isMember }: { groupId: number; isMember: boolean }) {
  const token = getToken();
  const hdrs = headers(token);
  const { toast } = useToast();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [dragging, setDragging] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    const r = await fetch(`${BASE}/api/study-groups/${groupId}/tasks`, { headers: hdrs });
    if (r.ok) setTasks(await r.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, [groupId]);

  const addTask = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    const r = await fetch(`${BASE}/api/study-groups/${groupId}/tasks`, {
      method: "POST", headers: hdrs, body: JSON.stringify({ title: newTitle }),
    });
    if (r.ok) { setNewTitle(""); await load(); toast({ title: "Task added" }); }
    setAdding(false);
  };

  const moveTask = async (taskId: number, column: Column) => {
    await fetch(`${BASE}/api/study-groups/${groupId}/tasks/${taskId}`, {
      method: "PATCH", headers: hdrs, body: JSON.stringify({ column }),
    });
    await load();
  };

  const claimTask = async (taskId: number, isClaimed: boolean) => {
    await fetch(`${BASE}/api/study-groups/${groupId}/tasks/${taskId}`, {
      method: "PATCH", headers: hdrs, body: JSON.stringify({ claim: !isClaimed }),
    });
    await load();
    toast({ title: isClaimed ? "Task unclaimed" : "Task claimed!" });
  };

  const deleteTask = async (taskId: number) => {
    await fetch(`${BASE}/api/study-groups/${groupId}/tasks/${taskId}`, { method: "DELETE", headers: hdrs });
    await load();
  };

  const handleDrop = (e: React.DragEvent, col: Column) => {
    e.preventDefault();
    if (dragging) moveTask(dragging.id, col);
    setDragging(null);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {isMember && (
        <div className="flex gap-2">
          <Input value={newTitle} onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addTask()} placeholder="Add a task to the board..." className="flex-1" />
          <Button onClick={addTask} disabled={adding || !newTitle.trim()} className="gap-1.5">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </Button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.column === col.key);
          return (
            <div key={col.key} className={`bg-muted/30 rounded-xl border-t-4 ${col.color} border border-border p-3 min-h-[200px]`}
              onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, col.key)}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-foreground">{col.label}</h3>
                <Badge variant="secondary" className="text-xs">{colTasks.length}</Badge>
              </div>
              <div className="space-y-2">
                {colTasks.map(task => (
                  <div key={task.id} draggable={isMember} onDragStart={() => setDragging(task)}
                    className="bg-card border border-border rounded-lg p-3 shadow-sm group cursor-grab active:cursor-grabbing">
                    <p className="text-sm font-medium text-foreground mb-1">{task.title}</p>
                    {task.claimedBy && (
                      <p className="text-xs text-primary mb-2">👤 {task.claimerName}</p>
                    )}
                    <div className="flex items-center gap-1 flex-wrap">
                      {isMember && (
                        <>
                          <button onClick={() => claimTask(task.id, !!task.claimedBy)}
                            className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20">
                            {task.claimedBy ? "Unclaim" : "Claim"}
                          </button>
                          {col.key !== "todo" && (
                            <button onClick={() => moveTask(task.id, "todo")}
                              className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground">
                              ← To Do
                            </button>
                          )}
                          {col.key !== "in_progress" && (
                            <button onClick={() => moveTask(task.id, "in_progress")}
                              className="text-xs px-2 py-0.5 rounded bg-yellow-100 hover:bg-yellow-200 text-yellow-700">
                              In Progress
                            </button>
                          )}
                          {col.key !== "done" && (
                            <button onClick={() => moveTask(task.id, "done")}
                              className="text-xs px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-700">
                              Done ✓
                            </button>
                          )}
                          <button onClick={() => deleteTask(task.id)}
                            className="text-xs px-1.5 py-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive ml-auto opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No tasks here</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StudyRoom({ groupId, isMember, currentUserId }: { groupId: number; isMember: boolean; currentUserId: number }) {
  const token = getToken();
  const hdrs = headers(token);
  const { toast } = useToast();
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [duration, setDuration] = useState(25);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadRoom = async () => {
    const r = await fetch(`${BASE}/api/study-groups/${groupId}/room`, { headers: hdrs });
    if (r.ok) {
      const data = await r.json();
      setRoom(data);
      if (data?.startedAt) {
        const elapsed = (Date.now() - new Date(data.startedAt).getTime()) / 1000;
        const remaining = data.timerDuration * 60 - elapsed;
        setTimeLeft(Math.max(0, Math.floor(remaining)));
      } else {
        setTimeLeft(null);
      }
    }
    setLoading(false);
  };

  useEffect(() => { loadRoom(); const t = setInterval(loadRoom, 5000); return () => clearInterval(t); }, [groupId]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeLeft !== null && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft(p => (p !== null && p > 0) ? p - 1 : 0), 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [room?.id, room?.startedAt]);

  const createRoom = async () => {
    setCreating(true);
    await fetch(`${BASE}/api/study-groups/${groupId}/room`, {
      method: "POST", headers: hdrs, body: JSON.stringify({ timerDuration: duration }),
    });
    await loadRoom();
    setCreating(false);
    toast({ title: "Study room created! Others can now join." });
  };

  const joinRoom = async () => {
    await fetch(`${BASE}/api/study-groups/${groupId}/room/join`, { method: "POST", headers: hdrs });
    await loadRoom();
    toast({ title: "Joined the study room!" });
  };

  const startTimer = async () => {
    await fetch(`${BASE}/api/study-groups/${groupId}/room/start`, { method: "POST", headers: hdrs });
    await loadRoom();
  };

  const leaveEarly = async () => {
    await fetch(`${BASE}/api/study-groups/${groupId}/room/leave`, {
      method: "POST", headers: hdrs, body: JSON.stringify({ early: true }),
    });
    await loadRoom();
    toast({ title: "You left early", description: "Tip: staying committed builds better habits!" });
  };

  const endSession = async () => {
    await fetch(`${BASE}/api/study-groups/${groupId}/room/end`, { method: "POST", headers: hdrs });
    await loadRoom();
    toast({ title: "Session ended. Great work!" });
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const isInRoom = room?.members?.some((m: any) => m.userId === currentUserId && !m.leftAt);
  const isCreator = room?.createdBy === currentUserId;
  const activeMembers = room?.members?.filter((m: any) => !m.leftAt) ?? [];
  const earlyLeaves = room?.members?.filter((m: any) => m.leftEarly) ?? [];
  const timerStarted = !!room?.startedAt;
  const timerDone = timeLeft === 0;

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (!room) {
    return (
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-xl p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Timer className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">No Active Study Room</h3>
            <p className="text-sm text-muted-foreground mt-1">Start a synchronized Pomodoro session with your group</p>
          </div>
          {isMember && (
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Duration:</span>
                <select value={duration} onChange={e => setDuration(parseInt(e.target.value))}
                  className="border border-input rounded-lg px-2 py-1 text-sm bg-background">
                  {[10, 15, 20, 25, 30, 45, 60].map(d => <option key={d} value={d}>{d} min</option>)}
                </select>
              </div>
              <Button onClick={createRoom} disabled={creating} className="gap-2">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Create Room
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Active Study Room</h3>
            <p className="text-sm text-muted-foreground">{room.timerDuration}-minute Pomodoro session</p>
          </div>
          {isCreator && (
            <Button variant="outline" size="sm" onClick={endSession} className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10">
              <Square className="w-3.5 h-3.5" />End Session
            </Button>
          )}
        </div>

        <div className="flex items-center justify-center">
          <div className={`w-40 h-40 rounded-full flex flex-col items-center justify-center border-4 ${timerDone ? "border-emerald-400 bg-emerald-50" : timerStarted ? "border-primary bg-primary/5" : "border-border bg-muted/30"}`}>
            {timerStarted ? (
              <>
                <span className="text-3xl font-mono font-bold text-foreground">{formatTime(timeLeft ?? 0)}</span>
                <span className="text-xs text-muted-foreground mt-1">{timerDone ? "Done! 🎉" : "remaining"}</span>
              </>
            ) : (
              <>
                <span className="text-2xl font-bold text-foreground">{room.timerDuration}m</span>
                <span className="text-xs text-muted-foreground mt-1">ready to start</span>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-center">
          {!isInRoom && (
            <Button onClick={joinRoom} className="gap-2">
              <UserPlus className="w-4 h-4" />Join Room
            </Button>
          )}
          {isInRoom && !timerStarted && isCreator && (
            <Button onClick={startTimer} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Play className="w-4 h-4" />Start Timer
            </Button>
          )}
          {isInRoom && timerStarted && !timerDone && (
            <Button variant="outline" onClick={leaveEarly} className="gap-2 text-orange-600 border-orange-300 hover:bg-orange-50">
              <LogOut className="w-4 h-4" />Leave Early
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Active ({activeMembers.length})</h4>
            <div className="space-y-1.5">
              {activeMembers.map((m: any) => (
                <div key={m.userId} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">
                    {m.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-foreground">{m.name}</span>
                  {m.userId === currentUserId && <span className="text-xs text-primary">(you)</span>}
                </div>
              ))}
              {activeMembers.length === 0 && <p className="text-xs text-muted-foreground">No active members</p>}
            </div>
          </div>
          {earlyLeaves.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <TriangleAlert className="w-3 h-3" />Left Early ({earlyLeaves.length})
              </h4>
              <div className="space-y-1.5">
                {earlyLeaves.map((m: any) => (
                  <div key={m.userId} className="flex items-center gap-2 opacity-60">
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold">
                      {m.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-foreground line-through">{m.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AIAssistant({ groupId }: { groupId: number }) {
  const token = getToken();
  const hdrs = headers(token);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const analyze = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/study-groups/${groupId}/ai-insights`, { method: "POST", headers: hdrs });
      if (r.ok) setInsights(await r.json());
      else toast({ title: "AI analysis failed", variant: "destructive" });
    } catch {
      toast({ title: "Error contacting AI", variant: "destructive" });
    }
    setLoading(false);
  };

  const statusColor: Record<string, string> = {
    "on track": "text-emerald-600 bg-emerald-50 border-emerald-200",
    "at risk": "text-yellow-600 bg-yellow-50 border-yellow-200",
    "behind": "text-red-600 bg-red-50 border-red-200",
  };

  return (
    <div className="space-y-4">
      {!insights && (
        <div className="bg-card border border-border rounded-xl p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto">
            <Bot className="w-8 h-8 text-violet-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI Group Assistant</h3>
            <p className="text-sm text-muted-foreground mt-1">Analyzes your group's task board, member progress, and suggests next steps</p>
          </div>
          <Button onClick={analyze} disabled={loading} className="gap-2 bg-violet-600 hover:bg-violet-700">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "Analyzing group..." : "Analyze Group"}
          </Button>
        </div>
      )}

      {insights && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2"><Bot className="w-4 h-4 text-violet-600" />AI Group Insights</h3>
            <Button variant="outline" size="sm" onClick={analyze} disabled={loading} className="gap-1.5">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Refresh
            </Button>
          </div>

          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium ${statusColor[insights.overallStatus] ?? "text-muted-foreground bg-muted"}`}>
            {insights.overallStatus === "on track" ? "✅" : insights.overallStatus === "at risk" ? "⚠️" : "🚨"}
            Group Status: <span className="capitalize">{insights.overallStatus}</span>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 space-y-1">
            <p className="text-sm font-medium text-foreground mb-1">Summary</p>
            <p className="text-sm text-muted-foreground">{insights.summary}</p>
          </div>

          {insights.insights?.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm font-medium text-foreground mb-2">Key Insights</p>
              <ul className="space-y-1.5">
                {insights.insights.map((i: string, idx: number) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />{i}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insights.struggling?.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="text-sm font-medium text-orange-700 mb-2 flex items-center gap-1.5">
                <TriangleAlert className="w-4 h-4" />Members who may need help
              </p>
              <div className="flex flex-wrap gap-2">
                {insights.struggling.map((name: string, idx: number) => (
                  <Badge key={idx} className="bg-orange-100 text-orange-700 border-orange-300">{name}</Badge>
                ))}
              </div>
            </div>
          )}

          {insights.suggestions?.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm font-medium text-foreground mb-2">Suggestions</p>
              <ul className="space-y-1.5">
                {insights.suggestions.map((s: string, idx: number) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-violet-500">→</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insights.topicToReview && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm font-medium text-blue-700">📚 Recommended focus area</p>
              <p className="text-sm text-blue-600 mt-1">{insights.topicToReview}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GroupDetail() {
  const params = useParams<{ id: string }>();
  const groupId = parseInt(params.id ?? "0", 10);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const token = getToken();
  const hdrs = headers(token);
  const [tab, setTab] = useState<"members" | "board" | "room" | "ai">("members");
  const [addMemberEmail, setAddMemberEmail] = useState("");
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [removingMember, setRemovingMember] = useState<number | null>(null);

  const { data: groupData, isLoading } = useGetStudyGroup(groupId, { query: { enabled: !!groupId, queryKey: getGetStudyGroupQueryKey(groupId) } });
  const { data: me } = useGetMe({ query: { queryKey: ["/api/auth/me"] } });

  const group = groupData as any;
  const joinGroup = useJoinStudyGroup();
  const leaveGroup = useLeaveStudyGroup();
  const currentUserId = (me as any)?.id;
  const isMember = group?.members?.some((m: any) => m.userId === currentUserId);
  const isOwner = group?.creatorId === currentUserId;
  const isAdmin = isOwner || group?.members?.find((m: any) => m.userId === currentUserId)?.role === "admin";
  const members = group?.members ?? [];

  const handleJoin = async () => {
    await joinGroup.mutateAsync({ groupId });
    queryClient.invalidateQueries({ queryKey: getGetStudyGroupQueryKey(groupId) });
    toast({ title: "Joined group!" });
  };

  const handleLeave = async () => {
    await leaveGroup.mutateAsync({ groupId });
    queryClient.invalidateQueries({ queryKey: getGetStudyGroupQueryKey(groupId) });
    toast({ title: "Left group" });
  };

  const handleAddMember = async () => {
    if (!addMemberEmail.trim()) return;
    setAddMemberLoading(true);
    try {
      const res = await fetch(`${BASE}/api/study-groups/${groupId}/add-member`, {
        method: "POST", headers: hdrs, body: JSON.stringify({ email: addMemberEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: "Failed to add member", description: data.error, variant: "destructive" }); return; }
      queryClient.invalidateQueries({ queryKey: getGetStudyGroupQueryKey(groupId) });
      setAddMemberEmail(""); setAddMemberOpen(false);
      toast({ title: `${data.user.name} added!` });
    } catch { toast({ title: "Failed to add member", variant: "destructive" }); }
    finally { setAddMemberLoading(false); }
  };

  const handleRemoveMember = async (memberId: number) => {
    setRemovingMember(memberId);
    try {
      await fetch(`${BASE}/api/study-groups/${groupId}/members/${memberId}`, { method: "DELETE", headers: hdrs });
      queryClient.invalidateQueries({ queryKey: getGetStudyGroupQueryKey(groupId) });
      toast({ title: "Member removed" });
    } catch { toast({ title: "Failed to remove member", variant: "destructive" }); }
    finally { setRemovingMember(null); }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (!group) {
    return (
      <Layout>
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Group not found</p>
          <Link href="/groups"><Button variant="link">Back to groups</Button></Link>
        </div>
      </Layout>
    );
  }

  const TABS = [
    { key: "members" as const, label: "Members", icon: Users },
    { key: "board" as const, label: "Task Board", icon: KanbanSquare },
    { key: "room" as const, label: "Study Room", icon: Timer },
    { key: "ai" as const, label: "AI Assistant", icon: Bot },
  ];

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <Link href="/groups">
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors">
            <ArrowLeft className="w-4 h-4" />Back to groups
          </button>
        </Link>

        <div className="bg-card border border-card-border rounded-xl p-5 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{group.name}</h1>
                {group.course && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                    <BookOpen className="w-3.5 h-3.5" />{group.course}
                  </div>
                )}
                {group.description && <p className="text-sm text-muted-foreground mt-1">{group.description}</p>}
              </div>
            </div>
            {!isOwner && (
              isMember ? (
                <Button variant="outline" size="sm" onClick={handleLeave} disabled={leaveGroup.isPending} className="text-destructive hover:bg-destructive/10">
                  <UserMinus className="w-3.5 h-3.5 mr-1.5" />Leave
                </Button>
              ) : (
                <Button size="sm" onClick={handleJoin} disabled={joinGroup.isPending}>
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" />Join
                </Button>
              )
            )}
          </div>
        </div>

        <div className="flex border-b border-border mb-5 gap-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        {tab === "members" && (
          <div className="bg-card border border-card-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Members ({members.length})</h2>
              {isAdmin && (
                <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <UserPlus className="w-3.5 h-3.5" />Add Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add a Member</DialogTitle></DialogHeader>
                    <p className="text-sm text-muted-foreground">Enter the student's email address.</p>
                    <div className="space-y-3 mt-2">
                      <Input type="email" placeholder="student@university.edu" value={addMemberEmail}
                        onChange={e => setAddMemberEmail(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleAddMember()} />
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setAddMemberOpen(false)}>Cancel</Button>
                        <Button className="flex-1 gap-2" onClick={handleAddMember}
                          disabled={!addMemberEmail.trim() || addMemberLoading}>
                          {addMemberLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                          Add Member
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No members yet</p>
            ) : (
              <div className="space-y-3">
                {members.map((m: any) => (
                  <div key={m.userId} className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                      {m.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        {m.name}
                        {m.userId === group.creatorId && <Crown className="w-3.5 h-3.5 text-yellow-500" />}
                        {m.userId === currentUserId && <span className="text-xs text-primary">(you)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">Lv.{m.level} · {m.xp} XP · {m.streakCount}d streak</p>
                    </div>
                    <div className="text-xs text-muted-foreground">{m.focusMinutesThisWeek}m this week</div>
                    {isAdmin && m.userId !== currentUserId && (
                      <button onClick={() => handleRemoveMember(m.userId)} disabled={removingMember === m.userId}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground">
                        {removingMember === m.userId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "board" && (
          isMember
            ? <TaskBoard groupId={groupId} isMember={isMember} />
            : <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground text-sm">Join the group to access the Task Board</div>
        )}

        {tab === "room" && (
          isMember
            ? <StudyRoom groupId={groupId} isMember={isMember} currentUserId={currentUserId} />
            : <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground text-sm">Join the group to access Study Rooms</div>
        )}

        {tab === "ai" && (
          isMember
            ? <AIAssistant groupId={groupId} />
            : <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground text-sm">Join the group to use the AI Assistant</div>
        )}
      </div>
    </Layout>
  );
}
