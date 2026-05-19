import { useState, useEffect } from "react";
import FacultyLayout from "@/components/faculty-layout";
import { ClipboardList, Plus, X, Send, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const difficultyColor: Record<string, string> = { easy: "bg-green-100 text-green-700", medium: "bg-yellow-100 text-yellow-700", hard: "bg-red-100 text-red-700" };

export default function FacultyAssignments() {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [publishing, setPublishing] = useState<number | null>(null);
  const [form, setForm] = useState({ courseId: "", title: "", description: "", difficulty: "medium", deadline: "" });

  const token = getToken();
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const load = async () => {
    const [a, c] = await Promise.all([
      fetch(`${BASE}/api/assignments`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${BASE}/api/courses`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ]);
    setAssignments(Array.isArray(a) ? a : []);
    setCourses(Array.isArray(c) ? c : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.courseId || !form.title || !form.deadline) {
      toast({ title: "Fill all required fields", variant: "destructive" });
      return;
    }
    const r = await fetch(`${BASE}/api/assignments`, { method: "POST", headers, body: JSON.stringify({ ...form, courseId: parseInt(form.courseId) }) });
    if (r.ok) {
      toast({ title: "Assignment created" });
      setShowForm(false);
      setForm({ courseId: "", title: "", description: "", difficulty: "medium", deadline: "" });
      load();
    } else {
      toast({ title: "Error creating assignment", variant: "destructive" });
    }
  };

  const handlePublish = async (id: number) => {
    setPublishing(id);
    const r = await fetch(`${BASE}/api/assignments/${id}/publish`, { method: "POST", headers });
    const data = await r.json();
    setPublishing(null);
    if (r.ok) {
      toast({ title: `Published! Injected to ${data.injectedCount} students` });
      load();
    } else {
      toast({ title: data.error ?? "Error", variant: "destructive" });
    }
  };

  return (
    <FacultyLayout>
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assignments</h1>
          <p className="text-muted-foreground text-sm mt-1">Create and publish assignments to enrolled students</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Assignment
        </Button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Create Assignment</h2>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Course</label>
            <select className="w-full border border-input rounded-md h-9 px-3 text-sm bg-background" value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
              <option value="">Select a course</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title} ({c.code})</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Title</label>
            <Input placeholder="Research Paper Draft" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
            <textarea className="w-full border border-input rounded-md p-3 text-sm bg-background min-h-[80px] resize-none" placeholder="Assignment details..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Difficulty</label>
              <select className="w-full border border-input rounded-md h-9 px-3 text-sm bg-background" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Deadline</label>
              <Input type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
          </div>
          <Button onClick={handleCreate} className="w-full">Create Assignment</Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No assignments yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div key={a.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{a.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor[a.difficulty] ?? difficultyColor.medium}`}>{a.difficulty}</span>
                    {a.published ? <Badge variant="default" className="text-xs">Published</Badge> : <Badge variant="secondary" className="text-xs">Draft</Badge>}
                  </div>
                  {a.description && <p className="text-sm text-muted-foreground mt-1">{a.description}</p>}
                  <p className="text-xs text-muted-foreground mt-2">Due: {new Date(a.deadline).toLocaleDateString()}</p>
                </div>
                {!a.published && (
                  <Button size="sm" className="gap-1.5 flex-shrink-0" onClick={() => handlePublish(a.id)} disabled={publishing === a.id}>
                    {publishing === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Publish
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </FacultyLayout>
  );
}
