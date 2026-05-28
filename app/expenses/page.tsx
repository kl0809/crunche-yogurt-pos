"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/navbar";
import { supabase } from "../../lib/supabase";

type Event = {
  id: number;
  name: string;
};

type Expense = {
  id: number;
  name: string;
  amount: number;
  category: string;
  cost_type: string;
  note: string | null;
};

export default function ExpensesPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Ingredient");
  const [expenseCostType, setExpenseCostType] = useState("Consumable");
  const [expenseNote, setExpenseNote] = useState("");

    useEffect(() => {
    checkUser();
    }, []);

    useEffect(() => {
    if (!checkingAuth) {
        loadEvents();
    }
    }, [checkingAuth]);

  useEffect(() => {
    if (selectedEventId) {
      loadExpenses();
    }
  }, [selectedEventId]);

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

      if (data.length > 0) {
        setSelectedEventId(String(data[0].id));
      }
    }
  }

  async function loadExpenses() {
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .eq("event_id", Number(selectedEventId))
      .order("id", { ascending: false });

    if (data) {
      setExpenses(
        data.map((expense) => ({
          id: expense.id,
          name: expense.name,
          amount: Number(expense.amount),
          category: expense.category,
          cost_type: expense.cost_type,
          note: expense.note,
        }))
      );
    }
  }

  async function addExpense() {
    const amount = Number(expenseAmount);

    if (!expenseName || amount <= 0 || !selectedEventId) return;

    const { error } = await supabase.from("expenses").insert([
      {
        name: expenseName,
        amount,
        category: expenseCategory,
        cost_type: expenseCostType,
        note: expenseNote,
        event_id: Number(selectedEventId),
      },
    ]);

    if (error) {
      console.error(error);
      return;
    }

    setExpenseName("");
    setExpenseAmount("");
    setExpenseCategory("Ingredient");
    setExpenseCostType("Consumable");
    setExpenseNote("");

    await loadExpenses();
  }

  function formatMoney(amount: number) {
    return amount.toFixed(2);
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

      <h1 className="text-4xl font-bold mb-6">Expenses</h1>

      <div className="mb-6">
        <p className="mb-2 font-semibold">Select Event</p>

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
      </div>

      <div className="border p-6 rounded-2xl">
        <h2 className="text-2xl font-bold">Add Expense</h2>

        <div className="mt-4 flex gap-4 flex-wrap">
          <input
            value={expenseName}
            onChange={(e) => setExpenseName(e.target.value)}
            placeholder="Expense name"
            className="bg-white text-black px-4 py-2 rounded-xl"
          />

          <input
            value={expenseAmount}
            onChange={(e) => setExpenseAmount(e.target.value)}
            placeholder="Amount"
            type="number"
            className="bg-white text-black px-4 py-2 rounded-xl"
          />

          <select
            value={expenseCategory}
            onChange={(e) => setExpenseCategory(e.target.value)}
            className="bg-white text-black px-4 py-2 rounded-xl"
          >
            <option value="Ingredient">Ingredient</option>
            <option value="Packaging">Packaging</option>
            <option value="Rental">Rental</option>
            <option value="Transport">Transport</option>
            <option value="Equipment">Equipment</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={expenseCostType}
            onChange={(e) => setExpenseCostType(e.target.value)}
            className="bg-white text-black px-4 py-2 rounded-xl"
          >
            <option value="Consumable">Consumable</option>
            <option value="Reusable">Reusable</option>
          </select>

          <input
            value={expenseNote}
            onChange={(e) => setExpenseNote(e.target.value)}
            placeholder="Note"
            className="bg-white text-black px-4 py-2 rounded-xl"
          />

          <button
            onClick={addExpense}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl"
          >
            Add Expense
          </button>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {expenses.map((expense) => (
          <div key={expense.id} className="border p-4 rounded-xl">
            <p className="font-semibold">
              {expense.name} - RM {formatMoney(expense.amount)}
            </p>

            <p className="text-gray-400">
              {expense.category} • {expense.cost_type}
            </p>

            {expense.note && (
              <p className="text-gray-400">
                Note: {expense.note}
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}