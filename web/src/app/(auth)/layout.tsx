import { Brand } from "@/components/layout/site";
import { Card } from "@/components/ui/card";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10">
      <Brand />
      <Card className="w-full max-w-md p-6 sm:p-8">{children}</Card>
    </main>
  );
}
