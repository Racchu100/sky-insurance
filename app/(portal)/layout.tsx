import Sidebar from "@/components/Sidebar";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main className="main-content">
        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  );
}
