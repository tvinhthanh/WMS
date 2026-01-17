import { useEffect } from "react";
import { useQuery } from "react-query";
import { X } from "lucide-react";
import { loginService } from "../../../services/login.service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: number | null;
  userName?: string;
}
// lịch sử đăng nhập, gọi từ login.Service để lấy dữ liệu
const LoginHistory = ({ isOpen, onClose, userId, userName }: Props) => {
  const enabled = Boolean(isOpen && userId);

  const { data = [], isLoading, isError, refetch } = useQuery(
    ["loginHistory", userId],
    () => loginService.getUserHistory(userId as number),
    { enabled }
  );

  useEffect(() => {
    if (enabled) refetch();
  }, [enabled]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl relative max-h-[80vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-6 pt-6 pb-3">
          <h2 className="text-xl font-bold">Lịch sử đăng nhập</h2>
          {userName && (
            <p className="text-sm text-gray-500 mt-1">Nhân viên: <b>{userName}</b></p>
          )}
        </div>

        <div className="px-6 overflow-y-auto max-h-[60vh] pb-4">
          {isLoading && <div className="p-4">Đang tải...</div>}
          {isError && <div className="p-4 text-red-500">Lỗi khi tải lịch sử</div>}

          {!isLoading && data.length === 0 && (
            <div className="p-6 text-gray-500">Chưa có hoạt động đăng nhập</div>
          )}

          {data.length > 0 && (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-sm">Thời gian</th>
                  <th className="p-3 text-left text-sm">IP</th>
                  <th className="p-3 text-left text-sm">Thiết bị / UserAgent</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row: any, idx: number) => (
                  <tr key={idx} className="border-t hover:bg-gray-50">
                    <td className="p-3 text-sm">
                      {row.loginTime ? new Date(row.loginTime).toLocaleString("vi-VN") : "--"}
                    </td>
                    <td className="p-3 text-sm">{row.ipAddress || "--"}</td>
                    <td className="p-3 text-sm break-words">{row.userAgent || "--"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-4 flex justify-end gap-3 border-t">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginHistory;
