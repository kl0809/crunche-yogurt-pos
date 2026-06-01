"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/navbar";
import { supabase } from "../../lib/supabase";

type Product = {
  id: number;
  name: string;
  price: number;
  cost: number;
};

type RawMaterial = {
  id: number;
  purchase_cost: number;
  purchase_quantity: number;
};

type Recipe = {
  id: number;
  product_id: number;
  raw_material_id: number;
  quantity_used: number;
  is_optional: boolean;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCost, setProductCost] = useState("");
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

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
      .select("*")
      .order("id", { ascending: true });

    if (data) {
      setProducts(
        data.map((product) => ({
          id: product.id,
          name: product.name,
          price: Number(product.price),
          cost: Number(product.cost),
        }))
      );
    }
  }

  async function loadRawMaterials() {
    const { data } = await supabase
      .from("raw_materials")
      .select("id,purchase_cost,purchase_quantity");

    if (data) {
      setRawMaterials(
        data.map((material) => ({
          id: material.id,
          purchase_cost: Number(material.purchase_cost || 0),
          purchase_quantity: Number(material.purchase_quantity || 0),
        }))
      );
    }
  }

  async function loadRecipes() {
    const { data } = await supabase
      .from("recipes")
      .select("id,product_id,raw_material_id,quantity_used,is_optional");

    if (data) {
      setRecipes(
        data.map((recipe) => ({
          id: recipe.id,
          product_id: recipe.product_id,
          raw_material_id: recipe.raw_material_id,
          quantity_used: Number(recipe.quantity_used),
          is_optional: Boolean(recipe.is_optional),
        }))
      );
    }
  }

  async function addProduct() {
    const price = Number(productPrice);
    const cost = Number(productCost);

    if (!productName || price <= 0 || cost < 0) return;

    const { error } = editingProductId
      ? await supabase
          .from("products")
          .update({
            name: productName,
            price,
            cost,
          })
          .eq("id", editingProductId)
      : await supabase.from("products").insert([
          {
            name: productName,
            price,
            cost,
          },
        ]);

    if (error) {
      console.error(error);
      return;
    }

    setProductName("");
    setProductPrice("");
    setProductCost("");
    setEditingProductId(null);

    await loadProducts();
  }

  async function deleteProduct(id: number) {
    const confirmed = window.confirm(
        "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

    if (error) {
        console.error(error);
        return;
    }

    await loadProducts();
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

  function startEditProduct(product: Product) {
    setEditingProductId(product.id);
    setProductName(product.name);
    setProductPrice(String(product.price));
    setProductCost(String(product.cost));
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

      <h1 className="text-4xl font-bold mb-6">Products</h1>

      <div className="mb-8 border p-6 rounded-2xl">
        <h2 className="text-2xl font-bold">
          {editingProductId ? "Edit Product" : "Add Product"}
        </h2>

        <div className="mt-4 flex gap-4 flex-wrap">
          <input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Product name"
            className="bg-white text-black px-4 py-2 rounded-xl"
          />

          <input
            value={productPrice}
            onChange={(e) => setProductPrice(e.target.value)}
            placeholder="Price"
            type="number"
            className="bg-white text-black px-4 py-2 rounded-xl"
          />

          <input
            value={productCost}
            onChange={(e) => setProductCost(e.target.value)}
            placeholder="Cost"
            type="number"
            className="bg-white text-black px-4 py-2 rounded-xl"
          />

          <button
            onClick={addProduct}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl"
          >
            {editingProductId ? "Update Product" : "Add Product"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map((product) => {
          const recipeCost = getProductRecipeCost(product.id);
          const profit = product.price - recipeCost;
          const margin =
            product.price > 0 ? (profit / product.price) * 100 : 0;

          return (
            <div key={product.id} className="border p-4 rounded-2xl">
            <h2 className="text-2xl font-semibold">{product.name}</h2>

            <p className="mt-2 text-gray-400">
              Price: RM {product.price}
            </p>

            <p className="text-gray-400">
              Manual Cost: RM {product.cost}
            </p>

            <p className="text-green-400">
              Recipe Cost: RM {recipeCost.toFixed(2)}
            </p>

            <p className="text-gray-400">
              Auto Profit: RM {profit.toFixed(2)}
            </p>

            <p className="text-gray-400">
              Margin: {margin.toFixed(1)}%
            </p>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => startEditProduct(product)}
                className="bg-yellow-500 text-black px-4 py-2 rounded-xl"
              >
                Edit
              </button>

              <button
                onClick={() => deleteProduct(product.id)}
                className="bg-red-500 text-white px-4 py-2 rounded-xl"
              >
                Delete
              </button>
            </div>
          </div>
        )})}
      </div>
    </main>
  );
}