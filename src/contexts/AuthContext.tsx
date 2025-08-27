import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authService, User, LoginData, RegisterData } from "../services/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<User>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Debug user state changes
  const setUserWithLogging = (newUser: User | null) => {
    const log = `[${new Date().toISOString()}] AuthContext: User state changing from ${JSON.stringify(
      user
    )} to ${JSON.stringify(newUser)}`;
    localStorage.setItem(
      "debug_logs",
      (localStorage.getItem("debug_logs") || "") + "\n" + log
    );
    setUser(newUser);
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          // Get user from localStorage first
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            console.log(
              "AuthContext: Setting user from localStorage:",
              currentUser
            );
            setUserWithLogging(currentUser);
          }

          // Then try to refresh from server (but don't fail if it doesn't work)
          try {
            await refreshUser();
          } catch (refreshError) {
            console.warn(
              "Failed to refresh user from server, keeping localStorage data:",
              refreshError
            );
            // Don't clear user state if refresh fails
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Only clear auth data if there's a critical error
        // Don't clear if it's just a refresh failure
        if (error.message && error.message.includes("refresh")) {
          console.warn("Refresh error, keeping user logged in");
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUserWithLogging(null);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (data: LoginData): Promise<User> => {
    try {
      console.log("AuthContext: Starting login process");
      setLoading(true);
      const response = await authService.login(data);
      console.log("AuthContext: Login response:", response);

      if (response.success && response.data) {
        console.log("AuthContext: Setting user:", response.data.user);
        setUserWithLogging(response.data.user);
        return response.data.user;
      } else {
        console.error("AuthContext: Login failed:", response.message);
        const failLog = `[${new Date().toISOString()}] AuthContext login failed: ${
          response.message
        }`;
        localStorage.setItem(
          "debug_logs",
          (localStorage.getItem("debug_logs") || "") + "\n" + failLog
        );
        throw new Error(response.message || "Login failed");
      }
    } catch (error) {
      console.error("AuthContext: Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setLoading(true);
      const response = await authService.register(data);

      if (response.success && response.data) {
        setUserWithLogging(response.data.user);
      } else {
        throw new Error(response.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUserWithLogging(null);
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear user state even if API call fails
      setUserWithLogging(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await authService.updateProfile(data);

      if (response.success && response.data) {
        setUserWithLogging(response.data.user);
      } else {
        throw new Error(response.message || "Profile update failed");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authService.getProfile();

      if (response.success && response.data) {
        // The backend returns {data: {user: userObject}}, so we need to access response.data.user
        const userData = response.data.user;
        console.log("AuthContext: Refresh user response data:", response.data);
        console.log("AuthContext: Setting user from refresh:", userData);
        setUserWithLogging(userData);
      } else {
        throw new Error(response.message || "Failed to refresh user data");
      }
    } catch (error) {
      console.error("Refresh user error:", error);
      // Don't logout on refresh failure - keep the user logged in with localStorage data
      // Only log the error but don't clear the user state
      console.warn(
        "Failed to refresh user from server, keeping localStorage data"
      );
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
