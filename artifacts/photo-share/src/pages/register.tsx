import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Camera, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const { login, user } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    username: "",
    displayName: "",
    email: "",
    age: "",
    password: "",
    confirmPassword: "",
    role: "consumer" as "creator" | "consumer",
  });

  if (user) {
    setLocation("/");
    return null;
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.username || !form.displayName || !form.email || !form.password) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (form.age && (parseInt(form.age) < 13 || parseInt(form.age) > 120)) {
      toast.error("Please enter a valid age (13–120).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: form.username.trim().toLowerCase(),
          displayName: form.displayName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          age: form.age ? parseInt(form.age) : undefined,
          role: form.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Registration failed.");
        return;
      }
      login(data);
      toast.success(`Welcome to PhotoShare, ${data.displayName}!`);
      setLocation("/");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-8 animate-in fade-in">
      <Card className="w-full max-w-lg bg-card border-border/40 shadow-2xl">
        <CardHeader className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
              <Camera className="w-7 h-7" />
            </div>
          </div>
          <CardTitle className="text-3xl font-serif font-normal text-primary">Join PhotoShare</CardTitle>
          <CardDescription className="text-base">Create your account to start exploring or sharing</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Role selection */}
            <div className="space-y-3">
              <Label>I want to...</Label>
              <RadioGroup
                value={form.role}
                onValueChange={(v: "creator" | "consumer") => setForm((p) => ({ ...p, role: v }))}
                className="grid grid-cols-2 gap-3"
                disabled={loading}
              >
                <div className={`flex flex-col gap-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.role === "consumer" ? "border-primary bg-primary/10" : "border-border/50 bg-background/30 hover:border-border"}`}>
                  <RadioGroupItem value="consumer" id="consumer" className="sr-only" />
                  <Label htmlFor="consumer" className="cursor-pointer font-medium">Browse & Explore</Label>
                  <p className="text-xs text-muted-foreground">Comment and rate photos</p>
                </div>
                <div className={`flex flex-col gap-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.role === "creator" ? "border-primary bg-primary/10" : "border-border/50 bg-background/30 hover:border-border"}`}>
                  <RadioGroupItem value="creator" id="creator" className="sr-only" />
                  <Label htmlFor="creator" className="cursor-pointer font-medium">Share My Work</Label>
                  <p className="text-xs text-muted-foreground">Upload photos to gallery</p>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username <span className="text-destructive">*</span></Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value.replace(/\s/g, "").toLowerCase() }))}
                  placeholder="ansel_adams"
                  autoComplete="username"
                  className="bg-background/50"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Full Name <span className="text-destructive">*</span></Label>
                <Input
                  id="displayName"
                  value={form.displayName}
                  onChange={set("displayName")}
                  placeholder="Ansel Adams"
                  className="bg-background/50"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="bg-background/50"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min={13}
                  max={120}
                  value={form.age}
                  onChange={set("age")}
                  placeholder="25"
                  className="bg-background/50"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  className="bg-background/50 pr-10"
                  disabled={loading}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={set("confirmPassword")}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  className={`bg-background/50 pr-10 ${form.confirmPassword && form.password !== form.confirmPassword ? "border-destructive" : ""}`}
                  disabled={loading}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>

            <Button type="submit" className="w-full h-11 text-base font-medium mt-2" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
