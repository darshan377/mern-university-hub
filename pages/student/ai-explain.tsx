import { useState } from "react";
import Layout from "@/components/layout";
import { Sparkles, Loader2, Clock, CheckSquare, Lightbulb, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function AiExplain() {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const token = getToken();

  const handleExplain = async () => {
    if (input.trim().length < 10) { toast({ title: "Please paste more text (at least 10 characters)", variant: "destructive" }); return; }
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch(`${BASE}/api/ai/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ description: input }),
      });
      const data = await r.json();
      setResult(data);
    } catch {
      toast({ title: "Failed to reach AI service", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <Layout>
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Assignment Explainer</h1>
        <p className="text-muted-foreground text-sm mt-1">Paste a confusing assignment description and get a clear explanation with an approach plan</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Assignment Description</label>
          <textarea
            className="w-full border border-input rounded-lg p-3 text-sm bg-background resize-none min-h-[140px]"
            placeholder="Paste your assignment description here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <Button onClick={handleExplain} disabled={loading || input.trim().length < 10} className="w-full gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Explaining..." : "Explain This Assignment"}
        </Button>
      </div>

      {result && (
        <div className="space-y-4">
          {result.fallback && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">AI service returned fallback response.</div>
          )}

          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">Simple Explanation</h2>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{result.simple_explanation}</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-green-600" />
              <h2 className="font-semibold text-foreground">Key Requirements</h2>
            </div>
            <ul className="space-y-1.5">
              {result.key_requirements?.map((req: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  {req}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-foreground">Suggested Approach</h2>
            </div>
            <ol className="space-y-1.5">
              {result.suggested_approach?.map((step: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-foreground">Est. Time</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{result.estimated_hours}h</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-semibold text-foreground">Tips</span>
              </div>
              <ul className="space-y-1">
                {result.tips?.map((tip: string, i: number) => (
                  <li key={i} className="text-xs text-muted-foreground">• {tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
    </Layout>
  );
}
