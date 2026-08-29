import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { IconButton } from "../components/IconButton";
import { ChevronLeftIcon, LogOutIcon, XIcon } from "../components/icons";
import { NAV_ITEMS } from "../config/nav";

interface SidebarProps {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

export function Sidebar({
  open,
  collapsed,
  onClose,
  onToggleCollapse,
}: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <>
      <button
        type="button"
        className={`fixed inset-0 z-30 bg-black/40 lg:hidden ${open ? "block" : "hidden"}`}
        aria-label="Close menu"
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-[#2c2118] text-amber-50 transition-all duration-200 lg:static ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "lg:w-0 lg:overflow-hidden lg:opacity-0" : "w-64 lg:opacity-100"}`}
        aria-hidden={collapsed}
      >
        <div className="flex items-start justify-between gap-2 border-b border-white/10 px-5 py-5">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-amber-200/80">
              MADHURAM OZONE
            </p>
            <p className="mt-1 text-lg font-semibold">Clinic portal</p>
          </div>
          <IconButton
            icon={<ChevronLeftIcon className="h-5 w-5" />}
            label="Close sidebar"
            className="hidden border border-white/15 text-amber-50 hover:bg-white/10 lg:inline-flex"
            onClick={onToggleCollapse}
          />
          <IconButton
            icon={<XIcon />}
            label="Close menu"
            className="border border-white/15 text-amber-50 hover:bg-white/10 lg:hidden"
            onClick={onClose}
          />
        </div>

        <nav className="w-64 flex-1 px-3 py-4">
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-amber-200/60">
            Menu
          </p>
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2.5 text-sm ${
                      isActive
                        ? "bg-amber-800 text-white"
                        : "text-amber-50/80 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="mt-0.5 block text-xs opacity-70">{item.hint}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="w-64 border-t border-white/10 p-4">
          <p className="truncate text-sm font-medium">{user?.name}</p>
          <p className="truncate text-xs capitalize text-amber-200/70">{user?.role}</p>
          <IconButton
            variant="outline"
            showLabel
            icon={<LogOutIcon />}
            label="Sign out"
            className="mt-3 w-full border-white/15 text-amber-50 hover:bg-white/10"
            onClick={() => void logout()}
          />
        </div>
      </aside>
    </>
  );
}
