import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils/utils";
import { MenuItems } from "../../lib/utils/menu";
import { useAuth } from "../../context/AuthContext";
import { useLayout } from "../../context/LayoutContext";
import { useUserPermissions } from "../../hooks/usePermission";
import { getPrefixRoute } from "../../lib/utils/routeUtils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "components/ui/tooltip";

const TooltipWrapper = ({ isOpen, title, children }) => {
  if (isOpen) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="right"
        className="font-medium bg-[#3a5f9e] text-white border-none shadow-md dark:bg-[#3a5f9e] dark:text-white"
      >
        {title}
      </TooltipContent>
    </Tooltip>
  );
};

const Sidebar = () => {
  const { isOpen, setIsOpen } = useLayout();
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [expandedMenus, setExpandedMenus] = useState({});

  // Get user permissions from database
  const { hasPermission } = useUserPermissions();

  const toggleMenu = (title) => {
    setExpandedMenus((prev) => {
      const isCurrentlyOpen = prev[title];
      if (isCurrentlyOpen) {
        return { ...prev, [title]: false };
      }
      const newState = {};
      newState[title] = true;
      return newState;
    });
  };

  const intentRoute = getPrefixRoute(user);

  const visibleItems = MenuItems.filter((item) => {
    if (intentRoute) {
      return item.url === intentRoute;
    }

    if (item.module && item.action) {
      return hasPermission(item.module, item.action);
    }

    if (!item.allowedRoles) {
      return true;
    }
    if (!user?.role) return false;

    const userRole = user.role.toLowerCase();
    return item.allowedRoles.some((role) => role.toLowerCase() === userRole);
  });

  const handleLogout = () => {
    logout();
    navigate("/");
    toast.success("Logged out successfully");
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const isLinkActive = (url, siblings = []) => {
    if (url === "/dashboard") {
      return location.pathname === "/dashboard";
    }

    const isBaseMatch =
      location.pathname === url || location.pathname.startsWith(`${url}/`);
    if (!isBaseMatch) return false;

    const hasBetterMatch = siblings.some((siblingUrl) => {
      if (!siblingUrl || siblingUrl === url) return false;
      return (
        siblingUrl.length > url.length &&
        (location.pathname === siblingUrl ||
          location.pathname.startsWith(`${siblingUrl}/`))
      );
    });

    return !hasBetterMatch;
  };

  useEffect(() => {
    visibleItems.forEach((item) => {
      if (item.subItems && item.subItems.length > 0) {
        const subItemUrls = item.subItems.map((i) => i.url);
        const isParentActive = item.subItems.some((sub) =>
          isLinkActive(sub.url, subItemUrls),
        );
        if (isParentActive) {
          setExpandedMenus((prev) => {
            if (prev[item.title]) return prev;
            return { ...prev, [item.title]: true };
          });
        }
      }
    });
  }, [location.pathname]);

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen transition-all duration-500 ease-in-out z-50 flex flex-col bg-white border-r border-slate-200 shadow-xl md:shadow-sm",
          isOpen
            ? "w-64 translate-x-0"
            : "w-64 -translate-x-full md:w-20 md:translate-x-0 md:overflow-hidden",
        )}
      >
        <TooltipProvider delayDuration={200}>
          <Link
            to="/dashboard"
            className="flex items-center justify-center py-6 hover:opacity-80 transition-opacity cursor-pointer border-b border-slate-100"
          >
            {isOpen ? (
              <img
                src="/mol-logo.png"
                alt="Logo"
                className="h-12 w-auto transition-all duration-300 object-contain px-4"
              />
            ) : (
              <img
                src="/mol-logo.png"
                alt="Logo"
                className="h-8 w-auto transition-all duration-300 object-contain"
              />
            )}
          </Link>

          <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedMenus[item.title];

              const topLevelUrls = visibleItems.map((i) => i.url);
              const subItemUrls = item.subItems?.map((i) => i.url) || [];

              const isParentActive =
                hasSubItems &&
                item.subItems.some((sub) => isLinkActive(sub.url, subItemUrls));
              const isActive =
                !hasSubItems && isLinkActive(item.url, topLevelUrls);

              const handleNavClick = () => {
                if (!hasSubItems) {
                  setExpandedMenus({});
                }
                if (window.innerWidth < 768 && !hasSubItems) {
                  setIsOpen(false);
                }
              };

              return (
                <div key={item.title}>
                  {hasSubItems ? (
                    <TooltipWrapper title={item.title} isOpen={isOpen}>
                      <div
                        onClick={() => {
                          if (!isOpen) setIsOpen(true);
                          toggleMenu(item.title);
                        }}
                        className={cn(
                          "flex items-center py-3 rounded-lg transition-all duration-200 group relative cursor-pointer select-none",
                          isOpen
                            ? "px-4 gap-3 justify-between"
                            : "justify-center",
                          isActive || isParentActive
                            ? "bg-gradient-to-r from-[#3a5f9e] via-[#4c78c7] to-[#2b4b80] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),inset_0_0_0_1px_rgba(255,255,255,0.15)]"
                            : "text-slate-600 hover:bg-[#3a5f9e]/5 hover:text-[#3a5f9e] hover:shadow-[0_2px_8px_rgba(58,95,158,0.05)] hover:translate-x-1",
                        )}
                      >
                        {(isActive || isParentActive) && (
                          <div
                            className="absolute inset-0 bg-gradient-to-r from-[#3a5f9e] to-[#4c78c7] rounded-lg blur-lg opacity-40 -z-10 animate-pulse"
                            style={{ animationDuration: "3s" }}
                          />
                        )}
                        <div
                          className={cn(
                            "flex items-center gap-3",
                            !isOpen && "justify-center",
                          )}
                        >
                          <Icon
                            className={cn(
                              "transition-all duration-200 shrink-0",
                              isActive || isParentActive
                                ? "text-white"
                                : "text-slate-500 group-hover:text-[#3a5f9e]",
                            )}
                            size={20}
                          />
                          {isOpen && (
                            <span className="text-sm font-medium transition-all duration-200 whitespace-nowrap">
                              {item.title}
                            </span>
                          )}
                        </div>
                        {isOpen && (
                          <div
                            className={cn(
                              "transition-all duration-500 ease-in-out",
                              isExpanded
                                ? "rotate-90 scale-110"
                                : "rotate-0 scale-100",
                              isActive || isParentActive
                                ? "text-white"
                                : isExpanded
                                  ? "text-[#3a5f9e]"
                                  : "text-slate-400",
                            )}
                          >
                            <ChevronRight size={14} />
                          </div>
                        )}
                      </div>
                    </TooltipWrapper>
                  ) : (
                    <TooltipWrapper title={item.title} isOpen={isOpen}>
                      <Link
                        to={item.url}
                        onClick={handleNavClick}
                        className={cn(
                          "flex items-center py-3 rounded-lg transition-all duration-200 group relative",
                          isOpen
                            ? "px-4 gap-3 justify-start"
                            : "justify-center",
                          isActive
                            ? "bg-gradient-to-r from-[#3a5f9e] via-[#4c78c7] to-[#2b4b80] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),inset_0_0_0_1px_rgba(255,255,255,0.15)]"
                            : "text-slate-600 hover:bg-[#3a5f9e]/5 hover:text-[#3a5f9e] hover:shadow-[0_2px_8px_rgba(58,95,158,0.05)] hover:translate-x-1",
                        )}
                      >
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-[#3a5f9e] to-[#4c78c7] rounded-lg blur-lg opacity-50 -z-10" />
                        )}
                        <Icon
                          className={cn(
                            "transition-all duration-200 shrink-0",
                            isActive
                              ? "text-white"
                              : "text-slate-500 group-hover:text-[#3a5f9e]",
                          )}
                          size={20}
                        />
                        {isOpen && (
                          <span
                            className={cn(
                              "text-sm transition-all duration-200 whitespace-nowrap",
                              isActive ? "font-semibold" : "font-medium",
                            )}
                          >
                            {item.title}
                          </span>
                        )}
                      </Link>
                    </TooltipWrapper>
                  )}

                  {/* Submenu */}
                  {hasSubItems && isOpen && (
                    <div
                      className={cn(
                        "grid transition-all duration-500 ease-in-out",
                        isExpanded
                          ? "grid-rows-[1fr] opacity-100 mt-1"
                          : "grid-rows-[0fr] opacity-0",
                      )}
                    >
                      <div className="overflow-hidden">
                        <div
                          className={cn(
                            "ml-4 border-l border-slate-200 pl-2 space-y-1 py-1 transition-all duration-500 ease-out transform",
                            isExpanded
                              ? "translate-y-0 opacity-100 scale-100"
                              : "-translate-y-4 opacity-0 scale-95",
                          )}
                        >
                          {item.subItems.map((subItem) => {
                            if (
                              subItem.module &&
                              subItem.action &&
                              !hasPermission(subItem.module, subItem.action)
                            ) {
                              return null;
                            }
                            const isSubActive = isLinkActive(
                              subItem.url,
                              subItemUrls,
                            );
                            return (
                              <Link
                                key={subItem.title}
                                to={subItem.url}
                                onClick={() => {
                                  if (window.innerWidth < 768) setIsOpen(false);
                                }}
                                className={cn(
                                  "flex items-center py-2 px-3 rounded-md text-[13px] transition-all duration-300 ease-out",
                                  isSubActive
                                    ? "text-[#3a5f9e] bg-blue-100 font-bold shadow-sm ring-1 ring-blue-200 scale-[1.02]"
                                    : "text-slate-500 hover:text-[#3a5f9e] hover:bg-[#3a5f9e]/5 hover:translate-x-2 hover:shadow-sm",
                                )}
                              >
                                {subItem.title}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100 mt-auto">
            <TooltipWrapper title="Logout" isOpen={isOpen}>
              <button
                onClick={handleLogout}
                className={cn(
                  "flex items-center py-2.5 rounded-lg transition-all duration-200 w-full group",
                  isOpen ? "px-4 gap-3 justify-start" : "justify-center",
                  "text-slate-500 hover:bg-red-50 hover:text-red-600",
                )}
              >
                <LogOut
                  className="text-slate-500 group-hover:text-red-500 transition-colors shrink-0"
                  size={18}
                />
                {isOpen && (
                  <span className="font-medium text-xs transition-colors whitespace-nowrap">
                    Log Out
                  </span>
                )}
              </button>
            </TooltipWrapper>
          </div>
        </TooltipProvider>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
