import { useState, useEffect } from "react";
import FacultyLayout from "@/components/faculty-layout";
import { BarChart2, Users, CheckCircle2, Clock, AlertTriangle, TrendingUp, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getToken } from "@/lib/auth";
import { useRoute } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function ClassHealth() {
  const [, params] = useRoute("/faculty/class-health/:courseId");
  const courseId = params?.courseId;
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState(courseId ?? "");

  const token = getToken();
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${BASE}/api/courses`, { headers }).then((r) => r.json()).then((d) => {
      const list = Array.isArray(d) ? d : [];
      setCourses(list);
      if (!selectedCourse && list.length > 0) setSelectedCourse(String(list[0].id));
    });
  }, []);

  useEffect(() => {
    if (!selectedCourse) { setLoading(false); return; }
    setLoading(true);
    fetch(`${BASE}/api/faculty/class-health/${selectedCourse}`, { headers })
      .then((r) => r.json()).then((d) => { setHealth(d); setLoading(false); });
  }, [selectedCourse]);

  const stats = health ? [
    { label: "Enrolled", value: health.enrolledCount, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Started %", value: `${health.startedPercent}%`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: "Completed %", value: `${health.completedPercent}%`, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Not Started", value: health.notStartedCount, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "At Risk", value: health.atRiskCount, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
    { label: "Avg Focus (min)", value: health.avgFocusMinutes, icon: BarChart2, color: "text-purple-600", bg: "bg-purple-50" },
  ] : [];

  return (
    <FacultyLayout>
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Class Health Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Aggregated class performance metrics</p>
        </div>
        {courses.length > 0 && (
          <select className="border border-input rounded-md h-9 px-3 text-sm bg-background" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : !health ? (
        <div className="text-center py-16 text-muted-foreground">Select a course to view health data</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {stats.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4">
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {health.onTimeCount + health.lateCount > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-semibold mb-3">Submission Timing</h2>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-muted-foreground">On time: <strong className="text-foreground">{health.onTimeCount}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="text-sm text-muted-foreground">Late: <strong className="text-foreground">{health.lateCount}</strong></span>
                </div>
              </div>
              <div className="mt-3 h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${health.onTimeCount / (health.onTimeCount + health.lateCount) * 100}%` }} />
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-semibold mb-3">Enrolled Students</h2>
            {health.students?.length === 0 ? (
              <p className="text-muted-foreground text-sm">No students enrolled yet</p>
            ) : (
              <div className="space-y-2">
                {health.students?.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="font-medium text-sm text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>🔥 {s.streakCount}</span>
                      <span>⚡ Lv.{s.level}</span>
                      <span>✅ {s.tasksCompleted}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
    </FacultyLayout>
  );
}
