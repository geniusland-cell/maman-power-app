import React, { useState, useEffect } from "react";
import { Download, X, Share2 } from "lucide-react";
import "./PWAInstallPrompt.css";

interface PWAInstallPromptProps {
  onClose: () => void;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Détecter l'OS
    const userAgent = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroidDevice = /Android/.test(userAgent);
    const isStandaloneMode = (window.navigator as any).standalone || 
                           window.matchMedia('(display-mode: standalone)').matches;

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsStandalone(isStandaloneMode);

    // Ne pas afficher si déjà installé
    if (isStandaloneMode) {
      return;
    }

    // Android: écouter l'événement beforeinstallprompt
    if (isAndroidDevice) {
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        // Afficher après un délai pour ne pas être intrusif
        setTimeout(() => setShowPrompt(true), 3000);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    } else if (isIOSDevice) {
      // iOS: afficher après un délai
      setTimeout(() => setShowPrompt(true), 5000);
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  if (!showPrompt || isStandalone) {
    return null;
  }

  return (
    <div className="pwa-install-prompt">
      <div className="pwa-install-content">
        <button className="pwa-install-close" onClick={onClose}>
          <X size={20} />
        </button>
        
        {isAndroid ? (
          <>
            <div className="pwa-install-icon">
              <Download size={32} />
            </div>
            <h3>Installer l'application</h3>
            <p>Ajoutez Maman Power à votre écran d'accueil pour un accès rapide</p>
            <button className="pwa-install-button" onClick={handleInstallClick}>
              Installer
            </button>
          </>
        ) : isIOS ? (
          <>
            <div className="pwa-install-icon">
              <Share2 size={32} />
            </div>
            <h3>Installer l'application</h3>
            <p>Pour installer sur iPhone:</p>
            <ol className="pwa-install-steps">
              <li>Touchez l'icône <strong>Partager</strong> <Share2 size={16} /></li>
              <li>Faites défiler vers le bas</li>
              <li>Touchez <strong>"Ajouter à l'écran d'accueil"</strong></li>
            </ol>
            <button className="pwa-install-button" onClick={onClose}>
              Compris
            </button>
          </>
        ) : (
          <>
            <div className="pwa-install-icon">
              <Download size={32} />
            </div>
            <h3>Installer l'application</h3>
            <p>Ajoutez cette application à votre appareil pour un meilleur accès</p>
            <button className="pwa-install-button" onClick={onClose}>
              Plus tard
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
