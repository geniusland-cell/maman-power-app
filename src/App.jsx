import { useState, useEffect } from "react";
import { getCategories, getAllDepotsWithAllProducts } from "./firebase";
import { useAuth } from "./auth";
import UnifiedLogin from "./components/UnifiedLogin";
import DepotsList from "./components/DepotsList";
import "./auth.css";
import "./App.css";

function App() {
  const { user, loading, logout } = useAuth();

  const [darkMode, setDarkMode] = useState(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    return savedDarkMode === "enabled";
  });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [depots, setDepots] = useState([]);
  const [allDepotsCache, setAllDepotsCache] = useState([]); // ⚡ Cache de TOUS les dépôts
  const [categoriesData, setCategoriesData] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

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

  useEffect(() => {
    if (user) {
      const loadAllData = async () => {
        try {
          setLoadingProducts(true);

          const categoriesResult = await getCategories();
          setCategoriesData(
            categoriesResult.success ? categoriesResult.data : [],
          );

          const vendorLat = -4.2726;
          const vendorLon = 15.2663;
          const depotsResult = await getAllDepotsWithAllProducts(
            vendorLat,
            vendorLon,
          );

          if (depotsResult.success) {
            setAllDepotsCache(depotsResult.data);
            console.log("⚡ Tous les dépôts chargés en cache!");
          }
        } catch (error) {
          console.error("Erreur chargement données:", error);
        } finally {
          setLoadingProducts(false);
        }
      };

      loadAllData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCategory && allDepotsCache.length > 0) {
      setLoadingProducts(true);

      // Filtrer les depots qui ont des produits dans cette categorie
      const filteredDepots = allDepotsCache
        .map((depot) => ({
          ...depot,
          products: depot.products.filter(
            (product) => product.category === selectedCategory,
          ),
        }))
        .filter((depot) => depot.products.length > 0);

      console.log(
        ` Filtre ${filteredDepots.length} depots pour categorie: ${selectedCategory}`,
      );

      setDepots(filteredDepots);
      setLoadingProducts(false);
    }
  }, [selectedCategory, allDepotsCache]);

  useEffect(() => {
    if (selectedCategory && !loadingProducts) {
      const depotsSection = document.querySelector(".depots-section");
      if (depotsSection) {
        depotsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [selectedCategory, loadingProducts]);

  const showCategory = (categoryName) => {
    console.log(" Categorie sélectionnée:", categoryName);
    setSelectedCategory(categoryName);
  };

  const playAudioInfo = () => {
    alert("Informations audio en développement...");
  };

  const showFavorites = () => {
    alert("Favoris en développement...");
  };

  const categories = Array.from(
    new Map((categoriesData || []).map((cat) => [cat.name, cat])).values(),
  );

  // Verifier si l'utilisateur est un vendeur, sinon rediriger
  if (user && user.role !== "vendor") {
    return (
      <div className="app">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <div className="logo">
                <div className="logo-icon">M</div>
                <span>MAMAN POWER</span>
              </div>
              <h2>Redirection</h2>
            </div>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <p> Redirection vers votre interface appropriée...</p>
              <p style={{ fontSize: "14px", color: "#666", marginTop: "10px" }}>
                {user.role === "admin"
                  ? "Interface Admin"
                  : "Interface Manager"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Afficher l'interface de connexion si pas d'utilisateur
  if (!user) {
    return (
      <div className="app">
        <UnifiedLogin
          onLoginSuccess={() => {
            window.location.reload();
          }}
        />
      </div>
    );
  }

  // Afficher l'état de chargement
  if (loading) {
    return (
      <div className="app">
        <div className="loading-container">
          <h2>Chargement...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">M</div>
            <span>MAMAN POWER</span>
          </div>
          <div className="user-info">
            <span>
              {user?.name || "Utilisateur"} ({user?.role || "unknown"})
            </span>
            <div className="user-avatar">
              {user?.name
                ? user.name
                    .split(" ")
                    .slice(0, 2)
                    .map((word) => word.charAt(0))
                    .join("")
                    .toUpperCase()
                : "U"}
            </div>
            <button className="dark-mode-btn" onClick={toggleDarkMode}>
              {darkMode ? "S" : "N"}
            </button>
            <button className="logout-btn" onClick={logout}>
              Déconnexion
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
              onClick={() => showCategory(category.name)}
            >
              <div className="category-emoji">{category.emoji}</div>
              <div className="category-name">{category.name}</div>
              <div className="category-count">{category.count} dépôts</div>
            </div>
          ))}
        </div>
      </div>

      <div className="depots-section">
        {selectedCategory && <DepotsList depots={depots || []} />}
      </div>

      <div className="floating-buttons">
        <button className="fab fab-audio" onClick={playAudioInfo}>
          audio
        </button>
        <button className="fab fab-favorites" onClick={showFavorites}>
          fav
        </button>
      </div>
    </div>
  );
}

export default App;
