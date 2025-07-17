import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import {
  INodeExecutor,
  NodeExecutionContext,
  NodeExecutionResult,
} from '../../../../../core/abstracts/base-node.interface';
import axios, { AxiosInstance } from 'axios';

export const WhatsAppBusinessNodeDefinition = new NodeDefinition({
  name: 'WhatsApp Business',
  displayName: 'WhatsApp Business',
  description: 'Send messages via WhatsApp Business API',
  version: 1,
  group: ['communication', 'integrations'],
  icon: 'simple-icons:whatsapp',
  defaults: {
    name: 'WhatsApp Business',
    color: '#25D366',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'whatsappBusiness',
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
        { name: 'Send Template Message', value: 'sendTemplate' },
        { name: 'Send Media Message', value: 'sendMedia' },
        { name: 'Send Location', value: 'sendLocation' },
        { name: 'Send Contact', value: 'sendContact' },
        { name: 'Mark as Read', value: 'markAsRead' },
        { name: 'Get Media', value: 'getMedia' },
        { name: 'Get Profile', value: 'getProfile' },
      ],
      default: 'sendText',
      required: true,
    },
    {
      name: 'to',
      displayName: 'To (Phone Number)',
      type: 'string',
      displayOptions: {
        show: {
          operation: [
            'sendText',
            'sendTemplate',
            'sendMedia',
            'sendLocation',
            'sendContact',
          ],
        },
      },
      required: true,
      placeholder: '1234567890',
      description: 'Recipient phone number (without + prefix)',
    },
    {
      name: 'text',
      displayName: 'Message Text',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['sendText'],
        },
      },
      required: true,
      placeholder: 'Hello from WhatsApp Business!',
      description: 'Text message to send',
    },
    {
      name: 'previewUrl',
      displayName: 'Preview URL',
      type: 'boolean',
      default: false,
      displayOptions: {
        show: {
          operation: ['sendText'],
        },
      },
      description: 'Enable URL preview in message',
    },
    {
      name: 'templateName',
      displayName: 'Template Name',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['sendTemplate'],
        },
      },
      required: true,
      description: 'Name of the approved message template',
    },
    {
      name: 'templateLanguage',
      displayName: 'Template Language',
      type: 'string',
      default: 'en',
      displayOptions: {
        show: {
          operation: ['sendTemplate'],
        },
      },
      description: 'Language code for the template',
    },
    {
      name: 'templateParameters',
      displayName: 'Template Parameters',
      type: 'json',
      default: [],
      displayOptions: {
        show: {
          operation: ['sendTemplate'],
        },
      },
      description: 'Array of parameters for template variables',
    },
    {
      name: 'mediaType',
      displayName: 'Media Type',
      type: 'options',
      options: [
        { name: 'Image', value: 'image' },
        { name: 'Document', value: 'document' },
        { name: 'Audio', value: 'audio' },
        { name: 'Video', value: 'video' },
        { name: 'Sticker', value: 'sticker' },
      ],
      displayOptions: {
        show: {
          operation: ['sendMedia'],
        },
      },
      required: true,
      description: 'Type of media to send',
    },
    {
      name: 'mediaUrl',
      displayName: 'Media URL',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['sendMedia'],
        },
      },
      required: true,
      placeholder: 'https://example.com/image.jpg',
      description: 'URL of the media file',
    },
    {
      name: 'mediaCaption',
      displayName: 'Media Caption',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['sendMedia'],
        },
      },
      description: 'Caption for the media file',
    },
    {
      name: 'mediaFilename',
      displayName: 'Media Filename',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['sendMedia'],
        },
      },
      description: 'Filename for document media',
    },
    {
      name: 'latitude',
      displayName: 'Latitude',
      type: 'number',
      displayOptions: {
        show: {
          operation: ['sendLocation'],
        },
      },
      required: true,
      description: 'Latitude of the location',
    },
    {
      name: 'longitude',
      displayName: 'Longitude',
      type: 'number',
      displayOptions: {
        show: {
          operation: ['sendLocation'],
        },
      },
      required: true,
      description: 'Longitude of the location',
    },
    {
      name: 'locationName',
      displayName: 'Location Name',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['sendLocation'],
        },
      },
      description: 'Name of the location',
    },
    {
      name: 'locationAddress',
      displayName: 'Location Address',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['sendLocation'],
        },
      },
      description: 'Address of the location',
    },
    {
      name: 'contactName',
      displayName: 'Contact Name',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['sendContact'],
        },
      },
      required: true,
      description: 'Full name of the contact',
    },
    {
      name: 'contactPhone',
      displayName: 'Contact Phone',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['sendContact'],
        },
      },
      required: true,
      description: 'Phone number of the contact',
    },
    {
      name: 'messageId',
      displayName: 'Message ID',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['markAsRead'],
        },
      },
      required: true,
      description: 'ID of the message to mark as read',
    },
    {
      name: 'mediaId',
      displayName: 'Media ID',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['getMedia'],
        },
      },
      required: true,
      description: 'ID of the media to retrieve',
    },
    {
      name: 'profilePhone',
      displayName: 'Profile Phone Number',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['getProfile'],
        },
      },
      required: true,
      description: 'Phone number to get profile for',
    },
  ],
});

export class WhatsAppBusinessNodeExecutor implements INodeExecutor {
  private client: AxiosInstance | null = null;

  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    const credentials = context.credentials?.whatsappBusiness;

    if (!credentials) {
      return {
        success: false,
        error: 'WhatsApp Business credentials not configured',
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }

    try {
      // Initialize WhatsApp Business API client
      this.client = axios.create({
        baseURL: `https://graph.facebook.com/v18.0/${credentials.phoneNumberId}`,
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      const { operation } = context.parameters;
      let result: any;

      switch (operation) {
        case 'sendText':
          result = await this.sendTextMessage(context);
          break;
        case 'sendTemplate':
          result = await this.sendTemplateMessage(context);
          break;
        case 'sendMedia':
          result = await this.sendMediaMessage(context);
          break;
        case 'sendLocation':
          result = await this.sendLocation(context);
          break;
        case 'sendContact':
          result = await this.sendContact(context);
          break;
        case 'markAsRead':
          result = await this.markAsRead(context);
          break;
        case 'getMedia':
          result = await this.getMedia(context);
          break;
        case 'getProfile':
          result = await this.getProfile(context);
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      return {
        success: true,
        data: result,
        metadata: {
          executionTime: Date.now() - startTime,
          operation,
          recipient: context.parameters.to,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  private async sendTextMessage(context: NodeExecutionContext): Promise<any> {
    const { to, text, previewUrl } = context.parameters;

    const payload = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: {
        body: text,
        preview_url: previewUrl || false,
      },
    };

    const response = await this.client!.post('/messages', payload);
    return response.data;
  }

  private async sendTemplateMessage(
    context: NodeExecutionContext,
  ): Promise<any> {
    const { to, templateName, templateLanguage, templateParameters } =
      context.parameters;

    const payload: any = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: templateLanguage || 'en',
        },
      },
    };

    if (templateParameters && templateParameters.length > 0) {
      payload.template.components = [
        {
          type: 'body',
          parameters: templateParameters.map((param: any) => ({
            type: 'text',
            text: param,
          })),
        },
      ];
    }

    const response = await this.client!.post('/messages', payload);
    return response.data;
  }

  private async sendMediaMessage(context: NodeExecutionContext): Promise<any> {
    const { to, mediaType, mediaUrl, mediaCaption, mediaFilename } =
      context.parameters;

    const mediaObject: any = {
      link: mediaUrl,
    };

    if (mediaCaption && ['image', 'video', 'document'].includes(mediaType)) {
      mediaObject.caption = mediaCaption;
    }

    if (mediaFilename && mediaType === 'document') {
      mediaObject.filename = mediaFilename;
    }

    const payload = {
      messaging_product: 'whatsapp',
      to: to,
      type: mediaType,
      [mediaType]: mediaObject,
    };

    const response = await this.client!.post('/messages', payload);
    return response.data;
  }

  private async sendLocation(context: NodeExecutionContext): Promise<any> {
    const { to, latitude, longitude, locationName, locationAddress } =
      context.parameters;

    const location: any = {
      latitude: latitude,
      longitude: longitude,
    };

    if (locationName) location.name = locationName;
    if (locationAddress) location.address = locationAddress;

    const payload = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'location',
      location: location,
    };

    const response = await this.client!.post('/messages', payload);
    return response.data;
  }

  private async sendContact(context: NodeExecutionContext): Promise<any> {
    const { to, contactName, contactPhone } = context.parameters;

    const payload = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'contacts',
      contacts: [
        {
          name: {
            formatted_name: contactName,
          },
          phones: [
            {
              phone: contactPhone,
              type: 'MOBILE',
            },
          ],
        },
      ],
    };

    const response = await this.client!.post('/messages', payload);
    return response.data;
  }

  private async markAsRead(context: NodeExecutionContext): Promise<any> {
    const { messageId } = context.parameters;

    const payload = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    };

    const response = await this.client!.post('/messages', payload);
    return response.data;
  }

  private async getMedia(context: NodeExecutionContext): Promise<any> {
    const { mediaId } = context.parameters;

    // Get media URL
    const mediaClient = axios.create({
      baseURL: 'https://graph.facebook.com/v18.0',
      headers: {
        Authorization: this.client!.defaults.headers['Authorization'],
      },
    });

    const response = await mediaClient.get(`/${mediaId}`);
    return response.data;
  }

  private async getProfile(context: NodeExecutionContext): Promise<any> {
    const { profilePhone } = context.parameters;

    const response = await this.client!.get(`/${profilePhone}`);
    return response.data;
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
