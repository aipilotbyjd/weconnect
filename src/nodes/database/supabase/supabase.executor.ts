import { Injectable, Logger } from '@nestjs/common';
import { NodeExecutor } from '../../interfaces/node-executor.interface';
import { NodeExecutionContext } from '../../interfaces/node-execution-context.interface';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseExecutor implements NodeExecutor {
  private readonly logger = new Logger(SupabaseExecutor.name);

  async execute(context: NodeExecutionContext): Promise<any> {
    const { parameters, credentials } = context;
    
    try {
      // Get connection details
      const url = credentials?.url || parameters.url;
      const anonKey = credentials?.anonKey || parameters.anonKey;
      const operation = parameters.operation;

      if (!url || !anonKey) {
        throw new Error('Supabase URL and anon key are required');
      }

      // Create Supabase client
      const supabase: SupabaseClient = createClient(url, anonKey);
      let result: any;

      switch (operation) {
        case 'select':
          result = await this.selectData(supabase, parameters);
          break;
        case 'insert':
          result = await this.insertData(supabase, parameters);
          break;
        case 'update':
          result = await this.updateData(supabase, parameters);
          break;
        case 'upsert':
          result = await this.upsertData(supabase, parameters);
          break;
        case 'delete':
          result = await this.deleteData(supabase, parameters);
          break;
        case 'rpc':
          result = await this.callFunction(supabase, parameters);
          break;
        case 'upload':
          result = await this.uploadFile(supabase, parameters);
          break;
        case 'download':
          result = await this.downloadFile(supabase, parameters);
          break;
        case 'signUp':
          result = await this.signUpUser(supabase, parameters);
          break;
        case 'signIn':
          result = await this.signInUser(supabase, parameters);
          break;
        case 'signOut':
          result = await this.signOutUser(supabase);
          break;
        case 'getUser':
          result = await this.getCurrentUser(supabase);
          break;
        case 'updateUser':
          result = await this.updateUser(supabase, parameters);
          break;
        case 'resetPassword':
          result = await this.resetPassword(supabase, parameters);
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      return {
        success: true,
        data: result,
        operation,
        table: parameters.table
      };

    } catch (error) {
      this.logger.error(`Supabase operation failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
        operation: parameters.operation
      };
    }
  }

  private async selectData(supabase: SupabaseClient, parameters: any): Promise<any> {
    let query = supabase.from(parameters.table).select(parameters.select || '*');

    // Add filters
    if (parameters.filters) {
      const filters = JSON.parse(parameters.filters);
      for (const [column, condition] of Object.entries(filters)) {
        if (typeof condition === 'object' && condition !== null) {
          const [operator, value] = Object.entries(condition)[0];
          switch (operator) {
            case 'eq':
              query = query.eq(column, value);
              break;
            case 'neq':
              query = query.neq(column, value);
              break;
            case 'gt':
              query = query.gt(column, value);
              break;
            case 'gte':
              query = query.gte(column, value);
              break;
            case 'lt':
              query = query.lt(column, value);
              break;
            case 'lte':
              query = query.lte(column, value);
              break;
            case 'like':
              query = query.like(column, value);
              break;
            case 'in':
              query = query.in(column, value);
              break;
          }
        } else {
          query = query.eq(column, condition);
        }
      }
    }

    // Add ordering
    if (parameters.orderBy) {
      const orderBy = JSON.parse(parameters.orderBy);
      query = query.order(orderBy.column, { ascending: orderBy.ascending !== false });
    }

    // Add limit and range
    if (parameters.limit) {
      query = query.limit(parseInt(parameters.limit));
    }

    if (parameters.range) {
      const range = JSON.parse(parameters.range);
      query = query.range(range.from, range.to);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  private async insertData(supabase: SupabaseClient, parameters: any): Promise<any> {
    const data = JSON.parse(parameters.data);
    const { data: result, error } = await supabase
      .from(parameters.table)
      .insert(data)
      .select();
    
    if (error) throw error;
    return result;
  }

  private async updateData(supabase: SupabaseClient, parameters: any): Promise<any> {
    const data = JSON.parse(parameters.data);
    const filters = JSON.parse(parameters.filters || '{}');
    
    let query = supabase.from(parameters.table).update(data);
    
    // Apply filters
    for (const [column, value] of Object.entries(filters)) {
      query = query.eq(column, value);
    }

    const { data: result, error } = await query.select();
    if (error) throw error;
    return result;
  }

  private async upsertData(supabase: SupabaseClient, parameters: any): Promise<any> {
    const data = JSON.parse(parameters.data);
    const { data: result, error } = await supabase
      .from(parameters.table)
      .upsert(data)
      .select();
    
    if (error) throw error;
    return result;
  }

  private async deleteData(supabase: SupabaseClient, parameters: any): Promise<any> {
    const filters = JSON.parse(parameters.filters || '{}');
    
    let query = supabase.from(parameters.table).delete();
    
    // Apply filters
    for (const [column, value] of Object.entries(filters)) {
      query = query.eq(column, value);
    }

    const { data: result, error } = await query.select();
    if (error) throw error;
    return result;
  }

  private async callFunction(supabase: SupabaseClient, parameters: any): Promise<any> {
    const functionName = parameters.functionName;
    const args = parameters.args ? JSON.parse(parameters.args) : {};
    
    const { data, error } = await supabase.rpc(functionName, args);
    if (error) throw error;
    return data;
  }

  private async uploadFile(supabase: SupabaseClient, parameters: any): Promise<any> {
    const bucket = parameters.bucket;
    const fileName = parameters.fileName;
    const fileContent = parameters.fileContent;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileContent);
    
    if (error) throw error;
    return data;
  }

  private async downloadFile(supabase: SupabaseClient, parameters: any): Promise<any> {
    const bucket = parameters.bucket;
    const fileName = parameters.fileName;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(fileName);
    
    if (error) throw error;
    return data;
  }

  private async signUpUser(supabase: SupabaseClient, parameters: any): Promise<any> {
    const { data, error } = await supabase.auth.signUp({
      email: parameters.email,
      password: parameters.password,
      options: {
        data: parameters.metadata ? JSON.parse(parameters.metadata) : {}
      }
    });
    
    if (error) throw error;
    return data;
  }

  private async signInUser(supabase: SupabaseClient, parameters: any): Promise<any> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parameters.email,
      password: parameters.password
    });
    
    if (error) throw error;
    return data;
  }

  private async signOutUser(supabase: SupabaseClient): Promise<any> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { message: 'User signed out successfully' };
  }

  private async getCurrentUser(supabase: SupabaseClient): Promise<any> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  private async updateUser(supabase: SupabaseClient, parameters: any): Promise<any> {
    const updates: any = {};
    
    if (parameters.email) updates.email = parameters.email;
    if (parameters.password) updates.password = parameters.password;
    if (parameters.metadata) updates.data = JSON.parse(parameters.metadata);
    
    const { data, error } = await supabase.auth.updateUser(updates);
    if (error) throw error;
    return data;
  }

  private async resetPassword(supabase: SupabaseClient, parameters: any): Promise<any> {
    const { data, error } = await supabase.auth.resetPasswordForEmail(parameters.email);
    if (error) throw error;
    return data;
  }
}
