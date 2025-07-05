import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../../domain/interfaces/node-executor.interface';

export const GoogleDriveNodeDefinition = new NodeDefinition({
  name: 'GoogleDrive',
  displayName: 'Google Drive',
  description: 'Create, read, update, delete, and manage files in Google Drive',
  version: 1,
  group: ['storage', 'google'],
  icon: 'fa:google-drive',
  defaults: {
    name: 'Google Drive',
    color: '#4285F4',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'googleDriveOAuth2Api',
      required: true,
    },
  ],
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'options',
      options: [
        { name: 'Upload File', value: 'upload' },
        { name: 'Download File', value: 'download' },
        { name: 'List Files', value: 'list' },
        { name: 'Delete File', value: 'delete' },
        { name: 'Create Folder', value: 'createFolder' },
        { name: 'Share File', value: 'share' },
        { name: 'Search Files', value: 'search' },
        { name: 'Get File Info', value: 'getInfo' },
        { name: 'Move File', value: 'move' },
        { name: 'Copy File', value: 'copy' },
      ],
      default: 'upload',
      required: true,
    },
    {
      name: 'fileId',
      displayName: 'File ID',
      type: 'string',
      required: true,
      default: '',
      placeholder: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      description: 'The ID of the file to operate on',
    },
    {
      name: 'fileName',
      displayName: 'File Name',
      type: 'string',
      default: '',
      placeholder: 'document.pdf',
      description: 'Name of the file',
    },
    {
      name: 'fileContent',
      displayName: 'File Content',
      type: 'string',
      default: '',
      description: 'Content of the file (for upload operation)',
    },
    {
      name: 'mimeType',
      displayName: 'MIME Type',
      type: 'options',
      options: [
        { name: 'Auto-detect', value: 'auto' },
        { name: 'Google Docs', value: 'application/vnd.google-apps.document' },
        { name: 'Google Sheets', value: 'application/vnd.google-apps.spreadsheet' },
        { name: 'Google Slides', value: 'application/vnd.google-apps.presentation' },
        { name: 'PDF', value: 'application/pdf' },
        { name: 'Text', value: 'text/plain' },
        { name: 'Image (JPEG)', value: 'image/jpeg' },
        { name: 'Image (PNG)', value: 'image/png' },
        { name: 'ZIP', value: 'application/zip' },
      ],
      default: 'auto',
      description: 'MIME type of the file',
    },
    {
      name: 'parentId',
      displayName: 'Parent Folder ID',
      type: 'string',
      default: '',
      placeholder: 'root',
      description: 'ID of the parent folder (use "root" for root folder)',
    },
    {
      name: 'searchQuery',
      displayName: 'Search Query',
      type: 'string',
      default: '',
      placeholder: 'name contains "report"',
      description: 'Query string for searching files',
    },
    {
      name: 'shareSettings',
      displayName: 'Share Settings',
      type: 'collection',
      default: {},
      options: [
        {
          name: 'type',
          displayName: 'Permission Type',
          type: 'options',
          options: [
            { name: 'User', value: 'user' },
            { name: 'Group', value: 'group' },
            { name: 'Domain', value: 'domain' },
            { name: 'Anyone', value: 'anyone' },
          ],
          default: 'user',
        },
        {
          name: 'role',
          displayName: 'Role',
          type: 'options',
          options: [
            { name: 'Reader', value: 'reader' },
            { name: 'Writer', value: 'writer' },
            { name: 'Commenter', value: 'commenter' },
            { name: 'Owner', value: 'owner' },
          ],
          default: 'reader',
        },
        {
          name: 'emailAddress',
          displayName: 'Email Address',
          type: 'string',
          default: '',
          placeholder: 'user@example.com',
        },
      ],
    },
    {
      name: 'fields',
      displayName: 'Fields to Return',
      type: 'string',
      default: 'id,name,mimeType,modifiedTime,size',
      description: 'Comma-separated list of fields to return',
    },
  ],
});

export class GoogleDriveNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      const { 
        operation, 
        fileId, 
        fileName, 
        fileContent, 
        mimeType,
        parentId,
        searchQuery,
        shareSettings,
        fields
      } = context.parameters;
      
      // In a real implementation, you would use Google Drive API client
      // For now, we'll simulate the operations
      
      switch (operation) {
        case 'upload': {
          if (!fileName || !fileContent) {
            throw new Error('File name and content are required for upload');
          }
          
          const uploadResult = {
            id: `file_${Date.now()}`,
            name: fileName,
            mimeType: mimeType === 'auto' ? 'application/octet-stream' : mimeType,
            size: fileContent.length,
            createdTime: new Date().toISOString(),
            modifiedTime: new Date().toISOString(),
            parents: [parentId || 'root'],
            webViewLink: `https://drive.google.com/file/d/file_${Date.now()}/view`,
          };
          
          return {
            success: true,
            data: [uploadResult],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'upload',
            },
          };
        }
        
        case 'download': {
          if (!fileId) {
            throw new Error('File ID is required for download');
          }
          
          const downloadResult = {
            id: fileId,
            name: 'downloaded_file.txt',
            content: 'This is the simulated file content',
            mimeType: 'text/plain',
            size: 33,
          };
          
          return {
            success: true,
            data: [downloadResult],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'download',
            },
          };
        }
        
        case 'list': {
          const listResult = {
            files: [
              {
                id: 'file_1',
                name: 'Document1.docx',
                mimeType: 'application/vnd.google-apps.document',
                modifiedTime: '2024-01-15T10:30:00Z',
                size: 1024,
              },
              {
                id: 'file_2',
                name: 'Spreadsheet1.xlsx',
                mimeType: 'application/vnd.google-apps.spreadsheet',
                modifiedTime: '2024-01-14T15:45:00Z',
                size: 2048,
              },
              {
                id: 'folder_1',
                name: 'My Folder',
                mimeType: 'application/vnd.google-apps.folder',
                modifiedTime: '2024-01-13T09:00:00Z',
              },
            ],
            nextPageToken: null,
          };
          
          return {
            success: true,
            data: listResult.files,
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: listResult.files.length,
              operation: 'list',
            },
          };
        }
        
        case 'delete': {
          if (!fileId) {
            throw new Error('File ID is required for delete');
          }
          
          return {
            success: true,
            data: [{ deleted: true, fileId }],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'delete',
            },
          };
        }
        
        case 'createFolder': {
          if (!fileName) {
            throw new Error('Folder name is required');
          }
          
          const folderResult = {
            id: `folder_${Date.now()}`,
            name: fileName,
            mimeType: 'application/vnd.google-apps.folder',
            createdTime: new Date().toISOString(),
            modifiedTime: new Date().toISOString(),
            parents: [parentId || 'root'],
            webViewLink: `https://drive.google.com/drive/folders/folder_${Date.now()}`,
          };
          
          return {
            success: true,
            data: [folderResult],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'createFolder',
            },
          };
        }
        
        case 'share': {
          if (!fileId || !shareSettings) {
            throw new Error('File ID and share settings are required');
          }
          
          const shareResult = {
            id: `permission_${Date.now()}`,
            type: shareSettings.type,
            role: shareSettings.role,
            emailAddress: shareSettings.emailAddress,
            fileId,
            created: true,
          };
          
          return {
            success: true,
            data: [shareResult],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'share',
            },
          };
        }
        
        case 'search': {
          if (!searchQuery) {
            throw new Error('Search query is required');
          }
          
          const searchResults = {
            files: [
              {
                id: 'search_result_1',
                name: 'Report_2024.pdf',
                mimeType: 'application/pdf',
                modifiedTime: '2024-01-10T14:30:00Z',
                size: 5120,
              },
              {
                id: 'search_result_2',
                name: 'Annual_Report.docx',
                mimeType: 'application/vnd.google-apps.document',
                modifiedTime: '2024-01-08T11:00:00Z',
                size: 3072,
              },
            ],
          };
          
          return {
            success: true,
            data: searchResults.files,
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: searchResults.files.length,
              operation: 'search',
              query: searchQuery,
            },
          };
        }
        
        case 'getInfo': {
          if (!fileId) {
            throw new Error('File ID is required');
          }
          
          const fileInfo = {
            id: fileId,
            name: 'Example File.pdf',
            mimeType: 'application/pdf',
            size: 10240,
            createdTime: '2024-01-01T10:00:00Z',
            modifiedTime: '2024-01-15T16:30:00Z',
            owners: [{ emailAddress: 'owner@example.com', displayName: 'File Owner' }],
            shared: true,
            webViewLink: `https://drive.google.com/file/d/${fileId}/view`,
            webContentLink: `https://drive.google.com/uc?id=${fileId}&export=download`,
          };
          
          return {
            success: true,
            data: [fileInfo],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'getInfo',
            },
          };
        }
        
        case 'move': {
          if (!fileId || !parentId) {
            throw new Error('File ID and destination folder ID are required');
          }
          
          const moveResult = {
            id: fileId,
            moved: true,
            newParent: parentId,
            previousParent: 'root',
          };
          
          return {
            success: true,
            data: [moveResult],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'move',
            },
          };
        }
        
        case 'copy': {
          if (!fileId) {
            throw new Error('File ID is required for copy');
          }
          
          const copyResult = {
            id: `file_copy_${Date.now()}`,
            name: fileName || 'Copy of file',
            originalId: fileId,
            createdTime: new Date().toISOString(),
            parents: [parentId || 'root'],
          };
          
          return {
            success: true,
            data: [copyResult],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'copy',
            },
          };
        }
        
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
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
