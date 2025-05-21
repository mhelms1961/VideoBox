import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, RefreshCw } from "lucide-react";

interface CloudinaryVideoEditorProps {
  initialVideoUrl: string;
  cloudinaryPublicId: string | null;
  cloudName: string;
  apiKey: string;
}

interface Transformations {
  border: {
    width: number;
    color: string;
    style: string;
  };
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
    sepia: number;
  };
  crop: {
    enabled: boolean;
    aspect: string;
    zoom: number;
  };
  rotate: {
    angle: number;
    flip: boolean;
  };
  effects: {
    blur: number;
    vignette: number;
    noise: number;
  };
  trim: {
    enabled: boolean;
    startTime: number;
    endTime: number;
    duration: number;
  };
}

export default function CloudinaryVideoEditor({
  initialVideoUrl,
  cloudinaryPublicId,
  cloudName,
  apiKey,
}: CloudinaryVideoEditorProps) {
  const [videoUrl, setVideoUrl] = useState<string>(initialVideoUrl);
  const [activeTab, setActiveTab] = useState<string>("border");
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [transformations, setTransformations] = useState<Transformations>({
    border: {
      width: 5,
      color: "white",
      style: "solid",
    },
    adjustments: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      sepia: 0,
    },
    crop: {
      enabled: false,
      aspect: "16:9",
      zoom: 100,
    },
    rotate: {
      angle: 0,
      flip: false,
    },
    effects: {
      blur: 0,
      vignette: 0,
      noise: 0,
    },
    trim: {
      enabled: false,
      startTime: 0,
      endTime: 10,
      duration: 10,
    },
  });

  // Create a string representation of transformations for dependency tracking
  const transformationsString = JSON.stringify(transformations);

  // Generate the transformed video URL
  const transformedVideoUrl = useMemo(() => {
    if (!cloudinaryPublicId || !cloudName) return initialVideoUrl;

    // Check if any transformations are applied
    // IMPORTANT: We're excluding border from the URL transformations
    // since we're applying that with CSS
    const hasAdjustments =
      transformations.adjustments.brightness !== 0 ||
      transformations.adjustments.contrast !== 0 ||
      transformations.adjustments.saturation !== 0 ||
      transformations.adjustments.sepia !== 0;
    const hasCrop = transformations.crop.enabled;
    const hasRotate =
      transformations.rotate.angle !== 0 || transformations.rotate.flip;
    const hasEffects =
      transformations.effects.blur > 0 ||
      transformations.effects.vignette > 0 ||
      transformations.effects.noise > 0;

    // Only consider trim enabled if it has meaningful values
    const hasTrim =
      transformations.trim.enabled &&
      (transformations.trim.startTime > 0 ||
        (transformations.trim.endTime < videoDuration && videoDuration > 0));

    // If no transformations, return the original URL
    if (!hasAdjustments && !hasCrop && !hasRotate && !hasEffects && !hasTrim)
      return initialVideoUrl;

    // Build transformation string
    let transformationParts = [];

    // Add crop if enabled
    if (hasCrop) {
      transformationParts.push(
        `c_fill,ar_${transformations.crop.aspect.replace(":", "_")},z_${transformations.crop.zoom}`,
      );
    }

    // Add rotation if angle is not 0 or flip is true
    if (hasRotate) {
      if (transformations.rotate.angle !== 0) {
        transformationParts.push(`a_${transformations.rotate.angle}`);
      }
      if (transformations.rotate.flip) {
        transformationParts.push("e_flip");
      }
    }

    // Add border if width > 0
    if (transformations.border.width > 0) {
      transformationParts.push(
        `bo_${transformations.border.width}px_${transformations.border.style}_${transformations.border.color.replace("#", "")}`,
      );
    }

    // Add adjustments if any are non-zero
    if (hasAdjustments) {
      const { brightness, contrast, saturation, sepia } =
        transformations.adjustments;

      if (brightness !== 0) {
        transformationParts.push(`e_brightness:${brightness}`);
      }

      if (contrast !== 0) {
        transformationParts.push(`e_contrast:${contrast}`);
      }

      if (saturation !== 0) {
        transformationParts.push(`e_saturation:${saturation}`);
      }

      if (sepia !== 0) {
        transformationParts.push(`e_sepia:${sepia}`);
      }
    }

    // Add effects if any are non-zero
    if (hasEffects) {
      const { blur, vignette, noise } = transformations.effects;

      if (blur > 0) {
        transformationParts.push(`e_blur:${blur}`);
      }

      if (vignette > 0) {
        transformationParts.push(`e_vignette:${vignette}`);
      }

      if (noise > 0) {
        transformationParts.push(`e_noise:${noise}`);
      }
    }

    // Add trim parameters if enabled and has meaningful values
    if (hasTrim) {
      const { startTime, endTime } = transformations.trim;

      if (startTime > 0) {
        transformationParts.push(`so_${startTime.toFixed(1)}`);
      }

      if (endTime < videoDuration && endTime > startTime && videoDuration > 0) {
        transformationParts.push(`eo_${endTime.toFixed(1)}`);
      }
    }

    // Add a timestamp to prevent caching issues
    const timestamp = new Date().getTime();

    // Construct the final URL with transformations
    const transformationString = transformationParts.join(",");
    const baseUrl = `https://res.cloudinary.com/${cloudName}/video/upload`;

    // If we have no transformations, return the original URL
    if (transformationString === "") {
      return initialVideoUrl;
    }

    return `${baseUrl}/${transformationString}/${cloudinaryPublicId}?_t=${timestamp}`;
  }, [
    cloudinaryPublicId,
    cloudName,
    transformationsString,
    initialVideoUrl,
    videoDuration,
  ]);

  // State to track if we need a full video reload
  const [needsReload, setNeedsReload] = useState(false);

  // Determine which transformations require a full video reload
  useEffect(() => {
    try {
      // These transformations require a full video reload
      // Border changes are now handled with CSS, so they don't require reload
      const requiresReload =
        transformations.crop.enabled ||
        transformations.rotate.angle !== 0 ||
        transformations.rotate.flip ||
        transformations.trim.enabled ||
        transformations.adjustments.brightness !== 0 ||
        transformations.adjustments.contrast !== 0 ||
        transformations.adjustments.saturation !== 0 ||
        transformations.adjustments.sepia !== 0 ||
        transformations.effects.blur > 0 ||
        transformations.effects.vignette > 0 ||
        transformations.effects.noise > 0;

      // Log when reload is required
      if (requiresReload) {
        console.log("Video reload required due to transformations");
      }

      setNeedsReload(requiresReload);
    } catch (error) {
      console.error("Error determining if reload is needed:", error);
    }
  }, [transformationsString]);

  // Handle video URL updates and selective reloading
  useEffect(() => {
    try {
      const video = document.getElementById(
        "preview-video",
      ) as HTMLVideoElement;
      if (!video) {
        console.log("Video element not found");
        return;
      }

      // Store current video state
      const currentTime = video.currentTime;
      const wasPlaying = !video.paused && !video.ended;
      const currentSrc = video.src;

      // Update video duration if not already set
      if (videoDuration === 0 && video.duration) {
        setVideoDuration(video.duration);
        // Update end time in trim settings if needed
        if (
          transformations.trim.endTime === 0 ||
          transformations.trim.endTime > video.duration
        ) {
          setTransformations((prev) => ({
            ...prev,
            trim: {
              ...prev.trim,
              endTime: video.duration,
              duration: video.duration - prev.trim.startTime,
            },
          }));
        }
      }

      // SPECIAL CASE: If we just enabled trimming, don't change the URL yet
      // This prevents the video from disappearing
      if (
        transformations.trim.enabled &&
        transformations.trim.startTime === 0 &&
        transformations.trim.endTime === videoDuration
      ) {
        console.log("Trim just enabled, keeping current URL");
        return;
      }

      // Determine which URL to use based on transformations
      // IMPORTANT: We're excluding border from the URL determination
      // since we're applying that with CSS
      const hasAdjustments =
        transformations.adjustments.brightness !== 0 ||
        transformations.adjustments.contrast !== 0 ||
        transformations.adjustments.saturation !== 0 ||
        transformations.adjustments.sepia !== 0;
      const hasCrop = transformations.crop.enabled === true;
      const hasRotate =
        transformations.rotate.angle !== 0 ||
        transformations.rotate.flip === true;
      const hasEffects =
        transformations.effects.blur > 0 ||
        transformations.effects.vignette > 0 ||
        transformations.effects.noise > 0;

      // Only consider trim enabled if it has meaningful values
      const hasTrim =
        transformations.trim.enabled === true &&
        (transformations.trim.startTime > 0 ||
          transformations.trim.endTime < videoDuration);

      // Use direct URL first for better compatibility, transformed URL only when needed
      const urlToUse =
        !hasAdjustments && !hasCrop && !hasRotate && !hasEffects && !hasTrim
          ? initialVideoUrl
          : transformedVideoUrl;

      // Only update if URL actually changed
      if (urlToUse !== currentSrc) {
        console.log("Updating video URL from", currentSrc, "to", urlToUse);

        // Update the video URL state
        setVideoUrl(urlToUse);

        try {
          // For transformations that affect the actual video content
          if (needsReload) {
            console.log("Performing full video reload");

            // Save the current poster image to prevent flickering
            try {
              if (video.videoWidth > 0) {
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                if (context) {
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                  context.drawImage(video, 0, 0, canvas.width, canvas.height);
                  video.poster = canvas.toDataURL("image/png");
                }
              }
            } catch (canvasError) {
              console.error("Error creating poster image:", canvasError);
            }

            // Set src first, then load
            video.src = urlToUse;
            video.load();

            // After loading, restore playback state
            video.onloadeddata = () => {
              try {
                video.currentTime = currentTime;
                // Clear the poster to show the actual video
                video.poster = "";
                if (wasPlaying) {
                  video
                    .play()
                    .catch((err) => console.error("Error playing video:", err));
                }
              } catch (restoreError) {
                console.error("Error restoring video state:", restoreError);
              }
            };

            // Add an error handler
            video.onerror = (e) => {
              console.error("Video error during reload:", e);
              // Try to recover by setting back to initial URL
              if (urlToUse !== initialVideoUrl) {
                console.log("Attempting recovery with initial URL");
                video.src = initialVideoUrl;
                video.load();
              }
            };
          } else {
            console.log("Updating video src without reload");

            // For non-border changes that don't require a full reload
            // Just update the src attribute without reloading
            video.src = urlToUse;

            // Restore playback position and state
            if (video.readyState >= 2) {
              video.currentTime = currentTime;
              if (wasPlaying && video.paused) {
                video
                  .play()
                  .catch((err) => console.error("Error playing video:", err));
              }
            } else {
              video.onloadeddata = () => {
                video.currentTime = currentTime;
                if (wasPlaying) {
                  video
                    .play()
                    .catch((err) => console.error("Error playing video:", err));
                }
              };
            }
          }
        } catch (error) {
          console.error("Error updating video:", error);
        }
      } else {
        console.log("Video URL unchanged, no update needed");
      }
    } catch (error) {
      console.error("Error in video update effect:", error);
    }
  }, [
    transformedVideoUrl,
    initialVideoUrl,
    videoDuration,
    needsReload,
    transformations.trim.enabled,
  ]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Tab change doesn't need to reload the video - the useEffect will handle that if needed
  };

  const handleBorderChange = (
    property: keyof typeof transformations.border,
    value: any,
  ) => {
    // For border changes, we don't touch the video element at all
    // We just update the state and let the CSS handle the visual change
    setTransformations((prev) => ({
      ...prev,
      border: {
        ...prev.border,
        [property]: value,
      },
    }));

    // Log the transformation for debugging
    console.log(`Border ${property} changed to:`, value);
  };

  const handleAdjustmentChange = (
    property: keyof typeof transformations.adjustments,
    value: any,
  ) => {
    // Get current video time before updating transformations
    const video = document.getElementById("preview-video") as HTMLVideoElement;
    const currentTime = video?.currentTime || 0;
    const isPlaying = video && !video.paused && !video.ended;

    setTransformations((prev) => ({
      ...prev,
      adjustments: {
        ...prev.adjustments,
        [property]: value,
      },
    }));

    // After state update, restore video position and play state
    setTimeout(() => {
      const updatedVideo = document.getElementById(
        "preview-video",
      ) as HTMLVideoElement;
      if (updatedVideo) {
        updatedVideo.currentTime = currentTime;
        if (isPlaying) {
          updatedVideo
            .play()
            .catch((e) => console.error("Error playing video:", e));
        }
      }
    }, 100);
  };

  const handleCropChange = (
    property: keyof typeof transformations.crop,
    value: any,
  ) => {
    // Get current video time before updating transformations
    const video = document.getElementById("preview-video") as HTMLVideoElement;
    const currentTime = video?.currentTime || 0;
    const isPlaying = video && !video.paused && !video.ended;

    setTransformations((prev) => ({
      ...prev,
      crop: {
        ...prev.crop,
        [property]: value,
      },
    }));

    // After state update, restore video position and play state
    setTimeout(() => {
      const updatedVideo = document.getElementById(
        "preview-video",
      ) as HTMLVideoElement;
      if (updatedVideo) {
        updatedVideo.currentTime = currentTime;
        if (isPlaying) {
          updatedVideo
            .play()
            .catch((e) => console.error("Error playing video:", e));
        }
      }
    }, 100);
  };

  const handleRotateChange = (
    property: keyof typeof transformations.rotate,
    value: any,
  ) => {
    // Get current video time before updating transformations
    const video = document.getElementById("preview-video") as HTMLVideoElement;
    const currentTime = video?.currentTime || 0;
    const isPlaying = video && !video.paused && !video.ended;

    setTransformations((prev) => ({
      ...prev,
      rotate: {
        ...prev.rotate,
        [property]: value,
      },
    }));

    // After state update, restore video position and play state
    setTimeout(() => {
      const updatedVideo = document.getElementById(
        "preview-video",
      ) as HTMLVideoElement;
      if (updatedVideo) {
        updatedVideo.currentTime = currentTime;
        if (isPlaying) {
          updatedVideo
            .play()
            .catch((e) => console.error("Error playing video:", e));
        }
      }
    }, 100);
  };

  const handleEffectsChange = (
    property: keyof typeof transformations.effects,
    value: any,
  ) => {
    // Get current video time before updating transformations
    const video = document.getElementById("preview-video") as HTMLVideoElement;
    const currentTime = video?.currentTime || 0;
    const isPlaying = video && !video.paused && !video.ended;

    setTransformations((prev) => ({
      ...prev,
      effects: {
        ...prev.effects,
        [property]: value,
      },
    }));

    // After state update, restore video position and play state
    setTimeout(() => {
      const updatedVideo = document.getElementById(
        "preview-video",
      ) as HTMLVideoElement;
      if (updatedVideo) {
        updatedVideo.currentTime = currentTime;
        if (isPlaying) {
          updatedVideo
            .play()
            .catch((e) => console.error("Error playing video:", e));
        }
      }
    }, 100);
  };

  const handleTrimChange = (
    property: keyof typeof transformations.trim,
    value: any,
  ) => {
    // Get current video time before updating transformations
    const video = document.getElementById("preview-video") as HTMLVideoElement;
    const currentTime = video?.currentTime || 0;
    const isPlaying = video && !video.paused && !video.ended;

    setTransformations((prev) => {
      let newTrim = { ...prev.trim, [property]: value };

      // If we're changing start or end time, update the duration
      if (property === "startTime" || property === "endTime") {
        const startTime =
          property === "startTime" ? value : prev.trim.startTime;
        const endTime = property === "endTime" ? value : prev.trim.endTime;
        newTrim.duration = Math.max(0, endTime - startTime);
      }

      return {
        ...prev,
        trim: newTrim,
      };
    });

    // After state update, restore video position and play state
    setTimeout(() => {
      const updatedVideo = document.getElementById(
        "preview-video",
      ) as HTMLVideoElement;
      if (updatedVideo) {
        updatedVideo.currentTime = currentTime;
        if (isPlaying) {
          updatedVideo
            .play()
            .catch((e) => console.error("Error playing video:", e));
        }
      }
    }, 100);
  };

  const handleDownload = async () => {
    try {
      // Create a simpler download URL using Cloudinary's download endpoint
      if (!cloudinaryPublicId || !cloudName) {
        console.error("Missing Cloudinary public ID or cloud name");
        return;
      }

      // Start with the base URL
      const baseUrl = `https://res.cloudinary.com/${cloudName}/video/upload`;

      // Create a clean array of transformation parts
      const transformationParts = [];

      // Add border if width > 0
      // We need to include border in the download URL even though we use CSS for preview
      if (transformations.border.width > 0) {
        transformationParts.push(
          `bo_${transformations.border.width}px_${transformations.border.style}_${transformations.border.color.replace("#", "")}`,
        );
      }

      // Add fl_attachment to force download
      transformationParts.push("fl_attachment");

      // Build the final URL
      let downloadUrl = baseUrl;
      if (transformationParts.length > 0) {
        downloadUrl += `/${transformationParts.join(",")}`;
      }
      downloadUrl += `/${cloudinaryPublicId}`;

      // Add a timestamp to prevent caching
      downloadUrl += `?_t=${Date.now()}`;

      console.log("Download URL:", downloadUrl);

      // Use fetch API to check if the URL is valid before attempting download
      const response = await fetch(downloadUrl, { method: "HEAD" });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Create a temporary anchor element with proper attributes
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `edited_video_${Date.now()}.mp4`;
      a.target = "_blank"; // Open in new tab as fallback
      a.rel = "noopener noreferrer";
      a.style.display = "none";

      // Append to body, click, and remove
      document.body.appendChild(a);
      a.click();

      // Small delay before removing the element
      setTimeout(() => {
        document.body.removeChild(a);
      }, 100);
    } catch (error) {
      console.error("Download error:", error);

      // Try alternative download approach
      try {
        // Create a direct download URL without transformations
        const directUrl = `https://res.cloudinary.com/${cloudName}/video/upload/fl_attachment/${cloudinaryPublicId}?_t=${Date.now()}`;
        console.log("Trying alternative download URL:", directUrl);

        window.open(directUrl, "_blank");
      } catch (fallbackError) {
        console.error("Fallback download failed:", fallbackError);
        alert("Download failed. Please try again or contact support.");
      }
    }
  };

  const handleReset = () => {
    setTransformations({
      border: {
        width: 5,
        color: "white",
        style: "solid",
      },
      adjustments: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        sepia: 0,
      },
      crop: {
        enabled: false,
        aspect: "16:9",
        zoom: 100,
      },
      rotate: {
        angle: 0,
        flip: false,
      },
      effects: {
        blur: 0,
        vignette: 0,
        noise: 0,
      },
      trim: {
        enabled: false,
        startTime: 0,
        endTime: videoDuration > 0 ? videoDuration : 10,
        duration: videoDuration > 0 ? videoDuration : 10,
      },
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Video Preview</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center items-center">
              {/* Outer container with fixed dimensions */}
              <div className="w-full aspect-video bg-black rounded-md overflow-hidden relative">
                {/* Border container - absolutely positioned */}
                {transformations.border.width > 0 && (
                  <div
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                      border: `${transformations.border.width}px ${transformations.border.style} ${transformations.border.color}`,
                    }}
                  />
                )}
                {/* Video container */}
                <div className="w-full h-full">
                  <video
                    id="preview-video"
                    src={videoUrl}
                    controls
                    className="w-full h-full object-contain"
                    onError={(e) =>
                      console.error("Video error:", e.currentTarget.error)
                    }
                    onLoadedMetadata={(e) => {
                      const video = e.currentTarget;
                      if (video.duration && videoDuration === 0) {
                        setVideoDuration(video.duration);
                        // Update end time in trim settings
                        setTransformations((prev) => ({
                          ...prev,
                          trim: {
                            ...prev.trim,
                            endTime: video.duration,
                            duration: video.duration - prev.trim.startTime,
                          },
                        }));
                      }
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full w-full">
            <CardHeader>
              <CardTitle>Edit Video</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                className="space-y-6"
              >
                <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-6">
                  <TabsTrigger value="border">Border</TabsTrigger>
                  <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
                  <TabsTrigger value="crop">Crop</TabsTrigger>
                  <TabsTrigger value="rotate">Rotate</TabsTrigger>
                  <TabsTrigger value="effects">Effects</TabsTrigger>
                  <TabsTrigger value="trim">Trim</TabsTrigger>
                </TabsList>

                <TabsContent value="border" className="space-y-10 pt-6">
                  <div>
                    <label className="block text-sm font-medium mb-4">
                      Border Width
                    </label>
                    <Slider
                      value={[transformations.border.width]}
                      min={0}
                      max={20}
                      step={1}
                      onValueChange={(value) =>
                        handleBorderChange("width", value[0])
                      }
                    />
                    <span className="text-xs text-gray-500 mt-3 block">
                      {transformations.border.width}px
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-4">
                      Border Color
                    </label>
                    <input
                      type="color"
                      value={transformations.border.color}
                      onChange={(e) =>
                        handleBorderChange("color", e.target.value)
                      }
                      className="w-full h-10 rounded-md cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-4">
                      Border Style
                    </label>
                    <select
                      value={transformations.border.style}
                      onChange={(e) =>
                        handleBorderChange("style", e.target.value)
                      }
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="solid">Solid</option>
                      <option value="dotted">Dotted</option>
                      <option value="dashed">Dashed</option>
                    </select>
                  </div>
                </TabsContent>

                <TabsContent value="adjustments" className="space-y-10 pt-6">
                  <div>
                    <label className="block text-sm font-medium mb-4">
                      Brightness
                    </label>
                    <Slider
                      value={[transformations.adjustments.brightness]}
                      min={-100}
                      max={100}
                      step={5}
                      onValueChange={(value) =>
                        handleAdjustmentChange("brightness", value[0])
                      }
                    />
                    <span className="text-xs text-gray-500 mt-3 block">
                      {transformations.adjustments.brightness}%
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-4">
                      Contrast
                    </label>
                    <Slider
                      value={[transformations.adjustments.contrast]}
                      min={-100}
                      max={100}
                      step={5}
                      onValueChange={(value) =>
                        handleAdjustmentChange("contrast", value[0])
                      }
                    />
                    <span className="text-xs text-gray-500 mt-3 block">
                      {transformations.adjustments.contrast}%
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-4">
                      Saturation
                    </label>
                    <Slider
                      value={[transformations.adjustments.saturation]}
                      min={-100}
                      max={100}
                      step={5}
                      onValueChange={(value) =>
                        handleAdjustmentChange("saturation", value[0])
                      }
                    />
                    <span className="text-xs text-gray-500 mt-3 block">
                      {transformations.adjustments.saturation}%
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-4">
                      Sepia
                    </label>
                    <Slider
                      value={[transformations.adjustments.sepia]}
                      min={0}
                      max={100}
                      step={5}
                      onValueChange={(value) =>
                        handleAdjustmentChange("sepia", value[0])
                      }
                    />
                    <span className="text-xs text-gray-500 mt-3 block">
                      {transformations.adjustments.sepia}%
                    </span>
                  </div>
                </TabsContent>

                <TabsContent value="crop" className="space-y-10 pt-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <input
                      type="checkbox"
                      id="crop-enabled"
                      checked={transformations.crop.enabled}
                      onChange={(e) =>
                        handleCropChange("enabled", e.target.checked)
                      }
                      className="rounded border-gray-300"
                    />
                    <label
                      htmlFor="crop-enabled"
                      className="text-sm font-medium"
                    >
                      Enable Cropping
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-4">
                      Aspect Ratio
                    </label>
                    <select
                      value={transformations.crop.aspect}
                      onChange={(e) =>
                        handleCropChange("aspect", e.target.value)
                      }
                      className="w-full p-2 border rounded-md"
                      disabled={!transformations.crop.enabled}
                    >
                      <option value="16:9">16:9 (Widescreen)</option>
                      <option value="4:3">4:3 (Standard)</option>
                      <option value="1:1">1:1 (Square)</option>
                      <option value="9:16">9:16 (Portrait)</option>
                      <option value="2:1">2:1 (Cinematic)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-4">
                      Zoom Level
                    </label>
                    <Slider
                      value={[transformations.crop.zoom]}
                      min={100}
                      max={200}
                      step={5}
                      onValueChange={(value) =>
                        handleCropChange("zoom", value[0])
                      }
                      disabled={!transformations.crop.enabled}
                    />
                    <span className="text-xs text-gray-500 mt-3 block">
                      {transformations.crop.zoom}%
                    </span>
                  </div>
                </TabsContent>

                <TabsContent value="rotate" className="space-y-10 pt-6">
                  <div>
                    <label className="block text-sm font-medium mb-4">
                      Rotation Angle
                    </label>
                    <Slider
                      value={[transformations.rotate.angle]}
                      min={0}
                      max={360}
                      step={90}
                      onValueChange={(value) =>
                        handleRotateChange("angle", value[0])
                      }
                    />
                    <span className="text-xs text-gray-500 mt-3 block">
                      {transformations.rotate.angle}°
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 mt-6">
                    <input
                      type="checkbox"
                      id="flip-horizontal"
                      checked={transformations.rotate.flip}
                      onChange={(e) =>
                        handleRotateChange("flip", e.target.checked)
                      }
                      className="rounded border-gray-300"
                    />
                    <label
                      htmlFor="flip-horizontal"
                      className="text-sm font-medium"
                    >
                      Flip Horizontally
                    </label>
                  </div>
                </TabsContent>

                <TabsContent value="effects" className="space-y-10 pt-6">
                  <div>
                    <label className="block text-sm font-medium mb-4">
                      Blur
                    </label>
                    <Slider
                      value={[transformations.effects.blur]}
                      min={0}
                      max={2000}
                      step={100}
                      onValueChange={(value) =>
                        handleEffectsChange("blur", value[0])
                      }
                    />
                    <span className="text-xs text-gray-500 mt-3 block">
                      {transformations.effects.blur}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-4">
                      Vignette
                    </label>
                    <Slider
                      value={[transformations.effects.vignette]}
                      min={0}
                      max={100}
                      step={5}
                      onValueChange={(value) =>
                        handleEffectsChange("vignette", value[0])
                      }
                    />
                    <span className="text-xs text-gray-500 mt-3 block">
                      {transformations.effects.vignette}%
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-4">
                      Noise
                    </label>
                    <Slider
                      value={[transformations.effects.noise]}
                      min={0}
                      max={100}
                      step={5}
                      onValueChange={(value) =>
                        handleEffectsChange("noise", value[0])
                      }
                    />
                    <span className="text-xs text-gray-500 mt-3 block">
                      {transformations.effects.noise}%
                    </span>
                  </div>
                </TabsContent>

                <TabsContent value="trim" className="space-y-10 pt-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <input
                      type="checkbox"
                      id="trim-enabled"
                      checked={transformations.trim.enabled}
                      onChange={(e) =>
                        handleTrimChange("enabled", e.target.checked)
                      }
                      className="rounded border-gray-300"
                    />
                    <label
                      htmlFor="trim-enabled"
                      className="text-sm font-medium"
                    >
                      Enable Video Trimming
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-4">
                      Start Time (seconds)
                    </label>
                    <Slider
                      value={[transformations.trim.startTime]}
                      min={0}
                      max={videoDuration}
                      step={0.1}
                      onValueChange={(value) =>
                        handleTrimChange("startTime", value[0])
                      }
                      disabled={!transformations.trim.enabled}
                    />
                    <span className="text-xs text-gray-500 mt-3 block">
                      {transformations.trim.startTime.toFixed(1)}s
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-4">
                      End Time (seconds)
                    </label>
                    <Slider
                      value={[transformations.trim.endTime]}
                      min={0}
                      max={videoDuration}
                      step={0.1}
                      onValueChange={(value) =>
                        handleTrimChange("endTime", value[0])
                      }
                      disabled={!transformations.trim.enabled}
                    />
                    <span className="text-xs text-gray-500 mt-3 block">
                      {transformations.trim.endTime.toFixed(1)}s
                    </span>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium mb-2">Trim Summary</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Duration: </span>
                        <span className="font-medium">
                          {transformations.trim.duration.toFixed(1)}s
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">
                          Total Video Length:{" "}
                        </span>
                        <span className="font-medium">
                          {videoDuration.toFixed(1)}s
                        </span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 mt-6">
                <Button onClick={handleDownload} className="flex-1">
                  <Download className="mr-2 h-4 w-4" /> Download
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
