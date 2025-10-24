"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function AdminSetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Xatolik",
        description: "Parollar mos kelmaydi",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 4) {
      toast({
        title: "Xatolik", 
        description: "Parol kamida 4 ta belgidan iborat bo'lishi kerak",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/create-first-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save token and redirect
        localStorage.setItem('auth_token', data.token);
        toast({
          title: "Muvaffaqiyatli!",
          description: "Birinchi admin yaratildi va tizimga kirdingiz",
        });
        router.push('/admin');
      } else {
        toast({
          title: "Xatolik",
          description: data.error || "Admin yaratishda xatolik yuz berdi",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Admin creation error:', error);
      toast({
        title: "Xatolik",
        description: "Server bilan bog'lanishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
            minHeight: '100vh',
            transform: 'scale(1.2)',
            transformOrigin: 'center',
            maxHeight: '100vh'
          }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Admin Panel Sozlash
            </CardTitle>
            <CardDescription>
              Birinchi admin foydalanuvchini yarating
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Bu sahifa faqat bir marta ishlatiladi. Admin yaratilgandan keyin bu sahifa o'chiriladi.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Ism</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                    placeholder="Admin ismi"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Familiya</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                    placeholder="Admin familiyasi"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="admin@uygunlik.uz"
                />
              </div>

              <div>
                <Label htmlFor="password">Parol</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="Kuchli parol kiriting"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Parolni tasdiqlang</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  placeholder="Parolni qayta kiriting"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={loading}
              >
                {loading ? "Yaratilmoqda..." : "Admin Yaratish"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Admin yaratilgandan keyin{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto text-red-600"
                  onClick={() => router.push('/auth')}
                >
                  kirish sahifasiga
                </Button>{" "}
                o'ting
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
