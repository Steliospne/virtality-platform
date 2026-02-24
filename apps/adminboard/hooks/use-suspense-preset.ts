'use client';

import { fetchPresets } from '@/data/client/preset';
import { useSuspenseQuery } from '@tanstack/react-query';

const useSuspensePreset = () => {
  return useSuspenseQuery({
    queryKey: ['presets'],
    queryFn: fetchPresets,
    staleTime: Infinity,
  });
};

export default useSuspensePreset;
