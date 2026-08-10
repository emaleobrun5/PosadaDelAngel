ALTER TABLE "check_ins" ALTER COLUMN "nombre" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "check_ins" ALTER COLUMN "apellido" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "check_ins" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "check_ins" ALTER COLUMN "telefono" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "check_ins" ALTER COLUMN "pais" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "check_ins" ALTER COLUMN "ciudad" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "check_ins" ALTER COLUMN "fecha_check_in" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "check_ins" ALTER COLUMN "fecha_check_out" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "check_ins" ALTER COLUMN "cantidad_huespedes" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "check_ins" ADD COLUMN "documento" text;--> statement-breakpoint
ALTER TABLE "check_ins" ADD COLUMN "pasaporte" text;--> statement-breakpoint
CREATE INDEX "check_ins_documento_idx" ON "check_ins" USING btree ("documento");