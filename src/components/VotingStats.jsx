import React, { useEffect, useState } from "react";
import { getVotingRankings, getCurrentQuarter } from "../firebase";
import "./VotingStats.css";

const VotingStats = ({ isOpen, onClose }) => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quarter, setQuarter] = useState("");

  useEffect(() => {
    const loadRankings = async () => {
      try {
        setLoading(true);
        const data = await getVotingRankings();
        setRankings(data);
        setQuarter(getCurrentQuarter());
        console.log(" Classements de vote chargés:", data);
      } catch (err) {
        console.error(" Erreur chargement classements:", err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadRankings();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const maxVotes = rankings.length > 0 ? rankings[0].vote_count : 1;

  return (
    <div className="voting-stats-overlay" onClick={onClose}>
      <div className="voting-stats-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="stats-header">
          <h1>🏆 Classement des Votes - {quarter}</h1>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Contenu */}
        <div className="stats-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner">⏳</div>
              <p>Chargement du classement...</p>
            </div>
          ) : rankings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p>Aucun vote enregistré pour le moment</p>
              <p className="empty-subtitle">
                Soyez parmi les premiers à voter!
              </p>
            </div>
          ) : (
            <div className="rankings-list">
              {rankings.map((depot, index) => {
                const percentage = (depot.vote_count / maxVotes) * 100;
                const medalEmoji =
                  index === 0
                    ? "🥇"
                    : index === 1
                      ? "🥈"
                      : index === 2
                        ? "🥉"
                        : "📍";

                return (
                  <div key={depot.depotId} className="ranking-item">
                    <div className="ranking-position">
                      <span className="medal">{medalEmoji}</span>
                      <span className="position">#{index + 1}</span>
                    </div>

                    <div className="ranking-info">
                      <div className="depot-name">
                        {depot.depot_name || `Dépôt ${index + 1}`}
                      </div>
                      <div className="bar-container">
                        <div
                          className="bar-fill"
                          style={{ width: `${percentage}%` }}
                        >
                          {percentage > 10 && (
                            <span className="bar-text">{depot.vote_count}</span>
                          )}
                        </div>
                        {percentage <= 10 && (
                          <span className="vote-count-label">
                            {depot.vote_count}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="ranking-stats">
                      <span className="vote-label">
                        {depot.vote_count} vote
                        {depot.vote_count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="stats-footer">
          <p className="footer-note">
            🔐 Les résultats sont mis à jour en temps réel | 🏪 Seul le nombre
            de votes est visible
          </p>
        </div>
      </div>
    </div>
  );
};

export default VotingStats;
