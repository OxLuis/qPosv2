"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"

// Simulación de productos (en una aplicación real, esto vendría de un contexto o estado global)
const PRODUCTS = [
  { id: 1, name: 'Coca-Cola', price: 2.5 },
  { id: 2, name: 'Agua Mineral', price: 1.5 },
  { id: 4, name: 'Hamburguesa', price: 8 },
  { id: 5, name: 'Pizza', price: 10 },
];

export default function Resumen() {
  const [cart, setCart] = useState<{[key: number]: number}>({});
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // En una aplicación real, obtendríamos el carrito del estado global o de localStorage
    // Por ahora, simularemos un carrito
    setCart({1: 2, 4: 1, 5: 1});
  }, []);

  const calculateTotal = () => {
    return Object.entries(cart).reduce((total, [productId, quantity]) => {
      const product = PRODUCTS.find(p => p.id === parseInt(productId));
      return total + (product ? product.price * quantity : 0);
    }, 0);
  };

  const handleConfirmOrder = () => {
    // Aquí iría la lógica para enviar el pedido al servidor
    toast({
      title: "Pedido confirmado",
      description: "Tu pedido ha sido recibido y está siendo procesado.",
    });
    router.push('/');
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 p-4">
      <h1 className="text-3xl font-bold mb-8 text-blue-800">Resumen del Pedido</h1>
      <Table className="w-full max-w-2xl mb-8">
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead>Cantidad</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Subtotal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(cart).map(([productId, quantity]) => {
            const product = PRODUCTS.find(p => p.id === parseInt(productId));
            if (!product) return null;
            return (
              <TableRow key={productId}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{quantity}</TableCell>
                <TableCell>${product.price.toFixed(2)}</TableCell>
                <TableCell>${(product.price * quantity).toFixed(2)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <p className="text-2xl font-bold mb-8">Total: ${calculateTotal().toFixed(2)}</p>
      <div className="flex justify-between w-full max-w-2xl">
        <Button onClick={() => router.back()} variant="outline">Volver</Button>
        <Button onClick={handleConfirmOrder}>Confirmar Pedido</Button>
      </div>
    </div>
  );
}