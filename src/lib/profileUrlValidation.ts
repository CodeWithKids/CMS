/**
 * Validation for learner learning-profile URLs.
 * Ensures valid URL format and optional expected domain (e-portfolio / platform).
 */

const SCRATCH_DOMAINS = ["scratch.mit.edu", "www.scratch.mit.edu"];
const TYPING_DOMAINS = ["typing.com", "www.typing.com", "typingclub.com", "www.typingclub.com"];
const PYGOLFERS_DOMAINS = ["pygolfers.com", "www.pygolfers.com"];
const ROBLOX_DOMAINS = ["roblox.com", "www.roblox.com"];

function isValidUrl(s: string): boolean {
  const trimmed = s.trim();
  if (!trimmed) return true; // empty is valid (optional field)
  try {
    const u = new URL(trimmed);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function hostMatches(url: URL, allowed: string[]): boolean {
  const host = url.hostname.toLowerCase();
  return allowed.some((d) => host === d || host.endsWith("." + d));
}

export function validateProfileUrl(
  value: string | null | undefined,
  platform: "scratch" | "typing" | "pygolfers" | "roblox"
): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  if (!isValidUrl(trimmed)) return "Enter a valid URL (e.g. https://...)";
  try {
    const u = new URL(trimmed);
    const domains =
      platform === "scratch"
        ? SCRATCH_DOMAINS
        : platform === "typing"
          ? TYPING_DOMAINS
          : platform === "pygolfers"
            ? PYGOLFERS_DOMAINS
            : ROBLOX_DOMAINS;
    if (!hostMatches(u, domains)) {
      const expected = platform === "scratch" ? "scratch.mit.edu" : platform === "typing" ? "typing.com or typingclub.com" : platform === "pygolfers" ? "pygolfers.com" : "roblox.com";
      return `URL should be from ${expected}`;
    }
    return null;
  } catch {
    return "Enter a valid URL";
  }
}
