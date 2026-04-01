import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useCreateImage } from "@workspace/api-client-react";
import { useUpload } from "@workspace/object-storage-web";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload as UploadIcon, Image as ImageIcon, AlertCircle, CloudUpload, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Upload() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const createImage = useCreateImage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedObjectPath, setUploadedObjectPath] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    caption: "",
    location: "",
    tags: ""
  });

  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: (response) => {
      setUploadedObjectPath(response.objectPath);
      toast.success("Image uploaded — now fill in the details and publish.");
    },
    onError: (err) => {
      toast.error(`Upload failed: ${err.message}`);
    }
  });

  if (!user || user.role !== "creator") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-serif text-foreground">Access Restricted</h2>
        <p className="text-muted-foreground mt-2">Only creator accounts can upload images to the gallery.</p>
      </div>
    );
  }

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPG, PNG, GIF, WEBP, etc.)");
      return;
    }
    setSelectedFile(file);
    setUploadedObjectPath(null);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    if (!formData.title) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setFormData(prev => ({
        ...prev,
        title: nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1)
      }));
    }

    await uploadFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadedObjectPath(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedObjectPath) {
      toast.error("Please upload an image from your device first.");
      return;
    }
    if (!formData.title) {
      toast.error("Title is required");
      return;
    }

    const imageUrl = `/api/storage${uploadedObjectPath}`;

    const tagsArray = formData.tags
      .split(",")
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    createImage.mutate(
      {
        data: {
          url: imageUrl,
          thumbnailUrl: imageUrl,
          title: formData.title,
          caption: formData.caption || undefined,
          location: formData.location || undefined,
          tags: tagsArray,
          creatorId: user.id
        }
      },
      {
        onSuccess: (newImage) => {
          toast.success("Published to your gallery!");
          setLocation(`/image/${newImage.id}`);
        },
        onError: () => {
          toast.error("Failed to publish. Please try again.");
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
            Upload a photo from your device to add it to your gallery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* File Upload Zone */}
            <div className="space-y-2">
              <Label className="text-foreground/80">Image File <span className="text-destructive">*</span></Label>

              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={cn(
                    "relative border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all duration-200",
                    "flex flex-col items-center justify-center gap-3 text-center",
                    isDragging
                      ? "border-primary bg-primary/10 scale-[1.01]"
                      : "border-border/50 bg-background/30 hover:border-primary/60 hover:bg-primary/5"
                  )}
                >
                  <CloudUpload className={cn("w-10 h-10 transition-colors", isDragging ? "text-primary" : "text-muted-foreground")} />
                  <div>
                    <p className="font-medium text-foreground">
                      {isDragging ? "Drop your image here" : "Choose a photo from your device"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">or drag and drop it here</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP, GIF supported</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="mt-1 pointer-events-none">
                    Browse Files
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-xl border border-border/50">
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                    {previewUrl && (
                      <img src={previewUrl} alt="Selected" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {isUploading && (
                      <div className="mt-1">
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Uploading... {progress}%</p>
                      </div>
                    )}
                    {uploadedObjectPath && !isUploading && (
                      <div className="flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <p className="text-xs text-green-500">Upload complete</p>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                    disabled={isUploading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={isUploading}
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
                className="bg-background/50 min-h-[100px] resize-none"
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
                  placeholder="street, night, film"
                  className="bg-background/50"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-medium"
              disabled={createImage.isPending || isUploading || !uploadedObjectPath || !formData.title}
            >
              {createImage.isPending ? "Publishing..." : isUploading ? "Uploading..." : "Publish to Gallery"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      <div className="sticky top-24 space-y-4">
        <h3 className="font-serif text-xl text-foreground/80 pl-2 border-l-2 border-primary">Preview</h3>
        <div className="rounded-xl border border-border/50 bg-secondary/30 overflow-hidden aspect-[4/3] relative flex items-center justify-center">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center text-muted-foreground flex flex-col items-center">
              <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
              <p>Your image will appear here</p>
            </div>
          )}
        </div>

        {formData.title && (
          <div className="bg-card p-4 rounded-xl border border-border/30">
            <h4 className="font-serif text-lg">{formData.title}</h4>
            {formData.location && <p className="text-sm text-muted-foreground mt-1">{formData.location}</p>}
            {formData.caption && <p className="text-sm text-foreground/70 mt-2 line-clamp-3">{formData.caption}</p>}
          </div>
        )}
      </div>

    </div>
  );
}
