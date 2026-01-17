import { useState } from "react";
import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Download, FileText } from "lucide-react";
import { receivingService } from "../../../services/receiving.service";
import { ReceivingDTO } from "../../../types";
import ReceivingFormModal from "./ReceivingFormModal";
import ReceivingDetailModal from "./ReceivingDetailsModal";
import { exportToExcel } from "../../../utils/excelExport";
import { extractDataFromResponse, extractPaginationFromResponse } from "../../../utils/pagination";
import Pagination from "../../../components/Pagination";

const Nhaphang = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedReceiving, setSelectedReceiving] = useState<ReceivingDTO | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [page, setPage] = useState(1);
    const pageSize = 50;

    const { data: response } = useQuery(
        ["receivings", page],
        () => receivingService.getAll(page, pageSize)
    );

    // Extract data và pagination từ response
    const receivings = extractDataFromResponse<ReceivingDTO>(response);
    const pagination = extractPaginationFromResponse(response);

    const filtered = receivings.filter((r) =>
        r.orderCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleExportExcel = async () => {
        try {
            const exportData = filtered.map((r) => ({
                "Mã phiếu": r.orderCode || "",
                "Mã giao hàng": r.deliveryCode || "",
                "Nhà cung cấp": r.partnerName || "",
                "Ngày tạo": r.createdDate ? new Date(r.createdDate).toLocaleDateString("vi-VN") : "",
                "Trạng thái": r.status || "",
                "Ghi chú": r.note || ""
            }));

            await exportToExcel(exportData, `BaoCaoNhapHang_${new Date().toISOString().split("T")[0]}`, "Nhập hàng");
        } catch (error) {
            alert("Có lỗi xảy ra khi xuất file Excel.");
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-2 sm:p-4">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold">Phiếu Nhập Kho</h1>

                <div className="flex gap-2">
                    <button
                        onClick={() => navigate("/nhaphang/baocao")}
                        className="flex items-center gap-2 bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                    >
                        <FileText className="w-4 h-4" />
                        <span className="text-sm sm:text-base">Thống kê</span>
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                        <Download className="w-4 h-4" />
                        <span className="text-sm sm:text-base">Xuất Excel</span>
                    </button>
                    <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded w-full sm:w-auto justify-center"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm sm:text-base">Tạo phiếu nhập</span>
                </button>
            </div>
            </div>

            {/* FILTER */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Tìm theo mã phiếu..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded"
                    />
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left">ID</th>
                            <th className="p-3 text-left">Mã phiếu</th>
                            <th className="p-3 text-left">Mã giao hàng</th>
                            {/*<th className="p-3 text-left">TEST</th>*/}
                            <th className="p-3 text-left">Ngày nhập</th>
                            <th className="p-3 text-left">Trạng thái</th>
                            <th className="p-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((r) => (
                                <tr key={r.receivingId} className="border-t hover:bg-gray-50">
                                <td className="p-3">{r.receivingId}</td>
                                    <td className="p-3 font-mono text-sm">{r.orderCode}</td>
                                    <td className="p-3 font-mono text-sm">{r.deliveryCode}</td>
                                    {/*<td className="p-3font-mono text-sm">{r.partnerName}{r.orderCode}</td>*/}
                                    <td className="p-3 text-sm">
                                    {new Date(r.receivedDate).toLocaleString("vi-VN")}
                                </td>
                                <td className="p-3">
                                    <span
                                        className={`px-2 py-1 rounded text-xs ${
                                            r.status === 1
                                                ? "bg-green-100 text-green-700"
                                                : r.status === 3
                                                ? "bg-red-100 text-red-700"
                                                : r.status === 2
                                                ? "bg-orange-100 text-orange-700"
                                                : "bg-yellow-100 text-yellow-700"
                                        }`}
                                    >
                                        {r.status === 1 
                                            ? "Đã hoàn tất" 
                                            : r.status === 3 
                                            ? "Đã hủy" 
                                            : r.status === 2
                                            ? "Một phần"
                                            : "Chờ xử lý"}
                                    </span>
                                </td>
                                <td className="p-3 text-right">
                                    <button
                                        onClick={() => {
                                            setSelectedReceiving(r);
                                            setShowDetail(true);
                                        }}
                                            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition text-sm"
                                    >
                                        Chi tiết
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3 p-3">
                    {filtered.map((r) => (
                        <div key={r.receivingId} className="border rounded-lg p-4 bg-white">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-mono text-sm font-semibold">{r.orderCode}</p>
                                    <p className="text-xs text-gray-500 mt-1">ID: {r.receivingId}</p>
                                </div>
                                <span
                                    className={`px-2 py-1 rounded text-xs ${
                                        r.status === 1
                                            ? "bg-green-100 text-green-700"
                                            : r.status === 3
                                            ? "bg-red-100 text-red-700"
                                            : r.status === 2
                                            ? "bg-orange-100 text-orange-700"
                                            : "bg-yellow-100 text-yellow-700"
                                    }`}
                                >
                                        {r.status === 1
                                        ? "Đã hoàn tất" 
                                        : r.status === 3
                                        ? "Đã hủy" 
                                        : r.status === 2
                                        ? "Một phần"
                                        : "Chờ xử lý"}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                                {new Date(r.receivedDate).toLocaleString("vi-VN")}
                            </p>
                            <button
                                onClick={() => {
                                    setSelectedReceiving(r);
                                    setShowDetail(true);
                                }}
                                className="w-full px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 transition text-sm"
                            >
                                Xem chi tiết
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* PAGINATION */}
            {pagination && pagination.totalPages > 1 && (
                <div className="mt-4">
                    <Pagination
                        page={pagination.page}
                        pages={pagination.totalPages}
                        onPageChange={(newPage) => setPage(newPage)}
                    />
                </div>
            )}

            {/* MODALS */}
            <ReceivingFormModal isOpen={showForm} onClose={() => setShowForm(false)} />

            <ReceivingDetailModal
                isOpen={showDetail}
                onClose={() => setShowDetail(false)}
                receiving={selectedReceiving}
            />
        </div>
    );
};

export default Nhaphang;
