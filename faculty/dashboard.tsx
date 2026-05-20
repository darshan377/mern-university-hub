import { useState, useEffect } from "react";
import FacultyLayout from "@/components/faculty-layout";
import { Link } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { BookOpen, Users, ClipboardList, Bell, BarChart2, Megaphone, AlertTriangle, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getToken } from "@/lib/auth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function FacultyDashboard() {
  const { data: user } = useGetMe({ query: { queryKey: ["/api/auth/me"] } });
  const [courses, setCourses] = useState<any[]>([]);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${BASE}/api/courses`, { headers }).then((r) => r.json()),
      fetch(`${BASE}/api/broadcasts`, { headers }).then((r) => r.json()),
    ]).then(([c, b]) => {
      setCourses(Array.isArray(c) ? c : []);
      setBroadcasts(Array.isArray(b) ? b : []);
      setLoading(false);
    });
  }, []);

  const quickStats = [
    { label: "Courses", value: courses.length, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Broadcasts", value: broadcasts.filter((b) => b.active).length, icon: Megaphone, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <FacultyLayout>
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Faculty Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome back, {(user as any)?.name ?? "Professor"} · {(user as any)?.department ?? ""}
          </p>
        </div>
        <Badge variant="secondary" className="gap-1.5">
          <BookOpen className="w-3 h-3" />
          Faculty
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">My Courses</h2>
            <Link href="/faculty/courses">
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Manage
              </Button>
            </Link>
          </div>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : courses.length === 0 ? (
            <div className="text-center py-6">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No courses yet</p>
              <Link href="/faculty/courses">
                <Button size="sm" className="mt-3">Create your first course</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {courses.map((c) => (
                <Link key={c.id} href={`/faculty/courses/${c.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium text-sm text-foreground">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.code}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">View</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Quick Actions</h2>
          </div>
          <div className="space-y-2">
            {[
              { label: "Create Assignment", icon: ClipboardList, href: "/faculty/assignments" },
              { label: "Broadcast to Class", icon: Megaphone, href: "/faculty/broadcasts" },
              { label: "Class Health Dashboard", icon: BarChart2, href: "/faculty/class-health" },
              { label: "At-Risk Students", icon: AlertTriangle, href: "/faculty/at-risk" },
            ].map(({ label, icon: Icon, href }) => (
              <Link key={href} href={href}>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {broadcasts.filter((b) => b.active).length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-3">Active Broadcasts</h2>
          <div className="space-y-2">
            {broadcasts.filter((b) => b.active).map((b) => (
              <div key={b.id} className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
                <Megaphone className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground">{b.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </FacultyLayout>
  );
}
