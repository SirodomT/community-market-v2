import DashboardNav from "@/components/DashboardNav";
import SubmitButton from "@/components/ui/submit-button";
import { EmptyState, StatusBadge } from "@/components/ui/primitives";
import DeleteProductButton from "@/components/DeleteProductButton";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { toggleProductStatus } from "./actions";
import { db } from "@/db";
import { categories, products, shops } from "@/db/schema";
import { requireRole } from "@/lib/auth";

export default async function SellerProductsPage() {
  const user = await requireRole(["SELLER"]);

  const shopResult = await db
    .select()
    .from(shops)
    .where(eq(shops.ownerId, user.id))
    .limit(1);

  if (shopResult.length === 0) {
    redirect("/seller");
  }

  const shop = shopResult[0];

  const productList = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      stock: products.stock,
      status: products.status,
      categoryName: categories.name,
      createdAt: products.createdAt,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.shopId, shop.id))
    .orderBy(desc(products.createdAt));

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-6xl">
        <DashboardNav mode="seller" />
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <Link
              href="/seller"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← ภาพรวมร้าน
            </Link>

            <h1 className="mt-4 text-3xl font-bold">สินค้าของฉัน</h1>

            <p className="mt-2 text-muted-foreground">
              จัดการสินค้าของ {shop.name}
            </p>
          </div>

          <Link href="/seller/products/new" className="btn btn-primary">
            + เพิ่มสินค้า
          </Link>
        </div>

        {productList.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="ยังไม่มีสินค้า"
              description="เพิ่มสินค้าแรกให้ร้านของคุณ"
              href="/seller/products/new"
              label="เพิ่มสินค้า"
            />
          </div>
        ) : (
          <div className="mt-10 overflow-hidden surface">
            <div
              tabIndex={0}
              role="region"
              aria-label="ตารางข้อมูล เลื่อนแนวนอนเพื่อดูเพิ่มเติม"
              className="table-scroll"
            >
              <table className="data-table min-w-[720px]">
                <thead className="border-b bg-background">
                  <tr>
                    <th scope="col" className="px-6 py-4">
                      สินค้า
                    </th>

                    <th scope="col" className="px-6 py-4">
                      หมวดหมู่
                    </th>

                    <th scope="col" className="px-6 py-4">
                      ราคา
                    </th>

                    <th scope="col" className="px-6 py-4">
                      คงเหลือ
                    </th>

                    <th scope="col" className="px-6 py-4">
                      สถานะ
                    </th>
                    <th scope="col" className="px-6 py-4">
                      จัดการ
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {productList.map((product) => (
                    <tr key={product.id} className="border-b last:border-b-0">
                      <td className="px-6 py-4 font-medium">{product.name}</td>

                      <td className="px-6 py-4 text-muted-foreground">
                        {product.categoryName ?? "ไม่ระบุ"}
                      </td>

                      <td className="px-6 py-4">
                        ฿
                        {Number(product.price).toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      <td className="px-6 py-4">{product.stock}</td>

                      <td className="px-6 py-4">
                        <StatusBadge status={product.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/seller/products/${product.id}/edit`}
                            className="btn btn-secondary"
                          >
                            แก้ไข
                          </Link>

                          <form action={toggleProductStatus}>
                            <input
                              type="hidden"
                              name="productId"
                              value={product.id}
                            />

                            <SubmitButton
                              type="submit"
                              variant="secondary"
                              className=""
                            >
                              {product.status === "ACTIVE"
                                ? "ปิดสินค้า"
                                : "เปิดสินค้า"}
                            </SubmitButton>
                          </form>

                          <DeleteProductButton
                            productId={product.id}
                            productName={product.name}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
