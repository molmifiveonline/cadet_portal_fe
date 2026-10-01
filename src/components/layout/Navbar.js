import React, { useCallback, useState } from "react";
import { Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLayout } from "../../context/LayoutContext";
import { Button } from "components/ui/button";
import NotificationDropdown from "../common/NotificationDropdown";
import ProfileDetailModal from "../common/ProfileDetailModal";

const Navbar = () => {
  const { toggleSidebar } = useLayout();
  const { user, logout } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const closeProfileModal = useCallback(() => {
    setIsProfileModalOpen(false);
  }, []);

  const getInitials = () => {
    const firstInitial = user?.first_name?.[0] || user?.name?.[0] || "U";
    const lastInitial = user?.last_name?.[0] || "S";
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  const profileImage = user?.user_image;

  return (
    <>
      <div className="flex justify-between items-center z-20 bg-white/30 backdrop-blur-xl border border-white/40 shadow-xl transition-all duration-300 py-2 px-3 mt-2 mx-2 rounded-xl md:py-3 md:px-4 md:mt-4 md:mx-4 md:rounded-3xl">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 active:bg-gray-200"
          >
            <Menu className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <NotificationDropdown />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-700 leading-none mb-1 capitalize">
                {user?.name || user?.first_name || "Admin"}
              </p>
              <p className="text-xs text-[#3a5f9e] font-semibold capitalize bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                {user?.role || "Admin"}
              </p>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3a5f9e] to-[#6fa8dc] flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-white transition-all duration-200 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#3a5f9e]/30 focus:ring-offset-2"
                aria-label="Open profile details"
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="User"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span>{getInitials()}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ProfileDetailModal
        isOpen={isProfileModalOpen}
        onClose={closeProfileModal}
        user={user}
        onLogout={logout}
      />
    </>
  );
};

export default Navbar;
