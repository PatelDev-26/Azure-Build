import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Mail, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type Step = "email" | "otp" | "password" | "done";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Please enter your email."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Something went wrong."); return; }
      // Dev fallback: if SMTP not configured, API returns the OTP directly
      if (data.devOtp) {
        setDevOtp(data.devOtp);
        setOtp(data.devOtp);
      }
      setStep("otp");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error("Please enter the 6-digit code."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Invalid code."); return; }
      setStep("password");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to reset password."); return; }
      setStep("done");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] animate-in fade-in">
      <Card className="w-full max-w-md bg-card border-border/40 shadow-2xl">

        {step === "email" && (
          <>
            <CardHeader className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                  <Mail className="w-7 h-7" />
                </div>
              </div>
              <CardTitle className="text-2xl font-serif font-normal text-primary">Forgot password?</CardTitle>
              <CardDescription>Enter your registered email and we'll send you a reset code.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="bg-background/50"
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Code"}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <Link href="/login" className="text-sm text-muted-foreground hover:text-primary flex items-center justify-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Back to login
                </Link>
              </div>
            </CardContent>
          </>
        )}

        {step === "otp" && (
          <>
            <CardHeader className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7" />
                </div>
              </div>
              <CardTitle className="text-2xl font-serif font-normal text-primary">Enter reset code</CardTitle>
              <CardDescription>
                {devOtp
                  ? "Email is not yet configured. Your OTP is shown below — use it to continue."
                  : <>We sent a 6-digit code to <span className="text-foreground font-medium">{email}</span>. Check your inbox (and spam folder).</>}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {devOtp && (
                <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-300">Development mode — email not configured</p>
                    <p className="text-xs text-amber-400/80 mt-0.5">
                      Your OTP is <span className="font-mono font-bold tracking-widest text-amber-300">{devOtp}</span> (auto-filled below).
                      To enable real emails, set <code className="text-xs">SMTP_USER</code> and <code className="text-xs">SMTP_PASS</code> in your secrets.
                    </p>
                  </div>
                </div>
              )}
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">6-digit code</Label>
                  <Input
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    inputMode="numeric"
                    maxLength={6}
                    className="bg-background/50 text-center text-2xl tracking-widest font-mono"
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={loading || otp.length !== 6}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Code"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={() => setStep("email")}
                  disabled={loading}
                >
                  Use a different email
                </Button>
              </form>
            </CardContent>
          </>
        )}

        {step === "password" && (
          <>
            <CardHeader className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                  <KeyRound className="w-7 h-7" />
                </div>
              </div>
              <CardTitle className="text-2xl font-serif font-normal text-primary">Create new password</CardTitle>
              <CardDescription>Choose a password different from your previous one.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="bg-background/50 pr-10"
                      disabled={loading}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className={`bg-background/50 pr-10 ${confirmPassword && newPassword !== confirmPassword ? "border-destructive" : ""}`}
                      disabled={loading}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                </div>
                <Button type="submit" className="w-full h-11" disabled={loading || (!!confirmPassword && newPassword !== confirmPassword)}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reset Password"}
                </Button>
              </form>
            </CardContent>
          </>
        )}

        {step === "done" && (
          <>
            <CardHeader className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
              </div>
              <CardTitle className="text-2xl font-serif font-normal text-primary">Password reset!</CardTitle>
              <CardDescription>Your password has been successfully updated. You can now sign in with your new password.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full h-11" onClick={() => setLocation("/login")}>
                Sign In
              </Button>
            </CardContent>
          </>
        )}

      </Card>
    </div>
  );
}
