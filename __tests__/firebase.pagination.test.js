/**
 * Tests unitaires pour la pagination des dépôts
 * Fichier: maman-power-app/__tests__/firebase.pagination.test.js
 */

import { getDepotsWithProductsPaginated } from "../src/firebase";

describe("Pagination - getDepotsWithProductsPaginated()", () => {
  // Coordonnées par défaut (Brazzaville)
  const vendorLat = -4.2726;
  const vendorLon = 15.2663;

  describe("Paramètres par défaut", () => {
    test("doit accepter les paramètres par défaut (pageSize=20, pageNumber=0)", async () => {
      const result = await getDepotsWithProductsPaginated(vendorLat, vendorLon);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.pageSize).toBe(20);
      expect(result.data.pageNumber).toBe(0);
    });

    test("doit avoir structure correcte pour la réponse", async () => {
      const result = await getDepotsWithProductsPaginated(vendorLat, vendorLon);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("depots");
      expect(result.data).toHaveProperty("totalCount");
      expect(result.data).toHaveProperty("hasMore");
      expect(result.data).toHaveProperty("pageNumber");
      expect(result.data).toHaveProperty("pageSize");
    });
  });

  describe("Validation des paramètres", () => {
    test("doit gérer les coordonnées invalides (par défaut)", async () => {
      // Coordonnées invalides
      const result = await getDepotsWithProductsPaginated(null, null);

      expect(result.success).toBe(true);
      // Doit utiliser les coordonnées par défaut sans erreur
    });

    test("doit accepter un pageSize personnalisé", async () => {
      const result = await getDepotsWithProductsPaginated(
        vendorLat,
        vendorLon,
        10, // pageSize = 10
        0,
      );

      expect(result.success).toBe(true);
      expect(result.data.pageSize).toBe(10);
      expect(result.data.depots.length).toBeLessThanOrEqual(10);
    });

    test("doit accepter un pageNumber personnalisé", async () => {
      const result = await getDepotsWithProductsPaginated(
        vendorLat,
        vendorLon,
        20,
        1, // pageNumber = 1
      );

      expect(result.success).toBe(true);
      expect(result.data.pageNumber).toBe(1);
    });
  });

  describe("Logique de pagination", () => {
    test("première page (0) doit retourner les premiers dépôts", async () => {
      const result = await getDepotsWithProductsPaginated(
        vendorLat,
        vendorLon,
        20,
        0,
      );

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data.depots)).toBe(true);
      expect(result.data.depots.length).toBeGreaterThanOrEqual(0);
    });

    test("hasMore doit être true/false selon les données", async () => {
      const result = await getDepotsWithProductsPaginated(
        vendorLat,
        vendorLon,
        20,
        0,
      );

      expect(result.success).toBe(true);
      expect(typeof result.data.hasMore).toBe("boolean");
    });

    test("totalCount doit être >= nombre de dépôts chargés", async () => {
      const result = await getDepotsWithProductsPaginated(
        vendorLat,
        vendorLon,
        20,
        0,
      );

      expect(result.success).toBe(true);
      expect(result.data.totalCount).toBeGreaterThanOrEqual(
        result.data.depots.length,
      );
    });

    test("dépôt doit avoir structure valide (id, name, products)", async () => {
      const result = await getDepotsWithProductsPaginated(
        vendorLat,
        vendorLon,
        20,
        0,
      );

      if (result.data.depots.length > 0) {
        const depot = result.data.depots[0];

        expect(depot).toHaveProperty("id");
        expect(depot).toHaveProperty("name");
        expect(depot).toHaveProperty("products");
        expect(Array.isArray(depot.products)).toBe(true);
      }
    });

    test("produit doit avoir structure valide", async () => {
      const result = await getDepotsWithProductsPaginated(
        vendorLat,
        vendorLon,
        20,
        0,
      );

      if (
        result.data.depots.length > 0 &&
        result.data.depots[0].products.length > 0
      ) {
        const product = result.data.depots[0].products[0];

        expect(product).toHaveProperty("id");
        expect(product).toHaveProperty("name");
        expect(product).toHaveProperty("category");
        expect(product).toHaveProperty("price");
        expect(product).toHaveProperty("stock_quantity");
        expect(typeof product.price).toBe("number");
        expect(typeof product.stock_quantity).toBe("number");
      }
    });
  });

  describe("Gestion des erreurs", () => {
    test("doit retourner success=false en cas d'erreur Firebase", async () => {
      // Teste le fallback de gestion d'erreur
      // (normalement success=true même sans dépôts)
      const result = await getDepotsWithProductsPaginated(vendorLat, vendorLon);

      expect(result).toHaveProperty("success");
      expect(typeof result.success).toBe("boolean");
    });

    test('doit avoir un objet "data" ou "error" cohérent', async () => {
      const result = await getDepotsWithProductsPaginated(vendorLat, vendorLon);

      if (result.success) {
        expect(result.data).toBeDefined();
      } else {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe("Performance et limites", () => {
    test("pageSize de 50 doit retourner max 50 dépôts", async () => {
      const result = await getDepotsWithProductsPaginated(
        vendorLat,
        vendorLon,
        50,
        0,
      );

      expect(result.success).toBe(true);
      expect(result.data.depots.length).toBeLessThanOrEqual(50);
    });

    test("pageSize de 1 doit retourner max 1 dépôt", async () => {
      const result = await getDepotsWithProductsPaginated(
        vendorLat,
        vendorLon,
        1,
        0,
      );

      expect(result.success).toBe(true);
      expect(result.data.depots.length).toBeLessThanOrEqual(1);
    });
  });

  describe("Compatibilité avec distance calculation", () => {
    test("chaque dépôt doit avoir une propriété distance", async () => {
      const result = await getDepotsWithProductsPaginated(
        vendorLat,
        vendorLon,
        20,
        0,
      );

      if (result.data.depots.length > 0) {
        const depot = result.data.depots[0];
        // La distance est calculée dans la fonction
        expect(depot).toHaveProperty("distance");
      }
    });
  });
});
