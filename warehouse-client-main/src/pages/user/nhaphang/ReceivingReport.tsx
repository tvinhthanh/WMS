/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useQuery } from "react-query";
import { Download, Calendar, FileText } from "lucide-react";
import { receivingService } from "../../../services/receiving.service";
import { ReceivingReportDTO } from "../../../types";
import { exportToExcel } from "../../../utils/excelExport";

const ReceivingReport = () => {
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");

    // Set default: tháng hiện tại
    const getDefaultFromDate = () => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    };

    const getDefaultToDate = () => {
        return new Date().toISOString().split("T")[0];
    };

    const [defaultFromDate] = useState(getDefaultFromDate());
    const [defaultToDate] = useState(getDefaultToDate());

    const { data: reportData = [], isLoading, refetch } = useQuery(
        ["receiving-report", fromDate || defaultFromDate, toDate || defaultToDate],
        () => receivingService.getReport(
            fromDate || defaultFromDate,
            toDate || defaultToDate
        ),
        {
            enabled: true,
            refetchOnWindowFocus: false
        }
    );

    const handleSearch = () => {
        refetch();
    };

    const handleExportExcel = async () => {
        try {
        const exportData: any[] = [];

        reportData.forEach((receiving: ReceivingReportDTO) => {
            receiving.details.forEach((detail) => {
                exportData.push({
                    "Mã phiếu": receiving.orderCode || "",
                    "Ngày nhập": receiving.receivedDate 
                        ? new Date(receiving.receivedDate).toLocaleDateString("vi-VN") 
                        : "",
                    "Ngày tạo": receiving.createdDate 
                        ? new Date(receiving.createdDate).toLocaleDateString("vi-VN") 
                        : "",
                    "Nhà cung cấp": receiving.partnerName || "",
                    "Mã giao hàng": receiving.deliveryCode || "",
                    "Người tạo": receiving.userName || "",
                    "Sản phẩm": detail.productName || "",
                    "Mã SP": detail.productCode || "",
                    "SL dự kiến": detail.quantity || 0,
                    "SL thực tế": detail.actualQuantity || 0,
                    "SL hàng lỗi": detail.damageQuantity || 0,
                    "Lý do lỗi": detail.damageReason || "",
                    "Đơn vị": detail.unit || "",
                    "Đơn giá": detail.price || 0,
                    "Thành tiền": detail.totalAmount || 0,
                    "Trạng thái": receiving.status === 1 ? "Hoàn tất" : "Chờ xử lý",
                    "Ghi chú": receiving.note || ""
                });
            });
        });

        const dateRange = `${fromDate || defaultFromDate}_${toDate || defaultToDate}`;
            await exportToExcel(exportData, `BaoCaoNhapHang_${dateRange}`, "Thống kê nhập hàng");
        } catch (error) {
            console.error("Lỗi khi xuất Excel:", error);
            alert("Có lỗi xảy ra khi xuất file Excel.");
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const formatVND = (value: number) => {
        return value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
    };

    const totalAmount = reportData.reduce((sum: number, r: ReceivingReportDTO) => {
        return sum + r.details.reduce((detailSum: number, d) => detailSum + d.totalAmount, 0);
    }, 0);

    return (
        <div className="max-w-7xl mx-auto p-2 sm:p-4">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                    <FileText className="w-6 h-6" />
                    Thống Kê Nhập Hàng
                </h1>

                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition w-full sm:w-auto justify-center"
                        disabled={reportData.length === 0}
                    >
                        <Download className="w-4 h-4" />
                        <span className="text-sm sm:text-base">Xuất Excel</span>
                    </button>
                </div>
            </div>

            {/* FILTER */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Từ ngày
                        </label>
                        <input
                            type="date"
                            className="w-full border p-2 rounded"
                            value={fromDate || defaultFromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Đến ngày
                        </label>
                        <input
                            type="date"
                            className="w-full border p-2 rounded"
                            value={toDate || defaultToDate}
                            onChange={(e) => setToDate(e.target.value)}
                            max={new Date().toISOString().split("T")[0]}
                        />
                    </div>
                    <div>
                        <button
                            onClick={handleSearch}
                            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        >
                            Tìm kiếm
                        </button>
                    </div>
                </div>
            </div>

            {/* SUMMARY */}
            {reportData.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Tổng số phiếu nhập:</span>
                            <p className="font-bold text-lg">{reportData.length}</p>
                        </div>
                        <div>
                            <span className="text-gray-600">Tổng số sản phẩm:</span>
                            <p className="font-bold text-lg">
                                {reportData.reduce((sum: number, r: ReceivingReportDTO) => sum + r.details.length, 0)}
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-600">Tổng thành tiền:</span>
                            <p className="font-bold text-lg text-green-600">{formatVND(totalAmount)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* TABLE */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500">Đang tải...</p>
                    </div>
                ) : reportData.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500">Không có dữ liệu trong khoảng thời gian đã chọn</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-3 text-left">Mã phiếu</th>
                                        <th className="p-3 text-left">Ngày nhập</th>
                                        <th className="p-3 text-left">Nhà cung cấp</th>
                                        <th className="p-3 text-left">Người tạo</th>
                                        <th className="p-3 text-center">Số SP</th>
                                        <th className="p-3 text-right">Thành tiền</th>
                                        <th className="p-3 text-center">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((receiving: ReceivingReportDTO) => (
                                        <tr key={receiving.receivingId} className="border-t hover:bg-gray-50">
                                            <td className="p-3 font-mono text-sm">{receiving.orderCode}</td>
                                            <td className="p-3 text-sm">{formatDate(receiving.receivedDate)}</td>
                                            <td className="p-3">{receiving.partnerName}</td>
                                            <td className="p-3">{receiving.userName}</td>
                                            <td className="p-3 text-center font-medium">{receiving.details.length}</td>
                                            <td className="p-3 text-right font-medium text-green-600">
                                                {formatVND(receiving.details.reduce((sum, d) => sum + d.totalAmount, 0))}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span
                                                    className={`px-2 py-1 rounded text-xs ${
                                                        receiving.status === 1
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-yellow-100 text-yellow-700"
                                                    }`}
                                                >
                                                    {receiving.status === 1 ? "Hoàn tất" : "Chờ xử lý"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3 p-3">
                            {reportData.map((receiving: ReceivingReportDTO) => (
                                <div key={receiving.receivingId} className="border rounded-lg p-4 bg-white">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-mono text-sm font-semibold">{receiving.orderCode}</p>
                                            <p className="text-xs text-gray-500 mt-1">{receiving.partnerName}</p>
                                        </div>
                                        <span
                                            className={`px-2 py-1 rounded text-xs ${
                                                receiving.status === 1
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-yellow-100 text-yellow-700"
                                            }`}
                                        >
                                            {receiving.status === 1 ? "Hoàn tất" : "Chờ xử lý"}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1 mb-3">
                                        <p>Ngày nhập: {formatDate(receiving.receivedDate)}</p>
                                        <p>Người tạo: {receiving.userName}</p>
                                        <p>Số sản phẩm: {receiving.details.length}</p>
                                        <p className="font-medium text-green-600">
                                            Thành tiền: {formatVND(receiving.details.reduce((sum, d) => sum + d.totalAmount, 0))}
                                        </p>
                                    </div>
                                    {receiving.details.length > 0 && (
                                        <details className="mt-2">
                                            <summary className="cursor-pointer text-sm font-medium text-blue-600">
                                                Xem chi tiết ({receiving.details.length} sản phẩm)
                                            </summary>
                                            <div className="mt-2 space-y-2">
                                                {receiving.details.map((detail, idx) => (
                                                    <div key={idx} className="border-t pt-2 text-xs">
                                                        <p className="font-medium">{detail.productName}</p>
                                                        <p className="text-gray-600">
                                                            SL: {detail.actualQuantity} | 
                                                            Hư: {detail.damageQuantity || 0} | 
                                                            {formatVND(detail.totalAmount)}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </details>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ReceivingReport;

