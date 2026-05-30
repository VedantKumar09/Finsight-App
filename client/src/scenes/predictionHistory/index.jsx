import { useGetPredictionHistoryQuery } from "@/state/api";
import DashboardBox from "@/components/DashboardBox";
import FlexBetween from "@/components/FlexBetween";
import {
  Box,
  Typography,
  useTheme,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  DataGrid,
  GridToolbar,
} from "@mui/x-data-grid";
import { format } from "date-fns";

const PredictionHistory = () => {
  const { palette } = useTheme();
  const { data, isLoading, error } = useGetPredictionHistoryQuery();

  const columns = [
    {
      field: "createdAt",
      headerName: "Date",
      flex: 1,
      renderCell: (params) => {
        return format(new Date(params.value), "MMM dd, yyyy HH:mm");
      },
    },
    {
      field: "revenue",
      headerName: "Revenue",
      flex: 1,
      renderCell: (params) => `$${params.value.toLocaleString()}`,
    },
    {
      field: "expenses",
      headerName: "Expenses",
      flex: 1,
      renderCell: (params) => `$${params.value.toLocaleString()}`,
    },
    {
      field: "marketingSpend",
      headerName: "Marketing",
      flex: 0.8,
      renderCell: (params) => `$${params.value?.toLocaleString() || "0"}`,
    },
    {
      field: "operationalCosts",
      headerName: "Operational",
      flex: 0.8,
      renderCell: (params) => `$${params.value?.toLocaleString() || "0"}`,
    },
    {
      field: "predictedProfit",
      headerName: "Predicted Profit",
      flex: 1,
      renderCell: (params) => (
        <Typography
          sx={{
            color:
              params.value >= 0
                ? palette.primary[500]
                : palette.secondary[500],
            fontWeight: "bold",
          }}
        >
          ${params.value.toLocaleString()}
        </Typography>
      ),
    },
    {
      field: "confidence",
      headerName: "Confidence",
      flex: 0.8,
      renderCell: (params) => `${params.value?.toFixed(1) || 0}%`,
    },
  ];

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100%"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <DashboardBox width="100%" height="100%" p="1rem">
        <Alert severity="error">
          Failed to load prediction history. Please try again later.
        </Alert>
      </DashboardBox>
    );
  }

  return (
    <DashboardBox width="100%" height="100%" p="1rem" overflow="hidden">
      <FlexBetween m="1rem 2.5rem" gap="1rem">
        <Box>
          <Typography variant="h3">Prediction History</Typography>
          <Typography variant="h6">
            View all your previous profit predictions
          </Typography>
        </Box>
      </FlexBetween>
      <Box
        mt="0.5rem"
        height="75%"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: `1px solid ${palette.grey[800]} !important`,
          },
          "& .MuiDataGrid-columnHeaders": {
            borderBottom: `1px solid ${palette.grey[800]} !important`,
          },
          "& .MuiDataGrid-columnSeparator": {
            visibility: "hidden",
          },
        }}
      >
        <DataGrid
          rows={data || []}
          columns={columns}
          getRowId={(row) => row._id}
          slots={{ toolbar: GridToolbar }}
          sx={{
            color: palette.grey[300],
            "& .MuiDataGrid-toolbarContainer": {
              padding: "1rem",
            },
            "& .MuiDataGrid-toolbarContainer button": {
              color: `${palette.primary[500]} !important`,
            },
          }}
        />
      </Box>
    </DashboardBox>
  );
};

export default PredictionHistory;

