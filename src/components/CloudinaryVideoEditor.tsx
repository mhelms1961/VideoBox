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
}

export default function CloudinaryVideoEditor({
  initialVideoUrl,
  cloudinaryPublicId,
  cloudName,
  apiKey,
}: CloudinaryVideoEditorProps) {
  const [videoUrl, setVideoUrl] = useState<string>(initialVideoUrl);
  const [activeTab, setActiveTab] = useState<string>("border");
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
  });

  // Create a string representation of transformations for dependency tracking
  const transformationsString = JSON.stringify(transformations);

  // Generate the transformed video URL
  const transformedVideoUrl = useMemo(() => {
    if (!cloudinaryPublicId || !cloudName) return initialVideoUrl;

    // Check if any transformations are applied
    const hasBorder = transformations.border.width > 0;
    const hasAdjustments =
      transformations.adjustments.brightness !== 0 ||
      transformations.adjustments.contrast !== 0 ||
      transformations.adjustments.saturation !== 0 ||
      transformations.adjustments.sepia !== 0;

    // If no transformations, return the original URL
    if (!hasBorder && !hasAdjustments) return initialVideoUrl;

    // Build transformation string
    let transformationParts = [];

    // Add border if width > 0
    if (hasBorder) {
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

    // Construct the final URL with transformations
    const transformationString = transformationParts.join(",");
    const baseUrl = `https://res.cloudinary.com/${cloudName}/video/upload`;
    return `${baseUrl}/${transformationString}/${cloudinaryPublicId}`;
  }, [cloudinaryPublicId, cloudName, transformationsString, initialVideoUrl]);

  // Force video reload when transformations change
  useEffect(() => {
    const video = document.getElementById("preview-video") as HTMLVideoElement;
    if (video) {
      // Determine which URL to use based on transformations
      const hasBorder = transformations.border.width > 0;
      const hasAdjustments =
        transformations.adjustments.brightness !== 0 ||
        transformations.adjustments.contrast !== 0 ||
        transformations.adjustments.saturation !== 0 ||
        transformations.adjustments.sepia !== 0;

      // Use direct URL first for better compatibility, transformed URL only when needed
      const urlToUse =
        !hasBorder && !hasAdjustments ? initialVideoUrl : transformedVideoUrl;

      // Only reload if URL changed
      if (video.src !== urlToUse) {
        setVideoUrl(urlToUse);
        video.load();
      }
    }
  }, [transformationsString, transformedVideoUrl, initialVideoUrl]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);

    // When changing tabs, ensure video is properly loaded
    const video = document.getElementById("preview-video") as HTMLVideoElement;
    if (video) {
      // Determine which URL to use based on transformations
      const hasBorder = transformations.border.width > 0;
      const hasAdjustments =
        transformations.adjustments.brightness !== 0 ||
        transformations.adjustments.contrast !== 0 ||
        transformations.adjustments.saturation !== 0 ||
        transformations.adjustments.sepia !== 0;

      // Use direct URL first for better compatibility
      const urlToUse =
        !hasBorder && !hasAdjustments ? initialVideoUrl : transformedVideoUrl;

      if (video.src !== urlToUse) {
        setVideoUrl(urlToUse);
        video.load();
      }
    }
  };

  const handleBorderChange = (
    property: keyof typeof transformations.border,
    value: any,
  ) => {
    setTransformations((prev) => ({
      ...prev,
      border: {
        ...prev.border,
        [property]: value,
      },
    }));
  };

  const handleAdjustmentChange = (
    property: keyof typeof transformations.adjustments,
    value: any,
  ) => {
    setTransformations((prev) => ({
      ...prev,
      adjustments: {
        ...prev.adjustments,
        [property]: value,
      },
    }));
  };

  const handleDownload = () => {
    // Create a temporary anchor element
    const a = document.createElement("a");
    a.href = transformedVideoUrl;
    a.download = `edited_${cloudinaryPublicId || "video"}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Video Preview</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center items-center">
              <div className="w-full aspect-video bg-black rounded-md overflow-hidden">
                <video
                  id="preview-video"
                  src={videoUrl}
                  controls
                  className="w-full h-full object-contain"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Edit Video</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="border">Border</TabsTrigger>
                  <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
                </TabsList>

                <TabsContent value="border" className="space-y-4 pt-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
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
                    <span className="text-xs text-gray-500 mt-1">
                      {transformations.border.width}px
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
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
                    <label className="block text-sm font-medium mb-2">
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

                <TabsContent value="adjustments" className="space-y-4 pt-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
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
                    <span className="text-xs text-gray-500 mt-1">
                      {transformations.adjustments.brightness}%
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
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
                    <span className="text-xs text-gray-500 mt-1">
                      {transformations.adjustments.contrast}%
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
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
                    <span className="text-xs text-gray-500 mt-1">
                      {transformations.adjustments.saturation}%
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
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
                    <span className="text-xs text-gray-500 mt-1">
                      {transformations.adjustments.sepia}%
                    </span>
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
