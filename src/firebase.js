import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getDatabase, ref, set, get, push, onValue } from "firebase/database";

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

function generateEmailFromPhone(phone) {
  // Remove all non-numeric characters
  let cleanPhone = phone.replace(/[^\d]/g, "");

  // If doesn't start with 242, prepend it
  if (!cleanPhone.startsWith("242")) {
    cleanPhone = "242" + cleanPhone;
  }

  return `vendor${cleanPhone}@maman-power.app`;
}

export const registerUser = async (name, email, phone, password) => {
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
      },
    };
  } catch (error) {
    console.error(" Erreur d'inscription:", error.message);
    return { success: false, error: error.message };
  }
};

export const loginByPhone = async (phone, password) => {
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
      auth: authUser,
    };
  } catch (error) {
    console.error(" Erreur de connexion:", error.message);
    return { success: false, error: "Numéro ou mot de passe incorrect" };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log(" Déconnexion réussie");
    return { success: true };
  } catch (error) {
    console.error(" Erreur déconnexion:", error.message);
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = async (uid) => {
  try {
    const userRef = ref(db, `users/${uid}`);
    const userSnap = await get(userRef);

    if (userSnap.exists()) {
      return { success: true, data: userSnap.val() };
    }
    return { success: false, error: "Utilisateur non trouvé" };
  } catch (error) {
    console.error(" Erreur récupération utilisateur:", error.message);
    return { success: false, error: error.message };
  }
};

export const initializeTestData = async () => {
  try {
    console.log(" Initialisation des données de test...");

    //  Create categories
    const categories = [
      {
        name: "Poisson",
        emoji: "🐟",
        description: "Produits de la mer et poissons frais",
      },
      {
        name: "Charbon",
        emoji: "⚫",
        description: "Différents types de charbon pour cuisine",
      },
      {
        name: "Boissons",
        emoji: "🍺",
        description: "Boissons et liquides divers",
      },
      {
        name: "Vivriers",
        emoji: "🌾",
        description: "Produits agricoles et céréales",
      },
      { name: "Fruits", emoji: "🍌", description: "Fruits frais et tropicaux" },
    ];

    const categoryRefs = {};
    for (const cat of categories) {
      const newCatRef = push(ref(db, "categories"));
      await set(newCatRef, {
        name: cat.name,
        emoji: cat.emoji,
        description: cat.description,
        is_active: true,
        created_at: new Date().toISOString(),
      });
      categoryRefs[cat.name] = newCatRef.key;
    }
    console.log(" Catégories créées");

    //  Create products
    const products = [
      { name: "Carpe", category: "Poisson", base_price: 2500, unit: "kg" },
      { name: "Capitaine", category: "Poisson", base_price: 3500, unit: "kg" },
      {
        name: "Charbon Bois",
        category: "Charbon",
        base_price: 1500,
        unit: "sac",
      },
      {
        name: "Charbon Coco",
        category: "Charbon",
        base_price: 2000,
        unit: "sac",
      },
      {
        name: "Primus",
        category: "Boissons",
        base_price: 800,
        unit: "bouteille",
      },
      { name: "Riz", category: "Vivriers", base_price: 2500, unit: "sac" },
      { name: "Bananes", category: "Fruits", base_price: 200, unit: "régime" },
    ];

    for (const prod of products) {
      const newProdRef = push(ref(db, "products"));
      await set(newProdRef, {
        name: prod.name,
        category: prod.category, // Ajouter le nom de la catégorie pour filtrage
        category_id: categoryRefs[prod.category],
        base_price: prod.base_price,
        unit: prod.unit,
        stock_quantity: 10,
        price: prod.base_price,
        is_active: true,
        created_at: new Date().toISOString(),
      });
    }
    console.log("Produits créés");

    //  Create quartiers (9 quartiers de Brazzaville)
    const quartiers = [
      {
        name: "Bakongo",
        latitude: -4.2636,
        longitude: 15.2429,
        description: "1er arrondissement - Quartier historique au sud",
      },
      {
        name: "Poto-Poto",
        latitude: -4.2726,
        longitude: 15.2663,
        description: "2ème arrondissement - Centre ville",
      },
      {
        name: "Moungali",
        latitude: -4.2514,
        longitude: 15.2721,
        description: "3ème arrondissement - Quartier résidentiel nord",
      },
      {
        name: "Ouenzé",
        latitude: -4.2857,
        longitude: 15.2514,
        description: "4ème arrondissement - Quartier populaire",
      },
      {
        name: "Talangaï",
        latitude: -4.2429,
        longitude: 15.2857,
        description: "5ème arrondissement - Grand quartier nord",
      },
      {
        name: "Mfilou",
        latitude: -4.26,
        longitude: 15.3,
        description: "6ème arrondissement - Zone périphérique nord-est",
      },
      {
        name: "Makélékélé",
        latitude: -4.29,
        longitude: 15.24,
        description: "7ème arrondissement - Quartier sud-ouest",
      },
      {
        name: "Djiri",
        latitude: -4.3,
        longitude: 15.2,
        description: "8ème arrondissement - Zone administrative",
      },
      {
        name: "Madibou",
        latitude: -4.32,
        longitude: 15.18,
        description: "9ème arrondissement - Zone rurale sud",
      },
    ];

    for (const q of quartiers) {
      const newQRef = push(ref(db, "quartiers"));
      await set(newQRef, {
        name: q.name,
        latitude: q.latitude,
        longitude: q.longitude,
        description: q.description,
        is_active: true,
        created_at: new Date().toISOString(),
      });
    }
    console.log(" Quartiers créés");

    //  Create test depots with managers and details
    const depotsData = [
      {
        name: "Dépôt Poto-Poto Central",
        location: "Poto-Poto",
        address: "Rue du Commerce, Centre-ville",
        phone_direct: "+242061234567",
        phone_whatsapp: "+242061234568",
        latitude: -4.2726,
        longitude: 15.2663,
      },
      {
        name: "Dépôt Bakongo Sud",
        location: "Bakongo",
        address: "Avenue de l'Indépendance",
        phone_direct: "+242062345678",
        phone_whatsapp: "+242062345679",
        latitude: -4.2636,
        longitude: 15.2429,
      },
      {
        name: "Dépôt Moungali Nord",
        location: "Moungali",
        address: "Quartier résidentiel nord",
        phone_direct: "+242063456789",
        phone_whatsapp: "+242063456780",
        latitude: -4.2514,
        longitude: 15.2721,
      },
      {
        name: "Dépôt Ouenzé Populaire",
        location: "Ouenzé",
        address: "Rue principale Ouenzé",
        phone_direct: "+242064567890",
        phone_whatsapp: "+242064567891",
        latitude: -4.2857,
        longitude: 15.2514,
      },
      {
        name: "Dépôt Talangaï Grand Nord",
        location: "Talangaï",
        address: "Zone nord Brazzaville",
        phone_direct: "+242065678901",
        phone_whatsapp: "+242065678902",
        latitude: -4.2429,
        longitude: 15.2857,
      },
    ];

    for (const depot of depotsData) {
      const newDepotRef = push(ref(db, "depots"));
      await set(newDepotRef, {
        name: depot.name,
        location: depot.location,
        address: depot.address,
        phone_direct: depot.phone_direct,
        phone_whatsapp: depot.phone_whatsapp,
        latitude: depot.latitude,
        longitude: depot.longitude,
        is_active: true,
        created_at: new Date().toISOString(),
      });
    }
    console.log(" Dépôts créés");

    return { success: true };
  } catch (error) {
    console.error(" Erreur initialisation données:", error.message);
    return { success: false, error: error.message };
  }
};

// =====================================
// calculs des distances via GPS fake;
// =====================================
function calculateDistance(lat1, lon1, lat2, lon2) {
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

// =====================================
// obtenir les depot avec leur disrrtance
// =====================================
export const getDepotsWithDistance = async (vendorLat, vendorLon) => {
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
        const distance = calculateDistance(
          vendorLat,
          vendorLon,
          depot.latitude,
          depot.longitude,
        );
        return {
          id: key,
          ...depot,
          distance: parseFloat(distance.toFixed(2)),
        };
      })
      .sort((a, b) => a.distance - b.distance);

    return { success: true, data: depots };
  } catch (error) {
    console.error(" Erreur récupération dépôts avec distance:", error.message);
    return { success: false, error: error.message };
  }
};

export const getDepots = async () => {
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
  } catch (error) {
    console.error(" Erreur récupération dépôts:", error.message);
    return { success: false, error: error.message };
  }
};

export const getCategories = async () => {
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
  } catch (error) {
    console.error(" Erreur récupération catégories:", error.message);
    return { success: false, error: error.message };
  }
};

export const getDepotsWithProductsByCategory = async (
  vendorLat,
  vendorLon,
  categoryName,
) => {
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
          let lat = parseFloat(depot.latitude);
          let lon = parseFloat(depot.longitude);

          if (isNaN(lat) || isNaN(lon)) {
            console.warn(
              ` Coordonnées invalides pour ${depot.name}, utilisation des coordonnées par défaut (Poto-Poto)`,
            );

            if (depot.location === "Bakongo") {
              lat = -4.2636;
              lon = 15.2429;
            } else if (depot.location === "Moungali") {
              lat = -4.2514;
              lon = 15.2721;
            } else if (depot.location === "Ouenzé") {
              lat = -4.2857;
              lon = 15.2514;
            } else if (depot.location === "Talangaï") {
              lat = -4.2429;
              lon = 15.2857;
            } else if (depot.location === "Mfilou") {
              lat = -4.26;
              lon = 15.3;
            } else if (depot.location === "Makélékélé") {
              lat = -4.29;
              lon = 15.24;
            } else if (depot.location === "Djiri") {
              lat = -4.3;
              lon = 15.2;
            } else if (depot.location === "Madibou") {
              lat = -4.32;
              lon = 15.18;
            } else {
              // Poto-Poto par défaut
              lat = -4.2726;
              lon = 15.2663;
            }
          }

          const distance = calculateDistance(vendorLat, vendorLon, lat, lon);

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
      } catch (error) {
        console.error(
          ` Erreur récupération produits pour dépôt ${depot.id}:`,
          error.message,
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
  } catch (error) {
    console.error(
      " Erreur récupération dépôts avec produits par catégorie:",
      error.message,
    );
    return { success: false, error: error.message };
  }
};

// ⚡ OPTIMISÉ: Charger TOUS les dépôts + produits UNE SEULE FOIS au démarrage
export const getAllDepotsWithAllProducts = async (vendorLat, vendorLon) => {
  try {
    console.log("⚡ Chargement COMPLET des dépôts + produits (optimisé)...");

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

    // Charger les produits de TOUS les dépôts EN PARALLELE
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

        // Calculer la distance
        let lat = parseFloat(depot.latitude);
        let lon = parseFloat(depot.longitude);

        if (isNaN(lat) || isNaN(lon)) {
          lat = -4.2726;
          lon = 15.2663;
        }

        const distance = calculateDistance(vendorLat, vendorLon, lat, lon);

        return {
          ...depot,
          distance: parseFloat(distance.toFixed(2)),
          products: products,
        };
      } catch (error) {
        console.error(
          ` Erreur récupération produits pour depot ${depot.id}:`,
          error.message,
        );
        return null;
      }
    });

    const results = await Promise.all(depotsWithProductsPromises);
    const depotsWithProducts = results.filter((result) => result !== null);
    depotsWithProducts.sort((a, b) => a.distance - b.distance);

    console.log(`⚡ Chargé ${depotsWithProducts.length} depots avec produits`);

    return { success: true, data: depotsWithProducts };
  } catch (error) {
    console.error(" Erreur récupération complète depots:", error.message);
    return { success: false, error: error.message };
  }
};

// =====================================
// 🔄 REALTIME LISTENERS (Zéro polling!)
// =====================================

/**
 * Écouter les catégories en temps réel
 * @param {function} onUpdate - Fonction appelée quand les catégories changent
 * @returns {function} Fonction pour arrêter l'écoute
 */
export const listenToCategories = (onUpdate) => {
  try {
    console.log("🎧 Activation listener catégories...");
    const categoriesRef = ref(db, "categories");

    const unsubscribe = onValue(categoriesRef, (snapshot) => {
      if (snapshot.exists()) {
        const categoriesData = snapshot.val();
        const categories = Object.keys(categoriesData)
          .filter((key) => categoriesData[key].is_active === true)
          .map((key) => ({ id: key, ...categoriesData[key] }));

        console.log(` 📦 ${categories.length} catégories reçues (realtime)`);
        onUpdate(categories);
      } else {
        console.log(" Aucune catégorie trouvée");
        onUpdate([]);
      }
    });

    return unsubscribe;
  } catch (error) {
    console.error(" Erreur listener catégories:", error.message);
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
export const listenToDepotsAndProducts = (vendorLat, vendorLon, onUpdate) => {
  try {
    console.log("🎧 Activation listener dépôts + produits...");
    const depotsRef = ref(db, "depots");

    const unsubscribe = onValue(depotsRef, async (snapshot) => {
      if (snapshot.exists()) {
        const depotsData = snapshot.val();
        const allDepots = Object.keys(depotsData)
          .filter(
            (key) =>
              depotsData[key].is_active === true &&
              (depotsData[key].subscription_status === "active" ||
                !depotsData[key].subscription_status), // ← Accepter aussi les dépôts sans ce champ (backward compatibility)
          )
          .map((key) => ({ id: key, ...depotsData[key] }));

        console.log(
          ` 🏪 ${allDepots.length} dépôts reçus (realtime) - chargement produits...`,
        );

        // Charger les produits EN PARALLELE
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

            let lat = parseFloat(depot.latitude);
            let lon = parseFloat(depot.longitude);

            if (isNaN(lat) || isNaN(lon)) {
              lat = -4.2726;
              lon = 15.2663;
            }

            const distance = calculateDistance(vendorLat, vendorLon, lat, lon);

            return {
              ...depot,
              distance: parseFloat(distance.toFixed(2)),
              products: products,
            };
          } catch (error) {
            console.error(` Erreur produits depot ${depot.id}:`, error.message);
            return null;
          }
        });

        const results = await Promise.all(depotsWithProductsPromises);
        const depotsWithProducts = results
          .filter((result) => result !== null)
          .sort((a, b) => a.distance - b.distance);

        console.log(
          ` ✅ ${depotsWithProducts.length} dépôts avec produits (realtime)`,
        );
        onUpdate(depotsWithProducts);
      } else {
        console.log(" Aucun dépôt trouvé");
        onUpdate([]);
      }
    });

    return unsubscribe;
  } catch (error) {
    console.error(" Erreur listener dépôts:", error.message);
    return () => {};
  }
};

// =====================================
// 💾 CACHING LOCALSTORAGE
// =====================================

const CACHE_KEY = "maman-power-cache";

/**
 * Sauvegarder les données dans localStorage
 * @param {Array} categories - Catégories
 * @param {Array} depots - Dépôts avec produits
 */
export const saveToCache = (categories, depots) => {
  try {
    const cacheData = {
      categories: categories || [],
      depots: depots || [],
      lastSync: new Date().toISOString(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    console.log(
      ` 💾 Cache sauvegardé: ${categories?.length || 0} catégories, ${depots?.length || 0} dépôts`,
    );
  } catch (error) {
    console.error(" Erreur sauvegarde cache:", error.message);
  }
};

/**
 * Charger les données du cache localStorage
 * @returns {object} { categories, depots, lastSync } ou null
 */
export const loadFromCache = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) {
      console.log(" Aucun cache trouvé");
      return null;
    }

    const cacheData = JSON.parse(cached);
    console.log(
      ` 📦 Cache chargé: ${cacheData.categories?.length || 0} catégories, ${cacheData.depots?.length || 0} dépôts`,
    );
    console.log(`   Dernière sync: ${cacheData.lastSync}`);
    return cacheData;
  } catch (error) {
    console.error(" Erreur lecture cache:", error.message);
    return null;
  }
};

/**
 * Vider complètement le cache (pour logout par exemple)
 */
export const clearCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
    console.log(" 🗑️  Cache supprimé");
  } catch (error) {
    console.error(" Erreur suppression cache:", error.message);
  }
};

// =====================================
// 📄 PAGINATION DES DÉPÔTS
// =====================================

/**
 * Charger les dépôts avec produits par pagination
 * @param {number} vendorLat - Latitude vendeur
 * @param {number} vendorLon - Longitude vendeur
 * @param {number} pageSize - Nombre de dépôts par page (défaut: 20)
 * @param {number} pageNumber - Numéro de page (commence à 0)
 * @returns {Promise} { success, data: { depots, totalCount, hasMore }, error }
 */
export const getDepotsWithProductsPaginated = async (
  vendorLat,
  vendorLon,
  pageSize = 20,
  pageNumber = 0,
) => {
  try {
    console.log(
      `📄 Chargement dépôts pagés - Page ${pageNumber + 1} (${pageSize}/page)...`,
    );

    const depotsRef = ref(db, "depots");
    const depotsSnapshot = await get(depotsRef);

    if (!depotsSnapshot.exists()) {
      return {
        success: true,
        data: { depots: [], totalCount: 0, hasMore: false },
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

        let lat = parseFloat(depot.latitude);
        let lon = parseFloat(depot.longitude);

        if (isNaN(lat) || isNaN(lon)) {
          lat = -4.2726;
          lon = 15.2663;
        }

        const distance = calculateDistance(vendorLat, vendorLon, lat, lon);

        return {
          ...depot,
          distance: parseFloat(distance.toFixed(2)),
          products: products,
        };
      } catch (error) {
        console.error(` Erreur produits depot ${depot.id}:`, error.message);
        return null;
      }
    });

    const results = await Promise.all(depotsWithProductsPromises);
    const depotsWithProducts = results
      .filter((result) => result !== null)
      .sort((a, b) => a.distance - b.distance);

    console.log(
      ` ✅ ${depotsWithProducts.length} dépôts chargés (has more: ${hasMore})`,
    );

    return {
      success: true,
      data: {
        depots: depotsWithProducts,
        totalCount: totalCount,
        hasMore: hasMore,
        pageNumber: pageNumber,
        pageSize: pageSize,
      },
    };
  } catch (error) {
    console.error(" Erreur pagination dépôts:", error.message);
    return { success: false, error: error.message };
  }
};
