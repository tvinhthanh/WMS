import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { X, Plus, Trash2, Loader2, Save } from "lucide-react";
import { stockTakeService } from "../../../services/stocktake.service";
import { productService } from "../../../services/product.service";
import { useAppContext } from "../../../contexts/AppContext";
import { StockTakeDTO, StockTakeCreateDTO, ProductDTO } from "../../../types";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    stockTake: StockTakeDTO | null;
}

const KiemkeModal = ({ isOpen, onClose, stockTake }: Props) => {
    const queryClient = useQueryClient();
    const { userId } = useAppContext();
    const isView = stockTake !== null;

    const { data: products = [] } = useQuery("products", productService.getAll);

    const [form, setForm] = useState<StockTakeCreateDTO>({
        createdByUserId: userId as number,
        stockTakeDate: new Date().toISOString().split("T")[0],
        note: "",
        details: []
    });

    useEffect(() => {
        if (isOpen && !isView) {
            setForm({
                createdByUserId: userId as number,
                stockTakeDate: new Date().toISOString().split("T")[0],
                note: "",
                details: []
            });
        }
    }, [isOpen, isView, userId]);

    const addProduct = () => {
        setForm({
            ...form,
            details: [
                ...form.details,
                { productId: 0, actualQuantity: 0, damageQuantity: 0, damageReason: "", note: "" }
            ]
        });
    };

    const updateDetail = (index: number, field: string, value: any) => {
        const details = [...form.details];
        details[index] = { ...details[index], [field]: value };
        setForm({ ...form, details });
    };

    const removeDetail = (index: number) => {
        const details = [...form.details];
        details.splice(index, 1);
        setForm({ ...form, details });
    };

    const createMutation = useMutation(stockTakeService.create, {
        onSuccess: () => {
            queryClient.invalidateQueries("stockTakes");
            onClose();
        },
        onError: (error: any) => {
            let errorMessage = "Đã xảy ra lỗi khi tạo phiếu kiểm kê";
            if (error?.response?.data) {
                if (typeof error.response.data === "string") {
                    errorMessage = error.response.data;
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            }
            alert(`Lỗi: ${errorMessage}`);
        }
    });

    const handleSubmit = () => {
        if (form.details.length === 0) {
            alert("Vui lòng thêm ít nhất 1 sản phẩm");
            return;
        }

        const invalidProduct = form.details.find(d => !d.productId || d.productId === 0);
        if (invalidProduct) {
            alert("Vui lòng chọn sản phẩm cho tất cả các dòng");
            return;
        }

        createMutation.mutate(form);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white rounded-lg w-full max-w-4xl p-4 sm:p-6 shadow-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                <button
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                    onClick={onClose}
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-lg sm:text-xl font-bold mb-4">
                    {isView ? `Chi Tiết Kiểm Kê - ${stockTake?.stockTakeCode}` : "Tạo Phiếu Kiểm Kê"}
                </h2>

                {isView ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Ngày kiểm kê:</span>
                                <p className="font-medium">{stockTake && new Date(stockTake.stockTakeDate).toLocaleDateString("vi-VN")}</p>
                            </div>
                            <div>
                                <span className="text-gray-600">Người tạo:</span>
                                <p className="font-medium">{stockTake?.createdByUserName}</p>
                            </div>
                            <div>
                                <span className="text-gray-600">Trạng thái:</span>
                                <p className="font-medium">
                                    <span className={`px-2 py-1 rounded text-xs ${stockTake?.status === "Completed"
                                        ? "bg-green-100 text-green-700"
                                        : stockTake?.status === "Submitted"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-yellow-100 text-yellow-700"
                                        }`}>
                                        {stockTake?.status === "Completed"
                                            ? "Đã hoàn tất"
                                            : stockTake?.status === "Submitted"
                                                ? "Đã gửi"
                                                : "Chờ xử lý"}
                                    </span>
                                </p>
                            </div>
                            {stockTake?.note && (
                                <div className="col-span-2">
                                    <span className="text-gray-600">Ghi chú:</span>
                                    <p className="font-medium">{stockTake.note}</p>
                                </div>
                            )}
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-2 text-left">Sản phẩm</th>
                                        <th className="p-2 text-right">Tồn hệ thống</th>
                                        <th className="p-2 text-right">Thực tế (tốt)</th>
                                        <th className="p-2 text-right">Hư hỏng</th>
                                        <th className="p-2 text-right">Chênh lệch</th>
                                        <th className="p-2 text-left">Serial Numbers</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stockTake?.details.map((d) => (
                                        <tr key={d.stockTakeDetailId} className="border-t">
                                            <td className="p-2">
                                                <div>
                                                    <p className="font-medium">{d.productName}</p>
                                                    <p className="text-xs text-gray-500">{d.productCode}</p>
                                                    {d.damageReason && (
                                                        <p className="text-xs text-red-600 mt-1">Lý do: {d.damageReason}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-2 text-right">{d.systemQuantity}</td>
                                            <td className="p-2 text-right font-medium">{d.actualQuantity}</td>
                                            <td className="p-2 text-right">
                                                {d.damageQuantity > 0 ? (
                                                    <span className="text-red-600 font-medium">{d.damageQuantity}</span>
                                                ) : (
                                                    <span className="text-gray-400">0</span>
                                                )}
                                            </td>
                                            <td className={`p-2 text-right font-bold ${d.variance > 0 ? "text-green-600" : d.variance < 0 ? "text-red-600" : "text-gray-600"
                                                }`}>
                                                {d.variance > 0 ? "+" : ""}{d.variance}
                                            </td>
                                            <td className="p-2">
                                                {d.serialNumbers && d.serialNumbers.length > 0 ? (
                                                    <div className="max-w-xs">
                                                        <div className="text-xs text-gray-600 mb-1">
                                                            {d.serialNumbers.length} số series
                                                        </div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {d.serialNumbers.slice(0, 3).map((sn) => (
                                                                <span 
                                                                    key={sn.productSeriesId}
                                                                    className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200"
                                                                    title={`SerieID: ${sn.productSeriesId}, Status: ${sn.status}${sn.pickedDate ? `, Ngày xuất: ${new Date(sn.pickedDate).toLocaleDateString('vi-VN')}` : ''}`}
                                                                >
                                                                    {sn.serialNumber}
                                                                </span>
                                                            ))}
                                                            {d.serialNumbers.length > 3 && (
                                                                <span className="text-xs text-gray-500">
                                                                    +{d.serialNumbers.length - 3} khác
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Ngày kiểm kê</label>
                            <input
                                type="date"
                                className="border p-2 rounded w-full"
                                value={form.stockTakeDate}
                                onChange={(e) => setForm({ ...form, stockTakeDate: e.target.value })}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                💡 Lưu ý: Nhân viên chỉ cần nhập số lượng thực tế (tốt và hư). Hệ thống sẽ tự tính chênh lệch khi admin duyệt.
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Ghi chú</label>
                            <textarea
                                className="border p-2 rounded w-full"
                                rows={2}
                                value={form.note}
                                onChange={(e) => setForm({ ...form, note: e.target.value })}
                                placeholder="Nhập ghi chú..."
                            />
                        </div>

                        <div className="mb-4 flex justify-between items-center">
                            <h3 className="font-semibold">Danh sách sản phẩm kiểm kê</h3>
                            <button
                                onClick={addProduct}
                                className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Thêm sản phẩm
                            </button>
                        </div>

                        {form.details.length === 0 ? (
                            <div className="border rounded p-8 text-center text-gray-500 mb-4">
                                Chưa có sản phẩm nào. Nhấn "Thêm sản phẩm" để bắt đầu.
                            </div>
                        ) : (
                            <div className="border rounded-lg overflow-hidden mb-4">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-2 text-left">Sản phẩm</th>
                                            <th className="p-2 text-right">Thực tế (tốt)</th>
                                            <th className="p-2 text-right">Hư hỏng</th>
                                            <th className="p-2 text-right">Lý do hư</th>
                                            <th className="p-2 text-center">Xóa</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {form.details.map((detail, index) => {
                                            return (
                                                <tr key={index} className="border-t hover:bg-gray-50">
                                                    <td className="p-2">
                                                        <select
                                                            className="border p-1 rounded w-full text-sm"
                                                            value={detail.productId}
                                                            onChange={(e) => updateDetail(index, "productId", e.target.value)}
                                                        >
                                                            <option value={0}>-- Chọn sản phẩm --</option>
                                                            {products.map((p: ProductDTO) => (
                                                                <option key={p.productId} value={p.productId}>
                                                                    {p.productCode} - {p.productName}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            type="number"
                                                            className="border p-1 rounded w-20 text-right text-sm"
                                                            value={detail.actualQuantity}
                                                            onChange={(e) => updateDetail(index, "actualQuantity", Number(e.target.value))}
                                                            min={0}
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            type="number"
                                                            className="border p-1 rounded w-20 text-right text-sm"
                                                            value={detail.damageQuantity || 0}
                                                            onChange={(e) => updateDetail(index, "damageQuantity", Number(e.target.value))}
                                                            min={0}
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            type="text"
                                                            className="border p-1 rounded w-32 text-sm"
                                                            value={detail.damageReason || ""}
                                                            onChange={(e) => updateDetail(index, "damageReason", e.target.value)}
                                                            placeholder="Lý do hư hỏng..."
                                                        />
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <button
                                                            className="text-red-600 hover:bg-red-50 p-1 rounded transition"
                                                            onClick={() => removeDetail(index)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition w-full sm:w-auto"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 w-full sm:w-auto flex items-center justify-center gap-2"
                                disabled={createMutation.isLoading || form.details.length === 0}
                            >
                                {createMutation.isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Đang tạo...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Tạo phiếu kiểm kê
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div >
    );
};

export default KiemkeModal;

