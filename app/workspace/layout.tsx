import { WorkspaceSidebar } from "./_components/workspace-sidebar";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#06090e] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        <WorkspaceSidebar />
        <section className="flex-1 p-4 sm:p-6">{children}</section>
      </div>
    </main>
  );
}

