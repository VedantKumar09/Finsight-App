import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Grid,
  Divider,
  useTheme,
  Card,
  CardContent,
  Chip,
} from "@mui/material";
import DashboardBox from "@/components/DashboardBox";
import FlexBetween from "@/components/FlexBetween";
import { useGetPortfolioQuery } from "@/state/api";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import PsychologyIcon from "@mui/icons-material/Psychology";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CodeIcon from "@mui/icons-material/Code";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SettingsSystemDaydreamIcon from "@mui/icons-material/SettingsSystemDaydream";
import StorageIcon from "@mui/icons-material/Storage";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PieChartIcon from "@mui/icons-material/PieChart";

const Home = () => {
  const { palette } = useTheme();
  const navigate = useNavigate();
  const { data: portfolio } = useGetPortfolioQuery();

  const totalValue = portfolio?.totalValue || 100000;
  const buyingPower = portfolio?.buyingPower || 100000;
  const holdingsValue = portfolio?.holdingsValue || 0;
  const positions = portfolio?.holdings?.length || 0;

  // Calculate total P&L
  const totalPnL = portfolio?.holdings?.reduce((sum, h) => sum + (h.gainLoss || 0), 0) || 0;
  const initialInvestment = totalValue - totalPnL - buyingPower + holdingsValue;
  const pnlPercent = initialInvestment > 0 ? (totalPnL / initialInvestment) * 100 : 0;
  const isPnLPositive = totalPnL >= 0;

  const quickActions = [
    {
      icon: <DashboardIcon />,
      title: "Portfolio Analytics",
      desc: "Track your holdings allocation, trade activity timeline, win/loss stats, and monitor a curated market watchlist with live prices.",
      btnLabel: "View Analytics",
      path: "/dashboard",
    },
    {
      icon: <ShowChartIcon />,
      title: "Stock Simulator",
      desc: "Trade virtual stocks risk-free with $100K paper money. Search live tickers, buy & sell shares, and track your portfolio P&L in real time.",
      btnLabel: "Open Simulator",
      path: "/simulator",
    },
    {
      icon: <PsychologyIcon />,
      title: "AI Stock Predictor",
      desc: "Get 7-day stock price forecasts powered by Random Forest & Gradient Boosting ML models with technical indicator analysis.",
      btnLabel: "Predict Stocks",
      path: "/stock-predictions",
    },
  ];

  return (
    <Box display="flex" flexDirection="column" gap="2rem" mt="1rem">
      {/* WELCOME BANNER & PORTFOLIO SNAPSHOT */}
      <DashboardBox p="2rem">
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={7}>
            <Typography
              variant="h1"
              fontSize="2.5rem"
              fontWeight="bold"
              sx={{ color: palette.primary[300], mb: "0.5rem" }}
            >
              Welcome to Finsight
            </Typography>
            <Typography
              variant="h4"
              sx={{ color: palette.grey[300], mb: "1.5rem", lineHeight: "1.6" }}
            >
              Your AI-powered virtual stock trading platform. Simulate trades risk-free, analyze
              your portfolio performance, and predict market movements using ensemble machine
              learning models.
            </Typography>
            <Typography variant="h6" sx={{ color: palette.grey[500] }}>
              CSE Final Year Project — Full-stack engineering, real-time data, and ML integration.
            </Typography>
          </Grid>
          <Grid item xs={12} md={5}>
            <Box
              p="1.5rem"
              sx={{
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: "1rem",
                border: `1px solid ${palette.grey[800]}`,
              }}
            >
              <Typography variant="h4" mb="1rem" fontWeight="bold" color={palette.grey[200]}>
                Portfolio Snapshot
              </Typography>
              <Box display="flex" flexDirection="column" gap="0.75rem">
                <FlexBetween>
                  <Typography variant="h5" color={palette.grey[400]}>
                    Total Portfolio Value
                  </Typography>
                  <Typography variant="h5" color={palette.primary[500]} fontWeight="bold">
                    ${totalValue.toLocaleString()}
                  </Typography>
                </FlexBetween>
                <Divider sx={{ borderColor: palette.grey[800] }} />
                <FlexBetween>
                  <Typography variant="h5" color={palette.grey[400]}>
                    Buying Power
                  </Typography>
                  <Typography variant="h5" color={palette.grey[200]} fontWeight="bold">
                    ${buyingPower.toLocaleString()}
                  </Typography>
                </FlexBetween>
                <Divider sx={{ borderColor: palette.grey[800] }} />
                <FlexBetween>
                  <Typography variant="h5" color={palette.grey[400]}>
                    Total P&L
                  </Typography>
                  <Box display="flex" alignItems="center" gap="0.25rem">
                    {isPnLPositive ? (
                      <TrendingUpIcon sx={{ color: palette.primary[400], fontSize: "16px" }} />
                    ) : (
                      <TrendingDownIcon sx={{ color: "#ef5350", fontSize: "16px" }} />
                    )}
                    <Typography
                      variant="h5"
                      color={isPnLPositive ? palette.primary[400] : "#ef5350"}
                      fontWeight="bold"
                    >
                      {isPnLPositive ? "+" : ""}${totalPnL.toFixed(2)}
                    </Typography>
                  </Box>
                </FlexBetween>
                <Divider sx={{ borderColor: palette.grey[800] }} />
                <FlexBetween>
                  <Typography variant="h5" color={palette.grey[400]}>
                    Active Positions
                  </Typography>
                  <Chip
                    label={positions}
                    size="small"
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: "rgba(18, 239, 200, 0.1)",
                      color: palette.primary[400],
                      border: `1px solid ${palette.primary[700]}`,
                    }}
                  />
                </FlexBetween>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DashboardBox>

      {/* QUICK ACTIONS */}
      <Grid container spacing={3}>
        {quickActions.map((action) => (
          <Grid item xs={12} md={4} key={action.title}>
            <DashboardBox
              p="1.5rem"
              display="flex"
              flexDirection="column"
              height="240px"
              justifyContent="space-between"
            >
              <Box>
                <FlexBetween mb="1rem">
                  <Typography
                    variant="h3"
                    color={palette.primary[300]}
                    display="flex"
                    alignItems="center"
                    gap="0.5rem"
                  >
                    {action.icon} {action.title}
                  </Typography>
                  <ArrowForwardIcon sx={{ color: palette.grey[500] }} />
                </FlexBetween>
                <Typography variant="h5" sx={{ color: palette.grey[400], lineHeight: "1.5" }}>
                  {action.desc}
                </Typography>
              </Box>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate(action.path)}
                sx={{
                  mt: "1rem",
                  backgroundColor: palette.primary[500],
                  color: palette.grey[900],
                  fontWeight: "bold",
                  "&:hover": { backgroundColor: palette.primary[600] },
                }}
              >
                {action.btnLabel}
              </Button>
            </DashboardBox>
          </Grid>
        ))}
      </Grid>

      {/* SYSTEM ARCHITECTURE */}
      <DashboardBox p="2rem">
        <Typography variant="h3" mb="0.5rem" color={palette.primary[300]}>
          System Architecture & Implementation
        </Typography>
        <Typography variant="h5" mb="2rem" color={palette.grey[400]}>
          Four decoupled layers process real-time market data, execute virtual trades, and serve ML
          predictions.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                bgcolor: "rgba(255,255,255,0.02)",
                border: `1px solid ${palette.grey[800]}`,
                height: "100%",
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" gap="0.5rem" mb="1rem">
                  <CodeIcon sx={{ color: palette.primary[400] }} />
                  <Typography variant="h4" fontWeight="bold">
                    1. Frontend
                  </Typography>
                </Box>
                <Typography variant="h6" color={palette.grey[400]}>
                  Built with **React JS** and **Material-UI**. Uses **Redux Toolkit** with **RTK
                  Query** for state management and real-time API caching.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                bgcolor: "rgba(255,255,255,0.02)",
                border: `1px solid ${palette.grey[800]}`,
                height: "100%",
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" gap="0.5rem" mb="1rem">
                  <SettingsSystemDaydreamIcon sx={{ color: palette.primary[400] }} />
                  <Typography variant="h4" fontWeight="bold">
                    2. Backend
                  </Typography>
                </Box>
                <Typography variant="h6" color={palette.grey[400]}>
                  Powered by **Node.js** and **Express**. Handles JWT auth, virtual trade
                  execution, and proxies live market data from Yahoo Finance.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                bgcolor: "rgba(255,255,255,0.02)",
                border: `1px solid ${palette.grey[800]}`,
                height: "100%",
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" gap="0.5rem" mb="1rem">
                  <AutoAwesomeIcon sx={{ color: palette.primary[400] }} />
                  <Typography variant="h4" fontWeight="bold">
                    3. ML Engine
                  </Typography>
                </Box>
                <Typography variant="h6" color={palette.grey[400]}>
                  **Python** micro-runtime training **Random Forest** and **Gradient Boosting**
                  models with RSI, MACD, SMA technical indicators for 7-day forecasting.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                bgcolor: "rgba(255,255,255,0.02)",
                border: `1px solid ${palette.grey[800]}`,
                height: "100%",
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" gap="0.5rem" mb="1rem">
                  <StorageIcon sx={{ color: palette.primary[400] }} />
                  <Typography variant="h4" fontWeight="bold">
                    4. Database
                  </Typography>
                </Box>
                <Typography variant="h6" color={palette.grey[400]}>
                  **MongoDB** document database storing user portfolios, trade transactions, and
                  authentication data via **Mongoose** ODM schemas.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DashboardBox>
    </Box>
  );
};

export default Home;
