import React, { useState, ReactNode } from "react";
import { Clock, ShoppingBag } from "lucide-react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import type { User } from "firebase/auth";
import "./UnifiedLogin.css";

// Stubs pour les fonctions manquantes
const loginByPhone = async (phone: string, password: string) => {
  try {
    // Générer l'email comme dans firebase.ts: vendor + numéro nettoyé + @maman-power.app
    let cleanPhone = phone.replace(/[^\d]/g, "");
    if (!cleanPhone.startsWith("242")) {
      cleanPhone = "242" + cleanPhone;
    }
    const email = `vendor${cleanPhone}@maman-power.app`;
    
    console.log(`Trying login with email: ${email}`);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log(`Login successful with email: ${email}`);
    return { success: true, data: userCredential.user };
  } catch (error: any) {
    console.error("Login error:", error);
    let errorMessage = "Erreur de connexion";
    if (error.code === 'auth/invalid-credential') {
      errorMessage = "Numéro ou mot de passe incorrect";
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = "Compte non trouvé";
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = "Mot de passe incorrect";
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = "Numéro de téléphone invalide";
    }
    return { success: false, error: errorMessage };
  }
};

const registerUser = async (phone: string, password: string) => {
  try {
    // Générer l'email comme dans firebase.ts: vendor + numéro nettoyé + @maman-power.app
    let cleanPhone = phone.replace(/[^\d]/g, "");
    if (!cleanPhone.startsWith("242")) {
      cleanPhone = "242" + cleanPhone;
    }
    const email = `vendor${cleanPhone}@maman-power.app`;
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, data: userCredential.user };
  } catch (error: any) {
    console.error("Register error:", error);
    let errorMessage = "Erreur d'inscription";
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = "Ce numéro est déjà utilisé";
    } else if (error.code === 'auth/weak-password') {
      errorMessage = "Le mot de passe doit contenir au moins 6 caractères";
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = "Numéro de téléphone invalide";
    }
    return { success: false, error: errorMessage };
  }
};

interface UnifiedLoginProps {
  onLoginSuccess?: (user: User) => void;
}

export default function UnifiedLogin({
  onLoginSuccess,
}: UnifiedLoginProps): ReactNode {
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  const handleLogin = async (
    e: React.SubmitEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const loginResult = await loginByPhone(phone, password);

      if (loginResult.success) {
        onLoginSuccess?.(loginResult.data!);
        return;
      }

      setError(loginResult.error || "Connexion échouée");
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Une erreur est survenue";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (
    e: React.SubmitEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!name.trim()) {
        setError("Le nom est requis");
        setIsLoading(false);
        return;
      }

      if (!email.trim()) {
        setError("L'email est requis");
        setIsLoading(false);
        return;
      }

      if (!phone.trim()) {
        setError("Le téléphone est requis");
        setIsLoading(false);
        return;
      }

      const registerResult = await registerUser(phone, password);

      if (registerResult.success) {
        const loginResult = await loginByPhone(phone, password);
        if (loginResult.success && loginResult.data) {
          onLoginSuccess?.(loginResult.data);
        }
        return;
      }

      setError(registerResult.error || "Erreur d'inscription");
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Une erreur est survenue";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isRegistering) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1><ShoppingBag size={32} /> Maman Power</h1>
          <p className="subtitle">Créer votre compte</p>

          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label> Nom complet</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jean Dupont"
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label> Adresse Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@example.com"
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label> Numéro WhatsApp</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+242 061234567"
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label> Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Au moins 6 caractères"
                required
                disabled={isLoading}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? <><Clock size={16} /> Chargement...</> : " S'inscrire"}
            </button>

            <button
              type="button"
              className="back-btn"
              onClick={() => {
                setIsRegistering(false);
                setName("");
                setEmail("");
                setPhone("");
                setPassword("");
                setError("");
              }}
              disabled={isLoading}
            >
              ← Retour à la connexion
            </button>
          </form>

          <div className="login-footer">
            <p> Vous avez déjà un compte ? Connectez-vous ci-dessus</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1><ShoppingBag size={32} /> Maman Power</h1>
        <p className="subtitle">Connexion Vendeuses</p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label> Numéro WhatsApp</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+242 061234567"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label> Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              required
              disabled={isLoading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? <><Clock size={16} /> Chargement...</> : " Se connecter"}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Nouveau compte?{" "}
            <button
              type="button"
              className="signup-link"
              onClick={() => {
                setIsRegistering(true);
                setPhone("");
                setPassword("");
                setError("");
              }}
              disabled={isLoading}
            >
              S'inscrire ici
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
