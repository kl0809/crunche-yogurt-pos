"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/navbar";
import { supabase } from "../../lib/supabase";

type RawMaterial = {
  id: number;
  name: string;
  stock_quantity: number;
  unit: string;
  low_stock_alert: number;
};

export default function InventoryPage() {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [stockAmount, setStockAmount] = useState("");
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
    checkUser();
    }, []);

    useEffect(() => {
    if (!checkingAuth) {
        loadRawMaterials();
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

  async function loadRawMaterials() {
    const { data } = await supabase
      .from("raw_materials")
      .select("*")
      .order("id", { ascending: true });

    if (data) {
      setRawMaterials(
        data.map((material) => ({
          id: material.id,
          name: material.name,
          stock_quantity: Number(material.stock_quantity),
          unit: material.unit,
          low_stock_alert: Number(material.low_stock_alert),
        }))
      );
    }
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

    await loadRawMaterials();
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

      <h1 className="text-4xl font-bold mb-6">Inventory</h1>

      <div className="border p-6 rounded-2xl">
        <h2 className="text-2xl font-bold">Add Stock</h2>

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
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
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
    </main>
  );
}