import { NodeDefinition } from '../../interfaces/node-definition.interface';

export const supabaseDefinition: NodeDefinition = {
  name: 'Supabase',
  category: 'Database',
  description: 'Perform Supabase serverless database operations including CRUD and authentication',
  version: '1.0.0',
  icon: 'database',
  color: '#3FC1BE',
  inputs: [
    {
      name: 'default',
      type: 'any',
      displayName: 'Input',
      description: 'Input data for the Supabase operation'
    }
  ],
  outputs: [
    {
      name: 'default',
      type: 'any',
      displayName: 'Result',
      description: 'Supabase operation result'
    }
  ],
  credentials: [
    {
      name: 'supabaseCredentials',
      displayName: 'Supabase Credentials',
      properties: {
        url: {
          type: 'string',
          displayName: 'Supabase URL',
          description: 'The URL for your Supabase project',
          required: true,
          default: ''
        },
        anonKey: {
          type: 'string',
          displayName: 'Anon Key',
          description: 'The anonymous key for your Supabase project',
          required: true,
          default: ''
        }
      }
    }
  ],
  properties: [
    {
      name: 'operation',
      type: 'select',
      displayName: 'Operation',
      description: 'Supabase operation to perform',
      required: true,
      default: 'select',
      options: [
        { value: 'select', label: 'Select Data' },
        { value: 'insert', label: 'Insert Data' },
        { value: 'update', label: 'Update Data' },
        { value: 'upsert', label: 'Upsert Data' },
        { value: 'delete', label: 'Delete Data' },
        { value: 'rpc', label: 'Call Function' },
        { value: 'upload', label: 'Upload File' },
        { value: 'download', label: 'Download File' },
        { value: 'signUp', label: 'Sign Up' },
        { value: 'signIn', label: 'Sign In' },
        { value: 'signOut', label: 'Sign Out' },
        { value: 'getUser', label: 'Get User' },
        { value: 'updateUser', label: 'Update User' },
        { value: 'resetPassword', label: 'Reset Password' }
      ]
    },
    {
      name: 'table',
      type: 'string',
      displayName: 'Table',
      description: 'Table name to perform operation on',
      required: true,
      default: ''
    },
    {
      name: 'select',
      type: 'string',
      displayName: 'Select',
      description: 'Columns to select, comma separated',
      required: false,
      default: '*',
      displayOptions: {
        show: {
          operation: ['select']
        }
      }
    },
    {
      name: 'filters',
      type: 'json',
      displayName: 'Filters',
      description: 'Filters to apply (JSON format)',
      required: false,
      default: '{}',
      displayOptions: {
        show: {
          operation: ['select', 'update', 'delete']
        }
      }
    },
    {
      name: 'orderBy',
      type: 'json',
      displayName: 'Order By',
      description: 'Order results by (JSON format)',
      required: false,
      default: '{}',
      displayOptions: {
        show: {
          operation: ['select']
        }
      }
    },
    {
      name: 'limit',
      type: 'number',
      displayName: 'Limit',
      description: 'Limit number of results',
      required: false,
      default: 0,
      displayOptions: {
        show: {
          operation: ['select']
        }
      }
    },
    {
      name: 'range',
      type: 'json',
      displayName: 'Range',
      description: 'Range to retrieve (JSON with from and to)',
      required: false,
      default: '{}',
      displayOptions: {
        show: {
          operation: ['select']
        }
      }
    },
    {
      name: 'data',
      type: 'json',
      displayName: 'Data',
      description: 'Data to insert or update (JSON format)',
      required: true,
      default: '{}',
      displayOptions: {
        show: {
          operation: ['insert', 'update', 'upsert']
        }
      }
    },
    {
      name: 'functionName',
      type: 'string',
      displayName: 'Function Name',
      description: 'RPC function name',
      required: true,
      default: '',
      displayOptions: {
        show: {
          operation: ['rpc']
        }
      }
    },
    {
      name: 'args',
      type: 'json',
      displayName: 'Arguments',
      description: 'Arguments for RPC function (JSON format)',
      required: false,
      default: '{}',
      displayOptions: {
        show: {
          operation: ['rpc']
        }
      }
    },
    {
      name: 'bucket',
      type: 'string',
      displayName: 'Bucket',
      description: 'Bucket name for file storage',
      required: true,
      default: '',
      displayOptions: {
        show: {
          operation: ['upload', 'download']
        }
      }
    },
    {
      name: 'fileName',
      type: 'string',
      displayName: 'File Name',
      description: 'File name for storage operation',
      required: true,
      default: '',
      displayOptions: {
        show: {
          operation: ['upload', 'download']
        }
      }
    },
    {
      name: 'fileContent',
      type: 'string',
      displayName: 'File Content',
      description: 'Content for file upload',
      required: true,
      default: '',
      displayOptions: {
        show: {
          operation: ['upload']
        }
      }
    },
    {
      name: 'email',
      type: 'string',
      displayName: 'Email',
      description: 'Email for authentication operations',
      required: true,
      default: '',
      displayOptions: {
        show: {
          operation: ['signUp', 'signIn', 'resetPassword']
        }
      }
    },
    {
      name: 'password',
      type: 'string',
      displayName: 'Password',
      description: 'Password for authentication operations',
      required: true,
      default: '',
      displayOptions: {
        show: {
          operation: ['signUp', 'signIn', 'updateUser']
        }
      }
    },
    {
      name: 'metadata',
      type: 'json',
      displayName: 'Metadata',
      description: 'User metadata for sign-up and updates (JSON format)',
      required: false,
      default: '{}',
      displayOptions: {
        show: {
          operation: ['signUp', 'updateUser']
        }
      }
    }
  ]
};
