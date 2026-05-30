import DashboardBox from "@/components/DashboardBox";
import FlexBetween from "@/components/FlexBetween";
import { useGetKpisQuery, useMakePredictionMutation } from "@/state/api";
import {
  Box,
  Button,
  Typography,
  useTheme,
  TextField,
  Alert,
  CircularProgress,
  Grid,
} from "@mui/material";
import React, { useMemo, useState } from "react";
import {
  CartesianGrid,
  Label,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import regression from "regression";

const Predictions = () => {
  const { palette } = useTheme();
  const [isPredictions, setIsPredictions] = useState(false);
  const [predictionForm, setPredictionForm] = useState({
    revenue: "",
    expenses: "",
    marketingSpend: "",
    operationalCosts: "",
  });
  const [predictionResult, setPredictionResult] = useState(null);
  const [error, setError] = useState("");
  const [makePrediction, { isLoading: isPredicting }] = useMakePredictionMutation();
  const { data: kpiData } = useGetKpisQuery();

  const formattedData = useMemo(() => {
    if (!kpiData) return [];
    const monthData = kpiData[0].monthlyData;

    const formatted = monthData.map(
      ({ revenue }, i) => {
        return [i, revenue];
      }
    );
    const regressionLine = regression.linear(formatted);

    return monthData.map(({ month, revenue }, i) => {
      return {
        name: month,
        "Actual Revenue": revenue,
        "Regression Line": regressionLine.points[i][1],
        "Predicted Revenue": regressionLine.predict(i + 12)[1],
      };
    });
  }, [kpiData]);

  const handleInputChange = (e) => {
    setPredictionForm({
      ...predictionForm,
      [e.target.name]: e.target.value,
    });
    setError("");
    setPredictionResult(null);
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setError("");
    setPredictionResult(null);

    if (!predictionForm.revenue || !predictionForm.expenses) {
      setError("Revenue and expenses are required");
      return;
    }

    try {
      const result = await makePrediction({
        revenue: parseFloat(predictionForm.revenue),
        expenses: parseFloat(predictionForm.expenses),
        marketingSpend: predictionForm.marketingSpend
          ? parseFloat(predictionForm.marketingSpend)
          : 0,
        operationalCosts: predictionForm.operationalCosts
          ? parseFloat(predictionForm.operationalCosts)
          : 0,
      }).unwrap();

      setPredictionResult(result);
    } catch (err) {
      setError(err?.data?.message || "Prediction failed. Please try again.");
    }
  };

  return (
    <Box display="flex" flexDirection="column" gap="1rem" height="100%">
      {/* ML Prediction Form */}
      <DashboardBox width="100%" p="1.5rem">
        <Typography variant="h3" mb="1rem">
          Profit Prediction (ML Model)
        </Typography>
        <Typography variant="h6" mb="1.5rem" sx={{ color: palette.grey[400] }}>
          Enter financial data to predict profit using our trained Random Forest model
        </Typography>

        <form onSubmit={handlePredict}>
          <Grid container spacing={2} mb="1.5rem">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Revenue ($)"
                name="revenue"
                type="number"
                value={predictionForm.revenue}
                onChange={handleInputChange}
                required
                sx={{ backgroundColor: palette.background.light }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Expenses ($)"
                name="expenses"
                type="number"
                value={predictionForm.expenses}
                onChange={handleInputChange}
                required
                sx={{ backgroundColor: palette.background.light }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Marketing Spend ($)"
                name="marketingSpend"
                type="number"
                value={predictionForm.marketingSpend}
                onChange={handleInputChange}
                sx={{ backgroundColor: palette.background.light }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Operational Costs ($)"
                name="operationalCosts"
                type="number"
                value={predictionForm.operationalCosts}
                onChange={handleInputChange}
                sx={{ backgroundColor: palette.background.light }}
              />
            </Grid>
          </Grid>

          <Button
            type="submit"
            variant="contained"
            disabled={isPredicting}
            sx={{
              backgroundColor: palette.primary[500],
              color: palette.grey[900],
              "&:hover": {
                backgroundColor: palette.primary[600],
              },
            }}
          >
            {isPredicting ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Predicting...
              </>
            ) : (
              "Predict Profit"
            )}
          </Button>
        </form>

        {error && (
          <Alert severity="error" sx={{ mt: "1rem" }}>
            {error}
          </Alert>
        )}

        {predictionResult && (
          <Box mt="1.5rem" p="1rem" sx={{ backgroundColor: palette.background.light, borderRadius: "0.5rem" }}>
            <Typography variant="h4" mb="0.5rem">
              Prediction Result
            </Typography>
            <Typography variant="h3" sx={{ color: palette.primary[500] }}>
              ${predictionResult.predictedProfit.toLocaleString()}
            </Typography>
            <Typography variant="h6" sx={{ color: palette.grey[400] }}>
              Confidence: {predictionResult.confidence.toFixed(1)}%
            </Typography>
          </Box>
        )}
      </DashboardBox>

      {/* Revenue Chart (Existing) */}
      <DashboardBox width="100%" height="100%" p="1rem" overflow="hidden">
        <FlexBetween m="1rem 2.5rem" gap="1rem">
          <Box>
            <Typography variant="h3">Revenue and Predictions</Typography>
            <Typography variant="h6">
              charted revenue and predicted revenue based on a simple linear
              regression model
            </Typography>
          </Box>
          <Button
            onClick={() => setIsPredictions(!isPredictions)}
            sx={{
              color: palette.grey[900],
              backgroundColor: palette.grey[700],
              boxShadow: "0.1rem 0.1rem 0.1rem 0.1rem rgba(0,0,0,.4)",
            }}
          >
            Show Predicted Revenue for Next Year
          </Button>
        </FlexBetween>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={formattedData}
            margin={{
              top: 20,
              right: 75,
              left: 20,
              bottom: 80,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={palette.grey[800]} />
            <XAxis dataKey="name" tickLine={false} style={{ fontSize: "10px" }}>
              <Label value="Month" offset={-5} position="insideBottom" />
            </XAxis>
            <YAxis
              domain={[12000, 26000]}
              axisLine={{ strokeWidth: "0" }}
              style={{ fontSize: "10px" }}
              tickFormatter={(v) => `$${v}`}
            >
              <Label
                value="Revenue in USD"
                angle={-90}
                offset={-5}
                position="insideLeft"
              />
            </YAxis>
            <Tooltip />
            <Legend verticalAlign="top" />
            <Line
              type="monotone"
              dataKey="Actual Revenue"
              stroke={palette.primary.main}
              strokeWidth={0}
              dot={{ strokeWidth: 5 }}
            />
            <Line
              type="monotone"
              dataKey="Regression Line"
              stroke="#8884d8"
              dot={false}
            />
            {isPredictions && (
              <Line
                strokeDasharray="5 5"
                dataKey="Predicted Revenue"
                stroke={palette.secondary[500]}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </DashboardBox>
    </Box>
  );
};

export default Predictions;
