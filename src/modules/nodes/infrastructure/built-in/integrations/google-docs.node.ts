import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import {
  INodeExecutor,
  NodeExecutionContext,
  NodeExecutionResult,
} from '../../../../../core/abstracts/base-node.interface';

export const GoogleDocsNodeDefinition = new NodeDefinition({
  name: 'GoogleDocs',
  displayName: 'Google Docs',
  description: 'Create, read, update documents in Google Docs',
  version: 1,
  group: ['productivity', 'google'],
  icon: 'fa:file-text',
  defaults: {
    name: 'Google Docs',
    color: '#4285F4',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'googleDocsOAuth2Api',
      required: true,
    },
  ],
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'options',
      options: [
        { name: 'Create Document', value: 'create' },
        { name: 'Get Document', value: 'get' },
        { name: 'Update Document', value: 'update' },
        { name: 'Append Text', value: 'append' },
        { name: 'Insert Text', value: 'insert' },
        { name: 'Replace Text', value: 'replace' },
        { name: 'Delete Content', value: 'delete' },
        { name: 'Get All Text', value: 'getAllText' },
        { name: 'Insert Image', value: 'insertImage' },
        { name: 'Insert Table', value: 'insertTable' },
        { name: 'Format Text', value: 'format' },
        { name: 'Export Document', value: 'export' },
      ],
      default: 'create',
      required: true,
    },
    {
      name: 'documentId',
      displayName: 'Document ID',
      type: 'string',
      default: '',
      placeholder: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      description: 'The ID of the Google Doc',
    },
    {
      name: 'title',
      displayName: 'Document Title',
      type: 'string',
      default: '',
      placeholder: 'My Document',
      description: 'Title of the document',
    },
    {
      name: 'content',
      displayName: 'Content',
      type: 'string',
      default: '',
      placeholder: 'Document content...',
      description: 'Text content to add to the document',
    },
    {
      name: 'location',
      displayName: 'Location',
      type: 'collection',
      default: {},
      options: [
        {
          name: 'index',
          displayName: 'Index',
          type: 'number',
          default: 1,
          description: 'The zero-based index where to insert',
        },
        {
          name: 'segmentId',
          displayName: 'Segment ID',
          type: 'string',
          default: '',
          description: 'ID of the header, footer, or footnote',
        },
      ],
    },
    {
      name: 'searchText',
      displayName: 'Search Text',
      type: 'string',
      default: '',
      placeholder: 'Text to search',
      description: 'Text to search for in the document',
    },
    {
      name: 'replaceText',
      displayName: 'Replace Text',
      type: 'string',
      default: '',
      placeholder: 'Replacement text',
      description: 'Text to replace with',
    },
    {
      name: 'matchCase',
      displayName: 'Match Case',
      type: 'boolean',
      default: false,
      description: 'Whether the search is case sensitive',
    },
    {
      name: 'startIndex',
      displayName: 'Start Index',
      type: 'number',
      default: 0,
      description: 'Start index for the operation',
    },
    {
      name: 'endIndex',
      displayName: 'End Index',
      type: 'number',
      default: 0,
      description: 'End index for the operation',
    },
    {
      name: 'imageUri',
      displayName: 'Image URI',
      type: 'string',
      default: '',
      placeholder: 'https://example.com/image.jpg',
      description: 'URI of the image to insert',
    },
    {
      name: 'imageSize',
      displayName: 'Image Size',
      type: 'collection',
      default: {},
      options: [
        {
          name: 'width',
          displayName: 'Width',
          type: 'number',
          default: 300,
          description: 'Width in pixels',
        },
        {
          name: 'height',
          displayName: 'Height',
          type: 'number',
          default: 200,
          description: 'Height in pixels',
        },
      ],
    },
    {
      name: 'tableSize',
      displayName: 'Table Size',
      type: 'collection',
      default: {},
      options: [
        {
          name: 'rows',
          displayName: 'Rows',
          type: 'number',
          default: 3,
          description: 'Number of rows',
        },
        {
          name: 'columns',
          displayName: 'Columns',
          type: 'number',
          default: 3,
          description: 'Number of columns',
        },
      ],
    },
    {
      name: 'formatting',
      displayName: 'Text Formatting',
      type: 'collection',
      default: {},
      options: [
        {
          name: 'bold',
          displayName: 'Bold',
          type: 'boolean',
          default: false,
        },
        {
          name: 'italic',
          displayName: 'Italic',
          type: 'boolean',
          default: false,
        },
        {
          name: 'underline',
          displayName: 'Underline',
          type: 'boolean',
          default: false,
        },
        {
          name: 'strikethrough',
          displayName: 'Strikethrough',
          type: 'boolean',
          default: false,
        },
        {
          name: 'fontSize',
          displayName: 'Font Size',
          type: 'number',
          default: 11,
          description: 'Font size in points',
        },
        {
          name: 'fontFamily',
          displayName: 'Font Family',
          type: 'string',
          default: 'Arial',
          placeholder: 'Arial',
        },
        {
          name: 'foregroundColor',
          displayName: 'Text Color',
          type: 'string',
          default: '#000000',
          placeholder: '#000000',
        },
        {
          name: 'backgroundColor',
          displayName: 'Background Color',
          type: 'string',
          default: '#FFFFFF',
          placeholder: '#FFFFFF',
        },
        {
          name: 'alignment',
          displayName: 'Alignment',
          type: 'options',
          options: [
            { name: 'Left', value: 'START' },
            { name: 'Center', value: 'CENTER' },
            { name: 'Right', value: 'END' },
            { name: 'Justified', value: 'JUSTIFIED' },
          ],
          default: 'START',
        },
      ],
    },
    {
      name: 'exportFormat',
      displayName: 'Export Format',
      type: 'options',
      options: [
        { name: 'PDF', value: 'pdf' },
        { name: 'Word (.docx)', value: 'docx' },
        { name: 'OpenDocument (.odt)', value: 'odt' },
        { name: 'Rich Text (.rtf)', value: 'rtf' },
        { name: 'Plain Text (.txt)', value: 'txt' },
        { name: 'HTML', value: 'html' },
        { name: 'EPUB', value: 'epub' },
      ],
      default: 'pdf',
      description: 'Format to export the document',
    },
  ],
});

export class GoogleDocsNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const {
        operation,
        documentId,
        title,
        content,
        location,
        searchText,
        replaceText,
        matchCase,
        startIndex,
        endIndex,
        imageUri,
        imageSize,
        tableSize,
        formatting,
        exportFormat,
      } = context.parameters;

      switch (operation) {
        case 'create': {
          if (!title) {
            throw new Error('Document title is required');
          }

          const newDoc = {
            documentId: `doc_${Date.now()}`,
            title,
            body: {
              content: [
                {
                  startIndex: 0,
                  endIndex: content ? content.length : 0,
                  paragraph: {
                    elements: [
                      {
                        startIndex: 0,
                        endIndex: content ? content.length : 0,
                        textRun: {
                          content: content || '',
                          textStyle: {},
                        },
                      },
                    ],
                  },
                },
              ],
            },
            revisionId: '1',
            suggestionsViewMode: 'SUGGESTIONS_INLINE',
            documentStyle: {
              defaultHeaderId: '',
              defaultFooterId: '',
              evenPageHeaderId: '',
              evenPageFooterId: '',
              firstPageHeaderId: '',
              firstPageFooterId: '',
            },
          };

          return {
            success: true,
            data: [newDoc],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'create',
            },
          };
        }

        case 'get': {
          if (!documentId) {
            throw new Error('Document ID is required');
          }

          const document = {
            documentId,
            title: 'Sample Document',
            body: {
              content: [
                {
                  startIndex: 0,
                  endIndex: 100,
                  paragraph: {
                    elements: [
                      {
                        startIndex: 0,
                        endIndex: 100,
                        textRun: {
                          content:
                            'This is a sample Google Doc with some content. You can edit, format, and manipulate this text.',
                          textStyle: {
                            fontSize: { magnitude: 11, unit: 'PT' },
                            weightedFontFamily: { fontFamily: 'Arial' },
                          },
                        },
                      },
                    ],
                    paragraphStyle: {
                      namedStyleType: 'NORMAL_TEXT',
                      alignment: 'START',
                    },
                  },
                },
              ],
            },
            revisionId: '42',
            suggestionsViewMode: 'SUGGESTIONS_INLINE',
          };

          return {
            success: true,
            data: [document],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'get',
            },
          };
        }

        case 'update': {
          if (!documentId || !content) {
            throw new Error('Document ID and content are required');
          }

          const updateResult = {
            documentId,
            updated: true,
            revisionId: '43',
            requests: [
              {
                insertText: {
                  text: content,
                  location: location?.index
                    ? { index: location.index }
                    : { index: 1 },
                },
              },
            ],
          };

          return {
            success: true,
            data: [updateResult],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'update',
            },
          };
        }

        case 'append': {
          if (!documentId || !content) {
            throw new Error('Document ID and content are required');
          }

          const appendResult = {
            documentId,
            appended: true,
            content,
            endIndex: 1000, // Simulated end index
            revisionId: '44',
          };

          return {
            success: true,
            data: [appendResult],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'append',
            },
          };
        }

        case 'insert': {
          if (!documentId || !content || location?.index === undefined) {
            throw new Error(
              'Document ID, content, and location index are required',
            );
          }

          const insertResult = {
            documentId,
            inserted: true,
            content,
            insertedAt: location.index,
            revisionId: '45',
          };

          return {
            success: true,
            data: [insertResult],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'insert',
            },
          };
        }

        case 'replace': {
          if (!documentId || !searchText || !replaceText) {
            throw new Error(
              'Document ID, search text, and replace text are required',
            );
          }

          const replaceResult = {
            documentId,
            replaced: true,
            searchText,
            replaceText,
            matchCase,
            replacements: 3, // Simulated number of replacements
            revisionId: '46',
          };

          return {
            success: true,
            data: [replaceResult],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'replace',
              replacementCount: 3,
            },
          };
        }

        case 'delete': {
          if (
            !documentId ||
            startIndex === undefined ||
            endIndex === undefined
          ) {
            throw new Error(
              'Document ID, start index, and end index are required',
            );
          }

          const deleteResult = {
            documentId,
            deleted: true,
            startIndex,
            endIndex,
            deletedLength: endIndex - startIndex,
            revisionId: '47',
          };

          return {
            success: true,
            data: [deleteResult],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'delete',
            },
          };
        }

        case 'getAllText': {
          if (!documentId) {
            throw new Error('Document ID is required');
          }

          const textContent = {
            documentId,
            title: 'Sample Document',
            fullText:
              'This is the complete text content of the document. It includes all paragraphs, headers, and other text elements.',
            wordCount: 15,
            characterCount: 108,
          };

          return {
            success: true,
            data: [textContent],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'getAllText',
            },
          };
        }

        case 'insertImage': {
          if (!documentId || !imageUri) {
            throw new Error('Document ID and image URI are required');
          }

          const imageResult = {
            documentId,
            imageInserted: true,
            imageUri,
            width: imageSize?.width || 300,
            height: imageSize?.height || 200,
            insertedAt: location?.index || 1,
            objectId: `img_${Date.now()}`,
            revisionId: '48',
          };

          return {
            success: true,
            data: [imageResult],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'insertImage',
            },
          };
        }

        case 'insertTable': {
          if (!documentId || !tableSize?.rows || !tableSize?.columns) {
            throw new Error('Document ID and table dimensions are required');
          }

          const tableResult = {
            documentId,
            tableInserted: true,
            rows: tableSize.rows,
            columns: tableSize.columns,
            insertedAt: location?.index || 1,
            tableId: `table_${Date.now()}`,
            revisionId: '49',
          };

          return {
            success: true,
            data: [tableResult],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'insertTable',
            },
          };
        }

        case 'format': {
          if (
            !documentId ||
            startIndex === undefined ||
            endIndex === undefined
          ) {
            throw new Error('Document ID and text range are required');
          }

          const formatResult = {
            documentId,
            formatted: true,
            startIndex,
            endIndex,
            formatting: {
              bold: formatting?.bold || false,
              italic: formatting?.italic || false,
              underline: formatting?.underline || false,
              strikethrough: formatting?.strikethrough || false,
              fontSize: formatting?.fontSize || 11,
              fontFamily: formatting?.fontFamily || 'Arial',
              foregroundColor: formatting?.foregroundColor || '#000000',
              backgroundColor: formatting?.backgroundColor || '#FFFFFF',
              alignment: formatting?.alignment || 'START',
            },
            revisionId: '50',
          };

          return {
            success: true,
            data: [formatResult],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'format',
            },
          };
        }

        case 'export': {
          if (!documentId || !exportFormat) {
            throw new Error('Document ID and export format are required');
          }

          const exportResult = {
            documentId,
            exportFormat,
            exportUrl: `https://docs.google.com/document/d/${documentId}/export?format=${exportFormat}`,
            fileName: `document.${exportFormat}`,
            mimeType: {
              pdf: 'application/pdf',
              docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              odt: 'application/vnd.oasis.opendocument.text',
              rtf: 'application/rtf',
              txt: 'text/plain',
              html: 'text/html',
              epub: 'application/epub+zip',
            }[exportFormat],
          };

          return {
            success: true,
            data: [exportResult],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'export',
              format: exportFormat,
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
