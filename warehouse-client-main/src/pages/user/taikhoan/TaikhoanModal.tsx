/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useMutation } from "react-query";
import { X } from "lucide-react";
import { authService } from "../../../services/auth.service";
import { userService } from "../../../services/user.service";
import { useAppContext } from "../../../contexts/AppContext";

const ModalUpdateAccount = ({ isOpen, onClose, user, onUpdated }: any) => {
    const { showToast } = useAppContext();
    const [activeTab, setActiveTab] = useState<"info" | "password">("info");

    const [fullName, setFullName] = useState(user.fullName);
    const [phone, setPhone] = useState(user.phone || "");
    const [address, setAddress] = useState(user.address || "");
    const [gender, setGender] = useState(user.gender || "");
    const [birthDate, setBirthDate] = useState(
        user.birthDate ? user.birthDate.substring(0, 10) : ""
    );

    const [currentPassword, setCurrentPassword] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");

    const updateMutation = useMutation(authService.updateProfile);
    //  Đổi mật khẩu (JWT user)
    const changePassMutation = useMutation((payload: any) =>
    userService.changePassword(payload)
    );
    const handleUpdate = () => {
        updateMutation.mutate(
            {
                fullName,
                phone,
                address,
                gender,
                birthDate,
            },
            {
                onSuccess: () => {
                    showToast({ message: "Cập nhật thông tin thành công!", type: "SUCCESS" });
                    onUpdated({
                        ...user,
                        fullName,
                        phone,
                        address,
                        gender,
                        birthDate,
                    });
                    setTimeout(() => onClose(), 1500);
                },
                onError: (err: any) => {
                    const message = err?.response?.data?.message || "Lỗi cập nhật thông tin";
                    showToast({ message, type: "ERROR" });
                },
            }
        );
    };

    const handleChangePassword = () => {
        if (!currentPassword || !password || !passwordConfirmation) {
            showToast({ message: "Vui lòng điền đầy đủ thông tin!", type: "ERROR" });
            return;
        }
        //  Validate độ dài mật khẩu tối thiểu 6 ký tự cho tất cả field
        if (currentPassword.length < 6) {
            showToast({ message: "Mật khẩu hiện tại phải tối thiểu 6 ký tự!", type: "ERROR" });
            return;
        }
        if (password.length < 6) {
            showToast({ message: "Mật khẩu mới phải tối thiểu 6 ký tự!", type: "ERROR" });
            return;
        }
        if (passwordConfirmation.length < 6) {
            showToast({ message: "Xác nhận mật khẩu phải tối thiểu 6 ký tự!", type: "ERROR" });
            return;
        }
        if (password !== passwordConfirmation) {
            showToast({ message: "Mật khẩu xác nhận không khớp!", type: "ERROR" });
            return;
        }
        const payload = {
            Password: currentPassword,
            NewPassword: password,
            ConfirmPassword: passwordConfirmation,
        };
        //  Xem dữ liệu gửi đi
        console.log("Change password payload:", payload);
        changePassMutation.mutate(
            payload,
            {
                onSuccess: () => {
                    showToast({ message: "Đổi mật khẩu thành công!", type: "SUCCESS" });
                    setCurrentPassword("");
                    setPassword("");
                    setPasswordConfirmation("");
                    setTimeout(() => onClose(), 1500);
                },
                onError: (err: any) => {
                    const message = err?.response?.data?.message || "Lỗi đổi mật khẩu";
                    showToast({ message, type: "ERROR" });
                },
            }
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-lg p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                >
                    <X />
                </button>

                <h2 className="text-xl font-bold mb-4">Cập nhật tài khoản</h2>

                {/* TABS */}
                <div className="flex border-b mb-4">
                    <button
                        className={`px-4 py-2 text-sm font-semibold ${activeTab === "info"
                            ? "border-b-2 border-blue-600 text-blue-600"
                            : "text-gray-600"
                            }`}
                        onClick={() => setActiveTab("info")}
                    >
                        Thông tin cá nhân
                    </button>

                    <button
                        className={`px-4 py-2 text-sm font-semibold ml-4 ${activeTab === "password"
                            ? "border-b-2 border-blue-600 text-blue-600"
                            : "text-gray-600"
                            }`}
                        onClick={() => setActiveTab("password")}
                    >
                        Đổi mật khẩu
                    </button>
                </div>

                {/* TAB CONTENT */}
                {activeTab === "info" && (
                    <div className="space-y-3">
                        <Input label="Họ tên" value={fullName} onChange={setFullName} />
                        <Input label="Số điện thoại" value={phone} onChange={setPhone} />
                        <Input label="Địa chỉ" value={address} onChange={setAddress} />
                        <Input label="Giới tính" value={gender} onChange={setGender} />
                        <Input
                            label="Ngày sinh"
                            type="date"
                            value={birthDate}
                            onChange={setBirthDate}
                        />

                        <button
                            onClick={handleUpdate}
                            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Lưu thông tin
                        </button>
                    </div>
                )}

                {activeTab === "password" && (
                    <div className="space-y-3">
                        <Input
                            label="Mật khẩu hiện tại"
                            type="password"
                            value={currentPassword}
                            onChange={setCurrentPassword}
                        />
                        <Input
                            label="Mật khẩu mới"
                            type="password"
                            value={password}
                            onChange={setPassword}
                        />
                        <Input
                            label="Xác nhận mật khẩu mới"
                            type="password"
                            value={passwordConfirmation}
                            onChange={setPasswordConfirmation}
                        />

                        <button
                            onClick={handleChangePassword}
                            className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            Đổi mật khẩu
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModalUpdateAccount;

const Input = ({ label, value, onChange, type = "text" }: any) => (
    <div>
        <label className="block text-sm mb-1">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border px-3 py-2 rounded"
        />
    </div>
);
