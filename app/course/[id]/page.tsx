"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Maximize,
  CheckCircle,
  Lock,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import courseService from "@/services/course.service";
import { Course } from "@/types/course";
import api from "@/lib/api";
import { useUserStore } from "@/store/user.store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

interface VideoProgress {
  video_id: number;
  progress: number;
  completed: boolean;
  watched_time: number;
}

export default function CoursePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: userLoading } = useUserStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0); // Will be set from fetched video
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [volume, setVolume] = useState(1); // Volume: 0-1
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Video progress tracking
  const [videoProgressMap, setVideoProgressMap] = useState<
    Map<number, VideoProgress>
  >(new Map());
  const progressUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  // Check user access to course
  useEffect(() => {
    const checkAccess = async () => {
      // User yuklanayotgan bo'lsa, kutamiz
      if (userLoading) {
        return;
      }

      // User yuklanib bo'lgan, lekin mavjud emas - /auth ga yo'naltirish
      if (!user || !id) {
        router.push("/auth");
        return;
      }

      try {
        // Admin har doim ruxsat bor
        if (user.role === "admin") {
          setHasAccess(true);
          return;
        }

        // User'ning kurslarini tekshirish
        const response = await api.get("/users/me");
        const userData = response.data.user;

        // User'da bu kurs borligini tekshirish
        const userCourseIds =
          userData.courses?.map((c: any) => String(c.id || c)) || [];
        const courseAccess = userCourseIds.includes(String(id));

        if (!courseAccess) {
          // Ruxsat yo'q - pricing page'ga yo'naltirish
          router.push("/pricing");
          return;
        }

        setHasAccess(true);
      } catch (error) {
        console.error("Access check error:", error);
        router.push("/pricing");
      }
    };

    checkAccess();
  }, [user, userLoading, id, router]);

  useEffect(() => {
    if (!id || !hasAccess) return;

    const fetchCourse = async () => {
      try {
        setLoading(true);
        const fetchedCourse = await courseService.findOne(id as string);
        setCourse(fetchedCourse);

        // Fetch video progress for all videos in the course
        if (fetchedCourse.videos && fetchedCourse.videos.length > 0) {
          const videoIds = fetchedCourse.videos.map((v: any) => v.id).join(",");
          try {
            const progressResponse = await api.get(
              `/video-progress?videoIds=${videoIds}`
            );
            const progressData: VideoProgress[] = progressResponse.data;

            // Create a map for quick lookup
            const progressMap = new Map<number, VideoProgress>();
            progressData.forEach((p) => {
              progressMap.set(p.video_id, p);
            });
            setVideoProgressMap(progressMap);
          } catch (error) {
            console.log("Could not fetch video progress:", error);
          }

          setDuration(fetchedCourse.videos[0].duration || 0);
        }
      } catch (err) {
        console.error("Failed to fetch course:", err);
        setError("Kursni yuklashda xatolik yuz berdi.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, hasAccess]);

  // Save video progress periodically
  const saveVideoProgress = async (
    videoId: number,
    currentTime: number,
    duration: number
  ) => {
    if (!videoId || !duration || duration === 0) return;

    try {
      await api.post("/video-progress", {
        videoId,
        currentTime,
        duration,
      });

      // Update local progress map
      let progress = (currentTime / duration) * 100;

      // If 98% or more, consider it 100% (video end buffer)
      if (progress >= 98) {
        progress = 100;
      }

      const completed = progress >= 100;

      setVideoProgressMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(videoId, {
          video_id: videoId,
          progress,
          completed,
          watched_time: currentTime,
        });
        return newMap;
      });
    } catch (error) {
      console.log("Could not save progress:", error);
    }
  };

  // Auto-save progress every 10 seconds while playing
  useEffect(() => {
    if (isPlaying && course?.videos && course.videos[currentVideoIndex]) {
      const currentVideo = course.videos[currentVideoIndex];

      progressUpdateInterval.current = setInterval(() => {
        if (videoRef.current) {
          saveVideoProgress(
            currentVideo.id,
            videoRef.current.currentTime,
            videoRef.current.duration
          );
        }
      }, 10000); // Save every 10 seconds
    } else {
      if (progressUpdateInterval.current) {
        clearInterval(progressUpdateInterval.current);
        progressUpdateInterval.current = null;
      }
    }

    return () => {
      if (progressUpdateInterval.current) {
        clearInterval(progressUpdateInterval.current);
      }
    };
  }, [isPlaying, currentVideoIndex, course]);

  // Update video when currentVideoIndex changes
  useEffect(() => {
    if (videoRef.current && course?.videos && course.videos.length > 0) {
      videoRef.current.load();
    }
  }, [currentVideoIndex, course]);

  // Security measures for video protection
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "PrintScreen" ||
        (e.ctrlKey && e.key.toLowerCase() === "p") ||
        (e.ctrlKey &&
          e.shiftKey &&
          ["i", "j", "c"].includes(e.key.toLowerCase())) ||
        e.key === "F12"
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Kurs yuklanmoqda...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Kurs topilmadi.
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Map server videos to client lessons structure for display
  const lessons = course.videos
    ? course.videos.map((video, index) => {
        const videoProgress = videoProgressMap.get(video.id);
        return {
          id: video.id || `video-${index}`, // Use video.id or fallback to index
          videoId: video.id, // Keep original video ID
          title: video.title,
          duration: video.duration
            ? `${Math.floor(video.duration / 60)} min`
            : "N/A",
          completed: videoProgress?.completed || false,
          progress: videoProgress?.progress || 0,
          locked: false, // This would come from user access data
          current: index === currentVideoIndex, // Current video indicator
        };
      })
    : [];

  // Get current video URL with streaming API
  const mainVideoUrl =
    course.videos && course.videos.length > 0
      ? `${API_URL}/video-stream/stream/${
          course.videos[currentVideoIndex].url ||
          course.videos[currentVideoIndex].filename
        }`
      : "/placeholder.svg";

  const switchVideo = (index: number) => {
    if (course.videos && index >= 0 && index < course.videos.length) {
      setCurrentVideoIndex(index);
      setIsPlaying(false);
      setCurrentTime(0);
      // Force video reload with new URL
      if (videoRef.current) {
        videoRef.current.load();
      }
    }
  };

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;

    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch((err) => {
        console.error("Fullscreen error:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      if (newVolume === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Custom CSS for volume slider and video protection */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* Volume slider styles */
        .volume-slider::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${volume > 0.9 ? "#dc2626" : "#ffffff"};
          cursor: pointer;
          border: 2px solid ${volume > 0.9 ? "#991b1b" : "#e5e7eb"};
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
        }
        
        .volume-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${volume > 0.9 ? "#dc2626" : "#ffffff"};
          cursor: pointer;
          border: 2px solid ${volume > 0.9 ? "#991b1b" : "#e5e7eb"};
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
        }
        
        .volume-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        
        .volume-slider::-moz-range-thumb:hover {
          transform: scale(1.2);
        }
        
        /* Prevent video download via CSS */
        video::-internal-media-controls-download-button {
          display: none !important;
        }
        
        video::-webkit-media-controls-enclosure {
          overflow: hidden !important;
        }
        
        video::-webkit-media-controls-panel {
          width: calc(100% + 30px) !important;
        }
      `,
        }}
      />
      {/* Orqa fon rasmi */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/fon.png"
          alt="Background"
          className="w-full h-full object-cover opacity-50"
          style={{
            minHeight: "100vh",
            transform: "scale(1.2)",
            transformOrigin: "center",
            maxHeight: "100vh",
          }}
        />
      </div>
      {/* Header */}
      <header className="bg-white border-b relative z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900">Kurs</h1>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Bosh sahifaga qaytish
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Video Player */}
            <Card className="mb-6">
              <CardContent className="p-0">
                <div
                  ref={videoContainerRef}
                  className="relative bg-black rounded-t-lg overflow-hidden"
                >
                  {/* Watermark overlay */}
                  <div
                    className="absolute inset-0 z-10 pointer-events-none"
                    style={{
                      background:
                        "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' height='100px' width='100px'><text x='0' y='50' fill='rgba(255,255,255,0.03)' font-size='12'>UYGUNLIK</text></svg>\")",
                      backgroundRepeat: "repeat",
                    }}
                  />
                  <div className="aspect-video flex items-center justify-center bg-black">
                    <video
                      ref={videoRef}
                      src={mainVideoUrl}
                      className="w-full h-full object-contain"
                      controls={false}
                      controlsList="nodownload noremoteplayback"
                      disablePictureInPicture
                      disableRemotePlayback
                      playsInline
                      preload="metadata"
                      onContextMenu={(e) => e.preventDefault()}
                      style={{ maxWidth: "100%", maxHeight: "100%" }}
                      onLoadedMetadata={() => {
                        if (videoRef.current) {
                          setDuration(videoRef.current.duration);
                        }
                      }}
                      onTimeUpdate={() => {
                        if (videoRef.current) {
                          setCurrentTime(
                            Math.floor(videoRef.current.currentTime)
                          );
                        }
                      }}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onEnded={() => {
                        // When video ends, mark as 100% completed
                        if (
                          course?.videos &&
                          course.videos[currentVideoIndex]
                        ) {
                          const currentVideo = course.videos[currentVideoIndex];
                          if (videoRef.current) {
                            saveVideoProgress(
                              currentVideo.id,
                              videoRef.current.duration,
                              videoRef.current.duration
                            );
                          }
                        }
                        setIsPlaying(false);
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        size="lg"
                        className="bg-red-600 hover:bg-red-700 rounded-full w-16 h-16"
                        onClick={() => {
                          if (videoRef.current) {
                            if (isPlaying) {
                              videoRef.current.pause();
                            } else {
                              videoRef.current.play();
                            }
                          }
                        }}
                      >
                        {isPlaying ? (
                          <Pause className="h-8 w-8" />
                        ) : (
                          <Play className="h-8 w-8 ml-1" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Video Controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center space-x-4 text-white">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.currentTime = Math.max(
                              0,
                              videoRef.current.currentTime - 10
                            );
                          }
                        }}
                      >
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                        onClick={() => {
                          if (videoRef.current) {
                            if (isPlaying) {
                              videoRef.current.pause();
                            } else {
                              videoRef.current.play();
                            }
                          }
                        }}
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.currentTime = Math.min(
                              videoRef.current.duration,
                              videoRef.current.currentTime + 10
                            );
                          }
                        }}
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>

                      <div className="flex-1 flex items-center space-x-2">
                        <span className="text-sm">
                          {formatTime(currentTime)}
                        </span>
                        <Progress
                          value={progressPercentage}
                          className="flex-1 h-1 cursor-pointer"
                          onClick={(e) => {
                            if (videoRef.current && duration > 0) {
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              const clickX = e.clientX - rect.left;
                              const percentage = clickX / rect.width;
                              videoRef.current.currentTime =
                                percentage * duration;
                            }
                          }}
                        />
                        <span className="text-sm">{formatTime(duration)}</span>
                      </div>

                      {/* Volume Control */}
                      <div className="flex items-center space-x-2 group">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-white hover:bg-white/20"
                          onClick={toggleMute}
                        >
                          {isMuted || volume === 0 ? (
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                              />
                            </svg>
                          ) : volume > 0.9 ? (
                            <svg
                              className="h-4 w-4 text-red-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                              />
                            </svg>
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </Button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={volume}
                          onChange={(e) =>
                            handleVolumeChange(parseFloat(e.target.value))
                          }
                          className="volume-slider w-0 group-hover:w-24 transition-all duration-200 h-2 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background:
                              volume > 0.9
                                ? `linear-gradient(to right, #dc2626 0%, #dc2626 ${
                                    volume * 100
                                  }%, rgba(255,255,255,0.3) ${
                                    volume * 100
                                  }%, rgba(255,255,255,0.3) 100%)`
                                : `linear-gradient(to right, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.9) ${
                                    volume * 100
                                  }%, rgba(255,255,255,0.3) ${
                                    volume * 100
                                  }%, rgba(255,255,255,0.3) 100%)`,
                          }}
                        />
                      </div>

                      {/* Fullscreen Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                        onClick={toggleFullscreen}
                        title="To'liq ekran"
                      >
                        <Maximize className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lesson Info */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-2xl">{course.title}</CardTitle>
                <CardDescription className="text-lg mt-2">
                  {course.videos ? course.videos.length : 0} ta dars
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {course.description}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Darslar ro'yxati</CardTitle>
                <CardDescription>{course.title}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      onClick={() => switchVideo(index)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        lesson.current
                          ? "bg-red-50 border-red-200"
                          : lesson.completed
                          ? "bg-green-50 border-green-200 hover:bg-green-100"
                          : lesson.locked
                          ? "bg-gray-50 border-gray-200 cursor-not-allowed"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            lesson.completed
                              ? "bg-green-600 text-white"
                              : lesson.current
                              ? "bg-red-600 text-white"
                              : lesson.locked
                              ? "bg-gray-300 text-gray-500"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {lesson.completed ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : lesson.locked ? (
                            <Lock className="h-3 w-3" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${
                              lesson.current ? "text-red-900" : "text-gray-900"
                            }`}
                            title={lesson.title}
                          >
                            {lesson.title}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {lesson.duration}
                          </p>
                          {/* Progress bar */}
                          {lesson.progress > 0 && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-500">
                                  {Math.round(lesson.progress)}% ko'rilgan
                                </span>
                              </div>
                              <Progress
                                value={lesson.progress}
                                className="h-1.5"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* No next lesson logic as we are displaying all videos */}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
