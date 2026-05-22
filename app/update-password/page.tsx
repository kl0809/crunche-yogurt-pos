"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");

  async function updatePassword() {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Password updated!");
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="border p-8 rounded-2xl w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-6">
          Reset Password
        </h1>

        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 bg-white text-black px-4 py-2 rounded-xl"
        />

        <button
          onClick={updatePassword}
          className="w-full bg-green-600 text-white px-4 py-2 rounded-xl"
        >
          Update Password
        </button>
      </div>
    </main>
  );
}