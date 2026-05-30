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
  
  async function addEvent() {
    if (!eventName) return;

    const { error } = await supabase.from("events").insert([
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

      <div className="mt-8 space-y-4">
        {events.map((event) => (
          <div key={event.id} className="border p-4 rounded-xl">
            <p className="font-semibold text-xl">{event.name}</p>

            <p className="text-gray-400">
              {event.start_date || "No start date"} to{" "}
              {event.end_date || "No end date"}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}