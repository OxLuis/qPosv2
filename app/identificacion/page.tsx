'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export default function Identificacion() {
  const [idType, setIdType] = useState('cedula');
  const [idNumber, setIdNumber] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  // Manejo de inactividad
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetTimeout = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        console.log('Redireccionado por inactividad');
        router.push('/'); // Redirige a la página principal
      }, 4 * 60 * 1000); // 4 minutos de inactividad
    };

    // Eventos para detectar actividad
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart'];

    // Añadir los listeners de eventos
    events.forEach((event) => window.addEventListener(event, resetTimeout));

    // Configurar el timeout inicial
    resetTimeout();

    // Limpiar eventos al desmontar el componente
    return () => {
      clearTimeout(timeout);
      events.forEach((event) =>
        window.removeEventListener(event, resetTimeout)
      );
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la llamada a la API para validar los datos
    // Por ahora, simularemos una respuesta exitosa
    toast({
      title: 'Identificación exitosa',
      description: 'Tus datos han sido verificados correctamente.',
    });
    router.push('/categorias');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 p-4">
      <h1 className="text-3xl font-bold mb-8 text-blue-800">Identificación</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <RadioGroup
          defaultValue="cedula"
          className="mb-6"
          onValueChange={setIdType}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="cedula" id="cedula" />
            <Label htmlFor="cedula">Cédula de Identidad</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ruc" id="ruc" />
            <Label htmlFor="ruc">RUC</Label>
          </div>
        </RadioGroup>
        <Input
          type="text"
          placeholder={
            idType === 'cedula'
              ? 'Ingrese su Cédula de Identidad'
              : 'Ingrese su RUC'
          }
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          className="mb-6"
        />
        <Button size="lg" type="submit" className="w-full">
          Siguiente
        </Button>
      </form>
    </div>
  );
}
