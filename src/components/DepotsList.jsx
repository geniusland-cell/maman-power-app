import React, { useState } from "react";
import "./DepotsList.css";

export default function DepotsList({ depots }) {
  const [selectedImage, setSelectedImage] = useState(null);

  const handleCall = (phoneNumber) => {
    navigator.clipboard
      .writeText(phoneNumber)
      .then(() => {
        alert(` Numéro copié: ${phoneNumber}\n\nAppel lancé...`);
        // Lancer l'appel après confirmation
        setTimeout(() => {
          window.location.href = `tel:${phoneNumber}`;
        }, 100);
      })
      .catch((err) => {
        console.error("Erreur copie:", err);
      });
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const getPlaceholderImage = (category) => {
    const emojiMap = {
      Poisson: "🐟",
      Charbon: "⚫",
      Boissons: "🍺",
      Vivriers: "🌾",
      Fruits: "🍌",
    };
    return emojiMap[category] || "📦";
  };

  if (!depots || depots.length === 0) {
    return (
      <div className="depots-container">
        <p className="no-depots">Aucun dépôt disponible</p>
      </div>
    );
  }

  const nearestDepot = depots[0];

  return (
    <div className="depots-list-section">
      <h2 className="section-title"> Dépôts Disponibles</h2>

      <div className="depots-container">
        {depots.map((depot) => {
          const isNearest = depot.id === nearestDepot.id;
          const hasProducts = depot.products && depot.products.length > 0;

          return (
            <div
              key={depot.id}
              className={`depot-item ${isNearest ? "nearest" : "fade"}`}
            >
              {isNearest && (
                <div className="nearest-badge">
                  ⭐ LE PLUS PROCHE ({depot.distance} km)
                </div>
              )}

              <div className="depot-header">
                <h3 className="depot-name">{depot.name}</h3>
                <span className="depot-distance">📏 {depot.distance} km</span>
              </div>

              {/* Afficher les produits si disponibles */}
              {hasProducts && (
                <div className="products-section">
                  {depot.products.map((product) => (
                    <div key={product.id} className="product-line">
                      {/* Product Image */}
                      <div className="product-image-container">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="product-thumb"
                            onClick={() => openImageModal(product.image)}
                            title="Cliquer pour agrandir"
                          />
                        ) : (
                          <div
                            className="product-thumb-placeholder"
                            onClick={() =>
                              openImageModal(
                                `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext x='50' y='55' font-size='60' text-anchor='middle'%3E${getPlaceholderImage(product.category)}%3C/text%3E%3C/svg%3E`,
                              )
                            }
                            title="Aucune image disponible"
                          >
                            {getPlaceholderImage(product.category)}
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="product-info-container">
                        <span className="product-name">{product.name}</span>
                        <span className="product-category">
                          {product.category}
                        </span>
                        <span className="product-price">
                          Prix: {product.price} FCFA/{product.unit}
                        </span>
                        <span className="product-stock">
                          Stock: {product.stock_quantity} {product.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="depot-actions">
                <button
                  className="action-btn call-btn"
                  onClick={() => handleCall(depot.phone_direct)}
                  title="Appel direct"
                >
                  <span className="action-icon">☎️</span>
                  <span className="action-text">Appeler</span>
                </button>

                <a
                  href={`https://wa.me/${depot.phone_whatsapp.replace(
                    /[^\d+]/g,
                    "",
                  )}`}
                  className="action-btn whatsapp-btn"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="WhatsApp"
                >
                  <span className="action-icon">💬</span>
                  <span className="action-text">WhatsApp</span>
                </a>

                <button
                  className="action-btn info-btn"
                  title="Voir plus"
                  onClick={() => {
                    alert(
                      `📍 ${depot.name}\n\n📱 Direct: ${depot.phone_direct}\n💬 WhatsApp: ${depot.phone_whatsapp}\n\n📍 ${depot.address || depot.quartier}`,
                    );
                  }}
                >
                  <span className="action-icon">ℹ️</span>
                  <span className="action-text">Infos</span>
                </button>
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
              ✕
            </button>
            <img
              src={selectedImage}
              alt="Product"
              className="image-modal-image"
            />
          </div>
        </div>
      )}
    </div>
  );
}
