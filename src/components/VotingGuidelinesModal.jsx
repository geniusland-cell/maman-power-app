import React, { useState } from "react";
import "./VotingGuidelinesModal.css";

const getCurrentQuarter = () => {
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const quarter = Math.ceil(month / 3);
  return `${year}-Q${quarter}`;
};

const VotingGuidelinesModal = ({ onAccept, daysLeft }) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleAccept = () => {
    if (acceptedTerms) {
      // Marquer que l'utilisateur a accepté pour ce trimestre
      const currentQuarter = getCurrentQuarter();
      localStorage.setItem(
        `voting_guidelines_accepted_${currentQuarter}`,
        "true",
      );
      onAccept();
    }
  };

  return (
    <div className="voting-modal-overlay">
      <div className="voting-guidelines-modal">
        {/* Header */}
        <div className="modal-header">
          <h1>🗳️ Système de Vote - Règles & Critères</h1>
          <p className="modal-subtitle">
            Vision Unique - Élisez le Meilleur Dépôt
          </p>
        </div>

        {/* Contenu */}
        <div className="modal-content">
          {/* Section 1 : Comment voter */}
          <section className="guideline-section">
            <h2>📖 Comment Voter ?</h2>
            <p>
              Pendant <strong>{daysLeft} jours</strong>, vous avez l'opportunité
              d'élire le dépôt qui vous offre le meilleur service, les meilleurs
              produits et la meilleure expérience d'achat.
            </p>
            <ol>
              <li>Parcourez les dépôts disponibles</li>
              <li>Trouvez celui qui mérite votre vote</li>
              <li>
                Cliquez sur le bouton <strong>🗳️ Vote</strong> sur sa carte
              </li>
              <li>Confirmez votre choix</li>
            </ol>
          </section>

          {/* Section 2 : Critères de vote */}
          <section className="guideline-section">
            <h2>⭐ Critères de Vote</h2>
            <p>Votez pour le dépôt qui excelle dans :</p>
            <ul className="criteria-list">
              <li>
                ✅ <strong>Qualité des produits</strong> - Fraîcheur et
                sélection
              </li>
              <li>
                ✅ <strong>Rapidité du service</strong> - Efficacité du comptoir
              </li>
              <li>
                ✅ <strong>Prix compétitifs</strong> - Bon rapport qualité/prix
              </li>
              <li>
                ✅ <strong>Disponibilité</strong> - Stock régulier et varié
              </li>
              <li>
                ✅ <strong>Professionnalisme</strong> - Courtoisie de l'équipe
              </li>
            </ul>
          </section>

          {/* Section 3 : Règles importantes */}
          <section className="guideline-section">
            <h2>📋 Règles Importantes</h2>
            <ul className="rules-list">
              <li>
                🔒 <strong>1 Vote par Personne</strong> - Un vote unique et
                définitif
              </li>
              <li>
                🚫 <strong>Pas de modification</strong> - Vous ne pouvez pas
                changer votre vote
              </li>
              <li>
                ⏰ <strong>Période limitée</strong> - Les votes ferment
                automatiquement
              </li>
              <li>
                🏆 <strong>Résultats publics</strong> - Le classement sera
                affiché à tous
              </li>
              <li>
                👑 <strong>Récompense au gagnant</strong> - Le top 1 reçoit un
                badge prestigieux
              </li>
            </ul>
          </section>

          {/* Section 4 : Confidentialité */}
          <section className="guideline-section">
            <h2>🔐 Confidentialité & Transparence</h2>
            <p>
              Vos votes sont sécurisés et comptabilisés de manière transparente
              par
              <strong> Vision Unique</strong>. Seul le nombre total de votes par
              dépôt est publié, pas l'identité des votants.
            </p>
          </section>

          {/* Section 5 : Contact */}
          <section className="guideline-section">
            <h2>❓ Questions ?</h2>
            <p>
              Pour toute question, contactez Vision Unique via WhatsApp
              <strong> +242 067 678 128</strong> ou email{" "}
              <strong>genuismampouya@gmail.com</strong>
            </p>
          </section>
        </div>

        {/* Footer - Checkbox + Bouton */}
        <div className="modal-footer">
          <label className="terms-checkbox">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
            />
            <span>
              J'ai compris les règles de vote et j'accepte de participer au
              système de vote de <strong>Vision Unique</strong>
            </span>
          </label>

          <button
            onClick={handleAccept}
            disabled={!acceptedTerms}
            className={`accept-button ${acceptedTerms ? "enabled" : "disabled"}`}
          >
            ✅ Accepter & Commencer à Voter
          </button>
        </div>

        {/* Divider professionnel */}
        <div className="modal-footer-note">
          <p>© 2026 Vision Unique - Système de Vote Transparent & Équitable</p>
        </div>
      </div>
    </div>
  );
};

export default VotingGuidelinesModal;
