import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/use-auth";
import { useCreateUser } from "@workspace/api-client-react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function AuthModal() {
  const { user, isInitializing, login } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const createUser = useCreateUser();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"creator" | "consumer">("consumer");

  // Only show modal if initialized and no user
  if (isInitializing || user) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !displayName.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    createUser.mutate(
      { data: { username, displayName, role } },
      {
        onSuccess: (newUser) => {
          login(newUser);
          toast.success(`Welcome to PhotoShare, ${newUser.displayName}!`);
          setIsOpen(false);
        },
        onError: () => {
          toast.error("Failed to create user. Username might be taken.");
        }
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl font-normal tracking-tight text-primary">Enter the gallery</DialogTitle>
          <DialogDescription className="text-muted-foreground text-base">
            Create your profile to explore or share visual stories.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-foreground/80">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s+/g, '').toLowerCase())}
              placeholder="e.g. ansel_adams"
              className="bg-background/50 border-border/50 focus:border-primary/50"
              disabled={createUser.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-foreground/80">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Ansel Adams"
              className="bg-background/50 border-border/50 focus:border-primary/50"
              disabled={createUser.isPending}
            />
          </div>
          <div className="space-y-3 pt-2">
            <Label className="text-foreground/80">I am here to...</Label>
            <RadioGroup value={role} onValueChange={(v: "creator" | "consumer") => setRole(v)} disabled={createUser.isPending}>
              <div className="flex items-center space-x-3 bg-background/30 p-3 rounded-md border border-border/30 hover:border-primary/30 transition-colors">
                <RadioGroupItem value="consumer" id="consumer" />
                <Label htmlFor="consumer" className="flex-1 cursor-pointer">
                  <div className="font-medium text-foreground">Explore and appreciate</div>
                  <div className="text-xs text-muted-foreground mt-1">Browse, comment, and rate photos</div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 bg-background/30 p-3 rounded-md border border-border/30 hover:border-primary/30 transition-colors">
                <RadioGroupItem value="creator" id="creator" />
                <Label htmlFor="creator" className="flex-1 cursor-pointer">
                  <div className="font-medium text-foreground">Share my work</div>
                  <div className="text-xs text-muted-foreground mt-1">Upload photos to the gallery</div>
                </Label>
              </div>
            </RadioGroup>
          </div>
          <Button 
            type="submit" 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium tracking-wide h-12"
            disabled={createUser.isPending}
          >
            {createUser.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Enter PhotoShare"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
