import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X } from "lucide-react";

interface CloudinaryUploadHelperProps {
  onUploadSuccess: (url: string, publicId: string) => void;
  onUploadError: (error: string) => void;
}

export default function CloudinaryUploadHelper({
  onUploadSuccess,
  onUploadError,
}: CloudinaryUploadHelperProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadToCloudinary = async () => {
    if (!file) return;

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = "ml_default"; // Use unsigned upload preset

    if (!cloudName) {
      onUploadError("Cloudinary cloud name is not configured");
      return;
    }

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
      setUploading(true);
      setProgress(0);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setProgress(percentComplete);
        }
      };

      xhr.onload = function () {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          console.log("Upload complete:", response);
          onUploadSuccess(response.secure_url, response.public_id);
          setUploading(false);
          clearFile();
        } else {
          console.error("Upload failed:", xhr.responseText);
          onUploadError("Upload failed: " + xhr.responseText);
          setUploading(false);
        }
      };

      xhr.onerror = function () {
        console.error("XHR error");
        onUploadError("Network error during upload");
        setUploading(false);
      };

      xhr.send(formData);
    } catch (error) {
      console.error("Upload error:", error);
      onUploadError(
        "Error uploading file: " +
          (error instanceof Error ? error.message : String(error)),
      );
      setUploading(false);
    }
  };

  return (
    <Card className="bg-white">
      <CardContent className="pt-6">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center ${file ? "border-green-500" : "border-gray-300"}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {!file ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Upload className="h-12 w-12 text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-medium">
                  Drag and drop your video here
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  or click to browse (MP4, WebM, MOV files)
                </p>
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="mt-4"
              >
                Select File
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="video/*,image/*"
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex-shrink-0">
                    <video
                      className="h-16 w-16 rounded object-cover"
                      src={URL.createObjectURL(file)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFile}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {uploading ? (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-xs text-center text-gray-500">
                    Uploading... {progress}%
                  </p>
                </div>
              ) : (
                <Button
                  onClick={uploadToCloudinary}
                  className="w-full"
                  disabled={!file}
                >
                  <Upload className="mr-2 h-4 w-4" /> Upload to Cloudinary
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
