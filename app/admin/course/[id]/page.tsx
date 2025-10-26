"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUserStore } from "@/store/user.store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  PlusCircle,
  Upload,
  CheckCircle,
  Loader2,
  Trash2,
  Edit,
} from "lucide-react";
import { Course } from "@/types/course";
import { Video } from "@/types/video";
import CourseService from "@/services/course.service";
import VideoService from "@/services/video.service";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

export default function CourseManagePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUserStore();
  const { toast } = useToast();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const [isLessonFormOpen, setIsLessonFormOpen] = useState(false);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");
  const [lessonOrder, setLessonOrder] = useState<number>(1);
  const [lessonVideoFile, setLessonVideoFile] = useState<File | null>(null);
  const [lessonResources, setLessonResources] = useState<FileList | null>(null);
  const [lessonUploading, setLessonUploading] = useState(false);

  const [settings, setSettings] = useState({
    maxVideoSize: 3000,
    allowedVideoFormats: ["mp4", "webm", "avi", "mov"],
  });

  useEffect(() => {
    if (user?.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    fetchCourse();
    fetchSettings();
  }, [user, courseId]);

  const fetchCourse = async () => {
    setLoading(true);
    try {
      const fetchedCourse = await CourseService.findOne(courseId);
      setCourse(fetchedCourse);

      // Load videos
      if (fetchedCourse.videos && Array.isArray(fetchedCourse.videos)) {
        const videoPromises = fetchedCourse.videos.map(async (videoId: any) => {
          try {
            const id =
              typeof videoId === "string"
                ? videoId
                : String(videoId.id || videoId._id);
            const video = await VideoService.findOne(id);
            return video;
          } catch (error) {
            console.error("Error loading video:", error);
            return null;
          }
        });
        const loadedVideos = await Promise.all(videoPromises);
        const validVideos = loadedVideos.filter((v): v is Video => v !== null);
        setVideos(validVideos);
        console.log("Loaded videos:", validVideos);
      } else {
        setVideos([]);
      }
    } catch (error) {
      console.error("Kursni yuklashda xato:", error);
      toast({
        title: "Xatolik!",
        description: "Kursni yuklashda xatolik yuz berdi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setSettings({
          maxVideoSize: data.max_video_size || 3000,
          allowedVideoFormats: data.allowed_video_formats || [
            "mp4",
            "webm",
            "avi",
            "mov",
          ],
        });
      }
    } catch (error) {
      console.error("Sozlamalarni yuklashda xato:", error);
    }
  };

  const handleOpenLessonForm = () => {
    setLessonTitle("");
    setLessonDescription("");
    setLessonOrder(videos.length + 1);
    setLessonVideoFile(null);
    setLessonResources(null);
    setIsLessonFormOpen(true);
  };

  const handleCreateLesson = async () => {
    // Validation: Sarlavha
    if (!lessonTitle.trim()) {
      toast({
        title: "❌ Majburiy maydon",
        description: "Iltimos, dars sarlavhasini kiriting.",
        variant: "destructive",
      });
      return;
    }

    if (lessonTitle.trim().length < 3) {
      toast({
        title: "❌ Noto'g'ri format",
        description:
          "Dars sarlavhasi kamida 3 ta belgidan iborat bo'lishi kerak.",
        variant: "destructive",
      });
      return;
    }

    // Validation: Tavsif
    if (!lessonDescription.trim()) {
      toast({
        title: "❌ Majburiy maydon",
        description: "Iltimos, dars tavsifini kiriting.",
        variant: "destructive",
      });
      return;
    }

    if (lessonDescription.trim().length < 10) {
      toast({
        title: "❌ Noto'g'ri format",
        description:
          "Dars tavsifi kamida 10 ta belgidan iborat bo'lishi kerak.",
        variant: "destructive",
      });
      return;
    }

    // Validation: Video fayl
    if (!lessonVideoFile) {
      toast({
        title: "❌ Majburiy maydon",
        description: "Iltimos, video faylni tanlang.",
        variant: "destructive",
      });
      return;
    }

    // Validation: Video format
    const allowedTypes = settings.allowedVideoFormats.map(
      (format) => `video/${format}`
    );
    if (!allowedTypes.includes(lessonVideoFile.type)) {
      toast({
        title: "❌ Noto'g'ri format",
        description: `Faqat ${settings.allowedVideoFormats
          .map((f) => f.toUpperCase())
          .join(", ")} formatidagi videolar qabul qilinadi.`,
        variant: "destructive",
      });
      return;
    }

    // Validation: Video hajmi
    const maxSize = settings.maxVideoSize * 1024 * 1024;
    if (lessonVideoFile.size > maxSize) {
      toast({
        title: "❌ Fayl juda katta",
        description: `Video hajmi maksimal ${
          settings.maxVideoSize
        }MB bo'lishi kerak. Sizning faylingiz: ${(
          lessonVideoFile.size /
          1024 /
          1024
        ).toFixed(2)}MB`,
        variant: "destructive",
      });
      return;
    }

    // Validation: Tartib raqami
    if (lessonOrder < 1) {
      toast({
        title: "❌ Noto'g'ri qiymat",
        description: "Tartib raqami 1 dan katta bo'lishi kerak.",
        variant: "destructive",
      });
      return;
    }

    setLessonUploading(true);

    try {
      // 1. Video faylni yuklash
      const formData = new FormData();
      formData.append("file", lessonVideoFile);
      formData.append("title", lessonTitle);
      formData.append("description", lessonDescription);

      const videoResponse = await fetch("/api/upload/video", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!videoResponse.ok) {
        const errorText = await videoResponse.text();
        throw new Error(errorText || "Video yuklashda xatolik yuz berdi");
      }

      const uploadedVideo = await videoResponse.json();

      // 2. Kursga video qo'shish
      if (course) {
        const currentVideoIds = course.videos.map((v: any) =>
          typeof v === "string" ? v : String(v.id || v._id)
        );
        const updatedVideos = [...currentVideoIds, String(uploadedVideo.id)];

        const updateResponse = await CourseService.update(courseId, {
          title: course.title,
          description: course.description,
          price: course.price,
          videos: updatedVideos,
        });

        if (!updateResponse) {
          throw new Error("Kursni yangilashda xatolik yuz berdi");
        }
      }

      toast({
        title: "✅ Muvaffaqiyatli!",
        description: `"${lessonTitle}" darsi qo'shildi.`,
      });

      // Yangilash
      await fetchCourse();

      // Dialog yopish va formani tozalash
      setIsLessonFormOpen(false);
      setLessonTitle("");
      setLessonDescription("");
      setLessonVideoFile(null);
      setLessonResources(null);
    } catch (error: any) {
      console.error("Dars qo'shishda xato:", error);

      // Error type bo'yicha to'g'ri xabar ko'rsatish
      let errorMessage = "Dars qo'shishda xatolik yuz berdi.";

      if (error.message.includes("Network")) {
        errorMessage = "Internet aloqasi yo'q. Iltimos, internetni tekshiring.";
      } else if (
        error.message.includes("401") ||
        error.message.includes("Unauthorized")
      ) {
        errorMessage = "Avtorizatsiya xatosi. Iltimos, qayta kiring.";
      } else if (
        error.message.includes("413") ||
        error.message.includes("too large")
      ) {
        errorMessage = "Fayl juda katta. Iltimos, kichikroq fayl tanlang.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "❌ Xatolik!",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLessonUploading(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    // Topilgan videoni olish
    const videoToDelete = videos.find((v) => String(v.id) === videoId);
    const videoTitle = videoToDelete?.title || "Bu dars";

    if (
      !window.confirm(
        `Haqiqatan ham "${videoTitle}" darsini o'chirmoqchimisiz?\n\nBu amal qaytarib bo'lmaydi!`
      )
    ) {
      return;
    }

    try {
      await VideoService.remove(videoId);

      // Kursdan videoni olib tashlash
      if (course) {
        const updatedVideos = course.videos
          .map((v: any) => (typeof v === "string" ? v : String(v.id || v._id)))
          .filter((id: string) => id !== videoId);

        await CourseService.update(courseId, {
          title: course.title,
          description: course.description,
          price: course.price,
          videos: updatedVideos,
        });
      }

      toast({
        title: "✅ Muvaffaqiyatli!",
        description: `"${videoTitle}" darsi o'chirildi.`,
      });

      await fetchCourse();
    } catch (error: any) {
      console.error("Darsni o'chirishda xato:", error);
      toast({
        title: "❌ Xatolik!",
        description: error.message || "Darsni o'chirishda xatolik yuz berdi.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Kurs topilmadi</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/admin")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {course.title} - Darslar
                </h1>
                <p className="text-gray-600">
                  {videos.length} ta dars • {course.price.toLocaleString()} so'm
                </p>
              </div>
            </div>
            <Button
              onClick={handleOpenLessonForm}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Yangi dars qo'shish
            </Button>
          </div>
        </div>

        {/* Content */}
        {videos.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-gray-100 p-6">
                  <svg
                    className="h-16 w-16 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Darslar yo'q
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Bu tarifda hozircha darslar mavjud emas
                  </p>
                  <Button
                    onClick={handleOpenLessonForm}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Birinchi darsni qo'shish
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {videos.map((video, index) => (
              <Card
                key={video.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl font-bold text-gray-400">
                          {index + 1}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {video.title}
                        </h3>
                      </div>
                      <p className="text-gray-600 mb-3">
                        {video.description || "Tavsif yo'q"}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Video ID: {video.id}</span>
                        {video.duration && (
                          <span>
                            Davomiyligi: {Math.floor(video.duration / 60)}{" "}
                            daqiqa
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/watch/${video.filename}`} target="_blank">
                        <Button variant="outline" size="sm">
                          Ko'rish
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteVideo(String(video.id))}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dars qo'shish dialogi */}
      <Dialog open={isLessonFormOpen} onOpenChange={setIsLessonFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yangi dars qo'shish</DialogTitle>
            <DialogDescription>
              Dars ma'lumotlarini to'ldiring
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Sarlavha */}
            <div className="space-y-2">
              <Label htmlFor="lesson-title">
                Sarlavha <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lesson-title"
                placeholder="Masalan: 1-dars. Kirish"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                disabled={lessonUploading}
                className={
                  lessonTitle && lessonTitle.length < 3
                    ? "border-red-300 focus:border-red-500"
                    : ""
                }
              />
              <p className="text-xs text-gray-500">
                {lessonTitle.length} / 100 belgi
                {lessonTitle.length > 0 && lessonTitle.length < 3 && (
                  <span className="text-red-500 ml-2">
                    (kamida 3 ta belgi kerak)
                  </span>
                )}
              </p>
            </div>

            {/* Tavsif */}
            <div className="space-y-2">
              <Label htmlFor="lesson-description">
                Tavsif <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="lesson-description"
                placeholder="Dars haqida batafsil ma'lumot..."
                value={lessonDescription}
                onChange={(e) => setLessonDescription(e.target.value)}
                rows={4}
                disabled={lessonUploading}
                className={
                  lessonDescription && lessonDescription.length < 10
                    ? "border-red-300 focus:border-red-500"
                    : ""
                }
              />
              <p className="text-xs text-gray-500">
                {lessonDescription.length} / 500 belgi
                {lessonDescription.length > 0 &&
                  lessonDescription.length < 10 && (
                    <span className="text-red-500 ml-2">
                      (kamida 10 ta belgi kerak)
                    </span>
                  )}
              </p>
            </div>

            {/* Tartib raqami */}
            <div className="space-y-2">
              <Label htmlFor="lesson-order">Tartib raqami</Label>
              <Input
                id="lesson-order"
                type="number"
                min="1"
                placeholder="1"
                value={lessonOrder}
                onChange={(e) => setLessonOrder(parseInt(e.target.value) || 1)}
                disabled={lessonUploading}
              />
              <p className="text-xs text-gray-500">
                Darsning tartibi (1, 2, 3, ...)
              </p>
            </div>

            {/* Video yuklash */}
            <div className="space-y-2">
              <Label htmlFor="lesson-video">
                Video fayl <span className="text-red-500">*</span>
              </Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  lessonVideoFile
                    ? "border-green-300 bg-green-50"
                    : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                }`}
              >
                <Input
                  id="lesson-video"
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const maxSize = settings.maxVideoSize * 1024 * 1024;

                      if (file.size > maxSize) {
                        toast({
                          title: "❌ Fayl juda katta",
                          description: `Maksimal hajm: ${
                            settings.maxVideoSize
                          }MB. Sizning faylingiz: ${(
                            file.size /
                            1024 /
                            1024
                          ).toFixed(2)}MB`,
                          variant: "destructive",
                        });
                        e.target.value = "";
                        return;
                      }

                      setLessonVideoFile(file);
                    }
                  }}
                  disabled={lessonUploading}
                  className="hidden"
                />
                <label htmlFor="lesson-video" className="cursor-pointer block">
                  {lessonVideoFile ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                          {lessonVideoFile.name}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        Hajm: {(lessonVideoFile.size / 1024 / 1024).toFixed(2)}{" "}
                        MB
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          setLessonVideoFile(null);
                          const input = document.getElementById(
                            "lesson-video"
                          ) as HTMLInputElement;
                          if (input) input.value = "";
                        }}
                        className="mt-2"
                      >
                        O'chirish
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Video faylni tanlang
                      </p>
                      <p className="text-xs text-gray-400">
                        {settings.allowedVideoFormats
                          .map((f) => f.toUpperCase())
                          .join(", ")}{" "}
                        - Maks: {settings.maxVideoSize}MB
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Qo'shimcha resurslar */}
            <div className="space-y-2">
              <Label htmlFor="lesson-resources">
                Qo'shimcha resurslar (ixtiyoriy)
              </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Input
                  id="lesson-resources"
                  type="file"
                  accept=".pdf,.doc,.docx,.zip"
                  multiple
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setLessonResources(e.target.files);
                    }
                  }}
                  disabled={lessonUploading}
                  className="hidden"
                />
                <label
                  htmlFor="lesson-resources"
                  className="cursor-pointer block"
                >
                  {lessonResources && lessonResources.length > 0 ? (
                    <div className="space-y-1">
                      {Array.from(lessonResources).map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        PDF, DOCX, ZIP fayllarni torting yoki tanlang
                      </p>
                      <p className="text-xs text-gray-400">
                        Bir nechta faylni tanlashingiz mumkin
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsLessonFormOpen(false)}
              disabled={lessonUploading}
            >
              Bekor qilish
            </Button>
            <Button
              onClick={handleCreateLesson}
              disabled={lessonUploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {lessonUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Yuklanmoqda...
                </>
              ) : (
                "Saqlash"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
