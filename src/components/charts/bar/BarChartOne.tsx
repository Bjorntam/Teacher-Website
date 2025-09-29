import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface RoutineData {
  name?: string;
  consistency?: number;
  color?: string;
  code?: string;
}

interface BarChartOneProps {
  routines?: RoutineData[];
  childName?: string;
}

export default function BarChartOne({ routines = [], childName = "Child" }: BarChartOneProps) {
  // Define theme colors - can be from theme context in a real app
  const isDarkMode = false; // This could be from a theme context
  // Extract data from routines for the chart
  const categories = routines.map(routine => routine.name || "Unnamed");
  const consistencyData = routines.map(routine => routine.consistency || 0);
  
  // Define custom colors if not provided in the routines
  const defaultColors = ["#465fff", "#27AE60", "#F1C40F", "#8E44AD", "#E74C3C", "#1ABC9C", "#F39C12", "#3498DB"];
  const colors = routines.map((routine, index) => {
    console.log("Routine color:", routine.color); // Debug log
    return routine.color ? String(routine.color) : defaultColors[index % defaultColors.length];
  });

  const options: ApexOptions = {
    colors: colors,
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      },
    },
    title: {
      text: `${childName}'s Routine Consistency`,
      align: 'center',
      style: {
        fontSize: '16px',
        fontWeight: 500,
        color: isDarkMode ? '#F3F4F6' : '#4B5563' // Title color based on theme
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
        distributed: true, // Enable this to use different colors for each bar
        dataLabels: {
          position: 'top',
        }
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: false, // Hide legend since we're using distributed colors
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 5,
      labels: {
        formatter: (val: number) => `${val}%`,
      },
      title: {
        text: undefined,
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
      x: {
        show: true,
      },
      y: {
        formatter: (val: number) => `${val}%`,
      },
    },
  };

  const series = [
    {
      name: "Consistency",
      data: consistencyData,
    },
  ];

  // Show a message if no routines data is available
  if (routines.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500">
        No routine data available for {childName}.
      </div>
    );
  }

  return (
    <div className="max-w-full overflow-x-auto custom-scrollbar">
      <div id="chartOne" className="min-w-[600px]">
        <Chart 
          options={options} 
          series={series} 
          type="bar" 
          height={320} 
        />
        <div className="text-xs text-center mt-2 text-gray-500">
          {routines.length > 0 ? `${routines.length} routines tracked` : ''}
        </div>
      </div>
    </div>
  );
}