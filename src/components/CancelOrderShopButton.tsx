import ConfirmationDialog from "@/components/ui/confirmation-dialog";
import { cancelOrderShop } from "@/app/orders/[id]/actions";
export default function CancelOrderShopButton({
  orderShopId,
  shopName,
}: {
  orderShopId: number;
  shopName: string;
}) {
  return (
    <ConfirmationDialog
      action={cancelOrderShop}
      name="orderShopId"
      value={orderShopId}
      title="ยกเลิกรายการจากร้านนี้"
      description={`ต้องการยกเลิกสินค้าจากร้าน “${shopName}” ใช่หรือไม่? รายการของร้านอื่นในคำสั่งซื้อจะไม่เปลี่ยนแปลง`}
      label="ยกเลิกรายการ"
    />
  );
}
