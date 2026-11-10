CREATE TABLE `extension_token` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`label` text,
	`created_at` integer NOT NULL,
	`last_used_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `extension_token_token_hash_unique` ON `extension_token` (`token_hash`);--> statement-breakpoint
CREATE INDEX `extension_token_user_idx` ON `extension_token` (`user_id`);