import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../../../../core/abstracts/base-node.interface';

export const PaymentProcessingNodeDefinition = new NodeDefinition({
  name: 'PaymentProcessing',
  displayName: 'Payment Processing',
  description: 'Process payments through various payment gateways',
  version: 1,
  group: ['payments'],
  icon: 'fa:credit-card',
  defaults: {
    name: 'Payment Processing',
    color: '#27ae60',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'paymentCredentials',
      required: true,
    },
  ],
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'options',
      options: [
        { name: 'Create Payment', value: 'createPayment' },
        { name: 'Capture Payment', value: 'capturePayment' },
        { name: 'Refund Payment', value: 'refundPayment' },
        { name: 'Get Payment Status', value: 'getPaymentStatus' },
        { name: 'Create Customer', value: 'createCustomer' },
        { name: 'Update Customer', value: 'updateCustomer' },
        { name: 'Get Customer', value: 'getCustomer' },
      ],
      default: 'createPayment',
      required: true,
    },
    {
      name: 'amount',
      displayName: 'Amount',
      type: 'number',
      required: true,
      placeholder: '100.00',
      description: 'Payment amount in the smallest currency unit (e.g., cents for USD)',
      displayOptions: {
        show: {
          operation: ['createPayment', 'refundPayment'],
        },
      },
    },
    {
      name: 'currency',
      displayName: 'Currency',
      type: 'string',
      default: 'USD',
      required: true,
      placeholder: 'USD',
      displayOptions: {
        show: {
          operation: ['createPayment', 'refundPayment'],
        },
      },
    },
    {
      name: 'description',
      displayName: 'Description',
      type: 'string',
      placeholder: 'Payment for order #123',
      displayOptions: {
        show: {
          operation: ['createPayment', 'refundPayment'],
        },
      },
    },
    {
      name: 'paymentMethodId',
      displayName: 'Payment Method ID',
      type: 'string',
      placeholder: 'pm_1234567890',
      description: 'Payment method ID (card, bank account, etc.)',
      displayOptions: {
        show: {
          operation: ['createPayment'],
        },
      },
    },
    {
      name: 'customerId',
      displayName: 'Customer ID',
      type: 'string',
      placeholder: 'cus_1234567890',
      displayOptions: {
        show: {
          operation: ['createPayment', 'updateCustomer', 'getCustomer'],
        },
      },
    },
    {
      name: 'paymentIntentId',
      displayName: 'Payment Intent ID',
      type: 'string',
      required: true,
      placeholder: 'pi_1234567890',
      displayOptions: {
        show: {
          operation: ['capturePayment', 'getPaymentStatus'],
        },
      },
    },
    {
      name: 'refundAmount',
      displayName: 'Refund Amount',
      type: 'number',
      placeholder: '50.00',
      description: 'Partial refund amount (leave empty for full refund)',
      displayOptions: {
        show: {
          operation: ['refundPayment'],
        },
      },
    },
    {
      name: 'customerEmail',
      displayName: 'Customer Email',
      type: 'string',
      required: true,
      placeholder: 'customer@example.com',
      displayOptions: {
        show: {
          operation: ['createCustomer', 'updateCustomer'],
        },
      },
    },
    {
      name: 'customerName',
      displayName: 'Customer Name',
      type: 'string',
      placeholder: 'John Doe',
      displayOptions: {
        show: {
          operation: ['createCustomer', 'updateCustomer'],
        },
      },
    },
    {
      name: 'customerPhone',
      displayName: 'Customer Phone',
      type: 'string',
      placeholder: '+1234567890',
      displayOptions: {
        show: {
          operation: ['createCustomer', 'updateCustomer'],
        },
      },
    },
    {
      name: 'billingAddress',
      displayName: 'Billing Address',
      type: 'json',
      default: {},
      description: 'Customer billing address',
      displayOptions: {
        show: {
          operation: ['createCustomer', 'updateCustomer'],
        },
      },
    },
    {
      name: 'metadata',
      displayName: 'Metadata',
      type: 'json',
      default: {},
      description: 'Additional metadata for the payment or customer',
    },
    {
      name: 'confirmPayment',
      displayName: 'Auto Confirm Payment',
      type: 'boolean',
      default: true,
      description: 'Automatically confirm the payment intent',
      displayOptions: {
        show: {
          operation: ['createPayment'],
        },
      },
    },
  ],
});

export class PaymentProcessingNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      const { operation } = context.parameters;
      const credentials = context.credentials?.paymentCredentials;
      
      if (!credentials) {
        throw new Error('Payment gateway credentials are required');
      }

      let result: any;

      switch (operation) {
        case 'createPayment':
          result = await this.createPayment(context, credentials);
          break;
        case 'capturePayment':
          result = await this.capturePayment(context, credentials);
          break;
        case 'refundPayment':
          result = await this.refundPayment(context, credentials);
          break;
        case 'getPaymentStatus':
          result = await this.getPaymentStatus(context, credentials);
          break;
        case 'createCustomer':
          result = await this.createCustomer(context, credentials);
          break;
        case 'updateCustomer':
          result = await this.updateCustomer(context, credentials);
          break;
        case 'getCustomer':
          result = await this.getCustomer(context, credentials);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      return {
        success: true,
        data: [result],
        metadata: {
          executionTime: Date.now() - startTime,
          operation,
          provider: credentials.provider,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: {
          executionTime: Date.now() - startTime,
          operation: context.parameters.operation,
        },
      };
    }
  }

  private async createPayment(context: NodeExecutionContext, credentials: any) {
    const { amount, currency, description, paymentMethodId, customerId, metadata, confirmPayment } = context.parameters;
    
    // This is a mock implementation
    // In a real scenario, you would integrate with actual payment providers
    switch (credentials.provider) {
      case 'stripe':
        return await this.createStripePayment({ amount, currency, description, paymentMethodId, customerId, metadata, confirmPayment }, credentials);
      case 'paypal':
        return await this.createPayPalPayment({ amount, currency, description }, credentials);
      case 'square':
        return await this.createSquarePayment({ amount, currency, description }, credentials);
      case 'razorpay':
        return await this.createRazorpayPayment({ amount, currency, description }, credentials);
      default:
        throw new Error(`Unsupported payment provider: ${credentials.provider}`);
    }
  }

  private async capturePayment(context: NodeExecutionContext, credentials: any) {
    const { paymentIntentId } = context.parameters;
    
    // Mock implementation
    return {
      id: paymentIntentId,
      status: 'succeeded',
      captured: true,
      capturedAt: new Date().toISOString(),
      provider: credentials.provider,
    };
  }

  private async refundPayment(context: NodeExecutionContext, credentials: any) {
    const { paymentIntentId, refundAmount, description } = context.parameters;
    
    // Mock implementation
    return {
      id: `re_${Date.now()}`,
      paymentIntentId,
      amount: refundAmount,
      status: 'succeeded',
      reason: description || 'requested_by_customer',
      refundedAt: new Date().toISOString(),
      provider: credentials.provider,
    };
  }

  private async getPaymentStatus(context: NodeExecutionContext, credentials: any) {
    const { paymentIntentId } = context.parameters;
    
    // Mock implementation
    return {
      id: paymentIntentId,
      status: 'succeeded',
      amount: 1000,
      currency: 'usd',
      created: Date.now(),
      provider: credentials.provider,
    };
  }

  private async createCustomer(context: NodeExecutionContext, credentials: any) {
    const { customerEmail, customerName, customerPhone, billingAddress, metadata } = context.parameters;
    
    // Mock implementation
    return {
      id: `cus_${Date.now()}`,
      email: customerEmail,
      name: customerName,
      phone: customerPhone,
      billingAddress,
      metadata,
      created: Date.now(),
      provider: credentials.provider,
    };
  }

  private async updateCustomer(context: NodeExecutionContext, credentials: any) {
    const { customerId, customerEmail, customerName, customerPhone, billingAddress, metadata } = context.parameters;
    
    // Mock implementation
    return {
      id: customerId,
      email: customerEmail,
      name: customerName,
      phone: customerPhone,
      billingAddress,
      metadata,
      updated: Date.now(),
      provider: credentials.provider,
    };
  }

  private async getCustomer(context: NodeExecutionContext, credentials: any) {
    const { customerId } = context.parameters;
    
    // Mock implementation
    return {
      id: customerId,
      email: 'customer@example.com',
      name: 'John Doe',
      created: Date.now() - 86400000, // 1 day ago
      provider: credentials.provider,
    };
  }

  // Provider-specific implementations (mock)
  private async createStripePayment(params: any, credentials: any) {
    // In a real implementation, you would use the Stripe SDK
    return {
      id: `pi_${Date.now()}`,
      status: params.confirmPayment ? 'succeeded' : 'requires_confirmation',
      amount: params.amount,
      currency: params.currency,
      description: params.description,
      paymentMethod: params.paymentMethodId,
      customer: params.customerId,
      metadata: params.metadata,
      created: Date.now(),
      provider: 'stripe',
    };
  }

  private async createPayPalPayment(params: any, credentials: any) {
    return {
      id: `PAY-${Date.now()}`,
      status: 'created',
      amount: params.amount,
      currency: params.currency,
      description: params.description,
      created: Date.now(),
      provider: 'paypal',
    };
  }

  private async createSquarePayment(params: any, credentials: any) {
    return {
      id: `sq_${Date.now()}`,
      status: 'COMPLETED',
      amount: params.amount,
      currency: params.currency,
      description: params.description,
      created: Date.now(),
      provider: 'square',
    };
  }

  private async createRazorpayPayment(params: any, credentials: any) {
    return {
      id: `pay_${Date.now()}`,
      status: 'created',
      amount: params.amount,
      currency: params.currency,
      description: params.description,
      created: Date.now(),
      provider: 'razorpay',
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
      required: []
    };
  }

}