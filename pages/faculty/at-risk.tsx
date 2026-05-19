import { useState, useEffect } from "react";
import FacultyLayout from "@/components/faculty-layout";
import { AlertTriangle, MessageSquare, Loader2, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function AtRisk() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [atRisk, setAtRisk] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkInStudent, setCheckInStudent] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const token = getToken();
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${BASE}/api/courses`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then((d) => {
        const list = Array.isArray(d) ? d : [];
        setCourses(list);
        if (list.length > 0) setSelectedCourse(String(list[0].id));
      });
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    setLoading(true);
    fetch(`${BASE}/api/faculty/at-risk/${selectedCourse}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then((d) => { setAtRisk(Array.isArray(d) ? d : []); setLoading(false); });
  }, [selectedCourse]);

  const handleCheckIn = async () => {
    if (!message.trim() || !checkInStudent) return;
    setSending(true);
    const r = await fetch(`${BASE}/api/faculty/check-in`, { method: "POST", headers, body: JSON.stringify({ studentId: checkInStudent.id, message }) });
    setSending(false);
    if (r.ok) {
      toast({ title: `Check-in sent to ${checkInStudent.name}` });
      setCheckInStudent(null);
      setMessage("");
    } else {
      toast({ title: "Error sending message", variant: "destructive" });
    }
  };

  return (
    <FacultyLayout>
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">At-Risk Students</h1>
          <p className="text-muted-foreground text-sm mt-1">Students who haven't started their assignments within 48 hours</p>
        </div>
        {courses.length > 0 && (
          <select className="border border-input rounded-md h-9 px-3 text-sm bg-background" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        )}
      </div>

      {checkInStudent && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Check-in with {checkInStudent.name}</h2>
            <button onClick={() => setCheckInStudent(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <textarea className="w-full border border-input rounded-md p-3 text-sm bg-background min-h-[80px] resize-none" placeholder="Hey, just checking in on the assignment..." value={message} onChange={(e) => setMessage(e.target.value)} />
          <Button onClick={handleCheckIn} disabled={sending} className="gap-2">
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Send Message
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : atRisk.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No at-risk students detected</p>
          <p className="text-xs text-muted-foreground mt-1">Students who haven't opened their assignment in 48h will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {atRisk.map(({ task, student }: any) => (
            <div key={task.id} className="bg-card border border-red-200 rounded-xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm text-foreground">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">Assignment: <strong>{task.title}</strong> · Due: {new Date(task.deadline).toLocaleDateString()}</p>
                    <Badge variant="destructive" className="text-xs mt-1.5">Not started in 48h+</Badge>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="gap-1.5 flex-shrink-0" onClick={() => setCheckInStudent(student)}>
                  <MessageSquare className="w-3.5 h-3.5" /> Check In
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </FacultyLayout>
  );
}
