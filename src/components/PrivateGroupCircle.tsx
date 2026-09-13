import { useState, useEffect, ReactNode } from "react";
import { incrementMemberCount } from "../services/whatsappGroupService";
import type { WhatsAppGroup } from "../types/whatsapp";
import { db } from "../firebase";
import { ref, get, onValue } from "firebase/database";
import "./PrivateGroupCircle.css";

interface PrivateGroupCircleProps {
  depotId: string;
}

export default function PrivateGroupCircle({
  depotId,
}: PrivateGroupCircleProps): ReactNode {
  const [whatsappGroup, setWhatsappGroup] = useState<WhatsAppGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [groupId, setGroupId] = useState<string | null>(null);

  useEffect(() => {
    const loadGroup = async () => {
      try {
        const depotRef = ref(db, `depots/${depotId}`);
        const depotSnapshot = await get(depotRef);
        
        if (depotSnapshot.exists()) {
          const depotData = depotSnapshot.val();
          const whatsappGroupId = depotData.whatsappGroupId;
          
          if (whatsappGroupId) {
            setGroupId(whatsappGroupId);
            
            // Use onValue for real-time updates
            const groupRef = ref(db, `whatsappGroups/${whatsappGroupId}`);
            const unsubscribe = onValue(groupRef, (snapshot) => {
              if (snapshot.exists()) {
                setWhatsappGroup(snapshot.val());
              }
              setLoading(false);
            });

            return () => unsubscribe();
          }
        }
      } catch (err) {
        console.error("Erreur chargement groupe WhatsApp:", err);
        setLoading(false);
      }
    };

    loadGroup();
  }, [depotId]);

  const handleJoinGroup = async () => {
    if (!whatsappGroup?.lienInvitation || !groupId) {
      alert("Groupe non disponible pour le moment");
      return;
    }

    // Ouvrir le lien WhatsApp
    window.open(whatsappGroup.lienInvitation, "_blank");

    // Incrémenter le compteur de membres (une seule fois)
    if (!joined) {
      try {
        await incrementMemberCount(groupId);
        setJoined(true);
      } catch (err) {
        console.error("Erreur incrémentation membres:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="private-group-circle loading">
        <span className="loading-spinner">⏳</span>
      </div>
    );
  }

  if (!whatsappGroup) {
    return null; // Pas de groupe configuré
  }

  return (
    <div className="private-group-circle">
      <div className="group-icon"></div>
      <div className="group-info">
        <span className="group-title">Groupe Privé</span>
        <span className="member-count">
          {whatsappGroup.nombreMembres} membres
        </span>
      </div>
      <button
        className={`join-btn ${joined ? "joined" : ""}`}
        onClick={handleJoinGroup}
      >
        {joined ? "Rejoindre à nouveau" : "Rejoindre"}
      </button>
    </div>
  );
}
