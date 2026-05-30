import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_BASE_URL,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("token");
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const api = createApi({
  baseQuery,
  reducerPath: "main",
  tagTypes: ["Portfolio", "TradeHistory"],
  endpoints: (build) => ({
    // Auth
    register: build.mutation({
      query: (body) => ({
        url: "auth/register",
        method: "POST",
        body,
      }),
    }),
    login: build.mutation({
      query: (body) => ({
        url: "auth/login",
        method: "POST",
        body,
      }),
    }),

    // Market / Simulator
    searchStock: build.query({
      query: ({ ticker, range = "1mo", interval = "1d" }) =>
        `market/search/${ticker}?range=${range}&interval=${interval}`,
    }),
    buyStock: build.mutation({
      query: (body) => ({
        url: "market/buy",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Portfolio", "TradeHistory"],
    }),
    sellStock: build.mutation({
      query: (body) => ({
        url: "market/sell",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Portfolio", "TradeHistory"],
    }),
    getPortfolio: build.query({
      query: () => "market/portfolio",
      providesTags: ["Portfolio"],
    }),
    getTradeHistory: build.query({
      query: () => "market/history",
      providesTags: ["TradeHistory"],
    }),
    getWatchlist: build.query({
      query: () => "market/watchlist",
    }),

    // Stock Prediction ML
    predictStock: build.mutation({
      query: (body) => ({
        url: "predict-stock/",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useSearchStockQuery,
  useLazySearchStockQuery,
  useBuyStockMutation,
  useSellStockMutation,
  useGetPortfolioQuery,
  useGetTradeHistoryQuery,
  useGetWatchlistQuery,
  usePredictStockMutation,
} = api;
