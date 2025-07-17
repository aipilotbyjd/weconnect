import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import {
  INodeExecutor,
  NodeExecutionContext,
  NodeExecutionResult,
} from '../../../../../core/abstracts/base-node.interface';
import * as fs from 'fs';
// import * as csv from 'csv-parser'; // Commented out for compilation

export const DataAnalyticsNodeDefinition = new NodeDefinition({
  name: 'DataAnalytics',
  displayName: 'Data Analytics',
  description:
    'Perform analytics operations on datasets including statistical analysis and data visualization',
  version: 1,
  group: ['analytics'],
  icon: 'fa:chart-bar',
  defaults: {
    name: 'Data Analytics',
    color: '#2c3e50',
  },
  inputs: ['main'],
  outputs: ['main'],
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'options',
      options: [
        { name: 'Descriptive Statistics', value: 'descriptiveStats' },
        { name: 'Group By Analysis', value: 'groupBy' },
        { name: 'Correlation Analysis', value: 'correlation' },
        { name: 'Trend Analysis', value: 'trendAnalysis' },
        { name: 'Data Aggregation', value: 'aggregation' },
        { name: 'Outlier Detection', value: 'outlierDetection' },
        { name: 'Data Distribution', value: 'distribution' },
        { name: 'Frequency Analysis', value: 'frequency' },
      ],
      default: 'descriptiveStats',
      required: true,
    },
    {
      name: 'dataSource',
      displayName: 'Data Source',
      type: 'options',
      options: [
        { name: 'JSON Data', value: 'json' },
        { name: 'CSV File', value: 'csv' },
        { name: 'Array Data', value: 'array' },
        { name: 'Database Query', value: 'database' },
      ],
      default: 'json',
      required: true,
    },
    {
      name: 'jsonData',
      displayName: 'JSON Data',
      type: 'json',
      required: true,
      default: [],
      description: 'JSON array of objects to analyze',
      displayOptions: {
        show: {
          dataSource: ['json'],
        },
      },
    },
    {
      name: 'csvFilePath',
      displayName: 'CSV File Path',
      type: 'string',
      required: true,
      placeholder: '/path/to/data.csv',
      displayOptions: {
        show: {
          dataSource: ['csv'],
        },
      },
    },
    {
      name: 'arrayData',
      displayName: 'Array Data',
      type: 'json',
      required: true,
      default: [],
      description: 'Array of data to analyze',
      displayOptions: {
        show: {
          dataSource: ['array'],
        },
      },
    },
    {
      name: 'databaseQuery',
      displayName: 'Database Query',
      type: 'string',
      required: true,
      placeholder: 'SELECT * FROM table_name',
      typeOptions: {
        multipleValues: false,
      },
      displayOptions: {
        show: {
          dataSource: ['database'],
        },
      },
    },
    {
      name: 'columns',
      displayName: 'Columns to Analyze',
      type: 'collection',
      placeholder: 'Add column',
      typeOptions: {
        multipleValues: true,
      },
      default: [],
      options: [
        {
          name: 'columnName',
          displayName: 'Column Name',
          type: 'string',
          required: true,
        },
        {
          name: 'dataType',
          displayName: 'Data Type',
          type: 'options',
          options: [
            { name: 'Number', value: 'number' },
            { name: 'String', value: 'string' },
            { name: 'Date', value: 'date' },
            { name: 'Boolean', value: 'boolean' },
          ],
          default: 'number',
        },
      ],
      displayOptions: {
        show: {
          operation: [
            'descriptiveStats',
            'correlation',
            'trendAnalysis',
            'aggregation',
            'outlierDetection',
            'distribution',
          ],
        },
      },
    },
    {
      name: 'groupByColumn',
      displayName: 'Group By Column',
      type: 'string',
      required: true,
      placeholder: 'category',
      displayOptions: {
        show: {
          operation: ['groupBy'],
        },
      },
    },
    {
      name: 'aggregateColumn',
      displayName: 'Aggregate Column',
      type: 'string',
      required: true,
      placeholder: 'value',
      displayOptions: {
        show: {
          operation: ['groupBy', 'aggregation'],
        },
      },
    },
    {
      name: 'aggregateFunction',
      displayName: 'Aggregate Function',
      type: 'options',
      options: [
        { name: 'Sum', value: 'sum' },
        { name: 'Average', value: 'average' },
        { name: 'Count', value: 'count' },
        { name: 'Min', value: 'min' },
        { name: 'Max', value: 'max' },
        { name: 'Median', value: 'median' },
        { name: 'Standard Deviation', value: 'stddev' },
      ],
      default: 'sum',
      displayOptions: {
        show: {
          operation: ['groupBy', 'aggregation'],
        },
      },
    },
    {
      name: 'dateColumn',
      displayName: 'Date Column',
      type: 'string',
      required: true,
      placeholder: 'created_at',
      displayOptions: {
        show: {
          operation: ['trendAnalysis'],
        },
      },
    },
    {
      name: 'timeInterval',
      displayName: 'Time Interval',
      type: 'options',
      options: [
        { name: 'Daily', value: 'daily' },
        { name: 'Weekly', value: 'weekly' },
        { name: 'Monthly', value: 'monthly' },
        { name: 'Quarterly', value: 'quarterly' },
        { name: 'Yearly', value: 'yearly' },
      ],
      default: 'monthly',
      displayOptions: {
        show: {
          operation: ['trendAnalysis'],
        },
      },
    },
    {
      name: 'outlierMethod',
      displayName: 'Outlier Detection Method',
      type: 'options',
      options: [
        { name: 'IQR (Interquartile Range)', value: 'iqr' },
        { name: 'Z-Score', value: 'zscore' },
        { name: 'Modified Z-Score', value: 'modified_zscore' },
      ],
      default: 'iqr',
      displayOptions: {
        show: {
          operation: ['outlierDetection'],
        },
      },
    },
    {
      name: 'threshold',
      displayName: 'Threshold',
      type: 'number',
      default: 2.5,
      description: 'Threshold for outlier detection (Z-score method)',
      displayOptions: {
        show: {
          operation: ['outlierDetection'],
          outlierMethod: ['zscore', 'modified_zscore'],
        },
      },
    },
    {
      name: 'frequencyColumn',
      displayName: 'Frequency Column',
      type: 'string',
      required: true,
      placeholder: 'category',
      displayOptions: {
        show: {
          operation: ['frequency'],
        },
      },
    },
    {
      name: 'sortOrder',
      displayName: 'Sort Order',
      type: 'options',
      options: [
        { name: 'Ascending', value: 'asc' },
        { name: 'Descending', value: 'desc' },
      ],
      default: 'desc',
      displayOptions: {
        show: {
          operation: ['frequency'],
        },
      },
    },
    {
      name: 'includePercentages',
      displayName: 'Include Percentages',
      type: 'boolean',
      default: true,
      displayOptions: {
        show: {
          operation: ['frequency', 'distribution'],
        },
      },
    },
    {
      name: 'roundDecimals',
      displayName: 'Round Decimals',
      type: 'number',
      default: 2,
      description: 'Number of decimal places to round results',
    },
  ],
});

export class DataAnalyticsNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const { operation, dataSource } = context.parameters;

      // Load data based on source
      let data: any[] = [];
      switch (dataSource) {
        case 'json':
          data = context.parameters.jsonData || [];
          break;
        case 'csv':
          data = await this.loadCsvData(context.parameters.csvFilePath);
          break;
        case 'array':
          data = context.parameters.arrayData || [];
          break;
        case 'database':
          // Mock database query result
          data = await this.executeDatabaseQuery(
            context.parameters.databaseQuery,
          );
          break;
        default:
          throw new Error(`Unsupported data source: ${dataSource}`);
      }

      if (!data || data.length === 0) {
        throw new Error('No data available for analysis');
      }

      let result: any;

      switch (operation) {
        case 'descriptiveStats':
          result = await this.calculateDescriptiveStats(
            data,
            context.parameters,
          );
          break;
        case 'groupBy':
          result = await this.performGroupByAnalysis(data, context.parameters);
          break;
        case 'correlation':
          result = await this.calculateCorrelation(data, context.parameters);
          break;
        case 'trendAnalysis':
          result = await this.performTrendAnalysis(data, context.parameters);
          break;
        case 'aggregation':
          result = await this.performAggregation(data, context.parameters);
          break;
        case 'outlierDetection':
          result = await this.detectOutliers(data, context.parameters);
          break;
        case 'distribution':
          result = await this.analyzeDistribution(data, context.parameters);
          break;
        case 'frequency':
          result = await this.analyzeFrequency(data, context.parameters);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      return {
        success: true,
        data: [result],
        metadata: {
          executionTime: Date.now() - startTime,
          operation,
          dataSource,
          recordsAnalyzed: data.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: {
          executionTime: Date.now() - startTime,
          operation: context.parameters.operation,
        },
      };
    }
  }

  private async loadCsvData(filePath: string): Promise<any[]> {
    // Mock CSV loading - in real implementation, use csv-parser package
    return [
      { id: 1, name: 'Sample CSV Data 1', value: 100, category: 'A' },
      { id: 2, name: 'Sample CSV Data 2', value: 150, category: 'B' },
      { id: 3, name: 'Sample CSV Data 3', value: 200, category: 'A' },
    ];
  }

  private async executeDatabaseQuery(query: string): Promise<any[]> {
    // Mock implementation - replace with actual database connection
    return [
      {
        id: 1,
        name: 'Item 1',
        value: 100,
        category: 'A',
        created_at: '2024-01-01',
      },
      {
        id: 2,
        name: 'Item 2',
        value: 150,
        category: 'B',
        created_at: '2024-01-02',
      },
      {
        id: 3,
        name: 'Item 3',
        value: 200,
        category: 'A',
        created_at: '2024-01-03',
      },
    ];
  }

  private async calculateDescriptiveStats(data: any[], params: any) {
    const { columns, roundDecimals } = params;
    const stats: any = {};

    for (const colConfig of columns) {
      const columnName = colConfig.columnName;
      const dataType = colConfig.dataType;

      if (dataType === 'number') {
        const values = data
          .map((row) => parseFloat(row[columnName]))
          .filter((val) => !isNaN(val));

        if (values.length > 0) {
          const sorted = values.sort((a, b) => a - b);
          const sum = values.reduce((acc, val) => acc + val, 0);
          const mean = sum / values.length;
          const variance =
            values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
            values.length;

          stats[columnName] = {
            count: values.length,
            sum: this.roundNumber(sum, roundDecimals),
            mean: this.roundNumber(mean, roundDecimals),
            median: this.roundNumber(
              sorted[Math.floor(sorted.length / 2)],
              roundDecimals,
            ),
            min: this.roundNumber(Math.min(...values), roundDecimals),
            max: this.roundNumber(Math.max(...values), roundDecimals),
            stddev: this.roundNumber(Math.sqrt(variance), roundDecimals),
            variance: this.roundNumber(variance, roundDecimals),
            q1: this.roundNumber(
              sorted[Math.floor(sorted.length * 0.25)],
              roundDecimals,
            ),
            q3: this.roundNumber(
              sorted[Math.floor(sorted.length * 0.75)],
              roundDecimals,
            ),
          };
        }
      } else {
        const values = data
          .map((row) => row[columnName])
          .filter((val) => val !== null && val !== undefined);
        const uniqueValues = [...new Set(values)];

        stats[columnName] = {
          count: values.length,
          unique_count: uniqueValues.length,
          most_frequent: this.getMostFrequent(values),
          data_type: dataType,
        };
      }
    }

    return {
      analysis_type: 'descriptive_statistics',
      total_records: data.length,
      statistics: stats,
      generated_at: new Date().toISOString(),
    };
  }

  private async performGroupByAnalysis(data: any[], params: any) {
    const { groupByColumn, aggregateColumn, aggregateFunction, roundDecimals } =
      params;

    const groups = data.reduce((acc, row) => {
      const groupKey = row[groupByColumn];
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(row);
      return acc;
    }, {});

    const results = Object.keys(groups).map((groupKey) => {
      const groupData = groups[groupKey];
      const values = groupData
        .map((row) => parseFloat(row[aggregateColumn]))
        .filter((val) => !isNaN(val));

      let aggregateValue: number;
      switch (aggregateFunction) {
        case 'sum':
          aggregateValue = values.reduce((acc, val) => acc + val, 0);
          break;
        case 'average':
          aggregateValue =
            values.reduce((acc, val) => acc + val, 0) / values.length;
          break;
        case 'count':
          aggregateValue = groupData.length;
          break;
        case 'min':
          aggregateValue = Math.min(...values);
          break;
        case 'max':
          aggregateValue = Math.max(...values);
          break;
        case 'median':
          const sorted = values.sort((a, b) => a - b);
          aggregateValue = sorted[Math.floor(sorted.length / 2)];
          break;
        default:
          aggregateValue = values.reduce((acc, val) => acc + val, 0);
      }

      return {
        [groupByColumn]: groupKey,
        [`${aggregateFunction}_${aggregateColumn}`]: this.roundNumber(
          aggregateValue,
          roundDecimals,
        ),
        record_count: groupData.length,
      };
    });

    return {
      analysis_type: 'group_by_analysis',
      group_by_column: groupByColumn,
      aggregate_column: aggregateColumn,
      aggregate_function: aggregateFunction,
      results,
      generated_at: new Date().toISOString(),
    };
  }

  private async calculateCorrelation(data: any[], params: any) {
    const { columns, roundDecimals } = params;
    const numericColumns = columns.filter((col) => col.dataType === 'number');

    if (numericColumns.length < 2) {
      throw new Error(
        'At least 2 numeric columns are required for correlation analysis',
      );
    }

    const correlationMatrix: any = {};

    for (let i = 0; i < numericColumns.length; i++) {
      const col1 = numericColumns[i].columnName;
      correlationMatrix[col1] = {};

      for (let j = 0; j < numericColumns.length; j++) {
        const col2 = numericColumns[j].columnName;

        if (i === j) {
          correlationMatrix[col1][col2] = 1;
        } else {
          const correlation = this.calculatePearsonCorrelation(
            data,
            col1,
            col2,
          );
          correlationMatrix[col1][col2] = this.roundNumber(
            correlation,
            roundDecimals,
          );
        }
      }
    }

    return {
      analysis_type: 'correlation_analysis',
      correlation_matrix: correlationMatrix,
      method: 'pearson',
      generated_at: new Date().toISOString(),
    };
  }

  private async performTrendAnalysis(data: any[], params: any) {
    const { dateColumn, aggregateColumn, timeInterval, roundDecimals } = params;

    // Group data by time interval
    const trends = data.reduce((acc, row) => {
      const date = new Date(row[dateColumn]);
      const intervalKey = this.getIntervalKey(date, timeInterval);

      if (!acc[intervalKey]) {
        acc[intervalKey] = [];
      }
      acc[intervalKey].push(parseFloat(row[aggregateColumn]) || 0);
      return acc;
    }, {});

    const trendData = Object.keys(trends)
      .sort()
      .map((intervalKey) => ({
        period: intervalKey,
        value: this.roundNumber(
          trends[intervalKey].reduce((acc, val) => acc + val, 0),
          roundDecimals,
        ),
        count: trends[intervalKey].length,
        average: this.roundNumber(
          trends[intervalKey].reduce((acc, val) => acc + val, 0) /
            trends[intervalKey].length,
          roundDecimals,
        ),
      }));

    return {
      analysis_type: 'trend_analysis',
      date_column: dateColumn,
      aggregate_column: aggregateColumn,
      time_interval: timeInterval,
      trend_data: trendData,
      generated_at: new Date().toISOString(),
    };
  }

  private async performAggregation(data: any[], params: any) {
    const { aggregateColumn, aggregateFunction, roundDecimals } = params;

    const values = data
      .map((row) => parseFloat(row[aggregateColumn]))
      .filter((val) => !isNaN(val));

    let result: number;
    switch (aggregateFunction) {
      case 'sum':
        result = values.reduce((acc, val) => acc + val, 0);
        break;
      case 'average':
        result = values.reduce((acc, val) => acc + val, 0) / values.length;
        break;
      case 'count':
        result = values.length;
        break;
      case 'min':
        result = Math.min(...values);
        break;
      case 'max':
        result = Math.max(...values);
        break;
      case 'median':
        const sorted = values.sort((a, b) => a - b);
        result = sorted[Math.floor(sorted.length / 2)];
        break;
      default:
        result = values.reduce((acc, val) => acc + val, 0);
    }

    return {
      analysis_type: 'aggregation',
      column: aggregateColumn,
      function: aggregateFunction,
      result: this.roundNumber(result, roundDecimals),
      record_count: values.length,
      generated_at: new Date().toISOString(),
    };
  }

  private async detectOutliers(data: any[], params: any) {
    const { columns, outlierMethod, threshold, roundDecimals } = params;
    const outliers: any = {};

    for (const colConfig of columns.filter(
      (col) => col.dataType === 'number',
    )) {
      const columnName = colConfig.columnName;
      const values = data
        .map((row) => parseFloat(row[columnName]))
        .filter((val) => !isNaN(val));

      let outlierIndices: number[] = [];

      if (outlierMethod === 'iqr') {
        outlierIndices = this.detectOutliersIQR(values);
      } else if (outlierMethod === 'zscore') {
        outlierIndices = this.detectOutliersZScore(values, threshold);
      }

      outliers[columnName] = {
        outlier_count: outlierIndices.length,
        outlier_percentage: this.roundNumber(
          (outlierIndices.length / values.length) * 100,
          roundDecimals,
        ),
        outlier_values: outlierIndices.map((idx) => values[idx]),
        method: outlierMethod,
      };
    }

    return {
      analysis_type: 'outlier_detection',
      outliers,
      generated_at: new Date().toISOString(),
    };
  }

  private async analyzeDistribution(data: any[], params: any) {
    const { columns, includePercentages, roundDecimals } = params;
    const distributions: any = {};

    for (const colConfig of columns) {
      const columnName = colConfig.columnName;
      const values = data
        .map((row) => row[columnName])
        .filter((val) => val !== null && val !== undefined);

      if (colConfig.dataType === 'number') {
        // Create histogram bins
        const numericValues = values
          .map((val) => parseFloat(val))
          .filter((val) => !isNaN(val));
        const min = Math.min(...numericValues);
        const max = Math.max(...numericValues);
        const binCount = Math.min(
          10,
          Math.ceil(Math.sqrt(numericValues.length)),
        );
        const binSize = (max - min) / binCount;

        const bins = Array.from({ length: binCount }, (_, i) => ({
          range: `${this.roundNumber(min + i * binSize, roundDecimals)}-${this.roundNumber(min + (i + 1) * binSize, roundDecimals)}`,
          count: 0,
          percentage: 0,
        }));

        numericValues.forEach((value) => {
          const binIndex = Math.min(
            Math.floor((value - min) / binSize),
            binCount - 1,
          );
          bins[binIndex].count++;
        });

        if (includePercentages) {
          bins.forEach((bin) => {
            bin.percentage = this.roundNumber(
              (bin.count / numericValues.length) * 100,
              roundDecimals,
            );
          });
        }

        distributions[columnName] = {
          type: 'histogram',
          bins,
          total_values: numericValues.length,
        };
      } else {
        // Categorical distribution
        const frequency = this.getFrequencyMap(values);
        const sortedEntries = Object.entries(frequency).sort(
          ([, a], [, b]) => b - a,
        );

        distributions[columnName] = {
          type: 'categorical',
          categories: sortedEntries.map(([value, count]) => ({
            value,
            count,
            percentage: includePercentages
              ? this.roundNumber((count / values.length) * 100, roundDecimals)
              : undefined,
          })),
          total_values: values.length,
          unique_values: sortedEntries.length,
        };
      }
    }

    return {
      analysis_type: 'distribution_analysis',
      distributions,
      generated_at: new Date().toISOString(),
    };
  }

  private async analyzeFrequency(data: any[], params: any) {
    const { frequencyColumn, sortOrder, includePercentages, roundDecimals } =
      params;

    const values = data
      .map((row) => row[frequencyColumn])
      .filter((val) => val !== null && val !== undefined);
    const frequency = this.getFrequencyMap(values);

    let sortedEntries = Object.entries(frequency);
    if (sortOrder === 'desc') {
      sortedEntries.sort(([, a], [, b]) => b - a);
    } else {
      sortedEntries.sort(([, a], [, b]) => a - b);
    }

    const results = sortedEntries.map(([value, count]) => ({
      value,
      count,
      percentage: includePercentages
        ? this.roundNumber((count / values.length) * 100, roundDecimals)
        : undefined,
    }));

    return {
      analysis_type: 'frequency_analysis',
      column: frequencyColumn,
      total_values: values.length,
      unique_values: sortedEntries.length,
      frequencies: results,
      generated_at: new Date().toISOString(),
    };
  }

  // Helper methods
  private roundNumber(num: number, decimals: number): number {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  private getMostFrequent(values: any[]): any {
    const frequency = this.getFrequencyMap(values);
    return Object.keys(frequency).reduce((a, b) =>
      frequency[a] > frequency[b] ? a : b,
    );
  }

  private getFrequencyMap(values: any[]): { [key: string]: number } {
    return values.reduce((acc, val) => {
      const key = String(val);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  private calculatePearsonCorrelation(
    data: any[],
    col1: string,
    col2: string,
  ): number {
    const values1 = data
      .map((row) => parseFloat(row[col1]))
      .filter((val) => !isNaN(val));
    const values2 = data
      .map((row) => parseFloat(row[col2]))
      .filter((val) => !isNaN(val));

    const n = Math.min(values1.length, values2.length);
    if (n === 0) return 0;

    const mean1 = values1.reduce((acc, val) => acc + val, 0) / n;
    const mean2 = values2.reduce((acc, val) => acc + val, 0) / n;

    let numerator = 0;
    let sumSq1 = 0;
    let sumSq2 = 0;

    for (let i = 0; i < n; i++) {
      const diff1 = values1[i] - mean1;
      const diff2 = values2[i] - mean2;
      numerator += diff1 * diff2;
      sumSq1 += diff1 * diff1;
      sumSq2 += diff2 * diff2;
    }

    const denominator = Math.sqrt(sumSq1 * sumSq2);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private getIntervalKey(date: Date, interval: string): string {
    switch (interval) {
      case 'daily':
        return date.toISOString().split('T')[0];
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().split('T')[0];
      case 'monthly':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      case 'quarterly':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `${date.getFullYear()}-Q${quarter}`;
      case 'yearly':
        return String(date.getFullYear());
      default:
        return date.toISOString().split('T')[0];
    }
  }

  private detectOutliersIQR(values: number[]): number[] {
    const sorted = values.slice().sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return values
      .map((value, index) =>
        value < lowerBound || value > upperBound ? index : -1,
      )
      .filter((index) => index !== -1);
  }

  private detectOutliersZScore(values: number[], threshold: number): number[] {
    const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
    const stddev = Math.sqrt(
      values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
        values.length,
    );

    return values
      .map((value, index) =>
        Math.abs((value - mean) / stddev) > threshold ? index : -1,
      )
      .filter((index) => index !== -1);
  }

  validate(configuration: Record<string, any>): boolean {
    // Basic validation - override in specific implementations
    return true;
  }

  getConfigurationSchema(): any {
    return {
      type: 'object',
      properties: {},
      required: [],
    };
  }
}
