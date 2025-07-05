import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MetricsService } from '../../application/services/metrics.service';

@ApiTags('monitoring')
@Controller('monitoring')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class MonitoringController {
  constructor(
    private readonly metricsService: MetricsService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboardStats(@Query('userId') userId?: string) {
    return this.metricsService.getDashboardStats(userId);
  }
}
