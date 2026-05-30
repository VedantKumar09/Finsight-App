import { Box } from "@mui/material";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { useMemo } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { themeSettings } from "./theme";
import Navbar from "@/scenes/navbar";
import Dashboard from "@/scenes/dashboard";
import Login from "@/scenes/login";
import Register from "@/scenes/register";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "@/scenes/home";
import Simulator from "@/scenes/simulator";
import StockPredictions from "@/scenes/stockPredictions";

function App() {
  const theme = useMemo(() => createTheme(themeSettings), []);

  return (
    <div className="app">
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Box width="100%" height="100%" padding="1rem 2rem 4rem 2rem">
                    <Navbar />
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/simulator" element={<Simulator />} />
                      <Route path="/stock-predictions" element={<StockPredictions />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Box>
                </ProtectedRoute>
              }
            />
          </Routes>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
