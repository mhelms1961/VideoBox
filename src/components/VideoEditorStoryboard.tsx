import { useState } from "react";
import CloudinaryUploadHelper from "./CloudinaryUploadHelper";
import CloudinaryVideoEditor from "./CloudinaryVideoEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function VideoEditorStoryboard() {
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState<string | null>(
    null,
  );
  const [uploadError, setUploadError] = useState<string | null>(null);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
  const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY || "";

  const handleUploadSuccess = (url: string, publicId: string) => {
    setUploadedVideoUrl(url);
    setCloudinaryPublicId(publicId);
    setUploadError(null);
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
    console.error("Upload error:", error);
  };

  const handleReset = () => {
    setUploadedVideoUrl(null);
    setCloudinaryPublicId(null);
    setUploadError(null);
  };

  return (
    <div className="bg-white min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Video Border Editor</h1>
            <p className="text-gray-600">
              Upload your video and customize borders to make your content stand
              out
            </p>
          </div>
          <Link to="/">
            <Button variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </Link>
        </div>

        {!uploadedVideoUrl ? (
          <Card className="border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle>Upload Your Video</CardTitle>
            </CardHeader>
            <CardContent>
              <CloudinaryUploadHelper
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
              />
              {uploadError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                  {uploadError}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Button variant="outline" onClick={handleReset} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Upload Another Video
            </Button>

            <CloudinaryVideoEditor
              initialVideoUrl={uploadedVideoUrl}
              cloudinaryPublicId={cloudinaryPublicId}
              cloudName={cloudName}
              apiKey={apiKey}
            />
          </div>
        )}
      </div>
    </div>
  );
}
