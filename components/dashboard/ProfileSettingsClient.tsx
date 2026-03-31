"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";
import { toast } from "sonner";

import { updateProfile, type UpdateProfileResult } from "@/app/actions/profile";
import UserAvatar from "@/components/dashboard/UserAvatar";
import { profilePhotoSrc } from "@/lib/profile-photo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ProfileSettingsProps = {
  user: {
    name: string | null;
    email: string | null;
    role: Role;
    image: string | null;
  };
};

export default function ProfileSettingsClient({ user }: ProfileSettingsProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<UpdateProfileResult | null, FormData>(
    updateProfile,
    null,
  );
  const [name, setName] = useState(user.name ?? "");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [removedPhoto, setRemovedPhoto] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success("Profile updated.");
      router.refresh();
    } else {
      toast.error(state.error);
    }
  }, [state, router]);

  useEffect(() => {
    return () => {
      if (filePreview?.startsWith("blob:")) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRemovedPhoto(false);
    if (filePreview?.startsWith("blob:")) URL.revokeObjectURL(filePreview);
    setFilePreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    if (fileRef.current) fileRef.current.value = "";
    if (filePreview?.startsWith("blob:")) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
    setRemovedPhoto(true);
  };

  const displayImage =
    filePreview ??
    (!removedPhoto ? profilePhotoSrc(user.image) ?? null : null);

  return (
    <form action={formAction} className="space-y-8 max-w-3xl">
      <input type="hidden" name="removeAvatar" value={removedPhoto && !filePreview ? "1" : "0"} />

      <section className="grid gap-8 md:grid-cols-[auto,1fr] items-start">
        <div className="space-y-4">
          <div className="relative inline-block">
            <UserAvatar
              image={displayImage}
              name={name || user.name}
              email={user.email}
              size="lg"
              className="size-20 ring-4 ring-blue-500/30 shadow-xl text-lg"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-lg bg-blue-600 text-white px-3 py-1.5 text-xs font-semibold shadow-md uppercase tracking-wider"
              >
                Upload photo
              </button>
              {(displayImage || (!removedPhoto && user.image?.trim())) && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="rounded-lg border border-slate-300 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 uppercase tracking-wider"
                >
                  Use initials
                </button>
              )}
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            name="avatarFile"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <p className="text-xs text-slate-500 max-w-xs">
            Your initials are shown until you upload a square photo (recommended 128×128, max 512KB).
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
              Display Name
            </label>
            <Input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="h-10 rounded-lg border-slate-200 bg-white/60"
              disabled={pending}
              required
            />
          </div>

          <div className="grid gap-3 text-sm text-slate-500">
            <div>
              <span className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                Email
              </span>
              <p className="mt-1 text-sm font-medium text-slate-800">{user.email}</p>
            </div>
            <div>
              <span className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                Role
              </span>
              <p className="mt-1 inline-flex items-center gap-2 text-xs font-black tracking-[0.2em] uppercase text-blue-500 bg-blue-500/10 border border-blue-500/30 rounded-full px-3 py-1">
                {user.role}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/70 mt-4">
        <Button
          type="submit"
          disabled={pending}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 shadow-lg text-sm font-semibold tracking-wide"
        >
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
