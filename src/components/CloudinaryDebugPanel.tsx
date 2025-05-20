import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { checkCloudinaryUrl } from "@/lib/cloudinaryDebug";

interface CloudinaryDebugPanelProps {
  videoUrl: string | null;
  publicId: string | null;
  onRetry?: () => void;
}

// Use React.memo with custom comparison to prevent unnecessary re-renders
export default React.memo(
  function CloudinaryDebugPanel({
    videoUrl,
    publicId,
    onRetry,
  }: CloudinaryDebugPanelProps) {
    const [expanded, setExpanded] = useState(true);
    const [urlInfo, setUrlInfo] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [alternativeUrls, setAlternativeUrls] = useState<string[]>([]);

    const analyzeUrl = async () => {
      if (!videoUrl) return;

      setIsLoading(true);
      try {
        const info = await checkCloudinaryUrl(videoUrl);
        setUrlInfo(info);

        // Generate alternative URLs
        if (videoUrl) {
          try {
            // Extract base URL without query parameters
            const baseUrl = videoUrl.split("?")[0];

            // Use a stable timestamp to prevent flickering
            const stableTimestamp = Math.floor(Date.now() / 10000) * 10000; // Round to nearest 10 seconds
            const mp4Url = `${baseUrl}?f_mp4,vc_h264,vc_auto,q_auto:low,fl_progressive&_t=${stableTimestamp}`;

            const alternatives = [
              mp4Url,
              `${baseUrl}?f_auto,q_auto&_t=${stableTimestamp}`,
              `${baseUrl}?f_mp4,q_auto:low&_t=${stableTimestamp}`,
            ];

            setAlternativeUrls(alternatives);
          } catch (error) {
            console.error("Error generating alternative URLs:", error);
          }
        }
      } catch (error) {
        console.error("Error analyzing URL:", error);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <Card
        className="mt-4 bg-slate-50 border-slate-200"
        style={{ position: "relative", zIndex: 10 }}
      >
        <CardHeader
          className="py-3 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
          style={{ userSelect: "none" }}
        >
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Cloudinary Debug
            </CardTitle>
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
          <CardDescription className="text-xs">
            Troubleshoot video loading issues
          </CardDescription>
        </CardHeader>

        {expanded && (
          <CardContent
            className="pt-0 text-xs"
            style={{ position: "relative", zIndex: 20 }}
          >
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">Video URL:</h4>
                <div className="bg-slate-100 p-2 rounded break-all">
                  {videoUrl || "No URL available"}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-1">Public ID:</h4>
                <div className="bg-slate-100 p-2 rounded">
                  {publicId || "No public ID available"}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8"
                  onClick={analyzeUrl}
                  disabled={!videoUrl || isLoading}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />{" "}
                      Analyzing
                    </>
                  ) : (
                    "Analyze URL"
                  )}
                </Button>

                {onRetry && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRetry();
                    }}
                  >
                    Retry Loading
                  </Button>
                )}
              </div>

              {urlInfo && (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-1 flex items-center gap-1">
                      Status:{" "}
                      <Badge
                        variant={
                          urlInfo.status >= 200 && urlInfo.status < 300
                            ? "success"
                            : "destructive"
                        }
                        className="ml-1"
                      >
                        {urlInfo.status}
                      </Badge>
                    </h4>
                    {urlInfo.cloudinaryError && (
                      <div className="bg-red-50 text-red-800 p-2 rounded border border-red-200">
                        Error: {urlInfo.cloudinaryError}
                      </div>
                    )}
                  </div>

                  {urlInfo.responseHeaders && (
                    <div>
                      <h4 className="font-medium mb-1">Response Headers:</h4>
                      <div className="bg-slate-100 p-2 rounded">
                        <pre className="whitespace-pre-wrap">
                          {Object.entries(urlInfo.responseHeaders)
                            .map(([key, value]) => `${key}:\n${value}`)
                            .join("\n\n")}
                        </pre>
                      </div>
                    </div>
                  )}

                  {urlInfo.urlAnalysis && (
                    <div>
                      <h4 className="font-medium mb-1">URL Analysis:</h4>
                      <div className="bg-slate-100 p-2 rounded">
                        <pre className="whitespace-pre-wrap">
                          {Object.entries(urlInfo.urlAnalysis)
                            .map(([key, value]) => `${key}:\n${value}`)
                            .join("\n\n")}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {alternativeUrls.length > 0 && (
                <div>
                  <h4 className="font-medium mb-1">Alternative URLs to Try:</h4>
                  <div className="space-y-2">
                    {alternativeUrls.map((url, index) => (
                      <div key={index} className="bg-slate-100 p-2 rounded">
                        <div className="break-all mb-1">{url}</div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-6 px-2"
                            onClick={() => window.open(url, "_blank")}
                          >
                            Open
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-6 px-2"
                            onClick={() => {
                              if (onRetry) {
                                // Try to update the video source with this URL
                                try {
                                  const videoElements =
                                    document.querySelectorAll("video");
                                  if (videoElements.length > 0) {
                                    // Use a stable timestamp to prevent flickering
                                    const stableTimestamp =
                                      Math.floor(Date.now() / 10000) * 10000; // Round to nearest 10 seconds
                                    const fixedUrl = `${url.split("?")[0]}?f_mp4,vc_h264,w_640,h_360,vc_auto,q_auto:low,fl_progressive&_t=${stableTimestamp}`;

                                    videoElements.forEach((video) => {
                                      video.src = fixedUrl;
                                      video.load();
                                    });
                                    console.log(
                                      "Updated video sources with alternative URL:",
                                      fixedUrl,
                                    );
                                  }
                                } catch (error) {
                                  console.error(
                                    "Error updating video source:",
                                    error,
                                  );
                                }
                              }
                            }}
                          >
                            Try This
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 text-blue-800 p-2 rounded text-xs">
                <p className="font-medium">Troubleshooting Tips:</p>
                <ul className="list-disc pl-4 mt-1 space-y-1">
                  <li>
                    If you see a 404 error, the resource might not exist or
                    might still be processing.
                  </li>
                  <li>
                    Try using the "f_mp4" and "q_auto:low" parameters for better
                    compatibility.
                  </li>
                  <li>
                    Check that your Cloudinary account has the correct
                    configuration for video delivery.
                  </li>
                  <li>
                    Some browsers have restrictions on video formats. Try
                    opening the URL directly in a new tab.
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if these props actually changed
    return (
      prevProps.videoUrl === nextProps.videoUrl &&
      prevProps.publicId === nextProps.publicId
    );
  },
);
