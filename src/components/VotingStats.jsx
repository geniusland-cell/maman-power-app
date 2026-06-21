import React, { useEffect, useState } from "react";
import { getVotingRankings, getCurrentQuarter } from "../firebase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
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

  // Transformer les données pour Recharts
  const chartData = rankings.map((depot, index) => ({
    name: depot.depot_name || `Dépôt ${index + 1}`,
    votes: depot.vote_count,
    rank: index + 1,
  }));

  // Couleurs pour les barres (or pour le 1er, argent pour le 2ème, bronze pour le 3ème)
  const getBarColor = (index) => {
    if (index === 0) return "#FFD700"; // Or
    if (index === 1) return "#C0C0C0"; // Argent
    if (index === 2) return "#CD7F32"; // Bronze
    return "#4F46E5"; // Bleu par défaut
  };

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
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                    tick={{ fontSize: 12, fill: "#666" }}
                  />
                  <YAxis
                    label={{
                      value: "Votes",
                      angle: -90,
                      position: "insideLeft",
                    }}
                    tick={{ fontSize: 12, fill: "#666" }}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      `${value} votes`,
                      "Nombre de votes",
                    ]}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar dataKey="votes" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
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
