"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-ink">Something went wrong</h1>
      <p className="text-sm text-muted">
        Please try again. If it keeps happening, come back a little later.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
