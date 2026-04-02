import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUpload } from "@workspace/object-storage-web";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Camera, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, ShieldCheck, Upload, UserCog } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type PwStep = "idle" | "sending" | "otp" | "verifying" | "newpw" | "saving" | "done";

export default function Profile() {
  const { user, refreshUser, isInitializing } = useAuth();
  const [, setLocation] = useLocation();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [form, setForm] = useState({
    displayName: "",
    email: "",
    age: "",
    bio: "",
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarObjectPath, setAvatarObjectPath] = useState<string | null>(null);

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (res) => {
      setAvatarObjectPath(res.objectPath);
      toast.success("Avatar uploaded — click Save Changes to apply.");
    },
    onError: (err) => {
      toast.error(`Upload failed: ${err.message}`);
    },
  });

  useEffect(() => {
    if (user) {
      setForm({
        displayName: user.displayName ?? "",
        email: user.email ?? "",
        age: user.age?.toString() ?? "",
        bio: user.bio ?? "",
      });
      if (user.avatarUrl) setAvatarPreview(user.avatarUrl);
    }
  }, [user]);

  const [pwStep, setPwStep] = useState<PwStep>("idle");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setSaveError(null);
  };

  const handleAvatarFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    setAvatarObjectPath(null);
    await uploadFile(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    if (!form.displayName.trim()) { setSaveError("Name cannot be empty."); return; }
    if (form.age && (parseInt(form.age) < 13 || parseInt(form.age) > 120)) {
      setSaveError("Please enter a valid age (13–120)."); return;
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
      if (avatarObjectPath) body.avatarUrl = `/api/storage${avatarObjectPath}`;

      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setSaveError(data.error ?? "Failed to save."); return; }
      await refreshUser();
      setSaved(true);
      setAvatarObjectPath(null);
      toast.success("Profile updated successfully!");
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const sendOtp = async () => {
    setPwError(null);
    if (!user.email) {
      setPwError("Add an email address to your profile first.");
      return;
    }
    setPwStep("sending");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (!res.ok) { setPwError(data.error ?? "Failed to send code."); setPwStep("idle"); return; }
      if (data.devOtp) setOtp(data.devOtp);
      setPwStep("otp");
      toast.success("Reset code sent to " + user.email);
    } catch {
      setPwError("Network error. Please try again.");
      setPwStep("idle");
    }
  };

  const verifyOtp = async () => {
    setPwError(null);
    if (otp.length !== 6) { setPwError("Please enter the 6-digit code."); return; }
    setPwStep("verifying");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, otp }),
      });
      const data = await res.json();
      if (!res.ok) { setPwError(data.error ?? "Invalid code."); setPwStep("otp"); return; }
      setPwStep("newpw");
    } catch {
      setPwError("Network error. Please try again.");
      setPwStep("otp");
    }
  };

  const changePassword = async () => {
    setPwError(null);
    if (!newPassword || newPassword.length < 6) { setPwError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setPwError("Passwords do not match."); return; }
    setPwStep("saving");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setPwError(data.error ?? "Failed to change password."); setPwStep("newpw"); return; }
      setPwStep("done");
      toast.success("Password changed successfully!");
      setTimeout(() => { setPwStep("idle"); setOtp(""); setNewPassword(""); setConfirmPassword(""); setPwError(null); }, 3000);
    } catch {
      setPwError("Network error. Please try again.");
      setPwStep("newpw");
    }
  };

  const isBusy = pwStep === "sending" || pwStep === "verifying" || pwStep === "saving";

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in space-y-6">
      <div className="flex items-center gap-3">
        <UserCog className="w-6 h-6 text-primary" />
        <h1 className="text-3xl font-serif text-primary">My Profile</h1>
      </div>

      {/* Profile Summary Card */}
      <Card className="bg-card border-border/40">
        <CardContent className="pt-6 flex items-center gap-4">
          <div className="relative group">
            <Avatar className="h-16 w-16 border-2 border-primary/30">
              <AvatarImage src={avatarPreview ?? user.avatarUrl ?? undefined} alt={user.displayName} />
              <AvatarFallback className="bg-secondary text-secondary-foreground text-xl font-serif">
                {user.displayName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
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
            {saveError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {saveError}
              </div>
            )}

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

            {/* Avatar Upload */}
            <div className="space-y-2">
              <Label>Profile Photo</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border border-border/40">
                  <AvatarImage src={avatarPreview ?? user.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-sm font-serif">
                    {user.displayName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { if (e.target.files?.[0]) handleAvatarFile(e.target.files[0]); }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploading || saving}
                    onClick={() => avatarInputRef.current?.click()}
                    className="gap-2"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {isUploading ? "Uploading..." : "Upload Photo"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP — max 5 MB</p>
                </div>
              </div>
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
              <Button type="submit" className="h-11 px-8 font-medium" disabled={saving || isUploading}>
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

      {/* Change Password */}
      <Card className="bg-card border-border/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-serif flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" />
                Change Password
              </CardTitle>
              <CardDescription className="mt-1">We'll send a one-time code to your email to verify your identity.</CardDescription>
            </div>
            {pwStep === "idle" && (
              <Button variant="outline" size="sm" onClick={sendOtp} disabled={!user.email}>
                Change Password
              </Button>
            )}
          </div>
          {!user.email && pwStep === "idle" && (
            <p className="text-xs text-destructive mt-1">Add an email address above to enable password changes.</p>
          )}
        </CardHeader>

        {pwStep !== "idle" && pwStep !== "done" && (
          <CardContent className="space-y-4">
            {pwError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {pwError}
              </div>
            )}

            {(pwStep === "sending") && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending code to {user.email}…
              </div>
            )}

            {(pwStep === "otp" || pwStep === "verifying") && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Code sent to <span className="text-foreground font-medium">{user.email}</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otp">6-digit code</Label>
                  <Input
                    id="otp"
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setPwError(null); }}
                    placeholder="123456"
                    inputMode="numeric"
                    maxLength={6}
                    className="bg-background/50 text-center text-2xl tracking-widest font-mono w-40"
                    disabled={isBusy}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={verifyOtp} disabled={isBusy || otp.length !== 6} size="sm">
                    {pwStep === "verifying" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    Verify Code
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setPwStep("idle"); setOtp(""); setPwError(null); }} disabled={isBusy}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {(pwStep === "newpw" || pwStep === "saving") && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setPwError(null); }}
                      placeholder="Min. 6 characters"
                      className="bg-background/50 pr-10"
                      disabled={isBusy}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPw">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPw"
                      type={showConfirmPw ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setPwError(null); }}
                      placeholder="Repeat new password"
                      className={`bg-background/50 pr-10 ${confirmPassword && newPassword !== confirmPassword ? "border-destructive" : ""}`}
                      disabled={isBusy}
                    />
                    <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={changePassword} disabled={isBusy || (!!confirmPassword && newPassword !== confirmPassword)} size="sm">
                    {pwStep === "saving" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    Update Password
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setPwStep("idle"); setNewPassword(""); setConfirmPassword(""); setPwError(null); }} disabled={isBusy}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        )}

        {pwStep === "done" && (
          <CardContent>
            <div className="flex items-center gap-2 text-green-500 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Password changed successfully!
            </div>
          </CardContent>
        )}
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
