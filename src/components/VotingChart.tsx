import { useEffect, useState } from "react";
import { getVotingRankings, getCurrentQuarter } from "../firebase";
import { ref, onValue, get } from "firebase/database";
import { db } from "../firebase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./VotingChart.css";

interface VotingChartProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChartData {
  name: string;
  votes: number;
}

interface RankingData {
  depotId: string;
  depot_name?: string;
  vote_count: number;
}

const VotingChart = ({ isOpen, onClose }: VotingChartProps) => {
  const [rankings, setRankings] = useState<RankingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [quarter, setQuarter] = useState("");
  const [chartData, setChartData] = useState<ChartData[]>([]);

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
          async (snapshot) => {
            if (snapshot.exists()) {
              const votesData = snapshot.val();
              // Récupérer les noms des dépôts depuis Firebase
              const depotIds = Object.keys(votesData).filter(
                (key) => key !== "metadata",
              );
              const depotNames: Record<string, string> = {};

              for (const depotId of depotIds) {
                try {
                  const depotRef = ref(db, `depots/${depotId}`);
                  const depotSnapshot = await get(depotRef);
                  if (depotSnapshot.exists()) {
                    const depotData = depotSnapshot.val();
                    depotNames[depotId] = depotData.depot_name || depotId;
                  } else {
                    depotNames[depotId] = depotId;
                  }
                } catch (error) {
                  console.error(
                    `Erreur récupération nom dépôt ${depotId}:`,
                    error,
                  );
                  depotNames[depotId] = depotId;
                }
              }

              // Transformer en données pour le graphique (top 5 dépôts)
              const topDepots = Object.entries(votesData)
                .filter(([key]) => key !== "metadata")
                .map(([depotId, data]: [string, any]) => ({
                  name: depotNames[depotId] || depotId,
                  votes: data.vote_count || 0,
                }))
                .sort((a, b) => b.votes - a.votes)
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
    ...[...chartData.map((d) => d.votes), ...rankings.map((d) => d.vote_count)],
    1,
  );

  // Fixer l'échelle max à 15 pour progression visible
  const yAxisMax = Math.max(maxVotes, 15);

  // Préparer les données avec couleurs pour le top 3
  const chartDataWithColors = chartData.map((item, index) => ({
    ...item,
    fill:
      index === 0
        ? "#FFD700"
        : index === 1
          ? "#C0C0C0"
          : index === 2
            ? "#CD7F32"
            : "#4CAF50",
  }));

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
              {/* Graphique en barres verticales */}
              <div className="graph-container">
                <h2>Tendance des Votes (Top 5)</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={chartDataWithColors}
                    barSize={16}
                    margin={{ top: 10, right: 20, left: 30, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#666" }}
                      axisLine={{ stroke: "#ccc" }}
                      tickLine={{ stroke: "#ccc" }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      domain={[0, yAxisMax]}
                      tick={{ fontSize: 11, fill: "#666" }}
                      axisLine={{ stroke: "#ccc" }}
                      tickLine={{ stroke: "#ccc" }}
                      tickCount={6}
                      width={30}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        fontSize: "11px",
                      }}
                    />
                    <Bar
                      dataKey="votes"
                      fill="#4CAF50"
                      fillOpacity={0.8}
                      animationDuration={1000}
                      animationEasing="ease-in-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Classement avec barres */}
              <div className="rankings-list">
                <h2>Classement Complet</h2>
                {rankings.map((depot, index) => {
                  const percentage = (depot.vote_count / yAxisMax) * 100;
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
                            style={{
                              width: `${percentage}%`,
                              animation: `fillBar 1s ease-in-out forwards`,
                              animationDelay: `${index * 0.1}s`,
                            }}
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
