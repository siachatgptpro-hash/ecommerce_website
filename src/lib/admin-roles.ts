import { SystemRole } from '@/types';

export const ADMIN_ROLES: SystemRole[] = [
  SystemRole.SUPER_ADMIN,
  SystemRole.ADMIN,
  SystemRole.PRODUCT_MANAGER,
  SystemRole.ORDER_MANAGER,
  SystemRole.CONTENT_MANAGER,
];

export function hasAdminRole(roles?: SystemRole[] | string[] | null): boolean {
  return !!roles?.some((role) => ADMIN_ROLES.includes(role as SystemRole));
}
