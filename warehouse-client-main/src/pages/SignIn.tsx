/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/SignIn.tsx
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import { useAppContext } from "../contexts/AppContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service";
import { LoginPayload } from "../types";

export type SignInFormData = {
  email: string; // dùng chung cho: Email / Username / EmployeeCode
  password: string;
};

const SignIn = () => {
  const { showToast, setUserData } = useAppContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignInFormData>();

  const mutation = useMutation(authService.login, {
    onSuccess: async (res) => {
      localStorage.setItem("token", res.token);

      setUserData(res.user);

      showToast({ message: "Đăng nhập thành công!", type: "SUCCESS" });

      await queryClient.invalidateQueries("validateToken");
      navigate(location.state?.from?.pathname || "/");
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Đăng nhập thất bại";
      showToast({ message, type: "ERROR" });
    },
  });

  const onSubmit = handleSubmit((data) => {
    const payload: LoginPayload = {
      email: data.email,
      password: data.password
    };
    mutation.mutate(payload);
  });

  return (
    <>
      <form
        className="flex flex-col gap-3 p-4 max-w-sm mx-auto"
        onSubmit={onSubmit}
      >
        <h2 className="text-xl font-bold text-center mb-4">Đăng nhập</h2>

        {/* Email / Username / EmployeeCode */}
        <label className="text-gray-700 text-xs font-semibold">
          Email / Username / Mã NV
          <input
            type="text"
            className="border rounded w-full py-1 px-2 mt-1 text-sm"
            placeholder="Nhập email hoặc username hoặc mã NV"
            {...register("email", { required: "Trường này là bắt buộc" })}
          />
          {errors.email && (
            <span className="text-red-500 text-xs">{errors.email.message}</span>
          )}
        </label>

        <label className="text-gray-700 text-xs font-semibold mt-3">
          Mật khẩu
          <input
            type="password"
            placeholder="Nhập password"
            className="border rounded w-full py-1 px-2 mt-1 text-sm"
            {...register("password", {
              required: "Trường này là bắt buộc",
              minLength: { value: 6, message: "Mật khẩu ≥ 6 ký tự" },
            })}
          />
          {errors.password && (
            <span className="text-red-500 text-xs">{errors.password.message}</span>
          )}
        </label>

        <button
          type="submit"
          disabled={mutation.isLoading}
          className="bg-black text-white p-2 font-semibold hover:bg-gray-800 text-sm rounded mt-3 disabled:bg-gray-400"
        >
          {mutation.isLoading ? "Đang xử lý..." : "Đăng nhập"}
        </button>
        
        <div className="space-y-2 text-center text-sm mt-3">
          <p>
            Chưa có tài khoản?{" "}
            <Link className="underline text-blue-600 hover:text-blue-800" to="/register">
              Đăng ký tại đây
            </Link>
          </p>
          {/* Quên mật khẩu - Dẫn đến trang reset password */}
          <p>
            <Link 
              className="underline text-blue-600 hover:text-blue-800" 
              to="/forgot-password"
            >
              Quên mật khẩu?
            </Link>
          </p>
        </div>
      </form>
    </>
  );
};

export default SignIn;
