CREATE TABLE "instructor_expertise" (
	"id" text PRIMARY KEY NOT NULL,
	"instructor_id" text NOT NULL,
	"program_id" text NOT NULL,
	"materi_block" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instructor_unavailability" (
	"id" text PRIMARY KEY NOT NULL,
	"instructor_id" text NOT NULL,
	"date" date NOT NULL,
	"reason" varchar(200)
);
--> statement-breakpoint
CREATE TABLE "instructors" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"email" varchar(150),
	"phone" varchar(30),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"planned_instructor_id" text NOT NULL,
	"actual_instructor_id" text,
	"substitution_reason" varchar(300),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "instructor_expertise" ADD CONSTRAINT "instructor_expertise_instructor_id_instructors_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_expertise" ADD CONSTRAINT "instructor_expertise_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_unavailability" ADD CONSTRAINT "instructor_unavailability_instructor_id_instructors_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_assignments" ADD CONSTRAINT "session_assignments_session_id_class_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."class_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_assignments" ADD CONSTRAINT "session_assignments_planned_instructor_id_instructors_id_fk" FOREIGN KEY ("planned_instructor_id") REFERENCES "public"."instructors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_assignments" ADD CONSTRAINT "session_assignments_actual_instructor_id_instructors_id_fk" FOREIGN KEY ("actual_instructor_id") REFERENCES "public"."instructors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_instructor_expertise" ON "instructor_expertise" USING btree ("instructor_id","program_id","materi_block");--> statement-breakpoint
CREATE INDEX "ie_program_block" ON "instructor_expertise" USING btree ("program_id","materi_block");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_instructor_unavail" ON "instructor_unavailability" USING btree ("instructor_id","date");--> statement-breakpoint
CREATE INDEX "iu_date_idx" ON "instructor_unavailability" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_session_instructor" ON "session_assignments" USING btree ("session_id","planned_instructor_id");--> statement-breakpoint
CREATE INDEX "sa_instructor_idx" ON "session_assignments" USING btree ("planned_instructor_id");--> statement-breakpoint
CREATE INDEX "sa_actual_instructor_idx" ON "session_assignments" USING btree ("actual_instructor_id");