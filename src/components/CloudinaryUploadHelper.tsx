import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload, CheckCircle, X } from "lucide-react";

interface CloudinaryUploadHelperProps {
  onUploadSuccess: (url: string, publicId: string) => void;
  onUploadError?: (error: string) => void;
}

export default function CloudinaryUploadHelper({
  onUploadSuccess,
  onUploadError,
}: CloudinaryUploadHelperProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setUploadError(null);

      // Generate thumbnail URL for preview
      const url = URL.createObjectURL(file);
      setThumbnailUrl(url);
    }
  };

  const uploadToCloudinary = async () => {
    if (!videoFile || !cloudName) {
      const errorMsg = "Missing video file or Cloudinary configuration";
      setUploadError(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
      return;
    }

    // Validate file size (max 100MB)
    if (videoFile.size > 100 * 1024 * 1024) {
      const errorMsg = "File size exceeds the 100MB limit";
      setUploadError(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // Create a FormData instance
      const formData = new FormData();
      formData.append("file", videoFile);
      formData.append("upload_preset", "video_borders"); // Make sure this preset is created in your Cloudinary dashboard
      // Explicitly set resource_type to video
      formData.append("resource_type", "video");
      formData.append("cloud_name", cloudName);
      // Add timestamp to prevent caching issues
      formData.append("timestamp", Date.now().toString());

      console.log("Uploading to Cloudinary with:", {
        cloudName,
        fileType: videoFile.type,
        fileSize: `${(videoFile.size / (1024 * 1024)).toFixed(2)} MB`,
      });

      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
      );

      // Set CORS headers
      xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round(
            (event.loaded / event.total) * 100,
          );
          setUploadProgress(percentComplete);
        }
      };

      // Handle response
      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log("Cloudinary upload success:", response);
            // Make sure we're getting the correct properties from the response
            if (!response.secure_url || !response.public_id) {
              console.error(
                "Missing secure_url or public_id in response",
                response,
              );
              throw new Error("Invalid response from Cloudinary");
            }
            // Log the full response for debugging
            console.log("Full Cloudinary upload response:", response);

            // Wait a moment to ensure Cloudinary has processed the video
            setTimeout(() => {
              // Use the secure_url which is guaranteed to work
              console.log(
                "Using secure_url from response:",
                response.secure_url,
              );

              // Call the success callback with the secure_url
              onUploadSuccess(response.secure_url, response.public_id);

              // Also log the URL that will be used for verification
              console.log(
                "Video should be accessible at:",
                response.secure_url,
              );
            }, 1000); // Wait 1 second before proceeding
          } catch (e) {
            const errorMsg = "Error processing the server response";
            console.error(errorMsg, e);
            setUploadError(errorMsg);
            if (onUploadError) onUploadError(errorMsg);
          }
        } else {
          try {
            const response = JSON.parse(xhr.responseText);
            const errorMsg = `Upload failed: ${response.error?.message || xhr.statusText}`;
            setUploadError(errorMsg);
            if (onUploadError) onUploadError(errorMsg);
          } catch (e) {
            const errorMsg = `Upload failed: ${xhr.statusText || "Unknown error"}`;
            setUploadError(errorMsg);
            if (onUploadError) onUploadError(errorMsg);
          }
        }
        setIsUploading(false);
      };

      // Handle errors
      xhr.onerror = () => {
        const errorMsg = "Network error during upload";
        console.error(errorMsg);
        setUploadError(errorMsg);
        if (onUploadError) onUploadError(errorMsg);
        setIsUploading(false);
      };

      // Handle HTTP errors
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status !== 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              console.error("Cloudinary upload error:", response);
              const errorMsg = `Upload failed: ${response.error?.message || xhr.statusText}`;
              setUploadError(errorMsg);
              if (onUploadError) onUploadError(errorMsg);
            } catch (e) {
              console.error(
                "Error parsing Cloudinary response:",
                xhr.responseText,
              );
              const errorMsg = `Upload failed: ${xhr.statusText || "Bad Request"}`;
              setUploadError(errorMsg);
              if (onUploadError) onUploadError(errorMsg);
            }
            setIsUploading(false);
          }
        }
      };

      // Add a timestamp parameter to bypass cache
      const timestamp = Math.floor(Date.now() / 1000);
      formData.append("timestamp", String(timestamp));

      // Send the request
      xhr.send(formData);
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      const errorMsg = `Error uploading to Cloudinary: ${error.message || "Unknown error"}`;
      setUploadError(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
      setIsUploading(false);
    }
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [thumbnailUrl]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Video</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="video/*,image/*"
            className="hidden"
          />
          <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">
            Drag and drop or click to upload
          </h3>
          <p className="text-gray-500 mb-4">Video or image files up to 100MB</p>

          {videoFile && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                {thumbnailUrl && (
                  <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                    {videoFile?.type.startsWith("video/") ? (
                      <video
                        src={thumbnailUrl}
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <img
                        src={thumbnailUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                )}
                <div className="text-left">
                  <p className="font-medium truncate max-w-xs">
                    {videoFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setVideoFile(null);
                  if (thumbnailUrl) {
                    URL.revokeObjectURL(thumbnailUrl);
                    setThumbnailUrl(null);
                  }
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {uploadError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
            <X className="h-5 w-5 mr-2 flex-shrink-0" />
            <p>{uploadError}</p>
          </div>
        )}

        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        <Button
          onClick={uploadToCloudinary}
          disabled={!videoFile || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading... {uploadProgress}%
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload to Cloudinary
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
