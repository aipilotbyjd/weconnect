import * as fs from 'fs/promises';
import * as path from 'path';
import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../../../../core/abstracts/base-node.interface';

export const FileOperationsNodeDefinition = new NodeDefinition({
  name: 'FileOperations',
  displayName: 'File Operations',
  description: 'Read, write, and manipulate files on the local file system',
  version: 1,
  group: ['data'],
  icon: 'fa:file',
  defaults: {
    name: 'File Operations',
    color: '#34D399',
  },
  inputs: ['main'],
  outputs: ['main'],
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'options',
      options: [
        { name: 'Read File', value: 'readFile' },
        { name: 'Write File', value: 'writeFile' },
        { name: 'Append File', value: 'appendFile' },
        { name: 'Delete File', value: 'deleteFile' },
        { name: 'List Directory', value: 'listDirectory' },
        { name: 'Create Directory', value: 'createDirectory' },
        { name: 'Copy File', value: 'copyFile' },
        { name: 'Move File', value: 'moveFile' },
        { name: 'Get File Stats', value: 'getStats' },
      ],
      default: 'readFile',
      required: true,
    },
    {
      name: 'filePath',
      displayName: 'File Path',
      type: 'string',
      required: true,
      placeholder: '/path/to/file.txt',
      description: 'Path to the file',
      displayOptions: {
        show: {
          operation: ['readFile', 'writeFile', 'appendFile', 'deleteFile', 'copyFile', 'moveFile', 'getStats'],
        },
      },
    },
    {
      name: 'directoryPath',
      displayName: 'Directory Path',
      type: 'string',
      required: true,
      placeholder: '/path/to/directory',
      description: 'Path to the directory',
      displayOptions: {
        show: {
          operation: ['listDirectory', 'createDirectory'],
        },
      },
    },
    {
      name: 'content',
      displayName: 'Content',
      type: 'string',
      description: 'Content to write to the file',
      displayOptions: {
        show: {
          operation: ['writeFile', 'appendFile'],
        },
      },
    },
    {
      name: 'encoding',
      displayName: 'Encoding',
      type: 'options',
      options: [
        { name: 'UTF-8', value: 'utf8' },
        { name: 'ASCII', value: 'ascii' },
        { name: 'Base64', value: 'base64' },
        { name: 'Binary', value: 'binary' },
      ],
      default: 'utf8',
      description: 'File encoding',
      displayOptions: {
        show: {
          operation: ['readFile', 'writeFile', 'appendFile'],
        },
      },
    },
    {
      name: 'destinationPath',
      displayName: 'Destination Path',
      type: 'string',
      placeholder: '/path/to/destination',
      description: 'Destination path for copy/move operations',
      displayOptions: {
        show: {
          operation: ['copyFile', 'moveFile'],
        },
      },
    },
    {
      name: 'createDirectories',
      displayName: 'Create Directories',
      type: 'boolean',
      default: true,
      description: 'Create parent directories if they don\'t exist',
      displayOptions: {
        show: {
          operation: ['writeFile', 'appendFile', 'copyFile', 'moveFile'],
        },
      },
    },
  ],
});

export class FileOperationsNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const { operation, filePath, directoryPath, content, encoding, destinationPath, createDirectories } = context.parameters;
      const results: any[] = [];

      for (const item of context.inputData) {
        let result;

        // Use input data to dynamically set paths if needed
        const resolvedFilePath = this.resolvePath(filePath || item.filePath);
        const resolvedDirectoryPath = this.resolvePath(directoryPath || item.directoryPath);
        const resolvedDestinationPath = this.resolvePath(destinationPath || item.destinationPath);
        const resolvedContent = content || item.content || '';

        switch (operation) {
          case 'readFile':
            result = await this.readFile(resolvedFilePath, encoding);
            break;
          case 'writeFile':
            result = await this.writeFile(resolvedFilePath, resolvedContent, encoding, createDirectories);
            break;
          case 'appendFile':
            result = await this.appendFile(resolvedFilePath, resolvedContent, encoding, createDirectories);
            break;
          case 'deleteFile':
            result = await this.deleteFile(resolvedFilePath);
            break;
          case 'listDirectory':
            result = await this.listDirectory(resolvedDirectoryPath);
            break;
          case 'createDirectory':
            result = await this.createDirectory(resolvedDirectoryPath);
            break;
          case 'copyFile':
            result = await this.copyFile(resolvedFilePath, resolvedDestinationPath, createDirectories);
            break;
          case 'moveFile':
            result = await this.moveFile(resolvedFilePath, resolvedDestinationPath, createDirectories);
            break;
          case 'getStats':
            result = await this.getStats(resolvedFilePath);
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

  private resolvePath(inputPath: string): string {
    if (!inputPath) {
      throw new Error('Path is required');
    }
    return path.resolve(inputPath);
  }

  private async readFile(filePath: string, encoding: string = 'utf8'): Promise<any> {
    try {
      const content = await fs.readFile(filePath, encoding as BufferEncoding);
      const stats = await fs.stat(filePath);

      return {
        success: true,
        filePath,
        content,
        size: stats.size,
        modified: stats.mtime,
        encoding,
      };
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }

  private async writeFile(filePath: string, content: string, encoding: string = 'utf8', createDirs: boolean = true): Promise<any> {
    try {
      if (createDirs) {
        const directory = path.dirname(filePath);
        await fs.mkdir(directory, { recursive: true });
      }

      await fs.writeFile(filePath, content, encoding as BufferEncoding);
      const stats = await fs.stat(filePath);

      return {
        success: true,
        filePath,
        operation: 'write',
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
      };
    } catch (error) {
      throw new Error(`Failed to write file: ${error.message}`);
    }
  }

  private async appendFile(filePath: string, content: string, encoding: string = 'utf8', createDirs: boolean = true): Promise<any> {
    try {
      if (createDirs) {
        const directory = path.dirname(filePath);
        await fs.mkdir(directory, { recursive: true });
      }

      await fs.appendFile(filePath, content, encoding as BufferEncoding);
      const stats = await fs.stat(filePath);

      return {
        success: true,
        filePath,
        operation: 'append',
        size: stats.size,
        modified: stats.mtime,
      };
    } catch (error) {
      throw new Error(`Failed to append to file: ${error.message}`);
    }
  }

  private async deleteFile(filePath: string): Promise<any> {
    try {
      await fs.unlink(filePath);

      return {
        success: true,
        filePath,
        operation: 'delete',
        deletedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  private async listDirectory(directoryPath: string): Promise<any> {
    try {
      const items = await fs.readdir(directoryPath, { withFileTypes: true });
      const files: any[] = [];

      for (const item of items) {
        const itemPath = path.join(directoryPath, item.name);
        const stats = await fs.stat(itemPath);

        files.push({
          name: item.name,
          path: itemPath,
          isFile: item.isFile(),
          isDirectory: item.isDirectory(),
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
        });
      }

      return {
        success: true,
        directoryPath,
        totalItems: files.length,
        files: files.filter(f => f.isFile),
        directories: files.filter(f => f.isDirectory),
        items: files,
      };
    } catch (error) {
      throw new Error(`Failed to list directory: ${error.message}`);
    }
  }

  private async createDirectory(directoryPath: string): Promise<any> {
    try {
      await fs.mkdir(directoryPath, { recursive: true });

      return {
        success: true,
        directoryPath,
        operation: 'createDirectory',
        createdAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to create directory: ${error.message}`);
    }
  }

  private async copyFile(sourcePath: string, destinationPath: string, createDirs: boolean = true): Promise<any> {
    try {
      if (createDirs) {
        const directory = path.dirname(destinationPath);
        await fs.mkdir(directory, { recursive: true });
      }

      await fs.copyFile(sourcePath, destinationPath);
      const stats = await fs.stat(destinationPath);

      return {
        success: true,
        sourcePath,
        destinationPath,
        operation: 'copy',
        size: stats.size,
        copiedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to copy file: ${error.message}`);
    }
  }

  private async moveFile(sourcePath: string, destinationPath: string, createDirs: boolean = true): Promise<any> {
    try {
      if (createDirs) {
        const directory = path.dirname(destinationPath);
        await fs.mkdir(directory, { recursive: true });
      }

      await fs.rename(sourcePath, destinationPath);
      const stats = await fs.stat(destinationPath);

      return {
        success: true,
        sourcePath,
        destinationPath,
        operation: 'move',
        size: stats.size,
        movedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to move file: ${error.message}`);
    }
  }

  private async getStats(filePath: string): Promise<any> {
    try {
      const stats = await fs.stat(filePath);

      return {
        success: true,
        filePath,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
        mode: stats.mode,
        uid: stats.uid,
        gid: stats.gid,
      };
    } catch (error) {
      throw new Error(`Failed to get file stats: ${error.message}`);
    }
  }

  validate(configuration: Record<string, any>): boolean {
    // Basic validation - override in specific implementations
    return true;
  }

  getConfigurationSchema(): any {
    return {
      type: 'object',
      properties: {},
      required: []
    };
  }

}