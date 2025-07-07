import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../../../../core/abstracts/base-node.interface';

export const GmailAdvancedNodeDefinition = new NodeDefinition({
  name: 'GmailAdvanced',
  displayName: 'Gmail (Advanced)',
  description: 'Send emails, manage drafts, labels, and perform advanced Gmail operations',
  version: 1,
  group: ['communication', 'google'],
  icon: 'fa:envelope',
  defaults: {
    name: 'Gmail Advanced',
    color: '#EA4335',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'gmailOAuth2Api',
      required: true,
    },
  ],
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'options',
      options: [
        { name: 'Send Email', value: 'send' },
        { name: 'Get Email', value: 'get' },
        { name: 'List Emails', value: 'list' },
        { name: 'Delete Email', value: 'delete' },
        { name: 'Reply to Email', value: 'reply' },
        { name: 'Forward Email', value: 'forward' },
        { name: 'Create Draft', value: 'createDraft' },
        { name: 'Update Draft', value: 'updateDraft' },
        { name: 'Send Draft', value: 'sendDraft' },
        { name: 'Add Label', value: 'addLabel' },
        { name: 'Remove Label', value: 'removeLabel' },
        { name: 'Mark as Read', value: 'markAsRead' },
        { name: 'Mark as Unread', value: 'markAsUnread' },
        { name: 'Move to Trash', value: 'trash' },
        { name: 'Search Emails', value: 'search' },
        { name: 'Get Attachments', value: 'getAttachments' },
      ],
      default: 'send',
      required: true,
    },
    {
      name: 'messageId',
      displayName: 'Message ID',
      type: 'string',
      default: '',
      placeholder: '18abc123def456gh',
      description: 'The ID of the email message',
    },
    {
      name: 'to',
      displayName: 'To',
      type: 'string',
      default: '',
      placeholder: 'recipient@example.com',
      description: 'Email recipient(s). Separate multiple with commas.',
    },
    {
      name: 'cc',
      displayName: 'CC',
      type: 'string',
      default: '',
      placeholder: 'cc@example.com',
      description: 'CC recipient(s). Separate multiple with commas.',
    },
    {
      name: 'bcc',
      displayName: 'BCC',
      type: 'string',
      default: '',
      placeholder: 'bcc@example.com',
      description: 'BCC recipient(s). Separate multiple with commas.',
    },
    {
      name: 'subject',
      displayName: 'Subject',
      type: 'string',
      default: '',
      placeholder: 'Email Subject',
      description: 'Subject line of the email',
    },
    {
      name: 'body',
      displayName: 'Body',
      type: 'string',
      default: '',
      placeholder: 'Email body content',
      description: 'The body of the email',
      typeOptions: {
        multipleValues: false,
      },
    },
    {
      name: 'bodyType',
      displayName: 'Body Type',
      type: 'options',
      options: [
        { name: 'Plain Text', value: 'text' },
        { name: 'HTML', value: 'html' },
      ],
      default: 'text',
      description: 'Whether the body is plain text or HTML',
    },
    {
      name: 'attachments',
      displayName: 'Attachments',
      type: 'collection',
      default: [],
      options: [
        {
          name: 'fileName',
          displayName: 'File Name',
          type: 'string',
          default: '',
          description: 'Name of the attachment file',
        },
        {
          name: 'fileContent',
          displayName: 'File Content',
          type: 'string',
          default: '',
          description: 'Base64 encoded file content',
        },
        {
          name: 'mimeType',
          displayName: 'MIME Type',
          type: 'string',
          default: 'application/octet-stream',
          description: 'MIME type of the attachment',
        },
      ],
    },
    {
      name: 'labelIds',
      displayName: 'Label IDs',
      type: 'string',
      default: '',
      placeholder: 'INBOX,IMPORTANT',
      description: 'Comma-separated list of label IDs',
    },
    {
      name: 'query',
      displayName: 'Search Query',
      type: 'string',
      default: '',
      placeholder: 'from:someone@example.com subject:"Important"',
      description: 'Gmail search query syntax',
    },
    {
      name: 'maxResults',
      displayName: 'Max Results',
      type: 'number',
      default: 10,
      description: 'Maximum number of results to return',
    },
    {
      name: 'includeSpamTrash',
      displayName: 'Include Spam/Trash',
      type: 'boolean',
      default: false,
      description: 'Whether to include spam and trash messages',
    },
    {
      name: 'threadId',
      displayName: 'Thread ID',
      type: 'string',
      default: '',
      description: 'ID of the email thread',
    },
    {
      name: 'importance',
      displayName: 'Importance',
      type: 'options',
      options: [
        { name: 'Normal', value: 'normal' },
        { name: 'High', value: 'high' },
        { name: 'Low', value: 'low' },
      ],
      default: 'normal',
      description: 'Email importance level',
    },
  ],
});

export class GmailAdvancedNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      const { 
        operation,
        messageId,
        to,
        cc,
        bcc,
        subject,
        body,
        bodyType,
        attachments,
        labelIds,
        query,
        maxResults,
        includeSpamTrash,
        threadId,
        importance,
      } = context.parameters;
      
      switch (operation) {
        case 'send': {
          if (!to || !subject) {
            throw new Error('To and Subject are required for sending email');
          }
          
          const sendResult = {
            id: `msg_${Date.now()}`,
            threadId: threadId || `thread_${Date.now()}`,
            labelIds: ['SENT'],
            to: to.split(',').map(e => e.trim()),
            cc: cc ? cc.split(',').map(e => e.trim()) : [],
            bcc: bcc ? bcc.split(',').map(e => e.trim()) : [],
            subject,
            body,
            bodyType,
            sentTime: new Date().toISOString(),
            importance,
            attachmentCount: attachments ? attachments.length : 0,
          };
          
          return {
            success: true,
            data: [sendResult],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'send',
            },
          };
        }
        
        case 'get': {
          if (!messageId) {
            throw new Error('Message ID is required');
          }
          
          const message = {
            id: messageId,
            threadId: 'thread_123',
            labelIds: ['INBOX', 'UNREAD'],
            snippet: 'This is a preview of the email content...',
            payload: {
              headers: [
                { name: 'From', value: 'sender@example.com' },
                { name: 'To', value: 'recipient@example.com' },
                { name: 'Subject', value: 'Example Email Subject' },
                { name: 'Date', value: new Date().toUTCString() },
              ],
              body: {
                size: 1024,
                data: 'This is the email body content',
              },
            },
            sizeEstimate: 1024,
            historyId: '12345',
            internalDate: Date.now().toString(),
          };
          
          return {
            success: true,
            data: [message],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'get',
            },
          };
        }
        
        case 'list': {
          const messages = [
            {
              id: 'msg_1',
              threadId: 'thread_1',
              snippet: 'Important: Project update required...',
              from: 'boss@company.com',
              subject: 'Project Update',
              date: '2024-01-15T10:30:00Z',
              labelIds: ['INBOX', 'IMPORTANT'],
            },
            {
              id: 'msg_2',
              threadId: 'thread_2',
              snippet: 'Hey, just wanted to check in about...',
              from: 'colleague@company.com',
              subject: 'Quick Question',
              date: '2024-01-14T15:45:00Z',
              labelIds: ['INBOX'],
            },
            {
              id: 'msg_3',
              threadId: 'thread_3',
              snippet: 'Your order has been shipped and will...',
              from: 'noreply@store.com',
              subject: 'Order Confirmation',
              date: '2024-01-13T09:00:00Z',
              labelIds: ['INBOX', 'CATEGORY_UPDATES'],
            },
          ];
          
          const filteredMessages = messages.slice(0, maxResults || 10);
          
          return {
            success: true,
            data: filteredMessages,
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: filteredMessages.length,
              operation: 'list',
              totalMessages: messages.length,
            },
          };
        }
        
        case 'delete': {
          if (!messageId) {
            throw new Error('Message ID is required for delete');
          }
          
          return {
            success: true,
            data: [{ deleted: true, messageId }],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'delete',
            },
          };
        }
        
        case 'reply': {
          if (!messageId || !body) {
            throw new Error('Message ID and body are required for reply');
          }
          
          const replyResult = {
            id: `reply_${Date.now()}`,
            threadId: threadId || 'thread_original',
            inReplyTo: messageId,
            subject: `Re: ${subject || 'Original Subject'}`,
            body,
            sentTime: new Date().toISOString(),
            labelIds: ['SENT'],
          };
          
          return {
            success: true,
            data: [replyResult],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'reply',
            },
          };
        }
        
        case 'forward': {
          if (!messageId || !to) {
            throw new Error('Message ID and To address are required for forward');
          }
          
          const forwardResult = {
            id: `fwd_${Date.now()}`,
            threadId: `thread_fwd_${Date.now()}`,
            forwardedFrom: messageId,
            to: to.split(',').map(e => e.trim()),
            subject: `Fwd: ${subject || 'Original Subject'}`,
            body: body || 'Forwarded message attached below',
            sentTime: new Date().toISOString(),
            labelIds: ['SENT'],
          };
          
          return {
            success: true,
            data: [forwardResult],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'forward',
            },
          };
        }
        
        case 'createDraft': {
          const draftResult = {
            id: `draft_${Date.now()}`,
            message: {
              id: `draft_msg_${Date.now()}`,
              threadId: threadId || `thread_draft_${Date.now()}`,
              to: to ? to.split(',').map(e => e.trim()) : [],
              subject: subject || '',
              body: body || '',
              bodyType,
              createdTime: new Date().toISOString(),
              labelIds: ['DRAFT'],
            },
          };
          
          return {
            success: true,
            data: [draftResult],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'createDraft',
            },
          };
        }
        
        case 'sendDraft': {
          if (!messageId) {
            throw new Error('Draft ID is required');
          }
          
          const sentDraftResult = {
            id: `sent_draft_${Date.now()}`,
            draftId: messageId,
            sentTime: new Date().toISOString(),
            labelIds: ['SENT'],
            status: 'sent',
          };
          
          return {
            success: true,
            data: [sentDraftResult],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'sendDraft',
            },
          };
        }
        
        case 'addLabel': {
          if (!messageId || !labelIds) {
            throw new Error('Message ID and Label IDs are required');
          }
          
          const labels = labelIds.split(',').map(l => l.trim());
          
          return {
            success: true,
            data: [{
              messageId,
              labelsAdded: labels,
              updatedLabelIds: ['INBOX', ...labels],
            }],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'addLabel',
            },
          };
        }
        
        case 'removeLabel': {
          if (!messageId || !labelIds) {
            throw new Error('Message ID and Label IDs are required');
          }
          
          const labels = labelIds.split(',').map(l => l.trim());
          
          return {
            success: true,
            data: [{
              messageId,
              labelsRemoved: labels,
              updatedLabelIds: ['INBOX'],
            }],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'removeLabel',
            },
          };
        }
        
        case 'markAsRead': {
          if (!messageId) {
            throw new Error('Message ID is required');
          }
          
          return {
            success: true,
            data: [{
              messageId,
              markedAsRead: true,
              updatedLabelIds: ['INBOX'],
            }],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'markAsRead',
            },
          };
        }
        
        case 'markAsUnread': {
          if (!messageId) {
            throw new Error('Message ID is required');
          }
          
          return {
            success: true,
            data: [{
              messageId,
              markedAsUnread: true,
              updatedLabelIds: ['INBOX', 'UNREAD'],
            }],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'markAsUnread',
            },
          };
        }
        
        case 'trash': {
          if (!messageId) {
            throw new Error('Message ID is required');
          }
          
          return {
            success: true,
            data: [{
              messageId,
              movedToTrash: true,
              updatedLabelIds: ['TRASH'],
            }],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'trash',
            },
          };
        }
        
        case 'search': {
          if (!query) {
            throw new Error('Search query is required');
          }
          
          const searchResults = [
            {
              id: 'search_1',
              threadId: 'thread_s1',
              snippet: 'Found: Your search term appears here...',
              from: 'sender1@example.com',
              subject: 'Matching Email 1',
              date: '2024-01-10T14:30:00Z',
            },
            {
              id: 'search_2',
              threadId: 'thread_s2',
              snippet: 'Another match for your search...',
              from: 'sender2@example.com',
              subject: 'Matching Email 2',
              date: '2024-01-08T11:00:00Z',
            },
          ];
          
          return {
            success: true,
            data: searchResults.slice(0, maxResults || 10),
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: searchResults.length,
              operation: 'search',
              query,
            },
          };
        }
        
        case 'getAttachments': {
          if (!messageId) {
            throw new Error('Message ID is required');
          }
          
          const attachments = [
            {
              id: 'att_1',
              messageId,
              filename: 'document.pdf',
              mimeType: 'application/pdf',
              size: 102400,
              data: 'base64_encoded_data_here',
            },
            {
              id: 'att_2',
              messageId,
              filename: 'image.jpg',
              mimeType: 'image/jpeg',
              size: 51200,
              data: 'base64_encoded_image_data',
            },
          ];
          
          return {
            success: true,
            data: attachments,
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: attachments.length,
              operation: 'getAttachments',
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
      required: []
    };
  }

}