// src/app/search/page.tsx
import Link from "next/link";

const mock = [
  { id: "1", title: "BMW 3-Series 2016", price: 9800, mileage: 185_000 },
  { id: "2", title: "VW Golf 2018",      price: 8700, mileage: 150_000 },
  { id: "3", title: "Audi A4 2015",      price: 9200, mileage: 210_000 },
];

export default function SearchPage() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Фильтры (заглушка) */}
      <aside className="md:col-span-3 space-y-4">
        <h2 className="text-lg font-semibold">Filtrai</h2>
        <div className="space-y-3 rounded-lg border p-4 bg-white">
          <input
            type="text"
            placeholder="Markė / modelis"
            className="w-full rounded border px-3 py-2"
          />
          <div className="flex gap-3">
            <input type="number" placeholder="Kaina nuo" className="w-1/2 rounded border px-3 py-2" />
            <input type="number" placeholder="Kaina iki" className="w-1/2 rounded border px-3 py-2" />
          </div>
          <button className="w-full rounded-lg bg-black text-white py-2">Ieškoti</button>
        </div>
      </aside>

      {/* Результаты */}
      <div className="md:col-span-9 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Rezultatai</h1>
          <span className="text-sm text-gray-500">{mock.length} pasiūlymai</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mock.map((item) => (
            <Link
              key={item.id}
              href={`/listing/${item.id}`}
              className="rounded-lg border bg-white p-4 hover:shadow"
            >
              <div className="aspect-video w-full rounded bg-gray-100 mb-3" />
              <div className="font-semibold">{item.title}</div>
              <div className="text-gray-700">{item.price.toLocaleString()} €</div>
              <div className="text-gray-500 text-sm">Rida: {item.mileage.toLocaleString()} km</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
