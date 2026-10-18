import { Skeleton } from "@/components/Skeleton/Skeleton";

export default function PatientsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-6 md:px-6 md:py-8" aria-busy="true">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-12 w-full" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
          <Skeleton className="size-16 shrink-0" />
          <div className="flex grow flex-col gap-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
