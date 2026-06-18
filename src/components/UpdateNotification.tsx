import { useState, useEffect, ReactNode } from "react";

export default function UpdateNotification(): ReactNode {
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);

  useEffect(() => {
   
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        
        setUpdateAvailable(false);
      });
    }

    const checkForUpdates = async () => {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        
        navigator.serviceWorker.controller.postMessage({
          type: "SKIP_WAITING",
        });

        try {
          const response = await fetch("/manifest.webmanifest");
          const manifest = await response.json();

          const currentVersion = sessionStorage.getItem("app_version");
          const newVersion =
            manifest.version || new Date().getTime().toString();

          if (currentVersion && currentVersion !== newVersion) {
            setUpdateAvailable(true);
          }
          sessionStorage.setItem("app_version", newVersion);
        } catch (error) {
          console.error("Error checking for updates:", error);
        }
      }
    };

    checkForUpdates();

    const interval = setInterval(checkForUpdates, 60 * 60 * 1000);

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
