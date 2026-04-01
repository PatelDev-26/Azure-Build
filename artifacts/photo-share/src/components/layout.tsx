import { Link, useLocation } from "wouter";
import { Camera, Search, PlusSquare, Users, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { AuthModal } from "./auth-modal";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-[100dvh] flex flex-col relative bg-background text-foreground">
      <div className="film-grain" />
      
      {/* Navigation */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-background/80 border-b border-border/40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center transition-transform group-hover:scale-105">
              <Camera className="w-5 h-5" />
            </div>
            <span className="font-serif text-xl font-medium tracking-tight text-foreground group-hover:text-primary transition-colors">
              PhotoShare
            </span>
          </Link>

          {user && (
            <nav className="flex items-center gap-2 sm:gap-6">
              <Link href="/search" className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5 ${location === "/search" ? "text-primary" : "text-muted-foreground"}`}>
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
              </Link>
              <Link href="/users" className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5 ${location === "/users" ? "text-primary" : "text-muted-foreground"}`}>
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Community</span>
              </Link>
              {user.role === "creator" && (
                <Link href="/upload" className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5 ${location === "/upload" ? "text-primary" : "text-muted-foreground"}`}>
                  <PlusSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Upload</span>
                </Link>
              )}

              <div className="pl-4 border-l border-border/40 ml-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full focus-visible:ring-1 focus-visible:ring-primary">
                      <Avatar className="h-9 w-9 border border-border/50">
                        <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName} />
                        <AvatarFallback className="bg-secondary text-secondary-foreground">
                          {user.displayName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">@{user.username}</p>
                        <div className="pt-2">
                          <Badge variant="outline" className={user.role === 'creator' ? 'border-primary/50 text-primary' : 'border-border'}>
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user.role === "creator" && (
                      <DropdownMenuItem asChild>
                        <Link href={`/creator/${user.id}`} className="cursor-pointer">My Profile</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background py-8 text-center text-sm text-muted-foreground">
        <p className="font-serif italic text-primary/60">Every image has space to breathe.</p>
        <p className="mt-2">&copy; {new Date().getFullYear()} PhotoShare Gallery.</p>
      </footer>

      {/* Auth Guard Modal */}
      <AuthModal />
    </div>
  );
}
