/**
 * ScreenReaderService
 * Epic 10, Story 3: Accessibility Support for Charts - Screen reader integration
 */

import * as Speech from 'expo-speech';
import { AccessibilityInfo, Platform } from 'react-native';

export interface ChartScreenReaderData {
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  data: ChartDataPoint[];
  summary: ChartSummary;
  trends: ChartTrend[];
  annotations?: ChartAnnotation[];
}

export interface ChartDataPoint {
  x: number | string;
  y: number;
  label?: string;
  description?: string;
  significance?: 'low' | 'medium' | 'high';
}

export interface ChartSummary {
  totalPoints: number;
  minValue: number;
  maxValue: number;
  averageValue: number;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  trendStrength: number; // 0-1
}

export interface ChartTrend {
  period: string;
  direction: 'up' | 'down' | 'stable';
  magnitude: number;
  description: string;
}

export interface ChartAnnotation {
  x: number | string;
  y: number;
  type: 'milestone' | 'event' | 'warning' | 'achievement';
  description: string;
}

export interface ScreenReaderOptions {
  language?: string;
  speechRate?: number;
  pitch?: number;
  includeDataPoints?: boolean;
  includeTrends?: boolean;
  includeAnnotations?: boolean;
  maxDataPoints?: number;
  detailLevel?: 'brief' | 'standard' | 'detailed';
}

export class ScreenReaderService {
  private static instance: ScreenReaderService;
  private isScreenReaderEnabled: boolean = false;
  private currentSpeechId: string | null = null;

  public static getInstance(): ScreenReaderService {
    if (!ScreenReaderService.instance) {
      ScreenReaderService.instance = new ScreenReaderService();
    }
    return ScreenReaderService.instance;
  }

  constructor() {
    this.initializeScreenReaderDetection();
  }

  /**
   * Initialize screen reader detection
   */
  private async initializeScreenReaderDetection() {
    try {
      this.isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      
      // Listen for screen reader changes
      AccessibilityInfo.addEventListener('screenReaderChanged', (enabled) => {
        this.isScreenReaderEnabled = enabled;
      });
    } catch (error) {
      console.error('Failed to initialize screen reader detection:', error);
    }
  }

  /**
   * Check if screen reader is enabled
   */
  public isScreenReaderActive(): boolean {
    return this.isScreenReaderEnabled;
  }

  /**
   * Generate comprehensive chart description for screen readers
   */
  public generateChartDescription(
    chartData: ChartScreenReaderData,
    options: ScreenReaderOptions = {}
  ): string {
    const {
      detailLevel = 'standard',
      includeDataPoints = true,
      includeTrends = true,
      includeAnnotations = true,
      maxDataPoints = 10,
    } = options;

    let description = '';

    // Chart introduction
    description += this.generateChartIntroduction(chartData);

    // Summary statistics
    description += this.generateSummaryDescription(chartData.summary);

    // Trend analysis
    if (includeTrends && chartData.trends.length > 0) {
      description += this.generateTrendDescription(chartData.trends);
    }

    // Data points (limited for brevity)
    if (includeDataPoints && chartData.data.length > 0) {
      description += this.generateDataPointsDescription(
        chartData.data,
        maxDataPoints,
        detailLevel
      );
    }

    // Annotations
    if (includeAnnotations && chartData.annotations && chartData.annotations.length > 0) {
      description += this.generateAnnotationsDescription(chartData.annotations);
    }

    // Navigation instructions
    description += this.generateNavigationInstructions();

    return description;
  }

  /**
   * Generate chart introduction
   */
  private generateChartIntroduction(chartData: ChartScreenReaderData): string {
    const { title, type, data } = chartData;
    return `${title}. This is a ${type} chart with ${data.length} data points. `;
  }

  /**
   * Generate summary description
   */
  private generateSummaryDescription(summary: ChartSummary): string {
    const { minValue, maxValue, averageValue, trend, trendStrength } = summary;
    
    let description = `Values range from ${this.formatValue(minValue)} to ${this.formatValue(maxValue)}, `;
    description += `with an average of ${this.formatValue(averageValue)}. `;
    
    const strengthText = trendStrength > 0.7 ? 'strong' : trendStrength > 0.4 ? 'moderate' : 'weak';
    description += `The overall trend is ${trend} with ${strengthText} consistency. `;
    
    return description;
  }

  /**
   * Generate trend description
   */
  private generateTrendDescription(trends: ChartTrend[]): string {
    let description = 'Key trends include: ';
    
    trends.forEach((trend, index) => {
      description += `${trend.period} shows ${trend.direction}ward movement of ${trend.magnitude.toFixed(1)}%. `;
      if (trend.description) {
        description += `${trend.description}. `;
      }
    });
    
    return description;
  }

  /**
   * Generate data points description
   */
  private generateDataPointsDescription(
    data: ChartDataPoint[],
    maxPoints: number,
    detailLevel: 'brief' | 'standard' | 'detailed'
  ): string {
    let description = '';
    
    // Select significant points
    const significantPoints = this.selectSignificantPoints(data, maxPoints);
    
    if (detailLevel === 'brief') {
      description += `Key data points: `;
      significantPoints.forEach((point, index) => {
        description += `${point.label || point.x} at ${this.formatValue(point.y)}`;
        if (index < significantPoints.length - 1) description += ', ';
      });
      description += '. ';
    } else {
      description += `Notable data points include: `;
      significantPoints.forEach((point, index) => {
        description += `${point.label || point.x} with value ${this.formatValue(point.y)}`;
        if (point.description) {
          description += `, ${point.description}`;
        }
        if (index < significantPoints.length - 1) description += '; ';
      });
      description += '. ';
    }
    
    return description;
  }

  /**
   * Generate annotations description
   */
  private generateAnnotationsDescription(annotations: ChartAnnotation[]): string {
    let description = 'Important annotations: ';
    
    annotations.forEach((annotation, index) => {
      description += `${annotation.type} at ${annotation.x}: ${annotation.description}`;
      if (index < annotations.length - 1) description += '; ';
    });
    
    description += '. ';
    return description;
  }

  /**
   * Generate navigation instructions
   */
  private generateNavigationInstructions(): string {
    return 'Use the navigation controls to explore individual data points, or access the data table for detailed information. ';
  }

  /**
   * Select most significant data points
   */
  private selectSignificantPoints(data: ChartDataPoint[], maxPoints: number): ChartDataPoint[] {
    // Sort by significance and value
    const sortedData = [...data].sort((a, b) => {
      const aSignificance = this.getSignificanceScore(a);
      const bSignificance = this.getSignificanceScore(b);
      
      if (aSignificance !== bSignificance) {
        return bSignificance - aSignificance;
      }
      
      return Math.abs(b.y) - Math.abs(a.y);
    });
    
    return sortedData.slice(0, maxPoints);
  }

  /**
   * Get significance score for data point
   */
  private getSignificanceScore(point: ChartDataPoint): number {
    switch (point.significance) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  /**
   * Format value for speech
   */
  private formatValue(value: number): string {
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)} million`;
    } else if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(1)} thousand`;
    } else if (Math.abs(value) >= 1) {
      return value.toFixed(0);
    } else {
      return value.toFixed(2);
    }
  }

  /**
   * Speak chart description
   */
  public async speakChartDescription(
    chartData: ChartScreenReaderData,
    options: ScreenReaderOptions = {}
  ): Promise<void> {
    const {
      language = 'en-US',
      speechRate = 1.0,
      pitch = 1.0,
    } = options;

    // Stop any current speech
    await this.stopSpeaking();

    const description = this.generateChartDescription(chartData, options);
    
    try {
      this.currentSpeechId = `chart_${Date.now()}`;
      
      await Speech.speak(description, {
        language,
        pitch,
        rate: speechRate,
        onDone: () => {
          this.currentSpeechId = null;
        },
        onStopped: () => {
          this.currentSpeechId = null;
        },
        onError: (error) => {
          console.error('Speech synthesis error:', error);
          this.currentSpeechId = null;
        },
      });
    } catch (error) {
      console.error('Failed to speak chart description:', error);
      this.currentSpeechId = null;
    }
  }

  /**
   * Speak individual data point
   */
  public async speakDataPoint(
    point: ChartDataPoint,
    index: number,
    total: number,
    options: ScreenReaderOptions = {}
  ): Promise<void> {
    const {
      language = 'en-US',
      speechRate = 1.0,
      pitch = 1.0,
    } = options;

    let description = `Data point ${index + 1} of ${total}. `;
    description += `${point.label || point.x}: ${this.formatValue(point.y)}`;
    
    if (point.description) {
      description += `. ${point.description}`;
    }

    try {
      await Speech.speak(description, {
        language,
        pitch,
        rate: speechRate,
      });
    } catch (error) {
      console.error('Failed to speak data point:', error);
    }
  }

  /**
   * Stop current speech
   */
  public async stopSpeaking(): Promise<void> {
    try {
      await Speech.stop();
      this.currentSpeechId = null;
    } catch (error) {
      console.error('Failed to stop speech:', error);
    }
  }

  /**
   * Check if currently speaking
   */
  public isSpeaking(): boolean {
    return this.currentSpeechId !== null;
  }

  /**
   * Generate accessible data table description
   */
  public generateDataTableDescription(data: ChartDataPoint[]): string {
    let description = `Data table with ${data.length} rows. `;
    description += 'Columns include: Point number, Label, Value, and Description. ';
    description += 'Navigate through rows using the table controls or swipe gestures. ';
    
    return description;
  }

  /**
   * Generate chart export description
   */
  public generateExportDescription(format: string): string {
    switch (format) {
      case 'table':
        return 'Exporting chart data as an accessible table format with proper headers and row descriptions.';
      case 'audio':
        return 'Generating audio description file with comprehensive chart analysis and data point details.';
      case 'text':
        return 'Creating text-based description file with structured chart information for screen readers.';
      default:
        return `Exporting chart data in ${format} format.`;
    }
  }

  /**
   * Announce chart updates
   */
  public async announceChartUpdate(updateType: string, details?: string): Promise<void> {
    let announcement = '';
    
    switch (updateType) {
      case 'data_changed':
        announcement = 'Chart data has been updated. ';
        break;
      case 'zoom_changed':
        announcement = 'Chart zoom level changed. ';
        break;
      case 'filter_applied':
        announcement = 'Chart filter applied. ';
        break;
      case 'selection_changed':
        announcement = 'Chart selection changed. ';
        break;
      default:
        announcement = 'Chart updated. ';
    }
    
    if (details) {
      announcement += details;
    }
    
    try {
      await Speech.speak(announcement, {
        language: 'en-US',
        rate: 1.2, // Slightly faster for announcements
      });
    } catch (error) {
      console.error('Failed to announce chart update:', error);
    }
  }
}
