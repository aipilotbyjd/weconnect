import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Organization, OrganizationPlan, PlanLimits } from '../../domain/entities/organization.entity';
import { OrganizationMember, OrganizationRole, RolePermissions } from '../../domain/entities/organization-member.entity';
import { User } from '../../../auth/domain/entities/user.entity';
import { CreateOrganizationDto } from '../../presentation/dto/create-organization.dto';
import { UpdateOrganizationDto } from '../../presentation/dto/update-organization.dto';
import { InviteMemberDto } from '../../presentation/dto/invite-member.dto';
import { UpdateMemberRoleDto } from '../../presentation/dto/update-member-role.dto';
import * as crypto from 'crypto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async create(userId: string, dto: CreateOrganizationDto): Promise<Organization> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if user already owns an organization on free plan
      const existingOrgs = await this.memberRepository.find({
        where: { userId, role: OrganizationRole.OWNER },
        relations: ['organization'],
      });

      const freeOrgs = existingOrgs.filter(
        (m) => m.organization.plan === OrganizationPlan.FREE,
      );

      if (freeOrgs.length > 0 && dto.plan === OrganizationPlan.FREE) {
        throw new BadRequestException(
          'You can only have one free organization. Please upgrade to create more.',
        );
      }

      // Generate unique slug
      let slug = this.generateSlug(dto.name);
      let suffix = 0;
      while (await this.organizationRepository.findOne({ where: { slug } })) {
        suffix++;
        slug = `${this.generateSlug(dto.name)}-${suffix}`;
      }

      // Create organization
      const organization = this.organizationRepository.create({
        ...dto,
        slug,
        plan: dto.plan || OrganizationPlan.FREE,
        currentMonthExecutions: 0,
        executionResetDate: this.getNextMonthResetDate(),
      });

      const savedOrg = await queryRunner.manager.save(organization);

      // Add creator as owner
      const member = this.memberRepository.create({
        organization: savedOrg,
        organizationId: savedOrg.id,
        userId,
        role: OrganizationRole.OWNER,
        inviteAccepted: true,
        acceptedAt: new Date(),
      });

      await queryRunner.manager.save(member);

      // Update user's current organization
      await queryRunner.manager.update(User, userId, {
        currentOrganizationId: savedOrg.id,
      });

      await queryRunner.commitTransaction();
      return savedOrg;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(userId: string): Promise<Organization[]> {
    const memberships = await this.memberRepository.find({
      where: { userId, isActive: true },
      relations: ['organization'],
    });

    return memberships.map((m) => m.organization);
  }

  async findOne(id: string, userId: string): Promise<Organization> {
    const member = await this.memberRepository.findOne({
      where: { organizationId: id, userId },
      relations: ['organization'],
    });

    if (!member) {
      throw new NotFoundException('Organization not found');
    }

    return member.organization;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateOrganizationDto,
  ): Promise<Organization> {
    const member = await this.checkPermission(
      id,
      userId,
      'canManageOrganization',
    );

    const organization = member.organization;

    // Check if changing slug
    if (dto.slug && dto.slug !== organization.slug) {
      const existing = await this.organizationRepository.findOne({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new ConflictException('Slug already taken');
      }
    }

    Object.assign(organization, dto);
    return this.organizationRepository.save(organization);
  }

  async delete(id: string, userId: string): Promise<void> {
    const member = await this.checkPermission(
      id,
      userId,
      'canManageOrganization',
    );

    if (member.role !== OrganizationRole.OWNER) {
      throw new ForbiddenException('Only owners can delete organizations');
    }

    await this.organizationRepository.remove(member.organization);
  }

  async inviteMember(
    organizationId: string,
    userId: string,
    dto: InviteMemberDto,
  ): Promise<OrganizationMember> {
    await this.checkPermission(organizationId, userId, 'canInviteMembers');

    // Check if user exists
    const invitedUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!invitedUser) {
      throw new NotFoundException('User not found');
    }

    // Check if already a member
    const existingMember = await this.memberRepository.findOne({
      where: {
        organizationId,
        userId: invitedUser.id,
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member');
    }

    // Check member limit
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const memberCount = await this.memberRepository.count({
      where: { organizationId },
    });

    if (!organization.isWithinLimit('maxTeamMembers', memberCount + 1)) {
      throw new BadRequestException(
        'Team member limit reached. Please upgrade your plan.',
      );
    }

    // Create invitation
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const member = this.memberRepository.create({
      organizationId,
      userId: invitedUser.id,
      role: dto.role || OrganizationRole.MEMBER,
      invitedBy: userId,
      inviteToken,
      inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return this.memberRepository.save(member);
  }

  async acceptInvite(inviteToken: string, userId: string): Promise<void> {
    const member = await this.memberRepository.findOne({
      where: { inviteToken, userId },
    });

    if (!member) {
      throw new NotFoundException('Invalid invitation');
    }

    if (member.inviteExpiresAt && member.inviteExpiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    member.inviteAccepted = true;
    member.acceptedAt = new Date();
    member.inviteToken = undefined;
    member.inviteExpiresAt = undefined;

    await this.memberRepository.save(member);
  }

  async updateMemberRole(
    organizationId: string,
    memberId: string,
    userId: string,
    dto: UpdateMemberRoleDto,
  ): Promise<OrganizationMember> {
    await this.checkPermission(organizationId, userId, 'canManageRoles');

    const member = await this.memberRepository.findOne({
      where: { id: memberId, organizationId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Cannot change owner role
    if (member.role === OrganizationRole.OWNER) {
      throw new BadRequestException('Cannot change owner role');
    }

    // Cannot set someone else as owner
    if (dto.role === OrganizationRole.OWNER) {
      throw new BadRequestException(
        'Cannot assign owner role. Use transfer ownership instead.',
      );
    }

    member.role = dto.role;
    return this.memberRepository.save(member);
  }

  async removeMember(
    organizationId: string,
    memberId: string,
    userId: string,
  ): Promise<void> {
    await this.checkPermission(organizationId, userId, 'canRemoveMembers');

    const member = await this.memberRepository.findOne({
      where: { id: memberId, organizationId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === OrganizationRole.OWNER) {
      throw new BadRequestException('Cannot remove owner');
    }

    await this.memberRepository.remove(member);
  }

  async transferOwnership(
    organizationId: string,
    newOwnerId: string,
    currentOwnerId: string,
  ): Promise<void> {
    const currentOwner = await this.memberRepository.findOne({
      where: {
        organizationId,
        userId: currentOwnerId,
        role: OrganizationRole.OWNER,
      },
    });

    if (!currentOwner) {
      throw new ForbiddenException('Only owners can transfer ownership');
    }

    const newOwner = await this.memberRepository.findOne({
      where: { organizationId, userId: newOwnerId },
    });

    if (!newOwner) {
      throw new NotFoundException('New owner must be a member');
    }

    // Update roles
    currentOwner.role = OrganizationRole.ADMIN;
    newOwner.role = OrganizationRole.OWNER;

    await this.memberRepository.save([currentOwner, newOwner]);
  }

  async switchOrganization(
    organizationId: string,
    userId: string,
  ): Promise<void> {
    const member = await this.memberRepository.findOne({
      where: { organizationId, userId, isActive: true },
    });

    if (!member) {
      throw new NotFoundException('Not a member of this organization');
    }

    await this.userRepository.update(userId, {
      currentOrganizationId: organizationId,
    });

    // Update last active
    member.lastActiveAt = new Date();
    await this.memberRepository.save(member);
  }

  async checkResourceLimit(
    organizationId: string,
    resource: keyof PlanLimits,
    increment: number = 1,
  ): Promise<boolean> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Get current count based on resource
    let currentCount = 0;
    switch (resource) {
      case 'maxWorkflows':
        currentCount = await this.dataSource
          .getRepository('Workflow')
          .count({ where: { organizationId } });
        break;
      case 'maxCredentials':
        currentCount = await this.dataSource
          .getRepository('Credential')
          .count({ where: { organizationId } });
        break;
      case 'maxTeamMembers':
        currentCount = await this.memberRepository.count({
          where: { organizationId },
        });
        break;
      case 'maxExecutionsPerMonth':
        currentCount = organization.currentMonthExecutions;
        break;
    }

    return organization.isWithinLimit(resource, currentCount + increment);
  }

  async incrementExecutionCount(organizationId: string): Promise<void> {
    await this.organizationRepository.increment(
      { id: organizationId },
      'currentMonthExecutions',
      1,
    );
  }

  async resetMonthlyExecutions(): Promise<void> {
    const now = new Date();
    await this.organizationRepository
      .createQueryBuilder()
      .update()
      .set({
        currentMonthExecutions: 0,
        executionResetDate: this.getNextMonthResetDate(),
      })
      .where('executionResetDate <= :now', { now })
      .execute();
  }

  private async checkPermission(
    organizationId: string,
    userId: string,
    permission: keyof RolePermissions,
  ): Promise<OrganizationMember> {
    const member = await this.memberRepository.findOne({
      where: { organizationId, userId },
      relations: ['organization'],
    });

    if (!member) {
      throw new NotFoundException('Not a member of this organization');
    }

    if (!member.hasPermission(permission)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return member;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }

  private getNextMonthResetDate(): Date {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
}
