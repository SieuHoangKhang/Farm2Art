'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface ProductGalleryProps {
  images: string[];
  title: string;
}

export default function ProductGalleryModal({ images, title }: ProductGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);

  if (images.length === 0) {
    return (
      <div className="w-full aspect-square bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
        Không có ảnh
      </div>
    );
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setZoom(1);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setZoom(1);
  };

  const handleZoom = (factor: number) => {
    setZoom(prev => Math.max(1, Math.min(3, prev + factor)));
  };

  return (
    <>
      {/* Thumbnail Gallery */}
      <div className="space-y-3">
        <div className="relative w-full aspect-square overflow-hidden rounded-lg bg-gray-100 cursor-zoom-in group">
          <Image
            src={images[currentIndex]}
            alt={`${title} - Ảnh ${currentIndex + 1}`}
            fill
            className="object-contain group-hover:opacity-90 transition"
            onClick={() => setIsOpen(true)}
          />
          <button
            onClick={() => setIsOpen(true)}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/30"
          >
            <span className="text-4xl text-white">🔍</span>
          </button>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${
                  idx === currentIndex ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Image
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Full-screen Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/90 z-50" onClick={() => setIsOpen(false)} />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Main Image */}
              <div className="relative w-5/6 h-5/6 overflow-auto">
                <div
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center',
                    transition: zoom === 1 ? 'transform 0.2s' : 'none',
                  }}
                >
                  <Image
                    src={images[currentIndex]}
                    alt={`${title} - Full view`}
                    width={1200}
                    height={1200}
                    className="w-full h-auto"
                  />
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-white text-4xl hover:opacity-70 bg-black/30 rounded-lg p-2"
              >
                ✕
              </button>

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl bg-black/50 hover:bg-black/70 rounded-lg p-3 transition"
                  >
                    ‹
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl bg-black/50 hover:bg-black/70 rounded-lg p-3 transition"
                  >
                    ›
                  </button>
                </>
              )}

              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                {currentIndex + 1} / {images.length}
              </div>

              {/* Zoom Controls */}
              <div className="absolute bottom-4 right-4 flex gap-2 bg-black/70 rounded-lg p-2">
                <button
                  onClick={() => handleZoom(-0.5)}
                  disabled={zoom <= 1}
                  className="text-white px-3 py-1 bg-white/20 hover:bg-white/40 disabled:opacity-50 rounded text-sm"
                >
                  −
                </button>
                <span className="text-white px-3 py-1 text-sm">
                  {(zoom * 100).toFixed(0)}%
                </span>
                <button
                  onClick={() => handleZoom(0.5)}
                  disabled={zoom >= 3}
                  className="text-white px-3 py-1 bg-white/20 hover:bg-white/40 disabled:opacity-50 rounded text-sm"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
