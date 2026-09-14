export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col justify-between gap-4 md:flex-row">
          <div>
            <h2 className="font-bold">
              Community Enterprise Market
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              ตลาดวิสาหกิจชุมชน อำเภอนิคมพัฒนา จังหวัดระยอง
            </p>
          </div>

          <p className="text-sm text-gray-500">
            © 2026 Community Enterprise Market
          </p>
        </div>
      </div>
    </footer>
  );
}