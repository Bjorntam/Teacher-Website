import { useState, useEffect } from "react";
import { db } from "../../../firebase";
import { collection, getDocs, doc, deleteDoc, query, orderBy, where } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// Type for assignment data (same structure as announcements)
interface Assignment {
  id: string;
  title: string;
  subDesc: string;
  description: string;
  postedAt: string;
  badges: string[];
  teacherEmail: string;
  teacherFirstName: string;
  teacherLastName: string;
  teacherGradeLevel: string;
  teacherName: string;
  deadline?: string | null; // ISO string if present
}

export default function AssignmentCard() {
  const [, setAssignments] = useState<Assignment[]>([]);
  const [ongoingAssignments, setOngoingAssignments] = useState<Assignment[]>([]);
  const [pastAssignments, setPastAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
        console.log("Authenticated user email:", user.email);
      } else {
        setError("User not logged in");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  // Helper to parse Firestore stored date into a JS Date. Accepts string, Firestore Timestamp-like object, or Date-like.
  const parseFirestoreDate = (value: any): Date | null => {
    if (!value) return null;
    if (typeof value === "string") {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    }
    // Firestore Timestamp has seconds prop
    if (typeof value === "object" && value.seconds !== undefined) {
      return new Date(value.seconds * 1000);
    }
    // If it's a Date already or has toDate()
    if (value.toDate && typeof value.toDate === "function") {
      return value.toDate();
    }
    if (value instanceof Date) {
      return value;
    }
    return null;
  };

  useEffect(() => {
    if (!userEmail) return;

    const fetchAssignments = async () => {
      try {
        console.log("Fetching assignments for:", userEmail);

        const collectionRef = collection(db, "assignments");
        const q = query(
          collectionRef,
          where("teacherEmail", "==", userEmail.toLowerCase()),
          orderBy("postedAt", "desc")
        );

        console.log("Query created for user:", userEmail);
        const querySnapshot = await getDocs(q);
        console.log("Query results:", querySnapshot.size, "documents found");

        const assignmentsData: Assignment[] = [];
        querySnapshot.forEach((doc) => {
          const data: any = doc.data();
          console.log("Processing document:", doc.id, data);

          // Normalize deadline to ISO string (if present)
          const deadlineDate = parseFirestoreDate(data.deadline);
          const deadlineIso = deadlineDate ? deadlineDate.toISOString() : null;

          assignmentsData.push({
            id: doc.id,
            title: data.title || "",
            subDesc: data.subDesc || "",
            description: data.description || "",
            postedAt: data.postedAt || "",
            badges: Array.isArray(data.badges) ? data.badges : [],
            teacherEmail: data.teacherEmail || "",
            teacherFirstName: data.teacherFirstName || "",
            teacherLastName: data.teacherLastName || "",
            teacherGradeLevel: data.teacherGradeLevel || "",
            teacherName: data.teacherName || "",
            deadline: deadlineIso,
          });
        });

        setAssignments(assignmentsData);

        // Separate into ongoing vs past-deadline
        const now = new Date();
        const past: Assignment[] = [];
        const ongoing: Assignment[] = [];

        assignmentsData.forEach((a) => {
          if (a.deadline) {
            const d = new Date(a.deadline);
            if (!isNaN(d.getTime()) && now > d) {
              past.push(a);
            } else {
              ongoing.push(a);
            }
          } else {
            // No deadline -> treat as ongoing
            ongoing.push(a);
          }
        });

        setOngoingAssignments(ongoing);
        setPastAssignments(past);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching assignments: ", error);
        setError(`Failed to load assignments: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [userEmail]);

  const handleDelete = async (id: string) => {
    if (!userEmail) {
      setError("User not logged in");
      return;
    }

    if (!confirm("Are you sure you want to delete this assignment?")) {
      return;
    }

    try {
      const docRef = doc(db, "assignments", id);
      await deleteDoc(docRef);
      setAssignments((prev) => prev.filter((assignment) => assignment.id !== id));
      setOngoingAssignments((prev) => prev.filter((assignment) => assignment.id !== id));
      setPastAssignments((prev) => prev.filter((assignment) => assignment.id !== id));
      console.log(`Assignment ${id} deleted successfully`);
    } catch (error) {
      console.error("Error deleting assignment: ", error);
      setError("Failed to delete assignment. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      return `${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} | ${date.toLocaleDateString([], { month: "2-digit", day: "2-digit", year: "numeric" })}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  const formatDeadline = (deadlineIso?: string | null) => {
    if (!deadlineIso) return "No deadline";
    try {
      const d = new Date(deadlineIso);
      return `${d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } catch {
      return deadlineIso;
    }
  };

  if (loading) return <div className="text-center py-6 dark:text-white">Loading assignments...</div>;
  if (error) return <div className="text-center py-6 text-red-500">{error}</div>;
  if (ongoingAssignments.length === 0 && pastAssignments.length === 0) return <div className="text-center py-6 dark:text-white">No assignments found</div>;

  const renderCard = (assignment: Assignment) => (
    <div
      key={assignment.id}
      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800"
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold dark:text-white">{assignment.title}</h3>
            {assignment.badges &&
              assignment.badges.map((badge, index) => (
                <span
                  key={index}
                  className={`px-2 py-1 text-xs font-medium rounded-md ${
                    index % 3 === 0
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                      : index % 3 === 1
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  }`}
                >
                  {badge}
                </span>
              ))}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{assignment.subDesc}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(assignment.postedAt)}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Deadline: {formatDeadline(assignment.deadline)}
            </div>
          </div>
          <button
            onClick={() => handleDelete(assignment.id)}
            className="p-2 rounded-md bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="p-4">
        <p className="text-gray-700 dark:text-gray-300">{assignment.description}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold dark:text-white mb-3">Ongoing Assignments</h2>
        {ongoingAssignments.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">No ongoing assignments</div>
        ) : (
          <div className="space-y-4">
            {ongoingAssignments.map(renderCard)}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold dark:text-white mb-3">Past Deadline Assignments</h2>
        {pastAssignments.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">No past deadline assignments</div>
        ) : (
          <div className="space-y-4">
            {pastAssignments.map(renderCard)}
          </div>
        )}
      </div>
    </div>
  );
}