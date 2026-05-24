CREATE TYPE "public"."matches_prescribed" AS ENUM('matches', 'more-modified', 'less-modified', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."prompt_style" AS ENUM('gentle', 'direct', 'minimal');--> statement-breakpoint
CREATE TABLE "clinical_plan" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"texture_level" integer,
	"fluid_level" integer,
	"strategies" jsonb DEFAULT '[]'::jsonb,
	"exercises" jsonb DEFAULT '[]'::jsonb,
	"foods_to_avoid" jsonb DEFAULT '[]'::jsonb,
	"red_flags" jsonb DEFAULT '[]'::jsonb,
	"slt_name" text,
	"slt_contact" text,
	"review_date" date,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clinical_plan_texture_range" CHECK ("clinical_plan"."texture_level" is null or ("clinical_plan"."texture_level" between 0 and 7)),
	CONSTRAINT "clinical_plan_fluid_range" CHECK ("clinical_plan"."fluid_level" is null or ("clinical_plan"."fluid_level" between 0 and 4))
);
--> statement-breakpoint
CREATE TABLE "food_scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"image_path" text NOT NULL,
	"predicted_level" integer,
	"level_name" text,
	"visual_reasoning" text,
	"matches_prescribed" "matches_prescribed" DEFAULT 'unknown',
	"caveats" jsonb DEFAULT '[]'::jsonb,
	"red_flags" jsonb DEFAULT '[]'::jsonb,
	"suggestion" text,
	"confidence" text,
	"prescribed_level_at_scan" integer,
	"user_note" text,
	"model_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "food_scans_predicted_range" CHECK ("food_scans"."predicted_level" is null or ("food_scans"."predicted_level" between 0 and 7))
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"user_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_progress_user_id_slug_pk" PRIMARY KEY("user_id","slug")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"language_pref" text DEFAULT 'en',
	"prompt_style" "prompt_style" DEFAULT 'gentle',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "streak" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"last_check_in" date
);
--> statement-breakpoint
CREATE TABLE "symptom_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"coughing" boolean DEFAULT false NOT NULL,
	"wet_voice" boolean DEFAULT false NOT NULL,
	"fatigue" integer DEFAULT 0 NOT NULL,
	"confidence" integer DEFAULT 3 NOT NULL,
	"used_strategy" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "symptom_logs_fatigue_range" CHECK ("symptom_logs"."fatigue" between 0 and 3),
	CONSTRAINT "symptom_logs_confidence_range" CHECK ("symptom_logs"."confidence" between 1 and 5)
);
--> statement-breakpoint
CREATE INDEX "food_scans_user_created_idx" ON "food_scans" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "symptom_logs_user_date_idx" ON "symptom_logs" USING btree ("user_id","date");