import React, { useEffect, useState } from "react";
import { getVotingRankings, getCurrentQuarter } from "../firebase";
import { ref, get, onValue } from "firebase/database";
import { db } from "../firebase";
import "./VotingChart.css";

const VotingChart = ({ isOpen, onClose }) => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quarter, setQuarter] = useState("");
  const [chartData, setChartData] = useState([]);

  // Charger les données en temps réel
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const data = await getVotingRankings();
        setRankings(data);
        setQuarter(getCurrentQuarter());

        // Récupérer les données détaillées pour le graphique
        const currentQuarter = getCurrentQuarter();
        const votesRef = ref(db, `votes/${currentQuarter}`);

        // Listener pour updates en temps réel
        const unsubscribe = onValue(
          votesRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const votesData = snapshot.val();
              // Transformer en données pour le graphique (top 5 dépôts)
              const topDepots = Object.entries(votesData)
                .filter(([key]) => key !== "metadata")
                .map(([depotId, data]) => ({
                  depotId,
                  vote_count: data.vote_count || 0,
                }))
                .sort((a, b) => b.vote_count - a.vote_count)
                .slice(0, 5);

              setChartData(topDepots);
            }
          },
          (error) => {
            console.error(" Erreur chargement données graphique:", error);
          },
        );

        setLoading(false);
        return unsubscribe;
      } catch (err) {
        console.error(" Erreur chargement données:", err);
        setLoading(false);
      }
    };

    const unsubscribePromise = loadData();
    return () => {
      unsubscribePromise?.then((unsub) => unsub?.());
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxVotes = Math.max(
    ...[
      ...chartData.map((d) => d.vote_count),
      ...rankings.map((d) => d.vote_count),
    ],
    1,
  );

  // Générer les points SVG pour le graphique en courbe
  const generatePath = () => {
    if (chartData.length === 0) return "";

    const chartWidth = 500;
    const chartHeight = 250;
    const padding = 40;
    const points = chartData.map((depot, index) => {
      const x =
        (index / (chartData.length - 1 || 1)) * (chartWidth - 2 * padding) +
        padding;
      const y =
        chartHeight -
        (depot.vote_count / maxVotes) * (chartHeight - 2 * padding);
      return `${x},${y}`;
    });

    return `M ${points.join(" L ")}`;
  };

  return (
    <div className="voting-chart-overlay" onClick={onClose}>
      <div className="voting-chart-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="chart-header">
          <h1> Évolution des Votes - {quarter}</h1>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Contenu */}
        <div className="chart-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner">⏳</div>
              <p>Chargement du graphique...</p>
            </div>
          ) : rankings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"></div>
              <p>Aucun vote enregistré pour le moment</p>
              <p className="empty-subtitle">
                Soyez parmi les premiers à voter!
              </p>
            </div>
          ) : (
            <>
              {/* Graphique en courbe */}
              <div className="graph-container">
                <h2>Tendance des Votes (Top 5)</h2>
                <svg width="600" height="350" className="chart-svg">
                  {/* Grille */}
                  <defs>
                    <pattern
                      id="grid"
                      width="50"
                      height="25"
                      patternUnits="userSpaceOnUse"
                    >
                      <path d="M 50 0 L 0 0 0 25" fill="none" stroke="#eee" />
                    </pattern>
                  </defs>
                  <rect width="600" height="350" fill="url(#grid)" />

                  {/* Axes */}
                  <line x1="40" y1="10" x2="40" y2="300" stroke="#333" />
                  <line x1="40" y1="300" x2="580" y2="300" stroke="#333" />

                  {/* Labels axes */}
                  <text x="20" y="160" fontSize="12" fill="#666">
                    Votes
                  </text>
                  <text x="300" y="330" fontSize="12" fill="#666">
                    Dépôts (Top 5)
                  </text>

                  {/* Courbe */}
                  {chartData.length > 0 && (
                    <path
                      d={generatePath()}
                      fill="none"
                      stroke="#4CAF50"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Points */}
                  {chartData.length > 0 &&
                    chartData.map((depot, index) => {
                      const x =
                        (index / (chartData.length - 1 || 1)) * 540 + 40;
                      const y = 300 - (depot.vote_count / maxVotes) * 290;
                      return (
                        <g key={depot.depotId}>
                          <circle
                            cx={x}
                            cy={y}
                            r="6"
                            fill="#4CAF50"
                            stroke="#fff"
                            strokeWidth="2"
                          />
                          <text
                            x={x}
                            y={y - 15}
                            fontSize="12"
                            fill="#333"
                            textAnchor="middle"
                          >
                            {depot.vote_count}
                          </text>
                        </g>
                      );
                    })}
                </svg>
              </div>

              {/* Classement avec barres */}
              <div className="rankings-list">
                <h2>Classement Complet</h2>
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
                              <span className="bar-text">
                                {depot.vote_count}
                              </span>
                            )}
                          </div>
                          {percentage <= 10 && (
                            <span className="vote-count-label">
                              {depot.vote_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VotingChart;
