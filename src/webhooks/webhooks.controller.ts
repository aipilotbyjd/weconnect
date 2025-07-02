import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req, Headers, All } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { WebhooksService } from './webhooks.service';
import { Webhook } from '../core/infrastructure/database/entities/webhook.entity';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

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
  @ApiOperation({ summary: 'Trigger webhook by path' })
  @ApiResponse({ status: 200, description: 'Webhook triggered successfully' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  @ApiResponse({ status: 400, description: 'Method not allowed or workflow inactive' })
  triggerWebhook(
    @Param('path') path: string,
    @Headers() headers: any,
    @Body() body: any,
    @Req() req: any,
  ): Promise<any> {
    return this.webhooksService.triggerWebhook(path, req.method, headers, body);
  }
}
