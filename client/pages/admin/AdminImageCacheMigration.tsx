import { useState } from "react";
import { getAccessTokenSafe } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, TriangleAlert, ImageUp, CheckCircle2 } from "lucide-react";

type StatusFilter = "all" | "published" | "draft";
type AssetStatus =
  | "needs_migration"
  | "already_optimized"
  | "inspection_failed";

interface UrlReference {
  sourceUrl: string;
  rowId: string;
  tableName: string;
  itemTitle: string;
  itemUrl: string;
  fieldPath: string;
}

interface AssetCandidate {
  sourceUrl: string;
  currentCacheControl: string | null;
  currentMaxAge: number | null;
  status: AssetStatus;
  reason?: string;
  references: UrlReference[];
}

interface PreviewResult {
  totalReferences: number;
  affectedItems: number;
  uniqueUrls: number;
  urlsNeedingMigration: number;
  candidates: AssetCandidate[];
  confirmToken: string;
}

interface ExecuteResult {
  operationId: string;
  totalReferences: number;
  affectedItems: number;
  uniqueUrls: number;
  migratedCount: number;
  updatedItems: number;
  failedCount: number;
  migratedAssets: Array<{ oldUrl: string; newUrl: string }>;
  failures: Array<{ sourceUrl: string; reason: string }>;
}

const STATUS_LABELS: Record<AssetStatus, string> = {
  needs_migration: "Will migrate",
  already_optimized: "Already long cache",
  inspection_failed: "Needs review",
};

const STATUS_CLASSES: Record<AssetStatus, string> = {
  needs_migration: "bg-amber-100 text-amber-900 hover:bg-amber-100",
  already_optimized: "bg-emerald-100 text-emerald-900 hover:bg-emerald-100",
  inspection_failed: "bg-rose-100 text-rose-900 hover:bg-rose-100",
};

const TABLE_LABELS: Record<string, string> = {
  pages: "Page",
  posts: "Post",
  site_settings: "Site Settings",
  templates: "Template",
  blog_sidebar_settings: "Blog Sidebar",
};

function truncate(value: string, maxLength = 72): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
}

function formatCacheLabel(candidate: AssetCandidate): string {
  if (candidate.currentCacheControl) {
    return candidate.currentCacheControl;
  }

  if (candidate.currentMaxAge !== null) {
    return `max-age=${candidate.currentMaxAge}`;
  }

  return "Unavailable";
}

export default function AdminImageCacheMigration() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("published");
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getAuthToken = async (): Promise<string | null> => {
    return (await getAccessTokenSafe()) || null;
  };

  const requestMigration = async (body: Record<string, unknown>) => {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch("/.netlify/functions/image-cache-migration", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || "Request failed");
    }

    return data;
  };

  const handlePreview = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const data = (await requestMigration({
        dryRun: true,
        statusFilter,
      })) as PreviewResult;
      setPreviewResult(data);
    } catch (err) {
      setPreviewResult(null);
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!previewResult?.confirmToken) return;

    setExecuting(true);
    setError(null);

    try {
      const data = (await requestMigration({
        dryRun: false,
        statusFilter,
        confirmToken: previewResult.confirmToken,
      })) as ExecuteResult;

      setSuccessMessage(
        `Migrated ${data.migratedCount} image URLs and updated ${data.updatedItems} CMS items.`,
      );
      setPreviewResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Migration failed");
    } finally {
      setExecuting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Image Cache Migration</h1>
        <p className="text-slate-600 mt-2 max-w-3xl">
          This one-time tool finds project Supabase-hosted images that are still
          referenced by CMS content or settings, checks their current cache TTL,
          and migrates only the ones still using a short cache lifetime.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preview migration scope</CardTitle>
          <CardDescription>
            Preview first, then confirm the rewrite. Existing Builder CDN,
            external, and already-optimized assets are skipped.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="w-full md:w-64 space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Content scope
              </label>
              <Select
                value={statusFilter}
                onValueChange={(value: StatusFilter) => setStatusFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published only</SelectItem>
                  <SelectItem value="all">Published + draft</SelectItem>
                  <SelectItem value="draft">Draft only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handlePreview} disabled={loading || executing}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inspecting...
                </>
              ) : (
                <>
                  <ImageUp className="mr-2 h-4 w-4" />
                  Preview migration
                </>
              )}
            </Button>
          </div>

          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {successMessage}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {previewResult ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Supabase image URLs</CardDescription>
                <CardTitle className="text-2xl">{previewResult.uniqueUrls}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Need migration</CardDescription>
                <CardTitle className="text-2xl">
                  {previewResult.urlsNeedingMigration}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Referenced fields</CardDescription>
                <CardTitle className="text-2xl">
                  {previewResult.totalReferences}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Affected items</CardDescription>
                <CardTitle className="text-2xl">
                  {previewResult.affectedItems}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle>Preview results</CardTitle>
                <CardDescription>
                  Review the current cache headers before running the migration.
                </CardDescription>
              </div>
              <Button
                onClick={() => setConfirmOpen(true)}
                disabled={
                  executing || previewResult.urlsNeedingMigration === 0
                }
              >
                {executing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Run migration
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {previewResult.candidates.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  No matching project Supabase image URLs were found in the selected scope.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Current cache</TableHead>
                        <TableHead>References</TableHead>
                        <TableHead>Example usage</TableHead>
                        <TableHead>Source URL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewResult.candidates.map((candidate) => {
                        const exampleReference = candidate.references[0];
                        return (
                          <TableRow key={candidate.sourceUrl}>
                            <TableCell className="align-top">
                              <div className="space-y-2">
                                <Badge className={STATUS_CLASSES[candidate.status]}>
                                  {STATUS_LABELS[candidate.status]}
                                </Badge>
                                {candidate.reason ? (
                                  <p className="text-xs text-slate-500 max-w-[220px]">
                                    {candidate.reason}
                                  </p>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell className="align-top text-sm text-slate-700">
                              {formatCacheLabel(candidate)}
                            </TableCell>
                            <TableCell className="align-top text-sm text-slate-700">
                              {candidate.references.length}
                            </TableCell>
                            <TableCell className="align-top text-sm text-slate-700">
                              {exampleReference ? (
                                <div className="space-y-1">
                                  <div className="font-medium text-slate-900">
                                    {exampleReference.itemTitle}
                                  </div>
                                  <div>
                                    {TABLE_LABELS[exampleReference.tableName] ||
                                      exampleReference.tableName}
                                    {" · "}
                                    {exampleReference.fieldPath}
                                  </div>
                                  <div className="text-slate-500">
                                    {exampleReference.itemUrl}
                                  </div>
                                </div>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell className="align-top text-xs text-slate-600 break-all">
                              {truncate(candidate.sourceUrl, 120)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-950">
            <TriangleAlert className="h-5 w-5" />
            Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-950 space-y-2">
          <p>
            The migration copies each qualifying image to a new Supabase Storage
            path with a 1-year cache TTL, then rewrites CMS references to the new URL.
          </p>
          <p>
            It does not alter external assets, Builder CDN assets, or images that
            already return a long cache lifetime.
          </p>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Run image cache migration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will copy the {previewResult?.urlsNeedingMigration || 0} images
              that still need a cache fix and then update CMS references to the
              new URLs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={executing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleExecute} disabled={executing}>
              {executing ? "Migrating..." : "Confirm migration"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
