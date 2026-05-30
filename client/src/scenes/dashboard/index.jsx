import React, { useState, useMemo } from "react";
import {
  Box,
  Tabs,
  Tab,
  useTheme,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Divider,
} from "@mui/material";
import DashboardBox from "@/components/DashboardBox";
import FlexBetween from "@/components/FlexBetween";
import {
  useGetPortfolioQuery,
  useGetTradeHistoryQuery,
  useGetWatchlistQuery,
} from "@/state/api";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from "recharts";
import PieChartIcon from "@mui/icons-material/PieChart";
import TimelineIcon from "@mui/icons-material/Timeline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import { useNavigate } from "react-router-dom";

const PIE_COLORS = [
  "#12efc8", "#7c4dff", "#ff6b6b", "#ffd93d", "#6bcb77",
  "#4d96ff", "#ff6e40", "#ab47bc", "#26c6da", "#ec407a",
];

const Dashboard = () => {
  const { palette } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const { data: portfolio, isLoading: portfolioLoading } = useGetPortfolioQuery();
  const { data: tradeHistory, isLoading: historyLoading } = useGetTradeHistoryQuery();
  const { data: watchlist, isLoading: watchlistLoading } = useGetWatchlistQuery();

  // PIE CHART DATA
  const pieData = useMemo(() => {
    if (!portfolio?.holdings?.length) return [];
    return portfolio.holdings.map((h) => ({
      name: h.ticker,
      value: h.currentValue || h.shares * h.averagePrice,
    }));
  }, [portfolio]);

  // TRADE ACTIVITY DATA - group by date
  const tradeActivityData = useMemo(() => {
    if (!tradeHistory?.length) return [];
    const grouped = {};
    tradeHistory.forEach((tx) => {
      const date = new Date(tx.createdAt).toLocaleDateString();
      if (!grouped[date]) grouped[date] = { date, buys: 0, sells: 0 };
      if (tx.type === "BUY") {
        grouped[date].buys += tx.shares * tx.price;
      } else {
        grouped[date].sells += tx.shares * tx.price;
      }
    });
    return Object.values(grouped).reverse().slice(-15);
  }, [tradeHistory]);

  // TRADE STATS
  const tradeStats = useMemo(() => {
    if (!tradeHistory?.length) return { total: 0, buys: 0, sells: 0, volume: 0 };
    const buys = tradeHistory.filter((tx) => tx.type === "BUY").length;
    const sells = tradeHistory.filter((tx) => tx.type === "SELL").length;
    const volume = tradeHistory.reduce((sum, tx) => sum + tx.shares * tx.price, 0);
    return { total: tradeHistory.length, buys, sells, volume };
  }, [tradeHistory]);

  // CUSTOM TOOLTIP FOR PIE
  const PieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0];
    return (
      <Box
        sx={{
          backgroundColor: palette.grey[900],
          border: `1px solid ${palette.grey[700]}`,
          borderRadius: "8px",
          p: "0.75rem",
        }}
      >
        <Typography variant="body2" fontWeight="bold" color={palette.grey[100]}>
          {data.name}
        </Typography>
        <Typography variant="body2" color={palette.grey[300]}>
          ${data.value?.toLocaleString()}
        </Typography>
      </Box>
    );
  };

  return (
    <Box display="flex" flexDirection="column" gap="1.5rem" mt="1rem">
      {/* HEADER */}
      <FlexBetween>
        <Typography
          variant="h2"
          fontWeight="bold"
          sx={{
            background: `linear-gradient(135deg, ${palette.primary[400]}, ${palette.primary[200]})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Portfolio Analytics
        </Typography>
        {portfolio && (
          <Chip
            icon={<AccountBalanceWalletIcon />}
            label={`Total Value: $${portfolio.totalValue?.toLocaleString()}`}
            sx={{
              fontSize: "14px",
              fontWeight: "bold",
              p: "0.25rem 0.5rem",
              backgroundColor: "rgba(18, 239, 200, 0.08)",
              border: `1px solid ${palette.primary[700]}`,
              color: palette.primary[300],
              "& .MuiChip-icon": { color: palette.primary[400] },
            }}
          />
        )}
      </FlexBetween>

      {/* TABS */}
      <DashboardBox p="0.5rem 1rem">
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          indicatorColor="primary"
          textColor="inherit"
          variant="fullWidth"
          sx={{
            "& .MuiTabs-indicator": {
              backgroundColor: palette.primary[500],
              height: "3px",
            },
            "& .MuiTab-root": {
              fontSize: "13px",
              fontWeight: "bold",
              textTransform: "none",
              color: palette.grey[500],
              minHeight: "48px",
              display: "flex",
              flexDirection: "row",
              gap: "0.5rem",
              alignItems: "center",
              "&.Mui-selected": { color: palette.primary[300] },
            },
          }}
        >
          <Tab
            icon={<PieChartIcon sx={{ fontSize: "20px" }} />}
            iconPosition="start"
            label="Portfolio Overview"
          />
          <Tab
            icon={<TimelineIcon sx={{ fontSize: "20px" }} />}
            iconPosition="start"
            label="Trade Activity"
          />
          <Tab
            icon={<VisibilityIcon sx={{ fontSize: "20px" }} />}
            iconPosition="start"
            label="Market Watchlist"
          />
        </Tabs>
      </DashboardBox>

      {/* TAB PANELS */}
      <Box>
        {/* ============ TAB 1: PORTFOLIO OVERVIEW ============ */}
        {activeTab === 0 && (
          <Box display="flex" flexDirection="column" gap="1.5rem">
            {/* SUMMARY CARDS */}
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <DashboardBox p="1.25rem">
                  <Typography variant="h6" color={palette.grey[500]} mb="0.25rem">
                    Buying Power
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color={palette.grey[100]}>
                    ${portfolio?.buyingPower?.toLocaleString() || "100,000"}
                  </Typography>
                </DashboardBox>
              </Grid>
              <Grid item xs={6} md={3}>
                <DashboardBox p="1.25rem">
                  <Typography variant="h6" color={palette.grey[500]} mb="0.25rem">
                    Holdings Value
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color={palette.primary[300]}>
                    ${portfolio?.holdingsValue?.toLocaleString() || "0"}
                  </Typography>
                </DashboardBox>
              </Grid>
              <Grid item xs={6} md={3}>
                <DashboardBox p="1.25rem">
                  <Typography variant="h6" color={palette.grey[500]} mb="0.25rem">
                    Active Positions
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color={palette.grey[100]}>
                    {portfolio?.holdings?.length || 0}
                  </Typography>
                </DashboardBox>
              </Grid>
              <Grid item xs={6} md={3}>
                <DashboardBox p="1.25rem">
                  <Typography variant="h6" color={palette.grey[500]} mb="0.25rem">
                    Total P&L
                  </Typography>
                  {(() => {
                    const totalPnL =
                      portfolio?.holdings?.reduce((s, h) => s + (h.gainLoss || 0), 0) || 0;
                    const isPositive = totalPnL >= 0;
                    return (
                      <Box display="flex" alignItems="center" gap="0.25rem">
                        {isPositive ? (
                          <TrendingUpIcon sx={{ color: palette.primary[400], fontSize: "20px" }} />
                        ) : (
                          <TrendingDownIcon sx={{ color: "#ef5350", fontSize: "20px" }} />
                        )}
                        <Typography
                          variant="h3"
                          fontWeight="bold"
                          color={isPositive ? palette.primary[400] : "#ef5350"}
                        >
                          {isPositive ? "+" : ""}${totalPnL.toFixed(2)}
                        </Typography>
                      </Box>
                    );
                  })()}
                </DashboardBox>
              </Grid>
            </Grid>

            {/* PIE CHART + HOLDINGS TABLE */}
            <Box display="grid" gap="1.5rem" gridTemplateColumns="1fr 1.5fr">
              {/* PIE CHART */}
              <DashboardBox p="1.5rem">
                <Typography variant="h4" fontWeight="bold" color={palette.grey[100]} mb="1rem">
                  Holdings Allocation
                </Typography>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={110}
                        paddingAngle={3}
                        dataKey="value"
                        animationDuration={800}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box textAlign="center" py="4rem">
                    <PieChartIcon sx={{ fontSize: "48px", color: palette.grey[700], mb: "1rem" }} />
                    <Typography variant="h5" color={palette.grey[500]}>
                      No holdings to display
                    </Typography>
                    <Typography variant="body2" color={palette.grey[600]} mt="0.5rem">
                      Start trading in the Simulator to see your allocation
                    </Typography>
                  </Box>
                )}
                {/* Legend */}
                {pieData.length > 0 && (
                  <Box display="flex" flexWrap="wrap" gap="0.5rem" mt="0.5rem" justifyContent="center">
                    {pieData.map((d, i) => (
                      <Chip
                        key={d.name}
                        label={d.name}
                        size="small"
                        sx={{
                          backgroundColor: `${PIE_COLORS[i % PIE_COLORS.length]}20`,
                          color: PIE_COLORS[i % PIE_COLORS.length],
                          border: `1px solid ${PIE_COLORS[i % PIE_COLORS.length]}40`,
                          fontWeight: "bold",
                          fontSize: "11px",
                        }}
                      />
                    ))}
                  </Box>
                )}
              </DashboardBox>

              {/* HOLDINGS TABLE */}
              <DashboardBox p="1.5rem">
                <Typography variant="h4" fontWeight="bold" color={palette.grey[100]} mb="1rem">
                  Holdings Detail
                </Typography>
                {portfolio?.holdings?.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {["Ticker", "Shares", "Avg Price", "Current", "Value", "P&L", "%"].map(
                            (h) => (
                              <TableCell
                                key={h}
                                sx={{
                                  color: palette.grey[400],
                                  borderBottom: `1px solid ${palette.grey[800]}`,
                                  fontWeight: "bold",
                                  fontSize: "12px",
                                }}
                              >
                                {h}
                              </TableCell>
                            )
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {portfolio.holdings.map((h) => {
                          const isProfit = h.gainLoss >= 0;
                          return (
                            <TableRow key={h.ticker} hover>
                              <TableCell
                                sx={{
                                  color: palette.primary[300],
                                  fontWeight: "bold",
                                  borderBottom: `1px solid ${palette.grey[800]}`,
                                }}
                              >
                                {h.ticker}
                              </TableCell>
                              <TableCell
                                sx={{
                                  color: palette.grey[200],
                                  borderBottom: `1px solid ${palette.grey[800]}`,
                                }}
                              >
                                {h.shares}
                              </TableCell>
                              <TableCell
                                sx={{
                                  color: palette.grey[300],
                                  borderBottom: `1px solid ${palette.grey[800]}`,
                                }}
                              >
                                ${h.averagePrice?.toFixed(2)}
                              </TableCell>
                              <TableCell
                                sx={{
                                  color: palette.grey[200],
                                  borderBottom: `1px solid ${palette.grey[800]}`,
                                }}
                              >
                                ${h.currentPrice}
                              </TableCell>
                              <TableCell
                                sx={{
                                  color: palette.grey[200],
                                  fontWeight: "bold",
                                  borderBottom: `1px solid ${palette.grey[800]}`,
                                }}
                              >
                                ${h.currentValue?.toLocaleString()}
                              </TableCell>
                              <TableCell
                                sx={{
                                  color: isProfit ? palette.primary[400] : "#ef5350",
                                  fontWeight: "bold",
                                  borderBottom: `1px solid ${palette.grey[800]}`,
                                }}
                              >
                                {isProfit ? "+" : ""}${h.gainLoss?.toFixed(2)}
                              </TableCell>
                              <TableCell
                                sx={{
                                  color: isProfit ? palette.primary[400] : "#ef5350",
                                  fontWeight: "bold",
                                  borderBottom: `1px solid ${palette.grey[800]}`,
                                }}
                              >
                                {isProfit ? "+" : ""}{h.gainLossPercent?.toFixed(1)}%
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box textAlign="center" py="4rem">
                    <AccountBalanceWalletIcon
                      sx={{ fontSize: "48px", color: palette.grey[700], mb: "1rem" }}
                    />
                    <Typography variant="h5" color={palette.grey[500]}>
                      No holdings yet
                    </Typography>
                    <Typography variant="body2" color={palette.grey[600]} mt="0.5rem">
                      Place your first trade in the Simulator
                    </Typography>
                  </Box>
                )}
              </DashboardBox>
            </Box>
          </Box>
        )}

        {/* ============ TAB 2: TRADE ACTIVITY ============ */}
        {activeTab === 1 && (
          <Box display="flex" flexDirection="column" gap="1.5rem">
            {/* TRADE STATS */}
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <DashboardBox p="1.25rem">
                  <Typography variant="h6" color={palette.grey[500]} mb="0.25rem">
                    Total Trades
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color={palette.grey[100]}>
                    {tradeStats.total}
                  </Typography>
                </DashboardBox>
              </Grid>
              <Grid item xs={6} md={3}>
                <DashboardBox p="1.25rem">
                  <Typography variant="h6" color={palette.grey[500]} mb="0.25rem">
                    Buy Orders
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color={palette.primary[400]}>
                    {tradeStats.buys}
                  </Typography>
                </DashboardBox>
              </Grid>
              <Grid item xs={6} md={3}>
                <DashboardBox p="1.25rem">
                  <Typography variant="h6" color={palette.grey[500]} mb="0.25rem">
                    Sell Orders
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color="#ef5350">
                    {tradeStats.sells}
                  </Typography>
                </DashboardBox>
              </Grid>
              <Grid item xs={6} md={3}>
                <DashboardBox p="1.25rem">
                  <Typography variant="h6" color={palette.grey[500]} mb="0.25rem">
                    Total Volume
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color={palette.grey[100]}>
                    ${tradeStats.volume?.toLocaleString()}
                  </Typography>
                </DashboardBox>
              </Grid>
            </Grid>

            {/* TRADE ACTIVITY CHART */}
            <DashboardBox p="1.5rem">
              <Typography variant="h4" fontWeight="bold" color={palette.grey[100]} mb="1rem">
                Trade Volume by Day
              </Typography>
              {tradeActivityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={tradeActivityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={palette.grey[800]} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: palette.grey[500], fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: palette.grey[800] }}
                    />
                    <YAxis
                      tick={{ fill: palette.grey[500], fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: palette.grey[800] }}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: palette.grey[900],
                        border: `1px solid ${palette.grey[700]}`,
                        borderRadius: "8px",
                        color: palette.grey[100],
                      }}
                      formatter={(v) => [`$${v.toLocaleString()}`, ""]}
                    />
                    <Legend />
                    <Bar
                      dataKey="buys"
                      fill={palette.primary[500]}
                      name="Buy Volume"
                      radius={[4, 4, 0, 0]}
                      animationDuration={800}
                    />
                    <Bar
                      dataKey="sells"
                      fill="#ef5350"
                      name="Sell Volume"
                      radius={[4, 4, 0, 0]}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box textAlign="center" py="4rem">
                  <TimelineIcon sx={{ fontSize: "48px", color: palette.grey[700], mb: "1rem" }} />
                  <Typography variant="h5" color={palette.grey[500]}>
                    No trade activity to chart
                  </Typography>
                  <Typography variant="body2" color={palette.grey[600]} mt="0.5rem">
                    Place trades in the Simulator to see activity
                  </Typography>
                </Box>
              )}
            </DashboardBox>

            {/* RECENT TRADES TABLE */}
            <DashboardBox p="1.5rem">
              <Typography variant="h4" fontWeight="bold" color={palette.grey[100]} mb="1rem">
                Recent Trades
              </Typography>
              {tradeHistory?.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {["Date", "Ticker", "Type", "Shares", "Price", "Total"].map((h) => (
                          <TableCell
                            key={h}
                            sx={{
                              color: palette.grey[400],
                              borderBottom: `1px solid ${palette.grey[800]}`,
                              fontWeight: "bold",
                              fontSize: "12px",
                            }}
                          >
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tradeHistory.slice(0, 10).map((tx) => (
                        <TableRow key={tx._id} hover>
                          <TableCell
                            sx={{
                              color: palette.grey[300],
                              borderBottom: `1px solid ${palette.grey[800]}`,
                              fontSize: "12px",
                            }}
                          >
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell
                            sx={{
                              color: palette.primary[300],
                              fontWeight: "bold",
                              borderBottom: `1px solid ${palette.grey[800]}`,
                            }}
                          >
                            {tx.ticker}
                          </TableCell>
                          <TableCell sx={{ borderBottom: `1px solid ${palette.grey[800]}` }}>
                            <Chip
                              label={tx.type}
                              size="small"
                              sx={{
                                fontWeight: "bold",
                                fontSize: "11px",
                                backgroundColor:
                                  tx.type === "BUY"
                                    ? "rgba(18, 239, 200, 0.1)"
                                    : "rgba(239, 83, 80, 0.1)",
                                color: tx.type === "BUY" ? palette.primary[400] : "#ef5350",
                                border: `1px solid ${
                                  tx.type === "BUY"
                                    ? palette.primary[700]
                                    : "rgba(239,83,80,0.3)"
                                }`,
                              }}
                            />
                          </TableCell>
                          <TableCell
                            sx={{
                              color: palette.grey[200],
                              borderBottom: `1px solid ${palette.grey[800]}`,
                            }}
                          >
                            {tx.shares}
                          </TableCell>
                          <TableCell
                            sx={{
                              color: palette.grey[200],
                              borderBottom: `1px solid ${palette.grey[800]}`,
                            }}
                          >
                            ${tx.price?.toFixed(2)}
                          </TableCell>
                          <TableCell
                            sx={{
                              color: palette.grey[100],
                              fontWeight: "bold",
                              borderBottom: `1px solid ${palette.grey[800]}`,
                            }}
                          >
                            ${(tx.shares * tx.price)?.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box textAlign="center" py="3rem">
                  <Typography variant="h5" color={palette.grey[500]}>
                    No trades recorded yet
                  </Typography>
                </Box>
              )}
            </DashboardBox>
          </Box>
        )}

        {/* ============ TAB 3: MARKET WATCHLIST ============ */}
        {activeTab === 2 && (
          <Box display="flex" flexDirection="column" gap="1.5rem">
            <DashboardBox p="1.5rem">
              <FlexBetween mb="1.5rem">
                <Box>
                  <Typography variant="h4" fontWeight="bold" color={palette.grey[100]}>
                    Market Watchlist
                  </Typography>
                  <Typography variant="body2" color={palette.grey[500]}>
                    Live prices for popular stocks — click any ticker to trade it
                  </Typography>
                </Box>
                {watchlistLoading && <CircularProgress size={20} sx={{ color: palette.primary[400] }} />}
              </FlexBetween>

              {watchlist?.length > 0 ? (
                <Grid container spacing={2}>
                  {watchlist.map((stock) => {
                    const isPositive = stock.change >= 0;
                    return (
                      <Grid item xs={12} sm={6} md={3} key={stock.symbol}>
                        <Box
                          onClick={() => navigate("/simulator")}
                          sx={{
                            p: "1.25rem",
                            backgroundColor: "rgba(255,255,255,0.02)",
                            borderRadius: "0.75rem",
                            border: `1px solid ${palette.grey[800]}`,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              borderColor: palette.primary[600],
                              backgroundColor: "rgba(18, 239, 200, 0.03)",
                              transform: "translateY(-2px)",
                            },
                          }}
                        >
                          <FlexBetween mb="0.75rem">
                            <Typography variant="h4" fontWeight="bold" color={palette.primary[300]}>
                              {stock.symbol}
                            </Typography>
                            <ShowChartIcon sx={{ color: palette.grey[600], fontSize: "18px" }} />
                          </FlexBetween>

                          <Typography variant="h3" fontWeight="bold" color={palette.grey[100]} mb="0.5rem">
                            ${stock.price}
                          </Typography>

                          <Box display="flex" alignItems="center" gap="0.25rem">
                            {isPositive ? (
                              <TrendingUpIcon sx={{ color: palette.primary[400], fontSize: "16px" }} />
                            ) : (
                              <TrendingDownIcon sx={{ color: "#ef5350", fontSize: "16px" }} />
                            )}
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              color={isPositive ? palette.primary[400] : "#ef5350"}
                            >
                              {isPositive ? "+" : ""}
                              {stock.change} ({isPositive ? "+" : ""}
                              {stock.changePercent}%)
                            </Typography>
                          </Box>

                          {/* MINI SPARKLINE */}
                          {stock.sparkline?.length > 1 && (
                            <Box mt="0.75rem" height="40px">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stock.sparkline.map((v, i) => ({ v, i }))}>
                                  <Line
                                    type="monotone"
                                    dataKey="v"
                                    stroke={isPositive ? palette.primary[400] : "#ef5350"}
                                    strokeWidth={1.5}
                                    dot={false}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </Box>
                          )}
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              ) : watchlistLoading ? (
                <Box textAlign="center" py="4rem">
                  <CircularProgress sx={{ color: palette.primary[400] }} />
                  <Typography variant="h5" color={palette.grey[500]} mt="1rem">
                    Loading market data...
                  </Typography>
                </Box>
              ) : (
                <Box textAlign="center" py="4rem">
                  <VisibilityIcon sx={{ fontSize: "48px", color: palette.grey[700], mb: "1rem" }} />
                  <Typography variant="h5" color={palette.grey[500]}>
                    Watchlist unavailable
                  </Typography>
                </Box>
              )}
            </DashboardBox>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;
