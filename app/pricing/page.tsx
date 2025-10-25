"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight, LogOut } from "lucide-react";
import Link from "next/link";
import { useUserStore } from "@/store/user.store";

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  features: string[];
  highlighted?: boolean;
}

export default function PricingPage() {
  const { user, clearUser } = useUserStore();
  const [plans, setPlans] = useState<PricingPlan[]>([
    {
      id: "1",
      name: "BAZA",
      price: "1.799.000 UZS",
      features: [
        "STM darslari",
        'Bonus dars "Yoni-steam"',
        "2 oy davomida dars materiallariga kirish",
        "1 to'liq hayz kuzatuvi",
        "Foydalanuvchi Sertifikati (o'rgatish huquqisiz)",
      ],
    },
    {
      id: "2",
      name: "STANDART",
      price: "2.799.000 UZS",
      features: [
        "STM darslari",
        "Ayollik Fiqhi darslari",
        'Bonus dars "Yoni-steam"',
        "3 oy davomida kurs materiallariga kirish",
        "1 to'liq hayz xaritasi kuzatuvi",
        "Foydalanuvchi Sertifikati (o'rgatish huquqisiz)",
      ],
    },
    {
      id: "3",
      name: "OPTIMAL",
      price: "3.799.000 UZS",
      features: [
        "STM darslari",
        "Ayollik Fiqhi darslari",
        'Bonus dars "Yoni-steam"',
        "Juftlar munosabati bo'yicha dars",
        "4 oy davomida kurs materiallariga kirish",
        "1 to'liq hayz xaritasi kuzatuvi",
        "Foydalanuvchi Sertifikati (o'rgatish huquqisiz)",
      ],
      highlighted: true,
    },
    {
      id: "4",
      name: "VIP",
      price: "4.799.000 UZS",
      features: [
        "STM darslari",
        "Ayollik Fiqhi darslari",
        'Bonus dars "Yoni-steam"',
        "Juftlar munosabati bo'yicha dars",
        "Sog'lom Ayollik Sirlari darsi",
        "6 oy davomida kurs materiallariga kirish",
        "3 to'liq hayz xaritasi kuzatuvi",
        "Foydalanuvchi Sertifikati (o'rgatish huquqisiz)",
        "SOVG'A - ko'p martalik prokladka + maxsus termometr",
      ],
    },
  ]);

  const handleLogout = async () => {
    try {
      await fetch("/api/users/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      // Silent error handling
    } finally {
      localStorage.removeItem("auth_token");
      clearUser();
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900">Tariflar</h1>
          </Link>
          <nav className="flex items-center space-x-6">
            {user ? (
              <>
                <span className="text-sm text-gray-600">
                  {user.first_name} {user.last_name}
                </span>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-red-600"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Chiqish
                </Button>
              </>
            ) : (
              <Link href="/auth">
                <Button variant="default">Kirish</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-4 relative z-10">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-red-900 mb-6">
              O'zingizga mos tarifni tanlang
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Har bir tarif sizning ehtiyojlaringizga moslashtirilgan. Sifatli
              ta'lim va qo'llab-quvvatlash kafolatlanadi.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <div key={plan.id} className="h-full">
                <Card
                  className={`${
                    plan.highlighted ? "border-red-500" : "border-gray-200"
                  } h-full flex flex-col`}
                >
                  <CardHeader className="text-center">
                    <CardTitle
                      className={`text-xl ${
                        plan.highlighted ? "text-red-900" : ""
                      }`}
                    >
                      {plan.name}
                    </CardTitle>
                    <div
                      className={`text-2xl font-bold ${
                        plan.highlighted ? "text-red-800" : "text-gray-900"
                      } mb-1`}
                    >
                      {plan.price}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                          <span
                            className={`text-sm ${
                              feature.includes("SOVG'A")
                                ? "font-semibold text-red-600"
                                : ""
                            }`}
                          >
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={
                        user
                          ? `https://t.me/stm_kurs?text=Assalomu alaykum yaxshimisiz. Men ${user.first_name} ${user.last_name} sizning ${plan.name} kursingizni sotib olmoqchiman.`
                          : "/auth"
                      }
                      className="block pt-4"
                    >
                      <Button className="w-full bg-red-800 hover:bg-red-900">
                        Sotib olish
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 relative z-10">
        <div className="container mx-auto text-center">
          <div>
            <h2 className="text-3xl font-bold text-red-900 mb-4">
              Bugun o'z sog'ligingizga sarmoya kiriting!
            </h2>
            <p className="text-xl mb-8 text-gray-600">
              Minglab ayollar allaqachon o'z hayotlarini o'zgartirishdi. Siz ham
              qo'shiling!
            </p>
            <div>
              <Link href="/auth">
                <Button
                  size="lg"
                  className="bg-red-800 hover:bg-red-900 text-lg px-8 py-3"
                >
                  Hoziroq boshlash
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 mt-16 relative z-10">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <h3 className="text-xl font-bold">Platform</h3>
              </div>
              <p className="text-gray-400">
                Ayollar uchun tabiiy va xavfsiz homiladorlik rejalashtirish
                kurslari.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Havolalar</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="/#courses"
                    className="hover:text-white transition-colors"
                  >
                    Kurslar
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#faq"
                    className="hover:text-white transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://t.me/uygunlik_uz"
                    target="_blank"
                    className="hover:text-white transition-colors"
                  >
                    Bog'lanish
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Yordam</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-white transition-colors"
                  >
                    Foydalanish shartlari
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-white transition-colors"
                  >
                    Maxfiylik siyosati
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Aloqa</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="mailto:info@uygunlik.uz"
                    className="hover:text-white transition-colors"
                  >
                    info@uygunlik.uz
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://t.me/uygunlik_uz"
                    target="_blank"
                    className="hover:text-white transition-colors"
                  >
                    Telegram: @uygunlik_uz
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Platform. Barcha huquqlar himoyalangan.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
