import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Star, Loader2, CheckCircle2, AlertCircle, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PhotoFile {
  id?: number;
  file?: File;
  preview?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url?: string;
  isPrimary: boolean;
  uploadedAt?: Date;
}

interface VehiclePhotoUploadProps {
  vehicleId: number;
  onPhotosUploaded?: (photos: PhotoFile[]) => void;
  maxPhotos?: number;
  existingPhotos?: PhotoFile[];
}

const SUPPORTED_FORMATS = ["PNG", "JPEG", "JPG", "WebP", "GIF", "BMP", "TIFF"];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

/**
 * Vehicle Photo Upload Component
 * Supports: PNG, JPEG, JPG, WebP, GIF, BMP, TIFF
 * Max size: 15MB per image
 */
export function VehiclePhotoUpload({
  vehicleId,
  onPhotosUploaded,
  maxPhotos = 10,
  existingPhotos = [],
}: VehiclePhotoUploadProps) {
  const [photos, setPhotos] = useState<PhotoFile[]>(existingPhotos);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    const fileExtension = file.name.split(".").pop()?.toUpperCase();
    if (!SUPPORTED_FORMATS.includes(fileExtension || "")) {
      return { valid: false, error: `Unsupported format: ${fileExtension}. Supported: ${SUPPORTED_FORMATS.join(", ")}` };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: `File size exceeds 15MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)` };
    }

    return { valid: true };
  };

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const newPhotos: PhotoFile[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate
        const validation = validateFile(file);
        if (!validation.valid) {
          toast.error(`${file.name}: ${validation.error}`);
          continue;
        }

        // Check total count
        if (photos.length + newPhotos.length >= maxPhotos) {
          toast.error(`Maximum ${maxPhotos} photos allowed`);
          break;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          const photoWithPreview: PhotoFile = {
            file,
            preview: e.target?.result as string,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            isPrimary: photos.length + newPhotos.length === 0, // First photo is primary
          };

          setPhotos((prev) => [...prev, photoWithPreview]);
        };
        reader.readAsDataURL(file);

        newPhotos.push({
          file,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          isPrimary: photos.length + newPhotos.length === 0,
        });
      }
    },
    [photos.length, maxPhotos]
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // If removed photo was primary, make first remaining primary
      if (prev[index].isPrimary && updated.length > 0) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  };

  const setPrimary = (index: number) => {
    setPhotos((prev) =>
      prev.map((photo, i) => ({
        ...photo,
        isPrimary: i === index,
      }))
    );
  };

  const handleUpload = async () => {
    if (photos.length === 0) {
      toast.error("Please select at least one photo");
      return;
    }

    setIsUploading(true);

    try {
      // Simulate upload
      // In production, this would call the backend API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success(`${photos.length} photo(s) uploaded successfully`);

      if (onPhotosUploaded) {
        onPhotosUploaded(photos);
      }

      // Reset
      setPhotos([]);
    } catch (error) {
      toast.error("Failed to upload photos");
    } finally {
      setIsUploading(false);
    }
  };

  const totalSize = photos.reduce((sum, p) => sum + p.fileSize, 0);
  const canAddMore = photos.length < maxPhotos;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Photos</CardTitle>
        <CardDescription>Upload high-quality photos of your vehicle. Supports PNG, JPEG, WebP, GIF, BMP, TIFF (max 15MB each)</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Upload Area */}
        {canAddMore && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition",
              dragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-slate-400"
            )}
          >
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp,image/tiff"
              onChange={handleInputChange}
              className="hidden"
              id="photo-input"
              disabled={isUploading}
            />
            <label htmlFor="photo-input" className="cursor-pointer block">
              <Upload className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-medium text-slate-900">Click to upload or drag and drop</p>
              <p className="text-xs text-slate-500 mt-1">PNG, JPEG, WebP, GIF, BMP, TIFF (up to 15MB each)</p>
            </label>
          </div>
        )}

        {/* Photos Grid */}
        {photos.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">
                Selected Photos ({photos.length}/{maxPhotos})
              </h3>
              <span className="text-xs text-slate-500">{(totalSize / 1024 / 1024).toFixed(2)}MB total</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative group">
                  {/* Photo Preview */}
                  <div className="relative w-full aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                    {photo.preview ? (
                      <img src={photo.preview} alt={photo.fileName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-slate-400" />
                      </div>
                    )}

                    {/* Primary Badge */}
                    {photo.isPrimary && (
                      <Badge className="absolute top-2 left-2 bg-yellow-500">
                        <Star className="w-3 h-3 mr-1" />
                        Primary
                      </Badge>
                    )}

                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      {!photo.isPrimary && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setPrimary(index)}
                          title="Set as primary photo"
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removePhoto(index)}
                        title="Remove photo"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* File Info */}
                  <div className="mt-2">
                    <p className="text-xs font-medium truncate">{photo.fileName}</p>
                    <p className="text-xs text-slate-500">{(photo.fileSize / 1024 / 1024).toFixed(2)}MB</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Messages */}
        {photos.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No photos selected yet. Upload at least one photo to showcase your vehicle.</AlertDescription>
          </Alert>
        )}

        {!canAddMore && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Maximum {maxPhotos} photos reached</AlertDescription>
          </Alert>
        )}

        {/* Upload Button */}
        {photos.length > 0 && (
          <Button onClick={handleUpload} disabled={isUploading} className="w-full" size="lg">
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading {photos.length} photo(s)...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Upload {photos.length} Photo{photos.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default VehiclePhotoUpload;
