import React, { useContext, useState } from "react";
import Toast from "../components/Toast";
import { useQuery, useQueryClient } from "react-query";
import { authService } from "../services/auth.service";
import { UserDTO } from "../types";

type ToastMessage = {
  message: string;
  type: "SUCCESS" | "ERROR";
};

type AppContextType = {
  showToast: (toast: ToastMessage) => void;

  isLoggedIn: boolean;
  isAuthLoading: boolean;

  userId: number | null;
  fullName: string | null;
  role: string | null;
  email: string | null;
  employeeCode: string | null;

  setUserData: (user: UserDTO) => void;
  clearUserData: () => void;
};

const AppContext = React.createContext<AppContextType | undefined>(undefined);

export const AppContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [toast, setToast] = useState<ToastMessage | undefined>();
  // const [user, setUser] = useState<UserDTO | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [employeeCode, setEmployeeCode] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // =====================================================
  // /Auth/me - validate token
  // =====================================================
  const {
    isError,
    isLoading: isAuthLoading
  } = useQuery("validateToken", authService.me, {
    enabled: !!localStorage.getItem("token"),
    retry: false,
    onSuccess: (res) => {
      if (res?.user) {
        setUserData(res.user);
      } else {
        clearUserData();
      }
    },
    onError: () => {
      clearUserData();
    }
  });

  // =====================================================
  // Save user into global context
  // =====================================================
  const setUserData = (user: UserDTO) => {
    setUserId(user.userId ?? null);
    setFullName(user.fullName ?? null);
    setRole(user.role ?? null);
    setEmail(user.email ?? null);
    setEmployeeCode(user.employeeCode ?? null);
  };

  // =====================================================
  // Logout
  // =====================================================
  const clearUserData = () => {
    localStorage.removeItem("token");

    setUserId(null);
    setFullName(null);
    setRole(null);
    setEmail(null);
    setEmployeeCode(null);

    // Không xóa toàn bộ cache để tránh crash UI
    queryClient.removeQueries();
  };

  // =====================================================
  // Determine login state
  // =====================================================
  const isLoggedIn =
    !isAuthLoading &&
    !isError &&
    !!localStorage.getItem("token") &&
    !!userId;

  return (
    <AppContext.Provider
      value={{
        showToast: (msg) => setToast(msg),
        isLoggedIn,
        isAuthLoading,

        userId,
        fullName,
        role,
        email,
        employeeCode,

        setUserData,
        clearUserData
      }}
    >
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(undefined)}
        />
      )}
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppContextProvider");
  return ctx;
};
