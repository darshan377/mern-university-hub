import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation, useSearch } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Loader2, GraduationCap, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  university: z.string().optional(),
  department: z.string().optional(),
  semester: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const role = (params.get("role") === "faculty" ? "faculty" : "student") as "student" | "faculty";

  const register = useRegister();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", university: "", department: "", semester: "" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await register.mutateAsync({ data: { ...data, role } as any });
      setToken((result as any).token);
      queryClient.invalidateQueries();
      if (role === "faculty") {
        setLocation("/faculty/dashboard");
      } else {
        setLocation("/dashboard");
      }
    } catch {
      toast({ title: "Registration failed", description: "This email may already be registered", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge variant={role === "faculty" ? "default" : "secondary"} className="gap-1.5 px-3 py-1">
              {role === "faculty" ? <BookOpen className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
              {role === "faculty" ? "Faculty Account" : "Student Account"}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-2">
            {role === "faculty" ? "Create and manage assignments, track student progress" : "Track tasks, focus, and level up your academic game"}
          </p>
        </div>

        <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input data-testid="input-name" placeholder={role === "faculty" ? "Dr. Jane Smith" : "Alex Johnson"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input data-testid="input-email" type="email" placeholder="you@university.edu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input data-testid="input-password" type="password" placeholder="Min. 6 characters" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="university"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>University</FormLabel>
                      <FormControl>
                        <Input data-testid="input-university" placeholder="MIT" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input data-testid="input-department" placeholder="CS" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              {role === "student" && (
                <FormField
                  control={form.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Semester</FormLabel>
                      <FormControl>
                        <Input data-testid="input-semester" placeholder="Spring 2026" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
              <Button data-testid="button-submit" type="submit" className="w-full mt-2" disabled={register.isPending}>
                {register.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {role === "faculty" ? "Create Faculty Account" : "Create Student Account"}
              </Button>
            </form>
          </Form>
        </div>

        <div className="mt-4 space-y-2 text-center text-sm text-muted-foreground">
          <p>
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
          <p>
            Want to sign up as{" "}
            <Link href={`/register?role=${role === "faculty" ? "student" : "faculty"}`} className="text-primary hover:underline font-medium">
              {role === "faculty" ? "a student" : "a faculty member"}
            </Link>
            {" "}instead?
          </p>
        </div>
      </div>
    </div>
  );
}
