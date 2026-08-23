import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page-bg px-4 py-12">
      <div className="w-full max-w-sm">{children}</div>
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
    </div>
  );
}
