
import { z } from 'zod';
import { MessageData } from 'genkit';

// Schemas for User and Organization Management
export const SignUpSchema = z.object({
    name: z.string().min(1, 'O nome é obrigatório.'),
    organizationName: z.string().min(1, 'O nome da organização é obrigatório.'),
    email: z.string().email(),
    password: z.string().min(6),
    cnpj: z.string().min(1, "O CNPJ é obrigatório."),
    contactEmail: z.string().email({ message: "E-mail de contato inválido." }).optional().or(z.literal('')),
    contactPhone: z.string().optional().or(z.literal('')),
});

export const InviteUserSchema = z.object({
    email: z.string().email('O e-mail fornecido não é válido.'),
});

const BaseAppPermissionsSchema = z.object({
    qoroCrm: z.boolean().default(true),
    qoroPulse: z.boolean().default(true),
    qoroTask: z.boolean().default(true),
    qoroFinance: z.boolean().default(true),
});

const AppPermissionsSchema = BaseAppPermissionsSchema.optional();


export const UserAccessInfoSchema = z.object({
    planId: z.enum(['free', 'growth', 'performance']),
    permissions: BaseAppPermissionsSchema,
});
export type UserAccessInfo = z.infer<typeof UserAccessInfoSchema>;


export const UserProfileSchema = z.object({
    uid: z.string(),
    email: z.string(),
    name: z.string().optional().nullable(),
    organizationId: z.string(),
    role: z.string().optional(),
    permissions: AppPermissionsSchema,
    planId: z.enum(['free', 'growth', 'performance']).default('free').optional(),
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
    // Stripe fields
    stripeCustomerId: z.string().optional().nullable(),
    stripeSubscriptionId: z.string().optional().nullable(),
    stripePriceId: z.string().optional().nullable(),
    stripeCurrentPeriodEnd: z.string().datetime().optional().nullable(),
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
    number: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
});

export const CustomerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  company: z.string().optional(),
  cpf: z.string().optional(),
  cnpj: z.string().optional(),
  birthDate: z.union([z.string().datetime(), z.date()]).optional().nullable(),
  address: AddressSchema.optional(),
  tags: z.array(z.string()).optional(),
  source: z.string().optional(),
  status: z.enum(['new', 'initial_contact', 'qualification', 'proposal', 'negotiation', 'won', 'lost', 'archived']).default('new'),
  customFields: z.record(z.any()).optional(),
});

export const UpdateCustomerSchema = CustomerSchema.extend({
    id: z.string(),
});

export const CustomerProfileSchema = CustomerSchema.extend({
    id: z.string(),
    createdAt: z.union([z.string().datetime(), z.date()]),
});
export type CustomerProfile = z.infer<typeof CustomerProfileSchema>;

export const ProductSchema = z.object({
    name: z.string().min(1, 'Nome do produto é obrigatório.'),
    description: z.string().optional(),
    price: z.coerce.number().min(0, 'O preço deve ser um número positivo.'),
    cost: z.coerce.number().optional(),
    category: z.string().optional(),
    sku: z.string().optional(),
    isActive: z.boolean().default(true),
    pricingModel: z.enum(['fixed', 'per_hour']).default('fixed').optional(),
    durationHours: z.coerce.number().optional(),
});

export const UpdateProductSchema = ProductSchema.extend({
    id: z.string(),
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
    cost: z.number().optional(),
    pricingModel: z.enum(['fixed', 'per_hour']).default('fixed').optional(),
});

export const QuoteSchema = z.object({
    customerId: z.string().min(1, "É necessário selecionar um cliente."),
    items: z.array(QuoteItemSchema).min(1, "O orçamento deve ter pelo menos um item."),
    subtotal: z.number(),
    discount: z.number().min(0).optional(),
    total: z.number(),
    validUntil: z.string().datetime(),
    notes: z.string().optional(),
});

export const UpdateQuoteSchema = QuoteSchema.extend({
    id: z.string(),
});

export const QuoteProfileSchema = QuoteSchema.extend({
    id: z.string(),
    number: z.string(), 
    createdAt: z.string(),
    updatedAt: z.string(),
    customerName: z.string().optional(),
    organizationName: z.string().optional(),
    status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']),
    validUntil: z.string().datetime().nullable(),
});
export type QuoteProfile = z.infer<typeof QuoteProfileSchema>;


export const SupplierSchema = z.object({
    name: z.string().min(1, 'O nome é obrigatório.'),
    cnpj: z.string().optional(),
    email: z.string().email('Email inválido.'),
    phone: z.string().optional(),
    address: AddressSchema.optional(),
    paymentTerms: z.string().optional(),
    isActive: z.boolean().default(true),
});

export const UpdateSupplierSchema = SupplierSchema.extend({
    id: z.string(),
});

export const SupplierProfileSchema = SupplierSchema.extend({
    id: z.string(),
    createdAt: z.string(),
});
export type SupplierProfile = z.infer<typeof SupplierProfileSchema>;


// Schemas for Task Management
export const SubtaskSchema = z.object({
    id: z.string(),
    text: z.string().min(1, "O texto da subtarefa não pode ser vazio."),
    isCompleted: z.boolean().default(false),
});
export type Subtask = z.infer<typeof SubtaskSchema>;

export const TaskCommentSchema = z.object({
    id: z.string(),
    authorId: z.string(),
    authorName: z.string(),
    text: z.string().min(1, "O comentário não pode ser vazio."),
    createdAt: z.union([z.string().datetime(), z.date()]),
});
export type TaskComment = z.infer<typeof TaskCommentSchema>;

export const TaskRecurrenceSchema = z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    interval: z.number().min(1),
}).optional();
export type TaskRecurrence = z.infer<typeof TaskRecurrenceSchema>;


export const TaskSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório.'),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.union([z.string().datetime(), z.date(), z.null()]).optional(),
  responsibleUserId: z.string().optional(),
  subtasks: z.array(SubtaskSchema).optional().default([]),
  comments: z.array(TaskCommentSchema).optional().default([]),
  recurrence: TaskRecurrenceSchema,
});

export const UpdateTaskSchema = TaskSchema.extend({
    id: z.string(),
});

export const TaskProfileSchema = TaskSchema.extend({
    id: z.string(),
    createdAt: z.string().nullable(),
    updatedAt: z.string().nullable(),
    creatorId: z.string(),
    responsibleUserName: z.string().optional(),
    completedAt: z.string().datetime().optional().nullable(),
});
export type TaskProfile = z.infer<typeof TaskProfileSchema>;


// Schemas for QoroPulse
export const PulseMessageSchema = z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
});
export type PulseMessage = z.infer<typeof PulseMessageSchema>;

export const ConversationSchema = z.object({
    id: z.string(),
    title: z.string(),
    messages: z.array(z.any()), // Allow any for MessageData from Genkit
});
export type Conversation = z.infer<typeof ConversationSchema>;

export const ConversationProfileSchema = z.object({
    id: z.string(),
    title: z.string(),
    updatedAt: z.string(),
});
export type ConversationProfile = z.infer<typeof ConversationProfileSchema>;


export const AskPulseInputSchema = z.object({
    messages: z.array(PulseMessageSchema),
    actor: z.string(),
    conversationId: z.string().optional(),
});
export type AskPulseInput = z.infer<typeof AskPulseInputSchema>;

export const AskPulseOutputSchema = z.object({
    conversationId: z.string(),
    title: z.string().optional(),
    response: PulseMessageSchema,
});
export type AskPulseOutput = z.infer<typeof AskPulseOutputSchema>;


// Schemas for Finance Management
export const AccountSchema = z.object({
    name: z.string().min(1, 'O nome da conta é obrigatório.'),
    type: z.enum(['checking', 'savings', 'credit_card', 'cash']),
    bank: z.string().optional(),
    balance: z.coerce.number().default(0),
    isActive: z.boolean().default(true),
});

export const UpdateAccountSchema = AccountSchema.extend({
    id: z.string(),
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
    date: z.union([z.string().datetime(), z.date()]),
    category: z.string().min(1, "A categoria é obrigatória."),
    status: z.enum(['pending', 'paid', 'cancelled']).default('paid'),
    paymentMethod: z.enum(['cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer', 'boleto']),
    tags: z.array(z.string()).optional(),
    customerId: z.string().optional(),
});

export const UpdateTransactionSchema = TransactionSchema.extend({
    id: z.string(),
});

export const TransactionProfileSchema = TransactionSchema.extend({
    id: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    accountName: z.string().optional(), // Denormalized for display
    customerName: z.string().optional(), // Denormalized for display
});
export type TransactionProfile = z.infer<typeof TransactionProfileSchema>;

export const BillSchema = z.object({
    description: z.string().min(1, 'A descrição é obrigatória.'),
    amount: z.coerce.number().positive('O valor deve ser maior que zero.'),
    type: z.enum(['payable', 'receivable']),
    dueDate: z.union([z.string().datetime(), z.date()]),
    status: z.enum(['pending', 'paid', 'overdue']).default('pending'),
    entityType: z.enum(['customer', 'supplier']).optional(),
    entityId: z.string().optional(),
    notes: z.string().optional(),
});

export const UpdateBillSchema = BillSchema.extend({
    id: z.string(),
});

export const BillProfileSchema = BillSchema.extend({
    id: z.string(),
    createdAt: z.string(),
    entityName: z.string().optional(),
});
export type BillProfile = z.infer<typeof BillProfileSchema>;
