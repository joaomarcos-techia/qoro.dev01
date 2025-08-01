import { z } from 'zod';

// Schemas for User and Organization Management
export const SignUpSchema = z.object({
    name: z.string().min(1, 'O nome é obrigatório.'),
    organizationName: z.string().min(1, 'O nome da organização é obrigatório.'),
    email: z.string().email(),
    password: z.string().min(6),
    cnpj: z.string().min(1, "O CNPJ é obrigatório."),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
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

// Schemas for CRM
export const AddressSchema = z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
});

export const CustomerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: AddressSchema.optional(),
  tags: z.array(z.string()).optional(),
  source: z.enum(['website', 'referral', 'social', 'cold_call', 'other']).default('other'),
  status: z.enum(['active', 'inactive', 'prospect']).default('prospect'),
  customFields: z.record(z.any()).optional(),
});

export const CustomerProfileSchema = CustomerSchema.extend({
    id: z.string(),
    createdAt: z.string(), // Using string for simplicity on the client
});
export type CustomerProfile = z.infer<typeof CustomerProfileSchema>;

export const SaleLeadSchema = z.object({
    customerId: z.string(),
    title: z.string(),
    value: z.number(),
    stage: z.enum(['prospect', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
    priority: z.enum(['low', 'medium', 'high']),
    expectedCloseDate: z.date(),
});

export const SaleLeadProfileSchema = SaleLeadSchema.extend({
    id: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    customerName: z.string().optional(), // Denormalized for easy display
    customerEmail: z.string().email().optional(), // Denormalized for easy display
});
export type SaleLeadProfile = z.infer<typeof SaleLeadProfileSchema>;


// Schemas for Task Management
export const TaskSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório.'),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.date().optional().nullable(),
});

export const TaskProfileSchema = TaskSchema.extend({
    id: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    userId: z.string(),
});
export type TaskProfile = z.infer<typeof TaskProfileSchema>;
