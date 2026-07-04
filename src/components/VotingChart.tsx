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
  LabelList,
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

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const data = await getVotingRankings();
        setRankings(data);
        setQuarter(getCurrentQuarter());

        const topDepots = data
          .slice(0, 5)
          .map((depot) => ({
            name: depot.depot_name || `Dépôt ${depot.depotId}`,
            votes: depot.vote_count,
          }))
          .sort((a, b) => b.votes - a.votes);

        setChartData(topDepots);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  const maxVotes = Math.max(
    ...[...chartData.map((d) => d.votes), ...rankings.map((d) => d.vote_count)],
    1,
  );
  const yAxisMax = Math.max(maxVotes, 15);

  const nbDepots = chartData.length;
  const barCategoryGap = nbDepots > 15 ? "8%" : nbDepots > 10 ? "12%" : "18%";
  const barGap = nbDepots > 15 ? 1 : nbDepots > 10 ? 2 : 4;
  const tickFontSize = nbDepots > 15 ? 9 : nbDepots > 10 ? 10 : 12;

  const chartDataWithColors = chartData.map((item) => ({
    ...item,
    fill: "#3b82f6",
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
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={chartDataWithColors}
                    margin={{
                      top: 30,
                      right: 20,
                      left: 10,
                      bottom: 30,
                    }}
                    barCategoryGap={barCategoryGap}
                    barGap={barGap}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{
                        fontSize: tickFontSize,
                        fill: "#4b5563",
                        fontWeight: "500",
                      }}
                      height={40}
                      interval={0}
                      tickLine={false}
                      axisLine={{ stroke: "#d1d5db", strokeWidth: 1 }}
                    />
                    <YAxis
                      domain={[0, yAxisMax]}
                      tickCount={8}
                      tick={{
                        fontSize: 11,
                        fill: "#4b5563",
                      }}
                      tickLine={false}
                      axisLine={{ stroke: "#d1d5db", strokeWidth: 1 }}
                      label={{
                        value: "Nombre de votes",
                        angle: -90,
                        position: "insideLeft",
                        style: {
                          fontSize: 12,
                          fill: "#6b7280",
                          fontWeight: "500",
                        },
                        offset: -5,
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        padding: "10px 14px",
                        fontSize: "12px",
                      }}
                      labelFormatter={(label) => ` ${label}`}
                    />
                    <Bar
                      dataKey="votes"
                      fill="#3b82f6"
                      fillOpacity={0.85}
                      radius={[4, 4, 0, 0]}
                      animationDuration={1000}
                      animationEasing="ease-in-out"
                    >
                      <LabelList
                        dataKey="votes"
                        position="top"
                        style={{
                          fontSize: "11px",
                          fontWeight: "600",
                          fill: "#1f2937",
                        }}
                      />
                    </Bar>
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
