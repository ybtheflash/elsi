'use client';

import React from 'react';
import { useLoading } from '@/context/LoadingContext';
import HamsterLoader from '@/components/ui/hamster-loader';

const GlobalLoadingOverlay: React.FC = () => {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-full p-8 shadow-2xl border-4 border-white/20">
        <HamsterLoader />
      </div>
    </div>
  );
};

export default GlobalLoadingOverlay;
