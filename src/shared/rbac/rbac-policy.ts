import { RolesBuilder } from 'nest-access-control'

import { RoleEnum } from '@prisma/db'

export const RBAC_POLICY: RolesBuilder = new RolesBuilder()

export enum ResourceEnum {
  CERTIFICATE = 'certificateData',
}
// prettier-ignore
RBAC_POLICY
  .grant(RoleEnum.USER)
    .createOwn(ResourceEnum.CERTIFICATE)
    .readOwn([ResourceEnum.CERTIFICATE])
  .grant(RoleEnum.ADMIN)
    .extend(RoleEnum.USER)
    .createAny(ResourceEnum.CERTIFICATE)
    .readAny([ResourceEnum.CERTIFICATE])
    .deleteAny([ResourceEnum.CERTIFICATE])

/**
 * User role can:
 *  - create own certificateData
 *  - read own certificateData
 *
 * Admin role can:
 *  - the same as user
 *  - read any certificateData
 *  - create certificates for any users
 *  - delete certificates for any users
 */
