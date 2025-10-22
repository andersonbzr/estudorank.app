// src/app/ranking/loading.tsx
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";

export default function LoadingRanking() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>
      <Card className="mt-6 p-0 overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-3 gap-3 items-center">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-56" />
              <div className="flex justify-end">
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}
