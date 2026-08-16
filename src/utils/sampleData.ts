/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Battery } from '../types';
import { getTodayISODate } from './dateUtils';

function getDateOffsetISO(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

export function generate50SampleBatteries(): Battery[] {
  const categories = [
    { id: 'درۆن (کامێرا) 2kg', prefix: 'CAM2', namePrefix: 'پاتری کامێرا 2kg' },
    { id: 'درۆن (کامێرا) 5kg', prefix: 'CAM5', namePrefix: 'پاتری کامێرا 5kg' },
    { id: 'درۆن (کامێرا) 10kg', prefix: 'CAM10', namePrefix: 'پاتری کامێرا 10kg' },
    { id: 'درۆن (GPS) 5kg', prefix: 'GPS5', namePrefix: 'پاتری GPS 5kg' },
    { id: 'درۆن (GPS) 10kg', prefix: 'GPS10', namePrefix: 'پاتری GPS 10kg' },
  ];

  const sampleBatteries: Battery[] = [];
  let globalCount = 1;

  // Offset days to create varied battery statuses (OK, Early Warning, Overdue)
  const offsetPattern = [1, 5, 12, 18, 25, 31, 35, 41, 46, 52];

  categories.forEach((cat) => {
    for (let i = 1; i <= 10; i++) {
      const daysAgo = offsetPattern[(i - 1) % offsetPattern.length];
      const chargeDate = getDateOffsetISO(daysAgo);
      const batteryId = `sample-batt-${globalCount.toString().padStart(3, '0')}`;

      // Generate cell voltages for 6 cells
      const baseVolt = 3.80 + Math.random() * 0.10;
      const cells = {
        cell1: +(baseVolt + 0.01).toFixed(2),
        cell2: +(baseVolt + 0.02).toFixed(2),
        cell3: +(baseVolt + 0.00).toFixed(2),
        cell4: +(baseVolt + 0.03).toFixed(2),
        cell5: +(baseVolt + 0.01).toFixed(2),
        cell6: +(baseVolt + 0.02).toFixed(2),
      };

      const history = [
        {
          id: `h1-${batteryId}`,
          batteryId: batteryId,
          chargeDate: chargeDate,
          chargeTime: '10:30',
          notes: 'ستۆرجکردنی تاقیکاری لەسەر ئاستی سێڵەکان',
        },
      ];

      if (daysAgo > 30) {
        const prevDate = getDateOffsetISO(daysAgo + 40);
        history.unshift({
          id: `h0-${batteryId}`,
          batteryId: batteryId,
          chargeDate: prevDate,
          chargeTime: '09:15',
          notes: 'ستۆرجکردنی بەرواری پێشوو',
        });
      }

      sampleBatteries.push({
        id: batteryId,
        name: `${cat.namePrefix} #${i.toString().padStart(2, '0')}`,
        category: cat.id,
        lastChargeDate: chargeDate,
        reminderIntervalDays: 40,
        createdAt: chargeDate,
        voltage: +(baseVolt * 6).toFixed(2),
        storagePercentage: 50,
        capacity: `${(2000 + i * 500)} mAh`,
        notes: `پاتری تاقیکاری ڕەسمی بۆ بەشی ${cat.id}`,
        history: history,
        cells: cells,
      });

      globalCount++;
    }
  });

  return sampleBatteries;
}
