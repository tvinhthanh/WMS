// components/SignOutButton.tsx
import { useQueryClient } from "react-query";
import { useAppContext } from "../contexts/AppContext";
import { useNavigate } from "react-router-dom";

const SignOutButton = () => {
  const queryClient = useQueryClient();
  const { showToast, clearUserData } = useAppContext();
  const navigate = useNavigate();

  const handleClick = async () => {
    // Xóa token local
    localStorage.removeItem("token");
    localStorage.removeItem("loginTimestamp");

    // Xóa dữ liệu user trong context
    clearUserData();

    // Reset validateToken
    await queryClient.invalidateQueries("validateToken");

    showToast({ message: "Đăng xuất thành công!", type: "SUCCESS" });
    navigate("/login");
  };

  return (
    <button
      onClick={handleClick}
      className="hover:text-red-400 transition duration-200"
    >
      Đăng xuất
    </button>
  );
};

export default SignOutButton;
