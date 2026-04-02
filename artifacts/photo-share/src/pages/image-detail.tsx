import { useState } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetImage, 
  useGetComments, 
  useCreateComment,
  useRateImage,
  getGetImageQueryKey,
  getGetCommentsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { RatingStars } from "@/components/rating-stars";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, User as UserIcon, Calendar, MessageSquare, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ImageDetail() {
  const { id } = useParams();
  const imageId = parseInt(id || "0", 10);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [commentText, setCommentText] = useState("");
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [localUserRating, setLocalUserRating] = useState(0);

  const { data: image, isLoading: isImageLoading, isError: isImageError } = useGetImage(imageId, {
    query: { enabled: !!imageId, queryKey: getGetImageQueryKey(imageId) }
  });

  const { data: comments, isLoading: isCommentsLoading } = useGetComments(imageId, {
    query: { enabled: !!imageId, queryKey: getGetCommentsQueryKey(imageId) }
  });

  const createComment = useCreateComment();
  const rateImage = useRateImage();

  if (isImageError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-serif text-foreground">Image not found</h2>
        <p className="text-muted-foreground mt-2">This image might have been removed or doesn't exist.</p>
        <Link href="/">
          <Button variant="outline" className="mt-6">Return to Gallery</Button>
        </Link>
      </div>
    );
  }

  if (isImageLoading || !image) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="w-full aspect-[4/3] rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="w-3/4 h-10" />
          <Skeleton className="w-1/2 h-6" />
          <Skeleton className="w-full h-24" />
        </div>
      </div>
    );
  }

  const handleRate = (rating: number) => {
    if (!user) {
      toast.error("You must be logged in to rate images");
      return;
    }
    setLocalUserRating(rating);
    rateImage.mutate(
      { data: { imageId, userId: user.id, rating } },
      {
        onSuccess: () => {
          toast.success(`You rated this image ${rating} stars`);
          queryClient.invalidateQueries({ queryKey: getGetImageQueryKey(imageId) });
        },
        onError: () => {
          toast.error("Failed to submit rating");
          setLocalUserRating(0);
        }
      }
    );
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to comment");
      return;
    }
    if (!commentText.trim()) return;

    createComment.mutate(
      { data: { imageId, userId: user.id, text: commentText } },
      {
        onSuccess: () => {
          setCommentText("");
          toast.success("Comment added");
          queryClient.invalidateQueries({ queryKey: getGetCommentsQueryKey(imageId) });
          queryClient.invalidateQueries({ queryKey: getGetImageQueryKey(imageId) });
        },
        onError: () => {
          toast.error("Failed to post comment");
        }
      }
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        {/* Left Column - Image */}
        <div className="space-y-6">
          <div 
            className="relative rounded-xl overflow-hidden bg-secondary border border-border/30 group"
            onMouseEnter={() => setIsHoveringImage(true)}
            onMouseLeave={() => setIsHoveringImage(false)}
          >
            <img 
              src={image.url} 
              alt={image.title}
              className="w-full h-auto object-contain max-h-[80vh] mx-auto"
            />
          </div>

          {/* Stats Bar under image */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-card border border-border/40 p-4 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Average Rating</span>
                <div className="flex items-center gap-2 mt-1">
                  <RatingStars rating={image.averageRating || 0} readOnly size="sm" />
                  <span className="font-medium">{image.averageRating ? image.averageRating.toFixed(1) : "New"}</span>
                  <span className="text-muted-foreground text-sm">({image.ratingCount})</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {user && (
                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Your Rating</span>
                  <div className="mt-1">
                    <RatingStars rating={localUserRating} onRate={handleRate} size="lg" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-serif text-foreground mb-2 leading-tight">{image.title}</h1>
            
            <Link href={`/creator/${image.creatorId}`} className="inline-flex items-center gap-3 p-2 -ml-2 rounded-lg hover:bg-secondary/50 transition-colors">
              <Avatar className="w-10 h-10 border border-border">
                <AvatarImage src={image.creatorAvatarUrl || undefined} />
                <AvatarFallback>{image.creatorDisplayName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground text-sm">{image.creatorDisplayName}</p>
                <p className="text-xs text-muted-foreground">@{image.creatorUsername}</p>
              </div>
            </Link>
          </div>

          {image.caption && (
            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/80">
              <p className="text-base leading-relaxed whitespace-pre-wrap">{image.caption}</p>
            </div>
          )}

          <div className="space-y-4 pt-4 border-t border-border/40">
            {image.location && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{image.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{format(new Date(image.createdAt), "MMMM d, yyyy")}</span>
            </div>
          </div>

          {image.tags && image.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-border/40">
              {image.tags.map((tag, idx) => (
                <Link key={idx} href={`/search?q=${tag}`}>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors">
                    {tag}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="max-w-3xl mx-auto pt-12 border-t border-border/40 mt-12">
        <h3 className="text-2xl font-serif mb-6 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Reflections ({image.commentCount})
        </h3>

        {user ? (
          <form onSubmit={handleCommentSubmit} className="mb-10 space-y-4">
            <div className="flex gap-4">
              <Avatar className="w-10 h-10 border border-border shrink-0 hidden sm:block">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback>{user.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea 
                  placeholder="Share your thoughts on this piece..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[100px] resize-none bg-card border-border/50 focus-visible:ring-primary/50"
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={!commentText.trim() || createComment.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Post Comment
                  </Button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="bg-card border border-border/40 rounded-lg p-6 mb-10 text-center">
            <p className="text-muted-foreground mb-4">You must be logged in to join the conversation.</p>
          </div>
        )}

        <div className="space-y-6">
          {isCommentsLoading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="w-32 h-4" />
                    <Skeleton className="w-full h-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments && comments.length > 0 ? (
            comments.map(comment => (
              <div key={comment.id} className="flex gap-4 animate-in fade-in slide-in-from-bottom-2">
                <Link href={`/creator/${comment.userId}`}>
                  <Avatar className="w-10 h-10 border border-border cursor-pointer hover:border-primary transition-colors shrink-0">
                    <AvatarImage src={comment.avatarUrl || undefined} />
                    <AvatarFallback>{comment.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1">
                  <div className="bg-card border border-border/30 rounded-2xl rounded-tl-none p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Link href={`/creator/${comment.userId}`}>
                        <span className="font-medium text-sm hover:text-primary transition-colors cursor-pointer">
                          {comment.displayName}
                        </span>
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <p className="text-foreground/90 text-sm whitespace-pre-wrap">{comment.text}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-muted-foreground border border-border/20 border-dashed rounded-xl bg-card/20">
              No thoughts shared yet. Be the first to reflect on this piece.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
