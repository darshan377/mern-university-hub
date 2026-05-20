import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Zap, Loader2, GraduationCap, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const login = useLogin();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await login.mutateAsync({ data });
      const user = (result as any).user;
      setToken((result as any).token);
      queryClient.invalidateQueries();
      if (user?.role === "faculty") {
        setLocation("/faculty/dashboard");
      } else {
        setLocation("/dashboard");
      }
    } catch {
      toast({ title: "Login failed", description: "Invalid email or password", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full bg-white blur-2xl" />
        </div>
        <div className="relative text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">FOCUSMATE</h1>
          <p className="text-white/80 text-lg leading-relaxed max-w-xs">
            Turn your study sessions into wins. Track tasks, log focus time, and level up your academic game.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[["Focus Timer", "Stay in the zone"], ["XP System", "Level up daily"], ["Study Groups", "Learn together"]].map(([title, sub]) => (
              <div key={title} className="bg-white/10 rounded-xl p-3">
                <p className="text-white font-semibold text-sm">{title}</p>
                <p className="text-white/60 text-xs mt-1">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">FOCUSMATE</h1>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back</h2>
          <p className="text-muted-foreground text-sm mb-8">Log in to continue your streak</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      <Input data-testid="input-password" type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button data-testid="button-submit" type="submit" className="w-full" disabled={login.isPending}>
                {login.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Sign in
              </Button>
            </form>
          </Form>

          <div className="mt-6 space-y-3">
            <p className="text-center text-sm text-muted-foreground font-medium">No account? Sign up as:</p>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/register?role=student">
                <Button variant="outline" className="w-full gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Student
                </Button>
              </Link>
              <Link href="/register?role=faculty">
                <Button variant="outline" className="w-full gap-2">
                  <BookOpen className="w-4 h-4" />
                  Faculty
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
