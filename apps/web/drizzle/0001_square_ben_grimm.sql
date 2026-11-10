CREATE TABLE `danmaku` (
	`id` text PRIMARY KEY NOT NULL,
	`episode` integer NOT NULL,
	`time_ms` integer NOT NULL,
	`text` text NOT NULL,
	`color` text DEFAULT '#fff8ec' NOT NULL,
	`mode` text DEFAULT 'scroll' NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `danmaku_episode_time_idx` ON `danmaku` (`episode`,`time_ms`);