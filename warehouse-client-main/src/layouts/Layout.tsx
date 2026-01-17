// layouts/Layout.tsx
import { useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useAppContext } from "../contexts/AppContext";

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isLoggedIn } = useAppContext();

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header onToggleSidebar={openSidebar} />

      <div className="flex flex-1">
        {isLoggedIn && (
          <>
            <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
            {isSidebarOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-40 z-20 md:hidden"
                onClick={closeSidebar}
              />
            )}
          </>
        )}

        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Layout;