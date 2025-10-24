"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user.store";
import { Role, User } from "@/types/user";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Users,
  CreditCard,
  BookOpen,
  Search,
  CheckCircle,
  X,
  Edit,
  Trash2,
  PlusCircle,
  Upload,
  Loader2,
  LogOut,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import CourseService, {
  CreateCourseDto,
  UpdateCourseDto,
} from "@/services/course.service";
import VideoService from "@/services/video.service";
import UserService from "@/services/user.service";
import { Course } from "@/types/course";
import { Video } from "@/types/video";
import { CourseCombobox } from "@/components/ui/course-combobox";
import { useDebounce } from "@/hooks/use-debounce";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";

export default function AdminPage() {
  const { user, clearUser } = useUserStore();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      // Call logout API to clear cookie
      await fetch("/api/users/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear localStorage
      localStorage.removeItem("auth_token");
      // Clear Zustand store
      clearUser();
      // Force redirect to home
      window.location.href = "/";
    }
  };

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [isCourseFormOpen, setIsCourseFormOpen] = useState(false);
  const [isUserCoursesFormOpen, setIsUserCoursesFormOpen] = useState(false);

  // Video yuklash uchun state'lar (tarif dialogida ishlatiladi)
  const [uploadingVideos, setUploadingVideos] = useState<File[]>([]);
  const [videoUploadProgress, setVideoUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  // Form states for Course
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [coursePrice, setCoursePrice] = useState<number>(0);
  const [courseVideos, setCourseVideos] = useState<string[]>([]);

  // User management states
  const [usersSearchTerm, setUsersSearchTerm] = useState("");
  const debouncedUsersSearchTerm = useDebounce(usersSearchTerm, 500);
  const [userCourses, setUserCourses] = useState<string[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersLoading, setUsersLoading] = useState(true);

  // Settings states
  const [settings, setSettings] = useState({
    siteName: "Uygunlik Learning Platform",
    siteDescription: "Professional online learning platform",
    maxVideoSize: 3000,
    allowedVideoFormats: ["mp4", "webm", "avi", "mov"],
    enableRegistration: true,
    maintenanceMode: false,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  useEffect(() => {
    if (user === undefined) {
      setLoading(true);
      return;
    }
    if (user === null) {
      router.push("/auth");
      return;
    }
    if (user?.role !== Role.ADMIN) {
      router.push("/dashboard");
      return;
    }
    Promise.all([fetchCourses(), fetchVideos(), fetchSettings()]).finally(() =>
      setLoading(false)
    );
  }, [user, router]);

  // Check if admin exists, if not redirect to setup
  useEffect(() => {
    const checkAdminExists = async () => {
      try {
        const response = await fetch("/api/users/all", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        });

        if (response.status === 401) {
          // No admin exists, redirect to setup
          router.push("/admin/setup");
        }
      } catch (error) {
        console.error("Check admin error:", error);
        // If error, assume no admin exists
        router.push("/admin/setup");
      }
    };

    if (user?.role !== Role.ADMIN) {
      checkAdminExists();
    }
  }, [user, router]);

  useEffect(() => {
    if (user && user?.role === Role.ADMIN) {
      console.log("Admin user detected, fetching users...");
      fetchUsers();
    }
  }, [user, usersPage, debouncedUsersSearchTerm]);

  const fetchCourses = async () => {
    try {
      const fetchedCourses = await CourseService.findAll();
      console.log("Fetched courses:", fetchedCourses);
      // Ensure videos is always an array and handle edge cases
      const normalizedCourses = fetchedCourses.map((course) => {
        let videos = course.videos;

        // Handle invalid video formats
        if (!Array.isArray(videos)) {
          console.warn(
            `Course ${course.id} has invalid videos format:`,
            videos,
            typeof videos
          );
          videos = [];
        }

        // Handle empty object case {}
        if (
          typeof videos === "object" &&
          !Array.isArray(videos) &&
          Object.keys(videos).length === 0
        ) {
          videos = [];
        }

        return {
          ...course,
          videos: videos,
        };
      });
      console.log("Normalized courses:", normalizedCourses);
      setCourses(normalizedCourses);
    } catch (error) {
      console.error("Kurslarni yuklashda xato:", error);
    }
  };

  const fetchVideos = async () => {
    try {
      const fetchedVideos = await VideoService.findAll();
      setVideos(fetchedVideos);
    } catch (error) {
      console.error("Videolarni yuklashda xato:", error);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      console.log("Fetching users...", { usersPage, debouncedUsersSearchTerm });
      const { data, total } = await UserService.findAll(
        usersPage,
        10,
        debouncedUsersSearchTerm
      );
      console.log("Users fetched:", { data, total });
      setUsers(data);
      setUsersTotalPages(Math.ceil(total / 10));
    } catch (error) {
      console.error("Foydalanuvchilarni yuklashda xato:", error);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const response = await fetch("/api/settings", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setSettings({
          siteName: data.site_name || "Uygunlik Learning Platform",
          siteDescription:
            data.site_description || "Professional online learning platform",
          maxVideoSize: data.max_video_size || 500,
          allowedVideoFormats: data.allowed_video_formats || [
            "mp4",
            "webm",
            "avi",
            "mov",
          ],
          enableRegistration: data.enable_registration !== false,
          maintenanceMode: data.maintenance_mode === true,
        });
      } else {
        console.error(
          "fetchSettings failed",
          response.status,
          await response.text()
        );
      }
    } catch (error) {
      console.error("Sozlamalarni yuklashda xato:", error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSettingsLoading(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_name: settings.siteName,
          site_description: settings.siteDescription,
          max_video_size: settings.maxVideoSize,
          allowed_video_formats: settings.allowedVideoFormats,
          enable_registration: settings.enableRegistration,
          maintenance_mode: settings.maintenanceMode,
        }),
      });

      if (response.ok) {
        toast({
          title: "Muvaffaqiyat!",
          description: "Sozlamalar saqlandi.",
        });
      } else {
        console.error(
          "handleSaveSettings failed",
          response.status,
          await response.text()
        );
        throw new Error("Sozlamalarni saqlashda xatolik");
      }
    } catch (error) {
      console.error("Sozlamalarni saqlashda xato:", error);
      toast({
        title: "Xatolik",
        description: "Sozlamalarni saqlashda xatolik yuz berdi.",
        variant: "destructive",
      });
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveCourse = async () => {
    // Validation
    if (!courseTitle.trim()) {
      toast({
        title: "Xatolik!",
        description: "Kurs sarlavhasini kiriting.",
        variant: "destructive",
      });
      return;
    }

    if (!coursePrice || coursePrice <= 0) {
      toast({
        title: "Xatolik!",
        description: "Kurs narxini to'g'ri kiriting.",
        variant: "destructive",
      });
      return;
    }

    const courseData = {
      title: courseTitle,
      description: courseDescription,
      price: coursePrice,
      videos: courseVideos, // Array of video IDs as strings
    };

    console.log("Saving course data:", courseData);
    console.log("courseVideos:", courseVideos);

    try {
      let result;
      if (selectedCourse) {
        result = await CourseService.update(
          String(selectedCourse.id),
          courseData
        );
        toast({
          title: "Muvaffaqiyatli!",
          description: "Kurs muvaffaqiyatli yangilandi.",
        });
      } else {
        result = await CourseService.create(courseData);
        toast({
          title: "Muvaffaqiyatli!",
          description: "Kurs muvaffaqiyatli yaratildi.",
        });
      }
      console.log("Course saved successfully:", result);
      await fetchCourses();
      setIsCourseFormOpen(false);
      resetCourseForm();
    } catch (error: any) {
      console.error("Kursni saqlashda xato:", error);
      console.error("Error details:", error.response?.data || error.message);
      toast({
        title: "Xatolik!",
        description:
          error.response?.data?.error ||
          error.message ||
          "Kursni saqlashda xatolik yuz berdi.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (window.confirm("Haqiqatan ham bu kursni o'chirmoqchimisiz?")) {
      try {
        await CourseService.remove(id);
        fetchCourses();
      } catch (error) {
        console.error("Kursni o'chirishda xato:", error);
      }
    }
  };

  const handleOpenCourseForm = (course: Course | null) => {
    if (course) {
      console.log("Opening course form with course:", course);
      setSelectedCourse(course);
      setCourseTitle(course.title);
      setCourseDescription(course.description || "");
      setCoursePrice(course.price);
      // Handle both string IDs and video objects
      const videoIds = course.videos.map((v) => {
        if (typeof v === "string") return v;
        // Try _id first (MongoDB), then id (PostgreSQL)
        return String(v._id || v.id);
      });
      console.log("Extracted video IDs:", videoIds);
      console.log(
        "Available videos:",
        videos.map((v) => ({ id: v.id, title: v.title }))
      );
      setCourseVideos(videoIds);
    } else {
      resetCourseForm();
    }
    setIsCourseFormOpen(true);
  };

  const resetCourseForm = () => {
    setSelectedCourse(null);
    setCourseTitle("");
    setCourseDescription("");
    setCoursePrice(0);
    setCourseVideos([]);
  };

  const handleRemoveVideoFromForm = (videoId: string) => {
    setCourseVideos((prev) => prev.filter((id) => id !== videoId));
  };

  // Video yuklash funksiyasi
  const handleUploadVideos = async (files: File[]) => {
    const validFiles: File[] = [];
    const maxSize = settings.maxVideoSize * 1024 * 1024; // Settings'dan olish
    const allowedTypes = settings.allowedVideoFormats.map(
      (format) => `video/${format}`
    );

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Xatolik!",
          description: `${
            file.name
          } - Faqat video fayllar (${settings.allowedVideoFormats
            .join(", ")
            .toUpperCase()}) qabul qilinadi.`,
          variant: "destructive",
        });
        continue;
      }

      if (file.size > maxSize) {
        toast({
          title: "Xatolik!",
          description: `${file.name} - Fayl juda katta. Maksimal hajm: ${settings.maxVideoSize}MB.`,
          variant: "destructive",
        });
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setUploadingVideos(validFiles);

    for (const file of validFiles) {
      try {
        setVideoUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", file.name.replace(/\.[^/.]+$/, "")); // Fayl nomini sarlavha qilish
        formData.append("description", "");

        const response = await fetch("/api/upload/video", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const uploadedVideo = await response.json();

        setVideoUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));

        // Yuklangan videoni avtomatik qo'shish
        setCourseVideos((prev) => [...prev, String(uploadedVideo.id)]);

        toast({
          title: "Muvaffaqiyatli!",
          description: `${file.name} yuklandi.`,
        });

        // Videolar ro'yxatini yangilash
        await fetchVideos();
      } catch (error: any) {
        console.error(`${file.name} yuklashda xato:`, error);
        toast({
          title: "Xatolik!",
          description: `${file.name} yuklashda xatolik: ${error.message}`,
          variant: "destructive",
        });
      }
    }

    // Tozalash - file input'ni ham tozalash
    setTimeout(() => {
      setUploadingVideos([]);
      setVideoUploadProgress({});
      setSelectedFiles(null); // File input tozalash
      // Input element'ni topib, value'ni reset qilish
      const fileInput = document.querySelector(
        'input[type="file"][accept="video/*"]'
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    }, 2000);
  };

  const [isUploading, setIsUploading] = useState(false);

  // Videoni kurs formidan o'chirish
  const handleRemoveVideoFromCourse = async (videoId: string) => {
    if (
      window.confirm(
        "Siz rostdan ham bu videoni o'chirmoqchimisiz? Bu video butunlay o'chiriladi!"
      )
    ) {
      try {
        await VideoService.remove(videoId);

        // Videoni formdan olib tashlash
        setCourseVideos((prev) => prev.filter((id) => id !== videoId));

        // Videolar ro'yxatini yangilash
        await fetchVideos();

        toast({
          title: "Muvaffaqiyatli!",
          description: "Video o'chirildi.",
        });
      } catch (error) {
        console.error("Videoni o'chirishda xato:", error);
        toast({
          title: "Xatolik!",
          description: "Videoni o'chirishda xatolik yuz berdi.",
          variant: "destructive",
        });
      }
    }
  };

  const [coursesToAddToUser, setCoursesToAddToUser] = useState<string[]>([]);

  const handleEditUserCoursesClick = (user: User) => {
    setSelectedUser(user);
    const currentUserCourseIds =
      user?.courses?.map((course) => String(course.id)) || [];
    setUserCourses(currentUserCourseIds);
    setIsUserCoursesFormOpen(true);
  };

  const handleUpdateUserCourses = async () => {
    if (!selectedUser) return;
    try {
      await UserService.updateUserCourses(
        String(selectedUser?.id),
        userCourses
      );
      toast({
        title: "Muvaffaqiyatli!",
        description: `${selectedUser?.first_name}ning kurslari muvaffaqiyatli yangilandi.`,
      });
      setIsUserCoursesFormOpen(false);
      setSelectedUser(null);
      setUserCourses([]);
      fetchUsers();
    } catch (error) {
      console.error("Foydalanuvchi kurslarini yangilashda xato:", error);
      toast({
        title: "Xatolik!",
        description: "Foydalanuvchi kurslarini yangilashda xatolik yuz berdi.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUserStatus = async (userId: string, status: boolean) => {
    try {
      await UserService.updateUserStatus(userId, status);
      toast({
        title: "Muvaffaqiyatli!",
        description: `Foydalanuvchi statusi ${
          status ? "faol" : "nofaol"
        } qilindi.`,
      });
      fetchUsers();
    } catch (error) {
      console.error("Foydalanuvchi statusini yangilashda xato:", error);
      toast({
        title: "Xatolik!",
        description: "Foydalanuvchi statusini yangilashda xatolik yuz berdi.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      await UserService.updateUserRole(userId, newRole);
      toast({
        title: "Muvaffaqiyatli!",
        description: `Foydalanuvchi roli ${
          newRole === "admin" ? "Admin" : "User"
        } ga o'zgartirildi.`,
      });
      fetchUsers();
    } catch (error) {
      console.error("Foydalanuvchi rolini yangilashda xato:", error);
      toast({
        title: "Xatolik!",
        description: "Foydalanuvchi rolini yangilashda xatolik yuz berdi.",
        variant: "destructive",
      });
    }
  };

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.status === true).length,
    pendingPayments: 0,
    totalRevenue: "0 so'm",
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
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
      <header className="bg-white border-b relative z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Administrator
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Chiqish
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">
            Foydalanuvchilar, to'lovlar va tariflarni boshqaring
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Jami foydalanuvchilar</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalUsers}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Faol foydalanuvchilar</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.activeUsers}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Kutilayotgan to'lovlar
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.pendingPayments}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Jami daromad</p>
                  <p className="text-lg font-bold text-gray-900">
                    {stats.totalRevenue}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="courses">
          <TabsList className="mb-6">
            <TabsTrigger value="payments">To'lovlar</TabsTrigger>
            <TabsTrigger value="users">Foydalanuvchilar</TabsTrigger>
            <TabsTrigger value="courses">Tariflar</TabsTrigger>
            <TabsTrigger value="settings">Sozlamalar</TabsTrigger>
          </TabsList>

          <TabsContent value="payments">
            {/* ... Payments Tab ... */}
          </TabsContent>
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Foydalanuvchilarni boshqarish</CardTitle>
                <CardDescription>
                  Foydalanuvchilarni qidiring, ko'ring va ularning tariflarini
                  boshqaring.
                </CardDescription>
                <div className="pt-4">
                  <Input
                    placeholder="Foydalanuvchilarni ism yoki email bo'yicha qidirish..."
                    value={usersSearchTerm}
                    onChange={(e) => setUsersSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <p>Foydalanuvchilar yuklanmoqda...</p>
                ) : users.length === 0 ? (
                  <p>Foydalanuvchilar topilmadi.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ism</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Roli</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Harakatlar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user?.id}>
                          <TableCell className="font-medium">
                            {user?.first_name}
                          </TableCell>
                          <TableCell>{user?.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                user?.role === Role.ADMIN
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {user?.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={user?.status ? "default" : "outline"}
                              >
                                {user?.status ? "Faol" : "Nofaol"}
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                className={
                                  user?.status
                                    ? "text-red-600 border-red-200 hover:bg-red-50"
                                    : "text-green-600 border-green-200 hover:bg-green-50"
                                }
                                onClick={() =>
                                  handleUpdateUserStatus(
                                    String(user?.id),
                                    !user?.status
                                  )
                                }
                              >
                                {user?.status ? "Nofaol qilish" : "Faol qilish"}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditUserCoursesClick(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {user?.role !== "admin" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                  onClick={() =>
                                    handleUpdateUserRole(
                                      String(user?.id),
                                      "admin"
                                    )
                                  }
                                >
                                  Admin qilish
                                </Button>
                              )}
                              {user?.role === "admin" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-gray-600 border-gray-200 hover:bg-gray-50"
                                  onClick={() =>
                                    handleUpdateUserRole(
                                      String(user?.id),
                                      "user"
                                    )
                                  }
                                >
                                  User qilish
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                <div className="flex items-center justify-end space-x-2 py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                    disabled={usersPage === 1}
                  >
                    Oldingisi
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUsersPage((p) => p + 1)}
                    disabled={usersPage === usersTotalPages}
                  >
                    Keyingisi
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Tariflar boshqaruvi</CardTitle>
                  <Button
                    onClick={() => handleOpenCourseForm(null)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Yangi tarif
                  </Button>
                </div>
                <CardDescription>
                  Tarif materiallarini va darslarni boshqaring
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Tariflar yuklanmoqda...</p>
                ) : courses.length === 0 ? (
                  <p>Hozircha tariflar mavjud emas.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sarlavha</TableHead>
                        <TableHead>Narxi</TableHead>
                        <TableHead>Darslar soni</TableHead>
                        <TableHead className="text-right">Harakatlar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">
                            {course.title}
                          </TableCell>
                          <TableCell>
                            {course.price.toLocaleString()} so'm
                          </TableCell>
                          <TableCell>
                            {Array.isArray(course.videos)
                              ? course.videos.length
                              : 0}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="mr-2"
                              onClick={() => handleOpenCourseForm(course)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                              onClick={() =>
                                handleDeleteCourse(String(course.id))
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Tizim sozlamalari</CardTitle>
                <CardDescription>
                  Platforma sozlamalarini boshqaring
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settingsLoading ? (
                  <p>Sozlamalar yuklanmoqda...</p>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="siteName">Sayt nomi</Label>
                        <Input
                          id="siteName"
                          value={settings.siteName}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              siteName: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="siteDescription">Sayt tavsifi</Label>
                        <Input
                          id="siteDescription"
                          value={settings.siteDescription}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              siteDescription: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="maxVideoSize">
                          Maksimal video hajmi (MB)
                        </Label>
                        <Input
                          id="maxVideoSize"
                          type="number"
                          value={
                            settings.maxVideoSize === 0
                              ? ""
                              : settings.maxVideoSize
                          }
                          onChange={(e) => {
                            const value =
                              e.target.value === ""
                                ? 0
                                : parseInt(e.target.value);
                            setSettings({
                              ...settings,
                              maxVideoSize: isNaN(value) ? 0 : value,
                            });
                          }}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="allowedFormats">
                          Ruxsat etilgan video formatlar (vergul bilan ajrating)
                        </Label>
                        <Input
                          id="allowedFormats"
                          value={settings.allowedVideoFormats.join(", ")}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              allowedVideoFormats: e.target.value
                                .split(",")
                                .map((s) => s.trim()),
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="enableRegistration"
                          checked={settings.enableRegistration}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              enableRegistration: e.target.checked,
                            })
                          }
                          className="h-4 w-4"
                        />
                        <Label htmlFor="enableRegistration">
                          Ro'yxatdan o'tishni yoqish
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="maintenanceMode"
                          checked={settings.maintenanceMode}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              maintenanceMode: e.target.checked,
                            })
                          }
                          className="h-4 w-4"
                        />
                        <Label htmlFor="maintenanceMode">
                          Texnik ta'mirlash rejimi
                        </Label>
                      </div>
                    </div>

                    <Button
                      onClick={handleSaveSettings}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={settingsLoading}
                    >
                      {settingsLoading
                        ? "Saqlanmoqda..."
                        : "Sozlamalarni saqlash"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Unified Course Create/Edit Dialog */}
      <Dialog open={isCourseFormOpen} onOpenChange={setIsCourseFormOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {selectedCourse ? "Tarifni tahrirlash" : "Yangi tarif yaratish"}
            </DialogTitle>
            <DialogDescription>
              {selectedCourse
                ? "Tarif ma'lumotlarini va unga biriktirilgan videolarni boshqaring."
                : "Yangi tarif uchun ma'lumotlarni kiriting."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-6">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Sarlavha
                </Label>
                <Input
                  id="title"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Tavsif
                </Label>
                <Textarea
                  id="description"
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">
                  Narxi
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={coursePrice}
                  onChange={(e) => setCoursePrice(parseFloat(e.target.value))}
                  className="col-span-3"
                />
              </div>
            </div>

            <Separator className="my-6" />

            <div>
              <h3 className="text-lg font-medium mb-4">Kurs Videolari</h3>
              <div className="rounded-md border mb-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sarlavha</TableHead>
                      <TableHead className="text-right">Harakat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courseVideos.length > 0 ? (
                      courseVideos.map((videoId) => {
                        // Find video by matching both string and number IDs
                        const video = videos.find(
                          (v) =>
                            String(v.id) === String(videoId) ||
                            v.id === parseInt(String(videoId))
                        );
                        if (!video) {
                          console.warn(`Video not found for ID: ${videoId}`, {
                            videoId,
                            availableVideos: videos.map((v) => ({
                              id: v.id,
                              title: v.title,
                            })),
                          });
                          return null;
                        }
                        return (
                          <TableRow key={videoId}>
                            <TableCell className="font-medium">
                              <Link
                                href={`/watch/${video.url.split("/").pop()}`}
                                className="hover:underline"
                                target="_blank"
                              >
                                {video.title}
                              </Link>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                                onClick={() =>
                                  handleRemoveVideoFromCourse(videoId)
                                }
                                title="Videoni butunlay o'chirish"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center">
                          Bu kursga hali video qo'shilmagan.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <Separator className="my-4" />

              <div>
                <h4 className="font-medium mb-3 text-gray-700">
                  📤 Video yuklash
                </h4>
                <div className="space-y-4">
                  {/* Upload Area */}
                  <div className="relative border-2 border-dashed border-red-300 hover:border-red-400 rounded-lg p-8 transition-colors bg-gradient-to-br from-red-50 to-white">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Upload className="h-12 w-12 text-red-600" />
                      <div className="text-center">
                        <label
                          htmlFor="video-upload"
                          className="cursor-pointer text-red-600 hover:text-red-700 font-medium"
                        >
                          Videolarni tanlang
                        </label>
                        <p className="text-sm text-gray-500 mt-1">
                          yoki fayllarni bu yerga sudrab keling
                        </p>
                      </div>
                      <Input
                        id="video-upload"
                        type="file"
                        accept="video/*"
                        multiple
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleUploadVideos(Array.from(e.target.files));
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {settings.allowedVideoFormats
                          .map((f) => f.toUpperCase())
                          .join(", ")}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Maksimal: {settings.maxVideoSize}MB
                      </span>
                    </div>
                  </div>

                  {/* Yuklash progressi */}
                  {uploadingVideos.length > 0 && (
                    <div className="space-y-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-blue-900 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Yuklanayotgan videolar ({uploadingVideos.length})
                      </h5>
                      <div className="space-y-2">
                        {uploadingVideos.map((file) => (
                          <div
                            key={file.name}
                            className="flex items-center gap-3 bg-white rounded-md p-3 shadow-sm"
                          >
                            <div className="flex-shrink-0">
                              {videoUploadProgress[file.name] === 100 ? (
                                <div className="bg-green-100 rounded-full p-1">
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                </div>
                              ) : (
                                <div className="bg-blue-100 rounded-full p-1">
                                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                </div>
                              )}
                            </div>
                            <div className="flex-grow min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {file.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                {videoUploadProgress[file.name] === 100 && (
                                  <span className="ml-2 text-green-600">
                                    ✓ Yuklandi
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t mt-4">
            <Button
              onClick={handleSaveCourse}
              className="bg-red-600 hover:bg-red-700"
            >
              {selectedCourse ? "O'zgarishlarni saqlash" : "Kursni yaratish"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Courses Dialog */}
      <Dialog
        open={isUserCoursesFormOpen}
        onOpenChange={setIsUserCoursesFormOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Foydalanuvchi tariflarini tahrirlash</DialogTitle>
            <DialogDescription>
              {selectedUser?.first_name} {selectedUser?.last_name} uchun
              tariflarni qo'shing yoki olib tashlang.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-6">
            <h3 className="text-lg font-medium mb-4">Mavjud tariflar</h3>
            <div className="rounded-md border mb-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kurs nomi</TableHead>
                    <TableHead className="text-right">Harakat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userCourses.length > 0 ? (
                    userCourses.map((courseId) => {
                      const course = courses.find(
                        (c) => String(c.id) === courseId
                      );
                      if (!course) return null;
                      return (
                        <TableRow key={courseId}>
                          <TableCell className="font-medium">
                            {course.title}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                              onClick={() =>
                                setUserCourses(
                                  userCourses.filter((id) => id !== courseId)
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center">
                        Foydalanuvchida tariflar mavjud emas.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <h4 className="font-medium mb-2">Yangi tarif qo'shish</h4>
            <div className="flex items-center space-x-2">
              <div className="flex-grow">
                <CourseCombobox
                  courses={courses.filter(
                    (course) => !userCourses.includes(String(course.id))
                  )}
                  selectedCourses={coursesToAddToUser}
                  onChange={setCoursesToAddToUser}
                />
              </div>
              <Button
                onClick={() => {
                  setUserCourses([
                    ...new Set([...userCourses, ...coursesToAddToUser]),
                  ]);
                  setCoursesToAddToUser([]);
                }}
                disabled={coursesToAddToUser?.length === 0}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Qo'shish
              </Button>
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t mt-4">
            <Button
              onClick={handleUpdateUserCourses}
              className="bg-red-600 hover:bg-red-700"
            >
              Saqlash
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
