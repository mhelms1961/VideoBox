import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Download } from "lucide-react";

interface FallbackVideoPlayerProps {
  src: string;
  borderWidth?: number;
  borderColor?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  controls?: boolean;
  className?: string;
}

export default function FallbackVideoPlayer({
  src,
  borderWidth = 0,
  borderColor = "white",
  onPlay,
  onPause,
  onEnded,
  controls = false,
  className = "",
}: FallbackVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSrc, setCurrentSrc] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Clean and format the URL for maximum compatibility
  const getFormattedUrl = (url: string): string => {
    if (!url) return "";
    const baseUrl = url.split("?")[0];
    // Use very low quality and progressive loading for maximum compatibility
    return `${baseUrl}?f_mp4,vc_h264,q_40,fl_progressive&_t=${Date.now()}`;
  };

  useEffect(() => {
    if (src) {
      const formattedUrl = getFormattedUrl(src);
      setCurrentSrc(formattedUrl);
      setError(null);
      setIsLoaded(false);

      // Reset video element
      if (videoRef.current) {
        videoRef.current.load();
      }
    }
  }, [src]);

  const togglePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      if (onPause) onPause();
    } else {
      // Try to play and handle any errors
      videoRef.current.play().catch((err) => {
        console.error("Error playing video:", err);
        setError("Could not play video. Try clicking the play button again.");
      });
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    if (onPlay) onPlay();
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (onPause) onPause();
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (onEnded) onEnded();
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const target = e.target as HTMLVideoElement;
    console.error("Video error:", target.error);

    setError("Error loading video. Trying alternative format...");

    // Try a different format with even lower quality and smaller dimensions
    const baseUrl = src.split("?")[0];
    const alternativeUrl = `${baseUrl}?f_mp4,vc_h264,w_480,h_270,q_20,fl_progressive&_t=${Date.now()}`;

    // Only change if it's different to avoid loops
    if (alternativeUrl !== currentSrc) {
      console.log("Trying alternative URL:", alternativeUrl);
      setCurrentSrc(alternativeUrl);

      // Reset video element
      if (videoRef.current) {
        videoRef.current.load();
      }
    }
  };

  const handleCanPlay = () => {
    setIsLoaded(true);
    setError(null);
  };

  const borderStyle = {
    padding: `${borderWidth}px`,
    backgroundColor: borderColor,
  };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={containerRef}
        className="relative rounded-lg overflow-hidden"
        style={borderStyle}
      >
        <video
          ref={videoRef}
          src={currentSrc}
          className="w-full h-auto rounded-sm"
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          onError={handleError}
          onCanPlay={handleCanPlay}
          playsInline
          muted
          preload="auto"
          controls={controls}
        />

        {!controls && (
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
        )}
      </div>

      {error && (
        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 text-amber-800 rounded text-sm">
          {error}
        </div>
      )}

      {!controls && isLoaded && (
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

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const downloadUrl = `${src.split("?")[0]}?f_mp4,vc_h264,fl_attachment&_t=${Date.now()}`;
              window.open(downloadUrl, "_blank");
            }}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" /> Download
          </Button>
        </div>
      )}
    </div>
  );
}
