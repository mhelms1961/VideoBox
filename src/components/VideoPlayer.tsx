import { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  controls?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  width?: number | string;
  height?: number | string;
  onReady?: (player: any) => void;
  onError?: (error: any) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  className?: string;
}

export default function VideoPlayer({
  src,
  poster,
  controls = true,
  autoplay = false,
  muted = false,
  width = "100%",
  height = "auto",
  onReady,
  onError,
  onPlay,
  onPause,
  onEnded,
  className = "",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      // The Video.js player needs to be _inside_ the component el for React 18 Strict Mode
      const videoElement = document.createElement("video-js");
      videoElement.classList.add("vjs-big-play-centered");
      videoRef.current?.appendChild(videoElement);

      const player = (playerRef.current = videojs(
        videoElement,
        {
          controls,
          autoplay,
          muted,
          preload: "auto",
          fluid: true,
          poster,
          sources: [
            {
              src: cleanUrl(src),
              type: "video/mp4",
            },
          ],
          html5: {
            vhs: {
              overrideNative: true,
            },
            nativeAudioTracks: false,
            nativeVideoTracks: false,
          },
          techOrder: ["html5"],
          playbackRates: [0.5, 1, 1.5, 2],
        },
        () => {
          console.log("Video.js player is ready");
          if (onReady) {
            onReady(player);
          }
        },
      ));

      // Add event listeners
      player.on("error", (error: any) => {
        console.error("Video.js player error:", error);
        if (onError) {
          onError(error);
        }

        // Try to recover by changing the source with format parameters
        const currentSrc = player.src();
        if (currentSrc && typeof currentSrc === "string") {
          const baseUrl = currentSrc.split("?")[0];
          // Try with even more compatible settings: lower resolution, lower quality
          const newSrc = `${baseUrl}?f_mp4,vc_h264,w_640,h_360,vc_auto,q_auto:low,fl_progressive&_t=${Date.now()}`;
          console.log("Attempting to recover with new source:", newSrc);

          player.src({
            src: newSrc,
            type: "video/mp4",
          });
          player.load();
        }
      });

      if (onPlay) player.on("play", onPlay);
      if (onPause) player.on("pause", onPause);
      if (onEnded) player.on("ended", onEnded);
    } else {
      // Update the source if it changes
      const player = playerRef.current;
      player.src({
        src: cleanUrl(src),
        type: "video/mp4",
      });
    }
  }, []);

  // Update source when src prop changes
  useEffect(() => {
    if (playerRef.current && src) {
      playerRef.current.src({
        src: cleanUrl(src),
        type: "video/mp4",
      });
    }
  }, [src]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  // Helper function to ensure the URL has the correct format parameters
  function cleanUrl(url: string): string {
    if (!url) return "";
    const baseUrl = url.split("?")[0];
    return `${baseUrl}?f_mp4,vc_h264,q_auto&_t=${Date.now()}`;
  }

  return (
    <div data-vjs-player className={className}>
      <div ref={videoRef} style={{ width, height }} />
    </div>
  );
}
