/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StatusType } from '../types';
import { CheckCircleIcon, ExclamationTriangleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface StatusBadgeProps {
  status: StatusType;
  statusText: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, statusText, size = 'md' }) => {
  let bgClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  let Icon = CheckCircleIcon;
  let pulse = false;

  if (status === 'TIME_TO_CHARGE') {
    bgClass = 'bg-amber-100 text-amber-900 border-amber-300';
    Icon = ExclamationTriangleIcon;
    pulse = true;
  } else if (status === 'OVERDUE') {
    bgClass = 'bg-rose-100 text-rose-900 border-rose-300';
    Icon = ExclamationCircleIcon;
    pulse = true;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base font-semibold gap-2',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border shadow-xs transition-all ${bgClass} ${sizeClasses[size]}`}
    >
      <Icon className={`w-4 h-4 shrink-0 ${pulse ? 'animate-pulse' : ''}`} />
      <span>{statusText}</span>
    </span>
  );
};
