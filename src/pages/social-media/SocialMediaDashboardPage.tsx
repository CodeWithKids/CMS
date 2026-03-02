import { Link } from "react-router-dom";
import { useSocialMedia } from "@/context/SocialMediaContext";
import { Share2, Megaphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SocialMediaDashboardPage() {
  const { posts } = useSocialMedia();
  const publishedCount = posts.filter((p) => p.status === "published").length;
  const scheduledCount = posts.filter((p) => p.status === "scheduled").length;
  const draftCount = posts.filter((p) => p.status === "draft").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Share2 className="w-6 h-6" /> Social Media
        </h1>
        <p className="text-muted-foreground">
          Manage content and posts for Code With Kids social channels.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Share2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">{publishedCount}</p>
                <p className="text-sm text-muted-foreground">Scheduled: {scheduledCount} · Drafts: {draftCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Megaphone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Content & posts</p>
                  <p className="text-2xl font-bold">{posts.length}</p>
                  <p className="text-sm text-muted-foreground">Plan and track social content</p>
                </div>
              </div>
              <Button asChild>
                <Link to="/social-media/content">View & add content</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
