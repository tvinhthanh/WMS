import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { Plus, Eye, Edit, CheckCircle, Download, XCircle } from "lucide-react";
import { pickingService } from "../../../services/picking.service";
import { PickingOrderDTO } from "../../../types";
import PickingOrderModal from "./PickingOrderModal";
import PickingDetailModal from "./PickingDetailModal";
import { exportToExcel } from "../../../utils/excelExport";
import { extractDataFromResponse, extractPaginationFromResponse } from "../../../utils/pagination";
import { formatDate } from "../../../utils/dateUtils";
import Pagination from "../../../components/Pagination";

const PickingPage = () => {
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const [selectedOrder, setSelectedOrder] =
        useState<(PickingOrderDTO & { __mode?: "view" | "items" | "create" }) | null>(null);

    const queryClient = useQueryClient();

    const [page, setPage] = useState(1);
    const pageSize = 50;

    const { data: response, isLoading } = useQuery(
        ["pickings", page],
        () => pickingService.getAll(page, pageSize),
        {
            onError: () => {
                // Error handling is done by React Query
            }
        }
    );

    // Extract data và pagination từ response
    const orders = extractDataFromResponse<PickingOrderDTO>(response);
    const pagination = extractPaginationFromResponse(response);

    const completeMutation = useMutation(pickingService.complete, {
        onSuccess: () => {
            queryClient.invalidateQueries("pickings");
            queryClient.invalidateQueries("product-series"); // Refresh serial numbers
            queryClient.invalidateQueries("inventories"); // Refresh inventory
            alert("Hoàn tất phiếu xuất thành công!");
        },
        onError: (error: any) => {
            // Lấy message từ error response hoặc error message
            let errorMessage = "Đã xảy ra lỗi khi hoàn tất phiếu xuất";
            
            if (error?.response?.data) {
                // Backend trả về string trực tiếp
                if (typeof error.response.data === "string") {
                    errorMessage = error.response.data;
                } 
                // Hoặc object có message
                else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            } else if (error?.message) {
                errorMessage = error.message;
            }
            
            alert(`Lỗi: ${errorMessage}`);
        }
    });

    const cancelMutation = useMutation(pickingService.cancel, {
        onSuccess: () => {
            queryClient.invalidateQueries("pickings");
            alert("Hủy phiếu xuất thành công!");
        },
        onError: (error: any) => {
            let errorMessage = "Đã xảy ra lỗi khi hủy phiếu xuất";
            
            if (error?.response?.data) {
                if (typeof error.response.data === "string") {
                    errorMessage = error.response.data;
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            } else if (error?.message) {
                errorMessage = error.message;
            }
            
            alert(`Lỗi: ${errorMessage}`);
        }
    });

    const handleCreateOrder = () => {
        setSelectedOrder({ __mode: "create" } as any);
        setIsOrderModalOpen(true);
    };

    const handleViewOrder = (order: PickingOrderDTO) => {
        setSelectedOrder({ ...order, __mode: "view" });
        setIsOrderModalOpen(true);
    };

    const handleManageItems = (order: PickingOrderDTO) => {
        setSelectedOrder({ ...order, __mode: "items" });
        setIsDetailModalOpen(true);
    };

    const handleExportExcel = async () => {
        try {
            const exportData = orders.map((order) => ({
                "Mã phiếu": order.orderCode || "",
                "Nhà phân phối": order.partnerName || "",
                "Người tạo": getUserName(order),
                "Ngày tạo": order.createDate ? formatDate(order.createDate) : "",
                "Ngày xuất": order.pickedDate ? formatDate(order.pickedDate) : "",
                "Trạng thái": formatStatus(order.status),
                "Số sản phẩm": order.details?.length || 0,
                "Ghi chú": ""
            }));

            await exportToExcel(exportData, `BaoCaoXuatHang_${new Date().toISOString().split("T")[0]}`, "Xuất hàng");
        } catch (error) {
            alert("Có lỗi xảy ra khi xuất file Excel.");
        }
    };

    const handleComplete = (id: number) => {
        if (confirm("Xác nhận hoàn tất phiếu xuất? Hành động này sẽ trừ hàng trong kho.")) {
            completeMutation.mutate(id);
        }
    };

    const handleCancel = (id: number) => {
        if (confirm("Bạn có chắc chắn muốn hủy phiếu xuất này?")) {
            cancelMutation.mutate(id);
        }
    };


    // Helper để format trạng thái giống với giao diện
    const formatStatus = (status: string): string => {
        if (status === "Completed") return "Đã hoàn tất";
        if (status === "Cancelled") return "Đã hủy";
        return "Chờ xử lý";
    };

    // Type-safe helper to get user display name
    const getUserName = (order: PickingOrderDTO): string => {
        // Cast to any to safely check for createByUser property
        const orderWithUser = order as any;

        if (orderWithUser.createByUser) {
            return orderWithUser.createByUser.fullName ||
                orderWithUser.createByUser.username ||
                `User #${order.createByUser?.userId}`;
        }

        return `User #${order.createByUser?.userId}`;
    };

    return (
        <div className="max-w-6xl mx-auto p-2 sm:p-4">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold">Phiếu Xuất Kho</h1>

                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition w-full sm:w-auto justify-center"
                    >
                        <Download className="w-4 h-4" />
                        <span className="text-sm sm:text-base">Xuất Excel</span>
                    </button>
                    <button
                        onClick={handleCreateOrder}
                        className="flex items-center gap-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition w-full sm:w-auto justify-center"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm sm:text-base">Tạo Phiếu Xuất</span>
                    </button>
                </div>
            </div>

            {/* LIST */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500">Đang tải...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500">Chưa có phiếu xuất nào</p>
                        <button
                            onClick={handleCreateOrder}
                            className="mt-4 text-blue-600 hover:underline"
                        >
                            Tạo phiếu xuất đầu tiên
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-3 text-left font-semibold">Mã phiếu</th>
                                    <th className="p-3 text-left font-semibold">Người tạo</th>
                                    <th className="p-3 text-left font-semibold">Ngày tạo</th>
                                    <th className="p-3 text-left font-semibold">Ngày xuất</th>
                                    <th className="p-3 text-left font-semibold">Trạng thái</th>
                                    <th className="p-3 text-center font-semibold">Số SP</th>
                                    <th className="p-3 text-right font-semibold">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr
                                        key={order.pickingOrderId}
                                        className="border-b hover:bg-gray-50 transition"
                                    >
                                        <td className="p-3 font-mono text-sm">
                                            {order.orderCode}
                                        </td>
                                        <td className="p-3">
                                            {getUserName(order)}
                                        </td>
                                        <td className="p-3 text-sm">
                                            {formatDate(order.createDate)}
                                        </td>
                                        <td className="p-3 text-sm text-gray-600">
                                            {order.pickedDate ? formatDate(order.pickedDate) : "—"}
                                        </td>
                                        <td className="p-3">
                                            <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === "Completed"
                                                        ? "bg-green-100 text-green-700"
                                                        : order.status === "Cancelled"
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                }`}
                                            >
                                                {order.status === "Completed" 
                                                    ? "Đã hoàn tất" 
                                                    : order.status === "Cancelled"
                                                    ? "Đã hủy"
                                                    : "Chờ xử lý"}
                                            </span>
                                        </td>

                                        <td className="p-3 text-center font-medium">
                                            {order.details?.length || 0}
                                        </td>

                                        <td className="p-3">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewOrder(order)}
                                                    className="p-2 rounded hover:bg-gray-100 transition"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="w-4 h-4 text-gray-600" />
                                                </button>

                                                <button
                                                    onClick={() => handleManageItems(order)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                                                    title="Quản lý sản phẩm"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>

                                                {order.status === "Pending" && (
                                                    <>
                                                        <button
                                                            onClick={() => handleCancel(order.pickingOrderId)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                                                            title="Hủy phiếu xuất"
                                                            disabled={cancelMutation.isLoading}
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleComplete(order.pickingOrderId)}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded transition disabled:opacity-50"
                                                            title="Hoàn tất phiếu xuất"
                                                            disabled={completeMutation.isLoading}
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3">
                            {orders.map((order) => (
                                <div
                                    key={order.pickingOrderId}
                                    className="bg-white border rounded-lg p-4 shadow-sm"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-mono text-sm font-semibold text-gray-900">
                                                {order.orderCode}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {getUserName(order)}
                                            </p>
                                        </div>
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === "Completed"
                                                    ? "bg-green-100 text-green-700"
                                                    : order.status === "Cancelled"
                                                    ? "bg-red-100 text-red-700"
                                                    : "bg-yellow-100 text-yellow-700"
                                            }`}
                                        >
                                            {order.status === "Completed" 
                                                ? "Đã hoàn tất" 
                                                : order.status === "Cancelled"
                                                ? "Đã hủy"
                                                : "Chờ xử lý"}
                                        </span>
                                    </div>

                                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                                        <div className="flex justify-between">
                                            <span>Ngày tạo:</span>
                                            <span>{formatDate(order.createDate)}</span>
                                        </div>
                                        {order.pickedDate && (
                                            <div className="flex justify-between">
                                                <span>Ngày xuất:</span>
                                                <span>{formatDate(order.pickedDate)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span>Số sản phẩm:</span>
                                            <span className="font-medium">{order.details?.length || 0}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-3 border-t">
                                        <button
                                            onClick={() => handleViewOrder(order)}
                                            className="flex-1 flex items-center justify-center gap-1 p-2 rounded border border-gray-300 hover:bg-gray-50 transition text-sm"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Xem
                                        </button>

                                        <button
                                            onClick={() => handleManageItems(order)}
                                            className="flex-1 flex items-center justify-center gap-1 p-2 rounded border border-blue-300 text-blue-600 hover:bg-blue-50 transition text-sm"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Sửa
                                        </button>

                                        {order.status === "Pending" && (
                                            <>
                                                <button
                                                    onClick={() => handleCancel(order.pickingOrderId)}
                                                    className="flex-1 flex items-center justify-center gap-1 p-2 rounded border border-red-300 text-red-600 hover:bg-red-50 transition text-sm disabled:opacity-50"
                                                    disabled={cancelMutation.isLoading}
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Hủy
                                                </button>
                                                <button
                                                    onClick={() => handleComplete(order.pickingOrderId)}
                                                    className="flex-1 flex items-center justify-center gap-1 p-2 rounded border border-green-300 text-green-600 hover:bg-green-50 transition text-sm disabled:opacity-50"
                                                    disabled={completeMutation.isLoading}
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Hoàn tất
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* PAGINATION */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="mt-4 p-4">
                        <Pagination
                            page={pagination.page}
                            pages={pagination.totalPages}
                            onPageChange={(newPage) => setPage(newPage)}
                        />
                    </div>
                )}
            </div>

            {/* MODALS */}
            <PickingOrderModal
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                order={selectedOrder && selectedOrder.__mode !== "items"
                    ? (selectedOrder as PickingOrderDTO & { __mode?: "view" | "create" })
                    : null}
            />

            <PickingDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                order={selectedOrder && selectedOrder.__mode === "items"
                    ? (selectedOrder as PickingOrderDTO & { __mode?: "items" })
                    : null}
            />
        </div>
    );
};

export default PickingPage;