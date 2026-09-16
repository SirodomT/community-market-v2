CREATE TABLE `shop_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`shop_name` varchar(150) NOT NULL,
	`description` text NOT NULL,
	`phone` varchar(20) NOT NULL,
	`address` text NOT NULL,
	`status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
	`review_note` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`reviewed_at` timestamp NULL,
	CONSTRAINT `shop_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shops` (
	`id` int AUTO_INCREMENT NOT NULL,
	`owner_id` int NOT NULL,
	`name` varchar(150) NOT NULL,
	`description` text NOT NULL,
	`phone` varchar(20) NOT NULL,
	`address` text NOT NULL,
	`status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shops_id` PRIMARY KEY(`id`),
	CONSTRAINT `shops_owner_id_unique` UNIQUE(`owner_id`)
);
--> statement-breakpoint
ALTER TABLE `shop_requests` ADD CONSTRAINT `shop_requests_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shops` ADD CONSTRAINT `shops_owner_id_users_id_fk` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;