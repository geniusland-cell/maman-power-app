import { useState, useEffect, ReactNode } from "react";

export default function UpdateNotification(): ReactNode {
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const response = await fetch(`/manifest.json?t=${Date.now()}`);
        const manifest = await response.json();

        const currentVersion = localStorage.getItem("app_version");
        const newVersion = manifest.version || new Date().getTime().toString();

        if (currentVersion && currentVersion !== newVersion) {
          setUpdateAvailable(true);
        }
        localStorage.setItem("app_version", newVersion);
      } catch (error) {
        console.error("Erreur vérification mise à jour:", error);
      }
    };

    checkForUpdates();

    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleUpdate = () => {
    window.location.reload();
  };

  if (!updateAvailable) return null;

  return (
    <div className="update-notification">
      <div className="update-content">
        <span className="update-message"> Nouvelle version disponible !</span>
        <button className="update-button" onClick={handleUpdate}>
          Mettre à jour maintenant
        </button>
        <button
          className="update-close"
          onClick={() => setUpdateAvailable(false)}
          title="Fermer"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
