
import { useQuery } from "react-query";
import { Package, ArrowDownCircle, ArrowUpCircle, ClipboardList, TrendingUp, TrendingDown, Download } from "lucide-react";
import { inventoryService } from "../../../services/inventory.service";
import { receivingService } from "../../../services/receiving.service";
import { pickingService } from "../../../services/picking.service";
import { productService } from "../../../services/product.service";
import { stockTakeService } from "../../../services/stocktake.service";
import { InventoryDTO, ReceivingDTO, PickingOrderDTO, ProductDTO } from "../../../types";
import { exportMultipleSheets } from "../../../utils/excelExport";
import { extractDataFromResponse } from "../../../utils/pagination";
import { isInCurrentMonth, isDateMatch, get30Days, get7Days } from "../../../utils/dateUtils";

const Dashboard = () => {
    const { data: inventoryResponse, isLoading: loadingInventories } = useQuery("inventories", inventoryService.getAll, {
        retry: false
    });
    const { data: productResponse, isLoading: loadingProducts } = useQuery("products", productService.getAll, {
        retry: false
    });
    const { data: receivingResponse, isLoading: loadingReceivings } = useQuery("receivings", receivingService.getAll, {
        retry: false
    });
    const { data: pickingResponse, isLoading: loadingPickings } = useQuery("pickings", pickingService.getAll, {
        retry: false
    });
    const { data: stockTakesResponse, isLoading: loadingStockTakes } = useQuery(
        "stockTakes",
        () => stockTakeService.getAll().catch(() => []),
        {
            retry: false
        }
    );

    // Extract data từ responses
    const inventories = extractDataFromResponse<InventoryDTO>(inventoryResponse);
    const products = extractDataFromResponse<ProductDTO>(productResponse);
    const receivings = extractDataFromResponse<ReceivingDTO>(receivingResponse);
    const pickings = extractDataFromResponse<PickingOrderDTO>(pickingResponse);
    const stockTakes = extractDataFromResponse(stockTakesResponse);

    const isLoading = loadingInventories || loadingProducts || loadingReceivings || loadingPickings || loadingStockTakes;

    // Tính toán thống kê
    const totalProducts = products.length;
    // Tính giá trị tồn kho từ InventoryDetail (nếu có)
    const totalInventoryValue = 0; // Tạm thời để 0, có thể tính từ InventoryDetail nếu cần

    const totalQuantity = inventories.reduce((sum, inv) => sum + inv.quantity, 0);

    const receivingsThisMonth = receivings.filter((r) => isInCurrentMonth(r.createdDate || "")).length;
    const pickingsThisMonth = pickings.filter((p) => isInCurrentMonth(p.createDate || "")).length;
    const completedStockTakes = stockTakes.filter((st) => st.status === "Completed").length;
    const pendingStockTakes = stockTakes.filter((st) => st.status === "Pending").length;
    const lowStockProducts = inventories.filter((inv) => inv.quantity < 10).length;

    // Biểu đồ nhập/xuất 30 ngày hoặc 7 ngày gần nhất
    const last7Days = get7Days();

    const receivingChartData = last7Days.map(date => {
        const count = receivings.filter((r) => isDateMatch(r.createdDate, date)).length;
        return { date: new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }), count };
    });

    const pickingChartData = last7Days.map(date => {
        const count = pickings.filter((p) => isDateMatch(p.createDate, date)).length;
        return { date: new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }), count };
    });

    const maxCount = Math.max(
        ...receivingChartData.map(d => d.count),
        ...pickingChartData.map(d => d.count),
        1
    );

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto p-2 sm:p-4">
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    const handleExportExcel = async () => {
        const sheets = [
            {
                name: "Tổng quan",
                data: [
                    { "Chỉ số": "Tổng sản phẩm", "Giá trị": totalProducts },
                    { "Chỉ số": "Tổng tồn kho", "Giá trị": totalQuantity },
                    { "Chỉ số": "Giá trị tồn kho", "Giá trị": totalInventoryValue },
                    { "Chỉ số": "Sản phẩm sắp hết", "Giá trị": lowStockProducts },
                    { "Chỉ số": "Phiếu nhập tháng này", "Giá trị": receivingsThisMonth },
                    { "Chỉ số": "Phiếu xuất tháng này", "Giá trị": pickingsThisMonth },
                    { "Chỉ số": "Kiểm kê đã hoàn tất", "Giá trị": completedStockTakes },
                    { "Chỉ số": "Kiểm kê chờ xử lý", "Giá trị": pendingStockTakes }
                ]
            },
            {
                name: "Top 5 Tồn kho",
                data: inventories
                    .sort((a, b) => b.quantity - a.quantity)
                    .slice(0, 5)
                    .map((inv) => {
                        const product = products.find((p) => p.productId === inv.productId);
                        return {
                            "Mã sản phẩm": product?.productCode || "",
                            "Tên sản phẩm": inv.productName || "",
                            "Số lượng": inv.quantity,
                            "Đơn vị": product?.unit || ""
                        };
                    })
            }
        ];

        try {
            await exportMultipleSheets(sheets, `BaoCaoTongHop_${new Date().toISOString().split("T")[0]}`);
        } catch (error) {
            alert("Có lỗi xảy ra khi xuất file Excel.");
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-2 sm:p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
                <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                    <Download className="w-4 h-4" />
                    <span className="text-sm sm:text-base">Xuất Excel</span>
                </button>
            </div>

            {/* Thống kê tổng quan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Tổng sản phẩm</p>
                            <p className="text-2xl font-bold">{totalProducts}</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full">
                            <Package className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Tổng tồn kho</p>
                            <p className="text-2xl font-bold">{totalQuantity.toLocaleString()}</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                            <Package className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Giá trị tồn kho</p>
                            <p className="text-2xl font-bold">{totalInventoryValue.toLocaleString("vi-VN")} đ</p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-full">
                            <TrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Sản phẩm sắp hết</p>
                            <p className="text-2xl font-bold text-orange-600">{lowStockProducts}</p>
                        </div>
                        <div className="bg-orange-100 p-3 rounded-full">
                            <TrendingDown className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Biểu đồ nhập/xuất 7 ngày */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <ArrowDownCircle className="w-5 h-5 text-green-600" />
                        Nhập hàng (7 ngày)
                    </h2>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {receivingChartData.map((item, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <span className="text-sm text-gray-600 w-16">{item.date}</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                                    <div
                                        className="bg-green-500 h-full rounded-full flex items-center justify-end pr-2"
                                        style={{ width: `${(item.count / maxCount) * 100}%` }}
                                    >
                                        {item.count > 0 && (
                                            <span className="text-xs text-white font-medium">{item.count}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <ArrowUpCircle className="w-5 h-5 text-red-600" />
                        Xuất hàng (7 ngày)
                    </h2>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {pickingChartData.map((item, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <span className="text-sm text-gray-600 w-16">{item.date}</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                                    <div
                                        className="bg-red-500 h-full rounded-full flex items-center justify-end pr-2"
                                        style={{ width: `${(item.count / maxCount) * 100}%` }}
                                    >
                                        {item.count > 0 && (
                                            <span className="text-xs text-white font-medium">{item.count}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Thống kê tháng này */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <p className="text-sm text-gray-600 mb-1">Phiếu nhập tháng này</p>
                    <p className="text-2xl font-bold text-green-600">{receivingsThisMonth}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <p className="text-sm text-gray-600 mb-1">Phiếu xuất tháng này</p>
                    <p className="text-2xl font-bold text-red-600">{pickingsThisMonth}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <p className="text-sm text-gray-600 mb-1">Kiểm kê đã hoàn tất</p>
                    <p className="text-2xl font-bold text-blue-600">{completedStockTakes}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <p className="text-sm text-gray-600 mb-1">Kiểm kê chờ xử lý</p>
                    <p className="text-2xl font-bold text-orange-600">{pendingStockTakes}</p>
                </div>
            </div>

            {/* Top 5 sản phẩm tồn kho cao nhất */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" />
                    Top 5 sản phẩm tồn kho cao nhất
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-2 text-left">Sản phẩm</th>
                                <th className="p-2 text-right">Tồn kho</th>
                                <th className="p-2 text-right">Đơn vị</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventories.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="p-4 text-center text-gray-500">
                                        Chưa có dữ liệu tồn kho
                                    </td>
                                </tr>
                            ) : (
                                inventories
                                    .sort((a, b) => b.quantity - a.quantity)
                                    .slice(0, 5)
                                    .map((inv) => {
                                        const product = products.find((p) => p.productId === inv.productId);
                                        return (
                                            <tr key={inv.inventoryId} className="border-t hover:bg-gray-50">
                                                <td className="p-2">
                                                    <div>
                                                        <p className="font-medium">{product?.productName || "N/A"}</p>
                                                        <p className="text-xs text-gray-500">{product?.productCode || ""}</p>
                                                    </div>
                                                </td>
                                                <td className="p-2 text-right font-medium">{inv.quantity.toLocaleString()}</td>
                                                <td className="p-2 text-right text-gray-600">{product?.unit || ""}</td>
                                            </tr>
                                        );
                                    })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

