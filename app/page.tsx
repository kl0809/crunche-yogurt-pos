"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";

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
  category: string;
  cost_type: string;
  note: string | null;
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

type Event = {
  id: number;
  name: string;
};

export default function Home() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filter, setFilter] = useState<"today" | "yesterday" | "all">("today");
  const [products, setProducts] = useState<Product[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [eventName, setEventName] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  
  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (!checkingAuth) {
      loadProducts();
      loadData();
    }
  }, [filter, selectedEventId, checkingAuth]);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.push("/login");
      return;
    }

    setCheckingAuth(false);
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
  async function loadProducts() {
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
  }
  async function loadData() {
    const { data: eventsData } = await supabase
      .from("events")
      .select("*")
      .order("id", { ascending: false });

    if (eventsData) {
      setEvents(eventsData);
      if (
        !selectedEventId &&
        eventsData.length > 0
      ) {
        setSelectedEventId(
          String(eventsData[0].id)
        );
        return;
      }
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
      .eq("event_id", Number(selectedEventId))
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
      .eq("event_id", Number(selectedEventId))
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
        expensesData.map((expense) => ({
          id: expense.id,
          name: expense.name,
          amount: Number(expense.amount),
          category: expense.category,
          cost_type: expense.cost_type,
          note: expense.note,
        }))
      );
    } else {
      setExpenses([]);
    }
  }

    const todaySales = orders.reduce((sum, order) => sum + order.total, 0);
    const todayProfit = orders.reduce((sum, order) => sum + order.profit, 0);

    const consumableCosts = expenses
      .filter((expense) => expense.cost_type === "Consumable")
      .reduce((sum, item) => sum + item.amount, 0);

    const reusablePurchases = expenses
      .filter((expense) => expense.cost_type === "Reusable")
      .reduce((sum, item) => sum + item.amount, 0);

    const netProfit = todayProfit - consumableCosts;
    const totalOrders = orders.length;
    const totalItemsSold = orders.reduce(
      (sum, order) =>
        sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );

    const profitMargin =
      todaySales > 0 ? (netProfit / todaySales) * 100 : 0;

    const roi =
      consumableCosts > 0 ? (netProfit / consumableCosts) * 100 : 0;

    const averageOrderValue =
      totalOrders > 0 ? todaySales / totalOrders : 0;
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
    if (cart.length === 0 || !selectedEventId) return;

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          total,
          profit,
          payment_method: paymentMethod,
          event_id: Number(selectedEventId),
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

  async function addEvent() {
    if (!eventName) return;

    const { error } = await supabase.from("events").insert([
      {
        name: eventName,
      },
    ]);

    if (error) {
      console.error(error);
      return;
    }

    setEventName("");
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
      <Navbar />

      <h1 className="text-4xl font-bold mb-4">Crunché Yogurt POS 🍦</h1>
      <div className="mb-6">
        <p className="mb-2 font-semibold">
          Current Event
        </p>

        <div className="flex gap-4 flex-wrap mb-4">
          <input
            value={eventName}
            onChange={(e) =>
              setEventName(e.target.value)
            }
            placeholder="New event name"
            className="bg-white text-black px-4 py-2 rounded-xl"
          />

          <button
            onClick={addEvent}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl"
          >
            Add Event
          </button>
        </div>

        <select
          value={selectedEventId}
          onChange={(e) =>
            setSelectedEventId(e.target.value)
          }
          className="bg-white text-black px-4 py-2 rounded-xl"
        >
          <option value="">
            Select event
          </option>

          {events.map((event) => (
            <option
              key={event.id}
              value={event.id}
            >
              {event.name}
            </option>
          ))}
        </select>
      </div>
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

      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="border p-4 rounded-2xl">
          <p className="text-gray-400">Today Sales</p>
          <p className="text-2xl font-bold">RM {formatMoney(todaySales)}</p>
        </div>

        <div className="border p-4 rounded-2xl">
          <p className="text-gray-400">Gross Profit</p>
          <p className="text-2xl font-bold">RM {formatMoney(todayProfit)}</p>
        </div>

        <div className="border p-4 rounded-2xl">
          <p className="text-gray-400">Consumable Costs</p>
          <p className="text-2xl font-bold">RM {formatMoney(consumableCosts)}</p>
        </div>

        <div className="border p-4 rounded-2xl">
          <p className="text-gray-400">Reusable Purchases</p>
          <p className="text-2xl font-bold">RM {formatMoney(reusablePurchases)}</p>
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
        <div className="border p-4 rounded-2xl">
          <p className="text-gray-400">Total Orders</p>
          <p className="text-2xl font-bold">{totalOrders}</p>
        </div>

        <div className="border p-4 rounded-2xl">
          <p className="text-gray-400">Items Sold</p>
          <p className="text-2xl font-bold">{totalItemsSold}</p>
        </div>

        <div className="border p-4 rounded-2xl">
          <p className="text-gray-400">Profit Margin</p>
          <p className="text-2xl font-bold">{profitMargin.toFixed(1)}%</p>
        </div>

        <div className="border p-4 rounded-2xl">
          <p className="text-gray-400">ROI</p>
          <p className="text-2xl font-bold">{roi.toFixed(1)}%</p>
        </div>

        <div className="border p-4 rounded-2xl">
          <p className="text-gray-400">Average Order</p>
          <p className="text-2xl font-bold">
            RM {formatMoney(averageOrderValue)}
          </p>
        </div>
      </div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Add Order</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="border p-4 rounded-2xl">
              <h3 className="text-2xl font-semibold">{product.name}</h3>

              <p className="mt-2 text-gray-400">
                Price: RM {formatMoney(product.price)}
              </p>

              <button
                onClick={() => addToCart(product)}
                className="mt-4 bg-white text-black px-4 py-2 rounded-xl"
              >
                Add Order
              </button>
            </div>
          ))}
        </div>
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
    </main>
  );
}