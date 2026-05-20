import { useState, useEffect } from "react";
import Layout from "@/components/layout";
import { ClipboardList, CheckCircle2, Clock, AlertCircle, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
};
const difficultyColor: Record<string, string> = { easy: "bg-green-100 text-green-700", medium: "bg-yellow-100 text-yellow-700", hard: "bg-red-100 text-red-700" };

export default function MyAssignments() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [extRequest, setExtRequest] = useState<any>(null);
  const [extForm, setExtForm] = useState({ reason: "", requestedDeadline: "" });

  const token = getToken();
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const load = () => {
    fetch(`${BASE}/api/injected-tasks`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then((d) => { setTasks(Array.isArray(d) ? d : []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const markViewed = async (id: number) => {
    await fetch(`${BASE}/api/injected-tasks/${id}/view`, { method: "PATCH", headers });
  };

  const updateStatus = async (id: number, status: string) => {
    setUpdating(id);
    await fetch(`${BASE}/api/injected-tasks/${id}/status`, { method: "PATCH", headers, body: JSON.stringify({ status }) });
    setUpdating(null);
    toast({ title: `Marked as ${status.replace("_", " ")}` });
    load();
  };

  const submitExtension = async () => {
    if (!extRequest || !extForm.reason || !extForm.requestedDeadline) return;
    const r = await fetch(`${BASE}/api/extension-requests`, { method: "POST", headers, body: JSON.stringify({ injectedTaskId: extRequest.id, ...extForm }) });
    if (r.ok) {
      toast({ title: "Extension request sent!" });
      setExtRequest(null);
      setExtForm({ reason: "", requestedDeadline: "" });
    } else {
      toast({ title: "Error submitting request", variant: "destructive" });
    }
  };

  const isOverdue = (task: any) => new Date(task.deadline) < new Date() && task.status !== "completed";

  return (
    <Layout>
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Assignments</h1>
        <p className="text-muted-foreground text-sm mt-1">Assignments published by your faculty — auto-injected into your list</p>
      </div>

      {extRequest && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="font-semibold">Request Extension for "{extRequest.title}"</h2>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Reason</label>
            <textarea className="w-full border border-input rounded-lg p-3 text-sm bg-background resize-none min-h-[70px]" placeholder="I need more time because..." value={extForm.reason} onChange={(e) => setExtForm({ ...extForm, reason: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Requested New Deadline</label>
            <input type="datetime-local" className="w-full border border-input rounded-md h-9 px-3 text-sm bg-background" value={extForm.requestedDeadline} onChange={(e) => setExtForm({ ...extForm, requestedDeadline: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button onClick={submitExtension} className="gap-2 flex-1"><Send className="w-3.5 h-3.5" /> Submit Request</Button>
            <Button variant="outline" onClick={() => setExtRequest(null)}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No assignments yet. Your faculty hasn't published any.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => (
            <div key={t.id} className={`bg-card border rounded-xl p-5 ${isOverdue(t) ? "border-red-200" : "border-border"}`} onMouseEnter={() => { if (!t.firstViewedAt) markViewed(t.id); }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{t.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[t.status] ?? statusColor.pending}`}>{t.status.replace("_", " ")}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor[t.difficulty] ?? difficultyColor.medium}`}>{t.difficulty}</span>
                    {isOverdue(t) && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
                    {t.atRiskFlagged && <Badge variant="destructive" className="text-xs">⚠ At Risk</Badge>}
                  </div>
                  {t.description && <p className="text-sm text-muted-foreground mt-1">{t.description}</p>}
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Due: {new Date(t.deadline).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {t.status === "pending" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(t.id, "in_progress")} disabled={updating === t.id}>Start</Button>
                  )}
                  {t.status === "in_progress" && (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(t.id, "completed")} disabled={updating === t.id}>
                      {updating === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    </Button>
                  )}
                  {t.status !== "completed" && (
                    <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={() => setExtRequest(t)}>Request Ext.</Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </Layout>
  );
}
