import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { WorkflowNode } from '../../../domain/entities/workflow-node.entity';
import { NodeExecutor } from '../node-executor.interface';
import { CredentialIntegrationService } from '../../../../credentials/application/services/credential-integration.service';

export interface GoogleSheetsConfig {
  operation: 'readSheet' | 'writeSheet' | 'appendRow' | 'updateRow' | 'deleteRow' | 'createSheet' | 'clearSheet' | 'getSheetInfo';
  credentialId?: string;
  accessToken?: string;
  spreadsheetId?: string;
  sheetName?: string;
  range?: string;
  // Data operations
  values?: string[][];
  row?: number;
  rowData?: string[];
  // Sheet creation
  title?: string;
  // Sheet properties
  gridProperties?: {
    rowCount?: number;
    columnCount?: number;
  };
  // Query options
  majorDimension?: 'ROWS' | 'COLUMNS';
  valueRenderOption?: 'FORMATTED_VALUE' | 'UNFORMATTED_VALUE' | 'FORMULA';
  dateTimeRenderOption?: 'SERIAL_NUMBER' | 'FORMATTED_STRING';
}

@Injectable()
export class GoogleSheetsNodeExecutor implements NodeExecutor {
  private readonly logger = new Logger(GoogleSheetsNodeExecutor.name);

  constructor(
    private httpService: HttpService,
    private credentialIntegrationService: CredentialIntegrationService,
  ) {}

  async execute(
    node: WorkflowNode,
    inputData: Record<string, any>,
    executionId: string,
  ): Promise<Record<string, any>> {
    const config = node.configuration as GoogleSheetsConfig;
    this.logger.log(`Executing Google Sheets operation: ${config.operation}`);

    try {
      const accessToken = await this.getAccessToken(config, inputData);
      let result: any;

      switch (config.operation) {
        case 'readSheet':
          result = await this.readSheet(config, inputData, accessToken);
          break;
        case 'writeSheet':
          result = await this.writeSheet(config, inputData, accessToken);
          break;
        case 'appendRow':
          result = await this.appendRow(config, inputData, accessToken);
          break;
        case 'updateRow':
          result = await this.updateRow(config, inputData, accessToken);
          break;
        case 'deleteRow':
          result = await this.deleteRow(config, inputData, accessToken);
          break;
        case 'createSheet':
          result = await this.createSheet(config, inputData, accessToken);
          break;
        case 'clearSheet':
          result = await this.clearSheet(config, inputData, accessToken);
          break;
        case 'getSheetInfo':
          result = await this.getSheetInfo(config, inputData, accessToken);
          break;
        default:
          throw new Error(`Unsupported Google Sheets operation: ${config.operation}`);
      }

      return {
        ...inputData,
        googleSheets: result,
        _googleSheets: {
          nodeId: node.id,
          nodeName: node.name,
          operation: config.operation,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`Google Sheets operation failed: ${error.message}`);
      
      return {
        ...inputData,
        googleSheets: null,
        googleSheetsError: error.message,
        _googleSheets: {
          nodeId: node.id,
          nodeName: node.name,
          operation: config.operation,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  async validate(configuration: Record<string, any>): Promise<boolean> {
    const config = configuration as GoogleSheetsConfig;
    
    if (!config.operation) return false;
    if (!config.accessToken && !config.credentialId) return false;
    if (!config.spreadsheetId) return false;

    switch (config.operation) {
      case 'readSheet':
        return !!(config.sheetName || config.range);
      case 'writeSheet':
        return !!(config.range && config.values);
      case 'appendRow':
        return !!(config.sheetName && config.rowData);
      case 'updateRow':
        return !!(config.sheetName && config.row && config.rowData);
      case 'deleteRow':
        return !!(config.sheetName && config.row);
      case 'createSheet':
        return !!config.title;
      case 'clearSheet':
        return !!(config.sheetName || config.range);
      case 'getSheetInfo':
        return true; // No specific validation needed
      default:
        return false;
    }
  }

  private async getAccessToken(config: GoogleSheetsConfig, inputData: Record<string, any>): Promise<string> {
    if (config.accessToken) {
      return this.replaceVariables(config.accessToken, inputData);
    }

    if (config.credentialId) {
      try {
        const credential = await this.credentialIntegrationService.getCredentialById(
          config.credentialId,
          inputData._credentialContext
        );
        return credential.data.access_token;
      } catch (error) {
        this.logger.error(`Failed to get Google Sheets credential: ${error.message}`);
        throw new Error(`Failed to retrieve Google Sheets credentials: ${error.message}`);
      }
    }

    // Try to get credential by service name
    if (inputData._credentialContext) {
      try {
        const credential = await this.credentialIntegrationService.getCredentialByService(
          'google_sheets',
          inputData._credentialContext
        );
        return credential.data.access_token;
      } catch (error) {
        this.logger.error(`Failed to get Google Sheets credential by service: ${error.message}`);
      }
    }

    throw new Error('No Google Sheets access token or credential ID provided');
  }

  private async readSheet(
    config: GoogleSheetsConfig,
    inputData: Record<string, any>,
    accessToken: string,
  ): Promise<any> {
    const spreadsheetId = this.replaceVariables(config.spreadsheetId!, inputData);
    let range = config.range;
    
    if (!range && config.sheetName) {
      range = this.replaceVariables(config.sheetName, inputData);
    }
    
    if (!range) {
      throw new Error('Either range or sheetName must be provided');
    }

    range = this.replaceVariables(range, inputData);

    const queryParams = new URLSearchParams();
    if (config.majorDimension) {
      queryParams.append('majorDimension', config.majorDimension);
    }
    if (config.valueRenderOption) {
      queryParams.append('valueRenderOption', config.valueRenderOption);
    }
    if (config.dateTimeRenderOption) {
      queryParams.append('dateTimeRenderOption', config.dateTimeRenderOption);
    }

    const response = await lastValueFrom(
      this.httpService.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      ),
    );

    return {
      spreadsheetId,
      range: response.data.range,
      majorDimension: response.data.majorDimension,
      values: response.data.values || [],
      rowCount: response.data.values?.length || 0,
      columnCount: response.data.values?.[0]?.length || 0,
    };
  }

  private async writeSheet(
    config: GoogleSheetsConfig,
    inputData: Record<string, any>,
    accessToken: string,
  ): Promise<any> {
    const spreadsheetId = this.replaceVariables(config.spreadsheetId!, inputData);
    const range = this.replaceVariables(config.range!, inputData);
    
    // Process values - can be from config or input data
    let values = config.values;
    if (!values && inputData.values) {
      values = inputData.values;
    }
    
    if (!values) {
      throw new Error('Values must be provided');
    }

    const response = await lastValueFrom(
      this.httpService.put(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
        {
          range,
          majorDimension: config.majorDimension || 'ROWS',
          values,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          params: {
            valueInputOption: 'USER_ENTERED',
          },
        },
      ),
    );

    return {
      spreadsheetId,
      updatedRange: response.data.updatedRange,
      updatedRows: response.data.updatedRows,
      updatedColumns: response.data.updatedColumns,
      updatedCells: response.data.updatedCells,
    };
  }

  private async appendRow(
    config: GoogleSheetsConfig,
    inputData: Record<string, any>,
    accessToken: string,
  ): Promise<any> {
    const spreadsheetId = this.replaceVariables(config.spreadsheetId!, inputData);
    const sheetName = this.replaceVariables(config.sheetName!, inputData);
    
    // Process row data - can be from config or input data
    let rowData = config.rowData;
    if (!rowData && inputData.rowData) {
      rowData = inputData.rowData;
    }
    
    if (!rowData) {
      throw new Error('Row data must be provided');
    }

    // Replace variables in row data
    const processedRowData = rowData.map(value => 
      typeof value === 'string' ? this.replaceVariables(value, inputData) : value
    );

    const response = await lastValueFrom(
      this.httpService.post(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}:append`,
        {
          range: sheetName,
          majorDimension: 'ROWS',
          values: [processedRowData],
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          params: {
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
          },
        },
      ),
    );

    return {
      spreadsheetId,
      tableRange: response.data.tableRange,
      updatedRange: response.data.updates.updatedRange,
      updatedRows: response.data.updates.updatedRows,
      updatedColumns: response.data.updates.updatedColumns,
      updatedCells: response.data.updates.updatedCells,
    };
  }

  private async updateRow(
    config: GoogleSheetsConfig,
    inputData: Record<string, any>,
    accessToken: string,
  ): Promise<any> {
    const spreadsheetId = this.replaceVariables(config.spreadsheetId!, inputData);
    const sheetName = this.replaceVariables(config.sheetName!, inputData);
    const row = parseInt(this.replaceVariables(config.row!.toString(), inputData));
    
    // Process row data
    let rowData = config.rowData;
    if (!rowData && inputData.rowData) {
      rowData = inputData.rowData;
    }
    
    if (!rowData) {
      throw new Error('Row data must be provided');
    }

    // Replace variables in row data
    const processedRowData = rowData.map(value => 
      typeof value === 'string' ? this.replaceVariables(value, inputData) : value
    );

    const range = `${sheetName}!${row}:${row}`;

    const response = await lastValueFrom(
      this.httpService.put(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
        {
          range,
          majorDimension: 'ROWS',
          values: [processedRowData],
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          params: {
            valueInputOption: 'USER_ENTERED',
          },
        },
      ),
    );

    return {
      spreadsheetId,
      updatedRange: response.data.updatedRange,
      updatedRows: response.data.updatedRows,
      updatedColumns: response.data.updatedColumns,
      updatedCells: response.data.updatedCells,
      rowNumber: row,
    };
  }

  private async deleteRow(
    config: GoogleSheetsConfig,
    inputData: Record<string, any>,
    accessToken: string,
  ): Promise<any> {
    const spreadsheetId = this.replaceVariables(config.spreadsheetId!, inputData);
    const sheetName = this.replaceVariables(config.sheetName!, inputData);
    const row = parseInt(this.replaceVariables(config.row!.toString(), inputData));

    // First, get the sheet ID
    const sheetInfo = await this.getSheetInfo(config, inputData, accessToken);
    const sheet = sheetInfo.sheets.find((s: any) => s.properties.title === sheetName);
    
    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found`);
    }

    const sheetId = sheet.properties.sheetId;

    const response = await lastValueFrom(
      this.httpService.post(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: 'ROWS',
                  startIndex: row - 1, // 0-based index
                  endIndex: row,
                },
              },
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return {
      spreadsheetId,
      sheetName,
      deletedRow: row,
      status: 'deleted',
    };
  }

  private async createSheet(
    config: GoogleSheetsConfig,
    inputData: Record<string, any>,
    accessToken: string,
  ): Promise<any> {
    const spreadsheetId = this.replaceVariables(config.spreadsheetId!, inputData);
    const title = this.replaceVariables(config.title!, inputData);

    const sheetProperties: any = {
      title,
    };

    if (config.gridProperties) {
      sheetProperties.gridProperties = config.gridProperties;
    }

    const response = await lastValueFrom(
      this.httpService.post(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          requests: [
            {
              addSheet: {
                properties: sheetProperties,
              },
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    const addedSheet = response.data.replies[0].addSheet;

    return {
      spreadsheetId,
      sheetId: addedSheet.properties.sheetId,
      title: addedSheet.properties.title,
      gridProperties: addedSheet.properties.gridProperties,
      status: 'created',
    };
  }

  private async clearSheet(
    config: GoogleSheetsConfig,
    inputData: Record<string, any>,
    accessToken: string,
  ): Promise<any> {
    const spreadsheetId = this.replaceVariables(config.spreadsheetId!, inputData);
    let range = config.range;
    
    if (!range && config.sheetName) {
      range = this.replaceVariables(config.sheetName, inputData);
    }
    
    if (!range) {
      throw new Error('Either range or sheetName must be provided');
    }

    range = this.replaceVariables(range, inputData);

    const response = await lastValueFrom(
      this.httpService.post(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return {
      spreadsheetId,
      clearedRange: response.data.clearedRange,
      status: 'cleared',
    };
  }

  private async getSheetInfo(
    config: GoogleSheetsConfig,
    inputData: Record<string, any>,
    accessToken: string,
  ): Promise<any> {
    const spreadsheetId = this.replaceVariables(config.spreadsheetId!, inputData);

    const response = await lastValueFrom(
      this.httpService.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      ),
    );

    return {
      spreadsheetId: response.data.spreadsheetId,
      title: response.data.properties.title,
      locale: response.data.properties.locale,
      timeZone: response.data.properties.timeZone,
      sheets: response.data.sheets.map((sheet: any) => ({
        sheetId: sheet.properties.sheetId,
        title: sheet.properties.title,
        sheetType: sheet.properties.sheetType,
        gridProperties: sheet.properties.gridProperties,
      })),
    };
  }

  private replaceVariables(str: string, data: Record<string, any>): string {
    return str.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const keys = key.trim().split('.');
      let value = data;

      for (const k of keys) {
        value = value?.[k];
      }

      return value !== undefined ? String(value) : match;
    });
  }
}
