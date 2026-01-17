import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import { userService } from "../../../services/user.service";
import { PasswordResetRequestDTO } from "../../../types";
import Toast from "../../../components/Toast";

const PasswordResetRequests = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Fetch password reset requests
  const { data: requests = [], isLoading } = useQuery(
    ["passwordResetRequests", statusFilter],
    () => userService.getPasswordResetRequests(statusFilter || undefined),
    {
      refetchInterval: 30000, // Auto refresh every 30 seconds
    }
  );

  // Process request mutation
  const processMutation = useMutation(
    ({ requestId, action, notes }: { requestId: number; action: "approve" | "reject"; notes?: string }) =>
      userService.processPasswordResetRequest(requestId, action, notes),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(["passwordResetRequests"]);
        setToast({
          type: "success",
          message: data.message || `Đã ${variables.action === "approve" ? "duyệt" : "từ chối"} yêu cầu thành công`,
        });
        setProcessingId(null);
      },
      onError: (error: any) => {
        setToast({
          type: "error",
          message: error.response?.data?.message || error.message || "Lỗi khi xử lý yêu cầu",
        });
        setProcessingId(null);
      },
    }
  );

  const handleProcess = async (requestId: number, action: "approve" | "reject") => {
    const notes = prompt(
      action === "approve"
        ? "Nhập ghi chú (tùy chọn):"
        : "Nhập lý do từ chối (tùy chọn):"
    );

    setProcessingId(requestId);
    processMutation.mutate({
      requestId,
      action,
      notes: notes || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      Pending: (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Chờ xử lý
        </span>
      ),
      Approved: (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Đã duyệt
        </span>
      ),
      Rejected: (
        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Đã từ chối
        </span>
      ),
    };
    return badges[status as keyof typeof badges] || <span>{status}</span>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pendingCount = requests.filter((r) => r.status === "Pending").length;

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Quản Lý Yêu Cầu Reset Mật Khẩu</h1>
        <p className="text-gray-600">Xem và xử lý các yêu cầu reset mật khẩu từ người dùng</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-700">Lọc theo trạng thái:</span>
          <button
            onClick={() => setStatusFilter("")}
            className={`px-3 py-1 rounded text-sm ${
              statusFilter === ""
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Tất cả ({requests.length})
          </button>
          <button
            onClick={() => setStatusFilter("Pending")}
            className={`px-3 py-1 rounded text-sm ${
              statusFilter === "Pending"
                ? "bg-yellow-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Chờ xử lý ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter("Approved")}
            className={`px-3 py-1 rounded text-sm ${
              statusFilter === "Approved"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Đã duyệt
          </button>
          <button
            onClick={() => setStatusFilter("Rejected")}
            className={`px-3 py-1 rounded text-sm ${
              statusFilter === "Rejected"
                ? "bg-red-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Đã từ chối
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Đang tải...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Không có yêu cầu nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Thông tin đăng nhập</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Nhân viên</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Ngày yêu cầu</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Ngày xử lý</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Người xử lý</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Ghi chú</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.passwordResetRequestId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">#{request.passwordResetRequestId}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{request.loginInfo}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {request.userFullName ? (
                        <div>
                          <div className="font-medium">{request.userFullName}</div>
                          {request.userEmployeeCode && (
                            <div className="text-xs text-gray-500">{request.userEmployeeCode}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Không tìm thấy user</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">{getStatusBadge(request.status)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(request.requestDate)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {request.processedDate ? formatDate(request.processedDate) : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {request.processedByUserName || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {request.notes || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {request.status === "Pending" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleProcess(request.passwordResetRequestId, "approve")}
                            disabled={processingId === request.passwordResetRequestId}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Duyệt
                          </button>
                          <button
                            onClick={() => handleProcess(request.passwordResetRequestId, "reject")}
                            disabled={processingId === request.passwordResetRequestId}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" />
                            Từ chối
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
};

export default PasswordResetRequests;
