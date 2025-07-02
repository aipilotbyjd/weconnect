import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../../domain/interfaces/node-executor.interface';

export const GoogleSheetsNodeDefinition = new NodeDefinition({
  name: 'GoogleSheets',
  displayName: 'Google Sheets',
  description: 'Read and write data to Google Sheets',
  version: 1,
  group: ['productivity'],
  icon: 'fa:table',
  defaults: {
    name: 'Google Sheets',
    color: '#34A853',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'googleSheetsOAuth2',
      required: true,
    },
  ],
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'options',
      options: [
        { name: 'Read Rows', value: 'readRows' },
        { name: 'Append Row', value: 'appendRow' },
        { name: 'Update Row', value: 'updateRow' },
        { name: 'Clear Sheet', value: 'clearSheet' },
      ],
      default: 'readRows',
      required: true,
    },
    {
      name: 'spreadsheetId',
      displayName: 'Spreadsheet ID',
      type: 'string',
      required: true,
      placeholder: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      description: 'Google Sheets spreadsheet ID',
    },
    {
      name: 'sheetName',
      displayName: 'Sheet Name',
      type: 'string',
      default: 'Sheet1',
      placeholder: 'Sheet1',
      description: 'Name of the sheet/tab',
    },
    {
      name: 'range',
      displayName: 'Range',
      type: 'string',
      default: 'A:Z',
      placeholder: 'A:Z',
      description: 'Range to read/write (e.g., A1:C10)',
    },
    {
      name: 'values',
      displayName: 'Values',
      type: 'json',
      default: [],
      description: 'Values to write (array of arrays)',
    },
  ],
});

export class GoogleSheetsNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      const { operation, spreadsheetId, sheetName, range, values } = context.parameters;
      
      // Simulate Google Sheets API integration
      // In a real implementation, you would use Google Sheets API client
      
      if (operation === 'readRows') {
        // Simulate reading rows
        const rowsData = {
          spreadsheetId,
          range: `${sheetName}!${range}`,
          majorDimension: 'ROWS',
          values: [
            ['Name', 'Email', 'Age'],
            ['John Doe', 'john@example.com', '30'],
            ['Jane Smith', 'jane@example.com', '25'],
            ['Bob Johnson', 'bob@example.com', '35'],
          ],
        };
        
        return {
          success: true,
          data: [rowsData],
          metadata: {
            executionTime: Date.now() - startTime,
            itemsProcessed: rowsData.values.length,
            operation: 'readRows',
          },
        };
      } else if (operation === 'appendRow') {
        if (!values || !Array.isArray(values)) {
          throw new Error('Values array is required for appending row');
        }
        
        const appendResult = {
          spreadsheetId,
          tableRange: `${sheetName}!A1:Z1000`,
          updates: {
            spreadsheetId,
            updatedRange: `${sheetName}!A${Date.now() % 100}:Z${Date.now() % 100}`,
            updatedRows: 1,
            updatedColumns: values.length,
            updatedCells: values.length,
          },
        };
        
        return {
          success: true,
          data: [appendResult],
          metadata: {
            executionTime: Date.now() - startTime,
            itemsProcessed: 1,
            operation: 'appendRow',
          },
        };
      } else if (operation === 'updateRow') {
        if (!values || !Array.isArray(values)) {
          throw new Error('Values array is required for updating row');
        }
        
        const updateResult = {
          spreadsheetId,
          updatedRange: `${sheetName}!${range}`,
          updatedRows: 1,
          updatedColumns: values.length,
          updatedCells: values.length,
        };
        
        return {
          success: true,
          data: [updateResult],
          metadata: {
            executionTime: Date.now() - startTime,
            itemsProcessed: 1,
            operation: 'updateRow',
          },
        };
      } else if (operation === 'clearSheet') {
        const clearResult = {
          spreadsheetId,
          clearedRange: `${sheetName}!${range}`,
          clearedRows: 100,
          clearedColumns: 26,
        };
        
        return {
          success: true,
          data: [clearResult],
          metadata: {
            executionTime: Date.now() - startTime,
            itemsProcessed: 1,
            operation: 'clearSheet',
          },
        };
      }
      
      throw new Error(`Unknown operation: ${operation}`);
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
}
