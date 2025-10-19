import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";

import { useState, useEffect } from "react";
import Button from "../../ui/button/Button";
import { Modal } from "../../ui/modal";
import { useModal } from "../../../hooks/useModal";
import Input from "../../form/input/InputField";
import Label from "../../form/Label";
import Select from "../../form/Select";
import BarChartOne from "../../charts/bar/BarChartOne";
import ConsistencyGraph from "./ConsistencyGraph";
import ComponentCard from "../../common/ComponentCard";

// Import Firebase dependencies
import { db } from "../../../firebase";
import { 
  collection, 
  doc, 
  updateDoc,
  onSnapshot,
  getDoc,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// Import ApexCharts
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface RoutineData {
  name?: string;
  consistency?: number;
  code?: string;
  color?: string;
}

interface WeeklySummary {
  date: string;
  consistency: number;
  weeklyConsistency?: number;
  routines?: RoutineData[];
}

interface FirestoreDocument {
  ChildName?: string;
  GradeLevel?: string;
  dailySummary?: {
    totalCompleted?: number;
    totalMissed?: number;
    lastUpdated?: string;
  };
  weeklyConsistency?: number;
  weeklySummaries?: Record<string, WeeklySummary>;
  [key: string]: unknown;
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
  weeklySummaries?: Record<string, WeeklySummary>;
  latestRoutines?: RoutineData[];
}

type SortOption = "consistencyAsc" | "consistencyDesc";

export default function BasicTableOne() {
  const [tableData, setTableData] = useState<Order[]>([]);
  const [filteredData, setFilteredData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder] = useState<Order | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("consistencyDesc");
  const [teacherGradeLevel, setTeacherGradeLevel] = useState<string | null>(null);
  const [teacherLoading, setTeacherLoading] = useState(true);
  const [graphType, setGraphType] = useState<"bar" | "line">("bar");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const { isOpen, closeModal } = useModal();
  const [editEmail, setEditEmail] = useState("");
  const [editParentName, setEditParentName] = useState("");
  const [editChildName, setEditChildName] = useState("");
  const [editGradeLevel, setEditGradeLevel] = useState("");

  const sortOptions = [
    { value: "consistencyDesc", label: "Weekly Consistency (High to Low)" },
    { value: "consistencyAsc", label: "Weekly Consistency (Low to High)" },
  ];

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        try {
          const docRef = doc(db, "teachers", user.email);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const teacherData = docSnap.data();
            setTeacherGradeLevel(teacherData.GradeLevel || "N/A");
          } else {
            console.error("No teacher document found for email:", user.email);
            setTeacherGradeLevel("N/A");
          }
        } catch (error) {
          console.error("Error fetching teacher data:", error);
          setTeacherGradeLevel("N/A");
        }
      } else {
        console.error("No user is logged in or email is missing");
        setTeacherGradeLevel("N/A");
      }
      setTeacherLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const extractLatestWeeklySummary = (docData: FirestoreDocument): { 
    consistency: number; 
    date: string;
    routines?: RoutineData[];
  } | null => {
    if (typeof docData.weeklyConsistency === 'number') {
      return {
        consistency: docData.weeklyConsistency,
        date: "latest"
      };
    }
    
    if (docData.weeklySummaries) {
      const dateKeys = Object.keys(docData.weeklySummaries)
        .filter(key => /^\d{4}-\d{2}-\d{2}$/.test(key));
      
      if (dateKeys.length > 0) {
        dateKeys.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        const latestDate = dateKeys[0];
        
        const latestSummary = docData.weeklySummaries[latestDate];
        if (latestSummary) {
          return {
            consistency: latestSummary.consistency || 0,
            date: latestDate,
            routines: latestSummary.routines
          };
        }
      }
    }
    
    const weeklyKeys = Object.keys(docData)
      .filter(key => key.startsWith('weeklySummaries.') && /^\d{4}-\d{2}-\d{2}$/.test(key.substring(16)));
    
    if (weeklyKeys.length > 0) {
      weeklyKeys.sort((a, b) => {
        const dateA = a.substring(16);
        const dateB = b.substring(16);
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
      
      const latestKey = weeklyKeys[0];
      const latestDate = latestKey.substring(16);
      
      const latestSummary = docData[latestKey] as unknown;
      let consistency = 0;
      let routines: RoutineData[] | undefined = undefined;
      
      if (typeof latestSummary === 'object' && latestSummary !== null) {
        const summaryObj = latestSummary as Record<string, unknown>;
        
        if (typeof summaryObj.consistency === 'number') {
          consistency = summaryObj.consistency;
        }
        
        if (Array.isArray(summaryObj.routines)) {
          routines = summaryObj.routines as RoutineData[];
          
          if (typeof summaryObj.consistency !== 'number' && routines.length > 0) {
            const routineConsistencies = routines
              .filter(r => typeof r.consistency === 'number')
              .map(r => Number(r.consistency));
            
            if (routineConsistencies.length > 0) {
              consistency = routineConsistencies.reduce((a, b) => a + b, 0) / routineConsistencies.length;
            }
          }
        }
      }
      
      return {
        consistency,
        date: latestDate,
        routines
      };
    }
    
    return null;
  };

  useEffect(() => {
    if (!teacherGradeLevel || teacherLoading) return;

    const studentsCollection = collection(db, "students");
    
    const unsubscribe = onSnapshot(studentsCollection, (snapshot) => {
      try {
        const studentsData = snapshot.docs.map(doc => {
          // raw doc data (may contain flattened keys like 'weeklySummaries.2025-09-12')
          const raw = doc.data() as Record<string, any>;
          const docData = raw as FirestoreDocument;
          
          // Ensure we have a proper weeklySummaries map even if Firestore stored flattened fields
          let weeklySummariesObj = docData.weeklySummaries as Record<string, WeeklySummary> | undefined;
          const flattenedKeys = Object.keys(raw).filter(k =>
            k.startsWith("weeklySummaries.") &&
            /^\d{4}-\d{2}-\d{2}$/.test(k.substring("weeklySummaries.".length))
          );
          if ((!weeklySummariesObj || Object.keys(weeklySummariesObj).length === 0) && flattenedKeys.length > 0) {
            weeklySummariesObj = {};
            flattenedKeys.forEach(k => {
              const date = k.substring("weeklySummaries.".length);
              weeklySummariesObj![date] = raw[k];
            });
          }
          
          const latestWeeklySummary = extractLatestWeeklySummary(docData);
          
          return {
            id: doc.id,
            ChildsName: docData.ChildName || "N/A",
            Glevel: docData.GradeLevel || "N/A",
            dailySummary: {
              totalCompleted: docData.dailySummary?.totalCompleted || 0,
              totalMissed: docData.dailySummary?.totalMissed || 0
            },
            weeklyConsistency: latestWeeklySummary?.consistency,
            // use the normalized map (either the original or the one built from flattened keys)
            weeklySummaries: weeklySummariesObj,
            latestRoutines: latestWeeklySummary?.routines
          };
        });

        const filteredStudents = studentsData.filter(student => 
          student.Glevel.toLowerCase() === teacherGradeLevel.toLowerCase()
        );
        
        setTableData(filteredStudents);
        setFilteredData(filteredStudents);
        setLoading(false);
        console.log("Real-time data updated:", filteredStudents);
      } catch (error) {
        console.error("Error processing snapshot data:", error);
        setLoading(false);
      }
    }, (error) => {
      console.error("Error in real-time listener:", error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [teacherGradeLevel, teacherLoading]);

  useEffect(() => {
    let result = [...tableData];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.ChildsName.toLowerCase().includes(query)
      );
    }
    
    result = sortData(result, sortOption);
    
    setFilteredData(result);
  }, [searchQuery, sortOption, tableData]);

  const sortData = (data: Order[], sortType: SortOption): Order[] => {
    const sortedData = [...data];
    
    switch (sortType) {
      case "consistencyAsc":
        return sortedData.sort((a, b) => 
          (a.weeklyConsistency || 0) - (b.weeklyConsistency || 0)
        );
      case "consistencyDesc":
        return sortedData.sort((a, b) => 
          (b.weeklyConsistency || 0) - (a.weeklyConsistency || 0)
        );
      default:
        return sortedData;
    }
  };

  const handleChartClick = (orderId: string) => {
    setExpandedRowId(prevId => prevId === orderId ? null : orderId);
    setGraphType("bar");
    setSelectedDate("");
  };

  const toggleGraphType = () => {
    setGraphType(prevType => prevType === "bar" ? "line" : "bar");
  };

  const handleSave = async () => {
    if (!selectedOrder) return;
    
    try {
      const docRef = doc(db, "students", selectedOrder.id);   
      
      await updateDoc(docRef, {
        ChildName: editChildName,
        GradeLevel: editGradeLevel
      });
      
      closeModal();
    } catch (error) {
      console.error("Error updating document:", error);
      alert("Failed to update record. Please try again.");
    }
  };

  const handleSelectChange = (value: string) => {
    setEditGradeLevel(value);
  };

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
  };

  const getDailySummaryDisplay = (order: Order) => {
    const completed = order.dailySummary?.totalCompleted || 0;
    const missed = order.dailySummary?.totalMissed || 0;
    const total = completed + missed;
    
    return `${completed}/${total}`;
  };

  const getDailySummaryColor = (order: Order) => {
    const completed = order.dailySummary?.totalCompleted || 0;
    const missed = order.dailySummary?.totalMissed || 0;
    const total = completed + missed;
    
    if (total === 0) return "text-gray-400";
    
    const percentage = (completed / total) * 100;
    
    if (percentage >= 75) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };
  
  const getWeeklyConsistencyDisplay = (consistency: number | undefined) => {
    if (consistency === undefined) return "N/A";
    
    const roundedValue = Math.abs(Math.round(consistency) - consistency) < 0.1 
      ? Math.round(consistency)
      : Number(consistency.toFixed(1));
      
    return `${roundedValue}%`;
  };
  
  const getWeeklyConsistencyColor = (consistency: number | undefined) => {
    if (consistency === undefined) return "text-gray-400";
    
    if (consistency >= 80) return "text-green-600";
    if (consistency >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getAvailableDates = (order: Order): { value: string; label: string }[] => {
    if (!order.weeklySummaries) return [];
    const dates = Object.keys(order.weeklySummaries)
      .filter(key => /^\d{4}-\d{2}-\d{2}$/.test(key))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    return dates.map(date => ({ value: date, label: date }));
  };

const getLineChartData = (order: Order) => {
  if (!order.weeklySummaries) return { categories: [], data: [] };
  
  const dates = Object.keys(order.weeklySummaries)
    .filter(key => /^\d{4}-\d{2}-\d{2}$/.test(key))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  
  const data = dates.map(date => {
    const summary: any = order.weeklySummaries![date];
    let consistency = 0;

    if (summary == null) {
      consistency = 0;
    } else if (typeof summary === "number") {
      consistency = Number(summary);
    } else if (typeof summary === "object") {
      if (typeof summary.consistency === "number") {
        consistency = Number(summary.consistency);
      } else if (typeof summary.weeklyConsistency === "number") {
        consistency = Number(summary.weeklyConsistency);
      } else if (Array.isArray(summary.routines)) {
        const nums = summary.routines
          .filter((r: any) => typeof r.consistency === "number")
          .map((r: any) => Number(r.consistency));
        if (nums.length > 0) {
          consistency = nums.reduce((a: number, b: number) => a + b, 0) / nums.length;
        }
      }
    }

    return Number(isNaN(consistency) ? 0 : Math.round(consistency));
  });
  
  return { categories: dates, data };
};

  return (
    <div>
      {/* Render ConsistencyGraph with filteredData */}
      {teacherLoading || loading ? (
        <div className="flex items-center justify-center h-40 text-gray-500">
          Loading data...
        </div>
      ) : (
          <ConsistencyGraph filteredData={filteredData} />
      )}
      
      {/* Existing Table */}
      <ComponentCard title="Students Daily Summary and Weekly Consistency Progress">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="p-5 border-b border-gray-100 dark:border-white/[0.05]">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="w-full md:w-1/3">
                <Input
                  type="text"
                  placeholder="Search by child's name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-48">
                  <Select
                    options={sortOptions}
                    placeholder="Sort by"
                    onChange={(value) => setSortOption(value as SortOption)}
                    className="dark:bg-dark-900"
                    defaultValue="consistencyDesc"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[1102px]">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Child's Name
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Daily Summary
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Weekly Consistency
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Graph
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {teacherLoading || loading ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-4 text-center">
                        <div className="px-5 py-4 text-center">Loading data...</div>
                      </td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-4 text-center">
                        <div className="px-5 py-4 text-center">
                          {teacherGradeLevel === "N/A" 
                            ? "No teacher grade level assigned"
                            : "No records found"}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((order) => (
                      <>
                        <TableRow key={order.id}>
                          <TableCell className="px-4 py-3 text-gray-800 text-start text-theme-sm dark:text-white/90">
                            <div className="flex -space-x-2">
                              {order.ChildsName}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-800 text-start text-theme-sm dark:text-white/90">
                            <div className={`flex -space-x-2 font-medium ${getDailySummaryColor(order)}`}>
                              {getDailySummaryDisplay(order)}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-800 text-start text-theme-sm dark:text-white/90">
                            <div className={`flex -space-x-2 font-medium ${getWeeklyConsistencyColor(order.weeklyConsistency)}`}>
                              {getWeeklyConsistencyDisplay(order.weeklyConsistency)}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                            <div className="flex space-x-2">
                              <Button
                                size="md"
                                variant="primary"
                                onClick={() => handleChartClick(order.id)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                                </svg>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {expandedRowId === order.id && (
                          <tr
                            className="bg-gray-50 dark:bg-gray-800/50 chart-row"
                            style={{
                              maxHeight: expandedRowId === order.id ? '500px' : '0',
                              overflow: 'hidden',
                              transition: 'max-height 0.3s ease-in-out',
                            }}
                          >
                            <td colSpan={4} className="px-4 py-4">
                              <div className="rounded-lg p-4">
                                <div className="flex justify-between mb-4">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={toggleGraphType}
                                  >
                                    {graphType === "bar" ? "View Weekly Summaries" : "View Current Week"}
                                  </Button>
                                  {graphType === "line" && (
                                    <div className="w-48">
                                      <Select
                                        options={getAvailableDates(order)}
                                        placeholder="Select Date"
                                        onChange={handleDateChange}
                                        className="dark:bg-dark-900"
                                        defaultValue={selectedDate}
                                      />
                                    </div>
                                  )}
                                </div>
                                {graphType === "bar" ? (
                                  selectedDate && order.weeklySummaries?.[selectedDate] ? (
                                    <BarChartOne 
                                      routines={order.weeklySummaries[selectedDate].routines} 
                                      childName={order.ChildsName} 
                                    />
                                  ) : (
                                    <BarChartOne 
                                      routines={order.latestRoutines} 
                                      childName={order.ChildsName} 
                                    />
                                  )
                                ) : (
                                  <LineChartOneWrapper 
                                    chartData={getLineChartData(order)} 
                                  />
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
              <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                <div className="px-2 pr-14">
                  <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                    Edit Personal Information
                  </h4>
                  <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                    Update parents account details to keep their profile up-to-date.
                  </p>
                </div>
                <form className="flex flex-col" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                  <div className="custom-scrollbar h-[270px] overflow-y-auto px-2 pb-3">
                    <div className="mt-7">
                      <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                        Personal Information
                      </h5>

                      <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                        <div className="col-span-2 lg:col-span-1">
                          <Label>Email Address</Label>
                          <Input 
                            type="text" 
                            value={editEmail} 
                            onChange={(e) => setEditEmail(e.target.value)} 
                          />
                        </div>
                        <div className="col-span-2 lg:col-span-1">
                          <Label>Parents Name</Label>
                          <Input 
                            type="text" 
                            value={editParentName} 
                            onChange={(e) => setEditParentName(e.target.value)} 
                          />
                        </div>
                        <div className="col-span-2 lg:col-span-1">
                          <Label>Child Name</Label>
                          <Input 
                            type="text" 
                            value={editChildName} 
                            onChange={(e) => setEditChildName(e.target.value)} 
                          />
                        </div>
                        <div>
                          <Label>Grade Level</Label>
                          <Select
                            options={teacherGradeLevel ? [{ value: teacherGradeLevel, label: teacherGradeLevel }] : []}
                            placeholder="Select Grade level"
                            onChange={handleSelectChange}
                            className="dark:bg-dark-900"
                            defaultValue={editGradeLevel} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                    <Button size="sm" variant="outline" onClick={closeModal} type="button">
                      Close
                    </Button>
                    <Button size="sm" type="submit">
                      Save Changes
                    </Button>
                  </div>
                </form>
              </div>
            </Modal>
          </div>
        </div>
      </ComponentCard>
    </div>
  );
}

interface LineChartOneWrapperProps {
  chartData: {
    categories: string[];
    data: number[];
  };
}

function LineChartOneWrapper({ chartData }: LineChartOneWrapperProps) {
  const isDarkMode = false;
  const options: ApexOptions = {
    legend: {
      show: false,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#465FFF", "#9CB9FF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "line",
      toolbar: {
        show: false,
      },
    },
    title: {
      text: `Weekly Routine Consistency Summaries`,
      align: 'center',
      style: {
        fontSize: '16px',
        fontWeight: 500,
        color: isDarkMode ? '#F3F4F6' : '#4B5563' // Title color based on theme
      }
    },
    stroke: {
      curve: "straight",
      width: [2, 2],
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      x: {
        format: "dd MMM yyyy",
      },
    },
    xaxis: {
      type: "category",
      categories: chartData.categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 5,
      labels: {
         formatter: (val: number) => `${val}%`,
        style: {
          fontSize: "12px",
          colors: ["#6B7280"],
        },
      },
      title: {
        text: "",
        style: {
          fontSize: "0px",
        },
      },
    },
  };

  const series = [
    {
      name: "Consistency",
      data: chartData.data,
    },
  ];

  return (
    <div className="max-w-full overflow-x-auto custom-scrollbar">
      <div id="chartEight" className="min-w-[1000px]">
        <Chart options={options} series={series} type="area" height={310} />
      </div>
    </div>
  );
}