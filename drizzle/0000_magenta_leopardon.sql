CREATE TABLE "check_ins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"apellido" text NOT NULL,
	"email" text NOT NULL,
	"telefono" text NOT NULL,
	"pais" text NOT NULL,
	"ciudad" text NOT NULL,
	"fecha_check_in" date NOT NULL,
	"fecha_check_out" date NOT NULL,
	"cantidad_huespedes" integer NOT NULL,
	"creado_el" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "check_ins_creado_el_idx" ON "check_ins" USING btree ("creado_el");--> statement-breakpoint
CREATE INDEX "check_ins_email_idx" ON "check_ins" USING btree ("email");--> statement-breakpoint
CREATE INDEX "check_ins_fecha_check_in_idx" ON "check_ins" USING btree ("fecha_check_in");