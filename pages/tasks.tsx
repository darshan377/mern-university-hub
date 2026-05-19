import { useState } from "react";
import { useListTasks, useCreateTask, useUpdateTask, useDeleteTask, getListTasksQueryKey } from "@workspace/api-client-react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Trash2, ChevronRight, Clock, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  course: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  deadline: z.string().optional(),
  estimatedMinutes: z.coerce.number().optional(),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const priorityColor: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

const statusColor: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
};

export default function Tasks() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const params: any = {};
  if (statusFilter !== "all") params.status = statusFilter;
  if (priorityFilter !== "all") params.priority = priorityFilter;

  const { data: tasksData, isLoading } = useListTasks(params, { query: { queryKey: getListTasksQueryKey(params) } });
  const tasks = (tasksData as any[]) ?? [];
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", course: "", priority: "medium", deadline: "", estimatedMinutes: undefined, description: "" },
  });

  const filtered = tasks.filter((t: any) =>
    t.title?.toLowerCase().includes(search.toLowerCase()) ||
    t.course?.toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = async (data: FormData) => {
    try {
      await createTask.mutateAsync({ data: {
        title: data.title,
        course: data.course || undefined,
        priority: data.priority,
        deadline: data.deadline ? new Date(data.deadline).toISOString() : undefined,
        estimatedMinutes: data.estimatedMinutes,
        description: data.description || undefined,
      }});
      queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Task created!", description: "Keep it up — every task started is progress." });
    } catch {
      toast({ title: "Failed to create task", variant: "destructive" });
    }
  };

  const handleComplete = async (task: any) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    await updateTask.mutateAsync({ taskId: task.id, data: { status: newStatus } });
    queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
  };

  const handleDelete = async (taskId: number) => {
    await deleteTask.mutateAsync({ taskId });
    queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
    toast({ title: "Task deleted" });
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{tasks.length} task{tasks.length !== 1 ? "s" : ""} total</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-task">
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Task</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl><Input data-testid="input-task-title" placeholder="Assignment, project, exam..." {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="course" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course</FormLabel>
                        <FormControl><Input data-testid="input-task-course" placeholder="CS101" {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="priority" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger data-testid="select-priority"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="deadline" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deadline</FormLabel>
                        <FormControl><Input data-testid="input-deadline" type="datetime-local" {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="estimatedMinutes" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Est. Minutes</FormLabel>
                        <FormControl><Input data-testid="input-est-minutes" type="number" placeholder="60" {...field} /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl><Input data-testid="input-description" placeholder="Optional details..." {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" className="flex-1" disabled={createTask.isPending} data-testid="button-submit-task">
                      {createTask.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Create Task
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-testid="input-search"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36" data-testid="select-status"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-36" data-testid="select-priority-filter"><SelectValue placeholder="All Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No tasks found</p>
            <p className="text-sm">Create your first task to get started</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((task: any) => {
              const daysLeft = task.deadline ? Math.ceil((new Date(task.deadline).getTime() - Date.now()) / 86400000) : null;
              return (
                <div key={task.id} data-testid={`task-card-${task.id}`} className="bg-card border border-card-border rounded-xl p-4 flex items-center gap-4 group hover:shadow-sm transition-all">
                  <button
                    data-testid={`button-complete-${task.id}`}
                    onClick={() => handleComplete(task)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      task.status === "completed"
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/40 hover:border-primary"
                    }`}
                  >
                    {task.status === "completed" && <CheckCircle2 className="w-3 h-3" />}
                  </button>

                  <Link href={`/tasks/${task.id}`} className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-foreground ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                          {task.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {task.course && <span className="text-xs text-muted-foreground">{task.course}</span>}
                          <Badge variant="outline" className={`text-xs ${priorityColor[task.priority] ?? ""}`}>{task.priority}</Badge>
                          <Badge variant="secondary" className={`text-xs ${statusColor[task.status] ?? ""}`}>{task.status.replace("_", " ")}</Badge>
                          {daysLeft !== null && (
                            <span className={`text-xs flex items-center gap-1 ${daysLeft <= 1 ? "text-red-500" : daysLeft <= 3 ? "text-orange-500" : "text-muted-foreground"}`}>
                              <Clock className="w-3 h-3" />
                              {daysLeft === 0 ? "Due today" : daysLeft < 0 ? "Overdue" : `${daysLeft}d left`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>

                  {task.subtaskCount > 0 && (
                    <div className="flex-shrink-0 text-xs text-muted-foreground">
                      {task.subtaskCompleted}/{task.subtaskCount}
                    </div>
                  )}

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      data-testid={`button-delete-${task.id}`}
                      onClick={() => handleDelete(task.id)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <Link href={`/tasks/${task.id}`}>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
