import { ReactNode } from "react";
import { QRCodeSVG } from "qrcode.react";
import "./QRCodeModal.css";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QRCodeModal = ({ isOpen, onClose }: QRCodeModalProps): ReactNode => {
  if (!isOpen) return null;

  const appUrl = "https://maman-power-app.vercel.app";

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Maman Power App",
          text: "Découvrez Maman Power - Trouvez les meilleurs dépôts près de chez vous!",
          url: appUrl,
        });
      } catch (err) {
        console.log("Share canceled or failed", err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(appUrl);
      alert("URL copiée: " + appUrl);
    }
  };

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
        <button className="qr-modal-close" onClick={onClose}>
          ✕
        </button>

        <div className="qr-modal-content">
          <div className="qr-icon">📱</div>
          <h2>Partager l'application</h2>
          <p className="qr-subtitle">
            Scannez ce code QR pour télécharger l'application
          </p>

          <div className="qr-code-container">
            <QRCodeSVG
              value={appUrl}
              size={200}
              level="H"
              includeMargin={true}
              className="qr-code"
            />
          </div>

          <p className="qr-url">{appUrl}</p>

          <button className="qr-share-btn" onClick={handleShare}>
            📤 Partager
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
