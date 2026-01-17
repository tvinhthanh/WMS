// components/Header.tsx
import { useAppContext } from "../contexts/AppContext";

type HeaderProps = {
  onToggleSidebar: () => void;
};

const Header = ({ onToggleSidebar }: HeaderProps) => {
  const { isLoggedIn, fullName, role } = useAppContext();

  return (
    <header className="bg-gray-900 text-white shadow-md">
      <div className="flex items-center justify-between px-4 py-3">

        {/* Left - Sidebar toggle + Logo */}
        <div className="flex items-center gap-3">
          {isLoggedIn && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden text-gray-300 hover:text-white"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}

          <h1 className="text-xl font-bold">Quản Lý Kho</h1>
        </div>

        {/* Right - User info */}
        {isLoggedIn && fullName && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">{fullName}</p>
              <p className="text-xs text-gray-400">{role}</p>
            </div>

            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">
                {fullName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
