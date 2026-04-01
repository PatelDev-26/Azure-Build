import { useParams } from "wouter";
import { useGetUser, useGetImages } from "@workspace/api-client-react";
import { ImageCard } from "@/components/image-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";

export default function CreatorProfile() {
  const { id } = useParams();
  const userId = parseInt(id || "0", 10);

  const { data: creator, isLoading: isUserLoading } = useGetUser(userId, {
    query: { enabled: !!userId }
  });

  const { data: imagesData, isLoading: isImagesLoading } = useGetImages(
    { creatorId: userId.toString() },
    { query: { enabled: !!userId } }
  );

  if (isUserLoading) {
    return (
      <div className="max-w-4xl mx-auto py-10 space-y-8">
        <div className="flex items-center gap-6">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="space-y-3">
            <Skeleton className="w-48 h-8" />
            <Skeleton className="w-32 h-4" />
          </div>
        </div>
        <div className="masonry">
          {[1, 2, 3].map(i => <Skeleton key={i} className="w-full h-64 rounded-xl masonry-item mb-6" />)}
        </div>
      </div>
    );
  }

  if (!creator) {
    return <div className="text-center py-20 text-muted-foreground text-xl">Creator not found</div>;
  }

  return (
    <div className="space-y-12 max-w-6xl mx-auto animate-in fade-in">
      {/* Profile Header */}
      <div className="bg-card border border-border/40 rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <Avatar className="w-24 h-24 border-2 border-primary/20 shadow-xl">
            <AvatarImage src={creator.avatarUrl || undefined} />
            <AvatarFallback className="text-2xl bg-secondary">{creator.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-serif text-foreground">{creator.displayName}</h1>
              <Badge variant="outline" className="border-primary/50 text-primary capitalize tracking-wider text-[10px]">
                {creator.role}
              </Badge>
            </div>
            <p className="text-muted-foreground font-medium">@{creator.username}</p>
            
            {creator.bio && (
              <p className="text-foreground/80 max-w-2xl mt-2">{creator.bio}</p>
            )}
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
              <Calendar className="w-4 h-4" />
              <span>Joined {format(new Date(creator.createdAt), "MMMM yyyy")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <h2 className="font-serif text-2xl">Portfolio</h2>
          <span className="text-muted-foreground text-sm">
            {imagesData?.total || 0} Works
          </span>
        </div>

        {isImagesLoading ? (
          <div className="masonry">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="masonry-item mb-6">
                <Skeleton className="w-full h-[250px] rounded-xl bg-card" />
              </div>
            ))}
          </div>
        ) : imagesData?.images && imagesData.images.length > 0 ? (
          <div className="masonry">
            {imagesData.images.map((image) => (
              <ImageCard key={image.id} image={image} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card/30 rounded-xl border border-border/30 border-dashed">
            <ImageIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-serif text-xl mb-2 text-foreground/80">No works displayed</h3>
            <p className="text-muted-foreground">This creator hasn't published any images yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
