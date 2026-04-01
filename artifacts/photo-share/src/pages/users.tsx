import { useGetUsers } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function Users() {
  const { data: users, isLoading } = useGetUsers();

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in">
      <div className="border-b border-border/40 pb-4">
        <h1 className="text-4xl font-serif text-foreground mb-2">Community</h1>
        <p className="text-muted-foreground">The creators and connoisseurs that make up the gallery.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-card border-border/30">
              <CardContent className="p-6 flex items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="w-2/3 h-5" />
                  <Skeleton className="w-1/2 h-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users?.map(user => (
            <Link key={user.id} href={user.role === 'creator' ? `/creator/${user.id}` : "#"}>
              <Card className={`bg-card border-border/30 transition-all hover:bg-card/80 ${user.role === 'creator' ? 'cursor-pointer hover:border-primary/50 hover:shadow-lg' : 'cursor-default'}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-14 h-14 border border-border">
                      <AvatarImage src={user.avatarUrl || undefined} />
                      <AvatarFallback className="bg-secondary">{user.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-medium text-foreground truncate">{user.displayName}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 truncate">@{user.username}</p>
                      
                      <div className="flex items-center justify-between mt-3">
                        <Badge variant="secondary" className={`text-[10px] uppercase tracking-wider ${user.role === 'creator' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-secondary text-muted-foreground'}`}>
                          {user.role}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(user.createdAt), "MMM yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
