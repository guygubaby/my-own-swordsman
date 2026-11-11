CREATE TABLE `watch_progress` (
	`user_id` text NOT NULL,
	`episode` integer NOT NULL,
	`time_ms` integer NOT NULL,
	`duration_ms` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `episode`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
