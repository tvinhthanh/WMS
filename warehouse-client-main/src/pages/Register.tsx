/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/Register.tsx
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import { useAppContext } from "../contexts/AppContext";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service";
import { RegisterPayload } from "../types";

export type RegisterFormData = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;

  phone?: string;
  address?: string;
  gender?: string;
  birthDate?: string;
  salary?: number;
};

const Register = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showToast, setUserData } = useAppContext();

  const { register, watch, handleSubmit, formState: { errors } } =
    useForm<RegisterFormData>();

  const mutation = useMutation(authService.register, {
    onSuccess: async (data) => {
      localStorage.setItem("token", data.token);
      setUserData(data.user);

      showToast({ message: "Đăng ký thành công!", type: "SUCCESS" });
      await queryClient.invalidateQueries("validateToken");
      navigate("/");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message;
      showToast({ message: msg, type: "ERROR" });
    },
  });

  const onSubmit = handleSubmit((data) => {
    const payload: RegisterPayload = {
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      phone: data.phone,
      address: data.address,
      gender: data.gender,
      birthDate: data.birthDate,
      salary: data.salary
    };

    mutation.mutate(payload);
  });

  return (
    <form className="flex flex-col gap-4 p-4 max-w-md mx-auto" onSubmit={onSubmit}>
      <h2 className="text-xl font-bold text-center mb-3">Tạo tài khoản</h2>

      {/* Full name */}
      <label className="text-xs font-semibold">
        Họ và tên
        <input
          className="border rounded w-full py-1 px-2 text-sm"
          {...register("fullName", { required: "Vui lòng nhập họ tên" })}
        />
        {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName.message}</p>}
      </label>

      {/* Email */}
      <label className="text-xs font-semibold">
        Email
        <input
          type="email"
          className="border rounded w-full py-1 px-2 text-sm"
          {...register("email", { required: "Vui lòng nhập email" })}
        />
        {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
      </label>

      {/* Phone */}
      <label className="text-xs font-semibold">
        Số điện thoại
        <input className="border rounded w-full py-1 px-2 text-sm" {...register("phone")} />
      </label>

      {/* Address */}
      <label className="text-xs font-semibold">
        Địa chỉ
        <input className="border rounded w-full py-1 px-2 text-sm" {...register("address")} />
      </label>

      {/* Gender */}
      <label className="text-xs font-semibold">
        Giới tính
        <select {...register("gender")} className="border rounded w-full py-1 px-2 text-sm">
          <option value="">-- Chọn --</option>
          <option value="Male">Nam</option>
          <option value="Female">Nữ</option>
          <option value="Other">Khác</option>
        </select>
      </label>

      {/* BirthDate */}
      <label className="text-xs font-semibold">
        Ngày sinh
        <input type="date" className="border rounded w-full py-1 px-2 text-sm"
          {...register("birthDate")}
        />
      </label>

      {/* Password */}
      <label className="text-xs font-semibold">
        Mật khẩu
        <input
          type="password"
          className="border rounded w-full py-1 px-2 text-sm"
          {...register("password", { required: "Nhập mật khẩu" })}
        />
      </label>

      {/* Confirm */}
      <label className="text-xs font-semibold">
        Nhập lại mật khẩu
        <input
          type="password"
          className="border rounded w-full py-1 px-2 text-sm"
          {...register("confirmPassword", {
            validate: (val) =>
              val === watch("password") || "Mật khẩu không khớp"
          })}
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>
        )}
      </label>

      <button
        type="submit"
        disabled={mutation.isLoading}
        className="bg-black text-white p-2 font-semibold rounded mt-2 disabled:bg-gray-400"
      >
        {mutation.isLoading ? "Đang xử lý..." : "Tạo tài khoản"}
      </button>
    </form>
  );
};

export default Register;
