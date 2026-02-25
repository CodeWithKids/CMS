import { ExternalLink } from "lucide-react";

const resources = [
  { name: "Scratch", description: "Create stories, games, and animations. Perfect for beginners!", url: "https://scratch.mit.edu", emoji: "🐱" },
  { name: "Typing.com", description: "Improve your typing speed and accuracy with fun lessons.", url: "https://www.typing.com", emoji: "⌨️" },
  { name: "Tinkercad", description: "Design 3D models and learn electronics with simulations.", url: "https://www.tinkercad.com", emoji: "🔧" },
  { name: "Roblox Studio", description: "Build your own games and experiences in Roblox.", url: "https://www.roblox.com/create", emoji: "🎮" },
  { name: "PyGolfers", description: "Learn Python programming through fun golf-themed challenges.", url: "https://www.pygolfers.com", emoji: "🐍" },
  { name: "Code.org", description: "Free coding courses for all ages. Start your coding journey!", url: "https://code.org", emoji: "💻" },
];

export default function ResourcesPage() {
  return (
    <div className="page-container">
      <h1 className="page-title">Resources</h1>
      <p className="page-subtitle">Explore learning platforms and tools</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((r) => (
          <div key={r.name} className="bg-card rounded-xl border p-5 flex flex-col">
            <div className="text-3xl mb-3">{r.emoji}</div>
            <h3 className="font-semibold text-base mb-1">{r.name}</h3>
            <p className="text-sm text-muted-foreground flex-1">{r.description}</p>
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity self-start"
            >
              Open <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
