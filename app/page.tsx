'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import SwiperCore, { Pagination, Autoplay } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.css';

// Habilitar modulos de Swiper
SwiperCore.use([Pagination, Autoplay]);

export default function Home() {
  const [promos] = useState([
    {
      id: 1,
      imageUrl: 'https://chat.qoarto.com/chipa.jpg',
      description: 'Promo 1 - 20% de descuento',
    },
    {
      id: 2,
      imageUrl: 'https://placehold.co/400x650?text=Promo+2',
      description: 'Promo 2 - 2x1 en productos seleccionados',
    },
    {
      id: 3,
      imageUrl: 'https://placehold.co/400x650?text=Promo+3',
      description: 'Promo 3 - Envío gratis',
    },
  ]);

  return (
    <div className="relative w-full h-screen">
      {/* Slider de Promociones que ocupa el 80% del alto */}
      <div className="w-full h-4/5">
        <Swiper
          spaceBetween={30}
          slidesPerView={1}
          pagination={{ clickable: true }}
          autoplay={{ delay: 1000, disableOnInteraction: false }}
          className="w-full h-full"
        >
          {promos.map((promo) => (
            <SwiperSlide key={promo.id}>
              <div className="flex flex-col items-center text-center h-full">
                <Image
                  src={promo.imageUrl}
                  alt={promo.description}
                  width={400}
                  height={650}
                  className="w-full h-full object-cover"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Sección del 20% para el botón de orden */}
      <Link href="/identificacion">
        <div className="absolute bottom-0 w-full h-1/5 bg-blue-800 flex flex-col items-center justify-center">
          <Button
            size="lg"
            className="bg-white hover:bg-blue-600 text-blue-800 hover:text-white font-semibold py-4 px-8 rounded-lg text-xl transition transform hover:scale-105"
          >
            Tocar para ordenar
          </Button>
          <p className="text-white mt-2 text-xl">Touch to order</p>
        </div>
      </Link>
    </div>
  );
}
