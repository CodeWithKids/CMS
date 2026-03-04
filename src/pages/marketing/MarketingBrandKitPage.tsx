import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const LOGOS = [
  {
    src: "/brand/logos/multicolor.png",
    label: "Multicolor",
    description: "Full colour — pink, yellow, teal, navy. Our main logo.",
    isMain: true,
    merchandise: "Preferred for T‑shirts, hoodies, and caps when full-colour print or embroidery is available. Use on white or light garments for best visibility.",
  },
  {
    src: "/brand/logos/primary.png",
    label: "Primary",
    description: "Yellow / gold — works on dark backgrounds.",
    isMain: false,
    merchandise: "T‑shirts, bags, and caps in navy or dark colours. Single-colour screen print or vinyl; no need for multiple inks.",
  },
  {
    src: "/brand/logos/navy.png",
    label: "Navy",
    description: "Dark blue — use on light backgrounds.",
    isMain: false,
    merchandise: "White or light-coloured T‑shirts, tote bags, and merchandise. Single-colour print; clear and professional.",
  },
  {
    src: "/brand/logos/teal.png",
    label: "Teal",
    description: "Teal — accent variant.",
    isMain: false,
    merchandise: "Light or white merchandise; good for a softer look. Single-colour print on mugs, notebooks, or apparel.",
  },
  {
    src: "/brand/logos/coral.png",
    label: "Coral",
    description: "Coral / pink — accent variant.",
    isMain: false,
    merchandise: "Light backgrounds and pastel merchandise. Single-colour print for items like pink or white T‑shirts, stickers, or lanyards.",
  },
  {
    src: "/brand/logos/mono.png",
    label: "Mono",
    description: "Black — single colour for maximum contrast.",
    isMain: false,
    merchandise: "Any colour garment or product. Best for one-colour screen print, embroidery, or engraving (e.g. black on white T‑shirts, white on dark hoodies if reversed).",
  },
] as const;

const PATTERNS = [
  { src: "/brand/patterns/colored.png", label: "Colored", description: "Navy, yellow, teal, pink on white" },
  { src: "/brand/patterns/navy.png", label: "Navy", description: "Navy geometric on white" },
  { src: "/brand/patterns/yellow.png", label: "Yellow", description: "Yellow geometric on white" },
  { src: "/brand/patterns/teal.png", label: "Teal", description: "Teal geometric on white" },
  { src: "/brand/patterns/pink.png", label: "Pink", description: "Pink geometric on white" },
] as const;

export default function MarketingBrandKitPage() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Brand Kit</h1>
        <p className="text-muted-foreground">
          Logos, colours, and patterns for Code With Kids branding.
        </p>
      </div>

      {/* App icon / Favicon */}
      <section>
        <h2 className="text-lg font-semibold mb-2">App icon & favicon</h2>
        <p className="text-sm text-muted-foreground mb-4">
          The CWK icon (<code className="text-xs bg-muted px-1 rounded">{"<CWK/>"}</code>) in teal, yellow, pink, and navy. Used as the browser tab favicon and for app icons.
        </p>
        <Card className="max-w-sm">
          <CardContent className="pt-6">
            <div className="aspect-square max-w-[200px] mx-auto bg-white rounded-xl border flex items-center justify-center p-6">
              <img
                src="/brand/icons/cwk-icon.png"
                alt="Code With Kids app icon — CWK in angle brackets"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="font-medium mt-3 text-center">CWK icon</p>
            <p className="text-sm text-muted-foreground text-center mt-0.5">
              Favicon and app icon. Use for browser tabs, bookmarks, and app shortcuts.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Logos */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Logos</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Our main logo is <strong>Multicolor</strong>. Other variants are for different backgrounds and print options (e.g. merchandise).
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {LOGOS.map(({ src, label, description, isMain, merchandise }) => (
            <Card key={label} className={isMain ? "ring-2 ring-primary" : undefined}>
              <CardContent className="pt-6">
                <div className="aspect-[2/1] bg-white rounded-md border flex items-center justify-center p-4">
                  <img
                    src={src}
                    alt={`Code With Kids logo — ${label}`}
                    className="max-h-full w-full object-contain"
                  />
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <p className="font-medium">{label}</p>
                  {isMain && (
                    <Badge variant="default" className="text-xs">Main logo</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                <p className="text-sm mt-2 pt-2 border-t">
                  <span className="font-medium text-muted-foreground">Merchandise (e.g. T‑shirts, caps):</span>{" "}
                  {merchandise}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Patterns */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Brand patterns</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Use as backgrounds, section textures, or decorative elements. Shown as thumbnails with a preview strip.
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PATTERNS.map(({ src, label, description }) => (
            <Card key={label}>
              <CardContent className="pt-6">
                <div className="rounded-md border overflow-hidden bg-white">
                  <div
                    className="aspect-video bg-cover bg-center bg-repeat"
                    style={{ backgroundImage: `url(${src})`, backgroundSize: "120px" }}
                  />
                </div>
                <p className="font-medium mt-3">{label}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
