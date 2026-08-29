import { useLocation } from "react-router-dom";
import { NAV_ITEMS } from "../config/nav";
import { useAuth } from "../auth/AuthContext";

interface HeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

export function Header({ onMenuClick, sidebarOpen }: HeaderProps) {
  const { user } = useAuth();
  const location = useLocation();
  const current = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path));

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-black/5 bg-white px-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-lg border border-slate-200 p-2"
          onClick={onMenuClick}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <span className="block h-0.5 w-4 bg-slate-700" />
          <span className="mt-1 block h-0.5 w-4 bg-slate-700" />
          <span className="mt-1 block h-0.5 w-4 bg-slate-700" />
        </button>
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-amber-800">
            MADHURAM OZONE
          </p>
          <h1 className="text-base font-semibold text-slate-900">
            {current?.label ?? "Clinic portal"}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <div className="hidden text-right sm:block">
          <p className="font-medium text-slate-800">{user?.name}</p>
          <p className="capitalize text-slate-500">{user?.role}</p>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-amber-800 text-xs font-semibold text-white">
          {(user?.name ?? "A")
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? "")
            .join("")}
        </div>
      </div>
    </header>
  );
}
