"use client";

import { deleteProduct } from "@/app/seller/products/actions";

export default function DeleteProductButton({
  productId,
  productName,
}: {
  productId: number;
  productName: string;
}) {
  return (
    <form
      action={deleteProduct}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `ต้องการลบสินค้า "${productName}" จริงหรือไม่?`
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input
        type="hidden"
        name="productId"
        value={productId}
      />

      <button
        type="submit"
        className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
      >
        ลบ
      </button>
    </form>
  );
}