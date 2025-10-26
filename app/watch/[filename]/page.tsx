"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUserStore } from "@/store/user.store";
import VideoService from "@/services/video.service";
import { Video } from "@/types/video";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  SkipBack,
  SkipForward,
  Settings
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function WatchPage() {
  const { filename } = useParams();
  const router = useRouter();
  const { user, loading: userLoading } = useUserStore();

  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Video player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push("/auth");
      return;
    }

    const fetchVideo = async () => {
      try {
        const fetchedVideo = await VideoService.findByFilename(filename as string);
        setVideo(fetchedVideo);
      } catch (err) {
        console.error("Video metadata error:", err);
        setError("Videoni yuklashda xatolik yuz berdi. Qayta urinib ko‘ring.");
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();

    // Bloklash choralar va keyboard shortcuts
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      // Security blocks
      if (
        e.key === "PrintScreen" ||
        (e.ctrlKey && e.key.toLowerCase() === "p") ||
        (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase())) ||
        e.key === "F12"
      ) {
        e.preventDefault();
        return;
      }

      // Video player shortcuts
      if (videoRef.current) {
        switch (e.key.toLowerCase()) {
          case " ":
          case "k":
            e.preventDefault();
            togglePlay();
            break;
          case "j":
            e.preventDefault();
            skipTime(-10);
            break;
          case "l":
            e.preventDefault();
            skipTime(10);
            break;
          case "m":
            e.preventDefault();
            toggleMute();
            break;
          case "f":
            e.preventDefault();
            toggleFullscreen();
            break;
          case "arrowleft":
            e.preventDefault();
            skipTime(-5);
            break;
          case "arrowright":
            e.preventDefault();
            skipTime(5);
            break;
          case "arrowup":
            e.preventDefault();
            handleVolumeChange({ target: { value: Math.min(1, volume + 0.1).toString() } } as any);
            break;
          case "arrowdown":
            e.preventDefault();
            handleVolumeChange({ target: { value: Math.max(0, volume - 0.1).toString() } } as any);
            break;
        }
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [filename, user, userLoading, router]);

  // Video player functions
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      videoRef.current.currentTime = percentage * duration;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    }
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Auto-hide controls
  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p>Video yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-gray-400">
        <p>Video topilmadi.</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-screen h-screen bg-black flex items-center justify-center group"
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => setShowControls(false)}
      onClick={showControlsTemporarily}
    >

      {/* Video container */}
      <div className="relative w-11/12 max-w-5xl z-20">
        <video
          ref={videoRef}
          src={video.url}
          className="w-full rounded-xl shadow-xl"
          controls={false}
          disablePictureInPicture
          playsInline
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration);
            }
          }}
          onTimeUpdate={() => {
            if (videoRef.current) {
              setCurrentTime(videoRef.current.currentTime);
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onWaiting={() => setIsBuffering(true)}
          onCanPlay={() => setIsBuffering(false)}
          onVolumeChange={() => {
            if (videoRef.current) {
              setVolume(videoRef.current.volume);
              setIsMuted(videoRef.current.muted);
            }
          }}
        />

        {/* Custom Controls Overlay */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          {/* Center Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              size="lg"
              className="bg-red-600 hover:bg-red-700 rounded-full w-20 h-20 opacity-80 hover:opacity-100"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="h-10 w-10" /> : <Play className="h-10 w-10 ml-1" />}
            </Button>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center space-x-4 text-white">
              {/* Play/Pause */}
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={togglePlay}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>

              {/* Skip Back */}
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={() => skipTime(-10)}>
                <SkipBack className="h-4 w-4" />
              </Button>

              {/* Skip Forward */}
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={() => skipTime(10)}>
                <SkipForward className="h-4 w-4" />
              </Button>

              {/* Progress Bar */}
              <div className="flex-1 flex items-center space-x-2">
                <span className="text-sm">{formatTime(currentTime)}</span>
                <Progress 
                  value={progressPercentage} 
                  className="flex-1 h-1 cursor-pointer"
                  onClick={handleSeek}
                />
                <span className="text-sm">{formatTime(duration)}</span>
              </div>

              {/* Volume */}
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={toggleMute}>
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Fullscreen */}
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Buffering Indicator */}
          {isBuffering && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-white">Yuklanmoqda...</div>
            </div>
          )}
        </div>
      </div>

      {/* Ogohlantirish matni */}
      <div className="absolute bottom-4 left-4 right-4 text-center text-sm text-gray-400 z-20">
        <p>
          ⚠️ Kontent himoyalangan. Ekranni yozib olish va skrinshot qilishga
          qarshi choralar qo'llangan, ammo bu to'liq himoya emas. Ruxsatsiz
          tarqatish qonun bilan taqiqlanadi.
        </p>
      </div>
    </div>
  );
}
