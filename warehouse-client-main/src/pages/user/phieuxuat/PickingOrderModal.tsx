/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { X, User, Calendar, FileText, AlertCircle } from "lucide-react";
import { PickingOrderDTO, PickingCreateDTO } from "../../../types";
import { pickingService } from "../../../services/picking.service";
import { partnerService } from "../../../services/partner.service"; // Assuming you have a service for partners
import { useAppContext } from "../../../contexts/AppContext";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    order: (PickingOrderDTO & { __mode?: "create" | "view" }) | null;
}

// Function to fetch partners
const fetchPartners = async () => {
    const response = await partnerService.getAll();
    return response;
};

const PickingOrderModal = ({ isOpen, onClose, order }: Props) => {
    const queryClient = useQueryClient();
    const { userId } = useAppContext();
    
    // State hooks for partner selection
    const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);

    // Fetch partners using React Query
    const { data: allPartners = [], isLoading, isError } = useQuery("partners", fetchPartners);
    
    // Chỉ hiển thị "Nhà phân phối" cho phiếu xuất
    const partners = allPartners.filter((p: any) => p.partnerType === "Nhà phân phối");

    // Determine if it's a 'create' or 'view' mode
    const isCreate = order?.__mode === "create";
    const isView = order?.__mode === "view";

    // Mutation for creating a new picking order
    const createMutation = useMutation(
        (payload: PickingCreateDTO) => pickingService.createOrder(payload),
        {
            onSuccess: () => {
                queryClient.invalidateQueries("pickings");
                onClose();
            },
            onError: (error: any) => {
                alert(`Lỗi tạo phiếu xuất: ${error?.response?.data || error.message}`);
            }
        }
    );

    // Mutation for cancelling a picking order
    const cancelMutation = useMutation(
        () => pickingService.cancel(order!.pickingOrderId),
        {
            onSuccess: () => {
                queryClient.invalidateQueries("pickings");
                alert("Đã hủy phiếu xuất thành công!");
                onClose();
            },
            onError: (error: any) => {
                alert(error?.response?.data?.message || "Không thể hủy phiếu xuất.");
            }
        }
    );

    // Handle the create action
    const handleCreate = () => {
        if (!userId) {
            alert("Không tìm thấy thông tin người dùng!");
            return;
        }

        if (!selectedPartnerId) {
            alert("Vui lòng chọn đối tác!");
            return;
        }

        createMutation.mutate({
            createByUserId: userId,
            partnerId: selectedPartnerId, // Include the selected partnerId
        });
    };

    // Format date function
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Get status display for the order
    const getStatusDisplay = (status: string) => {
        switch (status) {
            case "Completed":
                return {
                    text: "Đã hoàn tất",
                    className: "bg-green-100 text-green-700 border-green-200"
                };
            case "Cancelled":
                return {
                    text: "Đã hủy",
                    className: "bg-red-100 text-red-700 border-red-200"
                };
            case "Pending":
                return {
                    text: "Chờ xử lý",
                    className: "bg-yellow-100 text-yellow-700 border-yellow-200"
                };
            default:
                return {
                    text: status,
                    className: "bg-gray-100 text-gray-700 border-gray-200"
                };
        }
    };

    // Get user display (either createByUser or fallback to userId)
    const getUserDisplay = (order: PickingOrderDTO) => {
        const orderWithUser = order as any;

        if (orderWithUser.createByUser) {
            const user = orderWithUser.createByUser;
            return {
                main: user.fullName || user.username || `User #${order.createByUser?.userId}`,
                sub: user.fullName && user.username ? `@${user.username}` : null
            };
        }

        return {
            main: `User #${order.createByUser?.userId}`,
            sub: null
        };
    };

    // Prevent rendering if the modal is not open
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
                <button
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition"
                    onClick={onClose}
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold mb-4">
                    {isCreate ? "Tạo Phiếu Xuất Mới" : "Chi Tiết Phiếu Xuất"}
                </h2>

                {isView && order && (
                    <div className="space-y-4">
                        {/* Displaying Order Details */}
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-gray-500 mb-1">Mã phiếu xuất</p>
                                <p className="font-mono font-semibold text-lg">
                                    {order.orderCode}
                                </p>
                            </div>
                        </div>

                        {/* Displaying User who created the order */}
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <User className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-gray-500 mb-1">Người tạo</p>
                                <p className="font-medium">
                                    {getUserDisplay(order).main}
                                </p>
                                {getUserDisplay(order).sub && (
                                    <p className="text-sm text-gray-500">
                                        {getUserDisplay(order).sub}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <User className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div className="flex-1">
                                    <p className="text-sm text-gray-500 mb-1">Đối tác</p>     
                                    <p className="font-medium">
                                            {order.partnerName || "Không có dữ liệu"}
                                    </p>       
                                     {order.partnerId && (
                                         <p className="text-sm text-gray-500">
                                             Mã: {order.partnerId}
                                        </p>
                                     )}
                             </div>
                        </div>

                        {/* Displaying Order creation date */}
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-gray-500 mb-1">Ngày tạo</p>
                                <p className="font-medium">
                                    {formatDate(order.createDate)}
                                </p>
                            </div>
                        </div>

                        {/* Displaying Order status */}
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-gray-500 mb-1">Trạng thái</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusDisplay(order.status).className}`}>
                                    {getStatusDisplay(order.status).text}
                                </span>
                            </div>
                        </div>

                        {/* Displaying the total number of products */}
                        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex-1">
                                <p className="text-sm text-blue-600 mb-1">Tổng số sản phẩm</p>
                                <p className="text-2xl font-bold text-blue-700">
                                    {order.details?.length || 0}
                                </p>
                                {order.details && order.details.length > 0 && (
                                    <p className="text-sm text-blue-600 mt-1">
                                        Tổng số lượng: {order.details.reduce((sum, d) => sum + d.quantityPicked, 0)}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Displaying products inside the order */}
                        {order.details && order.details.length > 0 && (
                            <div className="mt-4 border-t pt-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                    Sản phẩm trong phiếu:
                                </p>
                                <div className="max-h-40 overflow-y-auto space-y-2">
                                    {order.details.map((detail, index) => (
                                        <div
                                            key={detail.pickingDetailId || index}
                                            className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm"
                                        >
                                            <span className="text-gray-700">
                                                {detail.productName || `Product #${detail.productId}`}
                                            </span>
                                            <span className="font-medium text-gray-900">
                                                x{detail.quantityPicked}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Cancel button for Pending orders */}
                        {order.status === "Pending" && (
                            <div className="mt-4 pt-4 border-t">
                                <button
                                    onClick={() => {
                                        if (window.confirm("Bạn có chắc chắn muốn hủy phiếu xuất này?")) {
                                            cancelMutation.mutate();
                                        }
                                    }}
                                    disabled={cancelMutation.isLoading}
                                    className="w-full bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    {cancelMutation.isLoading ? "Đang xử lý..." : "Hủy phiếu xuất"}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {isCreate && (
                    <div>
                        {/* Partner Selection Dropdown */}
                        <div className="mb-4">
                            <label htmlFor="partner" className="block text-sm font-medium text-gray-700">
                                Chọn Đối Tác <span className="text-gray-500 text-xs">(Nhà phân phối)</span>
                            </label>
                            {partners.length === 0 ? (
                                <div className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                    <p className="text-sm text-yellow-800">
                                        Chưa có đối tác loại "Nhà phân phối". Vui lòng tạo đối tác trước.
                                    </p>
                                </div>
                            ) : (
                            <select
                                id="partner"
                                name="partner"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                value={selectedPartnerId || ""}
                                onChange={(e) => setSelectedPartnerId(Number(e.target.value))}
                                    disabled={isLoading || isError}
                            >
                                <option value="">Chọn đối tác</option>
                                    {partners.map((partner: any) => (
                                    <option key={partner.partnerId} value={partner.partnerId}>
                                        {partner.partnerName}
                                    </option>
                                ))}
                            </select>
                            )}
                        </div>

                        {/* Instructions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-blue-800">
                                Phiếu xuất mới sẽ được tạo với trạng thái "Chờ xử lý". Sau khi tạo, bạn có thể thêm sản phẩm vào phiếu.
                            </p>
                        </div>

                        <button
                            onClick={handleCreate}
                            className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            disabled={createMutation.isLoading || !selectedPartnerId}
                        >
                            {createMutation.isLoading ? "Đang tạo..." : "Tạo Phiếu Xuất"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PickingOrderModal;
