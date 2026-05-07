import React from "react";
import "./DepotsList.css";

export default function DepotsList({ depots }) {
  const handleCall = (phoneNumber) => {
    navigator.clipboard
      .writeText(phoneNumber)
      .then(() => {
        alert(` Numéro copié: ${phoneNumber}\n\nAppel lancé...`);
      })
      .catch((err) => {
        console.error("Erreur copie:", err);
      });

    window.location.href = `tel:${phoneNumber}`;
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
        {depots.map((depot, index) => {
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
                      `📍 ${depot.name}\n\n📱 Direct: ${depot.phone_direct}\n💬 WhatsApp: ${depot.phone_whatsapp}\n\n🏘️ ${depot.address}`,
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
    </div>
  );
}
