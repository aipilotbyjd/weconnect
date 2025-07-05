import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req, Headers, All, UseFilters, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';
import { WebhooksService } from '../../application/services/webhooks.service';
import { Webhook } from '../../domain/entities/webhook.entity';
import { CreateWebhookDto } from '../dto/create-webhook.dto';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) { }

  @Post('workflows/:workflowId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create webhook for workflow' })
  @ApiResponse({ status: 201, description: 'Webhook created successfully', type: Webhook })
  createWebhook(
    @Param('workflowId') workflowId: string,
    @Body() body: { name: string },
    @Req() req: any,
  ): Promise<Webhook> {
    return this.webhooksService.createWebhook(workflowId, body.name, req.user.id);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get all webhooks for current user' })
  @ApiResponse({ status: 200, description: 'Webhooks retrieved successfully', type: [Webhook] })
  findAll(@Req() req: any): Promise<Webhook[]> {
    return this.webhooksService.findAll(req.user.id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Delete webhook' })
  @ApiResponse({ status: 200, description: 'Webhook deleted successfully' })
  deleteWebhook(@Param('id') id: string, @Req() req: any): Promise<void> {
    return this.webhooksService.deleteWebhook(id, req.user.id);
  }

  @All(':path')
  @UseGuards(ThrottlerGuard) // Rate limiting
  @ApiOperation({ summary: 'Trigger webhook by path' })
  @ApiResponse({ status: 200, description: 'Webhook triggered successfully' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  @ApiResponse({ status: 400, description: 'Method not allowed or workflow inactive' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async triggerWebhook(
    @Param('path') path: string,
    @Headers() headers: any,
    @Body() body: any,
    @Req() req: any,
  ): Promise<any> {
    // Validate webhook path format
    if (!this.isValidWebhookPath(path)) {
      throw new Error('Invalid webhook path format');
    }

    // Validate request size
    const contentLength = parseInt(headers['content-length'] || '0');
    if (contentLength > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('Request payload too large');
    }

    const enrichedBody = {
      ...body,
      _webhook: {
        ip: req.ip || req.connection?.remoteAddress || 'unknown',
        userAgent: headers['user-agent'],
        timestamp: new Date(),
      },
    };

    return this.webhooksService.triggerWebhook(
      path,
      req.method,
      this.sanitizeHeaders(headers),
      enrichedBody
    );
  }

  private isValidWebhookPath(path: string): boolean {
    // Only allow alphanumeric, hyphens, and underscores
    return /^[a-zA-Z0-9-_]+$/.test(path) && path.length >= 8 && path.length <= 64;
  }

  private sanitizeHeaders(headers: any): Record<string, string> {
    const allowedHeaders = ['content-type', 'user-agent', 'x-webhook-signature', 'x-webhook-signature-256'];
    const sanitized: Record<string, string> = {};

    for (const key of allowedHeaders) {
      if (headers[key]) {
        sanitized[key] = String(headers[key]).substring(0, 1000); // Limit header length
      }
    }

    return sanitized;
  }
}
