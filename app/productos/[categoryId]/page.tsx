"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

// Simulación de productos
const PRODUCTS = {
  1: [
    { id: 1, name: 'Coca-Cola', price: 2.5 },
    { id: 2, name: 'Agua Mineral', price: 1.5 },
    { id: 3, name: 'Jugo de Naranja', price: 3 },
  ],
  2: [
    { id: 4, name: 'Hamburguesa', price: 8 },
    { id: 5, name: 'Pizza', price: 10 },
    { id: 6, name: 'Ensalada', price: 6 },
  ],
  // ... más categorías
};

export default function Productos({ params }: { params: { categoryId: string } }) {
  const [products, setProducts] = useState(PRODUCTS[params.categoryId as keyof typeof PRODUCTS] || []);
  const [cart, setCart] = useState<{[key: number]: number}>({});
  const router = useRouter();

  useEffect(() => {
    // Aquí iría la llamada a la API para obtener los productos de la categoría
    // Por ahora, usamos los productos simulados
  }, [params.categoryId]);

  const updateQuantity = (productId: number, quantity: number) => {
    setCart(prev => ({...prev, [productId]: quantity}));
  };

  const calculateTotal = () => {
    return Object.entries(cart).reduce((total, [productId, quantity]) => {
      const product = products.find(p => p.id === parseInt(productId));
      return total + (product ? product.price * quantity : 0);
    }, 0);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 p-4">
      <h1 className="text-3xl font-bold mb-8 text-blue-800">Productos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl mb-8">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${product.price.toFixed(2)}</p>
            </CardContent>
            <CardFooter>
              <Input
                type="number"
                min="0"
                value={cart[product.id] || 0}
                onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 0)}
                className="w-20 mr-2"
              />
              <Button onClick={() => updateQuantity(product.id, (cart[product.id] || 0) + 1)}>
                Agregar
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      <div className="w-full max-w-4xl flex justify-between items-center">
        <Button onClick={() => router.back()} variant="outline">Volver</Button>
        <p className="text-2xl font-bold">Total: ${calculateTotal().toFixed(2)}</p>
        <Button onClick={() => router.push('/resumen')}>Finalizar Pedido</Button>
      </div>
    </div>
  );
}