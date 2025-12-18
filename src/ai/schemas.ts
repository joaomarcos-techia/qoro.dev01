

import { z } from 'zod';

const emailRegex = new RegExp(
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
);

// Schemas for User and Organization Management
export const SignUpSchema = z.object({
    name: z.string().min(1, 'O nome é obrigatório.'),
    organizationName: z.string().min(1, 'O nome da organização é obrigatório.'),
    email: z.string().email(),
    // Password is handled on the client, not in server-side schemas for creation
    cnpj: z.string().min(1, "O CNPJ é obrigatório."),
    contactEmail: z.union([z.string().email({ message: "E-mail de contato inválido." }), z.literal('')]).optional(),
    contactPhone: z.union([z.string(), z.literal('')]).optional(),
    planId: z.string().optional(),
});


export const UserProfileCreationSchema = SignUpSchema.extend({
    uid: z.string(),
    planId: z.string(),
    stripePriceId: z.string(), // Tornando obrigatório para a criação unificada
    stripeCustomerId: z.string().optional(),
    stripeSubscriptionId: z.string().optional(),
    stripeSubscriptionStatus: z.string().optional(),
});


export const InviteUserSchema = z.object({
    email: z.string().email('O e-mail fornecido não é válido.'),
});

export const AppPermissionsSchema = z.object({
    qoroCrm: z.boolean().default(true),
    qoroPulse: z.boolean().default(false),
    qoroTask: z.boolean().default(true),
    qoroFinance: z.boolean().default(true),
});
export type AppPermissions = z.infer<typeof AppPermissionsSchema>;


export const UserAccessInfoSchema = z.object({
    planId: z.enum(['free', 'growth', 'performance']),
    permissions: AppPermissionsSchema,
    role: z.enum(['admin', 'member']),
});
export type UserAccessInfo = z.infer<typeof UserAccessInfoSchema>;


export const UserProfileSchema = z.object({
    uid: z.string(),
    email: z.string(),
    name: z.string().optional().nullable(),
    organizationId: z.string(),
    role: z.string().optional(),
    permissions: AppPermissionsSchema.optional(),
    planId: z.enum(['free', 'growth', 'performance']).default('free'),
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
    stripeCustomerId: z.string().optional().nullable(),
    stripeSubscriptionId: z.string().optional().nullable(),
    stripePriceId: z.string().optional().nullable(),
    stripeCurrentPeriodEnd: z.string().optional().nullable(),
});
export type OrganizationProfile = z.infer<typeof OrganizationProfileSchema>;

export const UpdateOrganizationDetailsSchema = z.object({
    name: z.string(),
    cnpj: z.string().optional(),
    contactEmail: z.union([z.string().email(), z.literal('')]).optional(),
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
  email: z.string().regex(emailRegex, 'Formato de email inválido').or(z.literal('')).optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  cpf: z.string().optional(),
  cnpj: z.string().optional(),
  birthDate: z.union([z.string(), z.date()]).optional().nullable(),
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
    createdAt: z.union([z.string(), z.date()]),
});
export type CustomerProfile = z.infer<typeof CustomerProfileSchema>;

// Schema for Products (always fixed price)
export const ProductSchema = z.object({
    name: z.string().min(1, 'Nome do produto é obrigatório.'),
    description: z.string().optional(),
    price: z.coerce.number().min(0, 'O preço deve ser um número positivo.'),
    cost: z.coerce.number().optional(),
    category: z.string().optional(),
    sku: z.string().optional(),
    isActive: z.boolean().default(true),
});

export const UpdateProductSchema = ProductSchema.extend({
    id: z.string(),
});

export const ProductProfileSchema = ProductSchema.extend({
    id: z.string(),
    createdAt: z.string(),
});
export type ProductProfile = z.infer<typeof ProductProfileSchema>;

// Schema for Services (can be fixed or per_hour)
export const ServiceSchema = z.object({
    name: z.string().min(1, 'Nome do serviço é obrigatório.'),
    description: z.string().optional(),
    pricingModel: z.enum(['fixed', 'per_hour']).default('per_hour'),
    price: z.coerce.number().min(0, 'O preço deve ser um número positivo.'),
    durationHours: z.coerce.number().optional(), // Relevant for per_hour
    category: z.string().optional(),
    isActive: z.boolean().default(true),
});

export const UpdateServiceSchema = ServiceSchema.extend({
    id: z.string(),
});

export const ServiceProfileSchema = ServiceSchema.extend({
    id: z.string(),
    createdAt: z.string(),
});
export type ServiceProfile = z.infer<typeof ServiceProfileSchema>;

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
    accountId: z.string().min(1, "É necessário selecionar uma conta financeira."),
    items: z.array(QuoteItemSchema).min(1, "O orçamento deve ter pelo menos um item."),
    subtotal: z.number(),
    discount: z.number().min(0).optional(),
    total: z.number(),
    validUntil: z.union([z.string(), z.date()]),
    notes: z.string().optional(),
});

export const UpdateQuoteSchema = QuoteSchema.extend({
    id: z.string(),
});

export const QuoteProfileSchema = QuoteSchema.extend({
    id: z.string(),
    number: z.string(), 
    status: z.enum(['pending', 'won', 'lost']),
    accountId: z.string().optional(), // Make accountId optional for backward compatibility
    createdAt: z.string(),
    updatedAt: z.string(),
    customerName: z.string().optional(),
    organizationName: z.string().optional(),
    validUntil: z.string().nullable(),
});
export type QuoteProfile = z.infer<typeof QuoteProfileSchema>;

export const QualificationLeadSchema = z.object({
  companySize: z.string().optional(),
  inefficientProcesses: z.string().optional(),
  currentTools: z.string().optional(),
  urgency: z.string().optional(),
  interestedServices: z.record(z.array(z.string())).optional(),
  investmentRange: z.string().optional(),
  desiredOutcome: z.string().optional(),
  fullName: z.string().optional(),
  role: z.string().optional(),
  email: z.string().optional(),
});

export const PulseMessageSchema = z.object({
  role: z.enum(["user", "assistant", "model", "tool"]),
  content: z.string(),
});
export type PulseMessage = z.infer<typeof PulseMessageSchema>;

export const ConversationSchema = z.object({
    id: z.string(),
    title: z.string(),
    updatedAt: z.string(),
    messages: z.array(PulseMessageSchema),
});
export type Conversation = z.infer<typeof ConversationSchema>;

export const ConversationProfileSchema = z.object({
    id: z.string(),
    title: z.string(),
    updatedAt: z.string(),
});
export type ConversationProfile = z.infer<typeof ConversationProfileSchema>;

export const AskPulseInputSchema = z.object({
    actor: z.string(),
    messages: z.array(PulseMessageSchema),
    conversationId: z.string().optional(),
});
export type AskPulseInput = z.infer<typeof AskPulseInputSchema>;

export const AskPulseOutputSchema = z.object({
    response: PulseMessageSchema,
    conversationId: z.string(),
    title: z.string(),
});
export type AskPulseOutput = z.infer<typeof AskPulseOutputSchema>;


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
    createdAt: z.union([z.string(), z.date()]),
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
  dueDate: z.union([z.string(), z.date(), z.null()]).optional(),
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
    completedAt: z.string().optional().nullable(),
});
export type TaskProfile = z.infer<typeof TaskProfileSchema>;

// Schemas for Finance
export const AccountSchema = z.object({
  name: z.string().min(1, 'O nome da conta é obrigatório.'),
  type: z.enum(['checking', 'savings', 'credit_card', 'cash']),
  bank: z.string().optional(),
  balance: z.coerce.number(),
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
    description: z.string().min(1, 'A descrição é obrigatória.'),
    amount: z.coerce.number().positive('O valor deve ser um número positivo.'),
    type: z.enum(['income', 'expense']),
    date: z.union([z.date(), z.string()]).optional(),
    accountId: z.string().optional(),
    customerId: z.string().optional(),
    category: z.string().optional(),
    status: z.enum(['pending', 'paid', 'cancelled']).default('paid'),
    paymentMethod: z.enum(['pix', 'credit_card', 'debit_card', 'bank_transfer', 'boleto', 'cash']).optional(),
    tags: z.array(z.string()).optional(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

export const UpdateTransactionSchema = TransactionSchema.extend({
    id: z.string(),
});

export const TransactionProfileSchema = TransactionSchema.extend({
    id: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    accountName: z.string().optional(),
    customerName: z.string().optional(),
});
export type TransactionProfile = z.infer<typeof TransactionProfileSchema>;


export const BillSchema = z.object({
    description: z.string().min(1, 'A descrição é obrigatória.'),
    amount: z.coerce.number().positive('O valor deve ser positivo.'),
    type: z.enum(['payable', 'receivable']),
    dueDate: z.union([z.date(), z.string()]),
    status: z.enum(['pending', 'paid', 'overdue']),
    entityId: z.string().optional(),
    entityType: z.enum(['customer', 'supplier']).optional(),
    notes: z.string().optional(),
    accountId: z.string().optional(),
    category: z.string().optional(),
    paymentMethod: z.enum(['pix', 'credit_card', 'debit_card', 'bank_transfer', 'boleto', 'cash']).optional(),
    tags: z.array(z.string()).optional(),
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

export const ReconciliationSchema = z.object({
    fileName: z.string(),
    ofxContent: z.string(),
    accountId: z.string(),
    status: z.enum(['pending', 'reconciled']).optional().default('pending'),
});

export const ReconciliationProfileSchema = ReconciliationSchema.extend({
    id: z.string(),
    createdAt: z.string(),
    accountName: z.string().optional(),
});
export type ReconciliationProfile = z.infer<typeof ReconciliationProfileSchema>;


  

    

    




    

  