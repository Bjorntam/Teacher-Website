import { useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import Select from "../../form/Select";

interface RoutineData {
  name?: string;
  consistency?: number;
  code?: string;
  color?: string;
}

interface Order {
  id: string;
  ChildsName: string;
  Glevel: string;
  dailySummary?: {
    totalCompleted: number;
    totalMissed: number;
  };
  weeklyConsistency?: number;
  weeklySummaries?: Record<string, { date: string; consistency: number; routines?: RoutineData[] }>;
  latestRoutines?: RoutineData[];
}

interface ConsistencyGraphProps {
  filteredData: Order[];
}

export default function ConsistencyGraph({ filteredData }: ConsistencyGraphProps) {
  const [selectedRoutine, setSelectedRoutine] = useState<string>("All");

  // Get unique routine names for filter
  const routineOptions = [
    { value: "All", label: "All Routines" },
    ...Array.from(
      new Set(
        filteredData
          .flatMap(order => order.latestRoutines?.map(routine => routine.name || "Unnamed") || [])
      )
    ).map(name => ({ value: name, label: name }))
  ];

  // find a color for a selected routine (prefer latestRoutines, then scan weeklySummaries)
  const getRoutineColor = (routineName: string) => {
    const defaultColor = "#465FFF";
    if (!routineName || routineName === "All") return defaultColor;

    // search latestRoutines first
    for (const order of filteredData) {
      const foundLatest = order.latestRoutines?.find(r => String(r.name).toLowerCase() === String(routineName).toLowerCase());
      if (foundLatest && foundLatest.color) return foundLatest.color;
    }

    // then scan weeklySummaries
    for (const order of filteredData) {
      if (!order.weeklySummaries) continue;
      const dates = Object.keys(order.weeklySummaries).filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k));
      for (const d of dates) {
        const s: any = order.weeklySummaries![d];
        if (s && Array.isArray(s.routines)) {
          const f = s.routines.find((r: any) => String(r.name).toLowerCase() === String(routineName).toLowerCase());
          if (f && f.color) return f.color;
        }
      }
    }

    return defaultColor;
  };

  const routineColor = getRoutineColor(selectedRoutine);

  // Chart configuration
  const chartOptions: ApexOptions = {
    colors: [routineColor],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 250,
      toolbar: {
        show: false,
      },
    },
    title: {
      text: "Student Weekly Consistency Comparison",
      align: "center",
      style: {
        fontSize: "18px",
        fontWeight: 500,
        color: "#4B5563",
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "30%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    xaxis: {
      categories: filteredData.map(order => order.ChildsName),
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      title: {
        text: "Students",
      },
      labels: {
        rotate: -45,
        rotateAlways: true,
        style: {
          fontSize: "12px",
        },
      },
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 5,
      labels: {
        formatter: (val: number) => `${Math.round(val)}%`,
      },
      title: {
        text: "Consistency",
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
      formatter: (val: number) => `${Math.round(val)}%`,
      },
    },
  };

  const chartSeries = [{
    name: "Consistency",
    data: filteredData.map(order => {
      if (selectedRoutine === "All") {
        return order.weeklyConsistency || 0;
      }
      const routine = order.latestRoutines?.find(r => r.name === selectedRoutine);
      return routine?.consistency || 0;
    }),
  }];

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white/90">
          Student Weekly Consistency Comparison
        </h3>
        <div className="w-48">
          <Select
            options={routineOptions}
            placeholder="Select Routine"
            onChange={(value) => setSelectedRoutine(value)}
            className="dark:bg-dark-900"
            defaultValue="All"
          />
        </div>
      </div>
      {filteredData.length > 0 ? (
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <div className="min-w-[600px]">
            <Chart 
              options={chartOptions} 
              series={chartSeries} 
              type="bar" 
              height={350} 
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-40 text-gray-500">
          No data available for comparison
        </div>
      )}
    </div>
  );
}