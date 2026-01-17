import { Link, useLocation } from "react-router-dom";
import { useAppContext } from "../contexts/AppContext";
import SignOutButton from "./SignOutButton";

type SidebarProps = {
    isOpen: boolean;
    onClose: () => void;
};

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const { role } = useAppContext();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    const linkClass = (path: string) =>
        `block px-3 py-2 rounded transition-colors ${isActive(path)
            ? "bg-gray-700 text-white"
            : "hover:bg-gray-800 text-gray-300"
        }`;

    return (
        <div
            className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 text-gray-100 transform transition-transform duration-300 flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full"
                } md:translate-x-0 md:relative md:w-60`}
        >
            {/* Mobile header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700 md:hidden">
                <span className="text-lg font-semibold">Menu</span>
                <button className="text-gray-300 hover:text-white" onClick={onClose}>
                    ✕
                </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-4 py-6 overflow-y-auto">
                <nav className="space-y-1">
                    <Link to="/dashboard" className={linkClass("/dashboard")} onClick={onClose}>
                        Dashboard
                    </Link>

                    {/* QUẢN LÝ HÀNG HÓA */}
                    <div className="pb-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wider px-3">
                            Quản lý hàng hóa
                        </p>
                    </div>

                    <Link to="/doitac" className={linkClass("/doitac")} onClick={onClose}>
                        Đối tác
                    </Link>


                    <Link to="/sanpham" className={linkClass("/sanpham")} onClick={onClose}>
                        Sản phẩm
                    </Link>

                    <Link to="/danhmuc" className={linkClass("/danhmuc")} onClick={onClose}>
                        Danh mục
                    </Link>

                    {/* KHO */}
                    <div className="pt-4 pb-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wider px-3">
                            Kho
                        </p>
                    </div>

                    <Link to="/tonkho" className={linkClass("/tonkho")} onClick={onClose}>
                        Tồn kho
                    </Link>

                    <Link to="/kiemke" className={linkClass("/kiemke")} onClick={onClose}>
                        Kiểm kê kho
                    </Link>

                    {/* NHẬP - XUẤT */}
                    <div className="pt-4 pb-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wider px-3">
                            Nhập / Xuất kho
                        </p>
                    </div>

                    <Link to="/nhaphang" className={linkClass("/nhaphang")} onClick={onClose}>
                        Nhập hàng
                    </Link>

                    <Link to="/phieuxuat" className={linkClass("/phieuxuat")} onClick={onClose}>
                        Phiếu xuất hàng
                    </Link>

                    {/* ADMIN */}
                    {role === "Admin" && (
                        <>
                            <div className="pt-4 pb-2">
                                <p className="text-xs text-gray-500 uppercase tracking-wider px-3">
                                    Quản trị
                                </p>
                            </div>

                            <Link to="/admin/nhanvien" className={linkClass("/admin/nhanvien")} onClick={onClose}>
                                Quản lý nhân viên
                            </Link>
                        </>
                    )}

                    {/* ACCOUNT */}
                    <div className="pt-4 pb-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wider px-3">
                            Tài khoản
                        </p>
                    </div>

                    <Link to="/taikhoan" className={linkClass("/taikhoan")} onClick={onClose}>
                        Cài đặt tài khoản
                    </Link>

                </nav>
            </div>

            {/* Logout */}
            <div className="px-4 py-4 border-t border-gray-700">
                <SignOutButton />
            </div>
        </div>
    );
};

export default Sidebar;
