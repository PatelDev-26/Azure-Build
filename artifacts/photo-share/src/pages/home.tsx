import { useState, useMemo } from "react";
import { useGetImages, useGetFeedStats, useGetTrendingImages } from "@workspace/api-client-react";
import { ImageCard } from "@/components/image-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, Image as ImageIcon, Users, MessageSquare, Star, TrendingUp } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function Home() {
  const { data: stats, isLoading: isStatsLoading } = useGetFeedStats();
  const { data: trendingData, isLoading: isTrendingLoading } = useGetTrendingImages({ limit: 10 });
  const { data: feedData, isLoading: isFeedLoading } = useGetImages();

  return (
    <div className="space-y-12 pb-12">
      {/* Stats Bar */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<ImageIcon />} label="Images" value={stats?.totalImages} loading={isStatsLoading} />
        <StatCard icon={<Users />} label="Creators" value={stats?.totalUsers} loading={isStatsLoading} />
        <StatCard icon={<MessageSquare />} label="Comments" value={stats?.totalComments} loading={isStatsLoading} />
        <StatCard icon={<Star />} label="Ratings" value={stats?.totalRatings} loading={isStatsLoading} />
      </section>

      {/* Trending Section */}
      {(!isTrendingLoading && trendingData?.images && trendingData.images.length > 0) && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary border-b border-border/40 pb-2">
            <TrendingUp className="w-5 h-5" />
            <h2 className="font-serif text-2xl font-medium">Trending Gallery</h2>
          </div>
          
          <ScrollArea className="w-full whitespace-nowrap rounded-md">
            <div className="flex w-max space-x-4 p-1 pb-4">
              {trendingData.images.map((image) => (
                <div key={image.id} className="w-[280px] sm:w-[350px] shrink-0">
                  <ImageCard image={image} />
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="bg-border/20" />
          </ScrollArea>
        </section>
      )}

      {/* Main Feed */}
      <section className="space-y-6 mt-8">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-serif text-2xl font-medium">Latest Submissions</h2>
          </div>
        </div>

        {isFeedLoading ? (
          <div className="masonry">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="masonry-item mb-6">
                <Skeleton className="w-full h-[300px] rounded-xl bg-card border border-border/30" />
              </div>
            ))}
          </div>
        ) : feedData?.images && feedData.images.length > 0 ? (
          <div className="masonry">
            {feedData.images.map((image) => (
              <ImageCard key={image.id} image={image} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card/30 rounded-xl border border-border/30 border-dashed">
            <Camera className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-serif text-xl mb-2 text-foreground/80">The gallery is empty</h3>
            <p className="text-muted-foreground">Be the first to share a moment.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, loading }: { icon: React.ReactNode, label: string, value?: number, loading: boolean }) {
  return (
    <div className="bg-card/50 border border-border/40 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-2 hover:bg-card hover:border-primary/30 transition-all">
      <div className="p-2 bg-primary/10 text-primary rounded-full">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
        {loading ? (
          <Skeleton className="h-6 w-16 mt-1 mx-auto" />
        ) : (
          <p className="text-2xl font-serif text-foreground">{value || 0}</p>
        )}
      </div>
    </div>
  );
}
