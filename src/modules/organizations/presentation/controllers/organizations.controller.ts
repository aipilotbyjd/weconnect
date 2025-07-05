import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { OrganizationsService } from '../../application/services/organizations.service';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';
import { InviteMemberDto } from '../dto/invite-member.dto';
import { UpdateMemberRoleDto } from '../dto/update-member-role.dto';
import { RequestWithUser } from '../../../auth/domain/interfaces/request-with-user.interface';

@ApiTags('Organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  async create(
    @Req() req: RequestWithUser,
    @Body() createOrganizationDto: CreateOrganizationDto,
  ) {
    const userId = req.user.id;
    return this.organizationsService.create(userId, createOrganizationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all organizations for the current user' })
  async findAll(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    return this.organizationsService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific organization' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  async findOne(@Req() req: RequestWithUser, @Param('id') id: string) {
    const userId = req.user.id;
    return this.organizationsService.findOne(id, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an organization' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  async update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    const userId = req.user.id;
    return this.organizationsService.update(id, userId, updateOrganizationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an organization' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  async remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    const userId = req.user.id;
    await this.organizationsService.delete(id, userId);
    return { success: true };
  }

  @Post(':id/switch')
  @ApiOperation({ summary: 'Switch to a different organization' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  async switchOrganization(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    const userId = req.user.id;
    await this.organizationsService.switchOrganization(id, userId);
    return { success: true };
  }

  // Member management endpoints
  @Post(':id/members/invite')
  @ApiOperation({ summary: 'Invite a member to the organization' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  async inviteMember(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() inviteMemberDto: InviteMemberDto,
  ) {
    const userId = req.user.id;
    return this.organizationsService.inviteMember(id, userId, inviteMemberDto);
  }

  @Post('invites/accept')
  @ApiOperation({ summary: 'Accept an organization invitation' })
  async acceptInvite(
    @Req() req: RequestWithUser,
    @Query('token') token: string,
  ) {
    const userId = req.user.id;
    await this.organizationsService.acceptInvite(token, userId);
    return { success: true };
  }

  @Put(':id/members/:memberId/role')
  @ApiOperation({ summary: 'Update member role' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  async updateMemberRole(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    const userId = req.user.id;
    return this.organizationsService.updateMemberRole(
      id,
      memberId,
      userId,
      updateMemberRoleDto,
    );
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove a member from the organization' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  async removeMember(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    const userId = req.user.id;
    await this.organizationsService.removeMember(id, memberId, userId);
    return { success: true };
  }

  @Post(':id/transfer-ownership')
  @ApiOperation({ summary: 'Transfer organization ownership' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  async transferOwnership(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: { newOwnerId: string },
  ) {
    const userId = req.user.id;
    await this.organizationsService.transferOwnership(
      id,
      body.newOwnerId,
      userId,
    );
    return { success: true };
  }
}
