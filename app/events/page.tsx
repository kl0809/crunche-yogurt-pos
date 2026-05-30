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
      setEvents(data);
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
            <div className="flex gap-2 mt-4">
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