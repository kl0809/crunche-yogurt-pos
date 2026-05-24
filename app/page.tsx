"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

type PaymentMethod = "Cash" | "DuitNow" | "TNG";

type CartItem = {
  id: number;
  name: string;
  price: number;
  cost: number;
  quantity: number;
};

type Order = {
  id: number;
  total: number;
  profit: number;
  paymentMethod: PaymentMethod;
  items: CartItem[];
};

type Expense = {
  id: number;
  name: string;
  amount: number;
};

type Product = {
  id: number;
  name: string;
  price: number;
  cost: number;
};

type RawMaterial = {
  id: number;
  name: string;
  stock_quantity: number;
  unit: string;
  low_stock_alert: number;
};

export default function Home() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filter, setFilter] = useState<"today" | "yesterday" | "all">("today");
  const [products, setProducts] = useState<Product[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [stockAmount, setStockAmount] = useState("");

  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCost, setProductCost] = useState("");
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (!checkingAuth) {
      loadData();
    }
  }, [filter]);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.push("/login");
      return;
    }

    setCheckingAuth(false);
    loadData();
  }

  function getYesterdayRange() {
    const start = new Date();
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }

    function getTodayRange() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }

  async function loadData() {
    const { data: productsData } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: true });

    if (productsData) {
      setProducts(
        productsData.map((product) => ({
          id: product.id,
          name: product.name,
          price: Number(product.price),
          cost: Number(product.cost),
        }))
      );
    }
    const { data: rawMaterialsData } = await supabase
      .from("raw_materials")
      .select("*")
      .order("id", { ascending: true });

    if (rawMaterialsData) {
      setRawMaterials(
        rawMaterialsData.map((material) => ({
          id: material.id,
          name: material.name,
          stock_quantity: Number(material.stock_quantity),
          unit: material.unit,
          low_stock_alert: Number(material.low_stock_alert),
        }))
      );
    }
    let start = "";
    let end = "";

    if (filter === "today") {
      const range = getTodayRange();
      start = range.start;
      end = range.end;
    }

    if (filter === "yesterday") {
      const range = getYesterdayRange();
      start = range.start;
      end = range.end;
    }

    let ordersQuery = supabase
      .from("orders")
      .select("id,total,profit,payment_method,created_at,order_items(*)")
      .order("id", { ascending: false });

    if (filter !== "all") {
      ordersQuery = ordersQuery
        .gte("created_at", start)
        .lte("created_at", end);
    }

    const { data: ordersData } = await ordersQuery;

    let expensesQuery = supabase
      .from("expenses")
      .select("*")
      .order("id", { ascending: false });

    if (filter !== "all") {
      expensesQuery = expensesQuery
        .gte("created_at", start)
        .lte("created_at", end);
    }

    const { data: expensesData } = await expensesQuery;

      if (ordersData) {
        setOrders(
          ordersData.map((order: any) => ({
            id: order.id,
            total: Number(order.total),
            profit: Number(order.profit),
            paymentMethod: order.payment_method,
            items: order.order_items.map((item: any) => ({
              id: item.id,
              name: item.product_name,
              price: Number(item.price),
              cost: Number(item.cost),
              quantity: item.quantity,
            })),
          }))
        );
      }

      if (expensesData) {
        setExpenses(
          expensesData.map((expense: any) => ({
            id: expense.id,
            name: expense.name,
            amount: Number(expense.amount),
          }))
        );
      }
    }
    async function addProduct() {
        const price = Number(productPrice);
        const cost = Number(productCost);

        if (!productName || price <= 0 || cost < 0) return;

        const { error } = editingProductId
          ? await supabase
              .from("products")
              .update({
                name: productName,
                price,
                cost,
              })
              .eq("id", editingProductId)
          : await supabase.from("products").insert([
              {
                name: productName,
                price,
                cost,
              },
            ]);

        if (error) {
          console.error(error);
          return;
        }

        setProductName("");
        setProductPrice("");
        setProductCost("");
        setEditingProductId(null);

        await loadData();
      }

  const todaySales = orders.reduce((sum, order) => sum + order.total, 0);
  const todayProfit = orders.reduce((sum, order) => sum + order.profit, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const netProfit = todayProfit - totalExpenses;
  function formatMoney(amount: number) {
    return amount.toFixed(2);
  }

  const productSales: Record<string, number> = {};

  orders.forEach((order) => {
    order.items.forEach((item) => {
      productSales[item.name] =
        (productSales[item.name] || 0) + item.quantity;
    });
  });

  const bestSeller =
    Object.entries(productSales).sort(
      (a, b) => b[1] - a[1]
    )[0];

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const profit = cart.reduce(
    (sum, item) => sum + (item.price - item.cost) * item.quantity,
    0
  );

  function addToCart(product: (typeof products)[0]) {
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  }
  async function deleteProduct(id: number) {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      return;
    }

    await loadData();
  }
    function startEditProduct(product: Product) {
    setEditingProductId(product.id);
    setProductName(product.name);
    setProductPrice(String(product.price));
    setProductCost(String(product.cost));
  }

  function decreaseQuantity(productId: number) {
    setCart(
      cart
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  async function checkout() {
    if (cart.length === 0) return;

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          total,
          profit,
          payment_method: paymentMethod,
        },
      ])
      .select()
      .single();

    if (orderError) {
      console.error(orderError);
      return;
    }

    const { error: itemError } = await supabase.from("order_items").insert(
      cart.map((item) => ({
        order_id: orderData.id,
        product_name: item.name,
        price: item.price,
        cost: item.cost,
        quantity: item.quantity,
      }))
    );

    if (itemError) {
      console.error(itemError);
      return;
    }

    setCart([]);
    await loadData();
  }

  async function addExpense() {
    const amount = Number(expenseAmount);

    if (!expenseName || amount <= 0) return;

    const { error } = await supabase.from("expenses").insert([
      {
        name: expenseName,
        amount,
      },
    ]);

    if (error) {
      console.error(error);
      return;
    }

    setExpenseName("");
    setExpenseAmount("");
    await loadData();
  }

  async function addStock() {
    const amount = Number(stockAmount);
    const materialId = Number(selectedMaterialId);

    if (!materialId || amount <= 0) return;

    const material = rawMaterials.find((item) => item.id === materialId);

    if (!material) return;

    const newStock = material.stock_quantity + amount;

    const { error } = await supabase
      .from("raw_materials")
      .update({
        stock_quantity: newStock,
      })
      .eq("id", materialId);

    if (error) {
      console.error(error);
      return;
    }

    setSelectedMaterialId("");
    setStockAmount("");

    await loadData();
  }

  if (checkingAuth) {
  return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold mb-4">Crunché Yogurt POS 🍦</h1>
      <div className="flex gap-2 mb-6">
        <button onClick={() => setFilter("today")} className="bg-blue-600 px-4 py-2 rounded-xl">
          Today
        </button>

        <button onClick={() => setFilter("yesterday")} className="bg-yellow-600 px-4 py-2 rounded-xl">
          Yesterday
        </button>

        <button onClick={() => setFilter("all")} className="bg-gray-600 px-4 py-2 rounded-xl">
          All Time
        </button>
      </div>

      <div className="mb-8 grid grid-cols-4 gap-4">
        <div className="border p-4 rounded-2xl">
          <p className="text-gray-400">Today Sales</p>
          <p className="text-2xl font-bold">RM {formatMoney(todaySales)}</p>
        </div>

        <div className="border p-4 rounded-2xl">
          <p className="text-gray-400">Gross Profit</p>
          <p className="text-2xl font-bold">RM {formatMoney(todayProfit)}</p>
        </div>

        <div className="border p-4 rounded-2xl">
          <p className="text-gray-400">Expenses</p>
          <p className="text-2xl font-bold">RM {formatMoney(totalExpenses)}</p>
        </div>

        <div className="border p-4 rounded-2xl">
          <p className="text-gray-400">Net Profit</p>
          <p className="text-2xl font-bold">RM {formatMoney(netProfit)}</p>
        </div>
        <div className="border p-4 rounded-2xl">
          <p className="text-gray-400">
            Best Seller
          </p>

          <h2 className="text-3xl font-bold">
            {bestSeller
              ? `${bestSeller[0]} (${bestSeller[1]})`
              : "No Sales"}
          </h2>
        </div>
      </div>
      <div className="mb-8 border p-6 rounded-2xl">
  <h2 className="text-2xl font-bold">Inventory</h2>
  <div className="mt-4 flex gap-4 flex-wrap">
    <select
      value={selectedMaterialId}
      onChange={(e) => setSelectedMaterialId(e.target.value)}
      className="bg-white text-black px-4 py-2 rounded-xl"
    >
      <option value="">Select material</option>

      {rawMaterials.map((material) => (
        <option key={material.id} value={material.id}>
          {material.name}
        </option>
      ))}
    </select>

    <input
      value={stockAmount}
      onChange={(e) => setStockAmount(e.target.value)}
      placeholder="Amount to add"
      type="number"
      className="bg-white text-black px-4 py-2 rounded-xl"
    />

    <button
      onClick={addStock}
      className="bg-green-600 text-white px-4 py-2 rounded-xl"
    >
      Add Stock
    </button>
  </div>

  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      {rawMaterials.map((material) => (
        <div key={material.id} className="border p-4 rounded-xl">
          <p className="font-bold">{material.name}</p>

          <p className="text-xl mt-2">
            {material.stock_quantity} {material.unit}
          </p>

          {material.stock_quantity <= material.low_stock_alert && (
            <p className="text-red-400 mt-2">Low stock warning</p>
          )}
        </div>
      ))}
    </div>
  </div>
      <div className="mb-8 border p-6 rounded-2xl">
        <h2 className="text-2xl font-bold">Add Product</h2>

        <div className="mt-4 flex gap-4">
          <input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Product name"
            className="bg-white text-black px-4 py-2 rounded-xl"
          />

          <input
            value={productPrice}
            onChange={(e) => setProductPrice(e.target.value)}
            placeholder="Price"
            type="number"
            className="bg-white text-black px-4 py-2 rounded-xl"
          />

          <input
            value={productCost}
            onChange={(e) => setProductCost(e.target.value)}
            placeholder="Cost"
            type="number"
            className="bg-white text-black px-4 py-2 rounded-xl"
          />

          <button
            onClick={addProduct}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl"
          >
            {editingProductId ? "Update Product" : "Add Product"}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {products.map((product) => (
          <div key={product.id} className="border p-4 rounded-2xl">
            <h2 className="text-2xl font-semibold">{product.name}</h2>
            <p className="mt-2 text-gray-400">Price: RM {product.price}</p>
            <p className="text-gray-400">Cost: RM {product.cost}</p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => addToCart(product)}
                className="mt-4 bg-white text-black px-4 py-2 rounded-xl"
              >
                Add Order
              </button>

              <button
                onClick={() => startEditProduct(product)}
                className="mt-2 bg-yellow-500 text-black px-4 py-2 rounded-xl"
              >
                Edit
              </button>

              <button
                onClick={() => deleteProduct(product.id)}
                className="mt-2 bg-red-500 text-white px-4 py-2 rounded-xl"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 border p-6 rounded-2xl">
        <h2 className="text-2xl font-bold">Current Order</h2>

        {cart.map((item) => (
          <div
            key={item.id}
            className="mt-4 flex items-center justify-between border-b pb-3"
          >
            <div>
              <p className="font-semibold">{item.name}</p>
              <p className="text-gray-400">
                RM {item.price} × {item.quantity}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => decreaseQuantity(item.id)}
                className="bg-red-500 px-3 py-1 rounded-lg"
              >
                -
              </button>

              <span>{item.quantity}</span>

              <button
                onClick={() => addToCart(item)}
                className="bg-green-500 px-3 py-1 rounded-lg"
              >
                +
              </button>
            </div>
          </div>
        ))}

        <h3 className="mt-6 text-3xl font-bold">Total: RM {total}</h3>
        <h3 className="mt-2 text-2xl font-bold">Profit: RM {profit}</h3>

        <div className="mt-6">
          <p className="mb-2 font-semibold">Payment Method</p>

          <select
            value={paymentMethod}
            onChange={(e) =>
              setPaymentMethod(e.target.value as PaymentMethod)
            }
            className="bg-white text-black px-4 py-2 rounded-xl"
          >
            <option value="Cash">Cash</option>
            <option value="DuitNow">DuitNow</option>
            <option value="TNG">TNG</option>
          </select>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={() => setCart([])}
            className="bg-red-500 text-white px-4 py-2 rounded-xl"
          >
            Clear Order
          </button>

          <button
            onClick={checkout}
            className="bg-green-600 text-white px-4 py-2 rounded-xl"
          >
            Checkout
          </button>
        </div>
      </div>

      <div className="mt-10 border p-6 rounded-2xl">
        <h2 className="text-2xl font-bold">Expenses</h2>

        <div className="mt-4 flex gap-4">
          <input
            value={expenseName}
            onChange={(e) => setExpenseName(e.target.value)}
            placeholder="Expense name"
            className="bg-white text-black px-4 py-2 rounded-xl"
          />

          <input
            value={expenseAmount}
            onChange={(e) => setExpenseAmount(e.target.value)}
            placeholder="Amount"
            type="number"
            className="bg-white text-black px-4 py-2 rounded-xl"
          />

          <button
            onClick={addExpense}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl"
          >
            Add Expense
          </button>
        </div>

        {expenses.map((expense) => (
          <div key={expense.id} className="mt-4 border-t pt-4">
            <p>
              {expense.name} - RM {expense.amount}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 border p-6 rounded-2xl">
        <h2 className="text-2xl font-bold">Today Orders</h2>

        {orders.length === 0 && (
          <p className="mt-4 text-gray-400">No orders yet.</p>
        )}

        <div className="mt-4 space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border p-4 rounded-xl"
            >
              <div className="flex justify-between">
                <h3 className="font-bold">
                  Order #{order.id}
                </h3>

                <p className="text-sm text-gray-400">
                  {new Date().toLocaleTimeString()}
                </p>
              </div>

              <p className="mt-2">
                Payment: {order.paymentMethod}
              </p>

              <p>
                Total: RM {formatMoney(order.total)}
              </p>

              <p>
                Profit: RM {formatMoney(order.profit)}
              </p>

              <div className="mt-2">
                <p className="font-semibold">
                  Items:
                </p>

                {order.items.map((item, index) => (
                  <p key={index}>
                    {item.name} x {item.quantity}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}