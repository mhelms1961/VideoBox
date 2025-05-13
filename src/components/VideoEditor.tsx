import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { useLocation } from "react-router-dom";

interface VideoEditorProps {
  videoFile: File | null;
  borderWidth?: number;
  borderColor?: string;
}

export default function VideoEditor({
  videoFile: propVideoFile,
  borderWidth = 4,
  borderColor = "white",
}: VideoEditorProps) {
  const location = useLocation();
  const videoFileFromState = location.state?.videoFile;
  const videoFile = propVideoFile || videoFileFromState;
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Create object URL for the video file
  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [videoFile]);

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

  if (!videoFile || !videoUrl) {
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
        <p className="text-sm text-gray-600">
          {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
        </p>
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
          src={videoUrl}
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
