"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Key, Camera, ShieldCheck, Loader2, Save } from "lucide-react";
import { useSession } from "next-auth/react";
import { useProfileAvatar } from "@/hooks/use-profile-avatar";
import { toast } from "sonner";

export default function JefeProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const email = session?.user?.email || "";
  const fallbackAvatar = session?.user?.image || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces";
  const { avatarUrl: storedAvatar, updateAvatar } = useProfileAvatar(email || undefined);
  const avatarPreview = storedAvatar || fallbackAvatar;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | undefined>(undefined);

  const [formData, setFormData] = useState({
    nombre: session?.user?.name || "",
    telefono: "",
    avatarUrl: "",
  });

  useEffect(() => {
    if (!session?.dbId) return;
    fetch(`/api/proxy/users/${session.dbId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setFormData({
            nombre: `${data.name ?? ""} ${data.lastName ?? ""}`.trim(),
            telefono: data.cellphone || "",
            avatarUrl: data.urlPhoto || "",
          });
          if (data.urlPhoto) updateAvatar(data.urlPhoto);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.dbId]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setLocalPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.dbId) return;
    setSaving(true);
    try {
      let photoUrl = formData.avatarUrl;

      if (avatarFile) {
        const presignRes = await fetch(
          `/api/proxy/storage/upload-url?fileName=${encodeURIComponent("users/profile-photos/" + Date.now() + "-" + avatarFile.name)}&contentType=${encodeURIComponent(avatarFile.type)}`
        );
        if (presignRes.ok) {
          const { uploadUrl, fileUrl } = await presignRes.json();
          const s3Res = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": avatarFile.type },
            body: avatarFile,
          });
          if (s3Res.ok) photoUrl = fileUrl;
        }
      }

      const parts = formData.nombre.trim().split(" ");
      const payload = {
        name: parts[0] || "",
        lastName: parts.slice(1).join(" ") || parts[0] || "",
        cellphone: formData.telefono,
        role: "ROLE_JEFE_SEGURIDAD",
        urlPhoto: photoUrl,
      };

      const res = await fetch(`/api/proxy/users/admin/${session.dbId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (photoUrl) updateAvatar(photoUrl);
        setFormData((prev) => ({ ...prev, avatarUrl: photoUrl }));
        setAvatarFile(null);
        setLocalPreview(undefined);
        toast.success("Perfil actualizado correctamente");
        router.refresh();
      } else {
        toast.error("Error al guardar cambios");
      }
    } catch {
      toast.error("Error crítico al actualizar el perfil");
    } finally {
      setSaving(false);
    }
  };

  const displayAvatar = localPreview || (formData.avatarUrl || avatarPreview);
  const fullName = formData.nombre || session?.user?.name || "Jefe de Seguridad";

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <User className="h-6 w-6 text-amber-500" />
          Mi Perfil
        </h1>
        <p className="text-sm text-muted">Gestiona tu información personal y configuración de seguridad.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Avatar + resumen */}
          <div className="space-y-6">
            <Card className="border-slate-800 bg-surface/30 overflow-hidden text-center">
              <div className="h-24 bg-gradient-to-r from-amber-600 to-amber-400 w-full" />
              <CardContent className="pt-0 relative px-6 pb-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <div className="relative mx-auto -mt-12 h-24 w-24 group">
                  <Avatar
                    src={displayAvatar}
                    alt={fullName}
                    size="xl"
                    className="h-24 w-24 rounded-full border-4 border-slate-950 shadow-lg"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Camera className="h-6 w-6 text-white" />
                    <span className="text-[10px] text-white uppercase font-medium tracking-wide mt-1">Cambiar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1.5 bg-amber-500 rounded-full border-2 border-slate-950 text-white hover:bg-amber-400 transition-colors"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </div>

                <h2 className="mt-4 text-xl font-bold text-white">{fullName}</h2>
                <p className="text-sm text-slate-400">Jefe de Seguridad</p>

                <div className="mt-4 flex justify-center gap-2">
                  <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">SSOMA</Badge>
                  <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Activo</Badge>
                </div>

                <div className="mt-6 space-y-3 text-sm text-slate-300">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <span className="truncate">{email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-slate-500" />
                    <span>{formData.telefono || "Sin teléfono"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-surface/30">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-slate-200">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Nivel de Acceso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-400">
                  {["Monitoreo Cámaras IA", "Revisión de Incidentes", "Gestión de Seguridad"].map((p) => (
                    <li key={p} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {p}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Formulario */}
          <div className="md:col-span-2 space-y-6">
            <Card className="border-slate-800 bg-surface/30">
              <CardHeader>
                <CardTitle>Datos Personales</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                        <User className="h-4 w-4" /> Nombre Completo
                      </label>
                      <Input
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        className="bg-slate-900 border-slate-700"
                        placeholder="Ej. Juan Pérez"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                        <Mail className="h-4 w-4" /> Correo Electrónico
                      </label>
                      <Input
                        value={email}
                        readOnly
                        className="bg-slate-900 border-slate-700 opacity-60 cursor-not-allowed"
                      />
                      <p className="text-[10px] text-muted-foreground italic px-1">El correo no es modificable.</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                        <Phone className="h-4 w-4" /> Teléfono
                      </label>
                      <Input
                        placeholder="+51 987 654 321"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        className="bg-slate-900 border-slate-700"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex justify-end">
                    <Button type="submit" disabled={saving} className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {saving ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-surface/30 opacity-60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-slate-400" />
                  Seguridad de la Cuenta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Contraseña</label>
                  <Input type="password" disabled className="bg-slate-900 border-slate-700 max-w-md" />
                </div>
                <div className="pt-4">
                  <Button variant="outline" disabled className="border-slate-700 text-slate-300 text-xs h-9">
                    Gestionada a través de Keycloak
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
