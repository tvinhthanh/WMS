import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "react-query";
import { X } from "lucide-react";
import { PartnerDTO, PartnerCreateDTO, PartnerUpdateDTO } from "../../../types";
import { partnerService } from "../../../services/partner.service"; // Ensure you have this service for partners

interface Props {
    isOpen: boolean;
    onClose: () => void;
    partner?: PartnerDTO | null; // Updated to match the PartnerDTO type
}

const DoitacModal = ({ isOpen, onClose, partner }: Props) => {
    const [formData, setFormData] = useState<PartnerCreateDTO>({
        partnerName: "",
        address: "",
        partnerType: "",
        phoneNumber: "",
        representative: ""
    });

    const queryClient = useQueryClient();
    const isEdit = !!partner;

    // ================================
    // CREATE & UPDATE MUTATIONS
    // ================================
    const createMutation = useMutation(
        (payload: PartnerCreateDTO) => partnerService.create(payload),
        {
            onSuccess: () => {
                queryClient.invalidateQueries("partners");
                onClose();
            },
        }
    );

    const updateMutation = useMutation(
        (payload: { id: number; data: PartnerUpdateDTO }) =>
            partnerService.update(payload.id, payload.data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries("partners");
                onClose();
            },
        }
    );

    // ================================
    // LOAD DATA INTO FORM (CREATE / EDIT)
    // ================================
    useEffect(() => {
        if (partner) {
            setFormData({
                partnerName: partner.partnerName,
                address: partner.address,
                partnerType: partner.partnerType,
                phoneNumber: partner.phoneNumber,
                representative: partner.representative,
            });
        } else {
            setFormData({
                partnerName: "",
                address: "",
                partnerType: "",
                phoneNumber: "",
                representative: "",
            });
        }
    }, [partner]);

    // ================================
    // FORM HANDLING
    // ================================
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEdit && partner) {
            updateMutation.mutate({
                id: partner.partnerId,
                data: formData,
            });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    if (!isOpen) return null;

    const loading = createMutation.isLoading || updateMutation.isLoading;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
                {/* HEADER */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">
                        {isEdit ? "Sửa đối tác" : "Thêm đối tác"}
                    </h2>
                    <button onClick={onClose}>
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* PARTNER NAME */}
                    <div>
                        <label className="block text-sm font-medium">Tên đối tác</label>
                        <input
                            name="partnerName"
                            value={formData.partnerName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded"
                            required
                        />
                    </div>

                    {/* ADDRESS */}
                    <div>
                        <label className="block text-sm font-medium">Địa chỉ</label>
                        <input
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded"
                            required
                        />
                    </div>

                    {/* PARTNER TYPE */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Loại đối tác</label>
                        <select
                            name="partnerType"
                            value={formData.partnerType}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">-- Chọn loại đối tác --</option>
                            <option value="Nhà cung cấp">Nhà cung cấp</option>
                            <option value="Nhà phân phối">Nhà phân phối</option>
                        </select>
                    </div>

                    {/* PHONE NUMBER */}
                    <div>
                        <label className="block text-sm font-medium">Số điện thoại</label>
                        <input
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded"
                            required
                        />
                    </div>

                    {/* REPRESENTATIVE */}
                    <div>
                        <label className="block text-sm font-medium">Đại diện</label>
                        <input
                            name="representative"
                            value={formData.representative}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded"
                            required
                        />
                    </div>

                    {/* ACTIONS */}
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded"
                        >
                            {loading ? "Đang xử lý..." : isEdit ? "Cập nhật" : "Thêm"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DoitacModal;
