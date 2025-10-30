'use client';

import { useState } from 'react';
import Image from 'next/image';

interface AircraftPhotoProps {
  thumbnailUrl?: string;
  fullImageUrl?: string;
  aircraftType?: string;
  registration?: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export function AircraftPhoto({ 
  thumbnailUrl, 
  fullImageUrl, 
  aircraftType, 
  registration,
  className = '',
  size = 'small'
}: AircraftPhotoProps) {
  const [imageError, setImageError] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  if (!thumbnailUrl || imageError) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${getSizeClasses(size)} ${className}`}>
        <div className="text-center text-gray-500">
          <svg 
            className="w-6 h-6 mx-auto mb-1" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
          </svg>
          <span className="text-xs">No photo</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className={`relative overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity ${getSizeClasses(size)} ${className}`}
        onClick={() => setShowFullImage(true)}
      >
        <Image
          src={thumbnailUrl}
          alt={`Aircraft ${registration || aircraftType || 'photo'}`}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
          sizes={getSizes(size)}
        />
      </div>

      {/* Full size image modal */}
      {showFullImage && fullImageUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 z-10"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path 
                  fillRule="evenodd" 
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                  clipRule="evenodd" 
                />
              </svg>
            </button>
            
            <Image
              src={fullImageUrl}
              alt={`Aircraft ${registration || aircraftType || 'photo'}`}
              width={800}
              height={600}
              className="rounded-lg max-h-[80vh] w-auto"
              onError={() => setShowFullImage(false)}
            />
            
            {(registration || aircraftType) && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 rounded-b-lg">
                <div className="text-center">
                  {registration && <div className="font-medium">{registration}</div>}
                  {aircraftType && <div className="text-sm opacity-90">{aircraftType}</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function getSizeClasses(size: 'small' | 'medium' | 'large'): string {
  switch (size) {
    case 'small':
      return 'w-16 h-12';
    case 'medium':
      return 'w-24 h-18';
    case 'large':
      return 'w-32 h-24';
    default:
      return 'w-16 h-12';
  }
}

function getSizes(size: 'small' | 'medium' | 'large'): string {
  switch (size) {
    case 'small':
      return '64px';
    case 'medium':
      return '96px';
    case 'large':
      return '128px';
    default:
      return '64px';
  }
}