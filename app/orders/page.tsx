"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/navbar";
import { supabase } from "../../lib/supabase";

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
  status: string;
  items: CartItem[];
};

type Event = {
  id: number;
  name: string;
};

type Product = {
  id: number;
  name: string;
};

type Recipe = {
  id: number;
  product_id: number;
  raw_material_id: number;
  quantity_used: number;
  is_optional: boolean;
};

export default function OrdersPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

    useEffect(() => {
    checkUser();
    }, []);

    useEffect(() => {
      if (!checkingAuth) {
          loadEvents();
          loadProducts();
          loadRecipes();
      }
    }, [checkingAuth]);

  useEffect(() => {
    if (selectedEventId) {
      loadOrders();
    }
  }, [selectedEventId]);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
        router.push("/login");
        return;
    }

    setCheckingAuth(false);
    }

  async function loadEvents() {
    const { data } = await supabase
      .from("events")
      .select("*")
      .order("id", { ascending: false });

    if (data) {
      setEvents(data);

      if (data.length > 0) {
        setSelectedEventId(String(data[0].id));
      }
    }
  }

  async function loadProducts() {
    const { data } = await supabase
      .from("products")
      .select("id,name");

    if (data) {
      setProducts(data);
    }
  }

  async function loadRecipes() {
    const { data } = await supabase
      .from("recipes")
      .select("id,product_id,raw_material_id,quantity_used,is_optional");

    if (data) {
      setRecipes(
        data.map((recipe) => ({
          id: recipe.id,
          product_id: recipe.product_id,
          raw_material_id: recipe.raw_material_id,
          quantity_used: Number(recipe.quantity_used),
          is_optional: Boolean(recipe.is_optional),
        }))
      );
    }
  }

  async function loadOrders() {
    const { data } = await supabase
      .from("orders")
      .select("id,total,profit,payment_method,status,created_at,order_items(*)")
      .eq("event_id", Number(selectedEventId))
      .order("id", { ascending: false });

    if (data) {
      setOrders(
        data.map((order: any) => ({
          id: order.id,
          total: Number(order.total),
          profit: Number(order.profit),
          paymentMethod: order.payment_method,
          status: order.status || "COMPLETED",
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
  }

  function formatMoney(amount: number) {
    return amount.toFixed(2);
  }
  

  async function voidOrder(order: Order) {
    if (order.status === "VOID") {
      alert("This order has already been voided.");
      return;
    }
    const confirmed = window.confirm(
      `Are you sure you want to void Order #${order.id}?`
    );

    if (!confirmed) return;

    for (const orderItem of order.items) {
      const product = products.find(
        (item) => item.name === orderItem.name
      );

      if (!product) continue;

      const productRecipes = recipes.filter(
        (recipe) =>
          recipe.product_id === product.id &&
          !recipe.is_optional
      );

      for (const recipe of productRecipes) {
        const { data: materialData, error: materialError } = await supabase
          .from("raw_materials")
          .select("stock_quantity")
          .eq("id", recipe.raw_material_id)
          .single();

        if (materialError || !materialData) {
          console.error(materialError);
          continue;
        }

        const quantityToRestore =
          recipe.quantity_used * orderItem.quantity;

        const newStock =
          Number(materialData.stock_quantity) + quantityToRestore;

        const { error: updateError } = await supabase
          .from("raw_materials")
          .update({
            stock_quantity: newStock,
          })
          .eq("id", recipe.raw_material_id);

        if (updateError) {
          console.error(updateError);
          continue;
        }

        const { error: logError } = await supabase
          .from("inventory_logs")
          .insert([
            {
              material_id: recipe.raw_material_id,
              change_amount: quantityToRestore,
              log_type: "ORDER_VOID",
              reference_id: order.id,
              note: `Void Order #${order.id}`,
            },
          ]);

        if (logError) {
          console.error(logError);
        }
      }
    }

    const { error } = await supabase
      .from("orders")
      .update({
        status: "VOID",
      })
      .eq("id", order.id);

    if (error) {
      console.error(error);
      return;
    }

    await loadOrders();
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

      <h1 className="text-4xl font-bold mb-6">Orders</h1>

      <div className="mb-6">
        <p className="mb-2 font-semibold">Select Event</p>

        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="bg-white text-black px-4 py-2 rounded-xl"
        >
          <option value="">Select event</option>

          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
      </div>

      {orders.length === 0 && (
        <p className="mt-4 text-gray-400">No orders yet.</p>
      )}

      <div className="mt-4 space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="border p-4 rounded-xl">
            <h3 className="font-bold">Order #{order.id}</h3>

            <p className="mt-2">Payment: {order.paymentMethod}</p>
            <p>Status: {order.status}</p>

            <p>Total: RM {formatMoney(order.total)}</p>

            <p>Profit: RM {formatMoney(order.profit)}</p>

            {order.status !== "VOID" && (
              <button
                onClick={() => voidOrder(order)}
                className="mt-3 bg-red-600 text-white px-4 py-2 rounded-xl"
              >
                Void Order
              </button>
            )}

            <div className="mt-2">
              <p className="font-semibold">Items:</p>

              {order.items.map((item, index) => (
                <p key={index}>
                  {item.name} x {item.quantity}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}