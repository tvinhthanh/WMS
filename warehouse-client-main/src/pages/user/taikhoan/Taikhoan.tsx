/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { authService } from "../../../services/auth.service";
import { useAppContext } from "../../../contexts/AppContext";
import ModalUpdateAccount from "./TaikhoanModal";
import Table, { Column } from "../../../components/Table";
import { LoginHistoryDTO, UserDTO } from "../../../types";

const Taikhoan = () => {
    const { userId, role } = useAppContext();
    const queryClient = useQueryClient();
    const [openModal, setOpenModal] = useState(false);

    const meQuery = useQuery(["me"], authService.me, { enabled: false });
    const logQuery = useQuery(["my-login-history"], authService.myLoginHistory, { enabled: false });

    useEffect(() => {
        if (userId) {
            meQuery.refetch();
            logQuery.refetch();
        }
    }, [userId]);

    if (meQuery.isLoading || logQuery.isLoading) return <div className="p-4">Đang tải...</div>;
    if (meQuery.isError || logQuery.isError) return <div className="p-4 text-red-500">Lỗi tải dữ liệu</div>;

    const user: UserDTO | undefined = meQuery.data?.user;
    // [BUG FIX] Lỗi data.map - Kiểm tra logQuery.data có phải array không
    const logs: LoginHistoryDTO[] = Array.isArray(logQuery.data) ? logQuery.data : [];
    if (!user) return <div className="p-4">Không tìm thấy dữ liệu</div>;

    // Table columns
    const columns: Column<LoginHistoryDTO>[] = [
        {
            title: "Thời gian",
            render: (_, row) => new Date(row.loginTime).toLocaleString("vi-VN")
        },
        { title: "IP", dataIndex: "ipAddress" },
        { title: "Thiết bị", dataIndex: "userAgent" }
    ];

    return (
        <div className="grid grid-cols-2 gap-6 max-w-6xl mx-auto">

            {/* LEFT — ACCOUNT INFO */}
            <div className="bg-white shadow rounded p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Thông Tin Tài Khoản</h2>

                    {role === "Staff" && (
                        <button
                            onClick={() => setOpenModal(true)}
                            className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                            Cập nhật
                        </button>
                    )}
                </div>

                <div className="space-y-3 text-sm">
                    <Item label="Mã nhân viên" value={user.userName} />
                    <Item label="Họ tên" value={user.fullName} />
                    <Item label="Email" value={user.email} />
                    <Item label="Số điện thoại" value={user.phone} />
                    <Item label="Địa chỉ" value={user.address} />
                    <Item label="Giới tính" value={user.gender} />
                    <Item
                        label="Ngày sinh"
                        value={user.birthDate ? new Date(user.birthDate).toLocaleDateString("vi-VN") : "—"}
                    />
                    <Item label="Chức vụ" value={user.position} />
                    <Item
                        label="Lương"
                        value={user.salary ? `${user.salary.toLocaleString("vi-VN")} VNĐ` : "—"}
                    />
                    <Item
                        label="Ngày tạo"
                        value={user.createdDate ? new Date(user.createdDate).toLocaleDateString("vi-VN") : "—"}
                    />
                </div>
            </div>

            {/* RIGHT — LOGIN HISTORY (TABLE) */}
            <div className="bg-white shadow rounded p-6">
                <h2 className="text-lg font-bold mb-3">
                    Lịch sử đăng nhập (30 lần gần nhất)
                </h2>

                <div className="max-h-[500px] overflow-y-auto pr-1">
                    <Table columns={columns} data={logs} />
                </div>
            </div>

            {/* MODAL UPDATE */}
            {role === "Staff" && (
                <ModalUpdateAccount
                    isOpen={openModal}
                    onClose={() => setOpenModal(false)}
                    user={user}
                    onUpdated={(newUser: UserDTO) => {
                        queryClient.setQueryData(["me"], (old: any) => ({
                            ...old,
                            user: newUser,
                        }));
                    }}
                />
            )}
        </div>
    );
};

const Item = ({ label, value }: { label: string; value?: string | number | null }) => (
    <div>
        <span className="font-semibold">{label}: </span>
        {value ?? "—"}
    </div>
);

export default Taikhoan;
