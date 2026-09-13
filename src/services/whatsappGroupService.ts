import { db } from "../firebase";
import { ref, set, get, update } from "firebase/database";
import type { WhatsAppGroup, SubscriptionTier } from "../types/whatsapp";
import type { FirebaseResponse } from "../types";

/**
 * Créer un groupe WhatsApp dans Firebase (pour gestion manuelle initiale)
 * @param depotId - ID du dépôt
 * @param lienInvitation - Lien d'invitation WhatsApp
 * @param adminSecondaire - Nom du gérant (admin secondaire)
 */
export const createWhatsAppGroup = async (
  depotId: string,
  lienInvitation: string,
  adminSecondaire: string,
): Promise<FirebaseResponse<string>> => {
  try {
    const groupId = `group_${Date.now()}`;
    const groupRef = ref(db, `whatsappGroups/${groupId}`);
    
    const groupData: WhatsAppGroup = {
      depotId,
      lienInvitation,
      nombreMembres: 0,
      adminPrincipal: "VisionUnique",
      adminSecondaire,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await set(groupRef, groupData);
    
    // Mettre à jour le dépôt avec l'ID du groupe
    const depotRef = ref(db, `depots/${depotId}`);
    await update(depotRef, {
      whatsappGroupId: groupId,
    });
    
    return { success: true, data: groupId };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("Erreur création groupe WhatsApp:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Récupérer le groupe WhatsApp d'un dépôt
 * @param depotId - ID du dépôt
 */
export const getWhatsAppGroupByDepotId = async (
  depotId: string,
): Promise<FirebaseResponse<WhatsAppGroup | null>> => {
  try {
    // D'abord récupérer l'ID du groupe depuis le dépôt
    const depotRef = ref(db, `depots/${depotId}`);
    const depotSnapshot = await get(depotRef);
    
    if (!depotSnapshot.exists()) {
      return { success: false, error: "Dépôt non trouvé" };
    }
    
    const depotData = depotSnapshot.val();
    const groupId = depotData.whatsappGroupId;
    
    if (!groupId) {
      return { success: true, data: null };
    }
    
    // Récupérer le groupe
    const groupRef = ref(db, `whatsappGroups/${groupId}`);
    const groupSnapshot = await get(groupRef);
    
    if (!groupSnapshot.exists()) {
      return { success: true, data: null };
    }
    
    return { success: true, data: groupSnapshot.val() };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("Erreur récupération groupe WhatsApp:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Mettre à jour le lien d'invitation d'un groupe
 * @param groupId - ID du groupe
 * @param nouveauLien - Nouveau lien d'invitation
 */
export const updateWhatsAppGroupLink = async (
  groupId: string,
  nouveauLien: string,
): Promise<FirebaseResponse<null>> => {
  try {
    const groupRef = ref(db, `whatsappGroups/${groupId}`);
    await update(groupRef, {
      lienInvitation: nouveauLien,
      updatedAt: new Date(),
    });
    
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("Erreur mise à jour lien WhatsApp:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Incrémenter le compteur de membres d'un groupe
 * @param groupId - ID du groupe
 */
export const incrementMemberCount = async (
  groupId: string,
): Promise<FirebaseResponse<null>> => {
  try {
    const groupRef = ref(db, `whatsappGroups/${groupId}`);
    const snapshot = await get(groupRef);
    
    if (!snapshot.exists()) {
      return { success: false, error: "Groupe non trouvé" };
    }
    
    const currentCount = snapshot.val().nombreMembres || 0;
    await update(groupRef, {
      nombreMembres: currentCount + 1,
      updatedAt: new Date(),
    });
    
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("Erreur incrémentation membres:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Vérifier si un dépôt a droit à un groupe WhatsApp privé
 * @param subscriptionTier - Niveau d'abonnement du dépôt
 */
export const hasWhatsAppGroupAccess = (
  subscriptionTier: SubscriptionTier | undefined,
): boolean => {
  if (!subscriptionTier) return false;
  // Accept both PascalCase and lowercase for backward compatibility
  const normalizedTier = 
    subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1).toLowerCase();
  return normalizedTier === "Advanced" || normalizedTier === "Elite";
};

/**
 * Récupérer tous les groupes WhatsApp (pour admin dashboard)
 */
export const getAllWhatsAppGroups = async (): Promise<
  FirebaseResponse<WhatsAppGroup[]>
> => {
  try {
    const groupsRef = ref(db, "whatsappGroups");
    const snapshot = await get(groupsRef);
    
    if (!snapshot.exists()) {
      return { success: true, data: [] };
    }
    
    const groupsData = snapshot.val();
    const groups = Object.keys(groupsData).map((key) => ({
      id: key,
      ...groupsData[key],
    }));
    
    return { success: true, data: groups };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("Erreur récupération groupes WhatsApp:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Récupérer tous les dépôts avec abonnement Advanced ou Elite
 * Accepte à la fois la nouvelle casse (PascalCase) et l'ancienne casse (lowercase)
 */
export const getAdvancedEliteDepots = async (): Promise<
  FirebaseResponse<any[]>
> => {
  try {
    const depotsRef = ref(db, "depots");
    const snapshot = await get(depotsRef);
    
    if (!snapshot.exists()) {
      return { success: true, data: [] };
    }
    
    const depotsData = snapshot.val();
    const advancedEliteDepots = Object.keys(depotsData)
      .map((key) => ({ id: key, ...depotsData[key] }))
      .filter(
        (depot) =>
          depot.tier === "Advanced" || 
          depot.tier === "Elite" ||
          depot.tier === "advanced" || 
          depot.tier === "elite",
      );
    
    return { success: true, data: advancedEliteDepots };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("Erreur récupération dépôts Advanced/Elite:", errorMsg);
    return { success: false, error: errorMsg };
  }
};
