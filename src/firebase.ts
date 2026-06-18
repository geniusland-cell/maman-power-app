import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  getDatabase,
  ref,
  set,
  get,
  push,
  onValue,
  update,
} from "firebase/database";
import type {
  User,
  Depot,
  Category,
  FirebaseResponse,
  PaginationResponse,
  DepotWithProducts,
} from "./types";

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDAv53Bv6a8iYVsZAWvljxUI2qlhp4n5W4",
  authDomain: "vision-unique.firebaseapp.com",
  projectId: "vision-unique",
  storageBucket: "vision-unique.firebasestorage.app",
  messagingSenderId: "134892705629",
  appId: "1:134892705629:web:fc3302d6b6a7b2d84f3ab4",
  measurementId: "G-FY1VC8TTD0",
  databaseURL:
    "https://vision-unique-default-rtdb.europe-west1.firebasedatabase.app",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// Cache des quartiers avec leurs coordonnées
let quartiersCache: Map<string, { latitude: number; longitude: number }> =
  new Map();

// Récupérer les quartiers depuis Firebase avec leurs coordonnées
export const loadQuartiersCache = async (): Promise<void> => {
  try {
    const quartiersRef = ref(db, "quartiers");
    const snapshot = await get(quartiersRef);

    if (snapshot.exists()) {
      const quartiersData = snapshot.val();
      quartiersCache.clear();

      Object.keys(quartiersData).forEach((key) => {
        const quartier = quartiersData[key];
        if (quartier.name && quartier.latitude && quartier.longitude) {
          quartiersCache.set(quartier.name, {
            latitude: quartier.latitude,
            longitude: quartier.longitude,
          });
        }
      });

      console.log(` Cache quartiers chargé: ${quartiersCache.size} quartiers`);
    }
  } catch (err) {
    console.error(" Erreur chargement cache quartiers:", err);
  }
};

// Récupérer les coordonnées d'un quartier par son nom
const getQuartierCoordinates = (
  quartierName: string | undefined,
): { lat: number; lon: number } => {
  if (!quartierName) {
    // Fallback: Brazzaville (Poto-Poto)
    return { lat: -4.2726, lon: 15.2663 };
  }

  const coords = quartiersCache.get(quartierName);
  if (coords) {
    return { lat: coords.latitude, lon: coords.longitude };
  }

  // Si le quartier n'est pas dans le cache, fallback
  console.warn(
    ` Quartier "${quartierName}" pas trouvé dans le cache, utilisation fallback`,
  );
  return { lat: -4.2726, lon: 15.2663 };
};

// ==================== SYSTÈME DE VOTE & PAIEMENT ====================

/**
 * Obtenir le trimestre courant (ex: "2026-Q2")
 */
export const getCurrentQuarter = (): string => {
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const quarter = Math.ceil(month / 3);
  return `${year}-Q${quarter}`;
};

/**
 * Obtenir la priorité du tier (pour le tri)
 * @param tier - Type de tier ('none', 'basic', 'advanced', 'elite')
 * @returns Nombre pour le tri (0 = priorité max)
 */
export const getTierPriority = (tier: string | undefined): number => {
  if (tier === "elite") return 0; // Top 3 absolu
  if (tier === "advanced") return 1; // Top 10
  if (tier === "basic") return 2; // Top 3 par distance
  return 3; // Sans premium
};

/**
 * Trier les dépôts par tier et distance
 * @param depots - Array de dépôts avec distance
 * @returns Dépôts triés (premium d'abord, puis distance)
 */
export const sortDepotsByTierAndDistance = (
  depots: DepotWithProducts[],
): DepotWithProducts[] => {
  return [...depots].sort((a, b) => {
    const aTierPriority = getTierPriority(a.tier as any);
    const bTierPriority = getTierPriority(b.tier as any);

    // Vérifier l'expiration du tier
    const aIsTierActive =
      aTierPriority < 3 &&
      a.tier_expiry &&
      new Date(a.tier_expiry) > new Date();
    const bIsTierActive =
      bTierPriority < 3 &&
      b.tier_expiry &&
      new Date(b.tier_expiry) > new Date();

    // Si l'un a un tier actif et l'autre non
    if (aIsTierActive && !bIsTierActive) return -1;
    if (!aIsTierActive && bIsTierActive) return 1;

    // Les deux ont tier actif = trier par tier
    if (aIsTierActive && bIsTierActive) {
      if (aTierPriority !== bTierPriority) {
        return aTierPriority - bTierPriority;
      }
    }

    // Même tier ou pas de premium = trier par distance
    const aDist = a.distance || 0;
    const bDist = b.distance || 0;
    return aDist - bDist;
  });
};

/**
 * Initialiser la structure des votes si elle n'existe pas
 */
export const initializeVotingStructure = async (): Promise<void> => {
  try {
    const quarter = getCurrentQuarter();
    const votesRef = ref(db, `votes/${quarter}/metadata`);
    const snapshot = await get(votesRef);

    if (!snapshot.exists()) {
      // Créer la structure initiale pour ce trimestre
      const startDate = new Date();
      const month = startDate.getMonth();
      const quarterNumber = Math.ceil((month + 1) / 3);

      // Calculer les dates du trimestre
      startDate.setDate(1); // 1er du mois courant
      if (quarterNumber === 1) {
        startDate.setMonth(0, 1); // 1er janvier
      } else if (quarterNumber === 2) {
        startDate.setMonth(3, 1); // 1er avril
      } else if (quarterNumber === 3) {
        startDate.setMonth(6, 1); // 1er juillet
      } else {
        startDate.setMonth(9, 1); // 1er octobre
      }

      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 3);
      endDate.setDate(0); // Dernier jour du trimestre

      await set(votesRef, {
        active: true,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        created_at: new Date().toISOString(),
      });

      console.log(` ✓ Structure votes créée pour ${quarter}`);
    }
  } catch (err) {
    console.error(" Erreur initialisation votes:", err);
  }
};

/**
 * Vérifier si la période de vote est active
 * @returns { active, daysLeft, currentQuarter }
 */
export const isVotingActive = async (): Promise<{
  active: boolean;
  daysLeft: number;
  currentQuarter: string;
}> => {
  try {
    const currentQuarter = getCurrentQuarter();
    const votesRef = ref(db, `votes/${currentQuarter}/metadata`);
    const snapshot = await get(votesRef);

    if (!snapshot.exists()) {
      // Initialiser la structure
      await initializeVotingStructure();
      return { active: true, daysLeft: 90, currentQuarter };
    }

    const { end_date } = snapshot.val();
    const endDate = new Date(end_date);
    const now = new Date();
    const daysLeft = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      active: daysLeft > 0,
      daysLeft: Math.max(0, daysLeft),
      currentQuarter,
    };
  } catch (err) {
    console.error(" Erreur vérification vote actif:", err);
    return { active: false, daysLeft: 0, currentQuarter: getCurrentQuarter() };
  }
};

/**
 * Vérifier si un utilisateur a déjà voté ce trimestre (pour n'importe quel dépôt)
 * @param userId - ID de l'utilisateur
 * @returns true si l'utilisateur a déjà voté
 */
const hasUserVotedThisQuarter = async (userId: string): Promise<boolean> => {
  try {
    const currentQuarter = getCurrentQuarter();
    const votesRef = ref(db, `votes/${currentQuarter}`);
    const snapshot = await get(votesRef);

    if (!snapshot.exists()) {
      return false;
    }

    const votesData = snapshot.val();

    // Chercher l'utilisateur dans la liste voted_by de tous les dépôts
    for (const [key, data] of Object.entries(votesData)) {
      if (key === "metadata") continue; // Ignorer les métadonnées
      const votedBy = (data as any)?.voted_by || [];
      if (votedBy.includes(userId)) {
        return true; // Utilisateur a déjà voté ce trimestre
      }
    }

    return false;
  } catch (err) {
    console.error(" Erreur vérification vote trimestre:", err);
    return false;
  }
};

/**
 * Voter pour un dépôt
 * @param depotId - ID du dépôt
 * @param userId - ID de l'utilisateur
 * @returns Résultat du vote
 */
export const voteForDepot = async (
  depotId: string,
  userId: string,
): Promise<FirebaseResponse<null>> => {
  try {
    const currentQuarter = getCurrentQuarter();

    // ✅ CORRECTION: Vérifier que l'utilisateur n'a pas déjà voté CE TRIMESTRE
    const hasVoted = await hasUserVotedThisQuarter(userId);
    if (hasVoted) {
      return {
        success: false,
        error:
          "Vous avez déjà voté ce trimestre. Un vote par trimestre seulement!",
      };
    }

    const voteRef = ref(db, `votes/${currentQuarter}/${depotId}`);
    const snapshot = await get(voteRef);

    const votedBy = snapshot.val()?.voted_by || [];

    // Ajouter le vote
    if (snapshot.exists()) {
      await set(voteRef, {
        vote_count: (snapshot.val().vote_count || 0) + 1,
        voted_by: [...votedBy, userId],
      });
    } else {
      await set(voteRef, {
        vote_count: 1,
        voted_by: [userId],
      });
    }

    console.log(` Vote enregistré pour dépôt ${depotId}`);
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error(" Erreur vote dépôt:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Obtenir le classement des votes du trimestre
 * @returns Top 10 des dépôts par votes
 */
export const getVotingRankings = async (): Promise<
  Array<{
    depotId: string;
    vote_count: number;
    depot_name?: string;
  }>
> => {
  try {
    const currentQuarter = getCurrentQuarter();
    const votesRef = ref(db, `votes/${currentQuarter}`);
    const snapshot = await get(votesRef);

    if (!snapshot.exists()) {
      return [];
    }

    const votesData = snapshot.val();

    // Trier par vote_count
    const ranked = Object.entries(votesData)
      .filter(([key]) => key !== "metadata")
      .map(([depotId, data]: any) => ({
        depotId,
        vote_count: data.vote_count || 0,
      }))
      .sort((a, b) => b.vote_count - a.vote_count)
      .slice(0, 10);

    return ranked;
  } catch (err) {
    console.error(" Erreur récupération classement:", err);
    return [];
  }
};

/**
 * Mettre à niveau un dépôt en premium
 * @param depotId - ID du dépôt
 * @param tier - Type de tier ('basic', 'advanced', 'elite')
 * @param durationDays - Durée en jours (défaut: 30)
 */
export const upgradeToPremium = async (
  depotId: string,
  tier: "basic" | "advanced" | "elite",
  durationDays: number = 30,
): Promise<FirebaseResponse<null>> => {
  try {
    const premiumUntil = new Date();
    premiumUntil.setDate(premiumUntil.getDate() + durationDays);

    const depotRef = ref(db, `depots/${depotId}`);
    await update(depotRef, {
      tier: tier,
      tier_expiry: premiumUntil.toISOString(),
      payment_pending: true,
    });

    console.log(
      ` Dépôt ${depotId} mis à niveau en ${tier} jusqu'au ${premiumUntil.toISOString()}`,
    );
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error(" Erreur upgrade premium:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

function generateEmailFromPhone(phone: string): string {
  let cleanPhone = phone.replace(/[^\d]/g, "");
  // zi le num ne commnece pas par +242 alors l ajouter auto.....
  if (!cleanPhone.startsWith("242")) {
    cleanPhone = "242" + cleanPhone;
  }

  return `vendor${cleanPhone}@maman-power.app`;
}

export const registerUser = async (
  name: string,
  phone: string,
  password: string,
): Promise<FirebaseResponse<User>> => {
  try {
    if (!name || !phone || !password) {
      return {
        success: false,
        error: "Nom, téléphone et mot de passe sont requis",
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        error: "Le mot de passe doit faire au moins 6 caractères",
      };
    }

    const userEmail = generateEmailFromPhone(phone);
    console.log(" Inscription pour", phone, "→", userEmail);

    const { user: authUser } = await createUserWithEmailAndPassword(
      auth,
      userEmail,
      password,
    );

    console.log(" Compte Auth créé. UID:", authUser.uid);

    const userRef = ref(db, `users/${authUser.uid}`);
    await set(userRef, {
      id: authUser.uid,
      name: name,
      email: userEmail,
      phone: phone,
      role: "vendor",
      is_active: true,
      subscription_status: "free",
      priority_level: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    console.log(" Profil utilisateur créé dans Realtime DB");

    return {
      success: true,
      data: {
        id: authUser.uid,
        email: userEmail,
        name: name,
        phone: phone,
        role: "vendor",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error(" Erreur d'inscription:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

export const loginByPhone = async (
  phone: string,
  password: string,
): Promise<FirebaseResponse<User>> => {
  try {
    console.log(" Tentative de connexion pour:", phone);

    const userEmail = generateEmailFromPhone(phone);

    const { user: authUser } = await signInWithEmailAndPassword(
      auth,
      userEmail,
      password,
    );

    console.log(" Authentification réussie pour:", phone);

    const userRef = ref(db, `users/${authUser.uid}`);
    const userSnap = await get(userRef);

    if (!userSnap.exists()) {
      console.error(" Profil non trouvé:", authUser.uid);
      return { success: false, error: "Profil utilisateur non trouvé" };
    }

    const userData = userSnap.val();
    console.log(" Profil chargé:", userData.name);

    return {
      success: true,
      data: userData,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error(" Erreur de connexion:", errorMsg);
    return { success: false, error: "Numéro ou mot de passe incorrect" };
  }
};

export const logoutUser = async (): Promise<FirebaseResponse<null>> => {
  try {
    await signOut(auth);
    console.log(" Déconnexion réussie");
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error(" Erreur déconnexion:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

export const getCurrentUser = async (
  uid: string,
): Promise<FirebaseResponse<User>> => {
  try {
    const userRef = ref(db, `users/${uid}`);
    const userSnap = await get(userRef);

    if (userSnap.exists()) {
      return { success: true, data: userSnap.val() };
    }
    return { success: false, error: "Utilisateur non trouvé" };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error(" Erreur récupération utilisateur:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

// calculs des distances via GPS fake pas de maping pour l'instant ;
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// obtenir les depot avec leur disrrtance

export const getDepotsWithDistance = async (
  vendorLat: number,
  vendorLon: number,
): Promise<FirebaseResponse<DepotWithProducts[]>> => {
  try {
    const depotsRef = ref(db, "depots");
    const snapshot = await get(depotsRef);

    if (!snapshot.exists()) {
      return { success: true, data: [] };
    }

    const depotsData = snapshot.val();
    const depots = Object.keys(depotsData)
      .filter((key) => depotsData[key].is_active === true)
      .map((key) => {
        const depot = depotsData[key];
        const coords = getQuartierCoordinates(depot.quartier);
        const distance = calculateDistance(
          vendorLat,
          vendorLon,
          coords.lat,
          coords.lon,
        );
        return {
          id: key,
          ...depot,
          distance: parseFloat(distance.toFixed(2)),
        };
      })
      .sort((a, b) => a.distance - b.distance);

    return { success: true, data: depots };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error(" Erreur récupération dépôts avec distance:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Filtrer dépôts par tier et catégorie pour afficher les visibilités correctes
 * BASIC: TOP 15 par catégorie
 * ADVANCED: TOP 10 par catégorie
 * ELITE: TOP 3 par catégorie
 */
export const getDepotsByTierAndCategory = async (
  vendorLat: number,
  vendorLon: number,
  category?: string,
): Promise<FirebaseResponse<DepotWithProducts[]>> => {
  try {
    const response = await getDepotsWithDistance(vendorLat, vendorLon);

    if (!response.success || !response.data) {
      return response;
    }

    let depots = response.data;

    // Filtrer par active et subscription
    depots = depots.filter((depot) => {
      const isActive = depot.is_active === true;
      const hasActiveSubscription = depot.subscription_status === "active";
      const subscriptionNotExpired =
        !depot.subscription_expiry ||
        new Date(depot.subscription_expiry) > new Date();

      return isActive && hasActiveSubscription && subscriptionNotExpired;
    });

    // Si catégorie spécifiée, appliquer filtrage par tier
    if (category) {
      const now = new Date();

      // Séparer par tier
      const eliteDepots = depots.filter(
        (d) =>
          d.tier === "elite" &&
          (!d.tier_expiry || new Date(d.tier_expiry) > now),
      );
      const advancedDepots = depots.filter(
        (d) =>
          d.tier === "advanced" &&
          (!d.tier_expiry || new Date(d.tier_expiry) > now),
      );
      const basicDepots = depots.filter(
        (d) =>
          d.tier === "basic" &&
          (!d.tier_expiry || new Date(d.tier_expiry) > now),
      );

      // Retourner les limites par tier
      const result = [
        ...eliteDepots.slice(0, 3), // TOP 3 ELITE
        ...advancedDepots.slice(0, 10), // TOP 10 ADVANCED
        ...basicDepots.slice(0, 15), // TOP 15 BASIC
      ];

      // Supprimer les doublons
      const seen = new Set<string>();
      return {
        success: true,
        data: result.filter((d) => {
          if (seen.has(d.id)) return false;
          seen.add(d.id);
          return true;
        }),
      };
    }

    return { success: true, data: depots };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error(" Erreur filtrage dépôts par tier:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

export const getDepots = async (): Promise<FirebaseResponse<Depot[]>> => {
  try {
    const depotsRef = ref(db, "depots");
    const snapshot = await get(depotsRef);

    if (!snapshot.exists()) {
      return { success: true, data: [] };
    }

    const depotsData = snapshot.val();
    const depots = Object.keys(depotsData)
      .filter((key) => depotsData[key].is_active === true)
      .map((key) => ({ id: key, ...depotsData[key] }));

    return { success: true, data: depots };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error(" Erreur récupération dépôts:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

export const getCategories = async (): Promise<
  FirebaseResponse<Category[]>
> => {
  try {
    const categoriesRef = ref(db, "categories");
    const snapshot = await get(categoriesRef);

    if (!snapshot.exists()) {
      return { success: true, data: [] };
    }

    const categoriesData = snapshot.val();
    const categories = Object.keys(categoriesData)
      .filter((key) => categoriesData[key].is_active === true)
      .map((key) => ({ id: key, ...categoriesData[key] }));

    return { success: true, data: categories };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error(" Erreur récupération catégories:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

export const getDepotsWithProductsByCategory = async (
  vendorLat: number,
  vendorLon: number,
  categoryName: string,
): Promise<FirebaseResponse<DepotWithProducts[]>> => {
  try {
    console.log(`📍 Recherche dépôts avec catégorie: ${categoryName}`);

    const depotsRef = ref(db, "depots");
    const depotsSnapshot = await get(depotsRef);

    if (!depotsSnapshot.exists()) {
      return { success: true, data: [] };
    }

    const depotsData = depotsSnapshot.val();
    const allDepots = Object.keys(depotsData)
      .filter((key) => depotsData[key].is_active === true)
      .map((key) => ({ id: key, ...depotsData[key] }));

    console.log(` Trouvé ${allDepots.length} depots actifs`);

    //  Pour chaque depot, chercher les produits EN PARALLELE (plus rapide!)
    const depotsWithProductsPromises = allDepots.map(async (depot) => {
      try {
        let products = [];

        // Strategie 1: Chercher les produits dans depots/{depotId}/products (structure depot-dashboard)
        const depotsProductsRef = ref(db, `depots/${depot.id}/products`);
        const depotsProductsSnapshot = await get(depotsProductsRef);

        if (depotsProductsSnapshot.exists()) {
          const productsData = depotsProductsSnapshot.val();
          products = Object.keys(productsData)
            .filter((key) => productsData[key].is_active === true)
            .filter((key) => productsData[key].category === categoryName)
            .map((key) => ({
              id: key,
              ...productsData[key],
            }));

          console.log(
            `   Dépôt ${depot.name}: ${products.length} produits (from depots/{id}/products)`,
          );
        } else {
          // Strategie 2: Si pas de produits dans le depot, chercher dans les produits centralisés
          const productsRef = ref(db, "products");
          const productsSnapshot = await get(productsRef);

          if (productsSnapshot.exists()) {
            const allProductsData = productsSnapshot.val();
            products = Object.keys(allProductsData)
              .filter((key) => allProductsData[key].is_active === true)
              .filter((key) => allProductsData[key].category === categoryName)
              .map((key) => ({
                id: key,
                ...allProductsData[key],
              }));

            console.log(
              `   Dépôt ${depot.name}: ${products.length} produits (from root products/)`,
            );
          }
        }

        // Si ce depot a des produits dans la catégorie, l'inclure
        if (products.length > 0) {
          const quartierName = depot.quartier || depot.location;
          const coords = getQuartierCoordinates(quartierName);
          const distance = calculateDistance(
            vendorLat,
            vendorLon,
            coords.lat,
            coords.lon,
          );

          console.log(
            `   Distance: ${distance.toFixed(2)} km pour ${depot.name}`,
          );

          return {
            ...depot,
            distance: parseFloat(distance.toFixed(2)),
            products: products,
          };
        }

        return null;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
        console.error(
          ` Erreur récupération produits pour dépôt ${depot.id}:`,
          errorMsg,
        );
        return null;
      }
    });

    // Attendre que TOUTES les requetes en parallele se terminent
    const results = await Promise.all(depotsWithProductsPromises);
    const depotsWithProducts = results.filter((result) => result !== null);
    depotsWithProducts.sort((a, b) => a.distance - b.distance);

    console.log(
      ` Trouvé ${depotsWithProducts.length} dépôts avec catégorie "${categoryName}"`,
    );

    return { success: true, data: depotsWithProducts };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error(
      " Erreur récupération dépôts avec produits par catégorie:",
      errorMsg,
    );
    return { success: false, error: errorMsg };
  }
};

// Optimiser : Charger TOUS les depôts + produits UNE SEULE FOIS au démarrage
export const getAllDepotsWithAllProducts = async (
  vendorLat: number,
  vendorLon: number,
): Promise<FirebaseResponse<DepotWithProducts[]>> => {
  try {
    console.log(" Chargement COMPLET des dépôts + produits (optimisé)...");

    const depotsRef = ref(db, "depots");
    const depotsSnapshot = await get(depotsRef);

    if (!depotsSnapshot.exists()) {
      return { success: true, data: [] };
    }

    const depotsData = depotsSnapshot.val();
    const allDepots = Object.keys(depotsData)
      .filter((key) => depotsData[key].is_active === true)
      .map((key) => ({ id: key, ...depotsData[key] }));

    console.log(` Trouvé ${allDepots.length} dépôts actifs`);

    // Charger les produits de TOUS les depôts EN PARALLELE
    const depotsWithProductsPromises = allDepots.map(async (depot) => {
      try {
        let products = [];

        const depotsProductsRef = ref(db, `depots/${depot.id}/products`);
        const depotsProductsSnapshot = await get(depotsProductsRef);

        if (depotsProductsSnapshot.exists()) {
          const productsData = depotsProductsSnapshot.val();
          products = Object.keys(productsData)
            .filter((key) => productsData[key].is_active === true)
            .map((key) => ({
              id: key,
              ...productsData[key],
            }));
        }

        // Calculer la distance en utilisant le quartier du dépôt
        const quartierName = depot.quartier || depot.location;
        const coords = getQuartierCoordinates(quartierName);
        const distance = calculateDistance(
          vendorLat,
          vendorLon,
          coords.lat,
          coords.lon,
        );

        return {
          ...depot,
          distance: parseFloat(distance.toFixed(2)),
          products: products,
        };
      } catch (err: unknown) {
        console.error(
          ` Erreur récupération produits pour depot ${depot.id}:`,
          err instanceof Error ? err.message : String(err),
        );
        return null;
      }
    });

    const results = await Promise.all(depotsWithProductsPromises);
    const depotsWithProducts = results.filter((result) => result !== null);
    depotsWithProducts.sort((a, b) => a.distance - b.distance);

    console.log(` Chargé ${depotsWithProducts.length} depots avec produits`);

    return { success: true, data: depotsWithProducts };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error(" Erreur récupération complète depots:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Écouter les catégories en temps réel
 * @param {function} onUpdate - Fonction appelée quand les catégories changent
 * @returns {function} Fonction pour arrêter l'écoute
 */
export const listenToCategories = (
  onUpdate: (categories: Category[]) => void,
): (() => void) => {
  try {
    console.log("🎧 Activation listener catégories...");
    const categoriesRef = ref(db, "categories");

    const unsubscribe = onValue(categoriesRef, (snapshot) => {
      if (snapshot.exists()) {
        const categoriesData = snapshot.val();
        const categories = Object.keys(categoriesData)
          .filter(
            (key) =>
              categoriesData[key].is_active === undefined ||
              categoriesData[key].is_active === true,
          )
          .map((key) => ({ id: key, ...categoriesData[key] }));

        onUpdate(categories);
      } else {
        onUpdate([]);
      }
    });

    return unsubscribe;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error(" Erreur listener catégories:", errorMsg);
    return () => {};
  }
};

/**
 * Écouter tous les dépôts + produits en temps réel
 * @param {number} vendorLat - Latitude vendeur
 * @param {number} vendorLon - Longitude vendeur
 * @param {function} onUpdate - Fonction appelée quand données changent
 * @returns {function} Fonction pour arrêter l'écoute (IMPORTANT: appeler au unmount!)
 */
export const listenToDepotsAndProducts = (
  vendorLat: number,
  vendorLon: number,
  onUpdate: (depots: DepotWithProducts[]) => void,
): (() => void) => {
  try {
    console.log("🎧 Activation listener dépôts + produits...");
    const depotsRef = ref(db, "depots");

    let debounceTimer: number | null = null;
    let lastUpdate = 0;
    let lastDepotSnapshot: any = null; // CACHE: mémoriser le snapshot précédent
    const productCache = new Map<string, any>(); // CACHE: mémoriser les produits par dépôt
    const DEBOUNCE_MS = 1000; // 1 seconde minimum entre les mises à jour

    const processDepotsData = async (depotsData: any) => {
      const allDepots = Object.keys(depotsData)
        .filter(
          (key) =>
            depotsData[key].is_active === true &&
            (depotsData[key].subscription_status === "active" ||
              !depotsData[key].subscription_status),
        )
        .map((key) => ({ id: key, ...depotsData[key] }));

      // Charger les produits SEULEMENT pour les dépôts qui ont changé
      const depotsWithProductsPromises = allDepots.map(async (depot) => {
        try {
          let products = [];

          // OPTIMISATION: Vérifier si ce dépôt a réellement changé
          const depotChanged =
            !lastDepotSnapshot ||
            JSON.stringify(lastDepotSnapshot[depot.id]) !==
              JSON.stringify(depotsData[depot.id]);

          // Charger les produits SEULEMENT s'il y a un changement
          if (depotChanged || !productCache.has(depot.id)) {
            const depotsProductsRef = ref(db, `depots/${depot.id}/products`);
            const depotsProductsSnapshot = await get(depotsProductsRef);

            if (depotsProductsSnapshot.exists()) {
              const productsData = depotsProductsSnapshot.val();
              products = Object.keys(productsData)
                .filter((key) => productsData[key].is_active === true)
                .map((key) => ({
                  id: key,
                  ...productsData[key],
                }));
            }
            productCache.set(depot.id, products);
          } else {
            // Utiliser le cache des produits
            products = productCache.get(depot.id) || [];
          }

          const quartierName = depot.quartier || depot.location;
          const coords = getQuartierCoordinates(quartierName);
          const distance = calculateDistance(
            vendorLat,
            vendorLon,
            coords.lat,
            coords.lon,
          );

          return {
            ...depot,
            distance: parseFloat(distance.toFixed(2)),
            products: products,
          };
        } catch (err: unknown) {
          console.error(
            ` Erreur récupération produits depot ${depot.id}:`,
            err instanceof Error ? err.message : String(err),
          );
          return null;
        }
      });

      const results = await Promise.all(depotsWithProductsPromises);
      const depotsWithProducts = results
        .filter((result) => result !== null)
        .sort((a, b) => a.distance - b.distance);

      lastDepotSnapshot = depotsData;
      lastUpdate = Date.now();
      onUpdate(depotsWithProducts);
    };

    const unsubscribe = onValue(depotsRef, async (snapshot) => {
      if (snapshot.exists()) {
        const depotsData = snapshot.val();

        // DEBOUNCE: Si mise à jour trop proche, attendre avant de traiter
        if (debounceTimer) clearTimeout(debounceTimer);

        const timeSinceLastUpdate = Date.now() - lastUpdate;
        if (timeSinceLastUpdate < DEBOUNCE_MS) {
          // Attendre avant de traiter
          debounceTimer = setTimeout(() => {
            processDepotsData(depotsData);
            debounceTimer = null;
          }, DEBOUNCE_MS - timeSinceLastUpdate);
        } else {
          // Traiter immédiatement
          await processDepotsData(depotsData);
        }
      } else {
        lastUpdate = Date.now();
        onUpdate([]);
      }
    });

    // Cleanup du debounce timer au unmount
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      unsubscribe();
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error(" Erreur listener dépôts:", errorMsg);
    return () => {};
  }
};

const CACHE_KEY = "maman-power-cache";

/**
 * Sauvegarder les donnees dans le  localStorage
 * @param {Array} categories - Categories
 * @param {Array} depots - Depôts avec produits
 */
export const saveToCache = (categories: Category[], depots: Depot[]): void => {
  try {
    const cacheData = {
      categories: categories || [],
      depots: depots || [],
      lastSync: new Date().toISOString(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    console.log(
      `  Cache sauvegardé: ${categories?.length || 0} catégories, ${depots?.length || 0} dépôts`,
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error(" Erreur sauvegarde cache:", errorMsg);
  }
};

/**
 * Charger les données du cache localStorage
 * @returns {object} { categories, depots, lastSync } ou null
 */
export const loadFromCache = (): Record<string, any> | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) {
      console.log(" Aucun cache trouvé");
      return null;
    }

    const cacheData = JSON.parse(cached);
    console.log(
      ` Cache chargé: ${cacheData.categories?.length || 0} catégories, ${cacheData.depots?.length || 0} dépôts`,
    );
    console.log(`   Dernière sync: ${cacheData.lastSync}`);
    return cacheData;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error(" Erreur lecture cache:", errorMsg);
    return null;
  }
};

/**
 * Vider complètement le cache (pour logout par exemple)
 */
export const clearCache = (): void => {
  try {
    localStorage.removeItem(CACHE_KEY);
    console.log(" Cache supprimé");
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error(" Erreur suppression cache:", errorMsg);
  }
};

/**
 * Charger les dépôts avec produits par pagination
 * @param {number} vendorLat - Latitude vendeur
 * @param {number} vendorLon - Longitude vendeur
 * @param {number} pageSize - Nombre de dépôts par page (défaut: 20)
 * @param {number} pageNumber - Numéro de page (commence à 0)
 * @returns {Promise} { success, data: { depots, totalCount, hasMore }, error }
 */
export const getDepotsWithProductsPaginated = async (
  vendorLat: number,
  vendorLon: number,
  pageSize: number = 20,
  pageNumber: number = 0,
): Promise<PaginationResponse<DepotWithProducts>> => {
  try {
    console.log(
      ` Chargement dépôts pagés - Page ${pageNumber + 1} (${pageSize}/page)...`,
    );

    const depotsRef = ref(db, "depots");
    const depotsSnapshot = await get(depotsRef);

    if (!depotsSnapshot.exists()) {
      return {
        success: true,
        data: [],
      };
    }

    const depotsData = depotsSnapshot.val();
    const allDepots = Object.keys(depotsData)
      .filter(
        (key) =>
          depotsData[key].is_active === true &&
          (depotsData[key].subscription_status === "active" ||
            !depotsData[key].subscription_status), // ← Accepter aussi les dépôts sans ce champ (backward compatibility)
      )
      .map((key) => ({ id: key, ...depotsData[key] }));

    const totalCount = allDepots.length;
    console.log(` Total: ${totalCount} dépôts actifs`);

    // Calculer l'index de départ et fin
    const startIndex = pageNumber * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalCount);
    const hasMore = endIndex < totalCount;

    // Extraire la page actuelle
    const pageDepots = allDepots.slice(startIndex, endIndex);
    console.log(
      ` Page: ${pageDepots.length} dépôts (${startIndex + 1} à ${endIndex}/${totalCount})`,
    );

    // Charger les produits EN PARALLELE pour cette page
    const depotsWithProductsPromises = pageDepots.map(async (depot) => {
      try {
        let products = [];
        const depotsProductsRef = ref(db, `depots/${depot.id}/products`);
        const depotsProductsSnapshot = await get(depotsProductsRef);

        if (depotsProductsSnapshot.exists()) {
          const productsData = depotsProductsSnapshot.val();
          products = Object.keys(productsData)
            .filter((key) => productsData[key].is_active === true)
            .map((key) => ({
              id: key,
              ...productsData[key],
            }));
        }

        const quartierName = depot.quartier || depot.location;
        const coords = getQuartierCoordinates(quartierName);
        const distance = calculateDistance(
          vendorLat,
          vendorLon,
          coords.lat,
          coords.lon,
        );

        return {
          ...depot,
          distance: parseFloat(distance.toFixed(2)),
          products: products,
        };
      } catch (err: unknown) {
        console.error(
          `-{depot.id}:`,
          err instanceof Error ? err.message : String(err),
        );
        return null;
      }
    });

    const results = await Promise.all(depotsWithProductsPromises);
    const depotsWithProducts = results
      .filter((result) => result !== null)
      .sort((a, b) => a.distance - b.distance);

    console.log(
      `  ${depotsWithProducts.length} dépôts chargés (has more: ${hasMore})`,
    );

    return {
      success: true,
      data: depotsWithProducts,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error(" Erreur pagination dépôts:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Initialiser les catégories racine si elles n'existent pas
 */
export const ensureCategoriesExist = async (): Promise<void> => {
  try {
    const categoriesRef = ref(db, "categories");
    const categoriesSnapshot = await get(categoriesRef);

    if (categoriesSnapshot.exists()) {
      console.log("✅ Catégories existent déjà");
      return;
    }

    console.log("📝 Création des catégories racine...");

    const defaultCategories = [
      {
        name: "Poisson & Viande",
        emoji: "🧊",
        description: "Poissons et viande frais",
      },
      {
        name: "Fruit et Legume",
        emoji: "🍅",
        description: "Fruits, légumes et produits frais",
      },
      {
        name: "Charbon",
        emoji: "🪵",
        description: "Charbon de bois et combustibles",
      },
      {
        name: "Boissons",
        emoji: "🍾",
        description: "Boissons diverses",
      },
      {
        name: "Epiceries/Vivre secs",
        emoji: "🛒",
        description: "Produits d'épicerie et aliments secs",
      },
    ];

    for (const category of defaultCategories) {
      const catRef = push(categoriesRef);
      await set(catRef, {
        name: category.name,
        emoji: category.emoji,
        description: category.description,
        is_active: true,
        created_at: new Date().toISOString(),
      });
      console.log(`  ✓ Créée: ${category.name}`);
    }

    console.log("✅ Catégories initialisées");
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("❌ Erreur initialisation catégories:", errorMsg);
  }
};
