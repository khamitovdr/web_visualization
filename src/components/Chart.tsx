import { memo, useMemo } from 'react';
import type uPlot from 'uplot';
import UplotReact from 'uplot-react';
import 'uplot/dist/uPlot.min.css';
import type { DataSeries } from '../hooks/useRealtimeData';

interface ChartProps {
  series: DataSeries[];
  width: number;
  height: number;
}

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

function Chart({ series, width, height }: ChartProps) {
  const { data, options } = useMemo(() => {
    // If no data, return empty chart
    if (series.length === 0) {
      return {
        data: [[], []],
        options: getEmptyOptions(width, height),
      };
    }

    // Combine all series data by timestamp
    const timestampMap = new Map<number, number[]>();

    series.forEach((s, idx) => {
      s.data.forEach(([timestamp, value]) => {
        if (!timestampMap.has(timestamp)) {
          timestampMap.set(timestamp, new Array(series.length).fill(null));
        }
        const row = timestampMap.get(timestamp);
        if (row) {
          row[idx] = value;
        }
      });
    });

    // Sort by timestamp and convert to uPlot format
    const sortedTimestamps = Array.from(timestampMap.keys()).sort((a, b) => a - b);
    const timestamps = sortedTimestamps.map((t) => t / 1000); // Convert to seconds for uPlot
    const seriesData = series.map((_, idx) =>
      sortedTimestamps.map((t) => timestampMap.get(t)?.[idx])
    );

    const data: uPlot.AlignedData = [timestamps, ...seriesData];

    const options = getChartOptions(series, width, height);

    return { data, options };
  }, [series, width, height]);

  return (
    <div className="chart-container">
      <UplotReact options={options} data={data} />
    </div>
  );
}

function getEmptyOptions(width: number, height: number): uPlot.Options {
  return {
    width,
    height,
    series: [
      {},
      {
        label: 'No data',
        stroke: '#60a5fa',
        width: 2,
      },
    ],
    axes: [
      {
        label: 'Time',
        stroke: '#475569',
        grid: {
          stroke: '#334155',
          width: 1,
        },
        ticks: {
          stroke: '#475569',
          width: 1,
        },
      },
      {
        label: 'Value',
        stroke: '#475569',
        grid: {
          stroke: '#334155',
          width: 1,
        },
        ticks: {
          stroke: '#475569',
          width: 1,
        },
      },
    ],
  };
}

function getChartOptions(series: DataSeries[], width: number, height: number): uPlot.Options {
  return {
    width,
    height,
    series: [
      {
        label: 'Time',
      },
      ...series.map((s, idx) => ({
        label: s.name,
        stroke: COLORS[idx % COLORS.length],
        width: 2,
        points: {
          show: false,
        },
      })),
    ],
    axes: [
      {
        label: 'Time',
        space: 60,
        stroke: '#475569',
        grid: {
          stroke: '#334155',
          width: 1,
        },
        ticks: {
          stroke: '#475569',
          width: 1,
        },
        values: (_, ticks) =>
          ticks.map((t) => {
            const date = new Date(t * 1000);
            return date.toLocaleTimeString();
          }),
      },
      {
        label: 'Value',
        space: 50,
        stroke: '#475569',
        grid: {
          stroke: '#334155',
          width: 1,
        },
        ticks: {
          stroke: '#475569',
          width: 1,
        },
      },
    ],
    scales: {
      x: {
        time: false,
      },
    },
    legend: {
      show: true,
      live: true,
    },
    cursor: {
      drag: {
        x: false,
        y: false,
      },
    },
  };
}

export default memo(Chart);
