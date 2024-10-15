"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button"

// Simulación de categorías
const CATEGORIES = [
  { id: 1, name: 'Bebidas' },
  { id: 2, name: 'Comidas' },
  { id: 3, name: 'Postres' },
  { id: 4, name: 'Snacks' },
];

export default function Categorias() {
  const [categories, setCategories] = useState(CATEGORIES);

  useEffect(() => {
    // Aquí iría la llamada a la API para obtener las categorías
    // Por ahora, usamos las categorías simuladas
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 p-4">
      <h1 className="text-3xl font-bold mb-8 text-blue-800">Categorías de Productos</h1>
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {categories.map((category) => (
          <Link href={`/productos/${category.id}`} key={category.id}>
            <Button className="w-full h-24 text-xl">{category.name}</Button>
          </Link>
        ))}
      </div>
    </div>
  );
}