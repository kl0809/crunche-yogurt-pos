"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/navbar";
import { supabase } from "../../lib/supabase";

type Event = {
  id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;

  revenue?: number;
  expenses?: number;
  netProfit?: number;
  orderCount?: number;
  roi?: number;
  itemsSold?: number;
  averageOrder?: number;
  bestSeller?: string;
};

export default function EventsPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventName, setEventName] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [editingEventId, setEditingEventId] = useState<number | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (!checkingAuth) {
      loadEvents();
    }
  }, [checkingAuth]);

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
      const eventsWithSummary = await Promise.all(
        data.map(async (event) => {
            const { data: orders } = await supabase
            .from("orders")
            .select("total,profit,id")
            .eq("event_id", event.id);

            const { data: orderItems } = await supabase
            .from("order_items")
            .select("product_name,quantity,order_id");

            const { data: expenses } = await supabase
            .from("expenses")
            .select("amount,cost_type")
            .eq("event_id", event.id);

            const revenue =
            orders?.reduce(
                (sum, order) => sum + Number(order.total),
                0
            ) || 0;

            const grossProfit =
            orders?.reduce(
                (sum, order) => sum + Number(order.profit),
                0
            ) || 0;

            const consumableExpenses =
            expenses
                ?.filter(
                (expense) =>
                    expense.cost_type === "Consumable"
                )
                .reduce(
                (sum, expense) =>
                    sum + Number(expense.amount),
                0
                ) || 0;

            const eventOrderIds =
                orders?.map((order) => order.id) || [];

                const eventItems =
                orderItems?.filter((item) =>
                    eventOrderIds.includes(item.order_id)
                ) || [];

                const itemsSold = eventItems.reduce(
                (sum, item) => sum + item.quantity,
                0
                );

                const averageOrder =
                orders && orders.length > 0
                    ? revenue / orders.length
                    : 0;

                const roi =
                consumableExpenses > 0
                    ? ((grossProfit - consumableExpenses) /
                        consumableExpenses) *
                    100
                    : 0;

                const productSales: Record<string, number> = {};

                eventItems.forEach((item) => {
                productSales[item.product_name] =
                    (productSales[item.product_name] || 0) +
                    item.quantity;
                });

                const bestSeller =
                Object.entries(productSales).sort(
                    (a, b) => b[1] - a[1]
                )[0]?.[0] || "No Sales";

            return {
                ...event,
                revenue,
                expenses: consumableExpenses,
                netProfit: grossProfit - consumableExpenses,
                orderCount: orders?.length || 0,
                roi,
                itemsSold,
                averageOrder,
                bestSeller,
            };
        })
        );

        setEvents(eventsWithSummary);
    }
  }

   async function saveEvent() {
    if (!eventName) return;

    const { error } = editingEventId
        ? await supabase
            .from("events")
            .update({
            name: eventName,
            start_date: eventStartDate || null,
            end_date: eventEndDate || null,
            })
            .eq("id", editingEventId)
        : await supabase.from("events").insert([
            {
            name: eventName,
            start_date: eventStartDate || null,
            end_date: eventEndDate || null,
            },
        ]);

    if (error) {
        console.error(error);
        return;
    }

    setEventName("");
    setEventStartDate("");
    setEventEndDate("");
    setEditingEventId(null);

    await loadEvents();
    }

    function startEditEvent(event: Event) {
        setEditingEventId(event.id);
        setEventName(event.name);
        setEventStartDate(event.start_date || "");
        setEventEndDate(event.end_date || "");
    }

    async function deleteEvent(id: number) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this event?"
        );

        if (!confirmed) return;

        const { data: ordersData } = await supabase
            .from("orders")
            .select("id")
            .eq("event_id", id)
            .limit(1);

        const { data: expensesData } = await supabase
            .from("expenses")
            .select("id")
            .eq("event_id", id)
            .limit(1);

        if ((ordersData && ordersData.length > 0) || (expensesData && expensesData.length > 0)) {
            alert("This event has orders or expenses. You cannot delete it.");
            return;
        }

        const { error } = await supabase
            .from("events")
            .delete()
            .eq("id", id);

        if (error) {
            console.error(error);
            return;
        }

        await loadEvents();
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

      <h1 className="text-4xl font-bold mb-6">Events</h1>
      <div className="border p-6 rounded-2xl">
        <h2 className="text-2xl font-bold">
            {editingEventId ? "Edit Event" : "Add Event"}
        </h2>

        <div className="mt-4 flex gap-4 flex-wrap">
            <input
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="Event name"
            className="bg-white text-black px-4 py-2 rounded-xl"
            />

            <input
            type="date"
            value={eventStartDate}
            onChange={(e) => setEventStartDate(e.target.value)}
            className="bg-white text-black px-4 py-2 rounded-xl"
            />

            <input
            type="date"
            value={eventEndDate}
            onChange={(e) => setEventEndDate(e.target.value)}
            className="bg-white text-black px-4 py-2 rounded-xl"
            />

            <button
            onClick={saveEvent}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl"
            >
            {editingEventId ? "Update Event" : "Add Event"}
            </button>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {events.map((event) => (
          <div key={event.id} className="border p-4 rounded-xl">
            <p className="font-semibold text-xl">{event.name}</p>

            <p className="text-gray-400">
              {event.start_date || "No start date"} to{" "}
              {event.end_date || "No end date"}
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="border p-3 rounded-xl">
                    <p className="text-gray-400 text-sm">Revenue</p>
                    <p className="text-xl font-bold">
                    RM {(event.revenue || 0).toFixed(2)}
                    </p>
                </div>

                <div className="border p-3 rounded-xl">
                    <p className="text-gray-400 text-sm">Expenses</p>
                    <p className="text-xl font-bold">
                    RM {(event.expenses || 0).toFixed(2)}
                    </p>
                </div>

                <div className="border p-3 rounded-xl">
                    <p className="text-gray-400 text-sm">Net Profit</p>
                    <p className="text-xl font-bold">
                    RM {(event.netProfit || 0).toFixed(2)}
                    </p>
                </div>

                <div className="border p-3 rounded-xl">
                    <p className="text-gray-400 text-sm">Orders</p>
                    <p className="text-xl font-bold">
                    {event.orderCount || 0}
                    </p>
                </div>

                <div className="border p-3 rounded-xl">
                    <p className="text-gray-400 text-sm">ROI</p>
                    <p className="text-xl font-bold">
                        {(event.roi || 0).toFixed(1)}%
                    </p>
                </div>

                    <div className="border p-3 rounded-xl">
                    <p className="text-gray-400 text-sm">Items Sold</p>
                    <p className="text-xl font-bold">
                        {event.itemsSold || 0}
                    </p>
                </div>

                    <div className="border p-3 rounded-xl">
                    <p className="text-gray-400 text-sm">Average Order</p>
                    <p className="text-xl font-bold">
                        RM {(event.averageOrder || 0).toFixed(2)}
                    </p>
                </div>

                    <div className="border p-3 rounded-xl">
                    <p className="text-gray-400 text-sm">Best Seller</p>
                    <p className="text-xl font-bold">
                        {event.bestSeller || "No Sales"}
                    </p>
                </div>
            </div>
            <div className="flex gap-2 mt-4">
                <a
                    href={`/events/${event.id}`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl"
                    >
                    View Details
                </a>
                <button
                    onClick={() => startEditEvent(event)}
                    className="bg-yellow-500 text-black px-4 py-2 rounded-xl"
                >
                    Edit
                </button>

                <button
                    onClick={() => deleteEvent(event.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-xl"
                >
                    Delete
                </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}