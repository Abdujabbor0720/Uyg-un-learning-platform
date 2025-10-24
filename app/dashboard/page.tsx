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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, PlayCircle, LogOut } from "lucide-react";
import Link from "next/link";
import UserService from "@/services/user.service";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const profileFormSchema = z.object({
  first_name: z
    .string()
    .min(2, { message: "Ism kamida 2 harfdan iborat bo'lishi kerak." }),
  last_name: z
    .string()
    .min(2, { message: "Familiya kamida 2 harfdan iborat bo'lishi kerak." }),
  email: z.string().email({ message: "Noto'g'ri email format." }),
  password: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function DashboardPage() {
  const { user, setUser, clearUser } = useUserStore();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [courseProgress, setCourseProgress] = useState<Record<number, number>>(
    {}
  );

  // Kurs progressini hisoblash funksiyasi
  const calculateCourseProgress = async () => {
    console.log("=== calculateCourseProgress START ===");
    console.log("User:", user);
    console.log("User courses:", user?.courses);

    if (!user?.courses || user.courses.length === 0) {
      console.log("No courses found, returning");
      return;
    }

    const progressMap: Record<number, number> = {};

    for (const course of user.courses) {
      console.log(`Processing course ${course.id}:`, course.title);
      console.log("Course videos:", course.videos);

      if (!course.videos || course.videos.length === 0) {
        console.log(`Course ${course.id} has no videos`);
        progressMap[course.id] = 0;
        continue;
      }

      try {
        // Bu kursdagi barcha video ID larini olish (faqat to'g'ri ID larni)
        const videoIds = course.videos
          .map((v: any) => v.id)
          .filter((id: any) => id !== undefined && id !== null && !isNaN(id))
          .join(",");

        console.log(`Course ${course.id} videoIds:`, videoIds);

        // Agar hech qanday to'g'ri ID bo'lmasa
        if (!videoIds || videoIds.length === 0) {
          console.log(`Course ${course.id} has no valid video IDs`);
          progressMap[course.id] = 0;
          continue;
        }

        // Video progress ma'lumotlarini olish
        const response = await fetch(
          `/api/video-progress?videoIds=${videoIds}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
          }
        );

        console.log(`API response for course ${course.id}:`, response.status);

        if (!response.ok) {
          console.log(`API failed for course ${course.id}`);
          progressMap[course.id] = 0;
          continue;
        }

        const progressData = await response.json();
        console.log(`Progress data for course ${course.id}:`, progressData);

        // Tugallangan videolarni sanash
        const completedVideos = progressData.filter(
          (p: any) => p.completed
        ).length;
        const totalVideos = course.videos.length;

        // Foizni hisoblash
        const percentage =
          totalVideos > 0
            ? Math.round((completedVideos / totalVideos) * 100)
            : 0;

        console.log(
          `Course ${course.id}: ${completedVideos}/${totalVideos} = ${percentage}%`
        );
        progressMap[course.id] = percentage;
      } catch (error) {
        console.error(`Error for course ${course.id}:`, error);
        progressMap[course.id] = 0;
      }
    }

    console.log("Final progressMap:", progressMap);
    setCourseProgress(progressMap);
    console.log("=== calculateCourseProgress END ===");
  };

  useEffect(() => {
    if (user?.courses && user.courses.length > 0) {
      calculateCourseProgress();
    }
  }, [user]);

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

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (user === undefined) {
      setLoading(true);
      return;
    }
    if (user === null) {
      router.push("/auth");
      return;
    }
    if (user.role === Role.ADMIN) {
      router.push("/admin");
      return;
    }

    if (user) {
      form.reset({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
      });
    }

    setLoading(false);
  }, [user, router, form]);

  async function onSubmit(values: ProfileFormValues) {
    try {
      const updateData: Partial<ProfileFormValues> = { ...values };
      if (!updateData.password || updateData.password === "") {
        delete updateData.password;
      }

      const updatedUser = await UserService.updateProfile(updateData);
      setUser(updatedUser);
      toast({
        title: "Muvaffaqiyatli!",
        description: "Ma'lumotlaringiz yangilandi.",
      });
      form.reset({ ...form.getValues(), password: "" });
    } catch (error) {
      toast({
        title: "Xatolik!",
        description: "Ma'lumotlarni yangilashda xatolik yuz berdi.",
        variant: "destructive",
      });
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-700">Ma'lumotlar yuklanmoqda...</p>
      </div>
    );
  }

  const userInfo = {
    name: `${user.first_name} ${user.last_name}`,
    plan: "Optimal",
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
          <Link href="/" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          </Link>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              {userInfo.plan} tarif
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Xush kelibsiz, {userInfo.name}!
          </h1>
          <p className="text-gray-600">
            Kurslaringizni davom ettiring va yangi bilimlar oling
          </p>
        </div>

        <Tabs defaultValue="courses">
          <TabsList className="mb-6">
            <TabsTrigger value="courses">Kurslarim</TabsTrigger>
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="payments">To'lovlar</TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            {user.courses && user.courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {user.courses.map((course) => {
                  const progress = courseProgress[course.id] || 0;
                  const totalVideos = course.videos?.length || 0;

                  return (
                    <Card key={course.id} className="flex flex-col">
                      <CardHeader>
                        <CardTitle className="text-xl">
                          {course.title}
                        </CardTitle>
                        <CardDescription className="h-10 overflow-hidden">
                          {course.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <div className="space-y-2">
                          <Progress value={progress} className="w-full" />
                          <p className="text-sm text-gray-600">
                            {progress}% tugallandi ({totalVideos} ta dars)
                          </p>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Link href={`/course/${course.id}`} className="w-full">
                          <Button className="w-full bg-red-600 hover:bg-red-700">
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Davom ettirish
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  Sizda hali kurslar mavjud emas
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Yangi bilimlar olish uchun kurslarimizni ko'rib chiqing.
                </p>
                <div className="mt-6">
                  <Button asChild className="bg-red-600 hover:bg-red-700">
                    <Link href="/pricing">Kurslarni ko'rish</Link>
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Shaxsiy ma'lumotlar</CardTitle>
                <CardDescription>
                  Hisobingiz va shaxsiy ma'lumotlaringizni boshqaring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ism</FormLabel>
                            <FormControl>
                              <Input placeholder="Ismingiz" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="last_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Familiya</FormLabel>
                            <FormControl>
                              <Input placeholder="Familiyangiz" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Emailingiz"
                                {...field}
                                type="email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Yangi parol (ixtiyoriy)</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                                autoComplete="new-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="bg-red-600 hover:bg-red-700"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting
                        ? "Saqlanmoqda..."
                        : "Saqlash"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>To'lov tarixi</CardTitle>
                <CardDescription>
                  Barcha to'lovlaringiz va hisob-kitoblar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    To'lovlar tarixi bo'sh
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Siz hali hech qanday to'lov qilmagansiz.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
