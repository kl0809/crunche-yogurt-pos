"use client";

import Navbar from "../../components/navbar";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function SamplingPage() {

    const [events, setEvents] = useState<any[]>([]);
    const [materials, setMaterials] = useState<any[]>([]);

    const [selectedEventId, setSelectedEventId] = useState("");
    const [selectedMaterialId, setSelectedMaterialId] = useState("");
    const [quantityUsed, setQuantityUsed] = useState("");
    const [note, setNote] = useState("");
    const [samplingLogs, setSamplingLogs] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const { data: eventsData } = await supabase
            .from("events")
            .select("*")
            .order("id", { ascending: false });

        if (eventsData) {
            setEvents(eventsData);
        }

        const { data: materialsData } = await supabase
            .from("raw_materials")
            .select("*")
            .order("name");

        if (materialsData) {
            setMaterials(materialsData);
            
        }
        const { data: logsData } = await supabase
            .from("sampling_logs")
            .select("*")
            .order("id", { ascending: false });

            if (logsData) {
            setSamplingLogs(logsData);
        }
    }
    async function saveSampling() {
        const eventId = Number(selectedEventId);
        const materialId = Number(selectedMaterialId);
        const quantity = Number(quantityUsed);

        if (!eventId || !materialId || quantity <= 0) {
            return;
        }

        const { error } = await supabase
            .from("sampling_logs")
            .insert([
            {
                event_id: eventId,
                raw_material_id: materialId,
                quantity_used: quantity,
                note,
            },
            ]);

        if (error) {
            console.error(error);
            return;
        }

        const selectedMaterial = materials.find(
            (material) => material.id === materialId
        );

        if (!selectedMaterial) return;

        const newStock =
            Number(selectedMaterial.stock_quantity) - quantity;

        const { error: stockError } = await supabase
            .from("raw_materials")
            .update({
                stock_quantity: newStock,
        })
        .eq("id", materialId);

        if (stockError) {
            console.error(stockError);
            return;
        }

        alert("Sampling saved!");

        setSelectedMaterialId("");
        setQuantityUsed("");
        setNote("");
        await loadData();
    }

    async function deleteSampling(log: any) {
    const confirmed = window.confirm(
        "Are you sure you want to delete this sampling record?"
    );

    if (!confirmed) return;

    const material = materials.find(
        (item) => item.id === log.raw_material_id
    );

    if (!material) return;

    const restoredStock =
        Number(material.stock_quantity) +
        Number(log.quantity_used);

    const { error: stockError } = await supabase
        .from("raw_materials")
        .update({
        stock_quantity: restoredStock,
        })
        .eq("id", log.raw_material_id);

    if (stockError) {
        console.error(stockError);
        return;
    }

    const { error } = await supabase
        .from("sampling_logs")
        .delete()
        .eq("id", log.id);

    if (error) {
        console.error(error);
        return;
    }

        await loadData();
    }
  return (
    <main className="min-h-screen bg-black text-white p-10">
      <Navbar />

      <h1 className="text-4xl font-bold mb-6">
        Sampling / Tasting
      </h1>

      <p className="text-gray-400">
        Record tasting materials used for each event.
      </p>
      <div className="mt-8 border p-6 rounded-2xl">
        <h2 className="text-2xl font-bold mb-4">
            Add Sampling Usage
        </h2>

        <div className="flex gap-4 flex-wrap">
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

            <select
            value={selectedMaterialId}
            onChange={(e) => setSelectedMaterialId(e.target.value)}
            className="bg-white text-black px-4 py-2 rounded-xl"
            >
            <option value="">Select material</option>

            {materials.map((material) => (
                <option key={material.id} value={material.id}>
                {material.name} ({material.unit})
                </option>
            ))}
            </select>

            <input
            value={quantityUsed}
            onChange={(e) => setQuantityUsed(e.target.value)}
            placeholder="Quantity used"
            type="number"
            className="bg-white text-black px-4 py-2 rounded-xl"
            />

            <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note"
            className="bg-white text-black px-4 py-2 rounded-xl"
            />

            <button
                onClick={saveSampling}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl"
                >
                Save Sampling
            </button>
        </div>
        </div>
        <div className="mt-8 border p-6 rounded-2xl">
            <h2 className="text-2xl font-bold mb-4">
                Sampling History
            </h2>

            {samplingLogs.length === 0 && (
                <p className="text-gray-400">
                No sampling records yet.
                </p>
            )}

            <div className="space-y-3">
                {samplingLogs.map((log) => (
                <div
                    key={log.id}
                    className="border p-3 rounded-xl"
                >   
                    <p className="text-gray-400 text-sm">
                        Event:{" "}
                        {
                            events.find(
                            (event) => event.id === log.event_id
                            )?.name || "Unknown Event"
                        }
                    </p>
                    <p className="font-semibold">
                    {
                        materials.find(
                        (material) => material.id === log.raw_material_id
                        )?.name || "Unknown Material"
                    }
                    </p>

                    <p>
                    Quantity: {log.quantity_used}{" "}
                    {
                        materials.find(
                        (material) => material.id === log.raw_material_id
                        )?.unit || ""
                    }
                    </p>

                    {log.note && (
                    <p className="text-gray-400">
                        Note: {log.note}
                    </p>
                    )}

                    <button
                        onClick={() => deleteSampling(log)}
                        className="mt-3 bg-red-500 text-white px-4 py-2 rounded-xl"
                        >
                        Delete
                    </button>
                </div>
                ))}
            </div>
        </div>
    </main>
  );
}