import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { loginByPhone, logoutUser, getCurrentUser } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import type { User, FirebaseResponse } from "./types";

/**
 * Hook d'authentification avec Firebase Auth
 * Gere la connexion, deconnexion et la session utilisateur tokens
 */
export const useAuth = (): {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (phone: string, password: string) => Promise<FirebaseResponse<User>>;
  register: (
    name: string,
    phone: string,
    password: string,
  ) => Promise<FirebaseResponse<User>>;
  logout: () => Promise<FirebaseResponse<null>>;
  isVendor: () => boolean;
  isAdmin: () => boolean;
} => {
  const [user, setUser] = useState<User | null>(() => {
    //  OPTIMIZATION: Charger depuis localStorage sans attendre le server (pas d'attente!)
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Restaurer la session au demarrage
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        // Récupérer le profil depuis Firebase
        const result = await getCurrentUser(authUser.uid);
        if (result.success && result.data) {
          setUser(result.data);
          //  SAUVEGARDER dans localStorage pour prochain chargement instantané
          localStorage.setItem("user", JSON.stringify(result.data));
          console.log(" Session restaurée pour:", result.data.name);
        } else {
          setUser(null);
          localStorage.removeItem("user");
        }
      } else {
        setUser(null);
        localStorage.removeItem("user");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Connexion avec Firebase
   * @param {string} phone
   * @param {string} password
   * @returns {Promise<{success: boolean, user?: object, error?: string}>}
   */
  const login = async (
    phone: string,
    password: string,
  ): Promise<FirebaseResponse<User>> => {
    setLoading(true);
    setError(null);

    try {
      const result = await loginByPhone(phone, password);

      if (result.success && result.data) {
        setUser(result.data);
        localStorage.setItem("user", JSON.stringify(result.data));
        console.log(" Connexion réussie:", result.data.name);
        return { success: true, data: result.data };
      } else {
        const errorMsg = result.error || "Erreur de connexion";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: unknown) {
      const errorMsg =
        "Erreur de connexion: " +
        (err instanceof Error ? err.message : "Erreur inconnue");
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Inscription avec Firebase
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{success: boolean, user?: object, error?: string}>}
   */
  const register = async (
    name: string,
    phone: string,
    password: string,
  ): Promise<FirebaseResponse<User>> => {
    setLoading(true);
    setError(null);

    try {
      const { registerUser } = await import("./firebase");
      const result = await registerUser(name, phone, password);

      if (result.success && result.data) {
        setUser(result.data);
        localStorage.setItem("user", JSON.stringify(result.data));
        console.log(" Inscription réussie:", result.data.name);
        return { success: true, data: result.data };
      } else {
        const errorMsg = result.error || "Erreur d'inscription";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: unknown) {
      const errorMsg =
        "Erreur d'inscription: " +
        (err instanceof Error ? err.message : "Erreur inconnue");
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Déconnexion
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const logout = async (): Promise<FirebaseResponse<null>> => {
    setLoading(true);

    try {
      const result = await logoutUser();

      if (result.success) {
        setUser(null);
        localStorage.removeItem("user"); //  Nettoyer le cache
        console.log(" Déconnexion réussie");
        return { success: true };
      } else {
        const errorMsg = result.error || "Erreur de déconnexion";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: unknown) {
      const errorMsg =
        "Erreur de déconnexion: " +
        (err instanceof Error ? err.message : "Erreur inconnue");
      setError(errorMsg);
      // Forcer la déconnexion côté client même si erreur
      setUser(null);
      localStorage.removeItem("user"); //  Nettoyer même en cas d'erreur
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Vérifier si l'utilisateur est un vendeur
   * @returns {boolean}
   */
  const isVendor = () => (user ? user.role === "vendor" : false);

  /**
   * Vérifier si l'utilisateur est admin
   * @returns {boolean}
   */
  const isAdmin = () => (user ? user.role === "admin" : false);

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isVendor,
    isAdmin,
  };
};
