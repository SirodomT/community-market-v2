CREATE TABLE `order_shops` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`shop_id` int,
	`shop_name` varchar(150) NOT NULL,
	`subtotal` decimal(10,2) NOT NULL,
	`status` enum('PENDING','CONFIRMED','SHIPPED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_shops_id` PRIMARY KEY(`id`),
	CONSTRAINT `order_shops_order_shop_unique` UNIQUE(`order_id`,`shop_id`)
);
--> statement-breakpoint
ALTER TABLE `order_shops` ADD CONSTRAINT `order_shops_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_shops` ADD CONSTRAINT `order_shops_shop_id_shops_id_fk` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE set null ON UPDATE no action;