-- Add isAllDay field to events table for distinguishing Date Only vs Specific Time events
ALTER TABLE "events" ADD COLUMN "isAllDay" BOOLEAN NOT NULL DEFAULT false;
