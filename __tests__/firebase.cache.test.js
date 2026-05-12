/**
 * Tests unitaires pour les fonctions de cache (localStorage)
 * Fichier: maman-power-app/__tests__/firebase.cache.test.js
 */

import { saveToCache, loadFromCache, clearCache } from "../src/firebase";

describe("Firebase Cache Functions", () => {
  // Nettoyer le localStorage avant chaque test
  beforeEach(() => {
    localStorage.clear();
  });

  // Nettoyer après tous les tests
  afterAll(() => {
    localStorage.clear();
  });

  describe("saveToCache()", () => {
    test("doit sauvegarder les catégories et dépôts dans localStorage", () => {
      const categories = [
        { id: "1", name: "Poisson", is_active: true },
        { id: "2", name: "Charbon", is_active: true },
      ];
      const depots = [
        { id: "d1", name: "Dépôt Jean", quartier: "Poto-Poto" },
        { id: "d2", name: "Dépôt Marie", quartier: "Bakongo" },
      ];

      // Action
      saveToCache(categories, depots);

      // Vérification
      const saved = localStorage.getItem("maman-power-cache");
      expect(saved).toBeTruthy();

      const parsed = JSON.parse(saved);
      expect(parsed.categories).toEqual(categories);
      expect(parsed.depots).toEqual(depots);
      expect(parsed.lastSync).toBeDefined();
    });

    test("doit créer un timestamp lastSync valide", () => {
      const categories = [];
      const depots = [];
      const beforeTime = new Date().getTime();

      saveToCache(categories, depots);

      const saved = localStorage.getItem("maman-power-cache");
      const parsed = JSON.parse(saved);
      const savedTime = new Date(parsed.lastSync).getTime();

      expect(savedTime).toBeGreaterThanOrEqual(beforeTime);
    });

    test("doit gérer les arrays vides", () => {
      const categories = [];
      const depots = [];

      saveToCache(categories, depots);

      const saved = localStorage.getItem("maman-power-cache");
      const parsed = JSON.parse(saved);

      expect(parsed.categories).toEqual([]);
      expect(parsed.depots).toEqual([]);
    });
  });

  describe("loadFromCache()", () => {
    test("doit charger les données depuis le cache", () => {
      const categories = [{ id: "1", name: "Poisson" }];
      const depots = [{ id: "d1", name: "Dépôt Jean" }];

      saveToCache(categories, depots);

      // Action
      const loaded = loadFromCache();

      // Vérification
      expect(loaded).toBeTruthy();
      expect(loaded.categories).toEqual(categories);
      expect(loaded.depots).toEqual(depots);
      expect(loaded.lastSync).toBeDefined();
    });

    test("doit retourner null si pas de cache", () => {
      // Action (localStorage vide)
      const loaded = loadFromCache();

      // Vérification
      expect(loaded).toBeNull();
    });

    test("doit retourner un objet avec structure correcte", () => {
      const categories = [{ id: "1", name: "Poisson" }];
      const depots = [{ id: "d1", name: "Dépôt Jean" }];

      saveToCache(categories, depots);
      const loaded = loadFromCache();

      // Vérification structure
      expect(loaded).toHaveProperty("categories");
      expect(loaded).toHaveProperty("depots");
      expect(loaded).toHaveProperty("lastSync");
      expect(Array.isArray(loaded.categories)).toBe(true);
      expect(Array.isArray(loaded.depots)).toBe(true);
    });
  });

  describe("clearCache()", () => {
    test("doit supprimer le cache de localStorage", () => {
      const categories = [{ id: "1", name: "Poisson" }];
      const depots = [{ id: "d1", name: "Dépôt Jean" }];

      saveToCache(categories, depots);
      expect(loadFromCache()).toBeTruthy();

      // Action
      clearCache();

      // Vérification
      expect(loadFromCache()).toBeNull();
      expect(localStorage.getItem("maman-power-cache")).toBeNull();
    });

    test("doit être sûr d'appeler clearCache() quand pas de cache", () => {
      // Pas de cache existant
      expect(() => {
        clearCache();
      }).not.toThrow();
    });
  });

  describe("Intégration: Save → Load → Clear", () => {
    test("cycle complet cache: save, load, clear", () => {
      const categories = [
        { id: "1", name: "Poisson" },
        { id: "2", name: "Fruits" },
      ];
      const depots = [
        { id: "d1", name: "Dépôt 1", products: [] },
        { id: "d2", name: "Dépôt 2", products: [] },
      ];

      // 1. Sauvegarde
      saveToCache(categories, depots);
      expect(loadFromCache()).toBeTruthy();

      // 2. Charge et vérifie
      const loaded = loadFromCache();
      expect(loaded.categories.length).toBe(2);
      expect(loaded.depots.length).toBe(2);
      expect(loaded.categories[0].name).toBe("Poisson");

      // 3. Efface
      clearCache();
      expect(loadFromCache()).toBeNull();
    });
  });
});
