/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, DollarSign, Calendar, Tag, Printer } from "lucide-react";
import { receivingService } from "../../../services/receiving.service";
import { productService } from "../../../services/product.service";

const formatVND = (value: number) =>
    value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
// Alternative simpler format:
    //value.toLocaleString("vi-VN") + " đồng";
const ReceivingDetailModal = ({ isOpen, onClose, receiving }: any) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const receivingId = receiving?.receivingId;

    const { data: rawData, isLoading, error } = useQuery(
        ["receiving-details", receivingId],
        () => {
            if (!receivingId) {
                throw new Error("ReceivingId is required");
            }
            return receivingService.getById(receivingId);
        },
        {
            enabled: !!receivingId && isOpen,
            retry: 1,
            refetchOnWindowFocus: false,
            onError: (err) => {
                console.error("Error loading receiving details:", err);
            }
        }
    );

    const details = rawData?.details || [];
    // Đảm bảo status là number
    const status = typeof rawData?.status === 'number' ? rawData.status : Number(rawData?.status) || 0;

    const [actualList, setActualList] = useState<any[]>([]);
    const [deliveryCode, setDeliveryCode] = useState<string>("");
    const [isEditingDeliveryCode, setIsEditingDeliveryCode] = useState(false);
    const [suggestedPrices, setSuggestedPrices] = useState<Record<number, number>>({});

    useEffect(() => {
        const fetchSuggestedPrices = async () => {
            if (details.length > 0 && receiving?.partnerId) {
                const prices: Record<number, number> = {};
                await Promise.all(details.map(async (d: any) => {
                    try {
                        const partners = await productService.getPartners(d.productId);
                        const match = partners.find((p: any) => p.partnerId === receiving.partnerId);
                        if (match?.defaultPrice) {
                            prices[d.productId] = match.defaultPrice;
                        }
                    } catch (e) {
                        console.error("Error fetching partner price", e);
                    }
                }));
                setSuggestedPrices(prices);
            }
        };
        fetchSuggestedPrices();
    }, [details, receiving?.partnerId]);

    useEffect(() => {
        if (details.length > 0) {
            setActualList(
                details.map((d: any) => {
                    const price = d.price || 0;
                    return {
                        receivingDetailId: d.receivingDetailId,
                        actualQuantity: d.actualQuantity ?? d.quantity,
                        damageQuantity: d.damageQuantity ?? 0,
                        damageReason: d.damageReason ?? "",
                        price: price,
                        totalPrice: price * (d.actualQuantity ?? d.quantity)
                    };
                })
            );
        }
    }, [details]);

    // Update actualList with suggested prices when they are loaded and if current price is 0
    useEffect(() => {
        if (Object.keys(suggestedPrices).length > 0) {
            setActualList(prev => prev.map(item => {
                const detail = details.find((d: any) => d.receivingDetailId === item.receivingDetailId);
                if (!detail) return item;

                const suggested = suggestedPrices[detail.productId];
                // If item has no price set (or 0), use suggested
                if (item.totalPrice === 0 && suggested) {
                    return {
                        ...item,
                        price: suggested,
                        totalPrice: suggested * item.actualQuantity
                    };
                }
                return item;
            }));
        }
    }, [suggestedPrices, details]);

    useEffect(() => {
        if (rawData?.deliveryCode) {
            setDeliveryCode(rawData.deliveryCode);
        } else {
            setDeliveryCode("");
        }
        setIsEditingDeliveryCode(false);
    }, [rawData?.deliveryCode]);

    const mutation = useMutation(receivingService.updateActual, {
        onSuccess: () => {
            queryClient.invalidateQueries("receivings");
            queryClient.invalidateQueries(["receiving-details", receiving?.receivingId]);

            alert("Đã cập nhật số lượng thực tế!");
            onClose();
        }
    });

    const cancelMutation = useMutation(
        () => {
            if (!receiving?.receivingId) {
                throw new Error("Không tìm thấy thông tin phiếu nhập.");
            }
            return receivingService.cancel(receiving.receivingId);
        },
        {
            onSuccess: async () => {
                // Invalidate và refetch ngay lập tức
                await queryClient.invalidateQueries("receivings");
                await queryClient.invalidateQueries(["receiving-details", receiving?.receivingId]);
                // Refetch để đảm bảo dữ liệu được cập nhật
                await queryClient.refetchQueries("receivings");
                alert("Đã hủy phiếu nhập thành công!");
                onClose();
            },
            onError: (error: any) => {
                console.error("Error cancelling receiving:", error);
                let errorMessage = "Không thể hủy phiếu nhập.";

                if (error?.response?.data) {
                    if (typeof error.response.data === "string") {
                        errorMessage = error.response.data;
                    } else if (error.response.data.message) {
                        errorMessage = error.response.data.message;
                    }
                } else if (error?.message) {
                    errorMessage = error.message;
                }

                alert(errorMessage);
            }
        }
    );

    const updateDeliveryCodeMutation = useMutation(
        (newDeliveryCode: string | null) => {
            if (!receiving?.receivingId) {
                throw new Error("Không tìm thấy thông tin phiếu nhập.");
            }
            return receivingService.updateDeliveryCode(receiving.receivingId, newDeliveryCode);
        },
        {
            onSuccess: async (data) => {
                await queryClient.invalidateQueries("receivings");
                await queryClient.invalidateQueries(["receiving-details", receiving?.receivingId]);
                await queryClient.refetchQueries(["receiving-details", receiving?.receivingId]);

                // Cập nhật lại deliveryCode từ response để đảm bảo đồng bộ
                if (data?.deliveryCode !== undefined) {
                    setDeliveryCode(data.deliveryCode || "");
                }

                alert("Đã cập nhật mã phiếu giao hàng thành công!");
                setIsEditingDeliveryCode(false);
            },
            onError: (error: any) => {
                console.error("Error updating delivery code:", error);
                let errorMessage = "Không thể cập nhật mã phiếu giao hàng.";

                if (error?.response?.data) {
                    if (typeof error.response.data === "string") {
                        errorMessage = error.response.data;
                    } else if (error.response.data.message) {
                        errorMessage = error.response.data.message;
                    }
                } else if (error?.message) {
                    errorMessage = error.message;
                }

                alert(errorMessage);
                // Không đóng chế độ edit nếu có lỗi để user có thể sửa lại
            }
        }
    );

    const handleSave = () => {
        mutation.mutate({
            receivingId: receiving.receivingId,
            items: actualList.map(item => ({
                receivingDetailId: item.receivingDetailId,
                actualQuantity: item.actualQuantity || 0,
                damageQuantity: item.damageQuantity || 0,
                damageReason: item.damageReason || null,
                price: item.actualQuantity > 0 ? (item.totalPrice / item.actualQuantity) : item.price // Calculate unit price
            }))
        });
    };

    const isCompleted = status === 1;
    const isCancelled = status === 3;

    // Tính tổng tiền từ chi tiết
    // Lấy tổng + giá tiền * số lượng
    const totalMoney = details.reduce((sum: number, d: any) => {
        return sum + d.price * d.quantity;
    }, 0);


    if (!isOpen) return null;

    // Loading state
    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[9999]">
                <div className="bg-white p-6 rounded-md w-[850px] max-h-[90vh] overflow-auto">
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Đang tải dữ liệu...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[9999]">
                <div className="bg-white p-6 rounded-md w-[850px] max-h-[90vh] overflow-auto">
                    <div className="text-center py-8">
                        <p className="text-red-600 mb-4">Lỗi khi tải dữ liệu phiếu nhập</p>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // No data state
    if (!rawData && !isLoading) {
        return (
            <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[9999]">
                <div className="bg-white p-6 rounded-md w-[850px] max-h-[90vh] overflow-auto">
                    <div className="text-center py-8">
                        <p className="text-gray-600 mb-4">Không tìm thấy dữ liệu phiếu nhập</p>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[9999]">
            <div className="bg-white p-6 rounded-md w-[850px] max-h-[90vh] overflow-auto">

                <h3 className="text-xl font-bold mb-4">
                    Chi tiết phiếu nhập #{rawData?.orderCode || receiving?.orderCode || 'N/A'}
                </h3>

                {/*THÔNG TIN PHIẾU */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                        <p><strong>Mã phiếu nhập:</strong> {rawData?.orderCode}</p>
                        <div className="flex items-center gap-2">
                            <strong>Mã giao hàng:</strong>
                            {isEditingDeliveryCode ? (
                                <div className="flex items-center gap-2 flex-1">
                                    <input
                                        type="text"
                                        value={deliveryCode}
                                        onChange={(e) => setDeliveryCode(e.target.value)}
                                        placeholder="Nhập mã phiếu giao hàng..."
                                        className="border rounded p-1 text-sm flex-1"
                                        disabled={updateDeliveryCodeMutation.isLoading}
                                    />
                                    <button
                                        onClick={() => {
                                            const trimmedCode = deliveryCode.trim();

                                            // Validation: Kiểm tra độ dài
                                            if (trimmedCode.length > 50) {
                                                alert("Mã phiếu giao hàng không được vượt quá 50 ký tự.");
                                                return;
                                            }

                                            // Cho phép để trống (null) hoặc có giá trị
                                            updateDeliveryCodeMutation.mutate(trimmedCode || null);
                                        }}
                                        disabled={updateDeliveryCodeMutation.isLoading}
                                        className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-xs"
                                        title="Lưu"
                                    >
                                        ✓
                                    </button>
                                    <button
                                        onClick={() => {
                                            setDeliveryCode(rawData?.deliveryCode || "");
                                            setIsEditingDeliveryCode(false);
                                        }}
                                        disabled={updateDeliveryCodeMutation.isLoading}
                                        className="px-2 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 disabled:opacity-50 text-xs"
                                        title="Hủy"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span>{rawData?.deliveryCode || "—"}</span>
                                    {!isCancelled && (
                                        <button
                                            onClick={() => setIsEditingDeliveryCode(true)}
                                            className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                                            title="Chỉnh sửa mã phiếu giao hàng"
                                        >
                                            ✏️
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        <p><strong>Ghi chú:</strong> {rawData?.note || "—"}</p>
                        {/* Hiển thị cảnh báo nếu là phiếu nhập thay thế */}
                        {rawData?.note && rawData.note.includes("Hàng cũ bị lỗi đổi hàng khác") && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                <p className="text-yellow-800">
                                    ⚠️ <strong>Phiếu nhập thay thế:</strong> Bạn có thể cập nhật mã phiếu giao hàng bằng tay.
                                </p>
                            </div>
                        )}
                    </div>

                    <div>
                        <p><strong>Người tạo:</strong> {rawData?.userName}</p>
                        <p><strong>Đối tác:</strong> {rawData?.partnerName}</p>
                        <p><strong>Ngày tạo:</strong> {rawData?.createdDate?.slice(0, 19)}</p>
                        <p className="mt-2">
                            <strong>Trạng thái:</strong>{" "}
                            <span
                                className={`px-2 py-1 rounded text-xs ${status === 1
                                    ? "bg-green-100 text-green-700"
                                    : status === 3
                                        ? "bg-red-100 text-red-700"
                                        : status === 2
                                            ? "bg-orange-100 text-orange-700"
                                            : "bg-yellow-100 text-yellow-700"
                                    }`}
                            >
                                {status === 1 ? "Đã hoàn tất" : status === 3 ? "Đã hủy" : status === 2 ? "Một phần" : "Chờ xử lý"}
                            </span>
                        </p>
                    </div>
                </div>

                {/*BẢNG CHI TIẾT*/}
                <h4 className="font-semibold mb-2">Danh sách sản phẩm</h4>

                <table className="w-full border text-sm mb-2">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="border p-2">Sản phẩm</th>
                            <th className="border p-2 text-center">SL dự kiến</th>
                            <th className="border p-2 text-center">SL thực tế</th>
                            <th className="border p-2 text-center">SL hàng lỗi</th>
                            <th className="border p-2 text-center">Lý do lỗi</th>
                            <th className="border p-2 text-right">Giá</th>
                            {isCompleted && <th className="border p-2">Số Series</th>}
                        </tr>
                    </thead>

                    <tbody>
                        {details.length > 0 ? (
                            details.map((d: any, idx: number) => (
                                <tr key={d.receivingDetailId}>
                                    <td className="border p-2">{d.productName}</td>
                                    <td className="border p-2 text-center">{d.quantity}</td>

                                    <td className="border p-2 text-center">
                                        <input
                                            type="number"
                                            min="0"
                                            value={actualList[idx]?.actualQuantity || 0}
                                            disabled={isCompleted || isCancelled}
                                            onChange={(e) => {
                                                const val = Math.max(0, Number(e.target.value));
                                                setActualList(prev =>
                                                    prev.map((x, i) =>
                                                        i === idx ? { ...x, actualQuantity: val } : x
                                                    )
                                                );
                                            }}
                                            className="border rounded p-1 w-20 text-center"
                                        />
                                    </td>

                                    <td className="border p-2 text-center">
                                        <input
                                            type="number"
                                            min="0"
                                            value={actualList[idx]?.damageQuantity || 0}
                                            disabled={isCompleted || isCancelled}
                                            onChange={(e) => {
                                                const val = Math.max(0, Number(e.target.value));
                                                setActualList(prev =>
                                                    prev.map((x, i) =>
                                                        i === idx ? { ...x, damageQuantity: val } : x
                                                    )
                                                );
                                            }}
                                            className="border rounded p-1 w-20 text-center"
                                        />
                                    </td>

                                    <td className="border p-2">
                                        <input
                                            type="text"
                                            value={actualList[idx]?.damageReason || ""}
                                            disabled={isCompleted || isCancelled}
                                            onChange={(e) => {
                                                setActualList(prev =>
                                                    prev.map((x, i) =>
                                                        i === idx ? { ...x, damageReason: e.target.value } : x
                                                    )
                                                );
                                            }}
                                            placeholder="Nhập lý do..."
                                            className="border rounded p-1 w-full text-sm"
                                        />
                                    </td>

                                    <td className="border p-2 text-right">
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="border rounded p-1 w-28 text-right font-bold bg-gray-100">
                                                {formatVND(actualList[idx]?.totalPrice ?? 0)}
                                            </div>
                                            <div className="text-xs text-gray-500 disabled" >
                                                Đơn giá: {actualList[idx]?.actualQuantity > 0
                                                    ? formatVND(actualList[idx].totalPrice / actualList[idx].actualQuantity)
                                                    : formatVND(0)} / cái
                                            </div>
                                        </div>
                                    </td>

                                    {isCompleted && (
                                        <td className="border p-2">
                                            {d.serialNumbers && d.serialNumbers.length > 0 ? (
                                                <div className="space-y-2">
                                                    {/* Thông tin lô hàng FIFO */}
                                                    <div className="bg-blue-50 p-2 rounded text-xs">
                                                        <div className="font-semibold text-blue-800 mb-1">Thông tin lô hàng:</div>
                                                        <div className="text-blue-700 space-y-1">
                                                            <div className="flex items-center gap-1">
                                                                <Package className="w-3 h-3" />
                                                                <span>Số lượng: {d.serialNumbers.length} cái</span>
                                                            </div>

                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                <span>Ngày nhập: {rawData?.receivedDate ? new Date(rawData.receivedDate).toLocaleDateString('vi-VN') : '—'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Tag className="w-3 h-3" />
                                                                <span>Giá đơn vị: {d.price.toLocaleString()} VNĐ/cái</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Danh sách SerialNumber */}
                                                    <div className="max-h-32 overflow-y-auto border rounded p-1 bg-gray-50">
                                                        <div className="text-xs font-semibold text-gray-600 mb-1">Danh sách SerialNumber:</div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {d.serialNumbers.map((sn: string, i: number) => (
                                                                <span
                                                                    key={i}
                                                                    className="px-2 py-1 bg-white border border-blue-200 text-blue-700 rounded text-xs font-mono hover:bg-blue-100 cursor-help"
                                                                    title={`SerialNumber: ${sn}\nLô hàng: ${rawData?.orderCode}\nGiá: ${d.price.toLocaleString()} VNĐ`}
                                                                >
                                                                    {sn}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1 text-center">
                                                            Tổng: {d.serialNumbers.length} số series
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">Chưa có SerialNumber</span>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={isCompleted ? 7 : 6} className="text-center p-4 text-gray-500">
                                    Không có chi tiết.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/*HIỆN TỔNG TIỀN*/}
                <div className="text-right font-bold text-lg py-2">
                    Tổng tiền  : {formatVND(totalMoney)}
                </div>

                {/* 
                <div className="text-right font-bold text-lg py-2">
                   Tổng tiền chia đôi: {formatVND(totalMoney/2)}
                </div>
                */}

                {/*NÚT*/}
                <div className="flex justify-between mt-4">
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
                        >
                            Đóng
                        </button>
                        {/* Nút in phiếu nhập - chỉ hiển thị khi phiếu đang Pending */}
                        {status === 0 && !isCancelled && (
                            <button
                                onClick={() => {
                                    navigate(`/nhaphang/print/${receivingId}`);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                            >
                                <Printer className="w-4 h-4" />
                                In phiếu nhập
                            </button>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {/* Nút hủy - chỉ hiển thị khi phiếu đang Pending hoặc Partial (chưa completed và chưa cancelled) */}
                        {!isCompleted && !isCancelled && (
                            <button
                                onClick={() => {
                                    if (window.confirm("Bạn có chắc chắn muốn hủy phiếu nhập này?")) {
                                        cancelMutation.mutate();
                                    }
                                }}
                                disabled={cancelMutation.isLoading}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                            >
                                {cancelMutation.isLoading ? "Đang xử lý..." : "Hủy phiếu nhập"}
                            </button>
                        )}

                        {/* Nút lưu - chỉ hiển thị khi phiếu chưa completed và chưa cancelled */}
                        {!isCompleted && !isCancelled && details.length > 0 && (
                            <button
                                onClick={handleSave}
                                disabled={mutation.isLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                            >
                                {mutation.isLoading ? "Đang lưu..." : "Lưu số lượng thực tế"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceivingDetailModal;
