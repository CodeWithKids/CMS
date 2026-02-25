import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  mockPrograms,
  mockTerms,
  mockLocations,
  mockAgeGroups,
  mockIncomeSources,
  mockExpenseCategories,
} from "@/mockData";
import { BookOpen, Calendar, MapPin, Users, TrendingUp, TrendingDown } from "lucide-react";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Programs, terms, locations, age groups, and finance configuration.
        </p>
      </div>

      <Tabs defaultValue="academic" className="space-y-4">
        <TabsList className="grid w-full max-w-2xl grid-cols-2">
          <TabsTrigger value="academic">Academic & program setup</TabsTrigger>
          <TabsTrigger value="finance">Finance configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="academic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> Programs
              </CardTitle>
              <CardDescription>Learning programs offered.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPrograms.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {p.description ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" /> Terms
              </CardTitle>
              <CardDescription>Academic terms and date ranges.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTerms.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="text-sm">{formatDate(t.startDate)}</TableCell>
                      <TableCell className="text-sm">{formatDate(t.endDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" /> Locations
              </CardTitle>
              <CardDescription>Venues and rooms.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockLocations.map((loc) => (
                    <TableRow key={loc.id}>
                      <TableCell className="font-medium">{loc.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {loc.address ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" /> Age groups
              </CardTitle>
              <CardDescription>Age ranges for classes.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Age range</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAgeGroups.map((ag) => (
                    <TableRow key={ag.id}>
                      <TableCell className="font-medium">{ag.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {ag.minAge != null && ag.maxAge != null
                          ? `${ag.minAge}–${ag.maxAge} years`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Income sources
              </CardTitle>
              <CardDescription>
                Fee structures and income types (School STEM Club, makerspace, etc.).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockIncomeSources.map((inc) => (
                    <TableRow key={inc.id}>
                      <TableCell className="font-medium">{inc.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm font-mono">
                        {inc.code ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5" /> Expense categories
              </CardTitle>
              <CardDescription>
                Categories for rent, utilities, equipment, travel, marketing, etc.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockExpenseCategories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm font-mono">
                        {cat.code ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
