import React, { useState, ReactNode } from "react";
import { loginByPhone, registerUser } from "../firebase";
import type { User } from "../types";
import "../auth.css";

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
      console.log(" Tentative connexion par téléphone...");
      const loginResult = await loginByPhone(phone, password);

      if (loginResult.success) {
        console.log(" Connexion réussie!");
        onLoginSuccess?.(loginResult.data!);
        return;
      }

      setError(loginResult.error || "Connexion échouée");
    } catch (err: unknown) {
      console.error(" Erreur:", err);
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

      console.log(" Inscription en cours...");
      const registerResult = await registerUser(name, phone, password);

      if (registerResult.success) {
        console.log(" Inscription réussie! Connexion automatique...");

        const loginResult = await loginByPhone(phone, password);
        if (loginResult.success && loginResult.data) {
          onLoginSuccess?.(loginResult.data);
        }
        return;
      }

      setError(registerResult.error || "Erreur d'inscription");
    } catch (err: unknown) {
      console.error(" Erreur inscription:", err);
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
          <h1>🛍️ Maman Power</h1>
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
              {isLoading ? "⏳ Chargement..." : " S'inscrire"}
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
            <p> Vous avez déjà un compte? Connectez-vous ci-dessus</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🛍️ Maman Power</h1>
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
            {isLoading ? "⏳ Chargement..." : " Se connecter"}
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
