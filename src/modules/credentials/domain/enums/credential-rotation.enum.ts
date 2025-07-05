export enum RotationType {
  MANUAL = 'manual',
  API_KEY = 'api_key',
  OAUTH2 = 'oauth2',
  PASSWORD = 'password',
  CERTIFICATE = 'certificate',
}

export enum RotationStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  ACTIVE = 'active',
  EXPIRED = 'expired',
}

export const ROTATION_TYPE_DESCRIPTIONS = {
  [RotationType.MANUAL]: 'Manual rotation triggered by user',
  [RotationType.API_KEY]: 'Automatic API key rotation',
  [RotationType.OAUTH2]: 'OAuth2 token refresh rotation',
  [RotationType.PASSWORD]: 'Password rotation with external service',
  [RotationType.CERTIFICATE]: 'Certificate renewal and rotation',
};

export const ROTATION_STATUS_DESCRIPTIONS = {
  [RotationStatus.SCHEDULED]: 'Rotation is scheduled for future execution',
  [RotationStatus.IN_PROGRESS]: 'Rotation is currently being executed',
  [RotationStatus.COMPLETED]: 'Rotation completed successfully',
  [RotationStatus.FAILED]: 'Rotation failed with errors',
  [RotationStatus.CANCELLED]: 'Rotation was cancelled before completion',
  [RotationStatus.ACTIVE]: 'Active rotation policy',
  [RotationStatus.EXPIRED]: 'Rotation policy has expired',
};

export const DEFAULT_ROTATION_INTERVALS = {
  [RotationType.API_KEY]: 90, // 90 days
  [RotationType.OAUTH2]: 1, // 1 day (frequent refresh)
  [RotationType.PASSWORD]: 180, // 180 days
  [RotationType.CERTIFICATE]: 365, // 365 days
  [RotationType.MANUAL]: 0, // No automatic rotation
};

export const DEFAULT_WARNING_DAYS = {
  [RotationType.API_KEY]: 7,
  [RotationType.OAUTH2]: 1,
  [RotationType.PASSWORD]: 14,
  [RotationType.CERTIFICATE]: 30,
  [RotationType.MANUAL]: 0,
};

// Helper functions
export function getDefaultInterval(rotationType: RotationType): number {
  return DEFAULT_ROTATION_INTERVALS[rotationType] || 90;
}

export function getDefaultWarningDays(rotationType: RotationType): number {
  return DEFAULT_WARNING_DAYS[rotationType] || 7;
}

export function isAutomaticRotationType(rotationType: RotationType): boolean {
  return rotationType !== RotationType.MANUAL;
}

export function canBeScheduled(rotationType: RotationType): boolean {
  return Object.values(RotationType).includes(rotationType);
}

export function getRotationPriority(rotationType: RotationType): number {
  const priorities = {
    [RotationType.CERTIFICATE]: 1, // Highest priority
    [RotationType.PASSWORD]: 2,
    [RotationType.API_KEY]: 3,
    [RotationType.OAUTH2]: 4,
    [RotationType.MANUAL]: 5, // Lowest priority
  };
  
  return priorities[rotationType] || 5;
}

export function isFailedStatus(status: RotationStatus): boolean {
  return [
    RotationStatus.FAILED,
    RotationStatus.CANCELLED,
    RotationStatus.EXPIRED,
  ].includes(status);
}

export function isSuccessStatus(status: RotationStatus): boolean {
  return status === RotationStatus.COMPLETED;
}

export function isPendingStatus(status: RotationStatus): boolean {
  return [
    RotationStatus.SCHEDULED,
    RotationStatus.IN_PROGRESS,
  ].includes(status);
}

export function isActiveStatus(status: RotationStatus): boolean {
  return status === RotationStatus.ACTIVE;
}

export function getStatusColor(status: RotationStatus): string {
  const colors = {
    [RotationStatus.SCHEDULED]: '#ffa500', // Orange
    [RotationStatus.IN_PROGRESS]: '#0066cc', // Blue
    [RotationStatus.COMPLETED]: '#28a745', // Green
    [RotationStatus.FAILED]: '#dc3545', // Red
    [RotationStatus.CANCELLED]: '#6c757d', // Gray
    [RotationStatus.ACTIVE]: '#28a745', // Green
    [RotationStatus.EXPIRED]: '#dc3545', // Red
  };
  
  return colors[status] || '#6c757d';
}

export function getTypeIcon(rotationType: RotationType): string {
  const icons = {
    [RotationType.MANUAL]: '🔧',
    [RotationType.API_KEY]: '🔑',
    [RotationType.OAUTH2]: '🔄',
    [RotationType.PASSWORD]: '🔒',
    [RotationType.CERTIFICATE]: '📜',
  };
  
  return icons[rotationType] || '🔧';
}
