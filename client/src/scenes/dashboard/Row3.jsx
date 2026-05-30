import BoxHeader from "@/components/BoxHeader";
import DashboardBox from "@/components/DashboardBox";
import FlexBetween from "@/components/FlexBetween";
import {
  useGetKpisQuery,
  useGetProductsQuery,
  useGetTransactionsQuery,
} from "@/state/api";
import { Box, Typography, useTheme } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import React, { useMemo } from "react";
import { Cell, Pie, PieChart } from "recharts";

const Row3 = () => {
  const { palette } = useTheme();
  const pieColors = [palette.primary[800], palette.primary[500]];

  const { data: kpiData } = useGetKpisQuery();
  const { data: productData } = useGetProductsQuery();
  const { data: transactionData } = useGetTransactionsQuery();

  const pieChartData = useMemo(() => {
    if (kpiData) {
      const totalExpenses = kpiData[0].totalExpenses;
      return Object.entries(kpiData[0].expensesByCategory).map(
        ([key, value]) => {
          return [
            {
              name: key,
              value: value,
            },
            {
              name: `${key} of Total`,
              value: totalExpenses - value,
            },
          ];
        }
      );
    }
  }, [kpiData]);

  // Map product data to standard budget categories
  const mappedProductData = useMemo(() => {
    if (!productData) return [];
    const categories = [
      "Housing & Rent",
      "Groceries & Food",
      "Auto & Transport",
      "Utilities & Bills",
      "Insurance & Medical",
      "Dining & Leisure",
      "Entertainment & Media",
      "Shopping & Apparel",
      "Personal Savings",
      "Investments Portfolio",
    ];
    return productData.map((prod, index) => ({
      ...prod,
      id: prod._id, // DataGrid expects "id" property
      categoryName: categories[index % categories.length],
    }));
  }, [productData]);

  const productColumns = [
    {
      field: "categoryName",
      headerName: "Budget Category",
      flex: 1,
    },
    {
      field: "price",
      headerName: "Budget Limit",
      flex: 0.5,
      renderCell: (params) => `$${params.value}`,
    },
    {
      field: "expense",
      headerName: "Amount Spent",
      flex: 0.5,
      renderCell: (params) => `$${params.value}`,
    },
  ];

  // Map transaction data for DataGrid
  const mappedTransactionData = useMemo(() => {
    if (!transactionData) return [];
    return transactionData.map((trans) => ({
      ...trans,
      id: trans._id, // DataGrid expects "id" property
    }));
  }, [transactionData]);

  const transactionColumns = [
    {
      field: "id",
      headerName: "Transaction ID",
      flex: 0.75,
    },
    {
      field: "buyer",
      headerName: "Merchant / Description",
      flex: 0.67,
    },
    {
      field: "amount",
      headerName: "Amount",
      flex: 0.35,
      renderCell: (params) => `$${params.value}`,
    },
  ];

  return (
    <>
      <DashboardBox>
        <BoxHeader
          title="Linked Budgets vs Spent"
          sideText={`${mappedProductData?.length} budgets active`}
        />
        <Box
          mt="0.5rem"
          p="0 0.5rem"
          height="75%"
          sx={{
            "& .MuiDataGrid-root": {
              color: palette.grey[300],
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
            columnHeaderHeight={25}
            rowHeight={35}
            hideFooter={true}
            rows={mappedProductData || []}
            columns={productColumns}
          />
        </Box>
      </DashboardBox>

      <DashboardBox>
        <BoxHeader
          title="Recent Transactions Ledger"
          sideText={`${mappedTransactionData?.length} latest transactions`}
        />
        <Box
          mt="1rem"
          p="0 0.5rem"
          height="80%"
          sx={{
            "& .MuiDataGrid-root": {
              color: palette.grey[300],
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
            columnHeaderHeight={25}
            rowHeight={35}
            hideFooter={true}
            rows={mappedTransactionData || []}
            columns={transactionColumns}
          />
        </Box>
      </DashboardBox>

      <DashboardBox>
        <BoxHeader title="Expense Breakdown By Category" sideText="Monthly" />
        <FlexBetween mt="0.5rem" gap="0.5rem" p="0 1rem" textAlign="center">
          {pieChartData?.map((data, i) => (
            <Box key={`${data[0].name}-${i}`}>
              <PieChart width={110} height={100}>
                <Pie
                  stroke="none"
                  data={data}
                  innerRadius={18}
                  outerRadius={35}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index]} />
                  ))}
                </Pie>
              </PieChart>
              <Typography variant="h5">{data[0].name}</Typography>
            </Box>
          ))}
        </FlexBetween>
      </DashboardBox>

      <DashboardBox>
        <BoxHeader title="Linked Financial Accounts" sideText="Active Status" />
        <Box p="1.5rem" display="flex" flexDirection="column" gap="1rem">
          <FlexBetween>
            <Typography variant="h5" color={palette.grey[300]}>Checking Account (Chase Bank)</Typography>
            <Typography variant="h4" color={palette.primary[500]} fontWeight="bold">$5,420.50</Typography>
          </FlexBetween>
          <FlexBetween>
            <Typography variant="h5" color={palette.grey[300]}>Savings Account (Marcus High-Yield)</Typography>
            <Typography variant="h4" color={palette.primary[500]} fontWeight="bold">$18,340.20</Typography>
          </FlexBetween>
          <FlexBetween>
            <Typography variant="h5" color={palette.grey[300]}>Brokerage Portfolio (Fidelity)</Typography>
            <Typography variant="h4" color={palette.primary[500]} fontWeight="bold">$12,500.00</Typography>
          </FlexBetween>
          <FlexBetween>
            <Typography variant="h5" color={palette.grey[300]}>Credit Card Balance (Rewards Visa)</Typography>
            <Typography variant="h4" color={palette.secondary[500]} fontWeight="bold">-$1,240.10</Typography>
          </FlexBetween>
        </Box>
      </DashboardBox>
    </>
  );
};

export default Row3;
