import { z } from 'zod';

// Schemas
export const SignUpSchema = z.object({
    name: z.string().optional(),
    organizationName: z.string().optional(),
    email: z.string().email(),
    password: z.string().min(6),
    cnpj: z.string().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
});

export const InviteUserSchema = z.object({
  email: z.string().email(),
});

const AppPermissionsSchema = z.object({
    qoroCrm: z.boolean().default(true),
    qoroPulse: z.boolean().default(true),
    qoroTask: z.boolean().default(true),
    qoroFinance: z.boolean().default(true),
}).optional();

export const UserProfileSchema = z.object({
    uid: z.string(),
    email: z.string(),
    name: z.string().optional().nullable(),
    organizationId: z.string(),
    role: z.string().optional(),
    permissions: AppPermissionsSchema,
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const UpdateUserPermissionsSchema = z.object({
    userId: z.string(),
    permissions: z.object({
        qoroCrm: z.boolean(),
        qoroPulse: z.boolean(),
        qoroTask: z.boolean(),
        qoroFinance: z.boolean(),
    }),
});

export const OrganizationProfileSchema = z.object({
    id: z.string(),
    name: z.string(),
    cnpj: z.string().optional().nullable(),
    contactEmail: z.string().email().optional().nullable(),
    contactPhone: z.string().optional().nullable(),
});
export type OrganizationProfile = z.infer<typeof OrganizationProfileSchema>;

export const UpdateOrganizationDetailsSchema = z.object({
    name: z.string(),
    cnpj: z.string().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
});

    