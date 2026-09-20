import { useState, ReactNode } from "react";
import { Heart, Package, Fish, Beef, Logs, Wine, ShoppingBag, Apple, Medal, Award, Trophy, Clock, Check, X } from "lucide-react";
import type { DepotWithProducts } from "../types";
import { optimizeModalImage, optimizeThumbnail } from "../utils/cloudinary";
import PrivateGroupCircle from "./PrivateGroupCircle";
import { hasWhatsAppGroupAccess } from "../services/whatsappGroupService";
import "./DepotsList.css";

// Vérifier si un dépôt est certifié (a un abonnement actif)
const isCertified = (depot: DepotWithProducts): boolean => {
  if (!depot.tier) return false;
  const now = new Date();
  const expiry = depot.tier_expiry ? new Date(depot.tier_expiry) : null;
  return expiry ? expiry > now : false;
};

interface DepotsListProps {
  depots: DepotWithProducts[];
  favorites: string[];
  onToggleFavorite: (depotId: string) => void;
  onVote?: (depotId: string) => Promise<void>; // Callback pour voter
  votingEnabled?: boolean;
  hasVoted?: boolean; // Si l'utilisateur a déjà voté ce trimestre
}

export default function DepotsList({
  depots,
  favorites,
  onToggleFavorite,
  onVote,
  votingEnabled = false,
  hasVoted = false,
}: DepotsListProps): ReactNode {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [votingDepotId, setVotingDepotId] = useState<string | null>(null);

  const handleCall = (phoneNumber: string): void => {
    navigator.clipboard
      .writeText(phoneNumber)
      .then(() => {
        alert(` Numéro copié: ${phoneNumber}\n\nAppel lancé...`);

        setTimeout(() => {
          window.location.href = `tel:${phoneNumber}`;
        }, 100);
      })
      .catch(() => {});
  };

  const openImageModal = (imageUrl: string): void => {
    setSelectedImage(imageUrl);
  };

  const closeImageModal = (): void => {
    setSelectedImage(null);
  };

  const handleVote = async (depotId: string): Promise<void> => {
    if (!votingEnabled || !onVote) {
      alert("Désolé, le vote n'est pas disponible actuellement");
      return;
    }

    try {
      setVotingDepotId(depotId);
      await onVote(depotId);
      setVotingDepotId(null);
      alert(" Merci pour votre vote!");
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Erreur lors du vote";
      setVotingDepotId(null);
      alert(` Erreur: ${errorMsg}`);
    }
  };

  const normalizeCategoryName = (categoryName: string): string => {
    if (categoryName === "Fruits") {
      return "Fruit et Legume";
    }
    if (categoryName === "Vivriers") {
      return "Epiceries/Vivre secs";
    }
    return categoryName;
  };

  const getCategoryIcon = (category: string): ReactNode => {
    const normalized = normalizeCategoryName(category);
    if (normalized === "Poisson") return <Fish size={40} />;
    if (normalized === "Viande") return <Beef size={40} />;
    if (normalized === "Charbon") return <Logs size={40} />;
    if (normalized === "Boissons") return <Wine size={40} />;
    if (normalized === "Epiceries/Vivre secs") return <ShoppingBag size={40} />;
    if (normalized === "Fruit et Legume") return <Apple size={40} />;
    return <Package size={40} />;
  };

  if (!depots || depots.length === 0) {
    return (
      <div className="depots-container">
        <p className="no-depots">Aucun dépôt disponible</p>
      </div>
    );
  }

  return (
    <div className="depots-list-section">
      <h2 className="section-title"> Dépôts Disponibles</h2>

      <div className="depots-container">
        {depots.map((depot) => {
          const hasProducts = depot.products && depot.products.length > 0;

          return (
            <div key={depot.id} className="depot-item">
              <div className="depot-header">
                <button
                  className={`favorite-btn ${favorites.includes(depot.id) ? "active" : ""}`}
                  onClick={() => onToggleFavorite(depot.id)}
                  title={
                    favorites.includes(depot.id)
                      ? "Retirer des favoris"
                      : "Ajouter aux favoris"
                  }
                >
                  <Heart 
                    size={20} 
                    fill={favorites.includes(depot.id) ? "currentColor" : "none"} 
                    color={favorites.includes(depot.id) ? "#e74c3c" : "#ccc"}
                  />
                </button>
                <h3 className="depot-name">{depot.name}</h3>
                <span className="depot-distance"> {depot.distance} km</span>
                {depot.vote_rank === 1 && (
                  <Trophy size={20} className="voting-medal gold" />
                )}
                {depot.vote_rank === 2 && (
                  <Medal size={20} className="voting-medal silver" />
                )}
                {depot.vote_rank === 3 && (
                  <Award size={20} className="voting-medal bronze" />
                )}
                {isCertified(depot) && (
                  <span className="certified-badge">✓ Certifié</span>
                )}
              </div>

              {/* Afficher les produits si disponibles */}
              {hasProducts && (
                <div className="products-section">
                  {depot.products.map((product) => (
                    <div key={product.id} className="product-line">
                      <div className="product-image-container">
                        {product.image || product.image_url ? (
                          <img
                            src={optimizeThumbnail(
                              product.image || product.image_url!,
                            )}
                            alt={product.name}
                            className="product-thumb"
                            onClick={() =>
                              openImageModal(
                                product.image || product.image_url!,
                              )
                            }
                            title="Cliquer pour agrandir"
                          />
                        ) : (
                          <div
                            className="product-thumb-placeholder"
                            onClick={() =>
                              openImageModal(
                                `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext x='50' y='55' font-size='60' text-anchor='middle'%3E📦%3C/text%3E%3C/svg%3E`,
                              )
                            }
                            title="Aucune image disponible"
                          >
                            {getCategoryIcon(product.category)}
                          </div>
                        )}
                      </div>

                      <div className="product-info-container">
                        <span className="product-name">{product.name}</span>
                        <span className="product-price">
                          {product.price} FCFA/{product.unit}
                        </span>
                        <span className="product-stock">
                          stock : {product.stock_quantity} {product.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Promo Content for Premium Tiers */}
              {(depot.tier === "Advanced" || depot.tier === "Elite") && (
                <div className="promo-section">
                  {depot.promo_image_url && (
                    <div className="promo-image-container">
                      <img
                        src={depot.promo_image_url}
                        alt="Promo"
                        className="promo-image"
                        onClick={() =>
                          depot.promo_image_url &&
                          window.open(depot.promo_image_url, "_blank")
                        }
                      />
                    </div>
                  )}
                  {depot.tier === "Elite" && depot.promo_video_url && (
                    <div className="promo-video-container">
                      <iframe
                        src={depot.promo_video_url}
                        className="promo-video"
                        allowFullScreen
                      />
                    </div>
                  )}
                </div>
              )}

              {/* WhatsApp Private Group for Advanced/Elite */}
              {hasWhatsAppGroupAccess(depot.tier as any) && (
                <PrivateGroupCircle depotId={depot.id} />
              )}

              <div className="depot-actions">
                <button
                  className="action-btn call-btn"
                  onClick={() =>
                    handleCall(depot.phone_direct || depot.phone || "")
                  }
                  title="Appel direct"
                  disabled={!depot.phone_direct && !depot.phone}
                >
                  <span className="action-icon"></span>
                  <span className="action-text">Appeler</span>
                </button>

                {/* Hide WhatsApp button if depot has private group access */}
                {!hasWhatsAppGroupAccess(depot.tier as any) && (
                  <a
                    href={`https://wa.me/${(depot.phone_whatsapp || depot.phone || "").replace(/[^\d+]/g, "")}`}
                    className="action-btn whatsapp-btn"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="WhatsApp"
                  >
                    <span className="action-icon"></span>
                    <span className="action-text">WhatsApp</span>
                  </a>
                )}

                <button
                  className="action-btn info-btn"
                  title="Voir plus"
                  onClick={() => {
                    alert(
                      ` ${depot.name}\n\n Téléphone: ${depot.phone_direct || depot.phone || "N/A"}\n\n ${depot.location}`,
                    );
                  }}
                >
                  <span className="action-icon"></span>
                  <span className="action-text">Infos</span>
                </button>

                {votingEnabled && (
                  <button
                    className="action-btn vote-btn"
                    onClick={() => handleVote(depot.id)}
                    disabled={votingDepotId === depot.id || hasVoted}
                    title={hasVoted ? "Vous avez déjà voté ce trimestre" : "Voter pour ce dépôt"}
                  >
                    <span className="action-icon">
                      {hasVoted ? <Check size={16} /> : votingDepotId === depot.id ? <Clock size={16} /> : " "}
                    </span>
                    <span className="action-text">
                      {hasVoted
                        ? "Déjà voté"
                        : votingDepotId === depot.id
                        ? "Vote..."
                        : `Vote (${depot.current_votes || 0})`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="image-modal-overlay" onClick={closeImageModal}>
          <div
            className="image-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="image-modal-close" onClick={closeImageModal}>
              <X size={18} />
            </button>
            <img
              src={optimizeModalImage(selectedImage)}
              alt="Product"
              className="image-modal-image"
            />
          </div>
        </div>
      )}
    </div>
  );
}
