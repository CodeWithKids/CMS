import { useAuth } from "@/context/AuthContext";
import { PRESET_AVATARS, getPresetAvatar } from "@/data/presetAvatars";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function StudentProfilePage() {
  const { currentUser, updateUser } = useAuth();
  const { toast } = useToast();
  const currentAvatar = currentUser?.avatarId ? getPresetAvatar(currentUser.avatarId) : null;

  if (!currentUser || currentUser.role !== "student") {
    return (
      <div className="page-container">
        <p className="text-muted-foreground">This page is for students only.</p>
      </div>
    );
  }

  const handleSelectAvatar = (avatarId: string) => {
    updateUser({ avatarId });
    toast({
      title: "Avatar updated",
      description: "Your profile avatar has been saved.",
    });
  };

  return (
    <div className="page-container">
      <h1 className="page-title flex items-center gap-2">
        <User className="w-7 h-7" /> My profile
      </h1>
      <p className="page-subtitle">
        Choose a preset avatar for your profile. Only approved avatars are allowed (no photo uploads).
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Current profile</CardTitle>
          <CardDescription>Your name and selected avatar</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
            {currentAvatar ? (
              <img
                src={currentAvatar.imageUrl}
                alt={currentAvatar.description}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-medium">{currentUser.name}</p>
            <p className="text-sm text-muted-foreground">
              {currentAvatar ? currentAvatar.description : "No avatar selected yet"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Choose your avatar</CardTitle>
          <CardDescription>
            Select one of the approved preset avatars below. You can change it anytime. No personal photos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {PRESET_AVATARS.map((avatar) => {
              const isSelected = currentUser.avatarId === avatar.id;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => handleSelectAvatar(avatar.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors",
                    "hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isSelected ? "border-primary bg-primary/5" : "border-transparent bg-muted/30"
                  )}
                  aria-pressed={isSelected}
                  aria-label={`Select avatar: ${avatar.description}`}
                >
                  <img
                    src={avatar.imageUrl}
                    alt={avatar.description}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  {isSelected && (
                    <span className="flex items-center gap-1 text-xs font-medium text-primary">
                      <Check className="w-3 h-3" /> Selected
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
