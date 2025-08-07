/**
 * Historical Market Data Service
 * Epic 9, Story 1: Historical Context for Assumptions
 * Provides historical market data and context for realistic assumption setting
 */

export interface HistoricalMarketData {
  period: string;
  description: string;
  inflationRate: {
    average: number;
    range: [number, number];
    context: string;
  };
  marketReturn: {
    average: number;
    range: [number, number];
    context: string;
  };
  economicContext: string;
  lessons: string[];
}

export interface AssumptionGuidance {
  parameter: 'inflation_rate' | 'market_return' | 'savings_rate';
  currentValue: number;
  historicalAverage: number;
  recommendedRange: [number, number];
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
  warnings?: string[];
  tips: string[];
}

/**
 * Historical Market Data Service
 */
export class HistoricalMarketDataService {
  private static instance: HistoricalMarketDataService;

  private constructor() {}

  public static getInstance(): HistoricalMarketDataService {
    if (!HistoricalMarketDataService.instance) {
      HistoricalMarketDataService.instance = new HistoricalMarketDataService();
    }
    return HistoricalMarketDataService.instance;
  }

  /**
   * Get historical market data for different periods
   */
  public getHistoricalData(): HistoricalMarketData[] {
    return [
      {
        period: '1970s - Stagflation Era',
        description: 'High inflation with stagnant economic growth',
        inflationRate: {
          average: 0.074,
          range: [0.034, 0.134],
          context: 'Oil crises led to unprecedented inflation rates',
        },
        marketReturn: {
          average: 0.058,
          range: [-0.265, 0.374],
          context: 'Volatile markets with negative real returns in many years',
        },
        economicContext: 'Oil shocks, wage-price spirals, and monetary policy challenges',
        lessons: [
          'High inflation can persist for extended periods',
          'Real returns can be negative during inflationary periods',
          'Diversification becomes crucial during volatile times',
        ],
      },
      {
        period: '1980s - Volcker Era',
        description: 'High interest rates to combat inflation',
        inflationRate: {
          average: 0.055,
          range: [0.013, 0.124],
          context: 'Fed aggressively raised rates to break inflation expectations',
        },
        marketReturn: {
          average: 0.176,
          range: [-0.049, 0.316],
          context: 'Strong bull market once inflation was tamed',
        },
        economicContext: 'Recession followed by strong recovery and bull market',
        lessons: [
          'Aggressive monetary policy can successfully combat inflation',
          'Short-term pain can lead to long-term gains',
          'Market timing is extremely difficult',
        ],
      },
      {
        period: '1990s - Great Moderation',
        description: 'Low inflation and steady growth',
        inflationRate: {
          average: 0.029,
          range: [0.015, 0.061],
          context: 'Stable monetary policy and productivity gains',
        },
        marketReturn: {
          average: 0.181,
          range: [-0.031, 0.378],
          context: 'Technology boom and economic expansion',
        },
        economicContext: 'Technological revolution and globalization',
        lessons: [
          'Low inflation supports higher valuations',
          'Technology can drive productivity and growth',
          'Bubbles can form even in good times',
        ],
      },
      {
        period: '2000s - Lost Decade',
        description: 'Two major market crashes',
        inflationRate: {
          average: 0.025,
          range: [-0.004, 0.054],
          context: 'Low inflation despite economic volatility',
        },
        marketReturn: {
          average: -0.009,
          range: [-0.370, 0.284],
          context: 'Dot-com crash and financial crisis led to negative decade',
        },
        economicContext: 'Dot-com bubble, 9/11, housing bubble, financial crisis',
        lessons: [
          'Markets can have extended periods of poor performance',
          'Diversification helps but doesn\'t eliminate all risk',
          'Staying invested through downturns is crucial',
        ],
      },
      {
        period: '2010s - Recovery & Growth',
        description: 'Post-crisis recovery and bull market',
        inflationRate: {
          average: 0.018,
          range: [-0.001, 0.032],
          context: 'Below-target inflation despite monetary stimulus',
        },
        marketReturn: {
          average: 0.135,
          range: [-0.043, 0.320],
          context: 'Longest bull market in history with QE support',
        },
        economicContext: 'Quantitative easing, low rates, and gradual recovery',
        lessons: [
          'Central bank intervention can support markets',
          'Low inflation can persist despite stimulus',
          'Bull markets can last longer than expected',
        ],
      },
      {
        period: '2020s - Pandemic Era',
        description: 'COVID-19 pandemic and policy response',
        inflationRate: {
          average: 0.041,
          range: [0.001, 0.091],
          context: 'Massive fiscal and monetary stimulus led to inflation surge',
        },
        marketReturn: {
          average: 0.089,
          range: [-0.196, 0.315],
          context: 'Initial crash followed by strong recovery',
        },
        economicContext: 'Pandemic, supply chain disruptions, and policy response',
        lessons: [
          'Black swan events can happen',
          'Policy response can be swift and massive',
          'Inflation can return unexpectedly',
        ],
      },
    ];
  }

  /**
   * Get assumption guidance based on historical data
   */
  public getAssumptionGuidance(
    parameter: 'inflation_rate' | 'market_return' | 'savings_rate',
    currentValue: number
  ): AssumptionGuidance {
    const historicalData = this.getHistoricalData();
    
    switch (parameter) {
      case 'inflation_rate':
        return this.getInflationGuidance(currentValue, historicalData);
      case 'market_return':
        return this.getMarketReturnGuidance(currentValue, historicalData);
      case 'savings_rate':
        return this.getSavingsRateGuidance(currentValue);
      default:
        throw new Error(`Unknown parameter: ${parameter}`);
    }
  }

  /**
   * Get inflation rate guidance
   */
  private getInflationGuidance(
    currentValue: number,
    historicalData: HistoricalMarketData[]
  ): AssumptionGuidance {
    const inflationRates = historicalData.map(d => d.inflationRate.average);
    const historicalAverage = inflationRates.reduce((a, b) => a + b) / inflationRates.length;
    
    const warnings: string[] = [];
    const tips: string[] = [];
    
    if (currentValue > 0.06) {
      warnings.push('High inflation assumption. Consider impact on purchasing power.');
    }
    if (currentValue < 0.015) {
      warnings.push('Very low inflation assumption. Deflation is rare historically.');
    }
    
    tips.push('Long-term average inflation in the US has been around 2-3%');
    tips.push('Consider different inflation scenarios for sensitivity analysis');
    tips.push('Healthcare and education costs often exceed general inflation');
    
    let confidence: 'low' | 'medium' | 'high' = 'medium';
    if (currentValue >= 0.02 && currentValue <= 0.04) {
      confidence = 'high';
    } else if (currentValue < 0.015 || currentValue > 0.08) {
      confidence = 'low';
    }
    
    return {
      parameter: 'inflation_rate',
      currentValue,
      historicalAverage,
      recommendedRange: [0.02, 0.04],
      confidence,
      reasoning: `Based on ${historicalData.length} decades of data, inflation has averaged ${(historicalAverage * 100).toFixed(1)}%. Your assumption of ${(currentValue * 100).toFixed(1)}% is ${currentValue > historicalAverage ? 'above' : 'below'} the historical average.`,
      warnings,
      tips,
    };
  }

  /**
   * Get market return guidance
   */
  private getMarketReturnGuidance(
    currentValue: number,
    historicalData: HistoricalMarketData[]
  ): AssumptionGuidance {
    const marketReturns = historicalData.map(d => d.marketReturn.average);
    const historicalAverage = marketReturns.reduce((a, b) => a + b) / marketReturns.length;
    
    const warnings: string[] = [];
    const tips: string[] = [];
    
    if (currentValue > 0.12) {
      warnings.push('High return assumption. Markets can underperform for decades.');
    }
    if (currentValue < 0.04) {
      warnings.push('Very conservative assumption. May require higher savings rates.');
    }
    
    tips.push('Long-term stock market returns have averaged 7-10% historically');
    tips.push('Consider sequence of returns risk in early retirement');
    tips.push('Diversification across asset classes can reduce volatility');
    
    let confidence: 'low' | 'medium' | 'high' = 'medium';
    if (currentValue >= 0.06 && currentValue <= 0.10) {
      confidence = 'high';
    } else if (currentValue < 0.04 || currentValue > 0.15) {
      confidence = 'low';
    }
    
    return {
      parameter: 'market_return',
      currentValue,
      historicalAverage,
      recommendedRange: [0.06, 0.10],
      confidence,
      reasoning: `Historical market returns have averaged ${(historicalAverage * 100).toFixed(1)}% across different decades. Your assumption of ${(currentValue * 100).toFixed(1)}% is ${currentValue > historicalAverage ? 'above' : 'below'} the historical average.`,
      warnings,
      tips,
    };
  }

  /**
   * Get savings rate guidance
   */
  private getSavingsRateGuidance(currentValue: number): AssumptionGuidance {
    const warnings: string[] = [];
    const tips: string[] = [];
    
    if (currentValue > 0.5) {
      warnings.push('Very high savings rate. Ensure this is sustainable long-term.');
    }
    if (currentValue < 0.1) {
      warnings.push('Low savings rate may significantly delay FIRE timeline.');
    }
    
    tips.push('FIRE community typically saves 25-70% of income');
    tips.push('Higher savings rates dramatically reduce time to FIRE');
    tips.push('Consider increasing income alongside reducing expenses');
    
    let confidence: 'low' | 'medium' | 'high' = 'medium';
    if (currentValue >= 0.15 && currentValue <= 0.40) {
      confidence = 'high';
    } else if (currentValue < 0.10 || currentValue > 0.70) {
      confidence = 'low';
    }
    
    return {
      parameter: 'savings_rate',
      currentValue,
      historicalAverage: 0.25, // Typical FIRE savings rate
      recommendedRange: [0.15, 0.40],
      confidence,
      reasoning: `FIRE practitioners typically save 15-40% of income. Your assumption of ${(currentValue * 100).toFixed(1)}% is ${currentValue >= 0.15 ? 'within' : 'below'} the typical FIRE range.`,
      warnings,
      tips,
    };
  }

  /**
   * Get contextual tips for current economic environment
   */
  public getCurrentEnvironmentTips(): string[] {
    return [
      'Current environment: Post-pandemic recovery with elevated inflation',
      'Consider impact of supply chain disruptions on inflation',
      'Interest rates are rising from historic lows',
      'Geopolitical tensions may affect market volatility',
      'Remote work trends may affect geographic arbitrage opportunities',
    ];
  }
}

export const historicalMarketDataService = HistoricalMarketDataService.getInstance();
