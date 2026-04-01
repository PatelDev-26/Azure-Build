import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateImage } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload as UploadIcon, Image as ImageIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function Upload() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const createImage = useCreateImage();
  const [previewError, setPreviewError] = useState(false);

  const [formData, setFormData] = useState({
    url: "",
    title: "",
    caption: "",
    location: "",
    tags: ""
  });

  // Protect route
  if (!user || user.role !== "creator") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-serif text-foreground">Access Restricted</h2>
        <p className="text-muted-foreground mt-2">Only creator accounts can upload images to the gallery.</p>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (e.target.name === 'url') setPreviewError(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.url || !formData.title) {
      toast.error("Image URL and Title are required");
      return;
    }

    const tagsArray = formData.tags
      .split(",")
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    createImage.mutate(
      {
        data: {
          url: formData.url,
          title: formData.title,
          caption: formData.caption || undefined,
          location: formData.location || undefined,
          tags: tagsArray,
          creatorId: user.id
        }
      },
      {
        onSuccess: (newImage) => {
          toast.success("Image added to gallery!");
          setLocation(`/image/${newImage.id}`);
        },
        onError: () => {
          toast.error("Failed to upload image. Please check the details.");
        }
      }
    );
  };

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-in fade-in">
      
      <Card className="bg-card border-border/40 shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-serif text-primary flex items-center gap-2">
            <UploadIcon className="w-6 h-6" />
            Exhibit Work
          </CardTitle>
          <CardDescription className="text-base">
            Add a new piece to your gallery portfolio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="url" className="text-foreground/80">Image URL <span className="text-destructive">*</span></Label>
              <Input
                id="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-foreground/80">Title <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Midnight in Kyoto"
                className="bg-background/50 font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="caption" className="text-foreground/80">Story / Caption</Label>
              <Textarea
                id="caption"
                name="caption"
                value={formData.caption}
                onChange={handleChange}
                placeholder="The story behind this shot..."
                className="bg-background/50 min-h-[120px] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location" className="text-foreground/80">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Kyoto, Japan"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags" className="text-foreground/80">Tags</Label>
                <Input
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="street, night, film (comma separated)"
                  className="bg-background/50"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-medium"
              disabled={createImage.isPending || !formData.url || !formData.title}
            >
              {createImage.isPending ? "Adding to Gallery..." : "Publish to Gallery"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Preview Section */}
      <div className="sticky top-24 space-y-4">
        <h3 className="font-serif text-xl text-foreground/80 pl-2 border-l-2 border-primary">Preview</h3>
        <div className="rounded-xl border border-border/50 bg-secondary/30 overflow-hidden aspect-[4/3] relative flex items-center justify-center">
          {formData.url && !previewError ? (
            <img 
              src={formData.url} 
              alt="Preview" 
              className="w-full h-full object-cover"
              onError={() => setPreviewError(true)}
            />
          ) : (
            <div className="text-center text-muted-foreground flex flex-col items-center">
              <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
              <p>{previewError ? "Invalid Image URL" : "Image preview will appear here"}</p>
            </div>
          )}
        </div>
        
        {formData.title && (
          <div className="bg-card p-4 rounded-xl border border-border/30">
            <h4 className="font-serif text-lg">{formData.title}</h4>
            {formData.location && <p className="text-sm text-muted-foreground mt-1">{formData.location}</p>}
          </div>
        )}
      </div>

    </div>
  );
}
