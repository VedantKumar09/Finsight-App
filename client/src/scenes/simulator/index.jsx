import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  useTheme,
  TextField,
  Button,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Divider,
  Fade,
  Tooltip,
  IconButton,
  LinearProgress,
  Slider,
} from "@mui/material";
import DashboardBox from "@/components/DashboardBox";
import FlexBetween from "@/components/FlexBetween";
import {
  useLazySearchStockQuery,
  useBuyStockMutation,
  useSellStockMutation,
  useGetPortfolioQuery,
  useGetTradeHistoryQuery,
} from "@/state/api";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import SearchIcon from "@mui/icons-material/Search";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SellIcon from "@mui/icons-material/Sell";
import RefreshIcon from "@mui/icons-material/Refresh";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import ReplayIcon from "@mui/icons-material/Replay";
import SpeedIcon from "@mui/icons-material/Speed";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import PieChartIcon from "@mui/icons-material/PieChart";
import TimelineIcon from "@mui/icons-material/Timeline";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ShowChartIcon from "@mui/icons-material/ShowChart";

// ── Constants ──────────────────────────────────────────────────────────────

const RANGE_OPTIONS = [
  { value: "1d", label: "1D" },
  { value: "5d", label: "5D" },
  { value: "1mo", label: "1M" },
  { value: "3mo", label: "3M" },
  { value: "6mo", label: "6M" },
  { value: "1y", label: "1Y" },
];

const POPULAR_STOCKS = [
  {
    sector: "Tech",
    icon: "🖥️",
    color: "#7c4dff",
    tickers: ["AAPL", "MSFT", "GOOGL", "NVDA", "META", "AMZN"],
  },
  {
    sector: "Finance",
    icon: "💰",
    color: "#00e676",
    tickers: ["JPM", "GS", "V", "MA", "BAC"],
  },
  {
    sector: "Healthcare",
    icon: "🏥",
    color: "#29b6f6",
    tickers: ["JNJ", "PFE", "UNH", "ABBV"],
  },
  {
    sector: "Energy",
    icon: "⚡",
    color: "#ffa726",
    tickers: ["XOM", "CVX", "NEE"],
  },
  {
    sector: "Consumer",
    icon: "🛒",
    color: "#ef5350",
    tickers: ["TSLA", "NKE", "SBUX", "MCD"],
  },
];

const SECTOR_MAP = {
  AAPL: "Technology", MSFT: "Technology", GOOGL: "Technology", GOOG: "Technology",
  NVDA: "Technology", META: "Technology", AMZN: "Technology", INTC: "Technology",
  AMD: "Technology", CRM: "Technology", ORCL: "Technology", ADBE: "Technology",
  JPM: "Finance", GS: "Finance", V: "Finance", MA: "Finance", BAC: "Finance",
  WFC: "Finance", C: "Finance", MS: "Finance", AXP: "Finance", BLK: "Finance",
  JNJ: "Healthcare", PFE: "Healthcare", UNH: "Healthcare", ABBV: "Healthcare",
  MRK: "Healthcare", LLY: "Healthcare", TMO: "Healthcare", ABT: "Healthcare",
  XOM: "Energy", CVX: "Energy", NEE: "Energy", COP: "Energy", SLB: "Energy",
  TSLA: "Consumer", NKE: "Consumer", SBUX: "Consumer", MCD: "Consumer",
  WMT: "Consumer", KO: "Consumer", PEP: "Consumer", PG: "Consumer",
  DIS: "Consumer", NFLX: "Consumer", COST: "Consumer",
};

const SECTOR_COLORS = {
  Technology: "#7c4dff",
  Finance: "#00e676",
  Healthcare: "#29b6f6",
  Energy: "#ffa726",
  Consumer: "#ef5350",
  Other: "#78909c",
};

const AUTOPLAY_SPEED = 2000; // 2 seconds per day — slow enough to read each day

const INITIAL_CAPITAL = 100000;

// ── Component ──────────────────────────────────────────────────────────────

const Simulator = () => {
  const { palette } = useTheme();
  const [ticker, setTicker] = useState("");
  const [searchedTicker, setSearchedTicker] = useState("");
  const [range, setRange] = useState("1mo");
  const [orderType, setOrderType] = useState("BUY");
  const [shares, setShares] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [orderFeedback, setOrderFeedback] = useState(null);

  // Timelapse state
  const [timelapseActive, setTimelapseActive] = useState(false);
  const [timelapsePlaying, setTimelapsePlaying] = useState(false);
  const [timelapseDay, setTimelapseDay] = useState(0);
  const [timelapseSpeed, setTimelapseSpeed] = useState(AUTOPLAY_SPEED);
  const [timelapseData, setTimelapseData] = useState(null);
  const [timelapseLoading, setTimelapseLoading] = useState(false);
  const [timelapseLog, setTimelapseLog] = useState([]);
  const [timelapseError, setTimelapseError] = useState("");
  const timerRef = useRef(null);
  const logEndRef = useRef(null);

  // RTK Query hooks
  const [triggerSearch, { data: stockData, isFetching: isSearching, error: searchError }] =
    useLazySearchStockQuery();
  const [buyStock, { isLoading: isBuying }] = useBuyStockMutation();
  const [sellStock, { isLoading: isSelling }] = useSellStockMutation();
  const { data: portfolio, refetch: refetchPortfolio } = useGetPortfolioQuery();
  const { data: tradeHistory } = useGetTradeHistoryQuery();

  const intervalForRange = (r) => {
    if (r === "1d") return "5m";
    if (r === "5d") return "15m";
    return "1d";
  };

  const handleSearch = (overrideTicker) => {
    const t = overrideTicker || ticker;
    if (!t.trim()) return;
    const upper = t.trim().toUpperCase();
    setTicker(upper);
    setSearchedTicker(upper);
    triggerSearch({ ticker: upper, range, interval: intervalForRange(range) });
  };

  const handleQuickSelect = (t) => {
    setTicker(t);
    setSearchedTicker(t);
    triggerSearch({ ticker: t, range, interval: intervalForRange(range) });
  };

  const handleRangeChange = (newRange) => {
    setRange(newRange);
    if (searchedTicker) {
      triggerSearch({
        ticker: searchedTicker,
        range: newRange,
        interval: intervalForRange(newRange),
      });
    }
  };

  const handleOrder = async () => {
    if (!shares || parseInt(shares) <= 0 || !stockData) return;
    setOrderFeedback(null);

    try {
      const params = {
        ticker: stockData.symbol,
        shares: parseInt(shares),
        price: stockData.price,
      };
      const result =
        orderType === "BUY" ? await buyStock(params).unwrap() : await sellStock(params).unwrap();

      setOrderFeedback({ type: "success", message: result.message });
      setShares("");
      refetchPortfolio();
    } catch (err) {
      setOrderFeedback({
        type: "error",
        message: err?.data?.message || "Order failed. Please try again.",
      });
    }
  };

  const orderTotal = useMemo(() => {
    if (!shares || !stockData) return 0;
    return (parseInt(shares) * stockData.price).toFixed(2);
  }, [shares, stockData]);

  const isPositiveChange = stockData?.change >= 0;

  // ── Analytics Computations ─────────────────────────────────────────────

  const analytics = useMemo(() => {
    if (!portfolio) return null;

    const totalValue = portfolio.totalValue || INITIAL_CAPITAL;
    const totalReturn = ((totalValue - INITIAL_CAPITAL) / INITIAL_CAPITAL) * 100;
    const holdings = portfolio.holdings || [];

    // Best / Worst performer
    let best = null, worst = null;
    holdings.forEach((h) => {
      const pct = parseFloat(h.gainLossPercent) || 0;
      if (!best || pct > parseFloat(best.gainLossPercent)) best = h;
      if (!worst || pct < parseFloat(worst.gainLossPercent)) worst = h;
    });

    // Compute daily returns from trade history for volatility
    const trades = tradeHistory || [];
    const dailyValues = {};
    let runningCash = INITIAL_CAPITAL;
    const holdingsMap = {};

    // Sort trades by date
    const sortedTrades = [...trades].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    sortedTrades.forEach((tx) => {
      const date = new Date(tx.createdAt).toLocaleDateString();
      const cost = tx.shares * tx.price;
      if (tx.type === "BUY") {
        runningCash -= cost;
        holdingsMap[tx.ticker] = (holdingsMap[tx.ticker] || 0) + tx.shares;
      } else {
        runningCash += cost;
        holdingsMap[tx.ticker] = (holdingsMap[tx.ticker] || 0) - tx.shares;
      }
      // Approximate portfolio value at trade time
      let holdingsValue = 0;
      Object.entries(holdingsMap).forEach(([, s]) => {
        holdingsValue += Math.abs(s) * (tx.price || 0);
      });
      dailyValues[date] = runningCash + holdingsValue;
    });

    const valueHistory = Object.values(dailyValues);
    let volatility = 0;
    let maxDrawdown = 0;
    let sharpeRatio = 0;

    if (valueHistory.length > 1) {
      // Daily returns
      const returns = [];
      for (let i = 1; i < valueHistory.length; i++) {
        returns.push((valueHistory[i] - valueHistory[i - 1]) / valueHistory[i - 1]);
      }

      // Volatility (annualized std dev)
      const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
      const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;
      volatility = Math.sqrt(variance) * Math.sqrt(252) * 100;

      // Max Drawdown
      let peak = valueHistory[0];
      for (const val of valueHistory) {
        if (val > peak) peak = val;
        const dd = ((peak - val) / peak) * 100;
        if (dd > maxDrawdown) maxDrawdown = dd;
      }

      // Sharpe Ratio (assume 5% risk-free rate)
      const avgReturn = mean * 252;
      const annualVol = Math.sqrt(variance) * Math.sqrt(252);
      sharpeRatio = annualVol > 0 ? (avgReturn - 0.05) / annualVol : 0;
    }

    return {
      totalReturn: totalReturn.toFixed(2),
      totalValue: totalValue.toLocaleString(),
      buyingPower: (portfolio.buyingPower || 0).toLocaleString(),
      bestPerformer: best,
      worstPerformer: worst,
      volatility: volatility.toFixed(2),
      maxDrawdown: maxDrawdown.toFixed(2),
      sharpeRatio: sharpeRatio.toFixed(3),
      holdingsCount: holdings.length,
      tradesCount: trades.length,
    };
  }, [portfolio, tradeHistory]);

  // ── Sector Allocation ──────────────────────────────────────────────────

  const sectorAllocation = useMemo(() => {
    if (!portfolio?.holdings?.length) return [];
    const sectorTotals = {};
    let total = 0;

    portfolio.holdings.forEach((h) => {
      const sector = SECTOR_MAP[h.ticker] || "Other";
      const val = parseFloat(h.currentValue) || 0;
      sectorTotals[sector] = (sectorTotals[sector] || 0) + val;
      total += val;
    });

    return Object.entries(sectorTotals)
      .map(([sector, value]) => ({
        name: sector,
        value: parseFloat(value.toFixed(2)),
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : "0",
        color: SECTOR_COLORS[sector] || SECTOR_COLORS.Other,
      }))
      .sort((a, b) => b.value - a.value);
  }, [portfolio]);

  // ── Timelapse Engine ───────────────────────────────────────────────────

  const startTimelapse = useCallback(async () => {
    if (!portfolio?.holdings?.length) return;
    setTimelapseLoading(true);
    setTimelapseLog([]);
    setTimelapseError("");

    try {
      const rawBaseUrl = import.meta.env.VITE_BASE_URL || "";
      const baseUrl = rawBaseUrl.endsWith("/") ? rawBaseUrl : `${rawBaseUrl}/`;
      const token = localStorage.getItem("token");
      const headers = token ? { authorization: `Bearer ${token}` } : {};

      // Fetch 3mo historical data for each holding
      const holdingTickers = portfolio.holdings.map((h) => h.ticker);

      const responses = await Promise.all(
        holdingTickers.map((t) =>
          fetch(`${baseUrl}market/search/${t}?range=3mo&interval=1d`, { headers })
            .then((r) => r.json())
            .catch(() => null)
        )
      );

      // Also try fetching S&P 500 benchmark (may fail — that's OK)
      let spResponse = null;
      try {
        const spRes = await fetch(
          `${baseUrl}market/search/%5EGSPC?range=3mo&interval=1d`,
          { headers }
        );
        spResponse = await spRes.json();
      } catch {
        // S&P 500 fetch failed — we'll run without benchmark
      }

      const historicalData = {};
      holdingTickers.forEach((t, i) => {
        if (responses[i]?.history?.length) {
          historicalData[t] = responses[i].history;
        }
      });
      if (spResponse?.history?.length) {
        historicalData["SP500"] = spResponse.history;
      }

      // Check we have at least some historical data
      if (Object.keys(historicalData).length === 0 ||
          !holdingTickers.some((t) => historicalData[t])) {
        throw new Error("No historical data could be fetched for your holdings.");
      }

      // Normalize to common date range (only from holding tickers, not benchmark)
      const allDates = new Set();
      holdingTickers.forEach((t) => {
        if (historicalData[t]) {
          historicalData[t].forEach((d) => allDates.add(d.date));
        }
      });
      
      // Sort dates chronologically
      const sortedDates = [...allDates].sort((a, b) => new Date(a) - new Date(b));

      if (sortedDates.length === 0) {
        throw new Error("No chronological trading dates found in historical data.");
      }

      // Build day-by-day portfolio value
      const dailySnapshots = sortedDates.map((date) => {
        let portfolioValue = portfolio.buyingPower || 0;
        const holdingDetails = {};

        portfolio.holdings.forEach((h) => {
          const hist = historicalData[h.ticker];
          if (!hist) return;
          
          // Find the price on or before this date
          let price = parseFloat(h.currentPrice) || 0;
          if (hist.length > 0) {
            const targetTime = new Date(date).getTime();
            let bestPrice = hist[0].price;
            for (const entry of hist) {
              const entryTime = new Date(entry.date).getTime();
              if (entryTime <= targetTime) {
                bestPrice = entry.price;
              } else {
                break;
              }
            }
            price = bestPrice;
          }

          const value = h.shares * price;
          portfolioValue += value;
          holdingDetails[h.ticker] = {
            price,
            value,
            change: ((price - parseFloat(h.averagePrice)) / parseFloat(h.averagePrice) * 100).toFixed(2),
          };
        });

        // S&P 500 value for benchmark (optional)
        const spHist = historicalData["SP500"];
        let spPrice = null;
        if (spHist && spHist.length > 0) {
          const targetTime = new Date(date).getTime();
          let bestPrice = spHist[0].price;
          for (const entry of spHist) {
            const entryTime = new Date(entry.date).getTime();
            if (entryTime <= targetTime) {
              bestPrice = entry.price;
            } else {
              break;
            }
          }
          spPrice = bestPrice;
        }

        return {
          date,
          portfolioValue: parseFloat(portfolioValue.toFixed(2)),
          holdingDetails,
          spPrice,
        };
      });

      // Always compute portfolio returns; benchmark is optional
      if (dailySnapshots.length > 0) {
        const basePortfolio = dailySnapshots[0].portfolioValue;
        const baseSpPrice = dailySnapshots[0].spPrice;

        dailySnapshots.forEach((snap) => {
          snap.portfolioReturn = basePortfolio > 0
            ? ((snap.portfolioValue - basePortfolio) / basePortfolio * 100).toFixed(2)
            : "0.00";
          snap.benchmarkReturn = (baseSpPrice && snap.spPrice)
            ? (((snap.spPrice - baseSpPrice) / baseSpPrice) * 100).toFixed(2)
            : null;
        });
      }

      setTimelapseData(dailySnapshots);
      setTimelapseDay(0);
      setTimelapseActive(true);
      setTimelapsePlaying(false);
    } catch (err) {
      console.error("Timelapse error:", err);
      setTimelapseError(err.message || "Failed to load timelapse data. Please check your internet connection.");
    } finally {
      setTimelapseLoading(false);
    }
  }, [portfolio]);

  // Timelapse interval
  useEffect(() => {
    if (timelapsePlaying && timelapseData && timelapseDay < timelapseData.length - 1) {
      timerRef.current = setInterval(() => {
        setTimelapseDay((prev) => {
          const next = prev + 1;
          if (next >= timelapseData.length - 1) {
            clearInterval(timerRef.current);
            setTimelapsePlaying(false);
          }
          return Math.min(next, timelapseData.length - 1);
        });
      }, timelapseSpeed);
    }
    return () => clearInterval(timerRef.current);
  }, [timelapsePlaying, timelapseSpeed, timelapseData, timelapseDay]);

  // Generate log entries as days advance
  useEffect(() => {
    if (!timelapseData || timelapseDay === 0) return;
    const snap = timelapseData[timelapseDay];
    const prevSnap = timelapseData[timelapseDay - 1];
    if (!snap || !prevSnap) return;

    const dailyChange = snap.portfolioValue - prevSnap.portfolioValue;
    const dailyPct = ((dailyChange / prevSnap.portfolioValue) * 100).toFixed(2);

    // Find biggest mover
    let biggestMover = "";
    let biggestMove = 0;
    if (snap.holdingDetails && prevSnap.holdingDetails) {
      Object.entries(snap.holdingDetails).forEach(([t, detail]) => {
        const prevDetail = prevSnap.holdingDetails[t];
        if (prevDetail) {
          const move = ((detail.price - prevDetail.price) / prevDetail.price) * 100;
          if (Math.abs(move) > Math.abs(biggestMove)) {
            biggestMove = move;
            biggestMover = t;
          }
        }
      });
    }

    const entry = {
      day: timelapseDay,
      date: snap.date,
      value: snap.portfolioValue,
      change: dailyChange.toFixed(2),
      changePct: dailyPct,
      mover: biggestMover,
      moverChange: biggestMove.toFixed(2),
    };

    setTimelapseLog((prev) => [...prev, entry]);
  }, [timelapseDay, timelapseData]);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [timelapseLog]);

  const resetTimelapse = () => {
    clearInterval(timerRef.current);
    setTimelapsePlaying(false);
    setTimelapseDay(0);
    setTimelapseLog([]);
    setTimelapseActive(false);
    setTimelapseData(null);
    setTimelapseError("");
  };

  const toggleTimelapse = () => {
    if (timelapsePlaying) {
      clearInterval(timerRef.current);
      setTimelapsePlaying(false);
    } else if (timelapseDay >= (timelapseData?.length || 0) - 1) {
      // Restart
      setTimelapseDay(0);
      setTimelapseLog([]);
      setTimelapsePlaying(true);
    } else {
      setTimelapsePlaying(true);
    }
  };

  const stepDay = (direction) => {
    if (!timelapseData) return;
    clearInterval(timerRef.current);
    setTimelapsePlaying(false);
    setTimelapseDay((prev) => {
      const next = prev + direction;
      return Math.max(0, Math.min(next, timelapseData.length - 1));
    });
  };

  const handleDaySlider = (_, newValue) => {
    clearInterval(timerRef.current);
    setTimelapsePlaying(false);
    setTimelapseDay(newValue);
  };

  // Chart data for timelapse (only up to current day)
  const timelapseChartData = useMemo(() => {
    if (!timelapseData) return [];
    return timelapseData.slice(0, timelapseDay + 1).map((s) => ({
      date: s.date,
      portfolio: parseFloat(s.portfolioReturn),
      benchmark: s.benchmarkReturn ? parseFloat(s.benchmarkReturn) : null,
    }));
  }, [timelapseData, timelapseDay]);

  // ── Render Helpers ─────────────────────────────────────────────────────

  const KpiCard = ({ title, value, subtitle, color, icon }) => (
    <DashboardBox p="1rem" height="100%">
      <Box display="flex" alignItems="center" gap="0.5rem" mb="0.5rem">
        {icon}
        <Typography variant="h6" color={palette.grey[500]}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h3" fontWeight="bold" color={color || palette.grey[100]}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color={palette.grey[500]} mt="0.25rem">
          {subtitle}
        </Typography>
      )}
    </DashboardBox>
  );

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
          Virtual Stock Simulator
        </Typography>
        <Chip
          icon={<AccountBalanceWalletIcon />}
          label={`Buying Power: $${portfolio?.buyingPower?.toLocaleString() || "100,000.00"}`}
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
      </FlexBetween>

      {/* QUICK-SELECT STOCK RECOMMENDATIONS */}
      <DashboardBox p="1.25rem">
        <Typography
          variant="h5"
          fontWeight="bold"
          color={palette.grey[300]}
          mb="0.75rem"
          display="flex"
          alignItems="center"
          gap="0.5rem"
        >
          <ShowChartIcon sx={{ color: palette.primary[400], fontSize: 20 }} />
          Popular Stocks
        </Typography>
        <Box display="flex" flexDirection="column" gap="0.75rem">
          {POPULAR_STOCKS.map((group) => (
            <Box key={group.sector} display="flex" alignItems="center" gap="0.75rem">
              <Typography
                variant="caption"
                color={palette.grey[500]}
                sx={{ minWidth: 90, fontWeight: "bold" }}
              >
                {group.icon} {group.sector}
              </Typography>
              <Box display="flex" gap="0.5rem" flexWrap="wrap">
                {group.tickers.map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    size="small"
                    clickable
                    onClick={() => handleQuickSelect(t)}
                    sx={{
                      fontWeight: "bold",
                      fontSize: "0.75rem",
                      backgroundColor:
                        searchedTicker === t
                          ? `${group.color}22`
                          : "rgba(255,255,255,0.03)",
                      color:
                        searchedTicker === t ? group.color : palette.grey[300],
                      border: `1px solid ${
                        searchedTicker === t ? group.color + "66" : palette.grey[800]
                      }`,
                      transition: "all 0.2s ease",
                      "&:hover": {
                        backgroundColor: `${group.color}15`,
                        borderColor: group.color + "44",
                        transform: "translateY(-1px)",
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </DashboardBox>

      {/* SEARCH BAR */}
      <DashboardBox p="1rem 1.5rem">
        <Box display="flex" gap="1rem" alignItems="center">
          <TextField
            size="small"
            placeholder="Enter ticker symbol (e.g. AAPL, TSLA, GOOGL)"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: palette.grey[500] }} />
                </InputAdornment>
              ),
            }}
            sx={{
              flex: 1,
              "& .MuiOutlinedInput-root": {
                color: palette.grey[100],
                "& fieldset": { borderColor: palette.grey[700] },
                "&:hover fieldset": { borderColor: palette.primary[500] },
                "&.Mui-focused fieldset": { borderColor: palette.primary[400] },
              },
              "& input::placeholder": { color: palette.grey[600] },
            }}
          />
          <Button
            variant="contained"
            onClick={() => handleSearch()}
            disabled={isSearching || !ticker.trim()}
            sx={{
              px: "2rem",
              backgroundColor: palette.primary[600],
              fontWeight: "bold",
              "&:hover": { backgroundColor: palette.primary[500] },
            }}
          >
            {isSearching ? <CircularProgress size={20} color="inherit" /> : "Search"}
          </Button>
        </Box>
      </DashboardBox>

      {/* SEARCH ERROR */}
      {searchError && (
        <Alert severity="error" sx={{ backgroundColor: "rgba(211, 47, 47, 0.1)" }}>
          {searchError?.data?.message || "Failed to fetch stock data. Try a valid ticker."}
        </Alert>
      )}

      {/* STOCK DATA DISPLAY */}
      {stockData && (
        <Fade in timeout={500}>
          <Box display="grid" gap="1.5rem" gridTemplateColumns="1fr 350px">
            {/* LEFT: CHART */}
            <DashboardBox p="1.5rem">
              {/* Stock Header */}
              <FlexBetween mb="1rem">
                <Box>
                  <Typography variant="h3" fontWeight="bold" color={palette.grey[100]}>
                    {stockData.symbol}
                  </Typography>
                  <Typography variant="h6" color={palette.grey[500]}>
                    {stockData.exchange} · {stockData.currency}
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="h2" fontWeight="bold" color={palette.grey[100]}>
                    ${stockData.price}
                  </Typography>
                  <Box display="flex" alignItems="center" justifyContent="flex-end" gap="0.25rem">
                    {isPositiveChange ? (
                      <TrendingUpIcon sx={{ color: palette.primary[400], fontSize: "18px" }} />
                    ) : (
                      <TrendingDownIcon sx={{ color: "#ef5350", fontSize: "18px" }} />
                    )}
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      color={isPositiveChange ? palette.primary[400] : "#ef5350"}
                    >
                      {isPositiveChange ? "+" : ""}
                      {stockData.change} ({isPositiveChange ? "+" : ""}
                      {stockData.changePercent}%)
                    </Typography>
                  </Box>
                </Box>
              </FlexBetween>

              {/* Range Selector */}
              <Box display="flex" gap="0.5rem" mb="1rem">
                {RANGE_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    size="small"
                    variant={range === opt.value ? "contained" : "outlined"}
                    onClick={() => handleRangeChange(opt.value)}
                    sx={{
                      minWidth: "42px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      backgroundColor:
                        range === opt.value ? palette.primary[600] : "transparent",
                      borderColor: palette.grey[700],
                      color:
                        range === opt.value ? palette.grey[900] : palette.grey[400],
                      "&:hover": {
                        backgroundColor:
                          range === opt.value
                            ? palette.primary[500]
                            : "rgba(255,255,255,0.04)",
                        borderColor: palette.primary[500],
                      },
                    }}
                  >
                    {opt.label}
                  </Button>
                ))}
              </Box>

              {/* Price Chart */}
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={stockData.history}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={isPositiveChange ? palette.primary[400] : "#ef5350"}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={isPositiveChange ? palette.primary[400] : "#ef5350"}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={palette.grey[800]} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: palette.grey[500], fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: palette.grey[800] }}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fill: palette.grey[500], fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: palette.grey[800] }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: palette.grey[900],
                      border: `1px solid ${palette.grey[700]}`,
                      borderRadius: "8px",
                      color: palette.grey[100],
                    }}
                    formatter={(value) => [`$${value}`, "Price"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={isPositiveChange ? palette.primary[400] : "#ef5350"}
                    strokeWidth={2}
                    fill="url(#priceGradient)"
                    dot={false}
                    animationDuration={800}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </DashboardBox>

            {/* RIGHT: ORDER PANEL */}
            <DashboardBox p="1.5rem" display="flex" flexDirection="column">
              <Typography variant="h4" fontWeight="bold" color={palette.grey[100]} mb="1rem">
                Place Order
              </Typography>

              {/* Buy/Sell Toggle */}
              <ToggleButtonGroup
                value={orderType}
                exclusive
                onChange={(_, v) => v && setOrderType(v)}
                fullWidth
                sx={{ mb: "1.5rem" }}
              >
                <ToggleButton
                  value="BUY"
                  sx={{
                    fontWeight: "bold",
                    color: orderType === "BUY" ? "#0d0d0d" : palette.primary[400],
                    backgroundColor:
                      orderType === "BUY" ? palette.primary[400] : "transparent",
                    borderColor: palette.grey[700],
                    "&.Mui-selected": {
                      backgroundColor: palette.primary[500],
                      color: "#0d0d0d",
                      "&:hover": { backgroundColor: palette.primary[400] },
                    },
                    "&:hover": { backgroundColor: "rgba(18, 239, 200, 0.08)" },
                  }}
                >
                  <ShoppingCartIcon sx={{ mr: "0.5rem", fontSize: "18px" }} />
                  Buy
                </ToggleButton>
                <ToggleButton
                  value="SELL"
                  sx={{
                    fontWeight: "bold",
                    color: orderType === "SELL" ? "#0d0d0d" : "#ef5350",
                    backgroundColor: orderType === "SELL" ? "#ef5350" : "transparent",
                    borderColor: palette.grey[700],
                    "&.Mui-selected": {
                      backgroundColor: "#ef5350",
                      color: "#0d0d0d",
                      "&:hover": { backgroundColor: "#e53935" },
                    },
                    "&:hover": { backgroundColor: "rgba(239, 83, 80, 0.08)" },
                  }}
                >
                  <SellIcon sx={{ mr: "0.5rem", fontSize: "18px" }} />
                  Sell
                </ToggleButton>
              </ToggleButtonGroup>

              {/* Price Display */}
              <Box
                p="1rem"
                mb="1rem"
                sx={{
                  backgroundColor: "rgba(255,255,255,0.02)",
                  borderRadius: "0.75rem",
                  border: `1px solid ${palette.grey[800]}`,
                }}
              >
                <FlexBetween>
                  <Typography variant="h6" color={palette.grey[500]}>
                    Market Price
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color={palette.grey[100]}>
                    ${stockData.price}
                  </Typography>
                </FlexBetween>
              </Box>

              {/* Shares Input */}
              <TextField
                label="Number of Shares"
                type="number"
                size="small"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                fullWidth
                inputProps={{ min: 1 }}
                sx={{
                  mb: "1rem",
                  "& .MuiOutlinedInput-root": {
                    color: palette.grey[100],
                    "& fieldset": { borderColor: palette.grey[700] },
                    "&:hover fieldset": { borderColor: palette.primary[500] },
                    "&.Mui-focused fieldset": { borderColor: palette.primary[400] },
                  },
                  "& .MuiInputLabel-root": { color: palette.grey[500] },
                }}
              />

              {/* Order Summary */}
              <Box
                p="1rem"
                mb="1.5rem"
                sx={{
                  backgroundColor: "rgba(255,255,255,0.02)",
                  borderRadius: "0.75rem",
                  border: `1px solid ${palette.grey[800]}`,
                }}
              >
                <FlexBetween mb="0.5rem">
                  <Typography variant="h6" color={palette.grey[500]}>
                    Estimated Total
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color={palette.primary[300]}>
                    ${parseFloat(orderTotal).toLocaleString()}
                  </Typography>
                </FlexBetween>
                {orderType === "BUY" && portfolio && (
                  <Typography variant="body2" color={palette.grey[600]} fontSize="11px">
                    Available: ${portfolio.buyingPower?.toLocaleString()}
                  </Typography>
                )}
              </Box>

              {/* Order Feedback */}
              {orderFeedback && (
                <Alert
                  severity={orderFeedback.type}
                  onClose={() => setOrderFeedback(null)}
                  sx={{ mb: "1rem", fontSize: "12px" }}
                >
                  {orderFeedback.message}
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                variant="contained"
                fullWidth
                onClick={handleOrder}
                disabled={
                  !shares || parseInt(shares) <= 0 || isBuying || isSelling
                }
                sx={{
                  py: "0.75rem",
                  fontWeight: "bold",
                  fontSize: "14px",
                  backgroundColor:
                    orderType === "BUY" ? palette.primary[500] : "#ef5350",
                  "&:hover": {
                    backgroundColor:
                      orderType === "BUY" ? palette.primary[400] : "#e53935",
                  },
                  "&.Mui-disabled": {
                    backgroundColor: palette.grey[800],
                    color: palette.grey[600],
                  },
                }}
              >
                {isBuying || isSelling ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  `${orderType} ${shares || 0} Shares`
                )}
              </Button>

              {/* Portfolio Value */}
              {portfolio && (
                <Box mt="auto" pt="1.5rem">
                  <Divider sx={{ borderColor: palette.grey[800], mb: "1rem" }} />
                  <FlexBetween>
                    <Typography variant="h6" color={palette.grey[500]}>
                      Portfolio Value
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color={palette.primary[300]}>
                      ${portfolio.totalValue?.toLocaleString()}
                    </Typography>
                  </FlexBetween>
                </Box>
              )}
            </DashboardBox>
          </Box>
        </Fade>
      )}

      {/* PORTFOLIO, HISTORY, ANALYTICS & TIMELAPSE TABS */}
      <DashboardBox p="1.5rem">
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            mb: "1rem",
            "& .MuiTabs-indicator": {
              backgroundColor: palette.primary[500],
              height: "3px",
            },
            "& .MuiTab-root": {
              fontSize: "13px",
              fontWeight: "bold",
              textTransform: "none",
              color: palette.grey[500],
              "&.Mui-selected": { color: palette.primary[300] },
            },
          }}
        >
          <Tab label="My Holdings" />
          <Tab label="Trade History" />
          <Tab label="Analytics" icon={<AnalyticsIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
          <Tab label="Timelapse" icon={<TimelineIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
        </Tabs>

        {/* ═══ HOLDINGS TAB ═══ */}
        {activeTab === 0 && (
          <Box>
            {portfolio?.holdings?.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {["Ticker", "Shares", "Avg Price", "Current", "Value", "P&L", "P&L %"].map(
                        (head) => (
                          <TableCell
                            key={head}
                            sx={{
                              color: palette.grey[400],
                              borderBottom: `1px solid ${palette.grey[800]}`,
                              fontWeight: "bold",
                              fontSize: "12px",
                            }}
                          >
                            {head}
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
                            ${h.averagePrice}
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
                            {isProfit ? "+" : ""}${h.gainLoss}
                          </TableCell>
                          <TableCell
                            sx={{
                              color: isProfit ? palette.primary[400] : "#ef5350",
                              fontWeight: "bold",
                              borderBottom: `1px solid ${palette.grey[800]}`,
                            }}
                          >
                            {isProfit ? "+" : ""}
                            {h.gainLossPercent}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box textAlign="center" py="3rem">
                <AccountBalanceWalletIcon
                  sx={{ fontSize: "48px", color: palette.grey[700], mb: "1rem" }}
                />
                <Typography variant="h5" color={palette.grey[500]}>
                  No holdings yet. Search for a stock and place your first trade!
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* ═══ TRADE HISTORY TAB ═══ */}
        {activeTab === 1 && (
          <Box>
            {tradeHistory?.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {["Date", "Ticker", "Type", "Shares", "Price", "Total"].map((head) => (
                        <TableCell
                          key={head}
                          sx={{
                            color: palette.grey[400],
                            borderBottom: `1px solid ${palette.grey[800]}`,
                            fontWeight: "bold",
                            fontSize: "12px",
                          }}
                        >
                          {head}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tradeHistory.map((tx) => (
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
                        <TableCell
                          sx={{
                            borderBottom: `1px solid ${palette.grey[800]}`,
                          }}
                        >
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
                                tx.type === "BUY" ? palette.primary[700] : "rgba(239,83,80,0.3)"
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
                  No trades yet. Place your first order above!
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* ═══ ANALYTICS TAB ═══ */}
        {activeTab === 2 && (
          <Fade in timeout={400}>
            <Box>
              {analytics && analytics.holdingsCount > 0 ? (
                <Box display="flex" flexDirection="column" gap="1.5rem">
                  {/* KPI Row */}
                  <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap="1rem">
                    <KpiCard
                      title="Total Return"
                      value={`${parseFloat(analytics.totalReturn) >= 0 ? "+" : ""}${analytics.totalReturn}%`}
                      subtitle={`Portfolio: $${analytics.totalValue}`}
                      color={parseFloat(analytics.totalReturn) >= 0 ? palette.primary[400] : "#ef5350"}
                      icon={<TrendingUpIcon sx={{ color: palette.primary[400], fontSize: 18 }} />}
                    />
                    <KpiCard
                      title="Sharpe Ratio"
                      value={analytics.sharpeRatio}
                      subtitle="Risk-adjusted return"
                      color={parseFloat(analytics.sharpeRatio) > 0 ? "#7c4dff" : "#ef5350"}
                      icon={<AnalyticsIcon sx={{ color: "#7c4dff", fontSize: 18 }} />}
                    />
                    <KpiCard
                      title="Portfolio Volatility"
                      value={`${analytics.volatility}%`}
                      subtitle="Annualized std deviation"
                      color="#ffa726"
                      icon={<SpeedIcon sx={{ color: "#ffa726", fontSize: 18 }} />}
                    />
                  </Box>
                  <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap="1rem">
                    <KpiCard
                      title="Max Drawdown"
                      value={`-${analytics.maxDrawdown}%`}
                      subtitle="Largest peak-to-trough"
                      color="#ef5350"
                      icon={<TrendingDownIcon sx={{ color: "#ef5350", fontSize: 18 }} />}
                    />
                    <KpiCard
                      title="Best Performer"
                      value={analytics.bestPerformer?.ticker || "—"}
                      subtitle={
                        analytics.bestPerformer
                          ? `+${analytics.bestPerformer.gainLossPercent}%`
                          : ""
                      }
                      color="#00e676"
                      icon={<EmojiEventsIcon sx={{ color: "#00e676", fontSize: 18 }} />}
                    />
                    <KpiCard
                      title="Worst Performer"
                      value={analytics.worstPerformer?.ticker || "—"}
                      subtitle={
                        analytics.worstPerformer
                          ? `${analytics.worstPerformer.gainLossPercent}%`
                          : ""
                      }
                      color="#ef5350"
                      icon={<TrendingDownIcon sx={{ color: "#ef5350", fontSize: 18 }} />}
                    />
                  </Box>

                  {/* Sector Allocation */}
                  {sectorAllocation.length > 0 && (
                    <DashboardBox p="1.5rem">
                      <Typography
                        variant="h4"
                        fontWeight="bold"
                        color={palette.grey[100]}
                        mb="0.5rem"
                        display="flex"
                        alignItems="center"
                        gap="0.5rem"
                      >
                        <PieChartIcon sx={{ color: "#7c4dff" }} />
                        Sector Allocation
                      </Typography>
                      <Typography variant="body2" color={palette.grey[500]} mb="1rem">
                        Portfolio exposure breakdown by industry sector
                      </Typography>
                      <Box display="grid" gridTemplateColumns="280px 1fr" gap="2rem" alignItems="center">
                        <ResponsiveContainer width="100%" height={240}>
                          <PieChart>
                            <Pie
                              data={sectorAllocation}
                              innerRadius={65}
                              outerRadius={100}
                              paddingAngle={3}
                              dataKey="value"
                              animationDuration={800}
                            >
                              {sectorAllocation.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: palette.grey[900],
                                border: `1px solid ${palette.grey[700]}`,
                                borderRadius: "8px",
                              }}
                              formatter={(v, name) => [`$${v.toLocaleString()}`, name]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <Box display="flex" flexDirection="column" gap="0.75rem">
                          {sectorAllocation.map((s) => (
                            <Box key={s.name}>
                              <FlexBetween mb="0.25rem">
                                <Box display="flex" alignItems="center" gap="0.5rem">
                                  <Box
                                    sx={{
                                      width: 10,
                                      height: 10,
                                      borderRadius: "50%",
                                      backgroundColor: s.color,
                                    }}
                                  />
                                  <Typography variant="body2" color={palette.grey[200]} fontWeight="bold">
                                    {s.name}
                                  </Typography>
                                </Box>
                                <Typography variant="body2" color={palette.grey[400]}>
                                  {s.percentage}% · ${s.value.toLocaleString()}
                                </Typography>
                              </FlexBetween>
                              <LinearProgress
                                variant="determinate"
                                value={parseFloat(s.percentage)}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  backgroundColor: palette.grey[800],
                                  "& .MuiLinearProgress-bar": {
                                    backgroundColor: s.color,
                                    borderRadius: 3,
                                  },
                                }}
                              />
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    </DashboardBox>
                  )}
                </Box>
              ) : (
                <Box textAlign="center" py="3rem">
                  <AnalyticsIcon sx={{ fontSize: "48px", color: palette.grey[700], mb: "1rem" }} />
                  <Typography variant="h5" color={palette.grey[500]}>
                    Buy some stocks first to see portfolio analytics
                  </Typography>
                </Box>
              )}
            </Box>
          </Fade>
        )}

        {/* ═══ TIMELAPSE TAB ═══ */}
        {activeTab === 3 && (
          <Fade in timeout={400}>
            <Box>
              {timelapseError && (
                <Alert severity="error" sx={{ mb: "1rem", backgroundColor: "rgba(211, 47, 47, 0.1)" }} onClose={() => setTimelapseError("")}>
                  {timelapseError}
                </Alert>
              )}
              {portfolio?.holdings?.length > 0 ? (
                <Box display="flex" flexDirection="column" gap="1.5rem">
                  {/* Timelapse Controls */}
                  <DashboardBox p="1.25rem">
                    <FlexBetween>
                      <Box>
                        <Typography
                          variant="h4"
                          fontWeight="bold"
                          color={palette.grey[100]}
                          display="flex"
                          alignItems="center"
                          gap="0.5rem"
                        >
                          <TimelineIcon sx={{ color: "#7c4dff" }} />
                          Portfolio Timelapse
                        </Typography>
                        <Typography variant="body2" color={palette.grey[500]}>
                          Replay your portfolio performance over the last 90 days
                        </Typography>
                      </Box>

                      <Box display="flex" alignItems="center" gap="0.75rem">
                        {/* Launch / Reset */}
                        {!timelapseActive ? (
                          <Button
                            variant="contained"
                            onClick={startTimelapse}
                            disabled={timelapseLoading}
                            startIcon={
                              timelapseLoading ? (
                                <CircularProgress size={16} color="inherit" />
                              ) : (
                                <PlayArrowIcon />
                              )
                            }
                            sx={{
                              fontWeight: "bold",
                              background: "linear-gradient(135deg, #7c4dff, #651fff)",
                              "&:hover": {
                                background: "linear-gradient(135deg, #651fff, #536dfe)",
                              },
                            }}
                          >
                            {timelapseLoading ? "Loading Data..." : "Load Timelapse"}
                          </Button>
                        ) : (
                          <Tooltip title="Reset timelapse" arrow>
                            <IconButton
                              onClick={resetTimelapse}
                              sx={{
                                backgroundColor: "rgba(255,255,255,0.05)",
                                color: palette.grey[400],
                                "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                              }}
                            >
                              <ReplayIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </FlexBetween>

                    {/* Day-by-Day Controls */}
                    {timelapseActive && timelapseData && (
                      <Box mt="1.25rem">
                        {/* Current Day Header */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.75rem",
                            mb: "1rem",
                            p: "0.75rem",
                            borderRadius: "0.75rem",
                            backgroundColor: "rgba(124,77,255,0.06)",
                            border: "1px solid rgba(124,77,255,0.15)",
                          }}
                        >
                          <Typography variant="h3" fontWeight="bold" color="#7c4dff">
                            Day {timelapseDay + 1}
                          </Typography>
                          <Typography variant="h5" color={palette.grey[400]}>
                            of {timelapseData.length}
                          </Typography>
                          <Chip
                            label={timelapseData[timelapseDay]?.date}
                            size="small"
                            sx={{
                              fontWeight: "bold",
                              backgroundColor: "rgba(255,255,255,0.05)",
                              color: palette.grey[200],
                              border: `1px solid ${palette.grey[700]}`,
                            }}
                          />
                        </Box>

                        {/* Step Controls Row */}
                        <Box display="flex" alignItems="center" gap="0.75rem">
                          {/* Prev Day */}
                          <Tooltip title="Previous Day" arrow>
                            <span>
                              <IconButton
                                onClick={() => stepDay(-1)}
                                disabled={timelapseDay === 0}
                                sx={{
                                  backgroundColor: "rgba(255,255,255,0.05)",
                                  color: palette.grey[300],
                                  "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                                  "&.Mui-disabled": { color: palette.grey[700] },
                                }}
                              >
                                <SkipPreviousIcon />
                              </IconButton>
                            </span>
                          </Tooltip>

                          {/* Day Slider */}
                          <Slider
                            value={timelapseDay}
                            min={0}
                            max={timelapseData.length - 1}
                            step={1}
                            onChange={handleDaySlider}
                            valueLabelDisplay="auto"
                            valueLabelFormat={(v) => `Day ${v + 1}`}
                            sx={{
                              flex: 1,
                              color: "#7c4dff",
                              "& .MuiSlider-thumb": {
                                width: 18,
                                height: 18,
                                backgroundColor: "#7c4dff",
                                border: "2px solid #1f1f2e",
                                "&:hover": { boxShadow: "0 0 8px rgba(124,77,255,0.5)" },
                              },
                              "& .MuiSlider-track": {
                                background: "linear-gradient(90deg, #7c4dff, #651fff)",
                              },
                              "& .MuiSlider-rail": {
                                backgroundColor: palette.grey[800],
                              },
                              "& .MuiSlider-valueLabel": {
                                backgroundColor: "#7c4dff",
                                fontSize: "0.7rem",
                              },
                            }}
                          />

                          {/* Next Day */}
                          <Tooltip title="Next Day" arrow>
                            <span>
                              <IconButton
                                onClick={() => stepDay(1)}
                                disabled={timelapseDay >= timelapseData.length - 1}
                                sx={{
                                  backgroundColor: "rgba(255,255,255,0.05)",
                                  color: palette.grey[300],
                                  "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                                  "&.Mui-disabled": { color: palette.grey[700] },
                                }}
                              >
                                <SkipNextIcon />
                              </IconButton>
                            </span>
                          </Tooltip>

                          {/* Divider */}
                          <Divider orientation="vertical" flexItem sx={{ borderColor: palette.grey[800], mx: "0.25rem" }} />

                          {/* Auto-play toggle */}
                          <Tooltip title={timelapsePlaying ? "Pause auto-play" : "Auto-play (2s/day)"} arrow>
                            <IconButton
                              onClick={toggleTimelapse}
                              sx={{
                                backgroundColor: timelapsePlaying
                                  ? "rgba(124,77,255,0.2)"
                                  : "rgba(255,255,255,0.05)",
                                color: timelapsePlaying ? "#7c4dff" : palette.grey[400],
                                "&:hover": {
                                  backgroundColor: timelapsePlaying
                                    ? "rgba(124,77,255,0.3)"
                                    : "rgba(255,255,255,0.1)",
                                },
                              }}
                            >
                              {timelapsePlaying ? <PauseIcon /> : <PlayArrowIcon />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    )}
                  </DashboardBox>

                  {/* Timelapse Visualization */}
                  {timelapseActive && timelapseData && (
                    <>
                      {/* Live KPIs */}
                      <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap="1rem">
                        <KpiCard
                          title="Portfolio Value"
                          value={`$${timelapseData[timelapseDay]?.portfolioValue?.toLocaleString()}`}
                          color={palette.grey[100]}
                          icon={<AccountBalanceWalletIcon sx={{ color: palette.primary[400], fontSize: 18 }} />}
                        />
                        <KpiCard
                          title="Portfolio Return"
                          value={`${parseFloat(timelapseData[timelapseDay]?.portfolioReturn || 0) >= 0 ? "+" : ""}${timelapseData[timelapseDay]?.portfolioReturn || "0.00"}%`}
                          color={
                            parseFloat(timelapseData[timelapseDay]?.portfolioReturn || 0) >= 0
                              ? palette.primary[400]
                              : "#ef5350"
                          }
                          icon={<TrendingUpIcon sx={{ color: palette.primary[400], fontSize: 18 }} />}
                        />
                        <KpiCard
                          title="S&P 500 Return"
                          value={`${parseFloat(timelapseData[timelapseDay]?.benchmarkReturn || 0) >= 0 ? "+" : ""}${timelapseData[timelapseDay]?.benchmarkReturn || "0.00"}%`}
                          color="#ffa726"
                          icon={<ShowChartIcon sx={{ color: "#ffa726", fontSize: 18 }} />}
                        />
                        <KpiCard
                          title="vs Benchmark"
                          value={`${(
                            parseFloat(timelapseData[timelapseDay]?.portfolioReturn || 0) -
                            parseFloat(timelapseData[timelapseDay]?.benchmarkReturn || 0)
                          ).toFixed(2)}%`}
                          subtitle={
                            parseFloat(timelapseData[timelapseDay]?.portfolioReturn || 0) >=
                            parseFloat(timelapseData[timelapseDay]?.benchmarkReturn || 0)
                              ? "Outperforming"
                              : "Underperforming"
                          }
                          color={
                            parseFloat(timelapseData[timelapseDay]?.portfolioReturn || 0) >=
                            parseFloat(timelapseData[timelapseDay]?.benchmarkReturn || 0)
                              ? "#00e676"
                              : "#ef5350"
                          }
                          icon={<EmojiEventsIcon sx={{ color: "#00e676", fontSize: 18 }} />}
                        />
                      </Box>

                      {/* Performance Chart + Event Log */}
                      <Box display="grid" gridTemplateColumns="1fr 350px" gap="1.5rem">
                        {/* Chart */}
                        <DashboardBox p="1.5rem">
                          <Typography
                            variant="h5"
                            fontWeight="bold"
                            color={palette.grey[100]}
                            mb="0.5rem"
                          >
                            Performance vs S&P 500
                          </Typography>
                          <Box display="flex" gap="1rem" mb="1rem">
                            <Chip
                              size="small"
                              label="Your Portfolio"
                              sx={{
                                backgroundColor: "rgba(124,77,255,0.1)",
                                color: "#7c4dff",
                                border: "1px solid rgba(124,77,255,0.3)",
                                fontWeight: "bold",
                                fontSize: "0.7rem",
                              }}
                            />
                            <Chip
                              size="small"
                              label="S&P 500"
                              sx={{
                                backgroundColor: "rgba(255,167,38,0.1)",
                                color: "#ffa726",
                                border: "1px solid rgba(255,167,38,0.3)",
                                fontWeight: "bold",
                                fontSize: "0.7rem",
                              }}
                            />
                          </Box>
                          <ResponsiveContainer width="100%" height={320}>
                            <LineChart data={timelapseChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke={palette.grey[800]} />
                              <XAxis
                                dataKey="date"
                                tick={{ fill: palette.grey[500], fontSize: 10 }}
                                tickLine={false}
                                axisLine={{ stroke: palette.grey[800] }}
                                angle={-30}
                                textAnchor="end"
                                height={50}
                              />
                              <YAxis
                                tick={{ fill: palette.grey[500], fontSize: 11 }}
                                tickLine={false}
                                axisLine={{ stroke: palette.grey[800] }}
                                tickFormatter={(v) => `${v}%`}
                              />
                              <RechartsTooltip
                                contentStyle={{
                                  backgroundColor: palette.grey[900],
                                  border: `1px solid ${palette.grey[700]}`,
                                  borderRadius: "8px",
                                  color: palette.grey[100],
                                }}
                                formatter={(v, name) => [
                                  `${v}%`,
                                  name === "portfolio" ? "Portfolio" : "S&P 500",
                                ]}
                              />
                              <Line
                                type="monotone"
                                dataKey="portfolio"
                                stroke="#7c4dff"
                                strokeWidth={2.5}
                                dot={false}
                                animationDuration={0}
                              />
                              <Line
                                type="monotone"
                                dataKey="benchmark"
                                stroke="#ffa726"
                                strokeWidth={2}
                                strokeDasharray="5 3"
                                dot={false}
                                animationDuration={0}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </DashboardBox>

                        {/* Event Log */}
                        <DashboardBox p="1.5rem">
                          <Typography
                            variant="h5"
                            fontWeight="bold"
                            color={palette.grey[100]}
                            mb="1rem"
                            display="flex"
                            alignItems="center"
                            gap="0.5rem"
                          >
                            📋 Daily Event Log
                          </Typography>
                          <Box
                            sx={{
                              maxHeight: 380,
                              overflowY: "auto",
                              pr: "0.5rem",
                              "&::-webkit-scrollbar": { width: 4 },
                              "&::-webkit-scrollbar-thumb": {
                                backgroundColor: palette.grey[700],
                                borderRadius: 2,
                              },
                            }}
                          >
                            {timelapseLog.length > 0 ? (
                              timelapseLog.map((entry, idx) => (
                                <Box
                                  key={idx}
                                  sx={{
                                    p: "0.5rem 0.75rem",
                                    mb: "0.4rem",
                                    borderRadius: "0.5rem",
                                    backgroundColor: "rgba(255,255,255,0.02)",
                                    border: `1px solid ${palette.grey[800]}`,
                                    transition: "all 0.15s ease",
                                  }}
                                >
                                  <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="caption" color={palette.grey[500]}>
                                      Day {entry.day} · {entry.date}
                                    </Typography>
                                    <Chip
                                      size="small"
                                      label={`${parseFloat(entry.changePct) >= 0 ? "+" : ""}${entry.changePct}%`}
                                      sx={{
                                        fontSize: "0.6rem",
                                        height: "18px",
                                        fontWeight: "bold",
                                        backgroundColor:
                                          parseFloat(entry.changePct) >= 0
                                            ? "rgba(0,230,118,0.1)"
                                            : "rgba(255,82,82,0.1)",
                                        color:
                                          parseFloat(entry.changePct) >= 0
                                            ? "#00e676"
                                            : "#ff5252",
                                      }}
                                    />
                                  </Box>
                                  <Typography variant="caption" color={palette.grey[300]} display="block">
                                    Value: ${entry.value.toLocaleString()} ({parseFloat(entry.change) >= 0 ? "+" : ""}${entry.change})
                                  </Typography>
                                  {entry.mover && (
                                    <Typography variant="caption" color={palette.grey[500]}>
                                      Biggest mover: <strong style={{ color: parseFloat(entry.moverChange) >= 0 ? "#00e676" : "#ff5252" }}>
                                        {entry.mover} {parseFloat(entry.moverChange) >= 0 ? "+" : ""}{entry.moverChange}%
                                      </strong>
                                    </Typography>
                                  )}
                                </Box>
                              ))
                            ) : (
                              <Typography variant="body2" color={palette.grey[600]} textAlign="center" py="2rem">
                                Events will appear here as days progress...
                              </Typography>
                            )}
                            <div ref={logEndRef} />
                          </Box>
                        </DashboardBox>
                      </Box>
                    </>
                  )}

                  {/* Empty state when timelapse not started */}
                  {!timelapseActive && !timelapseLoading && (
                    <Box textAlign="center" py="3rem">
                      <TimelineIcon sx={{ fontSize: "64px", color: palette.grey[700], mb: "1rem" }} />
                      <Typography variant="h5" color={palette.grey[400]} mb="0.5rem">
                        Ready to Simulate
                      </Typography>
                      <Typography variant="body2" color={palette.grey[600]} maxWidth="400px" mx="auto">
                        Click "Run Timelapse" to replay your portfolio's historical performance day-by-day, compared against the S&P 500 benchmark.
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box textAlign="center" py="3rem">
                  <TimelineIcon sx={{ fontSize: "48px", color: palette.grey[700], mb: "1rem" }} />
                  <Typography variant="h5" color={palette.grey[500]}>
                    Buy some stocks first to run a portfolio timelapse
                  </Typography>
                </Box>
              )}
            </Box>
          </Fade>
        )}
      </DashboardBox>
    </Box>
  );
};

export default Simulator;
