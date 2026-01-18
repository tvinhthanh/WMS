// pages/user/phieuxuat/PickingDetailModal.tsx
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { X, Plus, Trash2, Loader2, Edit2, Check } from "lucide-react";
import {
    PickingOrderDTO,
    PickingAddItemDTO,
    ProductDTO,
} from "../../../types";
import { pickingService } from "../../../services/picking.service";
import { productService } from "../../../services/product.service";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    order: (PickingOrderDTO & { __mode?: "items" }) | null;
}

const PickingDetailModal = ({ isOpen, onClose, order }: Props) => {
    const queryClient = useQueryClient();

    const { data: products = [] } = useQuery<ProductDTO[]>(
        "products",
        productService.getAll
    );

    // Fetch fresh order details when modal is open
    const {
        data: freshOrder,
        isLoading: isLoadingOrder,
        refetch
    } = useQuery<PickingOrderDTO>(
        ["picking-order", order?.pickingOrderId],
        () => pickingService.getById(order!.pickingOrderId),
        {
            enabled: isOpen && !!order?.pickingOrderId,
            staleTime: 0, // Always fetch fresh data
            refetchOnMount: true
        }
    );

    const [productId, setProductId] = useState<number>(0);
    const [quantity, setQuantity] = useState<number>(1);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editQuantity, setEditQuantity] = useState<number>(1);

    // Use fresh order if available, fallback to prop
    const currentOrder = freshOrder || order;

    const addMutation = useMutation(
        (payload: PickingAddItemDTO) => pickingService.addItem(payload),
        {
            onSuccess: async () => {
                // Refetch order details to show new item
                await refetch();

                // Also update main list
                queryClient.invalidateQueries("pickings");

                // Reset form
                setProductId(0);
                setQuantity(1);
            },
            onError: (error: any) => {
                alert(`Lỗi: ${error?.response?.data || error.message}`);
            }
        }
    );

    const updateMutation = useMutation(
        ({ detailId, quantity }: { detailId: number; quantity: number }) =>
            pickingService.updateDetail(detailId, quantity),
        {
            onSuccess: async () => {
                await refetch();
                queryClient.invalidateQueries("pickings");
                setEditingId(null);
            },
            onError: (error: any) => {
                let errorMessage = "Đã xảy ra lỗi khi cập nhật số lượng";
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
        }
    );

    const deleteMutation = useMutation(
        (detailId: number) => pickingService.deleteDetail(detailId),
        {
            onSuccess: async () => {
                // Refetch to remove deleted item
                await refetch();

                // Also update main list
                queryClient.invalidateQueries("pickings");
            },
            onError: (error: any) => {
                alert(`Lỗi: ${error?.response?.data || error.message}`);
            }
        }
    );

    if (!isOpen || !currentOrder) return null;

    const handleAdd = () => {
        if (productId === 0) {
            alert("Vui lòng chọn sản phẩm");
            return;
        }

        if (quantity <= 0) {
            alert("Số lượng phải lớn hơn 0");
            return;
        }

        addMutation.mutate({
            pickingOrderId: currentOrder.pickingOrderId,
            productId,
            quantityPicked: quantity,
        });
    };

    const handleStartEdit = (detailId: number, currentQuantity: number) => {
        setEditingId(detailId);
        setEditQuantity(currentQuantity);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditQuantity(1);
    };

    const handleSaveEdit = (detailId: number) => {
        if (editQuantity <= 0) {
            alert("Số lượng phải lớn hơn 0");
            return;
        }
        updateMutation.mutate({ detailId, quantity: editQuantity });
    };

    const handleDelete = (detailId: number, productName: string) => {
        if (confirm(`Xác nhận xóa sản phẩm "${productName}"?`)) {
            deleteMutation.mutate(detailId);
        }
    };

    const isCompleted = currentOrder.status === "Completed";
    const isLoading = addMutation.isLoading || updateMutation.isLoading || deleteMutation.isLoading || isLoadingOrder;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white rounded-lg w-full max-w-xl p-4 sm:p-6 shadow-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                <button
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                    onClick={onClose}
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg sm:text-xl font-bold break-words">
                        Quản Lý Sản Phẩm – {currentOrder.orderCode}
                    </h2>
                    {isLoadingOrder && (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600 flex-shrink-0 ml-2" />
                    )}
                </div>

                {isCompleted && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                        <p className="text-sm text-yellow-800">
                            Phiếu xuất đã hoàn tất, không thể chỉnh sửa
                        </p>
                    </div>
                )}

                {/* ADD NEW ITEM */}
                {!isCompleted && (
                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <select
                                className="border px-3 py-2 rounded w-full text-sm sm:text-base"
                                value={productId}
                                onChange={(e) => setProductId(Number(e.target.value))}
                                disabled={isLoading}
                            >
                                <option value={0}>-- Chọn sản phẩm --</option>
                                {products.map((p) => (
                                    <option key={p.productId} value={p.productId}>
                                        {p.productCode} - {p.productName}
                                    </option>
                                ))}
                            </select>

                            <div className="flex gap-2">
                            <input
                                type="number"
                                    className="border px-3 py-2 rounded w-20 sm:w-24 text-sm sm:text-base"
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                                min={1}
                                disabled={isLoading}
                            />

                            <button
                                onClick={handleAdd}
                                    className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm sm:text-base flex-1 sm:flex-initial justify-center"
                                disabled={isLoading}
                            >
                                {addMutation.isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                            <span className="hidden sm:inline">Đang thêm...</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4" />
                                            <span>Thêm</span>
                                    </>
                                )}
                            </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ITEM LIST */}
                {isLoadingOrder && !currentOrder.details ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : currentOrder.details?.length ? (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden sm:block border rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                        <th className="p-2 text-left text-sm">Mã SP</th>
                                        <th className="p-2 text-left text-sm">Sản phẩm</th>
                                        <th className="p-2 text-right text-sm">SL</th>
                                        <th className="p-2 text-left text-sm">Serial Numbers</th>
                                    {!isCompleted && (
                                            <th className="p-2 text-right text-sm">Thao tác</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {currentOrder.details.map((d) => (
                                    <tr key={d.pickingDetailId} className="border-t">
                                        <td className="p-2 font-mono text-sm">
                                            {d.productCode || d.productId}
                                        </td>
                                        <td className="p-2">{d.productName}</td>
                                        <td className="p-2 text-right font-medium">
                                            {editingId === d.pickingDetailId ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <input
                                                        type="number"
                                                        className="border px-2 py-1 rounded w-20 text-right"
                                                        value={editQuantity}
                                                        onChange={(e) => setEditQuantity(Number(e.target.value))}
                                                        min={1}
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                handleSaveEdit(d.pickingDetailId);
                                                            } else if (e.key === "Escape") {
                                                                handleCancelEdit();
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                d.quantityPicked
                                            )}
                                        </td>
                                        <td className="p-2">
                                            {d.serialNumberDetails && d.serialNumberDetails.length > 0 ? (
                                                <div className="max-w-xs">
                                                    <div className="text-xs text-gray-600 mb-1">
                                                        {d.serialNumberDetails.length} số series
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {d.serialNumberDetails.slice(0, 3).map((sn) => (
                                                            <span 
                                                                key={sn.productSeriesId}
                                                                className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200"
                                                                title={`SerieID: ${sn.productSeriesId}, Status: ${sn.status}${sn.pickedDate ? `, Ngày xuất: ${new Date(sn.pickedDate).toLocaleDateString('vi-VN')}` : ''}`}
                                                            >
                                                                {sn.serialNumber}
                                                            </span>
                                                        ))}
                                                        {d.serialNumberDetails.length > 3 && (
                                                            <span className="text-xs text-gray-500">
                                                                +{d.serialNumberDetails.length - 3} khác
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : d.serialNumbers ? (
                                                <span className="text-xs text-gray-600">{d.serialNumbers}</span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">-</span>
                                            )}
                                        </td>
                                        {!isCompleted && (
                                            <td className="p-2">
                                                <div className="flex justify-end gap-1">
                                                    {editingId === d.pickingDetailId ? (
                                                        <>
                                                            <button
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded disabled:opacity-50 transition"
                                                                onClick={() => handleSaveEdit(d.pickingDetailId)}
                                                                disabled={updateMutation.isLoading}
                                                                title="Lưu"
                                                            >
                                                                {updateMutation.isLoading ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Check className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                            <button
                                                                className="p-2 text-gray-600 hover:bg-gray-50 rounded disabled:opacity-50 transition"
                                                                onClick={handleCancelEdit}
                                                                disabled={updateMutation.isLoading}
                                                                title="Hủy"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50 transition"
                                                                onClick={() => handleStartEdit(d.pickingDetailId, d.quantityPicked)}
                                                                disabled={isLoading}
                                                                title="Sửa số lượng"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                <button
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 transition"
                                                    onClick={() => handleDelete(d.pickingDetailId, d.productName)}
                                                    disabled={isLoading}
                                                                title="Xóa"
                                                >
                                                    {deleteMutation.isLoading ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50 font-bold">
                                <tr>
                                    <td colSpan={2} className="p-2">Tổng cộng:</td>
                                    <td className="p-2 text-right">
                                        {currentOrder.details.reduce((sum, d) => sum + d.quantityPicked, 0)}
                                    </td>
                                    {!isCompleted && <td></td>}
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                        {/* Mobile Card View */}
                        <div className="sm:hidden space-y-2 mt-4">
                            {currentOrder.details.map((d) => (
                                <div key={d.pickingDetailId} className="border rounded-lg p-3 bg-white">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <p className="font-mono text-xs text-gray-500 mb-1">
                                                {d.productCode || d.productId}
                                            </p>
                                            <p className="text-sm font-medium">{d.productName}</p>
                                        </div>
                                        {!isCompleted && editingId !== d.pickingDetailId && (
                                            <div className="flex gap-1 ml-2">
                                                <button
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                    onClick={() => handleStartEdit(d.pickingDetailId, d.quantityPicked)}
                                                    disabled={isLoading}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                                    onClick={() => handleDelete(d.pickingDetailId, d.productName)}
                                                    disabled={isLoading}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t">
                                        <span className="text-xs text-gray-500">Số lượng:</span>
                                        {editingId === d.pickingDetailId ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    className="border px-2 py-1 rounded w-20 text-right text-sm"
                                                    value={editQuantity}
                                                    onChange={(e) => setEditQuantity(Number(e.target.value))}
                                                    min={1}
                                                    autoFocus
                                                />
                                                <button
                                                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                    onClick={() => handleSaveEdit(d.pickingDetailId)}
                                                    disabled={updateMutation.isLoading}
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                                                    onClick={handleCancelEdit}
                                                    disabled={updateMutation.isLoading}
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="font-semibold">{d.quantityPicked}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div className="bg-gray-50 border rounded-lg p-3 flex justify-between items-center">
                                <span className="font-bold text-sm">Tổng cộng:</span>
                                <span className="font-bold text-sm">
                                    {currentOrder.details.reduce((sum, d) => sum + d.quantityPicked, 0)}
                                </span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-12 border rounded-lg bg-gray-50">
                        <p className="text-gray-500 mb-2">Chưa có sản phẩm nào</p>
                        {!isCompleted && (
                            <p className="text-sm text-gray-400">
                                Chọn sản phẩm và số lượng ở trên để thêm
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PickingDetailModal;