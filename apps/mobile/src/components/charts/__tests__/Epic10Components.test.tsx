/**
 * Epic 10 Components Test
 * Basic compilation and rendering tests for all Epic 10 chart components
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { HighContrastThemeProvider } from '../../../contexts/HighContrastThemeContext';

// Mock Victory components to avoid native dependencies in tests
jest.mock('victory', () => ({
  VictoryChart: ({ children }: any) => <div data-testid="victory-chart">{children}</div>,
  VictoryLine: () => <div data-testid="victory-line" />,
  VictoryArea: () => <div data-testid="victory-area" />,
  VictoryScatter: () => <div data-testid="victory-scatter" />,
  VictoryAxis: () => <div data-testid="victory-axis" />,
  VictoryTheme: { material: {} },
  VictoryTooltip: () => <div data-testid="victory-tooltip" />,
  VictoryContainer: ({ children }: any) => <div data-testid="victory-container">{children}</div>,
  VictoryLabel: () => <div data-testid="victory-label" />,
  VictoryAnimation: ({ children }: any) => <div data-testid="victory-animation">{children}</div>,
  VictoryBar: () => <div data-testid="victory-bar" />,
  VictoryLegend: () => <div data-testid="victory-legend" />,
  VictoryZoomContainer: ({ children }: any) => <div data-testid="victory-zoom-container">{children}</div>,
  VictoryBrushContainer: ({ children }: any) => <div data-testid="victory-brush-container">{children}</div>,
}));

// Mock expo-speech
jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
}));

// Mock gesture handler
jest.mock('react-native-gesture-handler', () => ({
  PanGestureHandler: ({ children }: any) => children,
  PinchGestureHandler: ({ children }: any) => children,
  State: { BEGAN: 0, ACTIVE: 1, END: 2 },
}));

// Mock haptic service
jest.mock('../../../hooks/useHaptic', () => ({
  useHaptic: () => ({
    buttonTap: jest.fn(),
    impactLight: jest.fn(),
    impactMedium: jest.fn(),
    impactHeavy: jest.fn(),
  }),
}));

// Mock chart haptics
jest.mock('../../../hooks/useChartHaptics', () => ({
  useChartHaptics: () => ({
    onZoomIn: jest.fn(),
    onZoomOut: jest.fn(),
    onPanStart: jest.fn(),
    onPanEnd: jest.fn(),
    onDataPointTap: jest.fn(),
    onMilestoneAchieved: jest.fn(),
  }),
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <HighContrastThemeProvider>
      {children}
    </HighContrastThemeProvider>
  </ThemeProvider>
);

describe('Epic 10 Chart Components', () => {
  describe('Component Compilation', () => {
    it('should compile AchievementVisualization without errors', () => {
      const { AchievementVisualization } = require('../AchievementVisualization');
      
      const mockMilestones = [
        {
          id: '1',
          name: 'First $10K',
          targetAmount: 10000,
          currentAmount: 8500,
          targetDate: '2024-12-31',
          achieved: false,
          category: 'savings' as const,
        },
      ];

      expect(() => {
        render(
          <TestWrapper>
            <AchievementVisualization milestones={mockMilestones} />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('should compile ChartAccessibility without errors', () => {
      const { ChartAccessibility } = require('../ChartAccessibility');
      
      const mockChartData = [
        { x: 1, y: 100, label: 'Point 1' },
        { x: 2, y: 200, label: 'Point 2' },
      ];

      expect(() => {
        render(
          <TestWrapper>
            <ChartAccessibility 
              chartData={mockChartData}
              chartType="line"
              title="Test Chart"
            />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('should compile NetWorthGrowthVisualization without errors', () => {
      const { NetWorthGrowthVisualization } = require('../NetWorthGrowthVisualization');
      
      const mockHistoricalData = [
        {
          date: '2023-01-01',
          netWorth: 50000,
          assets: 60000,
          liabilities: 10000,
        },
        {
          date: '2023-12-31',
          netWorth: 75000,
          assets: 85000,
          liabilities: 10000,
        },
      ];

      expect(() => {
        render(
          <TestWrapper>
            <NetWorthGrowthVisualization historicalData={mockHistoricalData} />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('should compile VisualScenarioComparison without errors', () => {
      const { VisualScenarioComparison } = require('../VisualScenarioComparison');
      
      const mockScenarios = [
        {
          id: '1',
          name: 'Conservative',
          color: '#4CAF50',
          probability: 0.7,
          data: [
            { year: 2024, value: 100000 },
            { year: 2025, value: 110000 },
          ],
          riskLevel: 'low' as const,
          expectedReturn: 0.05,
          volatility: 0.1,
        },
      ];

      expect(() => {
        render(
          <TestWrapper>
            <VisualScenarioComparison scenarios={mockScenarios} />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('should compile ChartCustomization without errors', () => {
      const { ChartCustomization } = require('../ChartCustomization');

      expect(() => {
        render(
          <TestWrapper>
            <ChartCustomization onSettingsChange={jest.fn()} />
          </TestWrapper>
        );
      }).not.toThrow();
    });
  });

  describe('Service Compilation', () => {
    it('should compile ScreenReaderService without errors', () => {
      expect(() => {
        const { ScreenReaderService } = require('../../../services/accessibility/ScreenReaderService');
        const service = ScreenReaderService.getInstance();
        expect(service).toBeDefined();
      }).not.toThrow();
    });

    it('should compile ChartExportService without errors', () => {
      expect(() => {
        const { ChartExportService } = require('../../../services/charts/ChartExportService');
        const service = ChartExportService.getInstance();
        expect(service).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Context Compilation', () => {
    it('should compile HighContrastThemeContext without errors', () => {
      expect(() => {
        const { HighContrastThemeProvider, useHighContrastTheme } = require('../../../contexts/HighContrastThemeContext');
        expect(HighContrastThemeProvider).toBeDefined();
        expect(useHighContrastTheme).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Hook Compilation', () => {
    it('should compile useChartHaptics without errors', () => {
      expect(() => {
        const { useChartHaptics } = require('../../../hooks/useChartHaptics');
        expect(useChartHaptics).toBeDefined();
      }).not.toThrow();
    });
  });
});

describe('Epic 10 Integration', () => {
  it('should have all required Epic 10 components available', () => {
    const components = [
      'AchievementVisualization',
      'ChartAccessibility', 
      'ChartCustomization',
      'Chart3D',
      'InteractiveProjectionTimeline',
      'NetWorthGrowthVisualization',
      'TimelineZoomController',
      'VisualScenarioComparison',
    ];

    components.forEach(componentName => {
      expect(() => {
        require(`../${componentName}`);
      }).not.toThrow();
    });
  });

  it('should have all required Epic 10 services available', () => {
    const services = [
      '../../../services/accessibility/ScreenReaderService',
      '../../../services/charts/ChartExportService',
    ];

    services.forEach(servicePath => {
      expect(() => {
        require(servicePath);
      }).not.toThrow();
    });
  });
});
