import { useState, useRef, useCallback, useMemo, memo, useEffect } from "react";
import {
  checkCloudinaryUrl,
  generateAlternativeUrls,
} from "@/lib/cloudinaryDebug";
import CloudinaryDebugPanel from "@/components/CloudinaryDebugPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Pause,
  Download,
  Upload,
  RefreshCw,
  Loader2,
  X,
  Check,
  Image,
  Type,
  Sliders,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Cloudinary } from "@cloudinary/url-gen";
import { fill, scale, crop } from "@cloudinary/url-gen/actions/resize";
import {
  brightness,
  contrast,
  saturation,
} from "@cloudinary/url-gen/actions/adjust";
import { grayscale, sepia } from "@cloudinary/url-gen/actions/effect";
import { byRadius } from "@cloudinary/url-gen/actions/roundCorners";
import { source } from "@cloudinary/url-gen/actions/overlay";
import { text, subtitles } from "@cloudinary/url-gen/qualifiers/source";
import { Position } from "@cloudinary/url-gen/qualifiers";
import { compass } from "@cloudinary/url-gen/qualifiers/gravity";
import { TextStyle } from "@cloudinary/url-gen/qualifiers/textStyle";
import { trim } from "@cloudinary/url-gen/actions/videoEdit";

interface CloudinaryVideoEditorProps {
  initialVideoUrl?: string;
  cloudinaryPublicId?: string | null;
  cloudName?: string;
  apiKey?: string;
}

type VideoTransformations = {
  border: {
    width: number;
    color: string;
    radius: number;
  };
  resize: {
    width: number;
    height: number;
    mode: "fill" | "scale" | "crop";
  };
  adjust: {
    brightness: number;
    contrast: number;
    saturation: number;
    sepia: number;
    grayscale: boolean;
  };
  text: {
    enabled: boolean;
    content: string;
    position:
      | "north"
      | "south"
      | "east"
      | "west"
      | "center"
      | "north_east"
      | "north_west"
      | "south_east"
      | "south_west";
    color: string;
    size: number;
    fontFamily: string;
  };
  trim: {
    enabled: boolean;
    startSeconds: number;
    endSeconds: number;
  };
};

function CloudinaryVideoEditor({
  initialVideoUrl,
  cloudinaryPublicId: initialPublicId,
  cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY,
}: CloudinaryVideoEditorProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cloudinaryUrl, setCloudinaryUrl] = useState<string | null>(
    initialVideoUrl || null,
  );
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState<string | null>(
    initialPublicId || null,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [videoLoadAttempts, setVideoLoadAttempts] = useState(0);
  const [videoLoadError, setVideoLoadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [cachedVideoUrl, setCachedVideoUrl] = useState<string | null>(null);
  const stableTimestampRef = useRef<number>(Date.now());
  const hasSetTabRef = useRef(false);

  // Default transformations
  const [transformations, setTransformations] = useState<VideoTransformations>({
    border: {
      width: 4,
      color: "#ffffff",
      radius: 0,
    },
    resize: {
      width: 1920,
      height: 1080,
      mode: "fill",
    },
    adjust: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      sepia: 0,
      grayscale: false,
    },
    text: {
      enabled: false,
      content: "Sample Text",
      position: "south",
      color: "#ffffff",
      size: 40,
      fontFamily: "Arial",
    },
    trim: {
      enabled: false,
      startSeconds: 0,
      endSeconds: 10,
    },
  });

  // Initialize Cloudinary with useMemo to prevent re-creation on every render
  const cld = useMemo(() => {
    return new Cloudinary({
      cloud: {
        cloudName,
      },
    });
  }, [cloudName]);

  // Generate transformed video URL with debouncing to prevent excessive calculations
  const getTransformedVideoUrl = useCallback(() => {
    if (!cloudinaryPublicId) return cloudinaryUrl;

    if (!cld) return cloudinaryUrl;

    let video = cld.video(cloudinaryPublicId);

    // Apply border
    if (transformations.border.width > 0) {
      video = video.border(
        `${transformations.border.width}px_solid_${transformations.border.color.replace("#", "")}`,
      );
    }

    // Apply corner radius
    if (transformations.border.radius > 0) {
      video = video.roundCorners(byRadius(transformations.border.radius));
    }

    // Apply resize
    switch (transformations.resize.mode) {
      case "fill":
        video = video.resize(
          fill()
            .width(transformations.resize.width)
            .height(transformations.resize.height),
        );
        break;
      case "scale":
        video = video.resize(
          scale()
            .width(transformations.resize.width)
            .height(transformations.resize.height),
        );
        break;
      case "crop":
        video = video.resize(
          crop()
            .width(transformations.resize.width)
            .height(transformations.resize.height),
        );
        break;
    }

    // Apply adjustments
    if (transformations.adjust.brightness !== 0) {
      video = video.adjust(brightness(transformations.adjust.brightness));
    }
    if (transformations.adjust.contrast !== 0) {
      video = video.adjust(contrast(transformations.adjust.contrast));
    }
    if (transformations.adjust.saturation !== 0) {
      video = video.adjust(saturation(transformations.adjust.saturation));
    }
    if (transformations.adjust.sepia !== 0) {
      video = video.effect(sepia(transformations.adjust.sepia));
    }
    if (transformations.adjust.grayscale) {
      video = video.effect(grayscale());
    }

    // Apply text overlay
    if (transformations.text.enabled && transformations.text.content) {
      const position = new Position();
      switch (transformations.text.position) {
        case "north":
          position.gravity(compass("north"));
          break;
        case "south":
          position.gravity(compass("south"));
          break;
        case "east":
          position.gravity(compass("east"));
          break;
        case "west":
          position.gravity(compass("west"));
          break;
        case "center":
          position.gravity(compass("center"));
          break;
        case "north_east":
          position.gravity(compass("north_east"));
          break;
        case "north_west":
          position.gravity(compass("north_west"));
          break;
        case "south_east":
          position.gravity(compass("south_east"));
          break;
        case "south_west":
          position.gravity(compass("south_west"));
          break;
      }

      const textStyle = new TextStyle(transformations.text.fontFamily)
        .fontSize(transformations.text.size)
        .fontWeight("bold")
        .textColor(transformations.text.color.replace("#", ""));

      video = video.overlay(
        source(text(transformations.text.content, textStyle)).position(
          position,
        ),
      );
    }

    // Apply trim
    if (transformations.trim.enabled && videoDuration > 0) {
      const start = Math.max(0, transformations.trim.startSeconds);
      const end = Math.min(videoDuration, transformations.trim.endSeconds);
      if (start < end) {
        video = video.videoEdit(trim(start, end));
      }
    }

    // Force format to mp4 for maximum compatibility
    video = video.format("mp4");

    // Add quality auto for better performance
    video = video.quality("auto");

    // Generate the URL and add a timestamp to prevent caching
    const url = video.toURL();
    console.log("Generated transformed URL:", url);
    return `${url}&_t=${stableTimestampRef.current}`;
  }, [
    cloudinaryPublicId,
    JSON.stringify(transformations),
    cld,
    videoDuration,
    cloudinaryUrl,
  ]);

  // Get transformed video URL with memoization to prevent recalculation on every render
  const transformedVideoUrl = useMemo(() => {
    if (!cloudinaryPublicId || !cloudinaryUrl) return cloudinaryUrl;

    // For direct playback, use the secure_url without transformations initially
    if (cloudinaryUrl && cloudinaryUrl.includes("res.cloudinary.com")) {
      // Use a fixed timestamp instead of Date.now() to prevent constant re-renders
      return `${cloudinaryUrl.split("?")[0]}?_t=${stableTimestampRef.current}`;
    }

    return getTransformedVideoUrl();
  }, [cloudinaryPublicId, getTransformedVideoUrl, cloudinaryUrl]);

  // Update cached URL when transformations change - use useEffect instead of useMemo
  useEffect(() => {
    if (transformedVideoUrl) {
      setCachedVideoUrl(transformedVideoUrl);

      // Force video reload when transformations change
      if (
        videoRef.current &&
        (activeTab === "edit" || activeTab === "preview")
      ) {
        videoRef.current.src = transformedVideoUrl;
        videoRef.current.load();
      }
    }
  }, [transformedVideoUrl, activeTab]);

  // Handle file selection
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setVideoFile(file);
        setActiveTab("upload");
        setUploadError(null);
      }
    },
    [],
  );

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) {
      // Create a test video element to check if the file is valid
      const testVideo = document.createElement("video");
      const objectUrl = URL.createObjectURL(file);

      testVideo.onloadedmetadata = () => {
        // File is valid, proceed
        console.log("Dropped video file validated successfully");
        URL.revokeObjectURL(objectUrl);
        setVideoFile(file);
        setActiveTab("upload");
        setUploadError(null);
      };

      testVideo.onerror = () => {
        // File is invalid
        console.error("Invalid dropped video file");
        URL.revokeObjectURL(objectUrl);
        setUploadError(
          "The dropped file appears to be corrupted or is not a valid video format",
        );
      };

      // Set a timeout in case the video never loads
      const timeout = setTimeout(() => {
        testVideo.onloadedmetadata = null;
        testVideo.onerror = null;
        URL.revokeObjectURL(objectUrl);
        setUploadError(
          "Unable to validate the video file. It may be corrupted or in an unsupported format.",
        );
      }, 5000);

      testVideo.onloadeddata = () => {
        clearTimeout(timeout);
        testVideo.onloadedmetadata();
      };

      // Set source to test the file
      testVideo.src = objectUrl;
    } else {
      setUploadError("Please drop a valid video file");
    }
  }, []);

  // Upload to Cloudinary
  const uploadToCloudinary = useCallback(async () => {
    if (!videoFile || !cloudName || !apiKey) {
      setUploadError("Missing video file or Cloudinary configuration");
      return;
    }

    // Validate file size (max 100MB)
    if (videoFile.size > 100 * 1024 * 1024) {
      setUploadError("File size exceeds the 100MB limit");
      return;
    }

    // Validate file type
    if (!videoFile.type.startsWith("video/")) {
      setUploadError("Please upload a valid video file");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // Create a FormData instance
      const formData = new FormData();
      formData.append("file", videoFile);
      formData.append("upload_preset", "video_borders"); // Make sure this preset exists in your Cloudinary dashboard
      formData.append("resource_type", "video"); // Explicitly set resource type to video
      formData.append("access_mode", "public"); // Ensure the uploaded asset is publicly accessible
      formData.append("cloud_name", cloudName);
      // Add timestamp to prevent caching issues
      formData.append("timestamp", Date.now().toString());
      // Add public flag to ensure the resource is publicly accessible
      formData.append("public_id", `video_${Date.now()}`);
      formData.append("access_mode", "public");

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
            console.log("Upload success - full response:", response);

            if (response.secure_url && response.public_id) {
              console.log("Setting cloudinary URL:", response.secure_url);
              console.log("Setting cloudinary public ID:", response.public_id);

              // Store the secure_url and public ID
              setCloudinaryUrl(response.secure_url);
              setCloudinaryPublicId(response.public_id);

              // Verify the resource exists and is accessible before switching tabs
              const timestampedUrl = `${response.secure_url}?_t=${stableTimestampRef.current}`;
              console.log(
                "Verifying uploaded resource accessibility:",
                timestampedUrl,
              );

              checkCloudinaryUrl(timestampedUrl)
                .then((errorInfo) => {
                  if (errorInfo.status >= 200 && errorInfo.status < 300) {
                    console.log("Resource verified as accessible:", errorInfo);

                    // Set cached URL immediately with timestamped URL
                    setCachedVideoUrl(timestampedUrl);
                    setVideoLoadError(null);
                    setVideoLoadAttempts(0);

                    // Switch to edit tab immediately with a forced timeout
                    console.log("About to switch to edit tab");
                    setTimeout(() => {
                      setActiveTab("edit");
                      console.log("Switched to edit tab");

                      // Force video element to reload after tab switch
                      setTimeout(() => {
                        if (videoRef.current) {
                          // Use the secure_url from Cloudinary
                          console.log(
                            "Forcing video reload after tab switch with secure URL:",
                            response.secure_url,
                          );
                          videoRef.current.src = response.secure_url;
                          videoRef.current.load();
                        }
                      }, 300);
                    }, 100);
                  } else {
                    console.error("Resource not accessible:", errorInfo);
                    setDebugMode(true);
                    setVideoLoadError(
                      `Resource not accessible (Status: ${errorInfo.status}). ${errorInfo.cloudinaryError || ""}`,
                    );

                    // Try alternative URLs
                    const alternatives = generateAlternativeUrls(
                      response.secure_url,
                    );
                    console.log("Trying alternative URLs:", alternatives);

                    // Try the first alternative immediately
                    if (alternatives.length > 0) {
                      setCachedVideoUrl(alternatives[0]);
                    } else {
                      // If no alternatives, still try to proceed with original URL
                      setCachedVideoUrl(response.secure_url);
                    }

                    // Always switch to edit tab regardless of resource accessibility
                    setTimeout(() => {
                      setActiveTab("edit");
                      console.log(
                        "Forced tab change to edit after resource check failed",
                      );
                    }, 100);
                  }
                })
                .catch((err) => {
                  console.error("Error verifying resource:", err);
                  // Still try to proceed even if verification fails
                  setCachedVideoUrl(response.secure_url);
                  // Force tab change even if verification fails
                  setTimeout(() => {
                    setActiveTab("edit");
                    console.log(
                      "Forced tab change to edit after verification failed",
                    );
                  }, 100);
                });
            } else {
              console.error(
                "Missing secure_url or public_id in response",
                response,
              );
              setUploadError("Upload response missing required fields");
            }
          } catch (error) {
            console.error("Error parsing response:", error, xhr.responseText);
            setUploadError("Error parsing server response");
          }
        } else {
          console.error(
            "Upload failed with status:",
            xhr.status,
            xhr.statusText,
          );
          setUploadError("Upload failed: " + xhr.statusText);
        }
        setIsUploading(false);
      };

      // Handle errors
      xhr.onerror = () => {
        console.error("Network error during upload");
        setUploadError(
          "Network error during upload. Please check your connection and try again.",
        );
        setIsUploading(false);
      };

      // Set a timeout to prevent hanging uploads
      const uploadTimeout = setTimeout(() => {
        if (xhr.readyState !== 4) {
          xhr.abort();
          console.error("Upload timed out");
          setUploadError("Upload timed out. Please try again.");
          setIsUploading(false);
        }
      }, 60000); // 60 second timeout

      // Clear timeout when request completes
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          clearTimeout(uploadTimeout);
        }
      };

      // Send the request
      xhr.send(formData);
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      setUploadError("Error uploading to Cloudinary");
      setIsUploading(false);
    }
  }, [videoFile, cloudName, apiKey]);

  // Handle play/pause
  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  // Handle video metadata loaded
  const handleMetadataLoaded = useCallback(() => {
    if (videoRef.current) {
      console.log(
        "Video metadata loaded, duration:",
        videoRef.current.duration,
      );
      setVideoDuration(videoRef.current.duration);

      // Update trim end time to match video duration
      setTransformations((prev) => ({
        ...prev,
        trim: {
          ...prev.trim,
          endSeconds: videoRef.current?.duration || 10,
        },
      }));

      // Try to play the video automatically
      try {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("Video playback started automatically");
              setIsPlaying(true);
              // Pause after 1 second to show it's working
              setTimeout(() => {
                if (videoRef.current) {
                  videoRef.current.pause();
                  setIsPlaying(false);
                  console.log("Video paused after auto-play");
                }
              }, 1000);
            })
            .catch((error) => {
              console.error("Auto-play was prevented:", error);
              // Even if autoplay fails, we still want to show the video is ready
              if (videoRef.current) {
                console.log(
                  "Setting video ready state despite autoplay failure",
                );
              }
            });
        }
      } catch (error) {
        console.error("Error during auto-play:", error);
      }
    }
  }, []);

  // Handle video end
  const handleVideoEnd = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // Memoize the border style to prevent recalculation during pan/zoom
  const borderStyle = useMemo(
    () => ({
      padding: `${transformations.border.width}px`,
      backgroundColor: transformations.border.color,
      borderRadius: `${transformations.border.radius}px`,
    }),
    [
      transformations.border.width,
      transformations.border.color,
      transformations.border.radius,
    ],
  );

  // Load video when tab changes to edit - use a stable timestamp
  const tabChangeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (activeTab === "edit" && videoRef.current) {
      // Use transformed URL to ensure adjustments are visible
      const videoUrl = transformedVideoUrl || cachedVideoUrl || cloudinaryUrl;
      if (videoUrl) {
        // Reset error state when switching tabs
        setVideoLoadError(null);
        setVideoLoadAttempts(0);

        // Load the video with transformations
        videoRef.current.src = videoUrl;
        videoRef.current.load();
      }
    }

    // Clear any existing timeout
    if (tabChangeTimeoutRef.current) {
      clearTimeout(tabChangeTimeoutRef.current);
      tabChangeTimeoutRef.current = null;
    }
  }, [activeTab, transformedVideoUrl, cachedVideoUrl, cloudinaryUrl]);

  // Force tab change if we have a cloudinaryUrl but are still on upload tab
  // Only run this once when cloudinaryUrl or cachedVideoUrl first becomes available
  useEffect(() => {
    if ((cloudinaryUrl || cachedVideoUrl) && !hasSetTabRef.current) {
      hasSetTabRef.current = true;
      setActiveTab("edit");
    }
  }, [cloudinaryUrl, cachedVideoUrl]);

  // Simplified check to ensure video loads properly
  useEffect(() => {
    if (
      activeTab === "edit" &&
      videoRef.current &&
      (cloudinaryUrl || cachedVideoUrl) &&
      cloudinaryPublicId
    ) {
      // Set a timeout to check if video is loaded properly
      const checkVideoTimeout = setTimeout(() => {
        if (videoRef.current && videoRef.current.readyState === 0) {
          // Try loading with direct URL from Cloudinary without any transformations
          const directUrl = `https://res.cloudinary.com/${cloudName}/video/upload/${cloudinaryPublicId}`;
          videoRef.current.src = directUrl;
          videoRef.current.load();
        }
      }, 3000); // Check after 3 seconds

      return () => clearTimeout(checkVideoTimeout);
    }
  }, [activeTab, cloudinaryPublicId, cloudName]);

  // Set cached URL from cloudinaryUrl if needed
  useEffect(() => {
    if (cloudinaryUrl && !cachedVideoUrl) {
      setCachedVideoUrl(cloudinaryUrl);
    }
  }, [cloudinaryUrl, cachedVideoUrl]);

  // Use a stable component structure to prevent flickering
  return (
    <div className="bg-white rounded-lg shadow-lg">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="edit" disabled={!cloudinaryUrl}>
            Edit
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={!cloudinaryUrl}>
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Upload Video</h2>
              <p className="text-gray-600 mb-4">
                Upload a video to start editing with Cloudinary
              </p>
            </div>

            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="video/*"
                className="hidden"
              />
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Drag and drop or click to upload
              </h3>
              <p className="text-gray-500 mb-4">MP4, MOV, or AVI up to 100MB</p>

              {videoFile && (
                <div className="mt-4 p-3 bg-gray-100 rounded-md flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="relative h-12 w-20 rounded mr-3 bg-gray-200 flex items-center justify-center overflow-hidden">
                      {videoFile && (
                        <>
                          <img
                            className="h-full w-full object-cover"
                            src={URL.createObjectURL(videoFile)}
                            alt="Video thumbnail"
                            onError={(e) => {
                              console.error(
                                "Error loading thumbnail preview:",
                                e,
                              );
                              e.currentTarget.style.display = "none";
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <Play className="h-4 w-4 text-white" />
                          </div>
                        </>
                      )}
                    </div>
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
                  <span>
                    {uploadProgress < 20
                      ? "Checking for duplicates..."
                      : uploadProgress < 95
                        ? "Uploading..."
                        : "Processing..."}
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setVideoFile(null);
                  setUploadError(null);
                }}
                disabled={!videoFile || isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={uploadToCloudinary}
                disabled={!videoFile || isUploading}
                className="gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload to Cloudinary
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Edit Tab */}
        <TabsContent value="edit" className="p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Edit Video</h2>
              <p className="text-gray-600 mb-4">
                Customize your video with Cloudinary's powerful editing tools
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>
                    See your changes in real-time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {videoLoadError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center mb-4">
                      <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                      <p className="text-sm">{videoLoadError}</p>
                    </div>
                  )}

                  <div
                    className="relative rounded-lg overflow-hidden"
                    style={borderStyle}
                  >
                    <video
                      ref={videoRef}
                      src={
                        cloudinaryUrl || // Use the direct cloudinaryUrl first
                        cachedVideoUrl ||
                        transformedVideoUrl ||
                        undefined
                      }
                      className="w-full h-auto rounded-sm"
                      onEnded={handleVideoEnd}
                      onLoadedMetadata={(e) => {
                        setVideoLoadError(null);
                        handleMetadataLoaded(e);
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLVideoElement;
                        console.error(
                          "Video error in edit tab:",
                          e,
                          target.error,
                        );

                        // Check for specific format error
                        const errorMessage =
                          target.error?.message ||
                          "Unknown video loading error";
                        const isFormatError =
                          errorMessage.includes("format") ||
                          target.error?.code ===
                            MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED;

                        setVideoLoadError(
                          isFormatError
                            ? "media_element_error:format error - The browser cannot play this video format"
                            : errorMessage,
                        );
                        setVideoLoadAttempts((prev) => prev + 1);

                        // Try to reload with alternative URL if we haven't tried too many times
                        if (
                          videoLoadAttempts < 5 &&
                          (cachedVideoUrl || cloudinaryUrl)
                        ) {
                          console.log(
                            `Attempting to reload video after error (attempt ${videoLoadAttempts + 1}/5)`,
                          );
                          setTimeout(() => {
                            if (videoRef.current) {
                              const currentUrl =
                                cachedVideoUrl || cloudinaryUrl;

                              // Try with direct URLs without any transformations
                              let baseUrlWithoutTransformations;
                              try {
                                // Extract just the cloud name and public ID
                                const urlParts = currentUrl.split("/upload/");
                                if (urlParts.length >= 2) {
                                  const cloudName = urlParts[0]
                                    .split("//")[1]
                                    .split(".")[0];
                                  const pathParts = urlParts[1].split("/");
                                  const publicIdPart =
                                    pathParts[pathParts.length - 1].split(
                                      "?",
                                    )[0];
                                  // Construct a direct URL without any transformations
                                  baseUrlWithoutTransformations = `https://res.cloudinary.com/${cloudName}/video/upload/${publicIdPart}`;
                                } else {
                                  baseUrlWithoutTransformations =
                                    currentUrl.split("?")[0];
                                }
                              } catch (error) {
                                console.error(
                                  "Error extracting base URL:",
                                  error,
                                );
                                baseUrlWithoutTransformations =
                                  currentUrl.split("?")[0];
                              }
                              console.log(
                                "Base URL without transformations:",
                                baseUrlWithoutTransformations,
                              );

                              const formatUrls = [
                                // Try direct URL first
                                `${baseUrlWithoutTransformations}`,
                                // Then try with minimal parameters
                                `${baseUrlWithoutTransformations}?_t=${stableTimestampRef.current}`,
                                `${baseUrlWithoutTransformations}?f_mp4`,
                                `${baseUrlWithoutTransformations}?f_auto`,
                                // Then try with more specific parameters
                                `${baseUrlWithoutTransformations}?f_mp4,q_auto:low`,
                              ];

                              const retryUrl =
                                formatUrls[
                                  videoLoadAttempts % formatUrls.length
                                ];

                              console.log(
                                "Reloading with alternative URL:",
                                retryUrl,
                              );
                              videoRef.current.src = retryUrl;
                              setCachedVideoUrl(retryUrl);
                              videoRef.current.load();
                            }
                          }, 1000);
                        } else if (videoLoadAttempts >= 5) {
                          setDebugMode(true);
                        }
                      }}
                      controls={false}
                      preload="metadata"
                      crossOrigin="anonymous"
                      key={`edit-${cloudinaryPublicId}`}
                      // Add additional attributes to help with format compatibility
                      playsInline
                      muted
                      type="video/mp4"
                    />

                    {/* Play/Pause overlay */}
                    <div
                      className="absolute inset-0 flex items-center justify-center cursor-pointer"
                      onClick={togglePlayPause}
                    >
                      {!isPlaying && (
                        <div className="h-16 w-16 rounded-full bg-black/50 flex items-center justify-center">
                          <Play className="h-8 w-8 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {debugMode && (
                    <CloudinaryDebugPanel
                      videoUrl={cachedVideoUrl || cloudinaryUrl}
                      publicId={cloudinaryPublicId}
                      onRetry={() => {
                        if (
                          videoRef.current &&
                          (cachedVideoUrl || cloudinaryUrl)
                        ) {
                          // Try with direct URL without any transformations
                          let retryUrl;
                          try {
                            // Extract just the cloud name and public ID
                            const urlParts = (
                              cachedVideoUrl || cloudinaryUrl
                            ).split("/upload/");
                            if (urlParts.length >= 2) {
                              const cloudName = urlParts[0]
                                .split("//")[1]
                                .split(".")[0];
                              const pathParts = urlParts[1].split("/");
                              const publicIdPart =
                                pathParts[pathParts.length - 1].split("?")[0];
                              // Construct a direct URL without any transformations
                              retryUrl = `https://res.cloudinary.com/${cloudName}/video/upload/${publicIdPart}?_retry=${stableTimestampRef.current}`;
                            } else {
                              retryUrl = `${(cachedVideoUrl || cloudinaryUrl).split("?")[0]}?_retry=${stableTimestampRef.current}`;
                            }
                          } catch (error) {
                            console.error("Error creating retry URL:", error);
                            retryUrl = `${(cachedVideoUrl || cloudinaryUrl).split("?")[0]}?_retry=${stableTimestampRef.current}`;
                          }
                          console.log("Manual retry with URL:", retryUrl);
                          videoRef.current.src = retryUrl;
                          setCachedVideoUrl(retryUrl);
                          videoRef.current.load();
                          setVideoLoadAttempts(0);
                        }
                      }}
                    />
                  )}

                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={togglePlayPause}
                        className="flex items-center gap-2"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="h-4 w-4" /> Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" /> Play
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(
                            transformedVideoUrl ||
                              cachedVideoUrl ||
                              cloudinaryUrl ||
                              "",
                            "_blank",
                          )
                        }
                        className="flex items-center gap-2"
                        disabled={!cachedVideoUrl}
                      >
                        <Download className="h-4 w-4" /> Download
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDebugMode(!debugMode)}
                        className="flex items-center gap-1"
                      >
                        <AlertCircle className="h-4 w-4" />
                        {debugMode ? "Hide Debug" : "Debug"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Editing Tools */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Image className="h-5 w-5" /> Border & Size
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>
                        Border Width ({transformations.border.width}px)
                      </Label>
                      <Slider
                        min={0}
                        max={20}
                        step={1}
                        value={[transformations.border.width]}
                        onValueChange={(value) =>
                          setTransformations((prev) => ({
                            ...prev,
                            border: { ...prev.border, width: value[0] },
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Border Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={transformations.border.color}
                          onChange={(e) =>
                            setTransformations((prev) => ({
                              ...prev,
                              border: {
                                ...prev.border,
                                color: e.target.value,
                              },
                            }))
                          }
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          type="text"
                          value={transformations.border.color}
                          onChange={(e) =>
                            setTransformations((prev) => ({
                              ...prev,
                              border: {
                                ...prev.border,
                                color: e.target.value,
                              },
                            }))
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Border Radius ({transformations.border.radius}px)
                      </Label>
                      <Slider
                        min={0}
                        max={50}
                        step={1}
                        value={[transformations.border.radius]}
                        onValueChange={(value) =>
                          setTransformations((prev) => ({
                            ...prev,
                            border: { ...prev.border, radius: value[0] },
                          }))
                        }
                      />
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-2">
                      <Label>Resize Mode</Label>
                      <Select
                        value={transformations.resize.mode}
                        onValueChange={(value: "fill" | "scale" | "crop") =>
                          setTransformations((prev) => ({
                            ...prev,
                            resize: { ...prev.resize, mode: value },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select resize mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fill">Fill</SelectItem>
                          <SelectItem value="scale">Scale</SelectItem>
                          <SelectItem value="crop">Crop</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Width (px)</Label>
                        <Input
                          type="number"
                          value={transformations.resize.width}
                          onChange={(e) =>
                            setTransformations((prev) => ({
                              ...prev,
                              resize: {
                                ...prev.resize,
                                width: parseInt(e.target.value) || 1920,
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Height (px)</Label>
                        <Input
                          type="number"
                          value={transformations.resize.height}
                          onChange={(e) =>
                            setTransformations((prev) => ({
                              ...prev,
                              resize: {
                                ...prev.resize,
                                height: parseInt(e.target.value) || 1080,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sliders className="h-5 w-5" /> Adjustments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>
                          Brightness ({transformations.adjust.brightness})
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() =>
                            setTransformations((prev) => ({
                              ...prev,
                              adjust: { ...prev.adjust, brightness: 0 },
                            }))
                          }
                        >
                          Reset
                        </Button>
                      </div>
                      <Slider
                        min={-100}
                        max={100}
                        step={5}
                        value={[transformations.adjust.brightness]}
                        onValueChange={(value) =>
                          setTransformations((prev) => ({
                            ...prev,
                            adjust: { ...prev.adjust, brightness: value[0] },
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>
                          Contrast ({transformations.adjust.contrast})
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() =>
                            setTransformations((prev) => ({
                              ...prev,
                              adjust: { ...prev.adjust, contrast: 0 },
                            }))
                          }
                        >
                          Reset
                        </Button>
                      </div>
                      <Slider
                        min={-100}
                        max={100}
                        step={5}
                        value={[transformations.adjust.contrast]}
                        onValueChange={(value) =>
                          setTransformations((prev) => ({
                            ...prev,
                            adjust: { ...prev.adjust, contrast: value[0] },
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>
                          Saturation ({transformations.adjust.saturation})
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() =>
                            setTransformations((prev) => ({
                              ...prev,
                              adjust: { ...prev.adjust, saturation: 0 },
                            }))
                          }
                        >
                          Reset
                        </Button>
                      </div>
                      <Slider
                        min={-100}
                        max={100}
                        step={5}
                        value={[transformations.adjust.saturation]}
                        onValueChange={(value) =>
                          setTransformations((prev) => ({
                            ...prev,
                            adjust: { ...prev.adjust, saturation: value[0] },
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Sepia ({transformations.adjust.sepia})</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() =>
                            setTransformations((prev) => ({
                              ...prev,
                              adjust: { ...prev.adjust, sepia: 0 },
                            }))
                          }
                        >
                          Reset
                        </Button>
                      </div>
                      <Slider
                        min={0}
                        max={100}
                        step={5}
                        value={[transformations.adjust.sepia]}
                        onValueChange={(value) =>
                          setTransformations((prev) => ({
                            ...prev,
                            adjust: { ...prev.adjust, sepia: value[0] },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="grayscale"
                        checked={transformations.adjust.grayscale}
                        onCheckedChange={(checked) =>
                          setTransformations((prev) => ({
                            ...prev,
                            adjust: { ...prev.adjust, grayscale: checked },
                          }))
                        }
                      />
                      <Label htmlFor="grayscale">Grayscale</Label>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Type className="h-5 w-5" /> Text Overlay
                      </CardTitle>
                      <Switch
                        checked={transformations.text.enabled}
                        onCheckedChange={(checked) =>
                          setTransformations((prev) => ({
                            ...prev,
                            text: { ...prev.text, enabled: checked },
                          }))
                        }
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Text Content</Label>
                      <Input
                        value={transformations.text.content}
                        onChange={(e) =>
                          setTransformations((prev) => ({
                            ...prev,
                            text: { ...prev.text, content: e.target.value },
                          }))
                        }
                        disabled={!transformations.text.enabled}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Select
                        value={transformations.text.position}
                        onValueChange={(value: any) =>
                          setTransformations((prev) => ({
                            ...prev,
                            text: { ...prev.text, position: value },
                          }))
                        }
                        disabled={!transformations.text.enabled}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="north">Top</SelectItem>
                          <SelectItem value="south">Bottom</SelectItem>
                          <SelectItem value="east">Right</SelectItem>
                          <SelectItem value="west">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="north_east">Top Right</SelectItem>
                          <SelectItem value="north_west">Top Left</SelectItem>
                          <SelectItem value="south_east">
                            Bottom Right
                          </SelectItem>
                          <SelectItem value="south_west">
                            Bottom Left
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={transformations.text.color}
                            onChange={(e) =>
                              setTransformations((prev) => ({
                                ...prev,
                                text: { ...prev.text, color: e.target.value },
                              }))
                            }
                            className="w-12 h-10 p-1"
                            disabled={!transformations.text.enabled}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Size (px)</Label>
                        <Input
                          type="number"
                          value={transformations.text.size}
                          onChange={(e) =>
                            setTransformations((prev) => ({
                              ...prev,
                              text: {
                                ...prev.text,
                                size: parseInt(e.target.value) || 40,
                              },
                            }))
                          }
                          disabled={!transformations.text.enabled}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Font Family</Label>
                      <Select
                        value={transformations.text.fontFamily}
                        onValueChange={(value) =>
                          setTransformations((prev) => ({
                            ...prev,
                            text: { ...prev.text, fontFamily: value },
                          }))
                        }
                        disabled={!transformations.text.enabled}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select font" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Verdana">Verdana</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Times New Roman">
                            Times New Roman
                          </SelectItem>
                          <SelectItem value="Courier New">
                            Courier New
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {videoDuration > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <RefreshCw className="h-5 w-5" /> Trim Video
                        </CardTitle>
                        <Switch
                          checked={transformations.trim.enabled}
                          onCheckedChange={(checked) =>
                            setTransformations((prev) => ({
                              ...prev,
                              trim: { ...prev.trim, enabled: checked },
                            }))
                          }
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>
                            Start Time:{" "}
                            {transformations.trim.startSeconds.toFixed(1)}s
                          </Label>
                          <Label>
                            End Time:{" "}
                            {transformations.trim.endSeconds.toFixed(1)}s
                          </Label>
                        </div>
                        <div className="pt-6 pb-2">
                          <Slider
                            min={0}
                            max={videoDuration}
                            step={0.1}
                            value={[
                              transformations.trim.startSeconds,
                              transformations.trim.endSeconds,
                            ]}
                            onValueChange={([start, end]) =>
                              setTransformations((prev) => ({
                                ...prev,
                                trim: {
                                  ...prev.trim,
                                  startSeconds: start,
                                  endSeconds: end,
                                },
                              }))
                            }
                            disabled={!transformations.trim.enabled}
                          />
                        </div>
                        <div className="text-xs text-gray-500">
                          Duration:{" "}
                          {(
                            transformations.trim.endSeconds -
                            transformations.trim.startSeconds
                          ).toFixed(1)}
                          s of {videoDuration.toFixed(1)}s
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setActiveTab("upload")}>
                Back to Upload
              </Button>
              <Button onClick={() => setActiveTab("preview")} className="gap-2">
                <Check className="h-4 w-4" />
                Preview Result
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Final Preview</h2>
              <p className="text-gray-600 mb-4">
                Your edited video is ready to download
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <div
                className="relative rounded-lg overflow-hidden"
                style={borderStyle}
              >
                <video
                  src={
                    cloudinaryUrl || // Use the direct cloudinaryUrl first
                    cachedVideoUrl ||
                    transformedVideoUrl ||
                    undefined
                  }
                  className="w-full h-auto rounded-sm"
                  controls
                  preload="metadata"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    const target = e.target as HTMLVideoElement;
                    console.error("Preview video error:", e, target.error);
                    setVideoLoadError(
                      target.error?.message || "Unknown video loading error",
                    );
                    setDebugMode(true);

                    // Try to reload with a different URL format
                    setTimeout(() => {
                      const currentSrc = target.src;
                      if (currentSrc) {
                        // Try with direct URL without any transformations
                        let retryUrl;
                        try {
                          // Extract just the cloud name and public ID
                          const urlParts = currentSrc.split("/upload/");
                          if (urlParts.length >= 2) {
                            const cloudName = urlParts[0]
                              .split("//")[1]
                              .split(".")[0];
                            const pathParts = urlParts[1].split("/");
                            const publicIdPart =
                              pathParts[pathParts.length - 1].split("?")[0];
                            // Construct a direct URL without any transformations
                            retryUrl = `https://res.cloudinary.com/${cloudName}/video/upload/${publicIdPart}?_retry=${stableTimestampRef.current}`;
                          } else {
                            retryUrl = `${currentSrc.split("?")[0]}?_retry=${stableTimestampRef.current}`;
                          }
                        } catch (error) {
                          console.error("Error creating retry URL:", error);
                          retryUrl = `${currentSrc.split("?")[0]}?_retry=${stableTimestampRef.current}`;
                        }
                        console.log(
                          "Attempting to reload preview video with URL:",
                          retryUrl,
                        );
                        target.src = retryUrl;
                        target.load();
                      }
                    }, 1000);
                  }}
                  onLoadStart={() => {}}
                  key={`preview-${cloudinaryPublicId}`}
                />
              </div>

              <div className="mt-8 space-y-4">
                <h3 className="text-lg font-semibold">
                  Applied Transformations
                </h3>
                <div className="flex flex-wrap gap-2">
                  {transformations.border.width > 0 && (
                    <Badge variant="secondary">
                      Border: {transformations.border.width}px
                    </Badge>
                  )}
                  {transformations.border.radius > 0 && (
                    <Badge variant="secondary">
                      Rounded: {transformations.border.radius}px
                    </Badge>
                  )}
                  <Badge variant="secondary">
                    Size: {transformations.resize.width}×
                    {transformations.resize.height}
                  </Badge>
                  {transformations.adjust.brightness !== 0 && (
                    <Badge variant="secondary">
                      Brightness: {transformations.adjust.brightness}
                    </Badge>
                  )}
                  {transformations.adjust.contrast !== 0 && (
                    <Badge variant="secondary">
                      Contrast: {transformations.adjust.contrast}
                    </Badge>
                  )}
                  {transformations.adjust.saturation !== 0 && (
                    <Badge variant="secondary">
                      Saturation: {transformations.adjust.saturation}
                    </Badge>
                  )}
                  {transformations.adjust.sepia > 0 && (
                    <Badge variant="secondary">
                      Sepia: {transformations.adjust.sepia}%
                    </Badge>
                  )}
                  {transformations.adjust.grayscale && (
                    <Badge variant="secondary">Grayscale</Badge>
                  )}
                  {transformations.text.enabled && (
                    <Badge variant="secondary">Text Overlay</Badge>
                  )}
                  {transformations.trim.enabled && (
                    <Badge variant="secondary">
                      Trimmed: {transformations.trim.startSeconds.toFixed(1)}s -{" "}
                      {transformations.trim.endSeconds.toFixed(1)}s
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <Button
                  size="lg"
                  onClick={() => {
                    const url =
                      transformedVideoUrl ||
                      cachedVideoUrl ||
                      cloudinaryUrl ||
                      "";
                    console.log("Opening download URL:", url);
                    window.open(url, "_blank");
                  }}
                  className="gap-2"
                  disabled={!transformedVideoUrl && !cachedVideoUrl}
                >
                  <Download className="h-5 w-5" />
                  Download Edited Video
                </Button>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("edit")}>
                Back to Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setVideoFile(null);
                  setCloudinaryUrl(null);
                  setCloudinaryPublicId(null);
                  setActiveTab("upload");
                }}
              >
                Start New Project
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Export as memoized component to prevent unnecessary re-renders
export default memo(CloudinaryVideoEditor);
