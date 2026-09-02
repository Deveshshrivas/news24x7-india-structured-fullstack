CREATE TABLE `audio_highlights` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`excerpt` text NOT NULL,
	`language` text DEFAULT 'hi-IN' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `audio_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
