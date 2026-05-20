import { useState, useEffect } from "react";
import Layout from "@/components/layout";
import { ClipboardList, Plus, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function getWeekOf() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

export default function WeeklyReview() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [form, setForm] = useState({ wentWell: "", keptDelaying: "", doDifferently: "" });

  const token = getToken();
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const load = () => {
    fetch(`${BASE}/api/weekly-reviews`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then((d) => { setReviews(Array.isArray(d) ? d : []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.wentWell || !form.keptDelaying || !form.doDifferently) {
      toast({ title: "Please fill all three fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    const r = await fetch(`${BASE}/api/weekly-reviews`, { method: "POST", headers, body: JSON.stringify({ weekOf: getWeekOf(), ...form }) });
    setSaving(false);
    if (r.ok) {
      toast({ title: "Weekly review saved!" });
      setForm({ wentWell: "", keptDelaying: "", doDifferently: "" });
      setShowForm(false);
      load();
    }
  };

  const questions = [
    { key: "wentWell", label: "✅ What went well this week?", placeholder: "Finished my readings, attended all classes..." },
    { key: "keptDelaying", label: "⏳ What did you keep delaying?", placeholder: "Starting my research paper, replying to emails..." },
    { key: "doDifferently", label: "🔄 What will you do differently next week?", placeholder: "Start assignments earlier, schedule study blocks..." },
  ];

  return (
    <Layout>
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Weekly Review</h1>
          <p className="text-muted-foreground text-sm mt-1">Reflect on your progress each week</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" /> This Week's Review
        </Button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold">Week of {new Date(getWeekOf()).toLocaleDateString("en-US", { month: "long", day: "numeric" })}</h2>
          {questions.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
              <textarea
                className="w-full border border-input rounded-lg p-3 text-sm bg-background resize-none min-h-[70px]"
                placeholder={placeholder}
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Review
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No weekly reviews yet. Start your first one above!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                <div className="text-left">
                  <p className="font-medium text-foreground">Week of {new Date(r.weekOf).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                {expanded === r.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
              {expanded === r.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-border">
                  {questions.map(({ key, label }) => (
                    <div key={key} className="pt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
                      <p className="text-sm text-foreground">{(r as any)[key]}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
    </Layout>
  );
}
