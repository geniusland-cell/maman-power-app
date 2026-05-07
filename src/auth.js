import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { loginByPhone, logoutUser, getCurrentUser } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

/**
 * Hook d'authentification avec Firebase Auth
 * Gere la connexion, deconnexion et la session utilisateur
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restaurer la session au demarrage
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        // RRecuperer le profil depuis Firestore
        const result = await getCurrentUser(authUser.uid);
        if (result.success) {
          setUser(result.data);
          console.log(" Session restaurée pour:", result.data.name);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
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
  const login = async (phone, password) => {
    setLoading(true);
    setError(null);

    try {
      const result = await loginByPhone(phone, password);

      if (result.success && result.data) {
        setUser(result.data);
        console.log(" Connexion réussie:", result.data.name);
        return { success: true, user: result.data };
      } else {
        const errorMsg = result.error || "Erreur de connexion";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = "Erreur de connexion: " + err.message;
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
  const register = async (name, email, phone, password) => {
    setLoading(true);
    setError(null);

    try {
      const { registerUser } = await import("./firebase");
      const result = await registerUser(name, email, phone, password);

      if (result.success && result.data) {
        setUser(result.data);
        console.log(" Inscription réussie:", result.data.name);
        return { success: true, user: result.data };
      } else {
        const errorMsg = result.error || "Erreur d'inscription";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = "Erreur d'inscription: " + err.message;
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
  const logout = async () => {
    setLoading(true);

    try {
      const result = await logoutUser();

      if (result.success) {
        setUser(null);
        console.log(" Déconnexion réussie");
        return { success: true };
      } else {
        const errorMsg = result.error || "Erreur de déconnexion";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = "Erreur de déconnexion: " + err.message;
      setError(errorMsg);
      // Forcer la déconnexion côté client même si erreur
      setUser(null);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Vérifier si l'utilisateur est un vendeur
   * @returns {boolean}
   */
  const isVendeur = () => user && user.role === "vendeur";

  /**
   * Vérifier si l'utilisateur est admin
   * @returns {boolean}
   */
  const isAdmin = () => user && user.role === "admin";

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isVendeur,
    isAdmin,
  };
};
