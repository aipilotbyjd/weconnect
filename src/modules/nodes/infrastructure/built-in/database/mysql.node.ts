import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../../domain/interfaces/node-executor.interface';

export const MySQLNodeDefinition = new NodeDefinition({
  name: 'MySQL',
  displayName: 'MySQL',
  description: 'Execute queries and operations on MySQL databases',
  version: 1,
  group: ['database'],
  icon: 'fa:database',
  defaults: {
    name: 'MySQL',
    color: '#4479A1',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'mysql',
      required: true,
    },
  ],
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'options',
      options: [
        { name: 'Execute Query', value: 'executeQuery' },
        { name: 'Select', value: 'select' },
        { name: 'Insert', value: 'insert' },
        { name: 'Update', value: 'update' },
        { name: 'Delete', value: 'delete' },
        { name: 'Create Table', value: 'createTable' },
        { name: 'Drop Table', value: 'dropTable' },
        { name: 'Show Tables', value: 'showTables' },
        { name: 'Describe Table', value: 'describeTable' },
      ],
      default: 'select',
      required: true,
    },
    {
      name: 'query',
      displayName: 'SQL Query',
      type: 'string',
      placeholder: 'SELECT * FROM users WHERE active = 1',
      description: 'Raw SQL query to execute',
      displayOptions: {
        show: {
          operation: ['executeQuery'],
        },
      },
    },
    {
      name: 'table',
      displayName: 'Table',
      type: 'string',
      required: true,
      placeholder: 'users',
      description: 'Database table name',
      displayOptions: {
        show: {
          operation: ['select', 'insert', 'update', 'delete', 'dropTable', 'describeTable'],
        },
      },
    },
    {
      name: 'columns',
      displayName: 'Columns',
      type: 'string',
      default: '*',
      placeholder: 'id, name, email',
      description: 'Columns to select (comma-separated)',
      displayOptions: {
        show: {
          operation: ['select'],
        },
      },
    },
    {
      name: 'where',
      displayName: 'WHERE Condition',
      type: 'string',
      placeholder: 'active = 1 AND role = "user"',
      description: 'WHERE clause condition',
      displayOptions: {
        show: {
          operation: ['select', 'update', 'delete'],
        },
      },
    },
    {
      name: 'orderBy',
      displayName: 'ORDER BY',
      type: 'string',
      placeholder: 'created_at DESC',
      description: 'ORDER BY clause',
      displayOptions: {
        show: {
          operation: ['select'],
        },
      },
    },
    {
      name: 'limit',
      displayName: 'LIMIT',
      type: 'number',
      placeholder: '100',
      description: 'Maximum number of records to return',
      displayOptions: {
        show: {
          operation: ['select'],
        },
      },
    },
    {
      name: 'data',
      displayName: 'Data',
      type: 'json',
      default: {},
      description: 'Data to insert or update (JSON object)',
      displayOptions: {
        show: {
          operation: ['insert', 'update'],
        },
      },
    },
    {
      name: 'tableSchema',
      displayName: 'Table Schema',
      type: 'json',
      default: {
        'id': 'INT AUTO_INCREMENT PRIMARY KEY',
        'name': 'VARCHAR(255) NOT NULL',
        'email': 'VARCHAR(255) UNIQUE',
        'created_at': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
      },
      description: 'Table schema definition (column_name: definition)',
      displayOptions: {
        show: {
          operation: ['createTable'],
        },
      },
    },
    {
      name: 'returnFields',
      displayName: 'Return Fields',
      type: 'options',
      options: [
        { name: 'All', value: 'all' },
        { name: 'Affected Rows Only', value: 'count' },
        { name: 'Insert ID Only', value: 'insertId' },
      ],
      default: 'all',
      description: 'What to return from the operation',
      displayOptions: {
        show: {
          operation: ['insert', 'update', 'delete'],
        },
      },
    },
  ],
});

export class MySQLNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const {
        operation,
        query,
        table,
        columns,
        where,
        orderBy,
        limit,
        data,
        tableSchema,
        returnFields,
      } = context.parameters;

      const results: any[] = [];

      for (const item of context.inputData) {
        let result;

        // Use input data to override parameters if available
        const tableToUse = table || item.table;
        const dataToUse = data || item.data || item;

        switch (operation) {
          case 'executeQuery':
            result = await this.executeQuery(query || item.query);
            break;
          case 'select':
            result = await this.select(
              tableToUse,
              columns || item.columns,
              where || item.where,
              orderBy || item.orderBy,
              limit || item.limit
            );
            break;
          case 'insert':
            result = await this.insert(tableToUse, dataToUse, returnFields);
            break;
          case 'update':
            result = await this.update(
              tableToUse,
              dataToUse,
              where || item.where,
              returnFields
            );
            break;
          case 'delete':
            result = await this.delete(tableToUse, where || item.where, returnFields);
            break;
          case 'createTable':
            result = await this.createTable(tableToUse, tableSchema || item.tableSchema);
            break;
          case 'dropTable':
            result = await this.dropTable(tableToUse);
            break;
          case 'showTables':
            result = await this.showTables();
            break;
          case 'describeTable':
            result = await this.describeTable(tableToUse);
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

  private async executeQuery(query: string): Promise<any> {
    if (!query) {
      throw new Error('SQL query is required');
    }

    // Simulate database query execution
    // In a real implementation, you would use mysql2 or similar library
    console.log(`Executing MySQL query: ${query}`);

    // Mock response based on query type
    const queryType = query.trim().split(' ')[0].toUpperCase();
    
    let mockResult;
    switch (queryType) {
      case 'SELECT':
        mockResult = {
          rows: [
            { id: 1, name: 'John Doe', email: 'john@example.com' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
          ],
          rowCount: 2,
        };
        break;
      case 'INSERT':
        mockResult = {
          insertId: Math.floor(Math.random() * 1000) + 1,
          affectedRows: 1,
        };
        break;
      case 'UPDATE':
      case 'DELETE':
        mockResult = {
          affectedRows: Math.floor(Math.random() * 5) + 1,
        };
        break;
      default:
        mockResult = {
          success: true,
          message: 'Query executed successfully',
        };
    }

    return {
      success: true,
      operation: 'executeQuery',
      query,
      queryType,
      result: mockResult,
      executedAt: new Date(),
    };
  }

  private async select(
    table: string,
    columns: string = '*',
    where?: string,
    orderBy?: string,
    limit?: number
  ): Promise<any> {
    if (!table) {
      throw new Error('Table name is required');
    }

    let query = `SELECT ${columns} FROM ${table}`;
    
    if (where) {
      query += ` WHERE ${where}`;
    }
    
    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }
    
    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    // Mock data
    const mockRows = Array.from({ length: Math.min(limit || 10, 10) }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      created_at: new Date(Date.now() - Math.random() * 86400000 * 30),
    }));

    return {
      success: true,
      operation: 'select',
      table,
      query,
      rows: mockRows,
      rowCount: mockRows.length,
      executedAt: new Date(),
    };
  }

  private async insert(table: string, data: any, returnFields: string = 'all'): Promise<any> {
    if (!table || !data) {
      throw new Error('Table name and data are required');
    }

    const columns = Object.keys(data).join(', ');
    const values = Object.values(data).map(v => `'${v}'`).join(', ');
    const query = `INSERT INTO ${table} (${columns}) VALUES (${values})`;

    const insertId = Math.floor(Math.random() * 1000) + 1;
    const affectedRows = 1;

    let result: any = {
      success: true,
      operation: 'insert',
      table,
      query,
      data,
      insertId,
      affectedRows,
      executedAt: new Date(),
    };

    switch (returnFields) {
      case 'count':
        result = { affectedRows, executedAt: result.executedAt };
        break;
      case 'insertId':
        result = { insertId, executedAt: result.executedAt };
        break;
      // 'all' returns everything
    }

    return result;
  }

  private async update(
    table: string,
    data: any,
    where?: string,
    returnFields: string = 'all'
  ): Promise<any> {
    if (!table || !data) {
      throw new Error('Table name and data are required');
    }

    const setClause = Object.entries(data)
      .map(([key, value]) => `${key} = '${value}'`)
      .join(', ');
    
    let query = `UPDATE ${table} SET ${setClause}`;
    
    if (where) {
      query += ` WHERE ${where}`;
    }

    const affectedRows = Math.floor(Math.random() * 5) + 1;

    let result: any = {
      success: true,
      operation: 'update',
      table,
      query,
      data,
      where: where || null,
      affectedRows,
      executedAt: new Date(),
    };

    if (returnFields === 'count') {
      result = { affectedRows, executedAt: result.executedAt };
    }

    return result;
  }

  private async delete(table: string, where?: string, returnFields: string = 'all'): Promise<any> {
    if (!table) {
      throw new Error('Table name is required');
    }

    let query = `DELETE FROM ${table}`;
    
    if (where) {
      query += ` WHERE ${where}`;
    } else {
      throw new Error('WHERE clause is required for DELETE operations for safety');
    }

    const affectedRows = Math.floor(Math.random() * 3) + 1;

    let result: any = {
      success: true,
      operation: 'delete',
      table,
      query,
      where,
      affectedRows,
      executedAt: new Date(),
    };

    if (returnFields === 'count') {
      result = { affectedRows, executedAt: result.executedAt };
    }

    return result;
  }

  private async createTable(table: string, schema: any): Promise<any> {
    if (!table || !schema) {
      throw new Error('Table name and schema are required');
    }

    const columns = Object.entries(schema)
      .map(([name, definition]) => `${name} ${definition}`)
      .join(', ');
    
    const query = `CREATE TABLE ${table} (${columns})`;

    return {
      success: true,
      operation: 'createTable',
      table,
      query,
      schema,
      created: true,
      executedAt: new Date(),
    };
  }

  private async dropTable(table: string): Promise<any> {
    if (!table) {
      throw new Error('Table name is required');
    }

    const query = `DROP TABLE ${table}`;

    return {
      success: true,
      operation: 'dropTable',
      table,
      query,
      dropped: true,
      executedAt: new Date(),
    };
  }

  private async showTables(): Promise<any> {
    // Mock table list
    const tables = [
      'users',
      'products',
      'orders',
      'categories',
      'settings',
    ];

    return {
      success: true,
      operation: 'showTables',
      query: 'SHOW TABLES',
      tables,
      tableCount: tables.length,
      executedAt: new Date(),
    };
  }

  private async describeTable(table: string): Promise<any> {
    if (!table) {
      throw new Error('Table name is required');
    }

    // Mock table structure
    const columns = [
      {
        Field: 'id',
        Type: 'int(11)',
        Null: 'NO',
        Key: 'PRI',
        Default: null,
        Extra: 'auto_increment',
      },
      {
        Field: 'name',
        Type: 'varchar(255)',
        Null: 'NO',
        Key: '',
        Default: null,
        Extra: '',
      },
      {
        Field: 'email',
        Type: 'varchar(255)',
        Null: 'YES',
        Key: 'UNI',
        Default: null,
        Extra: '',
      },
      {
        Field: 'created_at',
        Type: 'timestamp',
        Null: 'NO',
        Key: '',
        Default: 'CURRENT_TIMESTAMP',
        Extra: '',
      },
    ];

    return {
      success: true,
      operation: 'describeTable',
      table,
      query: `DESCRIBE ${table}`,
      columns,
      columnCount: columns.length,
      executedAt: new Date(),
    };
  }
}
