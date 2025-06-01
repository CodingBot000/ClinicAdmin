'use client';

import React, { useState } from 'react';

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 60 }, (_, i) => i);
const days = ['월', '화', '수', '목', '금', '토', '일'] as const;

type DayOfWeek = (typeof days)[number];

interface OpeningHour {
  day: DayOfWeek;
  from: { hour: number; minute: number };
  to: { hour: number; minute: number };
  open: boolean;
  closed: boolean;
  ask: boolean;
}

const defaultOpenings: Record<DayOfWeek, { from: [number, number]; to: [number, number] }> = {
  월: { from: [10, 0], to: [19, 0] },
  화: { from: [10, 0], to: [19, 0] },
  수: { from: [10, 0], to: [19, 0] },
  목: { from: [10, 0], to: [19, 0] },
  금: { from: [10, 0], to: [19, 0] },
  토: { from: [10, 0], to: [16, 0] },
  일: { from: [10, 0], to: [16, 0] },
};

export default function OpeningHoursForm() {
  const [hoursState, setHoursState] = useState<OpeningHour[]>(
    days.map((d) => ({
      day: d,
      from: { hour: defaultOpenings[d].from[0], minute: defaultOpenings[d].from[1] },
      to: { hour: defaultOpenings[d].to[0], minute: defaultOpenings[d].to[1] },
      open: d === '일' ? false : true,
      closed: d === '일' ? true : false,
      ask: false,
    }))
  );

  function handleChange(
    idx: number,
    field: 'from' | 'to',
    part: 'hour' | 'minute',
    value: number
  ) {
    setHoursState((prev) =>
      prev.map((h, i) =>
        i === idx
          ? {
              ...h,
              [field]: {
                ...h[field],
                [part]: value,
              },
            }
          : h
      )
    );
  }

  function handleCheckbox(idx: number, key: 'open' | 'closed' | 'ask', value: boolean) {
    setHoursState((prev) =>
      prev.map((h, i) =>
        i === idx
          ? {
              ...h,
              [key]: value,
              ...(key === 'open' && value
                ? { open: false }
                : key === 'closed' && value
                ? { ask: false }
                : key === 'ask' && value
                ? { closed: false }
                : {}),
              // ...(key === 'closed' && value
              //   ? { ask: false }
              //   : key === 'ask' && value
              //   ? { closed: false }
              //   : {}),
            }
          : h
      )
    );
  }

  function isInvalidTime(from: { hour: number; minute: number }, to: { hour: number; minute: number }) {
    if (from.hour > to.hour) return true;
    if (from.hour === to.hour && from.minute >= to.minute) return true;
    return false;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white rounded-xl shadow">
      <h2 className="text-lg font-bold mb-4">진료시간 입력하기</h2>
      <div className="space-y-3">
        {hoursState.map((row, idx) => {
          const invalid = !row.closed && !row.ask && isInvalidTime(row.from, row.to);
          return (
            <div
              key={row.day}
              className="flex flex-row flex-nowrap items-center gap-3 bg-gray-50 rounded px-2 py-2 overflow-x-auto"
>
              {/* 요일 */}
              <div className="w-8 text-center font-medium">{row.day}</div>

              {/* 시작시간 */}
              <select
                className="border rounded px-1 py-0.5 text-xs"
                disabled={row.closed || row.ask}
                value={row.from.hour}
                onChange={(e) =>
                  handleChange(idx, 'from', 'hour', parseInt(e.target.value, 10))
                }
              >
                {hours.map((h) => (
                  <option key={h} value={h}>
                    {h.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
              :
              <select
                className="border rounded px-1 py-0.5 text-xs"
                disabled={row.closed || row.ask}
                value={row.from.minute}
                onChange={(e) =>
                  handleChange(idx, 'from', 'minute', parseInt(e.target.value, 10))
                }
              >
                {minutes.map((m) => (
                  <option key={m} value={m}>
                    {m.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>

              {/* ~ */}
              <span className="mx-1">~</span>

              {/* 종료시간 */}
              <select
                className="border rounded px-1 py-0.5 text-xs"
                disabled={row.closed || row.ask}
                value={row.to.hour}
                onChange={(e) =>
                  handleChange(idx, 'to', 'hour', parseInt(e.target.value, 10))
                }
              >
                {hours.map((h) => (
                  <option key={h} value={h}>
                    {h.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
              :
              <select
                className="border rounded px-1 py-0.5 text-xs"
                disabled={row.closed || row.ask}
                value={row.to.minute}
                onChange={(e) =>
                  handleChange(idx, 'to', 'minute', parseInt(e.target.value, 10))
                }
              >
                {minutes.map((m) => (
                  <option key={m} value={m}>
                    {m.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>

{/* 잔료 체크박스 */}
<label className="flex items-center gap-1 text-xs ml-2">
                <input
                  type="checkbox"
                  checked={row.open}
                  onChange={(e) => handleCheckbox(idx, 'open', e.target.checked)}
                />
                영업
              </label>
              {/* 휴무 체크박스 */}
              <label className="flex items-center gap-1 text-xs ml-2">
                <input
                  type="checkbox"
                  checked={row.closed}
                  onChange={(e) => handleCheckbox(idx, 'closed', e.target.checked)}
                />
                휴무
              </label>
              {/* 진료시간 문의 체크박스 */}
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={row.ask}
                  onChange={(e) => handleCheckbox(idx, 'ask', e.target.checked)}
                />
                진료시간 문의 필요
              </label>
              {/* 경고문 */}
              {invalid && (
                  <div className="ml-12 text-red-500 text-xs font-medium">
                    종료시간은 시작시간보다 항상 커야 합니다.
                    </div>
                // <span className="text-red-500 text-xs font-medium ml-2">
                //   종료시간은 시작시간보다 항상 커야 합니다.
                // </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
