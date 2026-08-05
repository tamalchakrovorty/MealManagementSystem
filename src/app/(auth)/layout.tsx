export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e9e9f5] px-4 py-12">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
