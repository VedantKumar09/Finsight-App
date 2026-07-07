import { useEffect, useRef, useState, useCallback } from "react";

export function useMarketWebSocket(tickers = []) {
  const [livePrices, setLivePrices] = useState({});
  const [connected, setConnected] = useState(false);
  const [authError, setAuthError] = useState(false);
  const wsRef = useRef(null);
  const subscribedRef = useRef(new Set());
  const tickersRef = useRef(tickers);
  const reconnectRef = useRef({ attempts: 0, max: 6, timeout: null });

  useEffect(() => {
    tickersRef.current = tickers;
  }, [tickers]);

  useEffect(() => {
    let mounted = true;

    const connect = () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const rawBaseUrl = import.meta.env.VITE_BASE_URL || "";
      const baseUrl = rawBaseUrl.replace(/\/$/, "");
      const wsUrl = `${baseUrl.replace(/^http/, "ws")}/ws/market?token=${token}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mounted) return;
        setAuthError(false);
        setConnected(true);
        reconnectRef.current.attempts = 0;
        if (tickersRef.current.length > 0) {
          ws.send(
            JSON.stringify({
              type: "subscribe",
              tickers: tickersRef.current,
            })
          );
          tickersRef.current.forEach((t) => subscribedRef.current.add(t.toUpperCase()));
        }
      };

      ws.onmessage = (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        if (msg.type === "priceUpdate" && msg.data) {
          setLivePrices((prev) => ({ ...prev, ...msg.data }));
        }
      };

      ws.onclose = (event) => {
        if (!mounted) return;
        setConnected(false);
        if (event && event.code === 1008) {
          setAuthError(true);
          return;
        }

        // try to reconnect with exponential backoff
        const attempts = reconnectRef.current.attempts + 1;
        reconnectRef.current.attempts = attempts;
        if (attempts <= reconnectRef.current.max) {
          const delay = Math.min(30000, 1000 * 2 ** attempts);
          reconnectRef.current.timeout = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        setConnected(false);
      };
    };

    connect();

    return () => {
      mounted = false;
      clearTimeout(reconnectRef.current.timeout);
      try {
        wsRef.current?.close();
      } catch {}
    };
  }, []);

  const updateSubscriptions = useCallback((newTickers) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const current = new Set(subscribedRef.current);
    const next = new Set(newTickers.map((t) => t.toUpperCase()));

    const toAdd = [...next].filter((t) => !current.has(t));
    const toRemove = [...current].filter((t) => !next.has(t));

    if (toAdd.length > 0) {
      ws.send(JSON.stringify({ type: "subscribe", tickers: toAdd }));
    }
    if (toRemove.length > 0) {
      ws.send(JSON.stringify({ type: "unsubscribe", tickers: toRemove }));
    }

    subscribedRef.current = next;
  }, []);

  return { livePrices, connected, authError, updateSubscriptions };
}
