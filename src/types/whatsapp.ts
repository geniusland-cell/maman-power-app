export type SubscriptionTier = "Basic" | "Pro" | "Advanced" | "Elite";

export interface WhatsAppGroup {
  id: string; // ID du groupe dans Firebase
  depotId: string;
  lienInvitation: string;
  nombreMembres: number;
  adminPrincipal: string;
  adminSecondaire: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DepotWithSubscription {
  id: string;
  name: string;
  subscriptionTier: SubscriptionTier;
  whatsappGroupId?: string;
  // ... other depot fields
}
