import { useState, useEffect } from "react";
import FacultyLayout from "@/components/faculty-layout";
import { Megaphone, Plus, X, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function FacultyBroadcasts() {
  const { toast } = useToast();
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ courseId: "", message: "", expiresAt: "" });

  const token = getToken();
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const load = async () => {
    const [b, c] = await Promise.all([
      fetch(`${BASE}/api/broadcasts`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${BASE}/api/courses`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ]);
    setBroadcasts(Array.isArray(b) ? b : []);
    setCourses(Array.isArray(c) ? c : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.courseId || !form.message) { toast({ title: "Fill required fields", variant: "destructive" }); return; }
    const r = await fetch(`${BASE}/api/broadcasts`, { method: "POST", headers, body: JSON.stringify({ ...form, courseId: parseInt(form.courseId) }) });
    if (r.ok) {
      toast({ title: "Broadcast sent to all enrolled students" });
      setShowForm(false);
      setForm({ courseId: "", message: "", expiresAt: "" });
      load();
    } else {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`${BASE}/api/broadcasts/${id}`, { method: "DELETE", headers });
    load();
  };

  return (
    <FacultyLayout>
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Class Broadcasts</h1>
          <p className="text-muted-foreground text-sm mt-1">Post announcements visible on every enrolled student's dashboard</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Broadcast
        </Button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">New Broadcast</h2>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Course</label>
            <select className="w-full border border-input rounded-md h-9 px-3 text-sm bg-background" value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
              <option value="">Select a course</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Message</label>
            <textarea className="w-full border border-input rounded-md p-3 text-sm bg-background min-h-[100px] resize-none" placeholder="Reminder: Assignment due Friday..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Expires (optional)</label>
            <input type="datetime-local" className="w-full border border-input rounded-md h-9 px-3 text-sm bg-background" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          </div>
          <Button onClick={handleCreate} className="w-full gap-2"><Megaphone className="w-4 h-4" /> Send Broadcast</Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : broadcasts.length === 0 ? (
        <div className="text-center py-12">
          <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No broadcasts yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {broadcasts.map((b) => (
            <div key={b.id} className={`bg-card border rounded-xl p-4 ${b.active ? "border-border" : "border-border/50 opacity-60"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Megaphone className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-foreground">{b.message}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {b.active ? <Badge variant="default" className="text-xs">Active</Badge> : <Badge variant="secondary" className="text-xs">Expired</Badge>}
                      {b.expiresAt && <span className="text-xs text-muted-foreground">Expires {new Date(b.expiresAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>
                {b.active && (
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive flex-shrink-0" onClick={() => handleDelete(b.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
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
