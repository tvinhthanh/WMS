import { useQuery, useMutation, useQueryClient } from "react-query";
import { X, Trash2, Info } from "lucide-react";
import { ProductDTO, ProductSeriesDTO } from "../../../types";
import { productService } from "../../../services/product.service";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    product: ProductDTO | null;
}

const ProductSeriesModal = ({ isOpen, onClose, product }: Props) => {
    const queryClient = useQueryClient();

    const { data: series = [], isLoading } = useQuery(
        ["product-series", product?.productId],
        () => productService.getSeries(product?.productId || 0),
        { enabled: !!product?.productId && isOpen }
    );

    const deleteSeriesMutation = useMutation(
        (seriesId: number) => productService.deleteSeries(seriesId),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(["product-series", product?.productId]);
            }
        }
    );

    if (!isOpen || !product) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* HEADER */}
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold">
                        Quản lý số series - {product.productName}
                    </h2>
                    <button onClick={onClose}>
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* INFO MESSAGE */}
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-800 flex items-start gap-2">
                            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>
                                <strong>Lưu ý:</strong> SerialNumber được tạo tự động khi hoàn tất phiếu nhập. 
                                Không thể thêm SerialNumber thủ công. SerialNumber sẽ được liên kết với lô hàng nhập để quản lý FIFO.
                            </span>
                        </p>
                    </div>

                    {/* SERIES LIST */}
                    {isLoading ? (
                        <div className="text-center py-8">Đang tải...</div>
                    ) : series.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p className="mb-2">Chưa có số series nào</p>
                            <p className="text-sm text-gray-400">
                                SerialNumber sẽ được tạo tự động khi hoàn tất phiếu nhập
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border p-2 text-left">Số series</th>
                                        <th className="border p-2 text-left">Trạng thái</th>
                                        <th className="border p-2 text-left">Ngày nhập</th>
                                        <th className="border p-2 text-left">Ngày xuất</th>
                                        <th className="border p-2 text-left">Lô hàng (FIFO)</th>
                                        <th className="border p-2 text-left">Ghi chú</th>
                                        <th className="border p-2 text-left">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {series.map((s: ProductSeriesDTO) => (
                                        <tr key={s.productSeriesId}>
                                            <td className="border p-2 font-mono text-blue-600">{s.serialNumber}</td>
                                            <td className="border p-2">
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                    s.status === "InStock" ? "bg-green-100 text-green-800" :
                                                    s.status === "Picked" ? "bg-blue-100 text-blue-800" :
                                                    s.status === "Damaged" ? "bg-red-100 text-red-800" :
                                                    s.status === "Lost" ? "bg-orange-100 text-orange-800" :
                                                    "bg-gray-100 text-gray-800"
                                                }`}>
                                                    {s.status}
                                                </span>
                                            </td>
                                            <td className="border p-2 text-sm">
                                                {s.receivedDate ? new Date(s.receivedDate).toLocaleDateString('vi-VN') : "—"}
                                            </td>
                                            <td className="border p-2 text-sm">
                                                {s.pickedDate ? new Date(s.pickedDate).toLocaleDateString('vi-VN') : "—"}
                                            </td>
                                            <td className="border p-2 text-sm">
                                                {s.inventoryDetailId ? (
                                                    <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                                                        Lô #{s.inventoryDetailId}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="border p-2 text-sm text-gray-600">
                                                {s.notes || "—"}
                                            </td>
                                            <td className="border p-2">
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm("Bạn có chắc muốn xóa số series này? Hành động này không thể hoàn tác.")) {
                                                            deleteSeriesMutation.mutate(s.productSeriesId);
                                                        }
                                                    }}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                    title="Xóa số series"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
                                <strong>Tổng số:</strong> {series.length} SerialNumber
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductSeriesModal;

