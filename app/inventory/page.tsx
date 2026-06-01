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
  purchase_cost: number;
  purchase_quantity: number;
};

export default function InventoryPage() {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [stockAmount, setStockAmount] = useState("");
  const [newMaterialName, setNewMaterialName] = useState("");
  const [newMaterialUnit, setNewMaterialUnit] = useState("pcs");
  const [newMaterialAlert, setNewMaterialAlert] = useState("");
  const [newPurchaseCost, setNewPurchaseCost] = useState("");
  const [newPurchaseQuantity, setNewPurchaseQuantity] = useState(""); 
  const [editingMaterialId, setEditingMaterialId] = useState<number | null>(null);
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
          purchase_cost: Number(material.purchase_cost || 0),
          purchase_quantity: Number(material.purchase_quantity || 0),
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

    async function addMaterial() {
      const alertAmount = Number(newMaterialAlert);
      const purchaseCost = Number(newPurchaseCost);
      const purchaseQuantity = Number(newPurchaseQuantity);

      if (
        !newMaterialName ||
        !newMaterialUnit ||
        alertAmount < 0 ||
        purchaseCost < 0 ||
        purchaseQuantity < 0
      ) return;
      
        const { error } = editingMaterialId
            ? await supabase
                .from("raw_materials")
                .update({
                name: newMaterialName,
                unit: newMaterialUnit,
                low_stock_alert: alertAmount,
                purchase_cost: purchaseCost,
                purchase_quantity: purchaseQuantity,
                })
                .eq("id", editingMaterialId)
            : await supabase.from("raw_materials").insert([
                {
                name: newMaterialName,
                stock_quantity: 0,
                unit: newMaterialUnit,
                low_stock_alert: alertAmount,
                purchase_cost: purchaseCost,
                purchase_quantity: purchaseQuantity,
                },
            ]);

        if (error) {
            console.error(error);
            return;
        }

        setNewMaterialName("");
        setNewMaterialUnit("pcs");
        setNewMaterialAlert("");
        setNewPurchaseCost("");
        setNewPurchaseQuantity("");
        setEditingMaterialId(null);

        await loadRawMaterials();
    }

      function startEditMaterial(material: RawMaterial) {
        setEditingMaterialId(material.id);
        setNewMaterialName(material.name);
        setNewMaterialUnit(material.unit);
        setNewMaterialAlert(String(material.low_stock_alert));
        setNewPurchaseCost(String(material.purchase_cost));
        setNewPurchaseQuantity(String(material.purchase_quantity));
      }

        async function deleteMaterial(id: number) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this material?"
        );

        if (!confirmed) return;

        const { error } = await supabase
            .from("raw_materials")
            .delete()
            .eq("id", id);

        if (error) {
            console.error(error);
            return;
        }

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

    <div className="mb-8 border p-6 rounded-2xl">
        <h2 className="text-2xl font-bold">
        {editingMaterialId ? "Edit Material" : "Add New Material"}
        </h2>

        <div className="mt-4 flex gap-4 flex-wrap">
            <input
            value={newMaterialName}
            onChange={(e) => setNewMaterialName(e.target.value)}
            placeholder="Material name"
            className="bg-white text-black px-4 py-2 rounded-xl"
            />

            <select
            value={newMaterialUnit}
            onChange={(e) => setNewMaterialUnit(e.target.value)}
            className="bg-white text-black px-4 py-2 rounded-xl"
            >
            <option value="pcs">pcs</option>
            <option value="g">g</option>
            <option value="kg">kg</option>
            <option value="ml">ml</option>
            <option value="l">l</option>
            </select>

            <input
            value={newMaterialAlert}
            onChange={(e) => setNewMaterialAlert(e.target.value)}
            placeholder="Low stock alert"
            type="number"
            className="bg-white text-black px-4 py-2 rounded-xl"
            />

            <input
              value={newPurchaseCost}
              onChange={(e) => setNewPurchaseCost(e.target.value)}
              placeholder="Purchase cost"
              type="number"
              className="bg-white text-black px-4 py-2 rounded-xl"
            />

            <input
              value={newPurchaseQuantity}
              onChange={(e) => setNewPurchaseQuantity(e.target.value)}
              placeholder="Purchase quantity"
              type="number"
              className="bg-white text-black px-4 py-2 rounded-xl"
            />

            <button
            onClick={addMaterial}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl"
            >
            {editingMaterialId ? "Update Material" : "Add Material"}
            </button>
        </div>
    </div>

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

            <p className="text-gray-400 mt-1">
              Unit Cost: RM{" "}
              {material.purchase_quantity > 0
                ? (material.purchase_cost / material.purchase_quantity).toFixed(4)
                : "0.0000"}
              / {material.unit}
            </p>

            {material.stock_quantity <= material.low_stock_alert && (
              <p className="text-red-400 mt-2">Low stock warning</p>
            )}
            <div className="flex gap-2 mt-4">
            <button
                onClick={() => startEditMaterial(material)}
                className="bg-yellow-500 text-black px-4 py-2 rounded-xl"
            >
                Low Stock Alert Edit
            </button>

            <button
                onClick={() => deleteMaterial(material.id)}
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