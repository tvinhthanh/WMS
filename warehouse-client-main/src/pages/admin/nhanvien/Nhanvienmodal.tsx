/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { X } from "lucide-react";
import { UserDTO } from "../../../types";
import { userService } from "../../../services/employee.service";

interface EmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: (UserDTO & { __mode?: "add" | "edit" | "view" }) | null;
}

const EmployeeModal = ({ isOpen, onClose, employee }: EmployeeModalProps) => {
    const queryClient = useQueryClient();

    const mode = employee?.__mode || "add";
    const isEdit = mode === "edit";
    const isAdd = mode === "add";
    const isView = mode === "view";

    const disabled = isView;

    // ===============================
    // FORM STATE (1 OBJECT)
    // ===============================
    const [formData, setFormData] = useState<UserDTO>({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        gender: "",
        birthDate: "",
        role: "Staff",
        position: "Staff",
        salary: 0
    });

    // ===============================
    // LOAD DATA WHEN OPEN MODAL
    // ===============================
    useEffect(() => {
        if (employee && !isAdd) {
            setFormData({
                fullName: employee.fullName || "",
                email: employee.email || "",
                phone: employee.phone || "",
                address: employee.address || "",
                gender: employee.gender || "",
                birthDate: employee.birthDate?.substring(0, 10) || "",
                role: employee.role || "Staff",
                position: employee.position || "Staff",
                salary: employee.salary || 0
            });
        } else {
            setFormData({
                fullName: "",
                email: "",
                phone: "",
                address: "",
                gender: "",
                birthDate: "",
                role: "Staff",
                position: "Staff",
                salary: 0
            });
        }
    }, [employee]);

    // ===============================
    // API MUTATION
    // ===============================
    const createMutation = useMutation(userService.create, {
        onSuccess: () => {
            queryClient.invalidateQueries("employees");
            onClose();
        }
    });

    const updateMutation = useMutation(
        (payload: { id: number; data: UserDTO }) =>
            userService.update(payload.id, payload.data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries("employees");
                onClose();
            }
        }
    );

    // ===============================
    // HANDLE SUBMIT
    // ===============================
    const handleSubmit = () => {
        if (isView) return;

        if (!formData.fullName?.trim()) return alert("Họ tên không được để trống");
        if (!formData.email?.trim()) return alert("Email không được để trống");

        if (isEdit && employee?.userId) {
            // UPDATE
            updateMutation.mutate({
                id: employee.userId,
                data: formData
            });
        } else {
            // CREATE
            const payload: UserDTO = {
                employeeCode: "",
                userName: formData.email,
                email: formData.email,
                fullName: formData.fullName,
                phone: formData.phone,
                address: formData.address,
                gender: formData.gender,
                birthDate: formData.birthDate,
                role: formData.role,
                position: formData.position,
                salary: formData.salary,
                password: "123456"
            };

            createMutation.mutate(payload);
        }
    };

    // ===============================
    // HANDLE CHANGE (GENERIC)
    // ===============================
    const onFieldChange = (key: keyof UserDTO, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [key]: value
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg relative max-h-[90vh] flex flex-col">

                {/* CLOSE BUTTON */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* HEADER */}
                <div className="px-6 pt-6 pb-3">
                    <h2 className="text-xl font-bold">
                        {isView && "Xem thông tin nhân viên"}
                        {isEdit && "Sửa thông tin nhân viên"}
                        {isAdd && "Thêm nhân viên mới"}
                    </h2>

                    {employee && !isAdd && (
                        <p className="text-sm text-gray-500 mt-1">
                            Mã nhân viên: <b>{employee.employeeCode}</b>
                        </p>
                    )}

                    {isAdd && (
                        <p className="text-sm text-gray-500 mt-1">
                            Tài khoản sẽ tự tạo: NVxxx — mật khẩu mặc định: <b>123456</b>
                        </p>
                    )}
                </div>

                {/* BODY */}
                <div className="px-6 space-y-4 overflow-y-auto max-h-[60vh] pb-4 pr-2">

                    <Input label="Họ tên" value={formData.fullName} disabled={disabled}
                        onChange={(v) => onFieldChange("fullName", v)} />

                    <Input label="Email" type="email" value={formData.email} disabled={disabled}
                        onChange={(v) => onFieldChange("email", v)} />

                    <Input label="Số điện thoại" value={formData.phone} disabled={disabled}
                        onChange={(v) => onFieldChange("phone", v)} />

                    <Input label="Địa chỉ" value={formData.address} disabled={disabled}
                        onChange={(v) => onFieldChange("address", v)} />

                    <Select label="Giới tính" value={formData.gender} disabled={disabled}
                        options={[
                            { value: "", label: "-- Chọn --" },
                            { value: "Male", label: "Nam" },
                            { value: "Female", label: "Nữ" },
                            { value: "Other", label: "Khác" }
                        ]}
                        onChange={(v) => onFieldChange("gender", v)}
                    />

                    <Input label="Ngày sinh" type="date" value={formData.birthDate}
                        disabled={disabled}
                        onChange={(v) => onFieldChange("birthDate", v)} />

                    <Select label="Quyền" value={formData.role} disabled={disabled}
                        options={[
                            // { value: "Admin", label: "Admin" },
                            { value: "Staff", label: "Staff" },
                        ]}
                        onChange={(v) => onFieldChange("role", v)}
                    />

                    <Input label="Vị trí" value={formData.position} disabled={disabled}
                        onChange={(v) => onFieldChange("position", v)} />

                    <Input label="Lương" type="number" value={formData.salary ?? 0}
                        disabled={disabled}
                        onChange={(v) => onFieldChange("salary", Number(v))} />
                </div>

                {/* FOOTER */}
                {!isView && (
                    <div className="px-6 py-4 flex justify-end gap-3 border-t">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            {isEdit ? "Lưu thay đổi" : "Thêm mới"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeModal;

/* ---------------------------- Components ---------------------------- */

const Input = ({
    label,
    value,
    type = "text",
    disabled,
    onChange
}: {
    label: string;
    value: any;
    type?: string;
    disabled?: boolean;
    onChange: (value: string) => void;
}) => (
    <div>
        <label className="block text-sm mb-1">{label}</label>
        <input
            type={type}
            disabled={disabled}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full border px-3 py-2 rounded ${disabled ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
        />
    </div>
);

const Select = ({
    label,
    value,
    disabled,
    onChange,
    options
}: {
    label: string;
    value: any;
    disabled?: boolean;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}) => (
    <div>
        <label className="block text-sm mb-1">{label}</label>
        <select
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border px-3 py-2 rounded"
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    </div>
);
