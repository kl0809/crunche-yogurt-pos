"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function signUp() {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Account created. Now login.");
  }

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/");
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="border p-8 rounded-2xl w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-6">Crunché POS Login</h1>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full mb-4 bg-white text-black px-4 py-2 rounded-xl"
        />

        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          className="w-full mb-6 bg-white text-black px-4 py-2 rounded-xl"
        />

        <button
          onClick={login}
          className="w-full bg-green-600 text-white px-4 py-2 rounded-xl mb-3"
        >
          Login
        </button>

        <button
          onClick={signUp}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-xl"
        >
          Create Account
        </button>
      </div>
    </main>
  );
}