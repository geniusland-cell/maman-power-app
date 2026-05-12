import { useState, useEffect, useMemo } from "react";
import {
  listenToCategories,
  listenToDepotsAndProducts,
  saveToCache,
  loadFromCache,
  clearCache,
  getDepotsWithProductsPaginated,
} from "./firebase";
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

  const [categoriesData, setCategoriesData] = useState(() => {
    const cacheData = loadFromCache();
    return cacheData?.categories || [];
  });

  const [lastRefreshTime, setLastRefreshTime] = useState(() => {
    const cacheData = loadFromCache();
    return cacheData?.lastSync ? new Date(cacheData.lastSync) : null;
  });

  const [isOnline, setIsOnline] = useState(true); // 🌐 Statut de la connexion Realtime
  const [isCached, setIsCached] = useState(() => {
    const cacheData = loadFromCache();
    return cacheData && cacheData.categories.length > 0; // Vrai si cache trouvé
  });

  // ✅ PAGINATION DES DÉPÔTS
  const pageSize = 20; // Nombre de dépôts par page
  const [displayedDepots, setDisplayedDepots] = useState([]); // Dépôts affichés (pagés)
  const [currentPage, setCurrentPage] = useState(0); // Numéro de page (commence à 0)
  const [totalDepots, setTotalDepots] = useState(0); // Nombre total de dépôts
  const [hasMore, setHasMore] = useState(false); // Y a-t-il d'autres pages?
  const [isLoadingMore, setIsLoadingMore] = useState(false); // En train de charger plus?

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

  // ✅ PAGINATION: Charger la page initiale ou page suivante
  const loadMoreDepots = async (pageNum = 0) => {
    try {
      setIsLoadingMore(true);
      const vendorLat = -4.2726;
      const vendorLon = 15.2663;

      const result = await getDepotsWithProductsPaginated(
        vendorLat,
        vendorLon,
        pageSize,
        pageNum,
      );

      if (result.success && result.data) {
        const {
          depots: newDepots,
          totalCount,
          hasMore: moreExists,
        } = result.data;

        if (pageNum === 0) {
          // Première page: remplacer complètement
          setDisplayedDepots(newDepots);
          console.log(` Page 1 chargée: ${newDepots.length} dépôts`);
        } else {
          // Pages suivantes: ajouter aux existants
          setDisplayedDepots((prev) => [...prev, ...newDepots]);
          console.log(
            ` Page ${pageNum + 1} chargée: ${newDepots.length} dépôts supplémentaires`,
          );
        }

        setTotalDepots(totalCount);
        setHasMore(moreExists);
        setCurrentPage(pageNum);
      }
    } catch (error) {
      console.error(" Erreur chargement pagination:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // ✅ PAGINATION: Charger la page suivante (bouton "Charger plus")
  const loadNextPage = () => {
    if (hasMore && !isLoadingMore) {
      loadMoreDepots(currentPage + 1);
    }
  };

  //  ✅ Charger la première page au démarrage (après cache)
  useEffect(() => {
    if (user) {
      const vendorLat = -4.2726;
      const vendorLon = 15.2663;

      console.log("🎧 Initialisation des Realtime Listeners...");
      if (isCached) {
        console.log("  📦 Cache chargé. En attente des données Realtime...");
      }

      // ✅ LISTENER 1: Catégories en temps réel
      const unsubscribeCategories = listenToCategories((categories) => {
        console.log(` Catégories reçues (realtime): ${categories.length}`);
        setCategoriesData(categories);
        setIsOnline(true); // ✅ Firebase fonctionne!
        setIsCached(false); // ✅ Données en direct, pas du cache
      });

      // ✅ LISTENER 2: Dépôts + produits en temps réel
      const unsubscribeDepots = listenToDepotsAndProducts(
        vendorLat,
        vendorLon,
        (depotsWithProducts) => {
          console.log(` Dépôts reçus (realtime): ${depotsWithProducts.length}`);
          setLastRefreshTime(new Date());
          setIsOnline(true);
          setIsCached(false);

          // 💾 SAUVEGARDER dans le cache automatiquement
          saveToCache(categoriesData, depotsWithProducts);
        },
      );

      // ✅ Nettoyage des listeners au unmount
      return () => {
        console.log("🛑 Arrêt des Realtime Listeners...");
        unsubscribeCategories();
        unsubscribeDepots();
      };
    }
  }, [user, isCached, categoriesData]);

  // ✅ Charger la première page de dépôts au démarrage (avec pagination)
  useEffect(() => {
    if (user) {
      console.log("📄 Chargement 1ère page dépôts (pagination)...");
      loadMoreDepots(0);
    }
  }, [user]);

  // ✅ Filtrer les dépôts affichés selon la catégorie sélectionnée (memoïsé)
  const filteredDepots = useMemo(() => {
    if (selectedCategory && displayedDepots.length > 0) {
      const filtered = displayedDepots
        .map((depot) => ({
          ...depot,
          products: depot.products.filter(
            (product) => product.category === selectedCategory,
          ),
        }))
        .filter((depot) => depot.products.length > 0);

      console.log(
        ` Filtre ${filtered.length} depots pour categorie: ${selectedCategory}`,
      );
      return filtered;
    }
    return [];
  }, [selectedCategory, displayedDepots]);

  // ✅ Scroll vers la section des dépôts quand catégorie change
  useEffect(() => {
    if (selectedCategory && filteredDepots.length > 0) {
      const depotsSection = document.querySelector(".depots-section");
      if (depotsSection) {
        depotsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [selectedCategory, filteredDepots]);

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

  // ✅ Handler de déconnexion avec nettoyage du cache
  const handleLogout = () => {
    console.log("🛑 Déconnexion avec nettoyage du cache...");
    clearCache();
    logout();
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
            <button className="logout-btn" onClick={handleLogout}>
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

      <div className="refresh-header">
        <div className="realtime-indicator">
          {isCached ? (
            <>
              <span className="indicator-dot cached">💾</span>
              <span className="indicator-text cached">
                Données du cache - Synchronisation en cours...
              </span>
            </>
          ) : isOnline ? (
            <>
              <span className="indicator-dot online">🟢</span>
              <span className="indicator-text online">
                En direct (Realtime) - Données actualisées automatiquement
              </span>
            </>
          ) : (
            <>
              <span className="indicator-dot offline">⚫</span>
              <span className="indicator-text offline">
                Hors ligne - Affichage du cache
              </span>
            </>
          )}
        </div>
        {lastRefreshTime && (
          <span className="last-refresh">
            ⏱️ Dernière sync: {lastRefreshTime.toLocaleTimeString("fr-FR")}
          </span>
        )}
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
        {selectedCategory && <DepotsList depots={filteredDepots || []} />}

        {/* ✅ PAGINATION: Bouton "Charger plus" */}
        {hasMore && (
          <div className="pagination-container">
            <button
              className={`load-more-btn ${isLoadingMore ? "loading" : ""}`}
              onClick={loadNextPage}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <>
                  <span className="spinner">⏳</span> Chargement...
                </>
              ) : (
                <>
                  <span className="icon">⬇️</span>
                  Charger plus ({displayedDepots.length}/{totalDepots})
                </>
              )}
            </button>
          </div>
        )}

        {/* ✅ PAGINATION: Indicateur fin de liste */}
        {!hasMore && displayedDepots.length > 0 && (
          <div className="pagination-end">
            <span className="end-indicator">
              ✅ Tous les dépôts chargés ({totalDepots}/{totalDepots})
            </span>
          </div>
        )}
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
