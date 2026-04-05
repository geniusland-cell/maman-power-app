import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    return savedDarkMode === "enabled";
  });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode ? "enabled" : "disabled");
  };

  const getUnitFromPrice = (price) => {
    const match = price.match(/\/(.+)$/);
    return match ? match[1] : "unités";
  };

  const showCategory = (category) => {
    setSelectedCategory(category);
  };

  const callDepot = (phone) => {
    window.open(`tel:${phone}`, "_self");
  };

  const showRoute = (route) => {
    alert(`Itinéraire: ${route}`);
  };

  const playAudioInfo = () => {
    alert("Informations audio en développement...");
  };

  const showFavorites = () => {
    alert("Favoris en développement...");
  };

  const depotsByCategory = {
    poisson: [
      {
        name: "🐟 Dépôt du Port",
        location: "Bakongo, Arrêt Port, N°123",
        distance: "2.3 km",
        isNearest: false,
        phone: "+242 05 555 12 34",
        whatsapp: "+242 05 555 12 34",
        route: "Direction Bakongo → Tourner à droite Port → 50m",
        products: [
          { name: "Carpe", price: "2500 FCFA/kg", stock: 15 },
          { name: "Capitaine", price: "3500 FCFA/kg", stock: 8 },
          { name: "Sardine", price: "1500 FCFA/kg", stock: 25 },
          { name: "Thon", price: "4000 FCFA/kg", stock: 6 },
          { name: "Maquereau", price: "2800 FCFA/kg", stock: 12 },
        ],
      },
      {
        name: "🐟 Poissonnerie Centrale",
        location: "Poto-Poto, Marché Central, Allée 5",
        distance: "1.2 km",
        isNearest: true,
        phone: "+242 05 555 23 45",
        whatsapp: "+242 05 555 23 45",
        route: "Direction Poto-Poto → Marché Central → Allée 5",
        products: [
          { name: "Carpe", price: "2400 FCFA/kg", stock: 18 },
          { name: "Capitaine", price: "3400 FCFA/kg", stock: 10 },
          { name: "Thon", price: "4000 FCFA/kg", stock: 7 },
          { name: "Bar", price: "3200 FCFA/kg", stock: 9 },
          { name: "Silure", price: "2600 FCFA/kg", stock: 14 },
        ],
      },
      {
        name: "🐟 Poissonnerie Bacongo",
        location: "Bacongo, près du lycée, N°45",
        distance: "3.1 km",
        isNearest: false,
        phone: "+242 05 555 67 89",
        whatsapp: "+242 05 555 67 89",
        route: "Direction Bacongo → Lycée → 100m après",
        products: [
          { name: "Carpe", price: "2300 FCFA/kg", stock: 20 },
          { name: "Capitaine", price: "3200 FCFA/kg", stock: 12 },
          { name: "Tilapia", price: "2800 FCFA/kg", stock: 16 },
          { name: "Perche", price: "2900 FCFA/kg", stock: 11 },
          { name: "Poisson-chat", price: "2200 FCFA/kg", stock: 22 },
        ],
      },
      {
        name: "🐟 Dépôt Talangaï",
        location: "Talangaï, Marché Total, Stand 12",
        distance: "4.5 km",
        isNearest: false,
        phone: "+242 05 555 89 01",
        whatsapp: "+242 05 555 89 01",
        route: "Direction Talangaï → Marché Total → Stand 12",
        products: [
          { name: "Carpe", price: "2600 FCFA/kg", stock: 13 },
          { name: "Capitaine", price: "3600 FCFA/kg", stock: 9 },
          { name: "Sardine", price: "1600 FCFA/kg", stock: 30 },
          { name: "Mulet", price: "2700 FCFA/kg", stock: 8 },
          { name: "Anguille", price: "4500 FCFA/kg", stock: 4 },
        ],
      },
    ],
    charbon: [
      {
        name: "⚫ Dépôt Charbon Montfleury",
        location: "Montfleury, près du marché",
        distance: "0.8 km",
        isNearest: true,
        phone: "+242 05 555 34 56",
        whatsapp: "+242 05 555 34 56",
        route: "Direction Montfleury → Marché → 100m à droite",
        products: [
          { name: "Charbon Bois", price: "1500 FCFA/sac", stock: 45 },
          { name: "Charbon Coco", price: "2000 FCFA/sac", stock: 30 },
          { name: "Charbon Mixte", price: "1200 FCFA/sac", stock: 60 },
          { name: "Charbon Premium", price: "2500 FCFA/sac", stock: 25 },
          { name: "Briquettes", price: "1800 FCFA/sac", stock: 35 },
        ],
      },
      {
        name: "⚫ Charbonnerie Poto-Poto",
        location: "Poto-Poto, Avenue Matsoua",
        distance: "1.5 km",
        isNearest: false,
        phone: "+242 05 555 45 67",
        whatsapp: "+242 05 555 45 67",
        route: "Direction Poto-Poto → Avenue Matsoua → N°78",
        products: [
          { name: "Charbon Bois", price: "1400 FCFA/sac", stock: 50 },
          { name: "Charbon Coco", price: "1900 FCFA/sac", stock: 28 },
          { name: "Charbon Mixte", price: "1100 FCFA/sac", stock: 65 },
          { name: "Charbon Gros", price: "2200 FCFA/sac", stock: 20 },
          { name: "Charbon Fin", price: "1600 FCFA/sac", stock: 40 },
        ],
      },
      {
        name: "⚫ Dépôt Ouenzé",
        location: "Ouenzé, près du pont",
        distance: "2.8 km",
        isNearest: false,
        phone: "+242 05 555 78 90",
        whatsapp: "+242 05 555 78 90",
        route: "Direction Ouenzé → Pont → 200m après",
        products: [
          { name: "Charbon Bois", price: "1300 FCFA/sac", stock: 55 },
          { name: "Charbon Coco", price: "1800 FCFA/sac", stock: 32 },
          { name: "Charbon Mixte", price: "1000 FCFA/sac", stock: 70 },
          { name: "Charbon Luxe", price: "2800 FCFA/sac", stock: 15 },
          { name: "Vieux Charbon", price: "900 FCFA/sac", stock: 80 },
        ],
      },
      {
        name: "⚫ Charbonnerie Makélékélé",
        location: "Makélékélé, Quartier Commerce",
        distance: "3.6 km",
        isNearest: false,
        phone: "+242 05 555 90 12",
        whatsapp: "+242 05 555 90 12",
        route: "Direction Makélékélé → Quartier Commerce → Marché",
        products: [
          { name: "Charbon Bois", price: "1450 FCFA/sac", stock: 48 },
          { name: "Charbon Coco", price: "1950 FCFA/sac", stock: 33 },
          { name: "Charbon Mixte", price: "1150 FCFA/sac", stock: 62 },
          { name: "Charbon Supérieur", price: "2400 FCFA/sac", stock: 22 },
          { name: "Charbon Économique", price: "950 FCFA/sac", stock: 75 },
        ],
      },
    ],
    boissons: [
      {
        name: "🍺 Boissons du Congo",
        location: "Brazzaville, Centre Ville",
        distance: "1.5 km",
        isNearest: false,
        phone: "+242 05 555 45 67",
        whatsapp: "+242 05 555 45 67",
        route: "Direction Centre Ville → Avenue de la Paix → N°45",
        products: [
          { name: "Primus", price: "800 FCFA/bouteille", stock: 120 },
          { name: "Coca-Cola", price: "600 FCFA/bouteille", stock: 150 },
          { name: "Fanta", price: "600 FCFA/bouteille", stock: 130 },
          { name: "Sprite", price: "600 FCFA/bouteille", stock: 110 },
          { name: "Schweppes", price: "700 FCFA/bouteille", stock: 90 },
        ],
      },
      {
        name: "🍺 Dépôt Boissons Bacongo",
        location: "Bacongo, Avenue Revolution",
        distance: "2.2 km",
        isNearest: false,
        phone: "+242 05 555 56 78",
        whatsapp: "+242 05 555 56 78",
        route: "Direction Bacongo → Avenue Revolution → N°112",
        products: [
          { name: "Primus", price: "750 FCFA/bouteille", stock: 100 },
          { name: "Coca-Cola", price: "550 FCFA/bouteille", stock: 140 },
          { name: "Fanta", price: "550 FCFA/bouteille", stock: 125 },
          { name: "Malt", price: "900 FCFA/bouteille", stock: 80 },
          { name: "Guinness", price: "1200 FCFA/bouteille", stock: 60 },
        ],
      },
      {
        name: "🍺 Boissons Talangaï",
        location: "Talangaï, près Total",
        distance: "3.8 km",
        isNearest: true,
        phone: "+242 05 555 67 89",
        whatsapp: "+242 05 555 67 89",
        route: "Direction Talangaï → Station Total → Dépôt",
        products: [
          { name: "Primus", price: "780 FCFA/bouteille", stock: 115 },
          { name: "Coca-Cola", price: "580 FCFA/bouteille", stock: 160 },
          { name: "Fanta", price: "580 FCFA/bouteille", stock: 135 },
          { name: "Heineken", price: "1500 FCFA/bouteille", stock: 70 },
          { name: "Castel", price: "850 FCFA/bouteille", stock: 95 },
        ],
      },
      {
        name: "🍺 Dépôt Moungali",
        location: "Moungali, Marché",
        distance: "4.1 km",
        isNearest: false,
        phone: "+242 05 555 89 01",
        whatsapp: "+242 05 555 89 01",
        route: "Direction Moungali → Marché → Stand 3",
        products: [
          { name: "Primus", price: "820 FCFA/bouteille", stock: 105 },
          { name: "Coca-Cola", price: "620 FCFA/bouteille", stock: 145 },
          { name: "Fanta", price: "620 FCFA/bouteille", stock: 120 },
          { name: "Pamplemousse", price: "650 FCFA/bouteille", stock: 85 },
          { name: "Orange", price: "650 FCFA/bouteille", stock: 88 },
        ],
      },
    ],
    vivriers: [
      {
        name: "🌾 Marché Vivriers Central",
        location: "Poto-Poto, Marché Central",
        distance: "1.0 km",
        isNearest: true,
        phone: "+242 05 555 23 45",
        whatsapp: "+242 05 555 23 45",
        route: "Direction Poto-Poto → Marché Central → Allée vivriers",
        products: [
          { name: "Riz", price: "2500 FCFA/sac", stock: 85 },
          { name: "Manioc", price: "1500 FCFA/tas", stock: 120 },
          { name: "Maïs", price: "2000 FCFA/sac", stock: 95 },
          { name: "Haricot", price: "3500 FCFA/sac", stock: 65 },
          { name: "Arachide", price: "4000 FCFA/sac", stock: 45 },
        ],
      },
      {
        name: "🌾 Dépôt Céréales Bacongo",
        location: "Bacongo, Zone Commerciale",
        distance: "2.5 km",
        isNearest: false,
        phone: "+242 05 555 34 56",
        whatsapp: "+242 05 555 34 56",
        route: "Direction Bacongo → Zone Commerciale → Dépôt",
        products: [
          { name: "Riz", price: "2400 FCFA/sac", stock: 90 },
          { name: "Manioc", price: "1400 FCFA/tas", stock: 110 },
          { name: "Maïs", price: "1900 FCFA/sac", stock: 100 },
          { name: "Haricot", price: "3300 FCFA/sac", stock: 70 },
          { name: "Mil", price: "2800 FCFA/sac", stock: 55 },
        ],
      },
      {
        name: "🌾 Vivriers Talangaï",
        location: "Talangaï, Marché",
        distance: "3.7 km",
        isNearest: false,
        phone: "+242 05 555 45 67",
        whatsapp: "+242 05 555 45 67",
        route: "Direction Talangaï → Marché → Section vivriers",
        products: [
          { name: "Riz", price: "2600 FCFA/sac", stock: 80 },
          { name: "Manioc", price: "1600 FCFA/tas", stock: 115 },
          { name: "Maïs", price: "2100 FCFA/sac", stock: 88 },
          { name: "Haricot", price: "3700 FCFA/sac", stock: 60 },
          { name: "Sorgho", price: "2300 FCFA/sac", stock: 72 },
        ],
      },
    ],
    fruits: [
      {
        name: "🍌 Fruits Market Poto-Poto",
        location: "Poto-Poto, Marché Central",
        distance: "1.0 km",
        isNearest: true,
        phone: "+242 05 555 89 01",
        whatsapp: "+242 05 555 89 01",
        route: "Direction Poto-Poto → Marché Central → Section fruits",
        products: [
          { name: "Bananes", price: "200 FCFA/régime", stock: 150 },
          { name: "Mangues", price: "500 FCFA/kg", stock: 80 },
          { name: "Ananas", price: "1500 FCFA/pièce", stock: 60 },
          { name: "Papayes", price: "800 FCFA/pièce", stock: 45 },
          { name: "Oranges", price: "300 FCFA/kg", stock: 120 },
        ],
      },
      {
        name: "🍌 Fruits Bacongo",
        location: "Bacongo, Marché",
        distance: "2.4 km",
        isNearest: false,
        phone: "+242 05 555 90 12",
        whatsapp: "+242 05 555 90 12",
        route: "Direction Bacongo → Marché → Stand fruits",
        products: [
          { name: "Bananes", price: "180 FCFA/régime", stock: 140 },
          { name: "Mangues", price: "480 FCFA/kg", stock: 75 },
          { name: "Ananas", price: "1400 FCFA/pièce", stock: 55 },
          { name: "Avocats", price: "600 FCFA/pièce", stock: 40 },
          { name: "Citrons", price: "250 FCFA/kg", stock: 90 },
        ],
      },
      {
        name: "🍌 Fruits Talangaï",
        location: "Talangaï, Marché",
        distance: "4.0 km",
        isNearest: false,
        phone: "+242 05 555 01 23",
        whatsapp: "+242 05 555 01 23",
        route: "Direction Talangaï → Marché → Section fruits",
        products: [
          { name: "Bananes", price: "220 FCFA/régime", stock: 160 },
          { name: "Mangues", price: "520 FCFA/kg", stock: 85 },
          { name: "Ananas", price: "1600 FCFA/pièce", stock: 65 },
          { name: "Papayes", price: "900 FCFA/pièce", stock: 50 },
          { name: "Pomelos", price: "700 FCFA/pièce", stock: 35 },
        ],
      },
    ],
  };

  const categories = [
    { emoji: "🐟", name: "Poisson", count: 4 },
    { emoji: "⚫", name: "Charbon", count: 4 },
    { emoji: "🍺", name: "Boissons", count: 4 },
    { emoji: "🌾", name: "Vivriers", count: 3 },
    { emoji: "🍌", name: "Fruits", count: 3 },
  ];

  const filteredDepots = selectedCategory
    ? depotsByCategory[selectedCategory] || []
    : [];

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">💪</div>
            <span>MAMAN POWER</span>
          </div>
          <div className="user-info">
            <span>Maman Marie</span>
            <div className="user-avatar">MM</div>
            <button className="dark-mode-btn" onClick={toggleDarkMode}>
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </header>

      <div className="search-section">
        <div className="search-container">
          <div className="search-header">
            <span>🔎</span>
            <span className="search-title">Rechercher un produit</span>
          </div>
          <input
            type="text"
            className="search-input"
            placeholder="Ex: poisson, charbon, boissons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="categories-section">
        <div className="categories-title">CATÉGORIES DISPONIBLES</div>
        <div className="categories-container">
          {categories.map((category, index) => (
            <div
              key={index}
              className="category-card"
              onClick={() => showCategory(category.name.toLowerCase())}
            >
              <div className="category-emoji">{category.emoji}</div>
              <div className="category-name">{category.name}</div>
              <div className="category-count">{category.count} dépôts</div>
            </div>
          ))}
        </div>
      </div>

      <div className="depots-section" id="depotsSection">
        <div className="depots-container" id="depotsContainer">
          {filteredDepots.length > 0 ? (
            filteredDepots.map((depot, index) => (
              <div
                key={index}
                className={`depot-card ${depot.isNearest ? "nearest" : ""}`}
              >
                {depot.isNearest && (
                  <div className="nearest-badge">PLUS PROCHE</div>
                )}
                <div className="depot-header">
                  <div className="depot-info">
                    <div className="depot-name">{depot.name}</div>
                    <div className="depot-location">{depot.location}</div>
                    <div className="depot-distance">{depot.distance}</div>
                  </div>
                </div>
                <div className="depot-products">
                  {depot.products.map((product, pIndex) => (
                    <div key={pIndex} className="product-item">
                      <span className="product-name">{product.name}</span>
                      <span className="product-price">{product.price}</span>
                      <span className="product-stock">
                        Stock:{product.stock} {getUnitFromPrice(product.price)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="depot-actions">
                  <button
                    className="action-btn btn-call"
                    onClick={() => callDepot(depot.phone)}
                  >
                    Appeler
                  </button>
                  <button
                    className="action-btn btn-route"
                    onClick={() => showRoute(depot.route)}
                  >
                    Itinéraire
                  </button>
                </div>
              </div>
            ))
          ) : selectedCategory ? (
            <div
              style={{ textAlign: "center", color: "white", padding: "20px" }}
            >
              Aucun dépôt trouvé pour cette catégorie.
            </div>
          ) : (
            <div
              style={{ textAlign: "center", color: "white", padding: "20px" }}
            >
              Sélectionnez une catégorie pour voir les dépôts.
            </div>
          )}
        </div>
      </div>

      <div className="floating-buttons">
        <button className="fab fab-audio" onClick={playAudioInfo}>
          🔊
        </button>
        <button className="fab fab-favorites" onClick={showFavorites}>
          ⭐
        </button>
      </div>
    </div>
  );
}

export default App;
