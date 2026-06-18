import { useState, useEffect, useMemo, ReactNode, useRef } from "react";
import {
  listenToCategories,
  listenToDepotsAndProducts,
  saveToCache,
  loadFromCache,
  clearCache,
  getDepotsWithProductsPaginated,
  ensureCategoriesExist,
  loadQuartiersCache,
  getCurrentQuarter,
  isVotingActive,
  voteForDepot,
} from "./firebase";
import { useAuth } from "./auth";
import UnifiedLogin from "./components/UnifiedLogin";
import DepotsList from "./components/DepotsList";
import UpdateNotification from "./components/UpdateNotification";
import VotingGuidelinesModal from "./components/VotingGuidelinesModal";
import VotingChart from "./components/VotingChart";
import type { Category, DepotWithProducts } from "./types";
import "./auth.css";
import "./App.css";

function App(): ReactNode {
  const { user, loading, logout } = useAuth();
  const lastCategoryRef = useRef<string | null>(null); // Tracer la dernière catégorie scrollée

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    return savedDarkMode === "enabled";
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const savedFavorites = localStorage.getItem("depot_favorites");
    return savedFavorites ? JSON.parse(savedFavorites) : [];
  });

  const [categoriesData, setCategoriesData] = useState<Category[]>(() => {
    const cacheData = loadFromCache();
    return cacheData?.categories || [];
  });

  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(() => {
    const cacheData = loadFromCache();
    return cacheData?.lastSync ? new Date(cacheData.lastSync) : null;
  });

  const [isOnline, setIsOnline] = useState<boolean>(true); //Statut de la connexion Realtime
  const [isCached, setIsCached] = useState<boolean>(() => {
    const cacheData = loadFromCache();
    return cacheData ? cacheData.categories?.length > 0 : false;
  });

  // 📍 Position GPS de l'utilisateur
  const [userLat, setUserLat] = useState<number>(() => {
    const saved = localStorage.getItem("user_latitude");
    return saved ? parseFloat(saved) : -4.2726; // Fallback: Brazzaville
  });
  const [userLon, setUserLon] = useState<number>(() => {
    const saved = localStorage.getItem("user_longitude");
    return saved ? parseFloat(saved) : 15.2663; // Fallback: Brazzaville
  });

  // 🗳️ Système de vote
  const [showVotingGuidelines, setShowVotingGuidelines] =
    useState<boolean>(false);
  const [votingStatus, setVotingStatus] = useState<{
    active: boolean;
    daysLeft: number;
    currentQuarter: string;
  }>({
    active: false,
    daysLeft: 0,
    currentQuarter: getCurrentQuarter(),
  });
  const [hasAcceptedVoting, setHasAcceptedVoting] = useState<boolean>(() => {
    const quarter = getCurrentQuarter();
    const accepted = localStorage.getItem(
      `voting_guidelines_accepted_${quarter}`,
    );
    return accepted === "true";
  });
  const [showVotingStats, setShowVotingStats] = useState<boolean>(false);

  //  pagintion des depots
  const pageSize = 20;
  const [displayedDepots, setDisplayedDepots] = useState<DepotWithProducts[]>(
    () => {
      // Charger les dépôts du cache au démarrage
      const cacheData = loadFromCache();
      return cacheData?.depots || [];
    },
  );
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalDepots, setTotalDepots] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

  // Charger le cache des quartiers dès le démarrage
  useEffect(() => {
    loadQuartiersCache();
  }, []);

  // 🗳️ Vérifier le statut du vote au démarrage
  useEffect(() => {
    const checkVotingStatus = async () => {
      const status = await isVotingActive();
      setVotingStatus(status);
      console.log(" Statut vote chargé:", status);

      // Si la période de vote est active et l'utilisateur n'a pas accepté les règles, afficher le modal
      if (status.active && !hasAcceptedVoting && user) {
        setShowVotingGuidelines(true);
      }
    };

    checkVotingStatus();
  }, [user]);

  // 📍 Récupérer la position GPS de l'utilisateur au démarrage
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log(
            `📍 Position trouvée: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          );
          setUserLat(latitude);
          setUserLon(longitude);
          localStorage.setItem("user_latitude", latitude.toString());
          localStorage.setItem("user_longitude", longitude.toString());
        },
        (error) => {
          console.warn(`⚠️ Impossible accéder GPS: ${error.message}`);
          // On garde le fallback à Brazzaville
        },
      );
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode ? "enabled" : "disabled");
  };

  const loadMoreDepots = async (pageNum = 0) => {
    try {
      setIsLoadingMore(true);

      const result = await getDepotsWithProductsPaginated(
        userLat,
        userLon,
        pageSize,
        pageNum,
      );

      if (result.success && result.data) {
        const newDepots = result.data;

        if (pageNum === 0) {
          setDisplayedDepots(newDepots);
          console.log(` Page 1 chargée: ${newDepots.length} dépôts`);
        } else {
          setDisplayedDepots((prev) => [...prev, ...newDepots]);
          console.log(
            ` Page ${pageNum + 1} chargée: ${newDepots.length} dépôts supplémentaires`,
          );
        }

        setTotalDepots(newDepots.length);
        setHasMore(false);
        setCurrentPage(pageNum);
      }
    } catch (error) {
      console.error(" Erreur chargement pagination:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  //  Pagination : Charger la page suivante quand on possede plus de 40 depots (bouton "Charger plus")
  const loadNextPage = () => {
    if (hasMore && !isLoadingMore) {
      loadMoreDepots(currentPage + 1);
    }
  };

  // Gérer les favoris (ajouter/retirer un dépôt des favoris)
  const toggleFavorite = (depotId: string) => {
    const newFavorites = favorites.includes(depotId)
      ? favorites.filter((id) => id !== depotId)
      : [...favorites, depotId];

    setFavorites(newFavorites);
    localStorage.setItem("depot_favorites", JSON.stringify(newFavorites));
  };

  // NOUVEAU: Charger les dépôts du cache au démarrage (même offline)
  useEffect(() => {
    console.log(" Chargement initial des dépôts depuis cache...");
    const cacheData = loadFromCache();
    if (cacheData?.depots && cacheData.depots.length > 0) {
      setDisplayedDepots(cacheData.depots);
      setTotalDepots(cacheData.depots.length);
      setIsCached(true);
      setIsOnline(false); // On ne sait pas si on est online, on affiche le cache
      console.log(` Dépôts du cache chargés: ${cacheData.depots.length}`);
    }
  }, []); // Une seule fois au démarrage

  // Initialiser les catégories racine si elles n'existent pas
  useEffect(() => {
    if (user) {
      console.log("🚀 User connecté - Vérification des catégories...");
      ensureCategoriesExist();
    }
  }, [user?.id]); // Une seule fois quand l'utilisateur change

  useEffect(() => {
    if (user) {
      console.log(" Initialisation des Realtime Listeners...");
      if (isCached) {
        console.log(" Cache chargé. En attente des données Realtime...");
      }

      //  LISTENER 1: Catégories en temps réel
      const unsubscribeCategories = listenToCategories((categories) => {
        console.log(` Catégories reçues (realtime): ${categories.length}`);
        setCategoriesData(categories);
        setIsOnline(true); // Firebase fonctionne!
        setIsCached(false); // Données en direct, pas du cache
      });

      //  LISTENER 2: Dépôts + produits en temps réel
      const unsubscribeDepots = listenToDepotsAndProducts(
        userLat,
        userLon,
        (depotsWithProducts) => {
          console.log(` Dépôts reçus (realtime): ${depotsWithProducts.length}`);
          setLastRefreshTime(new Date());
          setIsOnline(true);
          setIsCached(false);
          setDisplayedDepots(depotsWithProducts); // Mettre à jour les dépôts en temps réel

          // SAUVEGARDER dans le cache automatiquement avec les catégories du state
          setCategoriesData((prevCategories) => {
            saveToCache(prevCategories, depotsWithProducts);
            return prevCategories;
          });
        },
      );

      //  Nettoyage des listeners au unmount
      return () => {
        console.log(" Arrêt des Realtime Listeners...");
        unsubscribeCategories();
        unsubscribeDepots();
      };
    }
  }, [user?.id, userLat, userLon]); // Relancer si la position change!

  useEffect(() => {
    if (user) {
      console.log(" Chargement 1ère page dépôts (pagination)...");
      loadMoreDepots(0);
    }
  }, [user, userLat, userLon]);

  const filteredDepots = useMemo(() => {
    if (!selectedCategory || displayedDepots.length === 0) return [];

    // Créer une Map de catégories pour recherche O(1)
    const categoryMappings: Record<string, string[]> = {
      "Poisson & Viande": ["Poisson", "Viande", "Poisson & Viande"],
      "Fruit et Legume": ["Fruits", "Fruit et Legume"],
      "Epiceries/Vivre secs": ["Vivriers", "Epiceries/Vivre secs"],
    };

    const allowedCategories = categoryMappings[selectedCategory] || [
      selectedCategory,
    ];
    const categorySet = new Set(allowedCategories); // Pour recherche rapide O(1)

    const filtered = displayedDepots
      .map((depot) => ({
        ...depot,
        products: depot.products.filter((product) =>
          categorySet.has(product.category),
        ),
      }))
      .filter((depot) => depot.products.length > 0);

    return filtered;
  }, [selectedCategory, displayedDepots]);

  useEffect(() => {
    if (selectedCategory && filteredDepots.length > 0) {
      if (lastCategoryRef.current !== selectedCategory) {
        lastCategoryRef.current = selectedCategory;

        setTimeout(() => {
          const depotsSection = document.querySelector(".depots-section");
          if (depotsSection) {
            depotsSection.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }, 100);
      }
    }
  }, [selectedCategory]);

  const showCategory = (categoryName: string) => {
    console.log(" Categorie sélectionnée:", categoryName);
    setSelectedCategory(categoryName);
  };

  //  Gérer l'acceptation des règles de vote
  const handleVotingGuidelinesAccept = () => {
    setHasAcceptedVoting(true);
    setShowVotingGuidelines(false);
  };

  //  Gérer le vote pour un dépôt
  const handleVote = async (depotId: string): Promise<void> => {
    if (!user) {
      throw new Error("Vous devez être connecté pour voter");
    }

    if (!hasAcceptedVoting) {
      throw new Error("Vous devez accepter les règles avant de voter");
    }

    const result = await voteForDepot(depotId, user.id);
    if (!result.success) {
      throw new Error(result.error || "Erreur lors du vote");
    }

    console.log(" Vote enregistré pour dépôt:", depotId);
  };

  const handleLogout = () => {
    console.log(" Déconnexion avec nettoyage du cache...");
    clearCache();
    logout();
  };

  const normalizeCategoryName = (categoryName: string): string => {
    if (categoryName === "Poisson" || categoryName === "Viande") {
      return "Poisson & Viande";
    }
    if (categoryName === "Fruits") {
      return "Fruit et Legume";
    }
    if (categoryName === "Vivriers") {
      return "Epiceries/Vivre secs";
    }
    return categoryName;
  };

  const categoryEmoji = (categoryName: string): string => {
    if (categoryName === "Poisson & Viande") return "🧊";
    if (categoryName === "Charbon") return "🪵";
    if (categoryName === "Boissons") return "🍾";
    if (categoryName === "Epiceries/Vivre secs") return "🛒";
    if (categoryName === "Fruit et Legume") return "🍅";
    return "📦";
  };

  const categories = Array.from(
    new Map(
      (categoriesData || []).map((cat) => {
        const normalized = normalizeCategoryName(cat.name);
        return [
          normalized,
          {
            ...cat,
            name: normalized,
            emoji: categoryEmoji(normalized),
          },
        ];
      }),
    ).values(),
  );

  // Verifier si l'utilisateur est un vendeur, sinon rediriger
  if (user && user.role !== "vendor") {
    return (
      <div className="app">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <div className="logo">
                <div className="logo-icon">MP</div>
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

  if (isCached && loading && !user) {
    return (
      <div className="app">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <div className="logo">
                <div className="logo-icon">MP</div>
                <span>MAMAN POWER</span>
              </div>
            </div>
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div
                style={{
                  fontSize: "48px",
                  marginBottom: "20px",
                  animation: "spin 1s linear infinite",
                }}
              >
                ⏳
              </div>
              <h2 style={{ marginBottom: "10px", color: "#009739" }}>
                Restauration de votre session...
              </h2>
              <p style={{ fontSize: "14px", color: "#666" }}>
                Merci de patienter quelques secondes
              </p>
            </div>
          </div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // AFFICHER LOGIN SEULEMENT si pas d'utilisateur ET pas de cache
  if (!user && !isCached) {
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

  return (
    <div className="app">
      <UpdateNotification />
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">MP</div>
            <span>MAMAN POWER</span>
          </div>
          <div className="user-info">
            {user ? (
              <>
                <span>
                  {user.name} ({user.role})
                </span>
                <div className="user-avatar">
                  {user.name
                    .split(" ")
                    .slice(0, 2)
                    .map((word) => word.charAt(0))
                    .join("")
                    .toUpperCase()}
                </div>
                {votingStatus.active && (
                  <button
                    className="voting-btn"
                    onClick={() => setShowVotingStats(true)}
                    title="Voir le classement des votes"
                  >
                    Classement
                  </button>
                )}
                <button className="logout-btn" onClick={handleLogout}>
                  Déconnexion
                </button>
              </>
            ) : (
              <span style={{ color: "#999", fontSize: "14px" }}>
                Mode hors ligne
              </span>
            )}
            <button className="dark-mode-btn" onClick={toggleDarkMode}>
              {darkMode ? "S" : "N"}
            </button>
          </div>
        </div>
      </header>

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
              <span className="indicator-dot online">🟢 en ligne </span>
            </>
          ) : (
            <>
              <span className="indicator-dot offline">⚫ hors ligne </span>
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
              <div className="category-count">
                {displayedDepots.filter((d) =>
                  d.products.some((p) =>
                    category.name === "Poisson & Viande"
                      ? ["Poisson", "Viande", "Poisson & Viande"].includes(
                          p.category,
                        )
                      : category.name === "Fruit et Legume"
                        ? ["Fruits", "Fruit et Legume"].includes(p.category)
                        : category.name === "Epiceries/Vivre secs"
                          ? ["Vivriers", "Epiceries/Vivre secs"].includes(
                              p.category,
                            )
                          : p.category === category.name,
                  ),
                ).length || 0}{" "}
                dépôts
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="depots-section">
        {selectedCategory && (
          <DepotsList
            depots={filteredDepots || []}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onVote={handleVote}
            userId={user?.id}
            votingEnabled={votingStatus.active && hasAcceptedVoting}
          />
        )}

        {/*  PAGINATION: Bouton "Charger plus" */}
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
                  <span className="icon"></span>
                  Charger plus ({displayedDepots.length}/{totalDepots})
                </>
              )}
            </button>
          </div>
        )}

        {/*  PAGINATION: Indicateur fin de liste */}
        {!hasMore && displayedDepots.length > 0 && (
          <div className="pagination-end">
            <span className="end-indicator">
              Tous les dépôts chargés ({totalDepots}/{totalDepots})
            </span>
          </div>
        )}
      </div>

      <div className="floating-buttons"></div>

      {/*  Modal Règles de Vote */}
      {showVotingGuidelines && (
        <VotingGuidelinesModal
          daysLeft={votingStatus.daysLeft}
          onAccept={handleVotingGuidelinesAccept}
        />
      )}

      {/*  Modal Classement des Votes */}
      <VotingChart
        isOpen={showVotingStats}
        onClose={() => setShowVotingStats(false)}
      />

      {/* Footer */}
      <footer className="app-footer">
        <p>© 2026 | Maman Power Genesis v1.0 | Powered by Vision Unique</p>
      </footer>
    </div>
  );
}

export default App;
