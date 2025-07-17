import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import {
  INodeExecutor,
  NodeExecutionContext,
  NodeExecutionResult,
} from '../../../../../core/abstracts/base-node.interface';

export const WhatsAppNodeDefinition = new NodeDefinition({
  name: 'WhatsApp',
  displayName: 'WhatsApp',
  description: 'Send messages and interact with WhatsApp Business API',
  version: 1,
  group: ['communication'],
  icon: 'fa:whatsapp',
  defaults: {
    name: 'WhatsApp',
    color: '#25D366',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'whatsappApi',
      required: true,
    },
  ],
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'options',
      options: [
        { name: 'Send Text Message', value: 'sendText' },
        { name: 'Send Media Message', value: 'sendMedia' },
        { name: 'Send Template Message', value: 'sendTemplate' },
        { name: 'Send Location', value: 'sendLocation' },
        { name: 'Send Contact', value: 'sendContact' },
        { name: 'Get Message Status', value: 'getStatus' },
        { name: 'Mark as Read', value: 'markRead' },
      ],
      default: 'sendText',
      required: true,
    },
    {
      name: 'phoneNumber',
      displayName: 'Phone Number',
      type: 'string',
      required: true,
      placeholder: '+1234567890',
      description: 'Recipient phone number in international format',
    },
    {
      name: 'message',
      displayName: 'Message',
      type: 'string',
      required: true,
      placeholder: 'Hello from WeConnect!',
      description: 'Text message to send',
      displayOptions: {
        show: {
          operation: ['sendText'],
        },
      },
    },
    {
      name: 'mediaType',
      displayName: 'Media Type',
      type: 'options',
      options: [
        { name: 'Image', value: 'image' },
        { name: 'Video', value: 'video' },
        { name: 'Audio', value: 'audio' },
        { name: 'Document', value: 'document' },
        { name: 'Sticker', value: 'sticker' },
      ],
      default: 'image',
      displayOptions: {
        show: {
          operation: ['sendMedia'],
        },
      },
    },
    {
      name: 'mediaUrl',
      displayName: 'Media URL',
      type: 'string',
      placeholder: 'https://example.com/image.jpg',
      description: 'URL of the media file to send',
      displayOptions: {
        show: {
          operation: ['sendMedia'],
        },
      },
    },
    {
      name: 'caption',
      displayName: 'Caption',
      type: 'string',
      placeholder: 'Image caption',
      description: 'Caption for media message',
      displayOptions: {
        show: {
          operation: ['sendMedia'],
        },
      },
    },
    {
      name: 'templateName',
      displayName: 'Template Name',
      type: 'string',
      placeholder: 'hello_world',
      description: 'Name of the approved template',
      displayOptions: {
        show: {
          operation: ['sendTemplate'],
        },
      },
    },
    {
      name: 'templateLanguage',
      displayName: 'Template Language',
      type: 'string',
      default: 'en_US',
      placeholder: 'en_US',
      description: 'Template language code',
      displayOptions: {
        show: {
          operation: ['sendTemplate'],
        },
      },
    },
    {
      name: 'templateParameters',
      displayName: 'Template Parameters',
      type: 'json',
      default: [],
      description: 'Array of template parameter values',
      displayOptions: {
        show: {
          operation: ['sendTemplate'],
        },
      },
    },
    {
      name: 'latitude',
      displayName: 'Latitude',
      type: 'number',
      placeholder: '37.7749',
      description: 'Location latitude',
      displayOptions: {
        show: {
          operation: ['sendLocation'],
        },
      },
    },
    {
      name: 'longitude',
      displayName: 'Longitude',
      type: 'number',
      placeholder: '-122.4194',
      description: 'Location longitude',
      displayOptions: {
        show: {
          operation: ['sendLocation'],
        },
      },
    },
    {
      name: 'locationName',
      displayName: 'Location Name',
      type: 'string',
      placeholder: 'San Francisco',
      description: 'Name of the location',
      displayOptions: {
        show: {
          operation: ['sendLocation'],
        },
      },
    },
    {
      name: 'locationAddress',
      displayName: 'Location Address',
      type: 'string',
      placeholder: 'San Francisco, CA, USA',
      description: 'Address of the location',
      displayOptions: {
        show: {
          operation: ['sendLocation'],
        },
      },
    },
    {
      name: 'contactName',
      displayName: 'Contact Name',
      type: 'string',
      placeholder: 'John Doe',
      description: 'Contact name',
      displayOptions: {
        show: {
          operation: ['sendContact'],
        },
      },
    },
    {
      name: 'contactPhone',
      displayName: 'Contact Phone',
      type: 'string',
      placeholder: '+1234567890',
      description: 'Contact phone number',
      displayOptions: {
        show: {
          operation: ['sendContact'],
        },
      },
    },
    {
      name: 'messageId',
      displayName: 'Message ID',
      type: 'string',
      placeholder: 'wamid.xxx',
      description: 'WhatsApp message ID',
      displayOptions: {
        show: {
          operation: ['getStatus', 'markRead'],
        },
      },
    },
  ],
});

export class WhatsAppNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const {
        operation,
        phoneNumber,
        message,
        mediaType,
        mediaUrl,
        caption,
        templateName,
        templateLanguage,
        templateParameters,
        latitude,
        longitude,
        locationName,
        locationAddress,
        contactName,
        contactPhone,
        messageId,
      } = context.parameters;

      const results: any[] = [];

      for (const item of context.inputData) {
        let result;

        // Use input data to override parameters if available
        const phone = phoneNumber || item.phoneNumber || item.phone;
        const msgText = message || item.message || item.text;

        switch (operation) {
          case 'sendText':
            result = await this.sendTextMessage(phone, msgText);
            break;
          case 'sendMedia':
            result = await this.sendMediaMessage(
              phone,
              mediaType,
              mediaUrl || item.mediaUrl,
              caption || item.caption,
            );
            break;
          case 'sendTemplate':
            result = await this.sendTemplateMessage(
              phone,
              templateName || item.templateName,
              templateLanguage || item.templateLanguage,
              templateParameters || item.templateParameters,
            );
            break;
          case 'sendLocation':
            result = await this.sendLocation(
              phone,
              latitude || item.latitude,
              longitude || item.longitude,
              locationName || item.locationName,
              locationAddress || item.locationAddress,
            );
            break;
          case 'sendContact':
            result = await this.sendContact(
              phone,
              contactName || item.contactName,
              contactPhone || item.contactPhone,
            );
            break;
          case 'getStatus':
            result = await this.getMessageStatus(messageId || item.messageId);
            break;
          case 'markRead':
            result = await this.markAsRead(messageId || item.messageId);
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

  private async sendTextMessage(
    phoneNumber: string,
    message: string,
  ): Promise<any> {
    if (!phoneNumber || !message) {
      throw new Error('Phone number and message are required');
    }

    // Simulate WhatsApp API call
    // In a real implementation, you would use WhatsApp Business API
    const messageId = `wamid.${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const response = {
      messaging_product: 'whatsapp',
      contacts: [
        {
          input: phoneNumber,
          wa_id: phoneNumber.replace(/[^\d]/g, ''),
        },
      ],
      messages: [
        {
          id: messageId,
          message_status: 'accepted',
        },
      ],
    };

    return {
      success: true,
      operation: 'sendText',
      phoneNumber,
      message,
      messageId,
      response,
      sentAt: new Date(),
    };
  }

  private async sendMediaMessage(
    phoneNumber: string,
    mediaType: string,
    mediaUrl: string,
    caption?: string,
  ): Promise<any> {
    if (!phoneNumber || !mediaType || !mediaUrl) {
      throw new Error('Phone number, media type, and media URL are required');
    }

    const messageId = `wamid.${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const response = {
      messaging_product: 'whatsapp',
      contacts: [
        {
          input: phoneNumber,
          wa_id: phoneNumber.replace(/[^\d]/g, ''),
        },
      ],
      messages: [
        {
          id: messageId,
          message_status: 'accepted',
        },
      ],
    };

    return {
      success: true,
      operation: 'sendMedia',
      phoneNumber,
      mediaType,
      mediaUrl,
      caption,
      messageId,
      response,
      sentAt: new Date(),
    };
  }

  private async sendTemplateMessage(
    phoneNumber: string,
    templateName: string,
    language: string = 'en_US',
    parameters: any[] = [],
  ): Promise<any> {
    if (!phoneNumber || !templateName) {
      throw new Error('Phone number and template name are required');
    }

    const messageId = `wamid.${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const response = {
      messaging_product: 'whatsapp',
      contacts: [
        {
          input: phoneNumber,
          wa_id: phoneNumber.replace(/[^\d]/g, ''),
        },
      ],
      messages: [
        {
          id: messageId,
          message_status: 'accepted',
        },
      ],
    };

    return {
      success: true,
      operation: 'sendTemplate',
      phoneNumber,
      templateName,
      language,
      parameters,
      messageId,
      response,
      sentAt: new Date(),
    };
  }

  private async sendLocation(
    phoneNumber: string,
    latitude: number,
    longitude: number,
    name?: string,
    address?: string,
  ): Promise<any> {
    if (!phoneNumber || !latitude || !longitude) {
      throw new Error('Phone number, latitude, and longitude are required');
    }

    const messageId = `wamid.${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const response = {
      messaging_product: 'whatsapp',
      contacts: [
        {
          input: phoneNumber,
          wa_id: phoneNumber.replace(/[^\d]/g, ''),
        },
      ],
      messages: [
        {
          id: messageId,
          message_status: 'accepted',
        },
      ],
    };

    return {
      success: true,
      operation: 'sendLocation',
      phoneNumber,
      location: {
        latitude,
        longitude,
        name,
        address,
      },
      messageId,
      response,
      sentAt: new Date(),
    };
  }

  private async sendContact(
    phoneNumber: string,
    contactName: string,
    contactPhone: string,
  ): Promise<any> {
    if (!phoneNumber || !contactName || !contactPhone) {
      throw new Error(
        'Phone number, contact name, and contact phone are required',
      );
    }

    const messageId = `wamid.${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const response = {
      messaging_product: 'whatsapp',
      contacts: [
        {
          input: phoneNumber,
          wa_id: phoneNumber.replace(/[^\d]/g, ''),
        },
      ],
      messages: [
        {
          id: messageId,
          message_status: 'accepted',
        },
      ],
    };

    return {
      success: true,
      operation: 'sendContact',
      phoneNumber,
      contact: {
        name: contactName,
        phone: contactPhone,
      },
      messageId,
      response,
      sentAt: new Date(),
    };
  }

  private async getMessageStatus(messageId: string): Promise<any> {
    if (!messageId) {
      throw new Error('Message ID is required');
    }

    // Simulate getting message status
    const statusOptions = ['sent', 'delivered', 'read', 'failed'];
    const randomStatus =
      statusOptions[Math.floor(Math.random() * statusOptions.length)];

    return {
      success: true,
      operation: 'getStatus',
      messageId,
      status: randomStatus,
      timestamp: new Date(),
      details: {
        sent_at: new Date(Date.now() - 60000),
        delivered_at:
          randomStatus !== 'sent' ? new Date(Date.now() - 30000) : null,
        read_at: randomStatus === 'read' ? new Date(Date.now() - 10000) : null,
      },
    };
  }

  private async markAsRead(messageId: string): Promise<any> {
    if (!messageId) {
      throw new Error('Message ID is required');
    }

    return {
      success: true,
      operation: 'markRead',
      messageId,
      markedAt: new Date(),
      status: 'read',
    };
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
