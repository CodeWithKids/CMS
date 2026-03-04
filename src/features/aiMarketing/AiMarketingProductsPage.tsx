import { Link } from "react-router-dom";
import { RequireMarketingAccess } from "./RequireMarketingAccess";
import { futureProducts, type FutureProductStatus } from "./canvasConfig";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const statusVariant: Record<FutureProductStatus, "secondary" | "default" | "outline"> = {
  IDEA: "secondary",
  MVP: "outline",
  PILOT: "outline",
  LAUNCHED: "default",
};

function ProductsContent() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Stage 5 – Products</h1>
        <p className="text-muted-foreground">
          Future products and monetization ideas. Track status from idea to launch.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {futureProducts.map((product) => (
          <Card key={product.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="text-lg font-semibold">{product.name}</h2>
                <Badge variant={statusVariant[product.status]}>{product.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {product.targetCustomers.map((c) => (
                  <Badge key={c} variant="outline" className="text-xs">
                    {c}
                  </Badge>
                ))}
              </div>
              {product.linkPath && (
                <Button asChild variant="ghost" size="sm">
                  <Link
                    to={product.linkPath}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Relevant features <ExternalLink className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Button asChild variant="outline">
        <Link to="/ai-marketing/canvas">Back to canvas</Link>
      </Button>
    </div>
  );
}

export default function AiMarketingProductsPage() {
  return (
    <RequireMarketingAccess>
      <ProductsContent />
    </RequireMarketingAccess>
  );
}
