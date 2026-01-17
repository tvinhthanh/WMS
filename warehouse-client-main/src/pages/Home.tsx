// pages/Home.tsx
import { useAppContext } from "../contexts/AppContext";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const Home = () => {
  const { fullName, role } = useAppContext();
  const [ipAddress, setIpAddress] = useState<string>("");
  const [loginTime, setLoginTime] = useState<string>("");
  const [sessionDuration, setSessionDuration] = useState<string>("");

  useEffect(() => {
    // Lấy IP từ API public
    fetch("https://api.ipify.org?format=json")
      .then((res) => res.json())
      .then((data) => setIpAddress(data.ip))
      .catch(() => setIpAddress("Không xác định"));

    // Lưu thời gian đăng nhập
    let loginTimestamp = localStorage.getItem("loginTimestamp");
    if (!loginTimestamp) {
      loginTimestamp = Date.now().toString();
      localStorage.setItem("loginTimestamp", loginTimestamp);
    }

    const loginDate = new Date(parseInt(loginTimestamp));
    setLoginTime(loginDate.toLocaleString("vi-VN"));

    // Cập nhật thời gian phiên làm việc mỗi giây
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = now - parseInt(loginTimestamp!);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setSessionDuration(`${hours} giờ ${minutes} phút ${seconds} giây`);
      } else if (minutes > 0) {
        setSessionDuration(`${minutes} phút ${seconds} giây`);
      } else {
        setSessionDuration(`${seconds} giây`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const quickActions = [
    {
      title: "Sản Phẩm",
      description: "Quản lý danh sách sản phẩm trong kho",
      link: "/sanpham",
    },
    {
      title: "Danh Mục",
      description: "Phân loại và quản lý danh mục sản phẩm",
      link: "/danhmuc",
    },
    {
      title: "Nhập Hàng",
      description: "Tạo phiếu nhập hàng mới vào kho",
      link: "/nhaphang",
    },
    {
      title: "Xuất Hàng",
      description: "Tạo phiếu xuất hàng ra khỏi kho",
      link: "/xuathang",
    },
    {
      title: "Tồn Kho",
      description: "Xem báo cáo tồn kho hiện tại",
      link: "/tonkho",
    },
    {
      title: "Doanh Thu",
      description: "Thống kê doanh thu và lợi nhuận",
      link: "/doanhthu",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="bg-white rounded-lg shadow p-8 mb-8">
        <h1 className="text-2xl font-bold mb-2">
          Xin chào{fullName ? `, ${fullName}` : ""}
        </h1>
        <p className="text-gray-600">Hệ thống Quản Lý Kho Hàng</p>
        {role && (
          <p className="mt-2 text-sm text-gray-500">Vai trò: {role}</p>
        )}
        <div className="mt-4 pt-4 border-t text-sm text-gray-500 space-y-1">
          <p>Đăng nhập từ IP: {ipAddress || "Đang tải..."}</p>
          <p>Thời gian đăng nhập: {loginTime || "Đang tải..."}</p>
          <p>Phiên làm việc: {sessionDuration || "Đang tải..."}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-8">
        <p className="text-gray-700">
          Chọn một chức năng từ thanh menu bên trái hoặc các mục bên dưới để
          bắt đầu.
        </p>
      </div>

      <h2 className="text-xl font-bold mb-4">Thao tác nhanh</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.link}
            to={action.link}
            className="block bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
            <p className="text-gray-600 text-sm">{action.description}</p>
          </Link>
        ))}
      </div>

      {role === "Admin" && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Quản trị hệ thống</h2>
          <Link
            to="/admin/nhanvien"
            className="block bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-2">Quản Lý Nhân Viên</h3>
            <p className="text-gray-600 text-sm">
              Thêm, sửa, xóa và phân quyền nhân viên trong hệ thống
            </p>
          </Link>
        </div>
      )}

      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Thông tin hệ thống</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Phiên bản</p>
            <p className="font-medium">WMS v1.0.0</p>
          </div>
          <div>
            <p className="text-gray-500">Ngày hiện tại</p>
            <p className="font-medium">
              {new Date().toLocaleDateString("vi-VN")}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Trạng thái</p>
            <p className="font-medium text-green-600">Hoạt động</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;