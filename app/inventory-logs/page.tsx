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
  const [filterType, setFilterType] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredLogs = logs.filter((log) => {
    const matchesType =
      filterType === "ALL" ||
      log.log_type === filterType;

    const materialName =
      getMaterialName(log.material_id).toLowerCase();

    const matchesSearch =
      materialName.includes(
        searchTerm.toLowerCase()
      );

    return matchesType && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <Navbar />

      <h1 className="text-4xl font-bold mb-6">
        Inventory Logs
      </h1>

      <div className="mb-6">
        <p className="mb-2 font-semibold">Filter by Type</p>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-white text-black px-4 py-2 rounded-xl"
        >
          <option value="ALL">All</option>
          <option value="ORDER">Order</option>
          <option value="ORDER_BAG">Order Bag</option>
          <option value="ORDER_VOID">Order Void</option>
          <option value="ADD_STOCK">Add Stock</option>
          <option value="SAMPLING">Sampling</option>
          <option value="SAMPLING_DELETE">Sampling Delete</option>
        </select>
      </div>

      <div className="mt-4 mb-6">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search material..."
          className="bg-white text-black px-4 py-2 rounded-xl w-full md:w-80"
        />
      </div>

      {filteredLogs.length === 0 && (
        <p className="text-gray-400">
          No inventory logs yet.
        </p>
      )}

      <div className="space-y-4">
        {filteredLogs.map((log) => (
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