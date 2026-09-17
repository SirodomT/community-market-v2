import { EmptyState } from "@/components/ui/primitives";
export default function NotFound() {
  return (
    <main className="page-shell">
      <div className="mx-auto max-w-xl">
        <EmptyState
          title="ไม่พบหน้าที่ต้องการ"
          description="หน้านี้อาจถูกย้าย หรือสินค้าและร้านค้าอาจไม่พร้อมให้บริการ"
          href="/products"
          label="กลับไปเลือกซื้อสินค้า"
        />
      </div>
    </main>
  );
}
