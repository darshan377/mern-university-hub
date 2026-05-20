import { useState, useEffect } from "react";
import FacultyLayout from "@/components/faculty-layout";
import { Link } from "wouter";
import { BookOpen, Plus, Users, Trash2, UserPlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function FacultyCourses() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [enrollEmail, setEnrollEmail] = useState("");
  const [enrollCourseId, setEnrollCourseId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", code: "", description: "" });

  const token = getToken();
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const load = () => {
    fetch(`${BASE}/api/courses`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then((d) => { setCourses(Array.isArray(d) ? d : []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.title || !form.code) return;
    const r = await fetch(`${BASE}/api/courses`, { method: "POST", headers, body: JSON.stringify(form) });
    if (r.ok) {
      toast({ title: "Course created" });
      setShowForm(false);
      setForm({ title: "", code: "", description: "" });
      load();
    } else {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`${BASE}/api/courses/${id}`, { method: "DELETE", headers });
    load();
  };

  const handleEnroll = async () => {
    if (!enrollEmail || !enrollCourseId) return;
    const r = await fetch(`${BASE}/api/courses/${enrollCourseId}/enroll`, { method: "POST", headers, body: JSON.stringify({ email: enrollEmail }) });
    const data = await r.json();
    if (r.ok) {
      toast({ title: `Enrolled ${data.student?.name}` });
      setEnrollEmail("");
      setEnrollCourseId(null);
    } else {
      toast({ title: data.error ?? "Error", variant: "destructive" });
    }
  };

  return (
    <FacultyLayout>
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Courses</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your courses and enroll students</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Course
        </Button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Create Course</h2>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Course Title</label>
              <Input placeholder="Introduction to CS" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Course Code</label>
              <Input placeholder="CS101" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
            <Input placeholder="Optional description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <Button onClick={handleCreate} className="w-full">Create Course</Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No courses yet. Create your first one above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((c) => (
            <div key={c.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{c.title}</h3>
                    <Badge variant="outline">{c.code}</Badge>
                  </div>
                  {c.description && <p className="text-sm text-muted-foreground mt-1">{c.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/faculty/class-health/${c.id}`}>
                    <Button size="sm" variant="outline">Health</Button>
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => setEnrollCourseId(c.id)}><UserPlus className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>

              {enrollCourseId === c.id && (
                <div className="mt-4 flex gap-2 p-3 bg-muted rounded-lg">
                  <Input placeholder="student@email.com" value={enrollEmail} onChange={(e) => setEnrollEmail(e.target.value)} className="flex-1" />
                  <Button onClick={handleEnroll}>Enroll</Button>
                  <Button variant="ghost" onClick={() => setEnrollCourseId(null)}><X className="w-4 h-4" /></Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
    </FacultyLayout>
  );
}
