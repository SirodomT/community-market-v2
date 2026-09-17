"use client";

import {
    cancelOrderShop,
} from "@/app/orders/[id]/actions";

export default function CancelOrderShopButton({
    orderShopId,
    shopName,
}: {
    orderShopId: number;
    shopName: string;
}) {
    return (
        <form
            action={cancelOrderShop}
            onSubmit={(event) => {
                const confirmed =
                    window.confirm(
                        `ต้องการยกเลิกสินค้าจากร้าน "${shopName}" ใช่หรือไม่?`
                    );

                if (!confirmed) {
                    event.preventDefault();
                }
            }}
        >
            <input
                type="hidden"
                name="orderShopId"
                value={orderShopId}
            />

            <button
                type="submit"
                className="rounded-lg border border-red-200 px-5 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
                ยกเลิกรายการ
            </button>
        </form>
    );
}