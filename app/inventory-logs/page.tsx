"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/navbar";
import { supabase } from "../../lib/supabase";

type InventoryLog = {
  id: number;
  material_id: number | null;
  change_amount: number;
  log_type: string;
  reference_id: number | null;
  note: string | null;
  created_at: string;
};

type RawMaterial = {
  id: number;
  name: string;
  unit: string;
};

export default function InventoryLogsPage() {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: logsData } = await supabase
      .from("inventory_logs")
      .select("*")
      .order("id", { ascending: false });

    if (logsData) {
      setLogs(
        logsData.map((log) => ({
          id: log.id,
          material_id: log.material_id,
          change_amount: Number(log.change_amount),
          log_type: log.log_type,
          reference_id: log.reference_id,
          note: log.note,
          created_at: log.created_at,
        }))
      );
    }

    const { data: materialsData } = await supabase
      .from("raw_materials")
      .select("id,name,unit");

    if (materialsData) {
      setMaterials(materialsData);
    }
  }

  function getMaterialName(materialId: number | null) {
    if (!materialId) return "Unknown Material";

    return (
      materials.find((material) => material.id === materialId)?.name ||
      "Unknown Material"
    );
  }

  function getMaterialUnit(materialId: number | null) {
    if (!materialId) return "";

    return (
      materials.find((material) => material.id === materialId)?.unit || ""
    );
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString();
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <Navbar />

      <h1 className="text-4xl font-bold mb-6">
        Inventory Logs
      </h1>

      {logs.length === 0 && (
        <p className="text-gray-400">
          No inventory logs yet.
        </p>
      )}

      <div className="space-y-4">
        {logs.map((log) => (
          <div key={log.id} className="border p-4 rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
              <div>
                <p className="text-gray-400 text-sm">
                  Material
                </p>
                <p className="font-bold">
                  {getMaterialName(log.material_id)}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-sm">
                  Change
                </p>
                <p
                  className={
                    log.change_amount >= 0
                      ? "text-green-400 font-bold"
                      : "text-red-400 font-bold"
                  }
                >
                  {log.change_amount > 0 ? "+" : ""}
                  {log.change_amount} {getMaterialUnit(log.material_id)}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-sm">
                  Type
                </p>
                <p className="font-bold">
                  {log.log_type}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-sm">
                  Reference
                </p>
                <p>
                  {log.reference_id ? `#${log.reference_id}` : "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-sm">
                  Date
                </p>
                <p>
                  {formatDate(log.created_at)}
                </p>
              </div>
            </div>

            {log.note && (
              <p className="text-gray-400 mt-3">
                Note: {log.note}
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}