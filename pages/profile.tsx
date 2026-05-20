import { useState } from "react";
import { useGetMe, useUpdateProfile, getGetMeQueryKey } from "@workspace/api-client-react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Flame, Zap, BookOpen, GraduationCap, Save, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  university: z.string().optional(),
  department: z.string().optional(),
  semester: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function Profile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: userData, isLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const user = userData as any;
  const updateProfile = useUpdateProfile();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    values: {
      name: user?.name ?? "",
      university: user?.university ?? "",
      department: user?.department ?? "",
      semester: user?.semester ?? "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await updateProfile.mutateAsync({ data: {
        name: data.name,
        university: data.university || undefined,
        department: data.department || undefined,
        semester: data.semester || undefined,
      }});
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast({ title: "Profile updated!" });
    } catch {
      toast({ title: "Failed to update profile", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </Layout>
    );
  }

  const xpToNextLevel = user?.level ? user.level * 200 : 200;
  const currentLevelXp = user?.xp ? user.xp % xpToNextLevel : 0;
  const xpPct = Math.min(100, (currentLevelXp / xpToNextLevel) * 100);

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your account settings and stats</p>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6 mb-5">
          <div className="flex items-center gap-5 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
              {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">{user?.name}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {user?.university && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {user.university} {user.department ? `• ${user.department}` : ""}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="flex justify-center mb-1">
                <Flame className="w-4 h-4 text-orange-400" />
              </div>
              <p data-testid="stat-streak" className="text-lg font-bold text-foreground">{user?.streakCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="flex justify-center mb-1">
                <Zap className="w-4 h-4 text-yellow-400" />
              </div>
              <p data-testid="stat-level" className="text-lg font-bold text-foreground">Lv.{user?.level ?? 1}</p>
              <p className="text-xs text-muted-foreground">{user?.xp?.toLocaleString() ?? 0} XP</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="flex justify-center mb-1">
                <BookOpen className="w-4 h-4 text-blue-400" />
              </div>
              <p data-testid="stat-tasks-completed" className="text-lg font-bold text-foreground">{user?.tasksCompleted ?? 0}</p>
              <p className="text-xs text-muted-foreground">Tasks Done</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Level {user?.level ?? 1}</span>
              <span>{currentLevelXp} / {xpToNextLevel} XP</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                data-testid="profile-xp-bar"
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${xpPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{xpToNextLevel - currentLevelXp} XP to level {(user?.level ?? 1) + 1}</p>
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-4">Edit Profile</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl><Input data-testid="input-name" {...field} /></FormControl>
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="university" render={({ field }) => (
                  <FormItem>
                    <FormLabel>University</FormLabel>
                    <FormControl><Input data-testid="input-university" placeholder="MIT" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="department" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl><Input data-testid="input-department" placeholder="CS" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="semester" render={({ field }) => (
                <FormItem>
                  <FormLabel>Semester</FormLabel>
                  <FormControl><Input data-testid="input-semester" placeholder="Spring 2026" {...field} /></FormControl>
                </FormItem>
              )} />
              <Button type="submit" disabled={updateProfile.isPending} className="w-full" data-testid="button-save-profile">
                {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </Layout>
  );
}
