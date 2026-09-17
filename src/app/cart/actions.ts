"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  cartItems,
  products,
  shops,
} from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function addToCart(
  formData: FormData
) {
  const user = await requireUser();

  const productId = Number(
    formData.get("productId")
  );

  const quantity = Number(
    formData.get("quantity") ?? 1
  );

  if (
    !Number.isInteger(productId) ||
    productId <= 0
  ) {
    throw new Error(
      "Invalid product ID"
    );
  }

  if (
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    redirect(
      `/products/${productId}?error=quantity`
    );
  }

  const productResult = await db
    .select({
      id: products.id,
      stock: products.stock,
      productStatus:
        products.status,
      shopStatus: shops.status,
    })
    .from(products)
    .innerJoin(
      shops,
      eq(
        products.shopId,
        shops.id
      )
    )
    .where(
      eq(
        products.id,
        productId
      )
    )
    .limit(1);

  if (productResult.length === 0) {
    redirect("/products");
  }

  const product =
    productResult[0];

  if (
    product.productStatus !==
      "ACTIVE" ||
    product.shopStatus !==
      "ACTIVE"
  ) {
    redirect("/products");
  }

  if (product.stock <= 0) {
    redirect(
      `/products/${productId}?error=out-of-stock`
    );
  }

  const existingItem =
    await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(
            cartItems.userId,
            user.id
          ),
          eq(
            cartItems.productId,
            productId
          )
        )
      )
      .limit(1);

  if (existingItem.length > 0) {
    const nextQuantity =
      existingItem[0].quantity +
      quantity;

    if (
      nextQuantity >
      product.stock
    ) {
      redirect(
        `/products/${productId}?error=stock`
      );
    }

    await db
      .update(cartItems)
      .set({
        quantity:
          nextQuantity,
        updatedAt:
          new Date(),
      })
      .where(
        eq(
          cartItems.id,
          existingItem[0].id
        )
      );
  } else {
    if (
      quantity >
      product.stock
    ) {
      redirect(
        `/products/${productId}?error=stock`
      );
    }

    await db
      .insert(cartItems)
      .values({
        userId: user.id,
        productId,
        quantity,
      });
  }

  /*
   * Refresh Cart
   */
  revalidatePath("/cart");

  /*
   * Refresh Root Layout
   * เพื่อให้ Navbar นับจำนวนตะกร้าใหม่
   */
  revalidatePath(
    "/",
    "layout"
  );

  /*
   * Refresh หน้าสินค้า
   */
  revalidatePath(
    `/products/${productId}`
  );

  redirect(
    "/cart?added=1"
  );
}

export async function changeCartQuantity(
  formData: FormData
) {
  const user = await requireUser();

  const cartItemId = Number(
    formData.get("cartItemId")
  );

  const action = formData
    .get("action")
    ?.toString();

  if (
    !Number.isInteger(
      cartItemId
    ) ||
    cartItemId <= 0
  ) {
    throw new Error(
      "Invalid cart item"
    );
  }

  const result = await db
    .select({
      id: cartItems.id,
      quantity:
        cartItems.quantity,
      stock: products.stock,
    })
    .from(cartItems)
    .innerJoin(
      products,
      eq(
        cartItems.productId,
        products.id
      )
    )
    .where(
      and(
        eq(
          cartItems.id,
          cartItemId
        ),
        eq(
          cartItems.userId,
          user.id
        )
      )
    )
    .limit(1);

  if (result.length === 0) {
    throw new Error(
      "Cart item not found"
    );
  }

  const item = result[0];

  if (
    action === "increase"
  ) {
    const nextQuantity =
      item.quantity + 1;

    if (
      nextQuantity >
      item.stock
    ) {
      redirect(
        "/cart?error=stock"
      );
    }

    await db
      .update(cartItems)
      .set({
        quantity:
          nextQuantity,
        updatedAt:
          new Date(),
      })
      .where(
        eq(
          cartItems.id,
          item.id
        )
      );
  }

  if (
    action === "decrease"
  ) {
    const nextQuantity =
      item.quantity - 1;

    if (
      nextQuantity >= 1
    ) {
      await db
        .update(cartItems)
        .set({
          quantity:
            nextQuantity,
          updatedAt:
            new Date(),
        })
        .where(
          eq(
            cartItems.id,
            item.id
          )
        );
    }
  }

  /*
   * Refresh Cart
   */
  revalidatePath("/cart");

  /*
   * Refresh Navbar
   */
  revalidatePath(
    "/",
    "layout"
  );
}

export async function removeCartItem(
  formData: FormData
) {
  const user = await requireUser();

  const cartItemId = Number(
    formData.get("cartItemId")
  );

  if (
    !Number.isInteger(
      cartItemId
    ) ||
    cartItemId <= 0
  ) {
    throw new Error(
      "Invalid cart item"
    );
  }

  await db
    .delete(cartItems)
    .where(
      and(
        eq(
          cartItems.id,
          cartItemId
        ),
        eq(
          cartItems.userId,
          user.id
        )
      )
    );

  /*
   * Refresh Cart
   */
  revalidatePath("/cart");

  /*
   * Refresh Navbar
   */
  revalidatePath(
    "/",
    "layout"
  );
}