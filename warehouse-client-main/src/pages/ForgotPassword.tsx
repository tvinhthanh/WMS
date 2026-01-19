import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userService } from "../services/user.service";
import Toast from "../components/Toast";

// Quên mật khẩu - User gửi request, Admin sẽ xử lý
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loginInfo, setLoginInfo] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Handle submit request
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginInfo.trim()) {
      setToast({ type: "error", message: "Vui lòng nhập thông tin đăng nhập" });
      return;
    }

    setLoading(true);
    try {
      const response = await userService.requestPasswordReset(loginInfo.trim());
      setToast({ type: "success", message: response.message });
      setSubmitted(true);
    } catch (error: any) {
      setToast({
        type: "error",
        message: error.response?.data?.message || error.message || "Lỗi khi gửi yêu cầu reset mật khẩu",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Quên Mật Khẩu</h1>
          <p className="text-gray-600">
            {submitted 
              ? "Yêu cầu của bạn đã được gửi. Admin sẽ xử lý và reset mật khẩu về mặc định."
              : "Nhập thông tin đăng nhập để gửi yêu cầu reset mật khẩu"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {submitted ? (
            // Success message
            <div className="space-y-6 text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <span className="font-semibold"> Yêu cầu đã được gửi!</span>
                </p>
                <p className="text-sm text-green-700 mt-2">
                  Admin sẽ xem xét và xử lý yêu cầu của bạn. Sau khi được duyệt, mật khẩu sẽ được reset về mặc định: <span className="font-bold">123456</span>
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate("/sign-in")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition duration-200"
                >
                  Quay lại đăng nhập
                </button>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setLoginInfo("");
                  }}
                  className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded-lg transition duration-200"
                >
                  Gửi yêu cầu khác
                </button>
              </div>
            </div>
          ) : (
            // Request Form
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thông tin đăng nhập
                </label>
                <input
                  type="text"
                  value={loginInfo}
                  onChange={(e) => setLoginInfo(e.target.value)}
                  placeholder="Email, Username hoặc Mã nhân viên (VD: NV001)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nhập Email, Username hoặc Mã nhân viên mà bạn dùng để đăng nhập
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition duration-200"
              >
                {loading ? "Đang gửi yêu cầu..." : "Gửi Yêu Cầu Reset Mật Khẩu"}
              </button>

              <div className="text-center mt-4">
                <a
                  href="/sign-in"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Quay lại đăng nhập
                </a>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
