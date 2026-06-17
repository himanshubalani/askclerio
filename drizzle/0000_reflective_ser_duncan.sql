CREATE TYPE "public"."email_priority" AS ENUM('high', 'normal', 'low');--> statement-breakpoint
CREATE TYPE "public"."chat_message_role" AS ENUM('user', 'assistant', 'system', 'tool');--> statement-breakpoint
CREATE TYPE "public"."tool_call_status" AS ENUM('draft', 'awaiting_confirmation', 'running', 'done', 'cancelled', 'failed');--> statement-breakpoint
CREATE TYPE "public"."tool_trust_mode" AS ENUM('ask_every_time', 'auto_run');--> statement-breakpoint
CREATE TABLE "askclerio_calendar_ai_meta" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"entity_id" text NOT NULL,
	"embedding" vector(1536),
	"content_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "askclerio_calendar_ai_meta_entity_id_unique" UNIQUE("entity_id")
);
--> statement-breakpoint
CREATE TABLE "askclerio_calendar_notes" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"event_id" text NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "askclerio_chat_conversations" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "askclerio_chat_messages" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" text NOT NULL,
	"role" "chat_message_role" NOT NULL,
	"content" text NOT NULL,
	"tool_calls" jsonb,
	"tool_results" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "askclerio_chat_tool_calls" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" text NOT NULL,
	"conversation_id" text NOT NULL,
	"tool_name" text NOT NULL,
	"tool_call_id" text NOT NULL,
	"parameters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"edited_parameters" jsonb,
	"result" jsonb,
	"status" "tool_call_status" DEFAULT 'draft' NOT NULL,
	"retry_count" text DEFAULT '0' NOT NULL,
	"error_message" text,
	"approval_token" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "askclerio_chat_tool_settings" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tool_name" text NOT NULL,
	"trust_mode" "tool_trust_mode" DEFAULT 'ask_every_time' NOT NULL,
	"classification" text DEFAULT 'write' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corsair_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"tenant_id" text NOT NULL,
	"integration_id" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"dek" text
);
--> statement-breakpoint
CREATE TABLE "corsair_entities" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"account_id" text NOT NULL,
	"entity_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"version" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corsair_events" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"account_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text
);
--> statement-breakpoint
CREATE TABLE "corsair_integrations" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"dek" text
);
--> statement-breakpoint
CREATE TABLE "askclerio_email_ai_meta" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"entity_id" text NOT NULL,
	"thread_id" text NOT NULL,
	"priority" "email_priority" DEFAULT 'normal',
	"priority_reason" text,
	"embedding" vector(1536),
	"content_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "askclerio_email_ai_meta_entity_id_unique" UNIQUE("entity_id")
);
--> statement-breakpoint
CREATE TABLE "askclerio_email_notes" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"thread_id" text NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "askclerio_users" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "askclerio_users_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "askclerio_users_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
ALTER TABLE "askclerio_calendar_ai_meta" ADD CONSTRAINT "askclerio_calendar_ai_meta_user_id_askclerio_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."askclerio_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "askclerio_chat_conversations" ADD CONSTRAINT "askclerio_chat_conversations_user_id_askclerio_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."askclerio_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "askclerio_chat_messages" ADD CONSTRAINT "askclerio_chat_messages_conversation_id_askclerio_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."askclerio_chat_conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "askclerio_chat_tool_calls" ADD CONSTRAINT "askclerio_chat_tool_calls_message_id_askclerio_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."askclerio_chat_messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "askclerio_chat_tool_calls" ADD CONSTRAINT "askclerio_chat_tool_calls_conversation_id_askclerio_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."askclerio_chat_conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "askclerio_chat_tool_settings" ADD CONSTRAINT "askclerio_chat_tool_settings_user_id_askclerio_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."askclerio_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corsair_accounts" ADD CONSTRAINT "corsair_accounts_integration_id_corsair_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."corsair_integrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corsair_entities" ADD CONSTRAINT "corsair_entities_account_id_corsair_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."corsair_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corsair_events" ADD CONSTRAINT "corsair_events_account_id_corsair_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."corsair_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "askclerio_email_ai_meta" ADD CONSTRAINT "askclerio_email_ai_meta_user_id_askclerio_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."askclerio_users"("id") ON DELETE no action ON UPDATE no action;