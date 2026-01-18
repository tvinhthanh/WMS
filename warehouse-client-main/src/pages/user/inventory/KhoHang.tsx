import { useState } from "react";
import { useQuery } from "react-query";
import { Search, Package, History, BarChart3, Calendar, Download, X } from "lucide-react";
import { InventoryDTO, InventoryDetailDTO, InventoryLogDTO, InventorySummaryDTO } from "../../../types";
import { inventoryService } from "../../../services/inventory.service";
import { exportToExcel } from "../../../utils/excelExport";
import { productService } from "../../../services/product.service";
import { extractDataFromResponse, extractPaginationFromResponse } from "../../../utils/pagination";
import { formatDate } from "../../../utils/dateUtils";
import Pagination from "../../../components/Pagination";
// 
type TabType = "summary" | "details" | "movements";

const InventoryPage = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<TabType>("summary");
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split("T")[0]);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // Format: YYYY-MM
    const [inventoryReport, setInventoryReport] = useState<InventorySummaryDTO[]>([]);
    const [reportLoading, setReportLoading] = useState(false);

    const [page, setPage] = useState(1);
    const pageSize = 50;

    // Get all inventories
    const { data: inventoryResponse, isLoading, isError } = useQuery(
        ["inventories", page],
        () => inventoryService.getAll(page, pageSize)
    );

    // Extract data và pagination từ response
    const inventories = extractDataFromResponse<InventoryDTO>(inventoryResponse);
    const inventoryPagination = extractPaginationFromResponse(inventoryResponse);

    // Get products for export
    const { data: productResponse } = useQuery("products", productService.getAll);
    const products = extractDataFromResponse(productResponse);
    
    
    // Get inventory details (FIFO lots) for selected product
    const { data: details = [], isLoading: detailsLoading, isError: detailsError } = useQuery(
        ["inventory-details", selectedProductId],
        () => inventoryService.getDetails(selectedProductId!),
        { 
            enabled: !!selectedProductId && activeTab === "details",
            retry: 1,
            refetchOnWindowFocus: false,
            onError: (error) => {
                console.error("Error loading details:", error);
            }
        }
    );

    // Get movements
    const { data: movements = [], isLoading: movementsLoading, isError: movementsError } = useQuery(
        ["inventory-movements", selectedProductId],
        () => inventoryService.getMovements({ productId: selectedProductId || undefined }),
        { 
            enabled: activeTab === "movements",
            retry: 1,
            refetchOnWindowFocus: false,
            onError: (error) => {
                console.error("Error loading movements:", error);
            }
        }
    );

    // Get summary
    const { data: summary, isLoading: summaryLoading, isError: summaryError } = useQuery(
        ["inventory-summary", selectedProductId, dateFilter],
        () => inventoryService.getSummary({ 
            productId: selectedProductId || undefined,
            date: dateFilter 
        }),
        { 
            enabled: activeTab === "summary",
            retry: 1,
            refetchOnWindowFocus: false,
            onError: (error) => {
                console.error("Error loading summary:", error);
            }
        }
    );

    const filtered = inventories.filter((row) => {
        const product = row.productName?.toLowerCase() || "";
        const search = searchTerm.toLowerCase();
        return product.includes(search);
    });

    const handleExportExcel = async () => {
        try {
            const exportData = filtered.map((inv) => {
                const product = products.find((p) => p.productId === inv.productId);
                return {
                    "Mã sản phẩm": product?.productCode || "",
                    "Tên sản phẩm": inv.productName || "",
                    "Số lượng tồn": inv.quantity,
                    "Đơn vị": product?.unit || "",
                    "Cập nhật lần cuối": inv.lastUpdate ? formatDate(inv.lastUpdate) : ""
                };
            });

            await exportToExcel(exportData, `BaoCaoTonKho_${new Date().toISOString().split("T")[0]}`, "Tồn kho");
        } catch (error) {
            alert("Có lỗi xảy ra khi xuất file Excel.");
        }
    };

    const handleViewReport = async () => {
        setReportLoading(true);
        try {
            // Tính từ đầu tháng đến cuối tháng
            const year = parseInt(selectedMonth.split("-")[0]);
            const month = parseInt(selectedMonth.split("-")[1]);
            const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0];
            const endDate = new Date(year, month, 0).toISOString().split("T")[0]; // Ngày cuối cùng của tháng
            
            const data = await inventoryService.getReport(startDate, endDate);
            setInventoryReport(data);
        } catch (error: any) {
            console.error("Error loading report:", error);
            alert("Lỗi khi tải báo cáo: " + (error?.message || "Unknown error"));
        } finally {
            setReportLoading(false);
        }
    };

    if (isLoading) return <div className="p-4">Đang tải...</div>;
    if (isError) return <div className="p-4 text-red-500">Lỗi khi tải dữ liệu</div>;

    return (
        <div className="max-w-7xl mx-auto p-2 sm:p-4">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold">Quản Lý Kho Hàng</h1>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => setIsReportModalOpen(true)}
                        className="flex items-center gap-2 bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-purple-700 transition w-full sm:w-auto justify-center"
                    >
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-sm sm:text-base">Báo cáo thông tin tồn kho</span>
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition w-full sm:w-auto justify-center"
                    >
                        <Download className="w-4 h-4" />
                        <span className="text-sm sm:text-base">Xuất Excel</span>
                    </button>
                </div>
            </div>

            {/* TABS */}
            <div className="bg-white rounded-lg shadow mb-4 sm:mb-6 overflow-x-auto">
                <div className="border-b">
                    <div className="flex gap-1 p-2 min-w-max sm:min-w-0">
                        <button
                            onClick={() => setActiveTab("summary")}
                            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-t-lg transition text-sm sm:text-base whitespace-nowrap ${
                                activeTab === "summary"
                                    ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                                    : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            <BarChart3 className="w-4 h-4" />
                            <span className="hidden sm:inline">Tổng Quan</span>
                            <span className="sm:hidden">Tổng</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("details")}
                            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-t-lg transition text-sm sm:text-base whitespace-nowrap ${
                                activeTab === "details"
                                    ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                                    : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            <Package className="w-4 h-4" />
                            <span className="hidden sm:inline">FIFO Lots</span>
                            <span className="sm:hidden">FIFO</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("movements")}
                            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-t-lg transition text-sm sm:text-base whitespace-nowrap ${
                                activeTab === "movements"
                                    ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                                    : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            <History className="w-4 h-4" />
                            <span className="hidden sm:inline">Lịch Sử Di Chuyển</span>
                            <span className="sm:hidden">Lịch sử</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* FILTER BAR */}
            <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên sản phẩm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {activeTab === "summary" && (
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* CONTENT BY TAB */}
            {activeTab === "summary" && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    {summaryLoading ? (
                        <div className="p-8 text-center text-gray-500">Đang tải dữ liệu tổng hợp...</div>
                    ) : summaryError ? (
                        <div className="p-8 text-center text-red-500">Lỗi khi tải dữ liệu tổng hợp</div>
                    ) : summary && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {Array.isArray(summary) ? (
                                summary.length > 0 ? (
                                    summary.map((s: InventorySummaryDTO) => (
                                        <div key={s.productId} className="bg-white rounded-lg shadow p-4">
                                            <h3 className="font-semibold text-sm text-gray-600 mb-2">{s.productName}</h3>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span>Tồn đầu:</span>
                                                    <span className="font-medium">{s.beginningBalance}</span>
                                                </div>
                                                <div className="flex justify-between text-green-600">
                                                    <span>Nhập:</span>
                                                    <span className="font-medium">+{s.totalIN}</span>
                                                </div>
                                                <div className="flex justify-between text-red-600">
                                                    <span>Xuất:</span>
                                                    <span className="font-medium">-{s.totalOUT}</span>
                                                </div>
                                                <div className="flex justify-between pt-2 border-t">
                                                    <span className="font-semibold">Tồn cuối:</span>
                                                    <span className="font-bold text-blue-600">{s.endingBalance}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full p-4 text-center text-gray-500">
                                        Chưa có dữ liệu tổng hợp
                                    </div>
                                )
                            ) : (
                                <div className="bg-white rounded-lg shadow p-4">
                                    <h3 className="font-semibold text-sm text-gray-600 mb-2">{(summary as InventorySummaryDTO).productName || "Tổng hợp"}</h3>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span>Tồn đầu:</span>
                                            <span className="font-medium">{(summary as InventorySummaryDTO).beginningBalance}</span>
                                        </div>
                                        <div className="flex justify-between text-green-600">
                                            <span>Nhập:</span>
                                            <span className="font-medium">+{(summary as InventorySummaryDTO).totalIN}</span>
                                        </div>
                                        <div className="flex justify-between text-red-600">
                                            <span>Xuất:</span>
                                            <span className="font-medium">-{(summary as InventorySummaryDTO).totalOUT}</span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t">
                                            <span className="font-semibold">Tồn cuối:</span>
                                            <span className="font-bold text-blue-600">{(summary as InventorySummaryDTO).endingBalance}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Inventory Table */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                    <p className="text-sm text-gray-600">
                        Hiển thị {filtered.length} dòng tồn kho
                    </p>
                </div>

                {filtered.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-4 text-left font-medium">Tên sản phẩm</th>
                                    <th className="p-4 text-right font-medium">Số lượng</th>
                                    <th className="p-4 text-left font-medium">Đơn vị</th>
                                    <th className="p-4 text-left font-medium">Cập nhật</th>
                                    <th className="p-4 text-center font-medium">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((row) => (
                                    <tr key={`inventory-${row.inventoryId || row.productId || Math.random()}`} className="border-t hover:bg-gray-50">
                                        <td className="p-4">{row.productName}</td>
                                        <td className="p-4 text-right font-semibold">{row.quantity}</td>
                                       {/*Dữ liệu lấy từ products theo productId */}
                                        <td className="p-4">{(products.find((p: any) => p.productId === row.productId)?.unit) || "-"}</td>
                                        <td className="p-4 text-gray-500">{row.lastUpdate ? formatDate(row.lastUpdate) : "-"}</td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedProductId(row.productId);
                                                            setActiveTab("details");
                                                        }}
                                                        className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition"
                                                    >
                                                        Xem Lots
                                                    </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        Không có dữ liệu tồn kho phù hợp.
                    </div>
                )}

                {/* PAGINATION */}
                {inventoryPagination && inventoryPagination.totalPages > 1 && (
                    <div className="mt-4 p-4">
                        <Pagination
                            page={inventoryPagination.page}
                            pages={inventoryPagination.totalPages}
                            onPageChange={(newPage) => setPage(newPage)}
                        />
                    </div>
                )}
            </div>
                </div>
            )}

            {activeTab === "details" && (
                <div className="bg-white rounded-lg shadow">
                    <div className="p-4 border-b">
                        <h2 className="font-semibold">FIFO Lots - Chi Tiết Tồn Kho Theo Lô</h2>
                        {selectedProductId && (
                            <p className="text-sm text-gray-600 mt-1">
                                Sản phẩm ID: {selectedProductId}
                            </p>
                        )}
                    </div>

                    {detailsLoading ? (
                        <div className="p-8 text-center text-gray-500">Đang tải...</div>
                    ) : detailsError ? (
                        <div className="p-8 text-center text-red-500">Lỗi khi tải dữ liệu</div>
                    ) : selectedProductId ? (
                        details.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="p-4 text-left font-medium">Ngày nhập</th>
                                            <th className="p-4 text-left font-medium">Nhập từ</th>
                                            <th className="p-4 text-right font-medium">Số lượng nhập</th>
                                            <th className="p-4 text-right font-medium">Còn lại</th>
                                            <th className="p-4 text-right font-medium">Đơn giá</th>
                                            <th className="p-4 text-left font-medium">Đơn vị</th>
                                            <th className="p-4 text-left font-medium">Serial Numbers</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {details.map((lot) => (
                                            <tr key={`detail-${lot.inventoryDetailId || Math.random()}`} className="border-t hover:bg-gray-50">
                                                <td className="p-4">{formatDate(lot.receivedDate)}</td>
                                                <td className="p-4">{lot.partnerName || "-"}</td>
                                                <td className="p-4 text-right">{lot.quantityIn}</td>
                                                <td className="p-4 text-right font-semibold">
                                                    <span className={lot.quantityRemaining > 0 ? "text-green-600" : "text-red-600"}>
                                                        {lot.quantityRemaining}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">{lot.price.toLocaleString("vi-VN")} đ</td>
                                                <td className="p-4">{lot.unit || "-"}</td>
                                                <td className="p-4">
                                                    {lot.serialNumbers && lot.serialNumbers.length > 0 ? (
                                                        <div className="max-w-xs">
                                                            <div className="text-xs text-gray-600 mb-1">
                                                                {lot.serialNumbers.length} số series
                                                            </div>
                                                            <div className="flex flex-wrap gap-1">
                                                                {lot.serialNumbers.slice(0, 3).map((sn) => (
                                                                    <span 
                                                                        key={sn.productSeriesId}
                                                                        className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200"
                                                                        title={`ID: ${sn.productSeriesId}, Status: ${sn.status}${sn.pickedDate ? `, Ngày xuất: ${new Date(sn.pickedDate).toLocaleDateString('vi-VN')}` : ''}`}
                                                                    >
                                                                        {sn.serialNumber}
                                                                    </span>
                                                                ))}
                                                                {lot.serialNumbers.length > 3 && (
                                                                    <span className="text-xs text-gray-500">
                                                                        +{lot.serialNumbers.length - 3} khác
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                Chưa có lot nào cho sản phẩm này. Vui lòng chọn sản phẩm từ bảng tổng quan.
                            </div>
                        )
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            Vui lòng chọn sản phẩm từ bảng tổng quan để xem chi tiết FIFO lots.
                        </div>
                    )}
                </div>
            )}

            {activeTab === "movements" && (
                <div className="bg-white rounded-lg shadow">
                    <div className="p-4 border-b">
                        <h2 className="font-semibold">Lịch Sử Di Chuyển Hàng Hóa</h2>
                        {selectedProductId && (
                            <p className="text-sm text-gray-600 mt-1">
                                Sản phẩm ID: {selectedProductId}
                            </p>
                        )}
                    </div>

                    {movementsLoading ? (
                        <div className="p-8 text-center text-gray-500">Đang tải...</div>
                    ) : movementsError ? (
                        <div className="p-8 text-center text-red-500">Lỗi khi tải dữ liệu</div>
                    ) : movements.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-4 text-left font-medium">Ngày giờ</th>
                                        <th className="p-4 text-center font-medium">Loại</th>
                                        <th className="p-4 text-right font-medium">Thay đổi</th>
                                        <th className="p-4 text-right font-medium">Tồn sau</th>
                                        <th className="p-4 text-left font-medium">Tham chiếu</th>
                                        <th className="p-4 text-left font-medium">Người thực hiện</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {movements.map((log) => (
                                        <tr key={`log-${log.inventoryLogId || Math.random()}`} className="border-t hover:bg-gray-50">
                                            <td className="p-4 text-sm">{formatDate(log.transactionDate)}</td>
                                            <td className="p-4 text-center">
                                                <span
                                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                                        log.transactionType === "IN"
                                                            ? "bg-green-100 text-green-700"
                                                            : log.transactionType === "OUT"
                                                            ? "bg-red-100 text-red-700"
                                                            : "bg-yellow-100 text-yellow-700"
                                                    }`}
                                                >
                                                    {log.transactionType}
                                                </span>
                                            </td>
                                            <td className={`p-4 text-right font-medium ${
                                                log.quantityChange > 0 ? "text-green-600" : "text-red-600"
                                            }`}>
                                                {log.quantityChange > 0 ? "+" : ""}{log.quantityChange}
                                            </td>
                                            <td className="p-4 text-right font-semibold">{log.balanceAfter}</td>
                                            <td className="p-4 text-sm text-gray-600">
                                                {log.referenceType} #{log.referenceId}
                                            </td>
                                            <td className="p-4 text-sm">{log.userName || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            {selectedProductId 
                                ? "Chưa có lịch sử di chuyển cho sản phẩm này."
                                : "Chưa có lịch sử di chuyển. Chọn sản phẩm từ bảng tổng quan để xem chi tiết."}
                        </div>
                    )}
                </div>
            )}

            {/* Modal Báo cáo thông tin tồn kho */}
            {isReportModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[9999]">
                    <div className="bg-white p-6 rounded-md w-[95%] max-w-6xl max-h-[90vh] overflow-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Báo cáo thông tin tồn kho</h3>
                            <button
                                onClick={() => setIsReportModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form chọn tháng */}
                        <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chọn tháng
                                </label>
                                <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full md:w-auto px-3 py-2 border rounded-md"
                                />
                        </div>

                        <button
                            onClick={handleViewReport}
                            disabled={reportLoading}
                            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
                        >
                            {reportLoading ? "Đang tải..." : "Xem báo cáo"}
                        </button>

                        {/* Bảng hiển thị kết quả */}
                        {inventoryReport.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="w-full border text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="border p-2 text-left">Sản phẩm</th>
                                            <th className="border p-2 text-center">Tồn đầu kỳ</th>
                                            <th className="border p-2 text-center">Tổng nhập</th>
                                            <th className="border p-2 text-center">Tổng xuất</th>
                                            <th className="border p-2 text-center">Điều chỉnh</th>
                                            <th className="border p-2 text-center">Tồn cuối kỳ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inventoryReport.map((item) => (
                                            <tr key={`report-${item.productId || Math.random()}`} className="hover:bg-gray-50">
                                                <td className="border p-2 font-medium">{item.productName}</td>
                                                <td className="border p-2 text-center">{item.beginningBalance.toLocaleString()}</td>
                                                <td className="border p-2 text-center text-green-600">{item.totalIN.toLocaleString()}</td>
                                                <td className="border p-2 text-center text-red-600">{item.totalOUT.toLocaleString()}</td>
                                                <td className="border p-2 text-center text-orange-600">{item.totalAdjust.toLocaleString()}</td>
                                                <td className="border p-2 text-center font-semibold">{item.endingBalance.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {!reportLoading && inventoryReport.length === 0 && (
                            <p className="text-center text-gray-500 py-8">
                                Chưa có dữ liệu. Vui lòng chọn khoảng thời gian và click "Xem báo cáo".
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryPage;
