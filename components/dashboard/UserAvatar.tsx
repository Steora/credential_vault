import { getUserInitials } from "@/lib/user-initials";
import { profilePhotoSrc } from "@/lib/profile-photo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  image: string | null | undefined;
  name: string | null | undefined;
  email: string | null | undefined;
  className?: string;
  fallbackClassName?: string;
  size?: "default" | "sm" | "lg";
};

export default function UserAvatar({
  image,
  name,
  email,
  className,
  fallbackClassName,
  size = "default",
}: UserAvatarProps) {
  const initials = getUserInitials(name, email);
  const src = profilePhotoSrc(image);
  const isRemote =
    !!src &&
    (src.startsWith("https://") || src.startsWith("http://"));

  return (
    <Avatar size={size} className={cn("bg-slate-800", className)}>
      {src ? (
        <AvatarImage
          src={src}
          alt={name ?? email ?? "User"}
          {...(isRemote ? { referrerPolicy: "no-referrer" as const } : {})}
        />
      ) : null}
      <AvatarFallback
        className={cn(
          "font-bold text-white bg-gradient-to-br from-blue-600 to-slate-700",
          fallbackClassName,
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
