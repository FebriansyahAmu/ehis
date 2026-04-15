export default function FullpageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {children}
    </div>
  );
}
