"use client";
import Link from "next/link";
import { SlidersHorizontal, Search } from "lucide-react";
import { useState } from "react";
import Sheet from "@/components/ui/sheet";
import { Button, Input, Select } from "@/components/ui/primitives";
export default function ProductFilters({
  categories,
  search,
  categoryId,
  inStock,
}: {
  categories: { id: number; name: string }[];
  search: string;
  categoryId: number | null;
  inStock: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState(search);
  const filterCount = Number(Boolean(categoryId)) + Number(inStock);
  function fields(prefix: string) {
    return (
      <>
        <div>
          <label htmlFor={`${prefix}-category`} className="field-label">
            หมวดหมู่
          </label>
          <Select
            id={`${prefix}-category`}
            name="category"
            defaultValue={categoryId?.toString() ?? ""}
          >
            <option value="">ทุกหมวดหมู่</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
          <input
            name="stock"
            type="checkbox"
            value="1"
            defaultChecked={inStock}
            className="size-4"
          />
          เฉพาะสินค้าที่พร้อมจำหน่าย
        </label>
      </>
    );
  }
  return (
    <div className="surface p-4 sm:p-5">
      <form
        action="/products"
        method="GET"
        className="hidden items-end gap-4 md:grid md:grid-cols-[minmax(0,1fr)_230px] lg:grid-cols-[minmax(0,1fr)_230px_auto_auto]"
      >
        <div>
          <label htmlFor="desktop-q" className="field-label">
            ค้นหาสินค้าหรือร้านค้า
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-3.5 size-5 text-muted-foreground"
            />
            <Input
              id="desktop-q"
              name="q"
              type="search"
              maxLength={100}
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="ค้นหาของดีที่คุณสนใจ…"
              className="pl-10"
            />
          </div>
        </div>
        {fields("desktop")}
        <Button type="submit">ค้นหา</Button>
      </form>
      <div className="md:hidden">
        <form action="/products" method="GET" className="flex gap-2">
          <label htmlFor="mobile-q" className="sr-only">
            ค้นหาสินค้าหรือร้านค้า
          </label>
          <Input
            id="mobile-q"
            type="search"
            name="q"
            maxLength={100}
            value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="ค้นหาสินค้าหรือร้านค้า…"
          />
          <input type="hidden" name="category" value={categoryId ?? ""} />
          {inStock && <input type="hidden" name="stock" value="1" />}
          <Button type="submit" aria-label="ค้นหา">
            <Search aria-hidden="true" className="size-5" />
          </Button>
        </form>
        <div className="mt-3 flex items-center justify-between gap-3">
          <Sheet
            title="กรองสินค้า"
            description="เลือกหมวดหมู่และความพร้อมจำหน่าย"
            open={open}
            onOpenChange={setOpen}
            trigger={
              <Button variant="secondary">
                <SlidersHorizontal aria-hidden="true" className="size-4" />
                ตัวกรอง
                {filterCount > 0 && (
                  <span className="rounded-full bg-primary px-1.5 text-xs text-white">
                    {filterCount}
                  </span>
                )}
              </Button>
            }
          >
            <form action="/products" method="GET" className="space-y-5">
              <input type="hidden" name="q" value={searchDraft} />
              {fields("mobile")}
              <Button type="submit" className="w-full">
                แสดงสินค้า
              </Button>
              <Link
                href="/products"
                onClick={() => setOpen(false)}
                className="btn btn-ghost w-full"
              >
                ล้างตัวกรองทั้งหมด
              </Link>
            </form>
          </Sheet>
          <span className="text-xs text-muted-foreground">
            เลือกสิ่งที่ใช่สำหรับคุณ
          </span>
        </div>
      </div>
      {(search || filterCount > 0) && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            {search ? `คำค้นหา “${search}”` : "กำลังแสดงสินค้าตามตัวกรอง"}
          </p>
          <Link
            href="/products"
            className="inline-flex min-h-11 items-center text-xs font-semibold text-primary"
          >
            ล้างตัวกรอง
          </Link>
        </div>
      )}
    </div>
  );
}

