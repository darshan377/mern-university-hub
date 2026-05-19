import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetTask, useUpdateTask, useCreateSubtask, useUpdateSubtask, useDeleteSubtask, useCreateFocusSession, getGetTaskQueryKey } from "@workspace/api-client-react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, Circle, Trash2, Plus, Timer, ArrowLeft, Loader2, Sparkles, Check, Edit2, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const priorityColor: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

type AISuggestion = {
  title: string;
  description?: string;
  estimated_minutes?: number;
  order?: number;
  difficulty?: number;
};

export default function TaskDetail() {
  const params = useParams<{ id: string }>();
  const taskId = parseInt(params.id ?? "0", 10);
  const [, setLocation] = useLocation();
  const [newSubtask, setNewSubtask] = useState("");
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [firstTinyStep, setFirstTinyStep] = useState<{ title: string; estimated_minutes: number } | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [editedTitles, setEditedTitles] = useState<Record<number, string>>({});
  const [accepting, setAccepting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const token = localStorage.getItem("procrastistop_token");

  const { data: taskData, isLoading } = useGetTask(taskId, { query: { enabled: !!taskId, queryKey: getGetTaskQueryKey(taskId) } });
  const task = taskData as any;

  const updateTask = useUpdateTask();
  const createSubtask = useCreateSubtask();
  const updateSubtask = useUpdateSubtask();
  const deleteSubtask = useDeleteSubtask();
  const createFocusSession = useCreateFocusSession();

  const addSubtask = async () => {
    if (!newSubtask.trim()) return;
    await createSubtask.mutateAsync({ taskId, data: { title: newSubtask.trim() } });
    queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(taskId) });
    setNewSubtask("");
  };

  const toggleSubtask = async (subtaskId: number, completed: boolean) => {
    await updateSubtask.mutateAsync({ taskId, subtaskId, data: { completed: !completed } });
    queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(taskId) });
  };

  const removeSubtask = async (subtaskId: number) => {
    await deleteSubtask.mutateAsync({ taskId, subtaskId });
    queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(taskId) });
  };

  const startFocus = async () => {
    await createFocusSession.mutateAsync({ data: { taskId, durationMinutes: 25 } });
    toast({ title: "Focus session started!", description: "Head to Focus to track your time." });
    setLocation("/focus");
  };

  const handleStatusChange = async (status: string) => {
    await updateTask.mutateAsync({ taskId, data: { status } });
    queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(taskId) });
    toast({ title: status === "completed" ? "Task completed! +50 XP" : "Status updated" });
  };

  const runAiBreakdown = async () => {
    setAiLoading(true);
    setAiDialogOpen(true);
    try {
      const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/api/tasks/${taskId}/ai-breakdown`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ preferences: { maxSubtasks: 6, granularity: "medium" } }),
      });
      const data = await res.json();
      setAiSuggestions(data.suggestions ?? []);
      setFirstTinyStep(data.first_tiny_step ?? null);
      const all = new Set<number>(data.suggestions?.map((_: any, i: number) => i) ?? []);
      setSelectedSuggestions(all);
    } catch {
      toast({ title: "AI breakdown failed", description: "Try again in a moment", variant: "destructive" });
      setAiDialogOpen(false);
    } finally {
      setAiLoading(false);
    }
  };

  const acceptSuggestions = async () => {
    const toAccept = aiSuggestions
      .filter((_, i) => selectedSuggestions.has(i))
      .map((s, i) => ({
        title: editedTitles[i] ?? s.title,
        estimated_minutes: s.estimated_minutes,
        order: s.order ?? i + 1,
      }));

    if (toAccept.length === 0) return;
    setAccepting(true);
    try {
      const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "");
      await fetch(`${baseUrl}/api/tasks/${taskId}/ai-breakdown/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subtasks: toAccept }),
      });
      queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(taskId) });
      setAiDialogOpen(false);
      toast({ title: `${toAccept.length} subtasks added!`, description: "AI breakdown accepted." });
    } catch {
      toast({ title: "Failed to save subtasks", variant: "destructive" });
    } finally {
      setAccepting(false);
    }
  };

  const toggleSuggestion = (i: number) => {
    setSelectedSuggestions(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (!task) {
    return (
      <Layout>
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Task not found</p>
          <Link href="/tasks"><Button variant="link">Back to tasks</Button></Link>
        </div>
      </Layout>
    );
  }

  const subtasks = task.subtasks ?? [];

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto">
        <Link href="/tasks">
          <button data-testid="button-back" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to tasks
          </button>
        </Link>

        <div className="bg-card border border-card-border rounded-xl p-6 mb-4">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-xl font-bold text-foreground">{task.title}</h1>
            <Badge variant="outline" className={priorityColor[task.priority] ?? ""}>{task.priority}</Badge>
          </div>

          {task.description && <p className="text-sm text-muted-foreground mb-4">{task.description}</p>}

          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-5">
            {task.course && <span className="bg-muted rounded-md px-2.5 py-1 text-xs">{task.course}</span>}
            {task.deadline && <span className="bg-muted rounded-md px-2.5 py-1 text-xs">Due: {new Date(task.deadline).toLocaleDateString()}</span>}
            {task.focusMinutes > 0 && (
              <span className="flex items-center gap-1.5 bg-muted rounded-md px-2.5 py-1 text-xs">
                <Timer className="w-3 h-3" />{task.focusMinutes} min focused
              </span>
            )}
          </div>

          {subtasks.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Progress</span>
                <span className="text-xs text-muted-foreground">{task.completionPercent}%</span>
              </div>
              <Progress value={task.completionPercent} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{task.subtaskCompleted} of {task.subtaskCount} subtasks done</p>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {["pending", "in_progress", "completed"].map(s => (
              <Button key={s} data-testid={`button-status-${s}`} variant={task.status === s ? "default" : "outline"} size="sm" onClick={() => handleStatusChange(s)} disabled={updateTask.isPending}>
                {s.replace("_", " ")}
              </Button>
            ))}
            <div className="ml-auto flex gap-2">
              <Button data-testid="button-ai-breakdown" variant="outline" size="sm" onClick={runAiBreakdown} className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
                <Sparkles className="w-3.5 h-3.5" />
                AI Breakdown
              </Button>
              <Button data-testid="button-start-focus" variant="outline" size="sm" onClick={startFocus} disabled={createFocusSession.isPending}>
                <Timer className="w-3.5 h-3.5 mr-1.5" />Start Focus
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-4">Subtasks</h2>
          {subtasks.length === 0 && (
            <p className="text-sm text-muted-foreground mb-4">Break this task into smaller steps — or try <button onClick={runAiBreakdown} className="text-primary hover:underline">AI Breakdown</button>.</p>
          )}
          <div className="space-y-2 mb-4">
            {subtasks.map((st: any) => (
              <div key={st.id} data-testid={`subtask-${st.id}`} className="flex items-center gap-3 group py-1.5">
                <button data-testid={`button-toggle-subtask-${st.id}`} onClick={() => toggleSubtask(st.id, st.completed === "true")} className="flex-shrink-0 transition-all">
                  {st.completed === "true" ? <CheckCircle2 className="w-5 h-5 text-primary" /> : <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />}
                </button>
                <span className={`flex-1 text-sm ${st.completed === "true" ? "line-through text-muted-foreground" : "text-foreground"}`}>{st.title}</span>
                <button data-testid={`button-remove-subtask-${st.id}`} onClick={() => removeSubtask(st.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input data-testid="input-subtask" placeholder="Add a subtask..." value={newSubtask} onChange={e => setNewSubtask(e.target.value)} onKeyDown={e => e.key === "Enter" && addSubtask()} className="flex-1" />
            <Button data-testid="button-add-subtask" onClick={addSubtask} disabled={!newSubtask.trim() || createSubtask.isPending} size="icon">
              {createSubtask.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Task Breakdown
              </DialogTitle>
            </DialogHeader>

            {aiLoading ? (
              <div className="space-y-3 py-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Analyzing your task...
                </div>
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {firstTinyStep && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-4">
                    <p className="text-xs font-semibold text-primary mb-1">Start here (just 2 mins)</p>
                    <p className="text-sm text-foreground">{firstTinyStep.title}</p>
                  </div>
                )}

                <p className="text-sm text-muted-foreground mb-2">Select the subtasks you want to add:</p>

                {aiSuggestions.map((s, i) => (
                  <div
                    key={i}
                    data-testid={`ai-suggestion-${i}`}
                    className={`border rounded-xl p-3 cursor-pointer transition-all ${selectedSuggestions.has(i) ? "border-primary/50 bg-primary/5" : "border-border bg-card"}`}
                    onClick={() => toggleSuggestion(i)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${selectedSuggestions.has(i) ? "bg-primary text-primary-foreground" : "border-2 border-muted-foreground/30"}`}>
                        {selectedSuggestions.has(i) && <Check className="w-3 h-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <input
                          className="w-full bg-transparent text-sm font-medium text-foreground outline-none"
                          value={editedTitles[i] ?? s.title}
                          onChange={e => { e.stopPropagation(); setEditedTitles(prev => ({ ...prev, [i]: e.target.value })); }}
                          onClick={e => e.stopPropagation()}
                        />
                        {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {s.estimated_minutes && <span>{s.estimated_minutes} min</span>}
                          {s.difficulty && <span>Difficulty: {s.difficulty}/5</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setAiDialogOpen(false)}>Cancel</Button>
                  <Button className="flex-1 gap-2" onClick={acceptSuggestions} disabled={accepting || selectedSuggestions.size === 0} data-testid="button-accept-ai">
                    {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Add {selectedSuggestions.size} subtask{selectedSuggestions.size !== 1 ? "s" : ""}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
