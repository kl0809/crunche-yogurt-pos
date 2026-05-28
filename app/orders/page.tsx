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
  items: CartItem[];
};

type Event = {
  id: number;
  name: string;
};

export default function OrdersPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
    checkUser();
    }, []);

    useEffect(() => {
    if (!checkingAuth) {
        loadEvents();
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

  async function loadOrders() {
    const { data } = await supabase
      .from("orders")
      .select("id,total,profit,payment_method,created_at,order_items(*)")
      .eq("event_id", Number(selectedEventId))
      .order("id", { ascending: false });

    if (data) {
      setOrders(
        data.map((order: any) => ({
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
  }

  function formatMoney(amount: number) {
    return amount.toFixed(2);
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

            <p>Total: RM {formatMoney(order.total)}</p>

            <p>Profit: RM {formatMoney(order.profit)}</p>

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