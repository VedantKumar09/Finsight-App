import React, { useState } from "react";
import {
  Box,
  Typography,
  useTheme,
  TextField,
  Button,
  InputAdornment,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Fade,
  LinearProgress,
  Tooltip,
  Link,
  Divider,
} from "@mui/material";
import DashboardBox from "@/components/DashboardBox";
import FlexBetween from "@/components/FlexBetween";
import { usePredictStockMutation } from "@/state/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SearchIcon from "@mui/icons-material/Search";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PsychologyIcon from "@mui/icons-material/Psychology";
import BarChartIcon from "@mui/icons-material/BarChart";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import NewspaperIcon from "@mui/icons-material/Newspaper";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

// Sentiment color palette
const SENTIMENT_COLORS = {
  Bullish: "#00e676",
  Bearish: "#ff5252",
  Neutral: "#ffa726",
};

const StockPredictions = () => {
  const { palette } = useTheme();
  const [ticker, setTicker] = useState("");
  const [predictStock, { data: prediction, isLoading, error }] = usePredictStockMutation();

  const handlePredict = () => {
    if (!ticker.trim()) return;
    predictStock({ ticker: ticker.trim().toUpperCase() });
  };

  // Prepare combined chart data: historical + forecast
  const chartData = React.useMemo(() => {
    if (!prediction) return [];

    const historical = (prediction.historicalPrices || []).map((p) => ({
      date: p.date,
      price: p.price,
      type: "historical",
    }));

    // Take only the last 30 historical data points for a cleaner chart
    const recentHistory = historical.slice(-30);

    const forecast = (prediction.forecast || []).map((f) => ({
      date: f.date,
      predicted: f.predictedPrice,
      type: "forecast",
    }));

    // Bridge: last historical point also gets a predicted value for continuity
    if (recentHistory.length > 0 && forecast.length > 0) {
      const lastHistorical = recentHistory[recentHistory.length - 1];
      lastHistorical.predicted = lastHistorical.price;
    }

    return [...recentHistory, ...forecast];
  }, [prediction]);

  // Feature importance data for bar chart
  const featureData = React.useMemo(() => {
    if (!prediction?.featureImportance) return [];
    return prediction.featureImportance
      .map((f) => ({
        name: f.feature,
        importance: parseFloat((f.importance * 100).toFixed(1)),
      }))
      .sort((a, b) => b.importance - a.importance);
  }, [prediction]);

  // Price change from forecast
  const forecastChange = React.useMemo(() => {
    if (!prediction?.forecast?.length || !prediction?.currentPrice) return null;
    const lastForecast = prediction.forecast[prediction.forecast.length - 1];
    const change = lastForecast.predictedPrice - prediction.currentPrice;
    const changePercent = (change / prediction.currentPrice) * 100;
    return {
      value: change.toFixed(2),
      percent: changePercent.toFixed(2),
      isPositive: change >= 0,
    };
  }, [prediction]);

  const ModelStatCard = ({ title, stats, color }) => (
    <Box
      p="1rem"
      sx={{
        backgroundColor: "rgba(255,255,255,0.02)",
        borderRadius: "0.75rem",
        border: `1px solid ${palette.grey[800]}`,
        flex: 1,
      }}
    >
      <Typography variant="h6" color={color} fontWeight="bold" mb="0.75rem">
        {title}
      </Typography>
      <Box display="flex" flexDirection="column" gap="0.5rem">
        <FlexBetween>
          <Typography variant="body2" color={palette.grey[500]}>
            R² Score
          </Typography>
          <Typography variant="body2" fontWeight="bold" color={palette.grey[200]}>
            {(stats?.r2 * 100)?.toFixed(1)}%
          </Typography>
        </FlexBetween>
        <LinearProgress
          variant="determinate"
          value={Math.max(0, (stats?.r2 || 0) * 100)}
          sx={{
            height: 4,
            borderRadius: 2,
            backgroundColor: palette.grey[800],
            "& .MuiLinearProgress-bar": {
              backgroundColor: color,
              borderRadius: 2,
            },
          }}
        />
        <FlexBetween>
          <Typography variant="body2" color={palette.grey[500]}>
            MAE
          </Typography>
          <Typography variant="body2" color={palette.grey[300]}>
            ${stats?.mae?.toFixed(2)}
          </Typography>
        </FlexBetween>
        <FlexBetween>
          <Typography variant="body2" color={palette.grey[500]}>
            RMSE
          </Typography>
          <Typography variant="body2" color={palette.grey[300]}>
            ${stats?.rmse?.toFixed(2)}
          </Typography>
        </FlexBetween>
      </Box>
    </Box>
  );

  return (
    <Box display="flex" flexDirection="column" gap="1.5rem" mt="1rem">
      {/* HEADER */}
      <Box>
        <Typography
          variant="h2"
          fontWeight="bold"
          sx={{
            background: `linear-gradient(135deg, ${palette.primary[400]}, #7c4dff)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <PsychologyIcon sx={{ fontSize: "36px", color: palette.primary[400] }} />
          AI Stock Predictor
        </Typography>
        <Typography variant="h5" color={palette.grey[500]} mt="0.5rem">
          Machine Learning powered 7-day stock price forecast using Random Forest & Gradient
          Boosting ensemble models
        </Typography>
      </Box>

      {/* SEARCH BAR */}
      <DashboardBox p="1.5rem">
        <Box display="flex" gap="1rem" alignItems="center">
          <TextField
            size="small"
            placeholder="Enter stock ticker to analyze (e.g. AAPL, MSFT, NVDA)"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handlePredict()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AutoAwesomeIcon sx={{ color: palette.primary[500] }} />
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
            onClick={handlePredict}
            disabled={isLoading || !ticker.trim()}
            sx={{
              px: "2rem",
              py: "0.5rem",
              fontWeight: "bold",
              background: `linear-gradient(135deg, ${palette.primary[600]}, #7c4dff)`,
              "&:hover": {
                background: `linear-gradient(135deg, ${palette.primary[500]}, #651fff)`,
              },
            }}
          >
            {isLoading ? (
              <Box display="flex" alignItems="center" gap="0.5rem">
                <CircularProgress size={18} color="inherit" />
                Training Models...
              </Box>
            ) : (
              "Analyze & Predict"
            )}
          </Button>
        </Box>
        {isLoading && (
          <Box mt="1rem">
            <Typography variant="body2" color={palette.grey[500]} mb="0.5rem">
              Fetching data, computing indicators, and training ML models... This may take 15-30
              seconds.
            </Typography>
            <LinearProgress
              sx={{
                backgroundColor: palette.grey[800],
                "& .MuiLinearProgress-bar": {
                  background: `linear-gradient(90deg, ${palette.primary[500]}, #7c4dff)`,
                },
              }}
            />
          </Box>
        )}
      </DashboardBox>

      {/* ERROR */}
      {error && (
        <Alert severity="error" sx={{ backgroundColor: "rgba(211, 47, 47, 0.1)" }}>
          {error?.data?.message || error?.data?.error || "Prediction failed. Please try again."}
        </Alert>
      )}

      {/* PREDICTION RESULTS */}
      {prediction && !prediction.error && (
        <Fade in timeout={600}>
          <Box display="flex" flexDirection="column" gap="1.5rem">
            {/* KPI SUMMARY ROW */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2.4}>
                <DashboardBox p="1.25rem" height="100%">
                  <Typography variant="h6" color={palette.grey[500]} mb="0.5rem">
                    Current Price
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color={palette.grey[100]}>
                    ${prediction.currentPrice?.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color={palette.grey[500]}>
                    {prediction.ticker}
                  </Typography>
                </DashboardBox>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <DashboardBox p="1.25rem" height="100%">
                  <Typography variant="h6" color={palette.grey[500]} mb="0.5rem">
                    7-Day Forecast
                  </Typography>
                  {forecastChange && (
                    <>
                      <Typography
                        variant="h3"
                        fontWeight="bold"
                        color={forecastChange.isPositive ? palette.primary[400] : "#ef5350"}
                      >
                        {forecastChange.isPositive ? "+" : ""}${forecastChange.value}
                      </Typography>
                      <Typography
                        variant="body2"
                        color={forecastChange.isPositive ? palette.primary[400] : "#ef5350"}
                      >
                        ({forecastChange.isPositive ? "+" : ""}
                        {forecastChange.percent}%)
                      </Typography>
                    </>
                  )}
                </DashboardBox>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <DashboardBox p="1.25rem" height="100%">
                  <Typography variant="h6" color={palette.grey[500]} mb="0.5rem">
                    Best Model
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color="#7c4dff">
                    {prediction.bestModel === "gradientBoosting" ? "GBR" : "RF"}
                  </Typography>
                  <Typography variant="body2" color={palette.grey[500]}>
                    {prediction.bestModel === "gradientBoosting"
                      ? "Gradient Boosting"
                      : "Random Forest"}
                  </Typography>
                </DashboardBox>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <DashboardBox p="1.25rem" height="100%">
                  <Typography variant="h6" color={palette.grey[500]} mb="0.5rem">
                    Model Accuracy
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color={palette.primary[300]}>
                    {(
                      Math.max(
                        prediction.models?.randomForest?.r2 || 0,
                        prediction.models?.gradientBoosting?.r2 || 0
                      ) * 100
                    ).toFixed(1)}
                    %
                  </Typography>
                  <Typography variant="body2" color={palette.grey[500]}>
                    R² Score
                  </Typography>
                </DashboardBox>
              </Grid>
              {/* NEWS SENTIMENT KPI CARD */}
              <Grid item xs={12} sm={6} md={2.4}>
                <DashboardBox
                  p="1.25rem"
                  height="100%"
                  sx={{
                    border: prediction.sentiment
                      ? `1px solid ${SENTIMENT_COLORS[prediction.sentiment.sentimentLabel]}22`
                      : undefined,
                  }}
                >
                  <Typography variant="h6" color={palette.grey[500]} mb="0.5rem">
                    News Sentiment
                  </Typography>
                  {prediction.sentiment ? (
                    <>
                      <Typography
                        variant="h3"
                        fontWeight="bold"
                        color={SENTIMENT_COLORS[prediction.sentiment.sentimentLabel]}
                      >
                        {prediction.sentiment.sentimentLabel}
                      </Typography>
                      <Box display="flex" alignItems="center" gap="0.5rem">
                        <Typography
                          variant="body2"
                          color={SENTIMENT_COLORS[prediction.sentiment.sentimentLabel]}
                        >
                          Score: {prediction.sentiment.sentimentScore > 0 ? "+" : ""}
                          {(prediction.sentiment.sentimentScore * 100).toFixed(0)}%
                        </Typography>
                        <Chip
                          size="small"
                          label={`${prediction.sentiment.totalArticles} articles`}
                          sx={{
                            fontSize: "0.65rem",
                            height: "18px",
                            backgroundColor: "rgba(255,255,255,0.05)",
                            color: palette.grey[400],
                          }}
                        />
                      </Box>
                    </>
                  ) : (
                    <Typography variant="body2" color={palette.grey[600]}>
                      No data
                    </Typography>
                  )}
                </DashboardBox>
              </Grid>
            </Grid>

            {/* FORECAST CHART */}
            <DashboardBox p="1.5rem">
              <FlexBetween mb="1rem">
                <Box>
                  <Typography
                    variant="h4"
                    fontWeight="bold"
                    color={palette.grey[100]}
                    display="flex"
                    alignItems="center"
                    gap="0.5rem"
                  >
                    <TrendingUpIcon sx={{ color: palette.primary[400] }} />
                    Price Forecast Chart
                  </Typography>
                  <Typography variant="body2" color={palette.grey[500]}>
                    Last 30 days historical + 7-day ML prediction
                  </Typography>
                </Box>
                <Box display="flex" gap="1rem">
                  <Chip
                    size="small"
                    label="Historical"
                    sx={{
                      backgroundColor: "rgba(18, 239, 200, 0.1)",
                      color: palette.primary[400],
                      border: `1px solid ${palette.primary[700]}`,
                    }}
                  />
                  <Chip
                    size="small"
                    label="Predicted"
                    sx={{
                      backgroundColor: "rgba(124, 77, 255, 0.1)",
                      color: "#7c4dff",
                      border: "1px solid rgba(124, 77, 255, 0.3)",
                    }}
                  />
                </Box>
              </FlexBetween>

              <ResponsiveContainer width="100%" height={380}>
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c4dff" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#7c4dff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={palette.grey[800]} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: palette.grey[500], fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: palette.grey[800] }}
                    angle={-30}
                    textAnchor="end"
                    height={60}
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
                    formatter={(value, name) => {
                      if (value == null) return ["-", name];
                      return [`$${value.toFixed(2)}`, name === "price" ? "Historical" : "Predicted"];
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={palette.primary[400]}
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                    animationDuration={800}
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#7c4dff"
                    strokeWidth={2.5}
                    strokeDasharray="6 3"
                    dot={{ fill: "#7c4dff", r: 4, strokeWidth: 2, stroke: "#1f1f2e" }}
                    connectNulls={false}
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </DashboardBox>

            {/* BOTTOM ROW: FEATURE IMPORTANCE + MODEL COMPARISON */}
            <Box display="grid" gap="1.5rem" gridTemplateColumns="1fr 1fr">
              {/* FEATURE IMPORTANCE */}
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
                  <BarChartIcon sx={{ color: "#7c4dff" }} />
                  Feature Importance
                </Typography>
                <Typography variant="body2" color={palette.grey[500]} mb="1rem">
                  Which indicators influence the prediction most
                </Typography>

                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={featureData} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={palette.grey[800]}
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fill: palette.grey[500], fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: palette.grey[800] }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: palette.grey[400], fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: palette.grey[800] }}
                      width={90}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: palette.grey[900],
                        border: `1px solid ${palette.grey[700]}`,
                        borderRadius: "8px",
                        color: palette.grey[100],
                      }}
                      formatter={(v) => [`${v}%`, "Importance"]}
                    />
                    <Bar
                      dataKey="importance"
                      fill="#7c4dff"
                      radius={[0, 4, 4, 0]}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </DashboardBox>

              {/* MODEL COMPARISON */}
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
                  <CompareArrowsIcon sx={{ color: palette.primary[400] }} />
                  Model Comparison
                </Typography>
                <Typography variant="body2" color={palette.grey[500]} mb="1.5rem">
                  Performance metrics for both trained models
                </Typography>

                <Box display="flex" gap="1rem" flexDirection="column">
                  {prediction.models && (
                    <>
                      <Box display="flex" gap="1rem">
                        <ModelStatCard
                          title="Random Forest"
                          stats={prediction.models.randomForest}
                          color={palette.primary[400]}
                        />
                        <ModelStatCard
                          title="Gradient Boosting"
                          stats={prediction.models.gradientBoosting}
                          color="#7c4dff"
                        />
                      </Box>

                      <Box
                        p="1rem"
                        sx={{
                          backgroundColor:
                            prediction.bestModel === "gradientBoosting"
                              ? "rgba(124, 77, 255, 0.06)"
                              : "rgba(18, 239, 200, 0.06)",
                          borderRadius: "0.75rem",
                          border: `1px solid ${
                            prediction.bestModel === "gradientBoosting"
                              ? "rgba(124, 77, 255, 0.2)"
                              : palette.primary[700]
                          }`,
                        }}
                      >
                        <Typography variant="body2" color={palette.grey[400]} textAlign="center">
                          🏆 Winner:{" "}
                          <strong
                            style={{
                              color:
                                prediction.bestModel === "gradientBoosting"
                                  ? "#7c4dff"
                                  : palette.primary[400],
                            }}
                          >
                            {prediction.bestModel === "gradientBoosting"
                              ? "Gradient Boosting Regressor"
                              : "Random Forest Regressor"}
                          </strong>{" "}
                          — used for the 7-day forecast
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              </DashboardBox>
            </Box>

            {/* NEWS SENTIMENT ANALYSIS SECTION */}
            {prediction.sentiment && prediction.sentiment.totalArticles > 0 && (
              <Box display="grid" gap="1.5rem" gridTemplateColumns="350px 1fr">
                {/* SENTIMENT BREAKDOWN PANEL */}
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
                    <SentimentSatisfiedAltIcon
                      sx={{ color: SENTIMENT_COLORS[prediction.sentiment.sentimentLabel] }}
                    />
                    Sentiment Analysis
                  </Typography>
                  <Typography variant="body2" color={palette.grey[500]} mb="1.5rem">
                    AI-powered financial news sentiment via lexicon scoring
                  </Typography>

                  {/* Sentiment Gauge */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      mb: "1.5rem",
                    }}
                  >
                    <Box sx={{ position: "relative", width: 160, height: 160 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Bullish", value: prediction.sentiment.bullishCount || 0 },
                              { name: "Bearish", value: prediction.sentiment.bearishCount || 0 },
                              { name: "Neutral", value: prediction.sentiment.neutralCount || 0 },
                            ]}
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                            animationDuration={800}
                          >
                            <Cell fill={SENTIMENT_COLORS.Bullish} />
                            <Cell fill={SENTIMENT_COLORS.Bearish} />
                            <Cell fill={SENTIMENT_COLORS.Neutral} />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <Box
                        sx={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          variant="h4"
                          fontWeight="bold"
                          color={SENTIMENT_COLORS[prediction.sentiment.sentimentLabel]}
                        >
                          {prediction.sentiment.sentimentScore > 0 ? "+" : ""}
                          {(prediction.sentiment.sentimentScore * 100).toFixed(0)}%
                        </Typography>
                        <Typography variant="caption" color={palette.grey[500]}>
                          Score
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Sentiment Breakdown Bars */}
                  <Box display="flex" flexDirection="column" gap="0.75rem">
                    {["Bullish", "Bearish", "Neutral"].map((label) => {
                      const count =
                        label === "Bullish"
                          ? prediction.sentiment.bullishCount
                          : label === "Bearish"
                          ? prediction.sentiment.bearishCount
                          : prediction.sentiment.neutralCount;
                      const pct =
                        prediction.sentiment.totalArticles > 0
                          ? (count / prediction.sentiment.totalArticles) * 100
                          : 0;
                      return (
                        <Box key={label}>
                          <FlexBetween mb="0.25rem">
                            <Box display="flex" alignItems="center" gap="0.5rem">
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  backgroundColor: SENTIMENT_COLORS[label],
                                }}
                              />
                              <Typography variant="body2" color={palette.grey[300]}>
                                {label}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color={palette.grey[400]}>
                              {count} ({pct.toFixed(0)}%)
                            </Typography>
                          </FlexBetween>
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: palette.grey[800],
                              "& .MuiLinearProgress-bar": {
                                backgroundColor: SENTIMENT_COLORS[label],
                                borderRadius: 3,
                                transition: "width 0.8s ease-in-out",
                              },
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Box>

                  <Divider sx={{ borderColor: palette.grey[800], my: "1rem" }} />

                  <Typography variant="caption" color={palette.grey[600]} display="block">
                    Powered by Google News RSS + 120-word financial lexicon scoring engine
                  </Typography>
                </DashboardBox>

                {/* NEWS FEED WIDGET */}
                <DashboardBox p="1.5rem">
                  <FlexBetween mb="1rem">
                    <Box>
                      <Typography
                        variant="h4"
                        fontWeight="bold"
                        color={palette.grey[100]}
                        display="flex"
                        alignItems="center"
                        gap="0.5rem"
                      >
                        <NewspaperIcon sx={{ color: palette.primary[400] }} />
                        Live News Feed
                      </Typography>
                      <Typography variant="body2" color={palette.grey[500]}>
                        Real-time headlines scored by AI sentiment engine
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={`${prediction.sentiment.totalArticles} headlines`}
                      sx={{
                        backgroundColor: "rgba(124, 77, 255, 0.1)",
                        color: "#7c4dff",
                        border: "1px solid rgba(124, 77, 255, 0.3)",
                      }}
                    />
                  </FlexBetween>

                  {/* Scrollable news list */}
                  <Box
                    sx={{
                      maxHeight: 420,
                      overflowY: "auto",
                      pr: "0.5rem",
                      "&::-webkit-scrollbar": { width: 4 },
                      "&::-webkit-scrollbar-thumb": {
                        backgroundColor: palette.grey[700],
                        borderRadius: 2,
                      },
                    }}
                  >
                    {prediction.sentiment.newsHeadlines.map((headline, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          p: "0.75rem 1rem",
                          mb: "0.5rem",
                          borderRadius: "0.75rem",
                          backgroundColor: "rgba(255,255,255,0.02)",
                          border: `1px solid ${palette.grey[800]}`,
                          transition: "all 0.2s ease",
                          "&:hover": {
                            backgroundColor: "rgba(255,255,255,0.04)",
                            borderColor: SENTIMENT_COLORS[headline.label] + "44",
                            transform: "translateX(4px)",
                          },
                        }}
                      >
                        <FlexBetween mb="0.25rem">
                          <Box display="flex" alignItems="center" gap="0.5rem" flex={1}>
                            <Chip
                              size="small"
                              label={headline.label}
                              sx={{
                                fontSize: "0.65rem",
                                height: "20px",
                                fontWeight: "bold",
                                backgroundColor: SENTIMENT_COLORS[headline.label] + "15",
                                color: SENTIMENT_COLORS[headline.label],
                                border: `1px solid ${SENTIMENT_COLORS[headline.label]}33`,
                              }}
                            />
                            <Chip
                              size="small"
                              label={
                                (headline.score > 0 ? "+" : "") +
                                (headline.score * 100).toFixed(0) +
                                "%"
                              }
                              sx={{
                                fontSize: "0.6rem",
                                height: "18px",
                                backgroundColor: "rgba(255,255,255,0.05)",
                                color: SENTIMENT_COLORS[headline.label],
                              }}
                            />
                          </Box>
                          {headline.source && (
                            <Typography
                              variant="caption"
                              color={palette.grey[600]}
                              sx={{ whiteSpace: "nowrap", ml: "0.5rem" }}
                            >
                              {headline.source}
                            </Typography>
                          )}
                        </FlexBetween>

                        <Typography
                          variant="body2"
                          color={palette.grey[200]}
                          sx={{ lineHeight: 1.5, mb: "0.25rem" }}
                        >
                          {headline.title}
                        </Typography>

                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          <Box display="flex" gap="0.25rem" flexWrap="wrap">
                            {headline.matchedWords?.slice(0, 4).map((mw, i) => (
                              <Tooltip
                                key={i}
                                title={`Weight: ${mw.weight > 0 ? "+" : ""}${mw.weight}`}
                                arrow
                              >
                                <Chip
                                  size="small"
                                  label={mw.word}
                                  sx={{
                                    fontSize: "0.55rem",
                                    height: "16px",
                                    backgroundColor:
                                      mw.weight > 0
                                        ? "rgba(0, 230, 118, 0.1)"
                                        : mw.weight < 0
                                        ? "rgba(255, 82, 82, 0.1)"
                                        : "rgba(255,255,255,0.05)",
                                    color:
                                      mw.weight > 0
                                        ? "#00e676"
                                        : mw.weight < 0
                                        ? "#ff5252"
                                        : palette.grey[400],
                                    border: `1px solid ${
                                      mw.weight > 0
                                        ? "rgba(0, 230, 118, 0.2)"
                                        : mw.weight < 0
                                        ? "rgba(255, 82, 82, 0.2)"
                                        : palette.grey[800]
                                    }`,
                                  }}
                                />
                              </Tooltip>
                            ))}
                          </Box>
                          {headline.link && (
                            <Tooltip title="Open original article" arrow>
                              <Link
                                href={headline.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                  color: palette.grey[600],
                                  "&:hover": { color: palette.primary[400] },
                                }}
                              >
                                <OpenInNewIcon sx={{ fontSize: 14 }} />
                              </Link>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </DashboardBox>
              </Box>
            )}
          </Box>
        </Fade>
      )}

      {/* Prediction error from Python */}
      {prediction?.error && (
        <Alert severity="error" sx={{ backgroundColor: "rgba(211, 47, 47, 0.1)" }}>
          {prediction.error}
        </Alert>
      )}
    </Box>
  );
};

export default StockPredictions;
