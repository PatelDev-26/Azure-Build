import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Loader2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [, setLocation] = useLocation();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    displayName: user?.displayName ?? "",
    email: user?.email ?? "",
    age: user?.age?.toString() ?? "",
    bio: user?.bio ?? "",
    avatarUrl: user?.avatarUrl ?? "",
  });

  if (!user) {
    setLocation("/login");
    return null;
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.displayName.trim()) { toast.error("Name cannot be empty."); return; }
    if (form.age && (parseInt(form.age) < 13 || parseInt(form.age) > 120)) {
      toast.error("Please enter a valid age (13–120)."); return;
    }

    setSaving(true);
    setSaved(false);
    try {
      const body: Record<string, unknown> = {
        displayName: form.displayName.trim(),
        bio: form.bio.trim() || undefined,
      };
      if (form.email.trim()) body.email = form.email.trim().toLowerCase();
      if (form.age) body.age = parseInt(form.age);
      if (form.avatarUrl.trim()) body.avatarUrl = form.avatarUrl.trim();

      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to save."); return; }
      await refreshUser();
      setSaved(true);
      toast.success("Profile updated successfully!");
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in space-y-6">
      <div className="flex items-center gap-3">
        <UserCog className="w-6 h-6 text-primary" />
        <h1 className="text-3xl font-serif text-primary">My Profile</h1>
      </div>

      {/* Profile Summary Card */}
      <Card className="bg-card border-border/40">
        <CardContent className="pt-6 flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/30">
            <AvatarImage src={user.avatarUrl ?? undefined} alt={user.displayName} />
            <AvatarFallback className="bg-secondary text-secondary-foreground text-xl font-serif">
              {user.displayName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-serif font-medium">{user.displayName}</h2>
            <p className="text-muted-foreground text-sm">@{user.username}</p>
            <Badge variant="outline" className={`mt-1 ${user.role === "creator" ? "border-primary/50 text-primary" : "border-border"}`}>
              {user.role}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card className="bg-card border-border/40 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-serif">Edit Information</CardTitle>
          <CardDescription>Update your personal details. Username and role cannot be changed.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={user.username} disabled className="bg-muted/30 text-muted-foreground cursor-not-allowed" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={user.role} disabled className="bg-muted/30 text-muted-foreground cursor-not-allowed capitalize" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Full Name <span className="text-destructive">*</span></Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={set("displayName")}
                placeholder="Your full name"
                className="bg-background/50"
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="you@example.com"
                  className="bg-background/50"
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
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
                  disabled={saving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatarUrl">Avatar URL</Label>
              <Input
                id="avatarUrl"
                value={form.avatarUrl}
                onChange={set("avatarUrl")}
                placeholder="https://example.com/your-photo.jpg"
                className="bg-background/50"
                disabled={saving}
              />
              {form.avatarUrl && (
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={form.avatarUrl} />
                    <AvatarFallback className="text-xs">?</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">Preview</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={form.bio}
                onChange={set("bio")}
                placeholder="A short introduction about yourself..."
                className="bg-background/50 min-h-[90px] resize-none"
                maxLength={500}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground text-right">{form.bio.length}/500</p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" className="h-11 px-8 font-medium" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              {saved && (
                <div className="flex items-center gap-1.5 text-green-500 text-sm animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  Saved!
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account info */}
      <Card className="bg-card border-border/40">
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Member since {new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
