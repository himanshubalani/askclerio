import { pgTable, text, jsonb, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { vector } from 'drizzle-orm/pgvector';

export const corsairIntegrations = pgTable('corsair_integrations', {
    id: text('id').primaryKey().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    name: text('name').notNull(),
    config: jsonb('config').notNull().default({}),
    dek: text('dek'),
});

export const corsairAccounts = pgTable('corsair_accounts', {
    id: text('id').primaryKey().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    tenantId: text('tenant_id').notNull(),
    integrationId: text('integration_id').notNull().references(() => corsairIntegrations.id),
    config: jsonb('config').notNull().default({}),
    dek: text('dek'),
});

export const corsairEntities = pgTable('corsair_entities', {
    id: text('id').primaryKey().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    accountId: text('account_id').notNull().references(() => corsairAccounts.id),
    entityId: text('entity_id').notNull(),
    entityType: text('entity_type').notNull(),
    version: text('version').notNull(),
    data: jsonb('data').notNull().default({}),
});

export const corsairEvents = pgTable('corsair_events', {
    id: text('id').primaryKey().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    accountId: text('account_id').notNull().references(() => corsairAccounts.id),
    eventType: text('event_type').notNull(),
    payload: jsonb('payload').notNull().default({}),
    status: text('status'),
});

export const emailNotes = pgTable('askclerio_email_notes', { 
    id: text('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
    userId: text('user_id').notNull(),
    threadId: text('thread_id').notNull(),
    note: text('note').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const calendarNotes = pgTable('askclerio_calendar_notes', {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
    userId: text('user_id').notNull(),
    eventId: text('event_id').notNull(),
    note: text('note').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- ENUMS ---
export const roleEnum = pgEnum('chat_message_role', ['user', 'assistant', 'system', 'tool']);
export const priorityEnum = pgEnum('email_priority', ['high', 'normal', 'low']);

// --- USERS ---
export const users = pgTable('askclerio_users', {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
    clerkId: text('clerk_id').unique().notNull(),
    tenantId: text('tenant_id').unique().notNull(), // Links directly to Corsair tenant
    email: text('email').notNull(),
    firstName: text('first_name'),
    lastName: text('last_name'),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- MCP CHAT AGENT TABLES ---
export const chatConversations = pgTable('askclerio_chat_conversations', {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
    userId: text('user_id').notNull().references(() => users.id),
    title: text('title').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const chatMessages = pgTable('askclerio_chat_messages', {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
    conversationId: text('conversation_id').notNull().references(() => chatConversations.id),
    role: roleEnum('role').notNull(),
    content: text('content').notNull(),
    toolCalls: jsonb('tool_calls'),     // JSON for Vercel AI SDK MCP tool executions
    toolResults: jsonb('tool_results'), // Results from the executed tools
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- AI METADATA & VECTOR SEARCH ---
export const emailAiMeta = pgTable('askclerio_email_ai_meta', {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
    userId: text('user_id').notNull().references(() => users.id),
    entityId: text('entity_id').unique().notNull(), // Maps to corsair_entities.entity_id
    threadId: text('thread_id').notNull(),          // Allows mapping AI labels directly into UI thread view
    priority: priorityEnum('priority').default('normal'),
    priorityReason: text('priority_reason'),
    embedding: vector('embedding', { dimensions: 1536 }), // OpenAI standard dimension
    contentHash: text('content_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const calendarAiMeta = pgTable('askclerio_calendar_ai_meta', {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
    userId: text('user_id').notNull().references(() => users.id),
    entityId: text('entity_id').unique().notNull(), // Maps to corsair_entities.entity_id
    embedding: vector('embedding', { dimensions: 1536 }),
    contentHash: text('content_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});