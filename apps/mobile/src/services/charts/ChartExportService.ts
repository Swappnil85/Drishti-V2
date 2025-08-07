/**
 * ChartExportService
 * Epic 10, Story 2: Interactive Projection Timeline Graphs - Chart export functionality
 */

import { Share, Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

export type ExportFormat = 'PNG' | 'PDF' | 'SVG' | 'CSV' | 'JSON';

export interface ChartExportData {
  title: string;
  data: any[];
  metadata?: {
    generatedAt: string;
    source: string;
    version: string;
    [key: string]: any;
  };
}

export interface ExportOptions {
  quality?: number; // 0-1 for image formats
  width?: number;
  height?: number;
  backgroundColor?: string;
  includeMetadata?: boolean;
  filename?: string;
}

export class ChartExportService {
  private static instance: ChartExportService;

  public static getInstance(): ChartExportService {
    if (!ChartExportService.instance) {
      ChartExportService.instance = new ChartExportService();
    }
    return ChartExportService.instance;
  }

  /**
   * Export chart as image (PNG)
   */
  async exportAsPNG(
    chartRef: any,
    options: ExportOptions = {}
  ): Promise<string> {
    try {
      const {
        quality = 1.0,
        width = 800,
        height = 600,
        backgroundColor = '#FFFFFF',
        filename = `chart_${Date.now()}.png`,
      } = options;

      const uri = await captureRef(chartRef, {
        format: 'png',
        quality,
        width,
        height,
        result: 'tmpfile',
      });

      // Save to device
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.moveAsync({
        from: uri,
        to: fileUri,
      });

      return fileUri;
    } catch (error) {
      console.error('PNG export failed:', error);
      throw new Error('Failed to export chart as PNG');
    }
  }

  /**
   * Export chart data as CSV
   */
  async exportAsCSV(
    data: ChartExportData,
    options: ExportOptions = {}
  ): Promise<string> {
    try {
      const {
        filename = `chart_data_${Date.now()}.csv`,
        includeMetadata = true,
      } = options;

      let csvContent = '';

      // Add metadata as comments if requested
      if (includeMetadata && data.metadata) {
        csvContent += `# Chart Export: ${data.title}\n`;
        csvContent += `# Generated: ${data.metadata.generatedAt}\n`;
        csvContent += `# Source: ${data.metadata.source}\n`;
        csvContent += `# Version: ${data.metadata.version}\n`;
        csvContent += '\n';
      }

      // Convert data to CSV format
      if (data.data.length > 0) {
        // Get headers from first data object
        const headers = Object.keys(data.data[0]);
        csvContent += headers.join(',') + '\n';

        // Add data rows
        data.data.forEach(row => {
          const values = headers.map(header => {
            const value = row[header];
            // Escape commas and quotes in values
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          });
          csvContent += values.join(',') + '\n';
        });
      }

      // Save to file
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      return fileUri;
    } catch (error) {
      console.error('CSV export failed:', error);
      throw new Error('Failed to export chart data as CSV');
    }
  }

  /**
   * Export chart data as JSON
   */
  async exportAsJSON(
    data: ChartExportData,
    options: ExportOptions = {}
  ): Promise<string> {
    try {
      const {
        filename = `chart_data_${Date.now()}.json`,
        includeMetadata = true,
      } = options;

      const exportData = {
        title: data.title,
        ...(includeMetadata && { metadata: data.metadata }),
        data: data.data,
        exportedAt: new Date().toISOString(),
      };

      const jsonContent = JSON.stringify(exportData, null, 2);

      // Save to file
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, jsonContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      return fileUri;
    } catch (error) {
      console.error('JSON export failed:', error);
      throw new Error('Failed to export chart data as JSON');
    }
  }

  /**
   * Export chart as SVG
   */
  async exportAsSVG(
    svgContent: string,
    options: ExportOptions = {}
  ): Promise<string> {
    try {
      const {
        filename = `chart_${Date.now()}.svg`,
        includeMetadata = true,
      } = options;

      let finalSvgContent = svgContent;

      // Add metadata if requested
      if (includeMetadata) {
        const metadata = `
          <!-- Generated by Drishti Chart Export -->
          <!-- Date: ${new Date().toISOString()} -->
          <!-- Platform: ${Platform.OS} -->
        `;
        finalSvgContent = finalSvgContent.replace('<svg', `${metadata}\n<svg`);
      }

      // Save to file
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, finalSvgContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      return fileUri;
    } catch (error) {
      console.error('SVG export failed:', error);
      throw new Error('Failed to export chart as SVG');
    }
  }

  /**
   * Export chart as PDF (simplified implementation)
   */
  async exportAsPDF(
    chartRef: any,
    options: ExportOptions = {}
  ): Promise<string> {
    try {
      // For now, export as high-quality PNG and let the user convert
      // In a full implementation, you'd use a PDF generation library
      const pngUri = await this.exportAsPNG(chartRef, {
        ...options,
        quality: 1.0,
        width: 1200,
        height: 900,
      });

      // Rename to indicate it's for PDF conversion
      const filename = options.filename?.replace('.pdf', '.png') || `chart_for_pdf_${Date.now()}.png`;
      const pdfReadyUri = `${FileSystem.documentDirectory}${filename}`;
      
      await FileSystem.moveAsync({
        from: pngUri,
        to: pdfReadyUri,
      });

      return pdfReadyUri;
    } catch (error) {
      console.error('PDF export failed:', error);
      throw new Error('Failed to export chart as PDF');
    }
  }

  /**
   * Share exported chart
   */
  async shareChart(fileUri: string, title: string = 'Chart Export'): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Share.share({
          url: fileUri,
          title,
        });
      } else {
        await Share.share({
          url: fileUri,
          title,
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
      throw new Error('Failed to share chart');
    }
  }

  /**
   * Save to device gallery (for images)
   */
  async saveToGallery(fileUri: string): Promise<void> {
    try {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Gallery permission not granted');
      }

      // Save to gallery
      await MediaLibrary.saveToLibraryAsync(fileUri);
    } catch (error) {
      console.error('Save to gallery failed:', error);
      throw new Error('Failed to save chart to gallery');
    }
  }

  /**
   * Get export options for different formats
   */
  getExportOptions(format: ExportFormat): {
    supportedOptions: string[];
    defaultOptions: ExportOptions;
  } {
    switch (format) {
      case 'PNG':
        return {
          supportedOptions: ['quality', 'width', 'height', 'backgroundColor', 'filename'],
          defaultOptions: {
            quality: 1.0,
            width: 800,
            height: 600,
            backgroundColor: '#FFFFFF',
          },
        };

      case 'SVG':
        return {
          supportedOptions: ['includeMetadata', 'filename'],
          defaultOptions: {
            includeMetadata: true,
          },
        };

      case 'CSV':
      case 'JSON':
        return {
          supportedOptions: ['includeMetadata', 'filename'],
          defaultOptions: {
            includeMetadata: true,
          },
        };

      case 'PDF':
        return {
          supportedOptions: ['width', 'height', 'backgroundColor', 'filename'],
          defaultOptions: {
            width: 1200,
            height: 900,
            backgroundColor: '#FFFFFF',
          },
        };

      default:
        return {
          supportedOptions: [],
          defaultOptions: {},
        };
    }
  }

  /**
   * Validate export format and options
   */
  validateExportRequest(format: ExportFormat, options: ExportOptions): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check format support
    const supportedFormats: ExportFormat[] = ['PNG', 'PDF', 'SVG', 'CSV', 'JSON'];
    if (!supportedFormats.includes(format)) {
      errors.push(`Unsupported export format: ${format}`);
    }

    // Validate options based on format
    const { supportedOptions } = this.getExportOptions(format);
    
    Object.keys(options).forEach(option => {
      if (!supportedOptions.includes(option)) {
        errors.push(`Option '${option}' not supported for ${format} format`);
      }
    });

    // Validate specific option values
    if (options.quality !== undefined && (options.quality < 0 || options.quality > 1)) {
      errors.push('Quality must be between 0 and 1');
    }

    if (options.width !== undefined && options.width <= 0) {
      errors.push('Width must be positive');
    }

    if (options.height !== undefined && options.height <= 0) {
      errors.push('Height must be positive');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Main export method that handles all formats
   */
  async exportChart(
    format: ExportFormat,
    chartRef: any,
    data?: ChartExportData,
    svgContent?: string,
    options: ExportOptions = {}
  ): Promise<string> {
    // Validate request
    const validation = this.validateExportRequest(format, options);
    if (!validation.isValid) {
      throw new Error(`Export validation failed: ${validation.errors.join(', ')}`);
    }

    // Get default options for format
    const { defaultOptions } = this.getExportOptions(format);
    const finalOptions = { ...defaultOptions, ...options };

    try {
      switch (format) {
        case 'PNG':
          return await this.exportAsPNG(chartRef, finalOptions);

        case 'PDF':
          return await this.exportAsPDF(chartRef, finalOptions);

        case 'SVG':
          if (!svgContent) {
            throw new Error('SVG content required for SVG export');
          }
          return await this.exportAsSVG(svgContent, finalOptions);

        case 'CSV':
          if (!data) {
            throw new Error('Chart data required for CSV export');
          }
          return await this.exportAsCSV(data, finalOptions);

        case 'JSON':
          if (!data) {
            throw new Error('Chart data required for JSON export');
          }
          return await this.exportAsJSON(data, finalOptions);

        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error(`Chart export failed for format ${format}:`, error);
      throw error;
    }
  }
}
