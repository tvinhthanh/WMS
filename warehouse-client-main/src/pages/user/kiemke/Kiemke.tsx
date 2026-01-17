import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { Plus, Eye, CheckCircle, Trash2, ClipboardList, Download, Send, AlertTriangle } from "lucide-react";
import { stockTakeService } from "../../../services/stocktake.service";
import { damageService } from "../../../services/damage.service";
import { useAppContext } from "../../../contexts/AppContext";
import { PendingDamageSummaryDTO, StockTakeDTO } from "../../../types";
import KiemkeModal from "./KiemkeModal";
import { exportToExcel } from "../../../utils/excelExport";

const Kiemke = () => {
    const queryClient = useQueryClient();
    const { role } = useAppContext();
    const isAdmin = role === "Admin" || role === "admin";
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStockTake, setSelectedStockTake] = useState<StockTakeDTO | null>(null);

    const { data: stockTakes = [], isLoading } = useQuery(
        "stockTakes",
        stockTakeService.getAll
    );

    const { data: pendingDamages = [] } = useQuery<PendingDamageSummaryDTO[]>(
        "pending-damages",
        damageService.getPending,
        {
            refetchOnWindowFocus: false,
            refetchInterval: 30000
        }
    );

    const submitMutation = useMutation(stockTakeService.submit, {
        onSuccess: () => {
            queryClient.invalidateQueries("stockTakes");
            alert("Đã gửi báo cáo kiểm kê cho admin duyệt!");
        },
        onError: (error: any) => {
            let errorMessage = "Đã xảy ra lỗi khi gửi báo cáo";
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

    const reviewMutation = useMutation(stockTakeService.review, {
        onSuccess: (data: any) => {
            queryClient.invalidateQueries("stockTakes");
            queryClient.invalidateQueries("inventories");
            if (data?.returnPickingOrderId) {
                alert("Đã duyệt kiểm kê thành công! Đã tự động tạo phiếu xuất trả hàng hư hỏng.");
            } else {
                alert("Đã duyệt kiểm kê thành công! Tồn kho đã được điều chỉnh.");
            }
        },
        onError: (error: any) => {
            let errorMessage = "Đã xảy ra lỗi khi duyệt kiểm kê";
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

    const deleteMutation = useMutation(stockTakeService.delete, {
        onSuccess: () => {
            queryClient.invalidateQueries("stockTakes");
            alert("Đã xóa phiếu kiểm kê");
        },
        onError: (error: any) => {
            alert(`Lỗi: ${error?.response?.data || error.message}`);
        }
    });

    const handleCreate = () => {
        setSelectedStockTake(null);
        setIsModalOpen(true);
    };

    const handleView = (stockTake: StockTakeDTO) => {
        setSelectedStockTake(stockTake);
        setIsModalOpen(true);
    };

    const handleSubmit = (id: number) => {
        if (confirm("Xác nhận gửi báo cáo kiểm kê cho admin duyệt?")) {
            submitMutation.mutate(id);
        }
    };

    const handleReview = (id: number) => {
        if (confirm("Xác nhận duyệt báo cáo kiểm kê? Hệ thống sẽ so sánh với tồn kho, điều chỉnh và tự động tạo phiếu xuất trả nếu có hàng hư hỏng.")) {
            reviewMutation.mutate(id);
        }
    };

    const handleDelete = (id: number) => {
        if (confirm("Xác nhận xóa phiếu kiểm kê?")) {
            deleteMutation.mutate(id);
        }
    };

    const handleExportExcel = async () => {
        try {
        const exportData = stockTakes.map((st: StockTakeDTO) => ({
            "Mã phiếu": st.stockTakeCode || "",
            "Ngày kiểm kê": st.stockTakeDate ? new Date(st.stockTakeDate).toLocaleDateString("vi-VN") : "",
            "Người tạo": st.createdByUserName || "",
            "Trạng thái": st.status === "Completed" ? "Đã hoàn tất" : "Chờ xử lý",
            "Số sản phẩm": st.details?.length || 0,
            "Ghi chú": st.note || ""
        }));

            await exportToExcel(exportData, `BaoCaoKiemKe_${new Date().toISOString().split("T")[0]}`, "Kiểm kê");
        } catch (error) {
            console.error("Lỗi khi xuất Excel:", error);
            alert("Có lỗi xảy ra khi xuất file Excel.");
        }
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

    return (
        <div className="max-w-7xl mx-auto p-2 sm:p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                    <ClipboardList className="w-6 h-6" />
                    Kiểm Kê Kho
                </h1>

                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition w-full sm:w-auto justify-center"
                    >
                        <Download className="w-4 h-4" />
                        <span className="text-sm sm:text-base">Xuất Excel</span>
                    </button>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition w-full sm:w-auto justify-center"
                    >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm sm:text-base">Tạo phiếu kiểm kê</span>
                </button>
            </div>
            </div>

            {/* Pending damage - chỉ admin thấy bảng chi tiết */}
            {isAdmin && pendingDamages.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-semibold text-amber-700 mb-2">
                                Hàng hư đang tích lũy để xuất trả nhà cung cấp
                            </p>
                            <div className="overflow-x-auto bg-white rounded-md border border-amber-100">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-amber-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-semibold text-gray-700">Sản phẩm</th>
                                            <th className="px-3 py-2 text-left font-semibold text-gray-700">Nhà cung cấp</th>
                                            <th className="px-3 py-2 text-center font-semibold text-gray-700">SL hư / Ngưỡng</th>
                                            <th className="px-3 py-2 text-left font-semibold text-gray-700">Ngày nhập đầu tiên</th>
                                            <th className="px-3 py-2 text-left font-semibold text-gray-700">Lần ghi hư gần nhất</th>
                                            <th className="px-3 py-2 text-left font-semibold text-gray-700">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingDamages.map((p) => {
                                            const reached = p.totalPending >= p.threshold;
                                            return (
                                                <tr key={`${p.partnerId}-${p.productId}`} className="border-t border-amber-100">
                                                    <td className="px-3 py-2 font-medium text-gray-800">{p.productName}</td>
                                                    <td className="px-3 py-2 text-gray-700">{p.partnerName}</td>
                                                    <td className="px-3 py-2 text-center">
                                                        <span className="font-semibold text-amber-700">
                                                            {p.totalPending}/{p.threshold}
                                                        </span>
                                                        <span className="text-xs text-gray-500 ml-1">sp hư</span>
                                                    </td>
                                                    <td className="px-3 py-2 text-gray-600">
                                                        {p.earliestReceivedDate
                                                            ? new Date(p.earliestReceivedDate).toLocaleDateString("vi-VN")
                                                            : "-"}
                                                    </td>
                                                    <td className="px-3 py-2 text-gray-600">
                                                        {p.latestDamageDate
                                                            ? new Date(p.latestDamageDate).toLocaleDateString("vi-VN")
                                                            : "-"}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {reached ? (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                                Đã đạt ngưỡng, hệ thống sẽ tự tạo phiếu xuất trả
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                                Còn thiếu {p.threshold - p.totalPending} sp để đạt ngưỡng
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500">Đang tải...</p>
                    </div>
                ) : stockTakes.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500">Chưa có phiếu kiểm kê nào</p>
                        <button
                            onClick={handleCreate}
                            className="mt-4 text-blue-600 hover:underline"
                        >
                            Tạo phiếu kiểm kê đầu tiên
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="p-3 text-left font-semibold">Mã phiếu</th>
                                        <th className="p-3 text-left font-semibold">Ngày kiểm kê</th>
                                        <th className="p-3 text-left font-semibold">Người tạo</th>
                                        <th className="p-3 text-left font-semibold">Trạng thái</th>
                                        <th className="p-3 text-center font-semibold">Số SP</th>
                                        <th className="p-3 text-right font-semibold">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stockTakes.map((st) => (
                                        <tr key={st.stockTakeId} className="border-b hover:bg-gray-50 transition">
                                            <td className="p-3 font-mono text-sm">{st.stockTakeCode}</td>
                                            <td className="p-3 text-sm">{formatDate(st.stockTakeDate)}</td>
                                            <td className="p-3">{st.createdByUserName}</td>
                                            <td className="p-3">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${st.status === "Completed"
                                                            ? "bg-green-100 text-green-700"
                                                        : st.status === "Submitted"
                                                            ? "bg-blue-100 text-blue-700"
                                                            : "bg-yellow-100 text-yellow-700"
                                                    }`}
                                                >
                                                    {st.status === "Completed"
                                                        ? "Đã hoàn tất"
                                                        : st.status === "Submitted"
                                                            ? "Đã gửi"
                                                            : "Chờ xử lý"}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center font-medium">
                                                {st.details?.length || 0}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleView(st)}
                                                        className="p-2 rounded hover:bg-gray-100 transition"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                    {st.status === "Pending" && (
                                                        <>
                                                            {!isAdmin ? (
                                                            <button
                                                                    onClick={() => handleSubmit(st.stockTakeId)}
                                                                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition disabled:opacity-50 border border-blue-200"
                                                                    title="Gửi báo cáo cho admin duyệt"
                                                                    disabled={submitMutation.isLoading}
                                                            >
                                                                    <Send className="w-4 h-4" />
                                                                    <span>Gửi</span>
                                                            </button>
                                                            ) : (
                                                                <span className="text-xs text-gray-500 px-2">Chờ nhân viên gửi</span>
                                                            )}
                                                            <button
                                                                onClick={() => handleDelete(st.stockTakeId)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                                                                title="Xóa"
                                                                disabled={deleteMutation.isLoading}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {st.status === "Submitted" && (
                                                        <>
                                                            {isAdmin ? (
                                                                <button
                                                                    onClick={() => handleReview(st.stockTakeId)}
                                                                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded transition disabled:opacity-50 border border-green-200"
                                                                    title="Duyệt báo cáo - Hệ thống sẽ so sánh và điều chỉnh tồn kho"
                                                                    disabled={reviewMutation.isLoading}
                                                                >
                                                                    <CheckCircle className="w-4 h-4" />
                                                                    <span>Duyệt</span>
                                                                </button>
                                                            ) : (
                                                                <span className="text-xs text-gray-500 px-2">Chờ admin duyệt</span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="md:hidden space-y-3 p-3">
                            {stockTakes.map((st) => (
                                <div key={st.stockTakeId} className="bg-white border rounded-lg p-4 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-mono text-sm font-semibold">{st.stockTakeCode}</p>
                                            <p className="text-xs text-gray-500 mt-1">{st.createdByUserName}</p>
                                        </div>
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${st.status === "Completed"
                                                    ? "bg-green-100 text-green-700"
                                                : st.status === "Submitted"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "bg-yellow-100 text-yellow-700"
                                            }`}
                                        >
                                            {st.status === "Completed"
                                                ? "Đã hoàn tất"
                                                : st.status === "Submitted"
                                                    ? "Đã gửi"
                                                    : "Chờ xử lý"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
                                        <span>{formatDate(st.stockTakeDate)}</span>
                                        <span className="font-medium">{st.details?.length || 0} sản phẩm</span>
                                    </div>
                                    <div className="flex gap-2 pt-3 border-t">
                                        <button
                                            onClick={() => handleView(st)}
                                            className="flex-1 flex items-center justify-center gap-1 p-2 rounded border border-gray-300 hover:bg-gray-50 transition text-sm"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Xem
                                        </button>
                                        {st.status === "Pending" && (
                                            <>
                                                {!isAdmin ? (
                                                <button
                                                        onClick={() => handleSubmit(st.stockTakeId)}
                                                        className="flex-1 flex items-center justify-center gap-1 p-2 rounded border border-blue-300 text-blue-600 hover:bg-blue-50 transition text-sm disabled:opacity-50"
                                                        disabled={submitMutation.isLoading}
                                                >
                                                        <Send className="w-4 h-4" />
                                                        Gửi
                                                </button>
                                                ) : (
                                                    <div className="flex-1 text-xs text-gray-500 text-center py-2">
                                                        Chờ nhân viên gửi
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(st.stockTakeId)}
                                                    className="flex-1 flex items-center justify-center gap-1 p-2 rounded border border-red-300 text-red-600 hover:bg-red-50 transition text-sm disabled:opacity-50"
                                                    disabled={deleteMutation.isLoading}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Xóa
                                                </button>
                                            </>
                                        )}
                                        {st.status === "Submitted" && (
                                            <>
                                                {isAdmin ? (
                                                    <button
                                                        onClick={() => handleReview(st.stockTakeId)}
                                                        className="flex-1 flex items-center justify-center gap-1 p-2 rounded border border-green-300 text-green-600 hover:bg-green-50 transition text-sm disabled:opacity-50"
                                                        disabled={reviewMutation.isLoading}
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                        Duyệt
                                                    </button>
                                                ) : (
                                                    <div className="flex-1 text-xs text-gray-500 text-center py-2">
                                                        Chờ admin duyệt
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <KiemkeModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedStockTake(null);
                }}
                stockTake={selectedStockTake}
            />
        </div>
    );
};

export default Kiemke;

