// src/app/me/loading.tsx
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";

export default function LoadingMe() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div>
        <Skeleton className="h-6 w-40" />
        <div className="mt-2 flex items-center gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-6 w-12 rounded-md" />
        </div>
      </div>

      <Card className="mt-6 p-4">
        <div className="flex items-center justify-between gap-6">
          <div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-56 mt-2" />
          </div>
          <Skeleton className="h-2 w-full max-w-xs" />
        </div>
      </Card>

      <div className="mt-6 grid gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-5 w-40" />
            <div className="mt-4 space-y-2">
              {Array.from({ length: 3 }).map((__, j) => (
                <div key={j} className="flex items-center justify-between">
                  <Skeleton className="h-10 w-64" />
                  <Skeleton className="h-9 w-28 rounded-lg" />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
