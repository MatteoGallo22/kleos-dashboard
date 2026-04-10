// Frontend/js/data.mock.js
export const DATA = {
  omnibus: {
    kyc: {
      verifiedPct: 92,
      pending: 18,
      rejected: 3,
      lastSync: "2025-12-15 10:32",
      notes: [
        "Identity verification",
        "Proof of address",
        "AML / Sanctions screening",
        "Investor classification",
        "Risk profiling",
      ],
    },

    performance: {
      aumEur: 12_450_000,
      pnlMtdPct: 2.34,
      pnlYtdPct: 14.10,
      vol30dPct: 3.2,
      sharpe: 1.18,
    },

    allocation: [
      { asset: "Fondo 1", weight: 38, bucket: "Fund" },
      { asset: "Fondo 2", weight: 22, bucket: "Fund" },
      { asset: "Trading 1", weight: 18, bucket: "Trading" },
      { asset: "Trading 2", weight: 12, bucket: "Trading" },
      { asset: "Liquidity", weight: 10, bucket: "Cash" },
    ],

    // ✅ KPI PANORAMICA BINANCE INVESTMENTS (MOCK)
    binanceOverview: {
      exposureBreakdown: {
        counterpartyExposurePct: 62,
        protocolExposurePct: 38,
        assetExposurePct: { btc: 28, eth: 22, stables: 40, others: 10 },
        capitalDeployedEur: 9_870_000,
        cashAvailableEur: 2_580_000,
      },

      aumCapitalAllocation: {
        totalAumEur: 12_450_000,
        aumByStrategyEur: {
          "Earn / Yield": 6_100_000,
          "Trading (Discretionary)": 4_200_000,
          "Market Making": 2_150_000,
        },
        aumByAssetEur: {
          BTC: 3_400_000,
          ETH: 2_700_000,
          USDC: 4_100_000,
          "Alt / Others": 2_250_000,
        },
        capitalDeployedEur: 9_870_000,
        idleCashEur: 2_580_000,
      },

      liquidity: {
        bucketsEur: {
          "T+0": 2_580_000,
          "T+1": 1_900_000,
          "T+7": 3_100_000,
          "T+30": 2_400_000,
          locked: 2_470_000,
        },
        redemptionConstraints: "T+7 standard · T+30 su prodotti locked",
      },

      performanceReturns: {
        timeframeLabel: "MTD",
        grossReturnMtdPct: 3.1,
        netReturnToUsersMtdPct: 2.34,
        pnlContributionEur: 286_000,
      },

      riskMetrics: {
        drawdownPct: 1.2,
        maxDrawdownPct: 3.85,
        exposureConcentrationTop3Pct: 54,
      },

      operationalHealth: {
        dataFreshness: "OK · 2m fa",
        apiIssues7d: 1,
        syncIssues7d: 0,
      },

      complianceControls: {
        strategyLimitsBreached: 0,
        mandateViolations: 0,
        allocationCapsBreached: 1,
        riskFlagsOpen: 2,
      },
    },
  },

  plans: {
    smart: {
      name: "Smart Yield",
      code: "Plan A",
      kyc: {
        verifiedPct: 90,
        pending: 10,
        rejected: 2,
        riskTier: "Moderato",
        suitability: "Retail",
      },
      performance: {
        aumEur: 3_200_000,
        pnlMtdPct: 1.1,
        pnlYtdPct: 8.9,
        maxDdPct: -4.2,
      },
      allocation: [
        { asset: "Fondo 1", weight: 55, bucket: "Fund" },
        { asset: "Trading 1", weight: 25, bucket: "Trading" },
        { asset: "Fondo 2", weight: 10, bucket: "Fund" },
        { asset: "Liquidity", weight: 10, bucket: "Cash" },
      ],
    },

    premium: {
      name: "Premium",
      code: "Plan B",
      kyc: {
        verifiedPct: 93,
        pending: 6,
        rejected: 1,
        riskTier: "Bilanciato",
        suitability: "HNW",
      },
      performance: {
        aumEur: 4_750_000,
        pnlMtdPct: 2.45,
        pnlYtdPct: 13.5,
        maxDdPct: -6.8,
      },
      allocation: [
        { asset: "Fondo 1", weight: 28, bucket: "Fund" },
        { asset: "Fondo 2", weight: 24, bucket: "Fund" },
        { asset: "Trading 1", weight: 30, bucket: "Trading" },
        { asset: "Liquidity", weight: 12, bucket: "Cash" },
        { asset: "Trading 2", weight: 6, bucket: "Trading" },
      ],
    },

    platinum: {
      name: "Platinum",
      code: "Plan C",
      kyc: {
        verifiedPct: 96,
        pending: 4,
        rejected: 0,
        riskTier: "Dinamico",
        suitability: "UHNWI",
      },
      performance: {
        aumEur: 4_500_000,
        pnlMtdPct: 3.85,
        pnlYtdPct: 19.1,
        maxDdPct: -9.4,
      },
      allocation: [
        { asset: "Fondo 1", weight: 34, bucket: "Fund" },
        { asset: "Fondo 2", weight: 26, bucket: "Fund" },
        { asset: "Trading 1", weight: 14, bucket: "Trading" },
        { asset: "Liquidity", weight: 18, bucket: "Cash" },
        { asset: "Trading 2", weight: 8, bucket: "Trading" },
      ],
    },
  },
};
