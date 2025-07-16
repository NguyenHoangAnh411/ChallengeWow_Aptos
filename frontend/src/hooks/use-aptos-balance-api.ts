import { useEffect, useState } from "react";
import { aptosApi } from "@/lib/api";

export function useAptosBalanceApi(address?: string | null) {
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address || typeof address !== "string" || address.length < 10) {
      setBalance(null);
      return;
    }
    setLoading(true);
    aptosApi.getAccountBalance(address)
      .then((response) => {
        // API trả về { success: true, data: { balance_apt: 10.9685936, ... } }
        if (response?.data?.balance_apt !== undefined) {
          setBalance(response.data.balance_apt.toFixed(3));
        } else {
          setBalance("0");
        }
      })
      .catch(() => setBalance(null))
      .finally(() => setLoading(false));
  }, [address]);

  return { balance, loading };
} 