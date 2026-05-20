import { useState, useEffect } from "react";
import Layout from "@/components/layout";
import { Target, CheckCircle2, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const today = () => new Date().toISOString().slice(0, 10);

export default function DailyIntentions() {
  const { toast } = useToast();
  const [intention, setIntention] = useState<any>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const token = getToken();
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const load = () => {
    fetch(`${BASE}/api/daily-intentions?date=${today()}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then((d) => { setIntention(d); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!input.trim()) return;
    setSaving(true);
    const r = await fetch(`${BASE}/api/daily-intentions`, { method: "POST", headers, body: JSON.stringify({ intention: input, intentionDate: today() }) });
    setSaving(false);
    if (r.ok) {
      setInput("");
      toast({ title: "Intention set!" });
      load();
    }
  };

  const handleComplete = async () => {
    if (!intention?.id) return;
    const r = await fetch(`${BASE}/api/daily-intentions/${intention.id}/complete`, { method: "PATCH", headers });
    if (r.ok) { toast({ title: "Great work! Intention completed 🎉" }); load(); }
  };

  return (
    <Layout>
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Daily Intention</h1>
        <p className="text-muted-foreground text-sm mt-1">Set the ONE most important thing you'll finish today</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Target className="w-7 h-7 text-primary" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>

        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
        ) : intention ? (
          <div className="space-y-3">
            <p className={`text-lg font-semibold ${intention.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
              "{intention.intention}"
            </p>
            {intention.completed ? (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Completed!</span>
              </div>
            ) : (
              <Button onClick={handleComplete} className="gap-2">
                <CheckCircle2 className="w-4 h-4" /> Mark as Done
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              className="w-full border border-input rounded-lg p-3 text-sm bg-background resize-none min-h-[80px]"
              placeholder="Finish chapter 3 of my research paper..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button onClick={handleSave} disabled={saving || !input.trim()} className="w-full gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Set Today's Intention
            </Button>
          </div>
        )}
      </div>

      <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Why this works</p>
        <p>Research shows that setting a single daily priority dramatically increases follow-through. It's better to fully complete one important thing than partially do five.</p>
      </div>
    </div>
    </Layout>
  );
}
