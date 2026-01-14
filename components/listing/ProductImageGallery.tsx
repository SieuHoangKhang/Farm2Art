'use client';

import React, { useState } from 'react';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

export default function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showFullscreen, setShowFullscreen] = useState(false);

  // Use mock images if not provided
  const displayImages = images.length > 0 
    ? images 
    : [
        'https://via.placeholder.com/600x600?text=Product+1',
        'https://via.placeholder.com/600x600?text=Product+2',
        'https://via.placeholder.com/600x600?text=Product+3',
        'https://via.placeholder.com/600x600?text=Product+4',
      ];

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.min(Math.max(prev + delta, 1), 3));
  };

  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index);
    setZoomLevel(1);
  };

  const handlePrevious = () => {
    setSelectedIndex(prev => (prev - 1 + displayImages.length) % displayImages.length);
    setZoomLevel(1);
  };

  const handleNext = () => {
    setSelectedIndex(prev => (prev + 1) % displayImages.length);
    setZoomLevel(1);
  };

  return (
    <>
      {/* Main Gallery */}
      <div className="space-y-4">
        {/* Main Image */}
        <div className="relative bg-gray-100 rounded-lg overflow-hidden">
          {/* Zoom Container */}
          <div
            className="w-full aspect-square flex items-center justify-center cursor-zoom-in overflow-hidden"
            onClick={() => setShowFullscreen(true)}
          >
            <img
              src={displayImages[selectedIndex]}
              alt={`${productName} - Image ${selectedIndex + 1}`}
              style={{
                transform: `scale(${zoomLevel})`,
                transition: 'transform 0.3s ease',
                cursor: zoomLevel > 1 ? 'grab' : 'zoom-in',
              }}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Zoom Controls */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-4 right-4 flex gap-2 bg-white rounded-lg shadow-lg p-2">
              <button
                onClick={() => handleZoom(-0.2)}
                disabled={zoomLevel <= 1}
                className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
                title="Zoom out"
              >
                🔍−
              </button>
              <div className="px-2 py-2 text-sm text-gray-600 min-w-[50px] text-center">
                {(zoomLevel * 100).toFixed(0)}%
              </div>
              <button
                onClick={() => handleZoom(0.2)}
                disabled={zoomLevel >= 3}
                className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
                title="Zoom in"
              >
                🔍+
              </button>
            </div>
          )}

          {/* Navigation Arrows */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition"
              >
                ←
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition"
              >
                →
              </button>
            </>
          )}

          {/* Image Counter */}
          <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {selectedIndex + 1}/{displayImages.length}
          </div>
        </div>

        {/* Thumbnails */}
        {displayImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {displayImages.map((image, idx) => (
              <button
                key={idx}
                onClick={() => handleThumbnailClick(idx)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                  idx === selectedIndex
                    ? 'border-blue-500 ring-2 ring-blue-300'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {showFullscreen && (
        <div
          className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          onClick={() => setShowFullscreen(false)}
        >
          <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-4 right-4 text-white text-3xl hover:opacity-70 z-10"
            >
              ✕
            </button>

            {/* Main Image */}
            <img
              src={displayImages[selectedIndex]}
              alt={`${productName} - Fullscreen`}
              className="max-w-full max-h-full object-contain"
            />

            {/* Navigation */}
            {displayImages.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 text-white text-4xl hover:opacity-70"
                >
                  ←
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 text-white text-4xl hover:opacity-70"
                >
                  →
                </button>
              </>
            )}

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white">
              {selectedIndex + 1}/{displayImages.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
