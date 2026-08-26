"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Landmark } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useThemeStore } from "@/store/theme";
import { useToast } from "@/lib/hooks/useToast";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import type { Token, UserOut } from "@/types/api";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const syncFromUser = useThemeStore((s) => s.syncFromUser);
  const accentColor = useThemeStore((s) => s.accentColor);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      const { data: tokenData } = await api.post<Token>("/auth/login", values);
      const { data: user } = await api.get<UserOut>("/auth/me", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      login(user, tokenData.access_token);
      syncFromUser(user.theme as "light" | "dark", user.accent_color);
      router.push("/");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: getErrorMessage(err, "Email o contraseña incorrectos."),
      });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle persistToBackend={false} />
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-2 items-center text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-1">
            <Landmark className="h-6 w-6" style={{ color: accentColor }} />
          </div>
          <CardTitle className="text-2xl font-bold">Numsa</CardTitle>
          <CardDescription>Inicia sesión en tu cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="tu@email.com" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Regístrate
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
