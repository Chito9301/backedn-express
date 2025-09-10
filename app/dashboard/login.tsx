"use client";
// Componente de login básico para Next.js dashboard
// Este archivo debe ir en app/dashboard/login.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  // Estado para usuario, contraseña y error
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  // Maneja el submit del formulario
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    // Llama al backend para validar credenciales
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) {
      // Guarda el token en localStorage y redirige al dashboard
      localStorage.setItem("token", data.token);
      router.replace("/dashboard");
    } else {
      setError(data.error || "Credenciales inválidas");
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 32 }}>
      <h2>Login Dashboard</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ width: "100%", marginBottom: 8 }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ width: "100%", marginBottom: 8 }}
        />
        <button type="submit" style={{ width: "100%" }}>Ingresar</button>
        {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      </form>
    </div>
  );
}

// En el layout o página dashboard, verifica el token antes de mostrar el contenido
// Si no hay token, redirige a /dashboard/login
// Ejemplo para app/dashboard/page.tsx:
// import { useEffect } from "react";
// import { useRouter } from "next/navigation";
// useEffect(() => {
//   if (!localStorage.getItem("token")) router.push("/dashboard/login");
// }, []);
