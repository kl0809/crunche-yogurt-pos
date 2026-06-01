"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/navbar";
import { supabase } from "../../lib/supabase";

type Product = {
  id: number;
  name: string;
};

type RawMaterial = {
  id: number;
  name: string;
  unit: string;
  purchase_cost: number;
  purchase_quantity: number;
};

type Recipe = {
  id: number;
  product_id: number;
  raw_material_id: number;
  quantity_used: number;
  is_optional: boolean;
  note: string | null;
};

export default function RecipesPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [quantityUsed, setQuantityUsed] = useState("");
  const [isOptional, setIsOptional] = useState(false);
  const [note, setNote] = useState("");
  const [editingRecipeId, setEditingRecipeId] = useState<number | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (!checkingAuth) {
      loadProducts();
      loadRawMaterials();
      loadRecipes();
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

  async function loadProducts() {
    const { data } = await supabase
      .from("products")
      .select("id,name")
      .order("id", { ascending: true });

    if (data) setProducts(data);
  }

  async function loadRawMaterials() {
    const { data } = await supabase
      .from("raw_materials")
      .select("id,name,unit,purchase_cost,purchase_quantity")
      .order("id", { ascending: true });

    if (data) {
      setRawMaterials(
        data.map((material) => ({
          id: material.id,
          name: material.name,
          unit: material.unit,
          purchase_cost: Number(material.purchase_cost || 0),
          purchase_quantity: Number(material.purchase_quantity || 0),
        }))
      );
    }
  }

  async function loadRecipes() {
    const { data } = await supabase
      .from("recipes")
      .select("*")
      .order("id", { ascending: false });

    if (data) {
      setRecipes(
        data.map((recipe) => ({
          id: recipe.id,
          product_id: recipe.product_id,
          raw_material_id: recipe.raw_material_id,
          quantity_used: Number(recipe.quantity_used),
          is_optional: Boolean(recipe.is_optional),
          note: recipe.note,
        }))
      );
    }
  }

  function getProductName(productId: number) {
    return products.find((product) => product.id === productId)?.name || "-";
  }

  function getMaterialName(materialId: number) {
    return rawMaterials.find((material) => material.id === materialId)?.name || "-";
  }
    async function addRecipe() {
        const productId = Number(selectedProductId);
        const materialId = Number(selectedMaterialId);
        const quantity = Number(quantityUsed);

        if (!productId || !materialId || quantity <= 0) return;

        const { error } = editingRecipeId
            ? await supabase
                .from("recipes")
                .update({
                product_id: productId,
                raw_material_id: materialId,
                quantity_used: quantity,
                is_optional: isOptional,
                note,
                })
                .eq("id", editingRecipeId)
            : await supabase.from("recipes").insert([
                {
                product_id: productId,
                raw_material_id: materialId,
                quantity_used: quantity,
                is_optional: isOptional,
                note,
                },
            ]);

        if (error) {
            console.error(error);
            return;
        }

        setSelectedProductId("");
        setSelectedMaterialId("");
        setQuantityUsed("");
        setIsOptional(false);
        setNote("");
        setEditingRecipeId(null);

        await loadRecipes();
    }
    function startEditRecipe(recipe: Recipe) {
        setEditingRecipeId(recipe.id);
        setSelectedProductId(String(recipe.product_id));
        setSelectedMaterialId(String(recipe.raw_material_id));
        setQuantityUsed(String(recipe.quantity_used));
        setIsOptional(recipe.is_optional);
        setNote(recipe.note || "");
    }

    async function deleteRecipe(id: number) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this recipe?"
        );

        if (!confirmed) return;

        const { error } = await supabase
            .from("recipes")
            .delete()
            .eq("id", id);

        if (error) {
            console.error(error);
            return;
        }

        await loadRecipes();
    }
  function getMaterialUnit(materialId: number) {
    return rawMaterials.find((material) => material.id === materialId)?.unit || "";
  }

  function getRecipeItemCost(recipe: Recipe) {
    const material = rawMaterials.find(
      (item) => item.id === recipe.raw_material_id
    );

    if (!material || material.purchase_quantity <= 0) {
      return 0;
    }

    const unitCost =
      material.purchase_cost / material.purchase_quantity;

    return unitCost * recipe.quantity_used;
  }

  function getProductRecipeCost(productId: number) {
    return recipes
      .filter(
        (recipe) =>
          recipe.product_id === productId &&
          !recipe.is_optional
      )
      .reduce(
        (sum, recipe) => sum + getRecipeItemCost(recipe),
        0
      );
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

      <h1 className="text-4xl font-bold mb-6">Recipes</h1>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map((product) => {
          const recipeCost = getProductRecipeCost(product.id);

          return (
            <div key={product.id} className="border p-4 rounded-xl">
              <p className="text-gray-400">Product</p>

              <h2 className="text-2xl font-bold">
                {product.name}
              </h2>

              <p className="mt-3 text-green-400">
                Recipe Cost: RM {recipeCost.toFixed(2)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="border p-6 rounded-2xl">
        <h2 className="text-2xl font-bold">
            {editingRecipeId ? "Edit Product Recipe" : "Add Product Recipe"}
        </h2>

        <p className="text-gray-400 mt-2">
          Example: 1 yogurt cup uses 140g yogurt, 5g strawberry, 1 cup, 1 sticker, 1 spoon.
        </p>
        <div className="mt-4 flex gap-4 flex-wrap">
            <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="bg-white text-black px-4 py-2 rounded-xl"
            >
                <option value="">Select product</option>

                {products.map((product) => (
                <option key={product.id} value={product.id}>
                    {product.name}
                </option>
                ))}
            </select>

            <select
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
                className="bg-white text-black px-4 py-2 rounded-xl"
            >
                <option value="">Select material</option>

                {rawMaterials.map((material) => (
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

            <label className="flex items-center gap-2">
                <input
                type="checkbox"
                checked={isOptional}
                onChange={(e) => setIsOptional(e.target.checked)}
                />
                Optional
            </label>

            <button
                onClick={addRecipe}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl"
            >
                {editingRecipeId ? "Update Recipe" : "Add Recipe"}
            </button>
            </div>
      </div>

      <div className="mt-8 space-y-4">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="border p-4 rounded-xl">
            <p className="font-semibold">
              {getProductName(recipe.product_id)}
            </p>

            <p className="text-gray-400">
              Uses {recipe.quantity_used} {getMaterialUnit(recipe.raw_material_id)}{" "}
              {getMaterialName(recipe.raw_material_id)}
            </p>

            <p className="text-green-400">
              Cost: RM {getRecipeItemCost(recipe).toFixed(2)}
            </p>

            {recipe.is_optional && (
              <p className="text-yellow-400">Optional item</p>
            )}

            {recipe.note && (
              <p className="text-gray-400">Note: {recipe.note}</p>
            )}
            <div className="flex gap-2 mt-4">
                <button
                    onClick={() => startEditRecipe(recipe)}
                    className="bg-yellow-500 text-black px-4 py-2 rounded-xl"
                >
                    Edit
                </button>

                <button
                    onClick={() => deleteRecipe(recipe.id)}
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