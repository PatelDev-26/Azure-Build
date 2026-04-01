import { Link } from "wouter";
import { Image } from "@workspace/api-client-react";
import { Star, MessageCircle, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ImageCardProps {
  image: Image;
}

export function ImageCard({ image }: ImageCardProps) {
  return (
    <Link href={`/image/${image.id}`} className="masonry-item block group relative overflow-hidden rounded-xl bg-card border border-border/30 hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
      <div className="relative overflow-hidden bg-secondary/50">
        <img 
          src={image.thumbnailUrl || image.url} 
          alt={image.title} 
          className="object-cover w-full h-auto min-h-[200px] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out" />
        
        <div className="absolute bottom-0 left-0 right-0 p-5 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-in-out">
          <h3 className="font-serif text-xl font-medium text-foreground drop-shadow-md">{image.title}</h3>
          <p className="text-sm text-muted-foreground/90 flex items-center gap-1.5 mt-1">
            by <span className="text-primary font-medium">{image.creatorDisplayName}</span>
          </p>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3 text-xs text-foreground/90">
              <span className="flex items-center gap-1 bg-background/50 backdrop-blur-sm px-2 py-1 rounded-md">
                <Star className={`w-3 h-3 ${image.averageRating ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                {image.averageRating ? image.averageRating.toFixed(1) : "New"}
              </span>
              <span className="flex items-center gap-1 bg-background/50 backdrop-blur-sm px-2 py-1 rounded-md">
                <MessageCircle className="w-3 h-3 text-muted-foreground" />
                {image.commentCount}
              </span>
            </div>
            
            {image.location && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground truncate max-w-[100px]">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{image.location}</span>
              </span>
            )}
          </div>
        </div>
        
        {/* Top badges that are always visible */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {image.tags?.slice(0, 2).map((tag, idx) => (
            <Badge key={idx} variant="secondary" className="bg-background/60 backdrop-blur-md hover:bg-background/80 text-[10px] uppercase tracking-wider py-0.5">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </Link>
  );
}
