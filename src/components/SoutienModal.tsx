import { ReactNode } from "react";
import "./SoutienModal.css";

interface SoutienModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SoutienModal = ({ isOpen, onClose }: SoutienModalProps): ReactNode => {
  if (!isOpen) return null;

  const phoneNumber = "06 767 81 28";
  const whatsappNumber = "242067678128";

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(phoneNumber).then(() => {
      alert("Numéro copié: " + phoneNumber);
    });
  };

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("Bonjour, je souhaite soutenir l'équipe Maman Power !");
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
  };

  return (
    <div className="soutien-modal-overlay" onClick={onClose}>
      <div className="soutien-modal" onClick={(e) => e.stopPropagation()}>
        <button className="soutien-modal-close" onClick={onClose}>
          ✕
        </button>

        <div className="soutien-modal-content">
          <div className="soutien-icon">✅</div>
          <h2>Vote enregistré avec succès !</h2>

          <div className="soutien-section">
            <h3>💙 COLLECTE DE SOUTIEN TRIMESTRIELLE</h3>
            <p>
              Maman Power est une application gratuite conçue par de jeunes
              développeurs locaux.
            </p>
            <p>
              Pour nous aider à maintenir les serveurs et améliorer
              l'application, vous pouvez faire une contribution volontaire (de
              1 000 FCFA à 15 000 FCFA).
            </p>
          </div>

          <div className="soutien-actions">
            <button className="soutien-btn momo-btn" onClick={handleCopyNumber}>
              <span className="btn-icon">💳</span>
              <div className="btn-content">
                <span className="btn-title">Faire un dépôt MoMo</span>
                <span className="btn-number">{phoneNumber}</span>
              </div>
            </button>

            <button className="soutien-btn whatsapp-btn" onClick={handleWhatsAppClick}>
              <span className="btn-icon">💬</span>
              <div className="btn-content">
                <span className="btn-title">WhatsApp</span>
                <span className="btn-number">{phoneNumber}</span>
              </div>
            </button>
          </div>

          <button className="soutien-btn later-btn" onClick={onClose}>
            Plus tard
          </button>

          <p className="soutien-thanks">
            Merci infiniment pour votre soutien !
          </p>
        </div>
      </div>
    </div>
  );
};

export default SoutienModal;
