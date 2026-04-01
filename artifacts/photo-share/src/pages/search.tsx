import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useSearchImages } from "@workspace/api-client-react";
import { ImageCard } from "@/components/image-card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search as SearchIcon, Image as ImageIcon } from "lucide-react";

export default function Search() {
  const [location, setLocation] = useLocation();
  
  // Extract query from URL
  const searchParams = new URLSearchParams(window.location.search);
  const initialQuery = searchParams.get("q") || "";
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      if (searchQuery) {
        setLocation(`/search?q=${encodeURIComponent(searchQuery)}`, { replace: true });
      } else {
        setLocation('/search', { replace: true });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, setLocation]);

  const { data: searchResults, isLoading } = useSearchImages(
    { q: debouncedQuery }, 
    { query: { enabled: debouncedQuery.length > 0 } }
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col items-center justify-center space-y-6 py-12">
        <h1 className="text-4xl md:text-5xl font-serif text-center">Discover the Gallery</h1>
        
        <div className="relative w-full max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            type="text"
            placeholder="Search by title, location, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 text-lg bg-card/50 border-border/50 focus:border-primary/50 focus-visible:ring-primary/20 rounded-full shadow-sm"
          />
        </div>
      </div>

      {debouncedQuery.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <h2 className="font-serif text-xl">
              Results for <span className="text-primary italic">"{debouncedQuery}"</span>
            </h2>
            <span className="text-sm text-muted-foreground">
              {searchResults?.total || 0} found
            </span>
          </div>

          {isLoading ? (
            <div className="masonry">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="masonry-item mb-6">
                  <Skeleton className="w-full h-[250px] rounded-xl bg-card" />
                </div>
              ))}
            </div>
          ) : searchResults?.images && searchResults.images.length > 0 ? (
            <div className="masonry">
              {searchResults.images.map((image) => (
                <ImageCard key={image.id} image={image} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <ImageIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-foreground/80">No matches found</h3>
              <p className="text-muted-foreground mt-2">Try different keywords or tags.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          Enter a search term above to explore the collection.
        </div>
      )}
    </div>
  );
}
