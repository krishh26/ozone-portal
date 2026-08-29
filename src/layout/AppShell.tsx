import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

const COLLAPSE_KEY = "ozone.sidebar.collapsed";

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  function handleMenuClick() {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      setMobileOpen(true);
      return;
    }
    setCollapsed((current) => !current);
  }

  return (
    <div className="flex min-h-screen bg-[#f6f3ee]">
      <Sidebar
        open={mobileOpen}
        collapsed={collapsed}
        onClose={() => setMobileOpen(false)}
        onToggleCollapse={() => setCollapsed((current) => !current)}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Header
          onMenuClick={handleMenuClick}
          sidebarOpen={!collapsed}
        />
        <main className="flex-1 px-4 py-6 lg:px-6">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
