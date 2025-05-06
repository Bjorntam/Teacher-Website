import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";

import { useState, useEffect } from "react";
import Badge from "../../ui/badge/Badge";
import Button from "../../ui/button/Button";
import { Modal } from "../../ui/modal";
import { useModal } from "../../../hooks/useModal";
import Input from "../../form/input/InputField";
import Label from "../../form/Label";
import Select from "../../form/Select";

// Import Firebase dependencies
import { db } from "../../../firebase";
import { 
  collection, 
  doc, 
  updateDoc,
  onSnapshot
} from "firebase/firestore";

interface WeeklySummary {
  date: string;
  consistency: number;
  routines?: Array<{
    name?: string;
    consistency?: number;
    code?: string;
    color?: string;
  }>;
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
  [key: string]: unknown; // For dynamically named fields like 'weeklySummaries.2025-04-14'
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
}

export default function BasicTableOne() {
  // State for storing Firebase data
  const [tableData, setTableData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Modal state
  const { isOpen, openModal, closeModal } = useModal();
  
  // Form state for editing
  const [editEmail, setEditEmail] = useState("");
  const [editParentName, setEditParentName] = useState("");
  const [editChildName, setEditChildName] = useState("");
  const [editGradeLevel, setEditGradeLevel] = useState("");

  const options = [
    { value: "Nursery I", label: "Nursery I" },
    { value: "Nursery II", label: "Nursery II" },
  ];

  // Extract the most recent weekly summary from a student document
  const extractLatestWeeklySummary = (docData: FirestoreDocument): { consistency: number; date: string } | null => {
    // First, check if there's a direct weeklyConsistency field (as seen in the screenshot)
    if (typeof docData.weeklyConsistency === 'number') {
      return {
        consistency: docData.weeklyConsistency,
        date: "latest"
      };
    }
    
    // If no direct weeklyConsistency field, look for the latest date in weeklySummaries
    if (docData.weeklySummaries) {
      const dateKeys = Object.keys(docData.weeklySummaries)
        .filter(key => /^\d{4}-\d{2}-\d{2}$/.test(key));
      
      if (dateKeys.length > 0) {
        // Sort dates in descending order (most recent first)
        dateKeys.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        const latestDate = dateKeys[0];
        
        const latestSummary = docData.weeklySummaries[latestDate];
        if (latestSummary && typeof latestSummary.consistency === 'number') {
          return {
            consistency: latestSummary.consistency,
            date: latestDate
          };
        }
      }
    }
    
    // Check for fields that directly match the pattern "weeklySummaries.YYYY-MM-DD"
    const weeklyKeys = Object.keys(docData)
      .filter(key => key.startsWith('weeklySummaries.') && /^\d{4}-\d{2}-\d{2}$/.test(key.substring(16)));
    
    if (weeklyKeys.length > 0) {
      // Sort to find the most recent one
      weeklyKeys.sort((a, b) => {
        const dateA = a.substring(16); // Extract date part
        const dateB = b.substring(16);
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
      
      const latestKey = weeklyKeys[0];
      const latestDate = latestKey.substring(16);
      
      // Handle nested field access for consistency - use typed unknown instead of any
      const latestSummary = docData[latestKey] as unknown;
      let consistency = 0;
      
      if (typeof latestSummary === 'object' && latestSummary !== null) {
        const summaryObj = latestSummary as Record<string, unknown>;
        
        // Check if consistency field exists directly
        if (typeof summaryObj.consistency === 'number') {
          consistency = summaryObj.consistency;
        }
        // Check if there's a routines array with consistency values
        else if (Array.isArray(summaryObj.routines)) {
          // Calculate average consistency from routines if available
          const routineConsistencies = summaryObj.routines
            .filter(r => {
              return r !== null && 
                    typeof r === 'object' && 
                    'consistency' in r && 
                    typeof (r as Record<string, unknown>).consistency === 'number';
            })
            .map(r => Number((r as Record<string, unknown>).consistency));
          
          if (routineConsistencies.length > 0) {
            consistency = routineConsistencies.reduce((a, b) => a + b, 0) / routineConsistencies.length;
          }
        }
      }
      
      return {
        consistency,
        date: latestDate
      };
    }
    
    return null;
  };

  // Fetch data from Firebase
  useEffect(() => {
    // Set up a real-time listener instead of a one-time fetch
    const studentsCollection = collection(db, "students");
    
    // Using onSnapshot for real-time updates
    const unsubscribe = onSnapshot(studentsCollection, (snapshot) => {
      try {
        const studentsData = snapshot.docs.map(doc => {
          const docData = doc.data() as FirestoreDocument;
          const latestWeeklySummary = extractLatestWeeklySummary(docData);
          
          return {
            id: doc.id,
            ChildsName: docData.ChildName || "N/A",
            Glevel: docData.GradeLevel || "N/A",
            dailySummary: {
              totalCompleted: docData.dailySummary?.totalCompleted || 0,
              totalMissed: docData.dailySummary?.totalMissed || 0
            },
            weeklyConsistency: latestWeeklySummary?.consistency
          };
        });
        
        setTableData(studentsData);
        setLoading(false);
        console.log("Real-time data updated:", studentsData); // Debug log
      } catch (error) {
        console.error("Error processing snapshot data:", error);
        setLoading(false);
      }
    }, (error) => {
      console.error("Error in real-time listener:", error);
      setLoading(false);
    });
    
    // Clean up listener when component unmounts
    return () => unsubscribe();
  }, []);

  // Handle edit modal open
  const handleEditClick = (order: Order) => {
    setSelectedOrder(order);
    setEditChildName(order.ChildsName);
    setEditGradeLevel(order.Glevel);
    openModal();
  };

  // Handle save changes
  const handleSave = async () => {
    if (!selectedOrder) return;
    
    try {
      const docRef = doc(db, "students", selectedOrder.id);   
      
      await updateDoc(docRef, {
        ChildName: editChildName,
        GradeLevel: editGradeLevel
      });
      
      // No need to manually update the UI since we have the onSnapshot listener
      // The listener will automatically update the table with the new data
      
      closeModal();
    } catch (error) {
      console.error("Error updating document:", error);
      alert("Failed to update record. Please try again.");
    }
  };

  const handleSelectChange = (value: string) => {
    setEditGradeLevel(value);
  };

  // Calculate daily summary completion ratio for display
  const getDailySummaryDisplay = (order: Order) => {
    const completed = order.dailySummary?.totalCompleted || 0;
    const missed = order.dailySummary?.totalMissed || 0;
    const total = completed + missed;
    
    return `${completed}/${total}`;
  };

  // Determine color based on completion percentage
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
  
  // Format weekly consistency for display
  const getWeeklyConsistencyDisplay = (consistency: number | undefined) => {
    if (consistency === undefined) return "N/A";
    
    // Round to nearest integer if it's close, otherwise show one decimal place
    const roundedValue = Math.abs(Math.round(consistency) - consistency) < 0.1 
      ? Math.round(consistency)
      : Number(consistency.toFixed(1));
      
    return `${roundedValue}%`;
  };
  
  // Get color based on weekly consistency percentage
  const getWeeklyConsistencyColor = (consistency: number | undefined) => {
    if (consistency === undefined) return "text-gray-400";
    
    if (consistency >= 80) return "text-green-600";
    if (consistency >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1102px]">
          <Table>
            {/* Table Header */}
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
                  Grade Level
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
                  Send Message
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {loading ? (
              <TableRow>
                <TableCell className="px-5 py-4 text-center">
                    <div className="col-span-5 px-5 py-4 text-center">Loading data...</div>
                  </TableCell>
                </TableRow>
                ) : tableData.length === 0 ? (
                  <TableRow>
                    <TableCell className="px-5 py-4 text-center">
                      <div className="col-span-5 px-5 py-4 text-center">No records found</div>
                    </TableCell>
                  </TableRow>
                ) : (
                tableData.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="px-4 py-3 text-gray-800 text-start text-theme-sm dark:text-white/90">
                      <div className="flex -space-x-2">
                        {order.ChildsName}
                      </div>
                    </TableCell>
                    
                    <TableCell className="px-4 py-3 text-gray-800 text-start text-theme-sm dark:text-white/90">
                      <Badge
                        size="sm"
                        color={
                          order.Glevel === "Nursery I"
                            ? "success"
                            : order.Glevel === "Nursery II"
                            ? "warning"
                            : "error"
                        }
                      >
                        {order.Glevel}
                      </Badge>
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
                          variant="edit"
                          onClick={() => handleEditClick(order)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
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
                        options={options}
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
  );
}