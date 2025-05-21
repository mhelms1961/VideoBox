import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

interface VideoEditorProps {
  videoUrl?: string;
  videoFile?: File | null;
  borderWidth?: number;
  borderColor?: string;
}

export default function VideoEditor({
  videoUrl: propVideoUrl,
  videoFile: propVideoFile,
  borderWidth = 4,
  borderColor = "white",
}: VideoEditorProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Use provided videoUrl or create object URL for the video file
  useEffect(() => {
    if (propVideoUrl) {
      setLocalVideoUrl(propVideoUrl);
    } else if (propVideoFile) {
      const url = URL.createObjectURL(propVideoFile);
      setLocalVideoUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [propVideoUrl, propVideoFile]);

  // Handle play/pause
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle video end
  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  if (!localVideoUrl) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No video selected</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Video Preview</h2>
        {propVideoFile && (
          <p className="text-sm text-gray-600">
            {propVideoFile.name} (
            {(propVideoFile.size / (1024 * 1024)).toFixed(2)} MB)
          </p>
        )}
      </div>

      {/* Video with border */}
      <div
        className="relative rounded-lg overflow-hidden"
        style={{
          padding: `${borderWidth}px`,
          backgroundColor: borderColor,
        }}
      >
        <video
          ref={videoRef}
          src={localVideoUrl}
          className="w-full h-auto rounded-sm"
          onEnded={handleVideoEnd}
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

      {/* Controls */}
      <div className="mt-4 flex justify-between items-center">
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
      </div>
    </div>
  );
}
