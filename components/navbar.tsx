import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="mb-8 flex flex-wrap gap-3 border-b border-gray-700 pb-4">
      <Link
        href="/"
        className="bg-white text-black px-4 py-2 rounded-xl"
      >
        Dashboard
      </Link>

      <Link
        href="/products"
        className="bg-white text-black px-4 py-2 rounded-xl"
      >
        Products
      </Link>

      <Link
        href="/expenses"
        className="bg-white text-black px-4 py-2 rounded-xl"
      >
        Expenses
      </Link>

      <Link
        href="/inventory"
        className="bg-white text-black px-4 py-2 rounded-xl"
      >
        Inventory
      </Link>

      <Link
        href="/orders"
        className="bg-white text-black px-4 py-2 rounded-xl"
      >
        Orders
      </Link>
      <Link
        href="/recipes"
        className="bg-white text-black px-4 py-2 rounded-xl"
      >
        Recipes
      </Link>
      <Link
        href="/events"
        className="bg-white text-black px-4 py-2 rounded-xl"
      >
        Events
      </Link>

      <Link
        href="/sampling"
        className="bg-white text-black px-4 py-2 rounded-xl"
      >
        Sampling
      </Link>
    </nav>
  );
}