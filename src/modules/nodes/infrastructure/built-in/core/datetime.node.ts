import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import {
  INodeExecutor,
  NodeExecutionContext,
  NodeExecutionResult,
} from '../../../../../core/abstracts/base-node.interface';

export const DateTimeNodeDefinition = new NodeDefinition({
  name: 'DateTime',
  displayName: 'Date & Time',
  description: 'Perform date and time operations, formatting, and calculations',
  version: 1,
  group: ['regular'],
  icon: 'fa:calendar',
  defaults: {
    name: 'Date & Time',
    color: '#10B981',
  },
  inputs: ['main'],
  outputs: ['main'],
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'options',
      options: [
        { name: 'Current Date/Time', value: 'current' },
        { name: 'Format Date', value: 'format' },
        { name: 'Parse Date', value: 'parse' },
        { name: 'Add Time', value: 'add' },
        { name: 'Subtract Time', value: 'subtract' },
        { name: 'Difference', value: 'difference' },
        { name: 'Convert Timezone', value: 'timezone' },
        { name: 'Start of Period', value: 'startOf' },
        { name: 'End of Period', value: 'endOf' },
        { name: 'Is Between', value: 'isBetween' },
      ],
      default: 'current',
      required: true,
    },
    {
      name: 'inputDate',
      displayName: 'Input Date',
      type: 'string',
      placeholder: '2024-01-15 10:30:00',
      description: 'Date to process (leave empty for current date)',
      displayOptions: {
        show: {
          operation: [
            'format',
            'parse',
            'add',
            'subtract',
            'timezone',
            'startOf',
            'endOf',
          ],
        },
      },
    },
    {
      name: 'format',
      displayName: 'Date Format',
      type: 'options',
      options: [
        { name: 'ISO 8601 (2024-01-15T10:30:00Z)', value: 'iso' },
        { name: 'Date Only (2024-01-15)', value: 'YYYY-MM-DD' },
        { name: 'Time Only (10:30:00)', value: 'HH:mm:ss' },
        { name: 'US Format (01/15/2024)', value: 'MM/DD/YYYY' },
        { name: 'EU Format (15/01/2024)', value: 'DD/MM/YYYY' },
        { name: 'Long Format (January 15, 2024)', value: 'MMMM DD, YYYY' },
        { name: 'Custom', value: 'custom' },
      ],
      default: 'iso',
      displayOptions: {
        show: {
          operation: ['current', 'format'],
        },
      },
    },
    {
      name: 'customFormat',
      displayName: 'Custom Format',
      type: 'string',
      placeholder: 'YYYY-MM-DD HH:mm:ss',
      description: 'Custom date format pattern',
      displayOptions: {
        show: {
          operation: ['current', 'format'],
          format: ['custom'],
        },
      },
    },
    {
      name: 'inputFormat',
      displayName: 'Input Format',
      type: 'string',
      placeholder: 'DD/MM/YYYY',
      description: 'Format of the input date string',
      displayOptions: {
        show: {
          operation: ['parse'],
        },
      },
    },
    {
      name: 'amount',
      displayName: 'Amount',
      type: 'number',
      placeholder: '5',
      description: 'Amount to add or subtract',
      displayOptions: {
        show: {
          operation: ['add', 'subtract'],
        },
      },
    },
    {
      name: 'unit',
      displayName: 'Time Unit',
      type: 'options',
      options: [
        { name: 'Years', value: 'years' },
        { name: 'Months', value: 'months' },
        { name: 'Weeks', value: 'weeks' },
        { name: 'Days', value: 'days' },
        { name: 'Hours', value: 'hours' },
        { name: 'Minutes', value: 'minutes' },
        { name: 'Seconds', value: 'seconds' },
        { name: 'Milliseconds', value: 'milliseconds' },
      ],
      default: 'days',
      displayOptions: {
        show: {
          operation: ['add', 'subtract', 'difference', 'startOf', 'endOf'],
        },
      },
    },
    {
      name: 'compareDate',
      displayName: 'Compare Date',
      type: 'string',
      placeholder: '2024-01-20 15:00:00',
      description: 'Date to compare with',
      displayOptions: {
        show: {
          operation: ['difference', 'isBetween'],
        },
      },
    },
    {
      name: 'startDate',
      displayName: 'Start Date',
      type: 'string',
      placeholder: '2024-01-01',
      description: 'Start date for range check',
      displayOptions: {
        show: {
          operation: ['isBetween'],
        },
      },
    },
    {
      name: 'endDate',
      displayName: 'End Date',
      type: 'string',
      placeholder: '2024-12-31',
      description: 'End date for range check',
      displayOptions: {
        show: {
          operation: ['isBetween'],
        },
      },
    },
    {
      name: 'fromTimezone',
      displayName: 'From Timezone',
      type: 'string',
      default: 'UTC',
      placeholder: 'America/New_York',
      description: 'Source timezone',
      displayOptions: {
        show: {
          operation: ['timezone'],
        },
      },
    },
    {
      name: 'toTimezone',
      displayName: 'To Timezone',
      type: 'string',
      default: 'UTC',
      placeholder: 'Europe/London',
      description: 'Target timezone',
      displayOptions: {
        show: {
          operation: ['timezone'],
        },
      },
    },
  ],
});

export class DateTimeNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const {
        operation,
        inputDate,
        format,
        customFormat,
        inputFormat,
        amount,
        unit,
        compareDate,
        startDate,
        endDate,
        fromTimezone,
        toTimezone,
      } = context.parameters;

      const results: any[] = [];

      for (const item of context.inputData) {
        let result;

        // Use input data to override parameters if available
        const dateToProcess = inputDate || item.date || item.inputDate;

        switch (operation) {
          case 'current':
            result = this.getCurrentDateTime(format, customFormat);
            break;
          case 'format':
            result = this.formatDate(dateToProcess, format, customFormat);
            break;
          case 'parse':
            result = this.parseDate(
              dateToProcess,
              inputFormat || item.inputFormat,
            );
            break;
          case 'add':
            result = this.addTime(
              dateToProcess,
              amount || item.amount,
              unit || item.unit,
            );
            break;
          case 'subtract':
            result = this.subtractTime(
              dateToProcess,
              amount || item.amount,
              unit || item.unit,
            );
            break;
          case 'difference':
            result = this.calculateDifference(
              dateToProcess,
              compareDate || item.compareDate,
              unit || item.unit,
            );
            break;
          case 'timezone':
            result = this.convertTimezone(
              dateToProcess,
              fromTimezone || item.fromTimezone,
              toTimezone || item.toTimezone,
            );
            break;
          case 'startOf':
            result = this.getStartOf(dateToProcess, unit || item.unit);
            break;
          case 'endOf':
            result = this.getEndOf(dateToProcess, unit || item.unit);
            break;
          case 'isBetween':
            result = this.isBetween(
              dateToProcess,
              startDate || item.startDate,
              endDate || item.endDate,
            );
            break;
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }

        results.push(result);
      }

      return {
        success: true,
        data: results,
        metadata: {
          executionTime: Date.now() - startTime,
          itemsProcessed: results.length,
          operation,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  private getCurrentDateTime(
    format: string = 'iso',
    customFormat?: string,
  ): any {
    const now = new Date();
    const formatted = this.formatDateString(now, format, customFormat);

    return {
      operation: 'current',
      date: now,
      formatted,
      timestamp: now.getTime(),
      iso: now.toISOString(),
      utc: now.toUTCString(),
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      hour: now.getHours(),
      minute: now.getMinutes(),
      second: now.getSeconds(),
      dayOfWeek: now.getDay(),
      dayOfYear: this.getDayOfYear(now),
      weekOfYear: this.getWeekOfYear(now),
    };
  }

  private formatDate(
    inputDate: string,
    format: string = 'iso',
    customFormat?: string,
  ): any {
    if (!inputDate) {
      throw new Error('Input date is required');
    }

    const date = new Date(inputDate);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }

    const formatted = this.formatDateString(date, format, customFormat);

    return {
      operation: 'format',
      inputDate,
      date,
      formatted,
      format: format === 'custom' ? customFormat : format,
    };
  }

  private parseDate(inputDate: string, inputFormat: string): any {
    if (!inputDate) {
      throw new Error('Input date is required');
    }

    // Simple date parsing (in production, use a library like moment.js or date-fns)
    const date = new Date(inputDate);
    if (isNaN(date.getTime())) {
      throw new Error('Unable to parse date');
    }

    return {
      operation: 'parse',
      inputDate,
      inputFormat,
      parsedDate: date,
      iso: date.toISOString(),
      timestamp: date.getTime(),
      valid: true,
    };
  }

  private addTime(inputDate: string, amount: number, unit: string): any {
    if (!inputDate || amount === undefined) {
      throw new Error('Input date and amount are required');
    }

    const date = new Date(inputDate);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid input date');
    }

    const newDate = new Date(date);
    this.addTimeToDate(newDate, amount, unit);

    return {
      operation: 'add',
      inputDate,
      amount,
      unit,
      originalDate: date,
      newDate,
      formatted: newDate.toISOString(),
    };
  }

  private subtractTime(inputDate: string, amount: number, unit: string): any {
    if (!inputDate || amount === undefined) {
      throw new Error('Input date and amount are required');
    }

    const date = new Date(inputDate);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid input date');
    }

    const newDate = new Date(date);
    this.addTimeToDate(newDate, -amount, unit);

    return {
      operation: 'subtract',
      inputDate,
      amount,
      unit,
      originalDate: date,
      newDate,
      formatted: newDate.toISOString(),
    };
  }

  private calculateDifference(
    inputDate: string,
    compareDate: string,
    unit: string = 'days',
  ): any {
    if (!inputDate || !compareDate) {
      throw new Error('Both input date and compare date are required');
    }

    const date1 = new Date(inputDate);
    const date2 = new Date(compareDate);

    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
      throw new Error('Invalid date format');
    }

    const diffMs = Math.abs(date2.getTime() - date1.getTime());
    const difference = this.convertMilliseconds(diffMs, unit);

    return {
      operation: 'difference',
      inputDate,
      compareDate,
      unit,
      difference,
      differenceMs: diffMs,
      isAfter: date1.getTime() > date2.getTime(),
      isBefore: date1.getTime() < date2.getTime(),
      isSame: date1.getTime() === date2.getTime(),
    };
  }

  private convertTimezone(
    inputDate: string,
    fromTimezone: string,
    toTimezone: string,
  ): any {
    if (!inputDate) {
      throw new Error('Input date is required');
    }

    const date = new Date(inputDate);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid input date');
    }

    // Simple timezone conversion (in production, use a proper timezone library)
    return {
      operation: 'timezone',
      inputDate,
      fromTimezone,
      toTimezone,
      originalDate: date,
      convertedDate: date, // Simplified - would need proper timezone handling
      formatted: date.toISOString(),
      note: 'Timezone conversion requires proper timezone library implementation',
    };
  }

  private getStartOf(inputDate: string, unit: string): any {
    if (!inputDate) {
      throw new Error('Input date is required');
    }

    const date = new Date(inputDate);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid input date');
    }

    const startDate = new Date(date);
    this.setToStartOf(startDate, unit);

    return {
      operation: 'startOf',
      inputDate,
      unit,
      originalDate: date,
      startDate,
      formatted: startDate.toISOString(),
    };
  }

  private getEndOf(inputDate: string, unit: string): any {
    if (!inputDate) {
      throw new Error('Input date is required');
    }

    const date = new Date(inputDate);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid input date');
    }

    const endDate = new Date(date);
    this.setToEndOf(endDate, unit);

    return {
      operation: 'endOf',
      inputDate,
      unit,
      originalDate: date,
      endDate,
      formatted: endDate.toISOString(),
    };
  }

  private isBetween(
    inputDate: string,
    startDate: string,
    endDate: string,
  ): any {
    if (!inputDate || !startDate || !endDate) {
      throw new Error('Input date, start date, and end date are required');
    }

    const date = new Date(inputDate);
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
      isNaN(date.getTime()) ||
      isNaN(start.getTime()) ||
      isNaN(end.getTime())
    ) {
      throw new Error('Invalid date format');
    }

    const isBetween =
      date.getTime() >= start.getTime() && date.getTime() <= end.getTime();

    return {
      operation: 'isBetween',
      inputDate,
      startDate,
      endDate,
      isBetween,
      isAfterStart: date.getTime() >= start.getTime(),
      isBeforeEnd: date.getTime() <= end.getTime(),
    };
  }

  // Helper methods
  private formatDateString(
    date: Date,
    format: string,
    customFormat?: string,
  ): string {
    switch (format) {
      case 'iso':
        return date.toISOString();
      case 'YYYY-MM-DD':
        return date.toISOString().split('T')[0];
      case 'HH:mm:ss':
        return date.toTimeString().split(' ')[0];
      case 'MM/DD/YYYY':
        return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
      case 'DD/MM/YYYY':
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      case 'MMMM DD, YYYY':
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      case 'custom':
        return customFormat
          ? this.applyCustomFormat(date, customFormat)
          : date.toISOString();
      default:
        return date.toISOString();
    }
  }

  private applyCustomFormat(date: Date, format: string): string {
    // Simple custom format implementation
    return format
      .replace('YYYY', date.getFullYear().toString())
      .replace('MM', (date.getMonth() + 1).toString().padStart(2, '0'))
      .replace('DD', date.getDate().toString().padStart(2, '0'))
      .replace('HH', date.getHours().toString().padStart(2, '0'))
      .replace('mm', date.getMinutes().toString().padStart(2, '0'))
      .replace('ss', date.getSeconds().toString().padStart(2, '0'));
  }

  private addTimeToDate(date: Date, amount: number, unit: string): void {
    switch (unit) {
      case 'years':
        date.setFullYear(date.getFullYear() + amount);
        break;
      case 'months':
        date.setMonth(date.getMonth() + amount);
        break;
      case 'weeks':
        date.setDate(date.getDate() + amount * 7);
        break;
      case 'days':
        date.setDate(date.getDate() + amount);
        break;
      case 'hours':
        date.setHours(date.getHours() + amount);
        break;
      case 'minutes':
        date.setMinutes(date.getMinutes() + amount);
        break;
      case 'seconds':
        date.setSeconds(date.getSeconds() + amount);
        break;
      case 'milliseconds':
        date.setMilliseconds(date.getMilliseconds() + amount);
        break;
      default:
        throw new Error(`Unknown time unit: ${unit}`);
    }
  }

  private convertMilliseconds(ms: number, unit: string): number {
    switch (unit) {
      case 'years':
        return ms / (1000 * 60 * 60 * 24 * 365.25);
      case 'months':
        return ms / (1000 * 60 * 60 * 24 * 30.44);
      case 'weeks':
        return ms / (1000 * 60 * 60 * 24 * 7);
      case 'days':
        return ms / (1000 * 60 * 60 * 24);
      case 'hours':
        return ms / (1000 * 60 * 60);
      case 'minutes':
        return ms / (1000 * 60);
      case 'seconds':
        return ms / 1000;
      case 'milliseconds':
        return ms;
      default:
        return ms;
    }
  }

  private setToStartOf(date: Date, unit: string): void {
    switch (unit) {
      case 'years':
        date.setMonth(0, 1);
        date.setHours(0, 0, 0, 0);
        break;
      case 'months':
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        break;
      case 'weeks':
        const day = date.getDay();
        date.setDate(date.getDate() - day);
        date.setHours(0, 0, 0, 0);
        break;
      case 'days':
        date.setHours(0, 0, 0, 0);
        break;
      case 'hours':
        date.setMinutes(0, 0, 0);
        break;
      case 'minutes':
        date.setSeconds(0, 0);
        break;
      case 'seconds':
        date.setMilliseconds(0);
        break;
    }
  }

  private setToEndOf(date: Date, unit: string): void {
    switch (unit) {
      case 'years':
        date.setMonth(11, 31);
        date.setHours(23, 59, 59, 999);
        break;
      case 'months':
        date.setMonth(date.getMonth() + 1, 0);
        date.setHours(23, 59, 59, 999);
        break;
      case 'weeks':
        const day = date.getDay();
        date.setDate(date.getDate() + (6 - day));
        date.setHours(23, 59, 59, 999);
        break;
      case 'days':
        date.setHours(23, 59, 59, 999);
        break;
      case 'hours':
        date.setMinutes(59, 59, 999);
        break;
      case 'minutes':
        date.setSeconds(59, 999);
        break;
      case 'seconds':
        date.setMilliseconds(999);
        break;
    }
  }

  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private getWeekOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor(
      (date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
    );
    return Math.ceil((days + start.getDay() + 1) / 7);
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
