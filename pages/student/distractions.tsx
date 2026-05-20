import { useState, useEffect } from "react";
import Layout from "@/components/layout";
import { Zap, Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const PRESETS = ["YouTube", "Phone", "Social Media", "Noise", "Hunger", "Fatigue", "Messages"];

export default function DistractionLog() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [custom, setCustom] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const token = getToken();
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const load = () => {
    fetch(`${BASE}/api/distraction-logs`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then((d) => { setLogs(Array.isArray(d) ? d : []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const logDistraction = async (source: string) => {
    setSaving(source);
    const r = await fetch(`${BASE}/api/distraction-logs`, { method: "POST", headers, body: JSON.stringify({ source }) });
    setSaving(null);
    if (r.ok) { toast({ title: `Logged: ${source}` }); load(); }
  };

  const topDistractors = logs.reduce((acc: Record<string, number>, l) => {
    acc[l.source] = (acc[l.source] ?? 0) + 1;
    return acc;
  }, {});
  const sorted = Object.entries(topDistractors).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <Layout>
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Distraction Log</h1>
        <p className="text-muted-foreground text-sm mt-1">Quick-log what pulled your attention away</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-sm text-foreground">Quick Log</h2>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((s) => (
            <button
              key={s}
              onClick={() => logDistraction(s)}
              disabled={saving === s}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full text-sm font-medium text-foreground transition-colors disabled:opacity-50"
            >
              {saving === s ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Custom distraction..." value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && custom.trim()) { logDistraction(custom.trim()); setCustom(""); } }} />
          <Button onClick={() => { if (custom.trim()) { logDistraction(custom.trim()); setCustom(""); } }} disabled={!custom.trim()} size="icon"><Plus className="w-4 h-4" /></Button>
        </div>
      </div>

      {sorted.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-sm text-foreground">Top Distractors</h2>
          <div className="space-y-2">
            {sorted.map(([source, count]) => (
              <div key={source} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{source}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-primary/20 rounded-full overflow-hidden" style={{ width: 100 }}>
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(count / (sorted[0]?.[1] ?? 1)) * 100}%` }} />
                  </div>
                  <Badge variant="secondary" className="text-xs">{count}x</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-5 space-y-2">
          <h2 className="font-semibold text-sm text-foreground">Recent Logs ({logs.length})</h2>
          {logs.length === 0 ? <p className="text-muted-foreground text-sm">No distractions logged yet.</p> : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {logs.map((l) => (
                <div key={l.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{l.source}</span>
                  <span className="text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
    </Layout>
  );
}
