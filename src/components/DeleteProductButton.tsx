import ConfirmationDialog from "@/components/ui/confirmation-dialog";
import { deleteProduct } from "@/app/seller/products/actions";
export default function DeleteProductButton({
  productId,
  productName,
}: {
  productId: number;
  productName: string;
}) {
  return (
    <ConfirmationDialog
      action={deleteProduct}
      name="productId"
      value={productId}
      title="ลบสินค้า"
      description={`ต้องการลบสินค้า “${productName}” ใช่หรือไม่?`}
      label="ลบสินค้า"
    />
  );
}
