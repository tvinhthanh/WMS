/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Edit, Trash2, Eye, KeyRound } from "lucide-react";
import { Clock } from "lucide-react";
import LoginHistory from "./LoginHistory";
import EmployeeModal from "./Nhanvienmodal";
import { UserDTO } from "../../../types";
import { userService } from "../../../services/employee.service";

const Nhanvien = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("name-asc");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] =
        useState<(UserDTO & { __mode?: "add" | "edit" | "view" }) | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [historyUser, setHistoryUser] = useState<{ userId: number; fullName?: string } | null>(null);

    const queryClient = useQueryClient();

    // ================================
    // FETCH EMPLOYEES
    // ================================
    const { data: employees = [], isLoading, isError } = useQuery(
        "employees",
        userService.getAll
    );

    const deleteMutation = useMutation(userService.delete, {
        onSuccess: () => queryClient.invalidateQueries("employees")
    });

    // ================================
    // FILTER ONLY STAFF
    // ================================
    const staffUsers = employees.filter(
        (u) => u.role?.toLowerCase() === "staff"
    );

    const filteredEmployees = staffUsers
        .filter((emp) => {
            const full = emp.fullName?.toLowerCase() || "";
            const mail = emp.email?.toLowerCase() || "";
            const search = searchTerm.toLowerCase();

            return full.includes(search) || mail.includes(search);
        })
        .sort((a, b) => {
            const nameA = a.fullName || "";
            const nameB = b.fullName || "";

            switch (sortBy) {
                case "name-asc":
                    return nameA.localeCompare(nameB);
                case "name-desc":
                    return nameB.localeCompare(nameA);
                case "role-asc":
                    return (a.position || "").localeCompare(b.position || "");
                case "role-desc":
                    return (b.position || "").localeCompare(a.position || "");
                default:
                    return 0;
            }
        });

    // ================================
    // ACTION HANDLERS
    // ================================
    const handleAdd = () => {
        setSelectedEmployee({ __mode: "add" } as any);
        setIsModalOpen(true);
    };

    const handleView = (employee: UserDTO) => {
        setSelectedEmployee({ ...employee, __mode: "view" });
        setIsModalOpen(true);
    };

    const handleHistory = (employee: UserDTO) => {
        setHistoryUser({ userId: employee.userId!, fullName: employee.fullName });
        setIsHistoryOpen(true);
    };

    const handleEdit = (employee: UserDTO) => {
        setSelectedEmployee({ ...employee, __mode: "edit" });
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        if (window.confirm("Bạn có chắc muốn xóa nhân viên này?")) {
            deleteMutation.mutate(id);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedEmployee(null);
    };

    // ================================
    // UI
    // ================================
    if (isLoading) return <div className="p-4">Đang tải...</div>;
    if (isError) return <div className="p-4 text-red-500">Lỗi khi tải dữ liệu</div>;

    return (
        <div className="max-w-6xl mx-auto">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Quản Lý Nhân Viên (Staff)</h1>

                <div className="flex gap-2">
                    <button
                        onClick={() => navigate("/admin/password-reset-requests")}
                        className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                    >
                        <KeyRound className="w-4 h-4" />
                        Yêu cầu Reset Mật khẩu
                    </button>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Thêm nhân viên
                </button>
                </div>
            </div>

            {/* SEARCH BAR */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên hoặc email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="name-asc">Tên A-Z</option>
                        <option value="name-desc">Tên Z-A</option>
                        <option value="role-asc">Chức vụ A-Z</option>
                        <option value="role-desc">Chức vụ Z-A</option>
                    </select>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                    <p className="text-sm text-gray-600">
                        Hiển thị {filteredEmployees.length} nhân viên (staff)
                    </p>
                </div>

                {filteredEmployees.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-4 text-left font-medium w-12">ID</th>
                                    <th className="p-4 text-left font-medium">Tên</th>
                                    <th className="p-4 text-left font-medium">Email</th>
                                    <th className="p-4 text-left font-medium">Ngày tạo</th>
                                    <th className="p-4 text-left font-medium">Chức vụ</th>
                                    <th className="p-4 text-right font-medium">Thao tác</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredEmployees.map((emp) => (
                                    <tr key={emp.userId} className="border-t hover:bg-gray-50">
                                        <td className="p-4 text-gray-500">{emp.userId}</td>

                                        <td className="p-4">
                                            <div className="font-medium">{emp.fullName}</div>
                                            <div className="text-xs text-gray-500">{emp.employeeCode}</div>
                                        </td>

                                        <td className="p-4">{emp.email}</td>

                                        <td className="p-4">
                                            {emp.createdDate
                                                ? new Date(emp.createdDate).toLocaleDateString("vi-VN")
                                                : "--"}
                                        </td>

                                        <td className="p-4 capitalize">{emp.position || emp.role}</td>

                                        <td className="p-4">
                                            <div className="flex justify-end gap-2">

                                                <button
                                                    onClick={() => handleView(emp)}
                                                    className="p-2 text-gray-700 hover:bg-gray-100 rounded"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => handleHistory(emp)}
                                                    className="p-2 text-gray-700 hover:bg-gray-100 rounded"
                                                >
                                                    <Clock className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => handleEdit(emp)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(emp.userId!)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>

                                            </div>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        {searchTerm
                            ? "Không tìm thấy nhân viên nào phù hợp"
                            : "Chưa có nhân viên Staff nào"}
                    </div>
                )}
            </div>

            <EmployeeModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                employee={selectedEmployee}
            />
            <LoginHistory
                isOpen={isHistoryOpen}
                onClose={() => { setIsHistoryOpen(false); setHistoryUser(null); }}
                userId={historyUser?.userId ?? null}
                userName={historyUser?.fullName}
            />
        </div>
    );
};

export default Nhanvien;
