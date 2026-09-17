import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Package } from "lucide-react";
import { PriceDisplay, StockBadge } from "@/components/ui/primitives";

type Product = {
  id: number;
  name: string;
  price: string | number;
  stock: number;
  imageUrl: string | null;
  categoryName: string | null;
  shopName: string;
};
export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex min-w-0 flex-col rounded-2xl border border-transparent p-2 transition duration-200 hover:border-border hover:bg-surface motion-safe:hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            unoptimized
            sizes="(min-width: 1280px) 300px, (min-width: 1024px) 30vw, 50vw"
            className="object-cover transition duration-200 motion-safe:group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-xs text-muted-foreground">
            <Package aria-hidden="true" className="size-8 stroke-1" />
            ยังไม่มีรูปสินค้า
          </div>
        )}
        {product.stock <= 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-surface px-3 py-1 text-xs font-semibold">
            สินค้าหมด
          </span>
        )}
        <span className="absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-full bg-white/95 text-primary">
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </span>
      </div>
      <div className="flex flex-1 flex-col px-1 pb-2 pt-4 sm:px-2">
        <p className="truncate text-[11px] font-semibold text-accent">
          {product.categoryName ?? "สินค้าชุมชน"}
        </p>
        <h3 className="mt-1.5 line-clamp-2 text-sm font-bold leading-6 sm:text-base">
          {product.name}
        </h3>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          ร้าน {product.shopName}
        </p>
        <div className="mt-auto pt-3">
          <PriceDisplay
            value={product.price}
            className="break-words text-lg sm:text-xl"
          />
          <div className="mt-1.5">
            <StockBadge stock={product.stock} />
          </div>
        </div>
      </div>
    </Link>
  );
}
