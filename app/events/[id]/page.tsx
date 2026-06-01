"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../components/navbar";
import { supabase } from "../../../lib/supabase";

type Event = {
  id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
};

type OrderItem = {
  product_name: string;
  quantity: number;
};

type Order = {
  id: number;
  total: number;
  profit: number;
  payment_method: string;
  order_items: OrderItem[];
};

type Expense = {
  id: number;
  amount: number;
  cost_type: string;
  category: string;
};

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = Number(params.id);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (!checkingAuth) {
      loadEventDetails();
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

  async function loadEventDetails() {
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (data) {
      setEvent(data);
    }
    const { data: ordersData } = await supabase
        .from("orders")
        .select("id,total,profit,payment_method,order_items(product_name,quantity)")
        .eq("event_id", eventId);

        if (ordersData) {
        setOrders(
            ordersData.map((order) => ({
            id: order.id,
            total: Number(order.total),
            profit: Number(order.profit),
            payment_method: order.payment_method,
            order_items: order.order_items || [],
            }))
        );
        }

        const { data: expensesData } = await supabase
        .from("expenses")
        .select("id,amount,cost_type,category")
        .eq("event_id", eventId);

        if (expensesData) {
        setExpenses(
          expensesData.map((expense) => ({
            id: expense.id,
            amount: Number(expense.amount),
            cost_type: expense.cost_type,
            category: expense.category,
          }))
        );
    }
  }
  const revenue = orders.reduce(
    (sum, order) => sum + order.total,
    0
  );

  const grossProfit = orders.reduce(
    (sum, order) => sum + order.profit,
   0
  );

    const consumableExpenses = expenses
    .filter((expense) => expense.cost_type === "Consumable")
    .reduce((sum, expense) => sum + expense.amount, 0);

    const netProfit = grossProfit - consumableExpenses;

    const roi =
    consumableExpenses > 0
        ? (netProfit / consumableExpenses) * 100
        : 0;

    const averageOrder =
    orders.length > 0 ? revenue / orders.length : 0;

    const allItems = orders.flatMap((order) => order.order_items);

    const itemsSold = allItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    const productSales: Record<string, number> = {};

    allItems.forEach((item) => {
      productSales[item.product_name] =
        (productSales[item.product_name] || 0) + item.quantity;
    });

    const bestSeller =
      Object.entries(productSales).sort((a, b) => b[1] - a[1])[0];
    const paymentBreakdown: Record<string, number> = {};

    orders.forEach((order) => {
      paymentBreakdown[order.payment_method] =
        (paymentBreakdown[order.payment_method] || 0) + order.total;
    });

    const expenseBreakdown: Record<string, number> = {};

    expenses.forEach((expense) => {
      expenseBreakdown[expense.category] =
        (expenseBreakdown[expense.category] || 0) + expense.amount;
    });

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

      <h1 className="text-4xl font-bold mb-2">
        {event?.name || "Event Details"}
      </h1>

      <p className="text-gray-400 mb-6">
        {event?.start_date || "No start date"} to{" "}
        {event?.end_date || "No end date"}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border p-4 rounded-xl">
            <p className="text-gray-400 text-sm">Revenue</p>
            <p className="text-2xl font-bold">
            RM {revenue.toFixed(2)}
            </p>
        </div>

        <div className="border p-4 rounded-xl">
            <p className="text-gray-400 text-sm">Expenses</p>
            <p className="text-2xl font-bold">
            RM {consumableExpenses.toFixed(2)}
            </p>
        </div>

        <div className="border p-4 rounded-xl">
            <p className="text-gray-400 text-sm">Net Profit</p>
            <p className="text-2xl font-bold">
            RM {netProfit.toFixed(2)}
            </p>
        </div>

        <div className="border p-4 rounded-xl">
            <p className="text-gray-400 text-sm">ROI</p>
            <p className="text-2xl font-bold">
            {roi.toFixed(1)}%
            </p>
        </div>

        <div className="border p-4 rounded-xl">
            <p className="text-gray-400 text-sm">Average Order</p>
            <p className="text-2xl font-bold">
            RM {averageOrder.toFixed(2)}
            </p>
        </div>
        <div className="border p-4 rounded-xl">
          <p className="text-gray-400 text-sm">Items Sold</p>
          <p className="text-2xl font-bold">
            {itemsSold}
          </p>
        </div>

        <div className="border p-4 rounded-xl">
          <p className="text-gray-400 text-sm">Best Seller</p>
          <p className="text-2xl font-bold">
            {bestSeller ? `${bestSeller[0]} (${bestSeller[1]})` : "No Sales"}
          </p>
        </div>
      </div>
      <div className="mt-6 border p-6 rounded-2xl">
        <h2 className="text-2xl font-bold mb-4">
          Event Overview
        </h2>

        <p className="mb-4">
          Total Orders: {orders.length}
        </p>

        <h3 className="text-xl font-semibold mb-3">
          Payment Breakdown
        </h3>

                <div className="space-y-2">
          {Object.entries(paymentBreakdown).map(
            ([method, amount]) => (
              <div
                key={method}
                className="flex justify-between border-b pb-2"
              >
                <span>{method}</span>

                <span>
                  RM {amount.toFixed(2)}
                </span>
              </div>
            )
          )}
        </div>

        <h3 className="text-xl font-semibold mt-6 mb-3">
          Expense Breakdown
        </h3>

        <div className="space-y-2">
          {Object.entries(expenseBreakdown).map(
            ([category, amount]) => (
              <div
                key={category}
                className="flex justify-between border-b pb-2"
              >
                <span>{category}</span>

                <span>
                  RM {amount.toFixed(2)}
                </span>
              </div>
            )
          )}
        </div>
      </div>
    </main>
  );
}