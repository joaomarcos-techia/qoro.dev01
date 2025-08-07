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

export const InviteUserSchema = z.object({
    email: z.string().email('O e-mail fornecido não é válido.'),
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
    customerId: z.string().min(1, "É necessário selecionar um cliente."),
    title: z.string().min(1, "O título é obrigatório."),
    value: z.coerce.number().min(0, "O valor deve ser um número positivo."),
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

export const ProductSchema = z.object({
    name: z.string().min(1, 'Nome do produto é obrigatório.'),
    description: z.string().optional(),
    price: z.coerce.number().min(0, 'O preço deve ser um número positivo.'),
    cost: z.coerce.number().optional(),
    category: z.string().optional(),
    sku: z.string().optional(),
    isActive: z.boolean().default(true),
});

export const ProductProfileSchema = ProductSchema.extend({
    id: z.string(),
    createdAt: z.string(),
});
export type ProductProfile = z.infer<typeof ProductProfileSchema>;

export const QuoteItemSchema = z.object({
    type: z.enum(['product', 'service']),
    itemId: z.string(),
    name: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    total: z.number(),
});

export const QuoteSchema = z.object({
    customerId: z.string().min(1, "É necessário selecionar um cliente."),
    number: z.string(),
    items: z.array(QuoteItemSchema).min(1, "O orçamento deve ter pelo menos um item."),
    subtotal: z.number(),
    discount: z.number().optional(),
    tax: z.number().optional(),
    total: z.number(),
    status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']),
    validUntil: z.date(),
    notes: z.string().optional(),
});

export const QuoteProfileSchema = QuoteSchema.extend({
    id: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    customerName: z.string().optional(),
});
export type QuoteProfile = z.infer<typeof QuoteProfileSchema>;


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


// Schemas for QoroPulse
export const PulseMessageSchema = z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    conversationId: z.string().optional(),
});
export type PulseMessage = z.infer<typeof PulseMessageSchema>;

export const AskPulseInputSchema = z.object({
    messages: z.array(PulseMessageSchema),
    actor: z.string(),
    conversationId: z.string().optional(),
});
export type AskPulseInput = z.infer<typeof AskPulseInputSchema>;

export const ConversationSchema = z.object({
    id: z.string(),
    title: z.string(),
    createdAt: z.string(),
    messages: z.array(PulseMessageSchema),
});
export type Conversation = z.infer<typeof ConversationSchema>;

// Schemas for Finance Management
export const AccountSchema = z.object({
    name: z.string().min(1, 'O nome da conta é obrigatório.'),
    type: z.enum(['checking', 'savings', 'credit_card', 'cash']),
    bank: z.string().optional(),
    balance: z.coerce.number().default(0),
    isActive: z.boolean().default(true),
});

export const AccountProfileSchema = AccountSchema.extend({
    id: z.string(),
    createdAt: z.string(),
});
export type AccountProfile = z.infer<typeof AccountProfileSchema>;

export const TransactionSchema = z.object({
    accountId: z.string().min(1, "É necessário selecionar uma conta."),
    type: z.enum(['income', 'expense']),
    amount: z.coerce.number().positive('O valor deve ser maior que zero.'),
    description: z.string().min(1, 'A descrição é obrigatória.'),
    date: z.date(),
    category: z.string().min(1, "A categoria é obrigatória."),
    status: z.enum(['pending', 'paid', 'cancelled']).default('paid'),
    paymentMethod: z.enum(['cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer', 'boleto']),
    tags: z.array(z.string()).optional(),
    customerId: z.string().optional(),
});

export const TransactionProfileSchema = TransactionSchema.extend({
    id: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    accountName: z.string().optional(), // Denormalized for display
    customerName: z.string().optional(), // Denormalized for display
});
export type TransactionProfile = z.infer<typeof TransactionProfileSchema>;

export const SupplierSchema = z.object({
    name: z.string().min(1, 'O nome é obrigatório.'),
    cnpj: z.string().optional(),
    email: z.string().email('Email inválido.'),
    phone: z.string().optional(),
    address: AddressSchema.optional(),
    paymentTerms: z.string().optional(),
    isActive: z.boolean().default(true),
});

export const SupplierProfileSchema = SupplierSchema.extend({
    id: z.string(),
    createdAt: z.string(),
});
export type SupplierProfile = z.infer<typeof SupplierProfileSchema>;
