import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <Header
        sidebarCollapsed={sidebarCollapsed}
        onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      {/* Main Content */}
      <main
        className={cn(
          "transition-all duration-300",
          // Desktop margins, mobile full width
          "lg:ml-64",
          sidebarCollapsed && "lg:ml-16"
        )}
      >
        <div className="pt-14">
          {children}
        </div>
      </main>
    </div>
  );
}
