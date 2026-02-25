import type { PresetAvatar } from "@/types";

/** Base URL for DiceBear 7.x preset avatars (notionists = illustrated characters; no PII). */
const DICEBEAR = "https://api.dicebear.com/7.x";

const AVATAR_ENTRIES: Omit<PresetAvatar, "imageUrl">[] = [
  { id: "avatar-1", description: "Illustrated character, blue and teal" },
  { id: "avatar-2", description: "Illustrated character, orange and yellow" },
  { id: "avatar-3", description: "Illustrated character, green" },
  { id: "avatar-4", description: "Illustrated character, purple" },
  { id: "avatar-5", description: "Illustrated character, pink" },
  { id: "avatar-6", description: "Illustrated character, red" },
  { id: "avatar-7", description: "Illustrated character, mint" },
  { id: "avatar-8", description: "Illustrated character, coral" },
  { id: "avatar-9", description: "Robot style, blue" },
  { id: "avatar-10", description: "Robot style, green" },
  { id: "avatar-11", description: "Robot style, orange" },
  { id: "avatar-12", description: "Robot style, purple" },
  { id: "avatar-13", description: "Abstract icon, geometric" },
  { id: "avatar-14", description: "Abstract icon, circles" },
  { id: "avatar-15", description: "Abstract icon, shapes" },
  { id: "avatar-16", description: "Fun character, star theme" },
  { id: "avatar-17", description: "Fun character, moon theme" },
  { id: "avatar-18", description: "Fun character, sun theme" },
  { id: "avatar-19", description: "Neutral character, soft colors" },
  { id: "avatar-20", description: "Neutral character, bold colors" },
];

/** Preset avatars for student profiles. No uploads; safe, non-identifiable images only. */
export const PRESET_AVATARS: PresetAvatar[] = AVATAR_ENTRIES.map((entry) => ({
  ...entry,
  imageUrl: `${DICEBEAR}/notionists/svg?seed=${encodeURIComponent(entry.id)}`,
}));

export function getPresetAvatar(id: string): PresetAvatar | undefined {
  return PRESET_AVATARS.find((a) => a.id === id);
}
