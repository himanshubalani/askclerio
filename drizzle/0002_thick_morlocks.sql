CREATE TABLE "askclerio_structured_write_log" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"approving_user_id" text,
	"operation_path" text NOT NULL,
	"executed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"tool_call_id" text NOT NULL,
	"status" text NOT NULL,
	"recipient_address" text,
	"event_title" text,
	"event_start_time" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "askclerio_tenant_mcp_keys" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"encrypted_secret" text NOT NULL,
	"mcp_http_url" text NOT NULL,
	"key_label" text DEFAULT 'clerio-sidebar' NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"rotated_at" timestamp with time zone,
	CONSTRAINT "askclerio_tenant_mcp_keys_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
ALTER TABLE "askclerio_tenant_mcp_keys" ADD CONSTRAINT "askclerio_tenant_mcp_keys_tenant_id_askclerio_users_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."askclerio_users"("tenant_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_write_log_tenant_time" ON "askclerio_structured_write_log" USING btree ("tenant_id","executed_at");