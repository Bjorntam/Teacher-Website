import { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import AssignmentCard from "../../components/form/form-elements/AssignmentCard";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { db } from "../../firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";

// Type for new assignment form
interface AssignmentForm {
  title: string;
  subDesc: string;
  description: string;
  badges: string[];
  deadline?: string; // store the datetime-local value (will convert to ISO before saving)
}

// Type for teacher information
interface TeacherInfo {
  firstName: string;
  lastName: string;
  name: string;
  gradeLevel: string;
}

export default function Assignments() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState<AssignmentForm>({
    title: "",
    subDesc: "",
    description: "",
    badges: [],
    deadline: "",
  });
  const [newBadge, setNewBadge] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo>({
    firstName: "",
    lastName: "",
    name: "",
    gradeLevel: "",
  });

  // Initialize Firebase Auth
  const auth = getAuth();

  // Get the logged-in user's email and teacher info
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserEmail(user.email);
        
        // Fetch teacher information
        if (user.email) {
          try {
            const teacherDocRef = doc(db, "teachers", user.email);
            const teacherDocSnap = await getDoc(teacherDocRef);
            
            if (teacherDocSnap.exists()) {
              const data = teacherDocSnap.data();
              setTeacherInfo({
                firstName: data.FirstName || "",
                lastName: data.LastName || "",
                name: data.Name || "",
                gradeLevel: data.GradeLevel || "",
              });
            }
          } catch (error) {
            console.error("Error fetching teacher info:", error);
          }
        }
      } else {
        setError("User not logged in");
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewAssignment((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddBadge = () => {
    if (newBadge.trim()) {
      setNewAssignment((prev) => ({
        ...prev,
        badges: [...prev.badges, newBadge.trim()],
      }));
      setNewBadge("");
    }
  };

  const handleRemoveBadge = (index: number) => {
    setNewAssignment((prev) => ({
      ...prev,
      badges: prev.badges.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!userEmail) {
      setError("User not logged in");
      setIsSubmitting(false);
      return;
    }

    try {
      const now = new Date();
      
      // convert deadline (datetime-local / ISO string) to ISO if provided and valid
      let deadlineIso: string | null = null;
      if (newAssignment.deadline && newAssignment.deadline.trim() !== "") {
        const d = new Date(newAssignment.deadline);
        if (!isNaN(d.getTime())) {
          deadlineIso = d.toISOString();
        } else {
          // fallback: try parsing as ISO already
          const d2 = new Date(String(newAssignment.deadline));
          if (!isNaN(d2.getTime())) deadlineIso = d2.toISOString();
        }
      }

      // validation: prevent posting if deadline is in the past
      if (deadlineIso) {
        const deadlineDate = new Date(deadlineIso);
        if (deadlineDate.getTime() < now.getTime()) {
          setError("Deadline cannot be in the past.");
          setIsSubmitting(false);
          return;
        }
      }

      // Create a new document in the assignments collection
      const assignmentData = {
        title: newAssignment.title,
        subDesc: newAssignment.subDesc,
        description: newAssignment.description,
        badges: newAssignment.badges,
        postedAt: now.toISOString(),
        teacherEmail: userEmail,
        teacherFirstName: teacherInfo.firstName,
        teacherLastName: teacherInfo.lastName,
        teacherName: teacherInfo.name,
        teacherGradeLevel: teacherInfo.gradeLevel,
        createdAt: now.toISOString(),
        deadline: deadlineIso, // will be null if not set
      };

      console.log("Saving assignment with data:", JSON.stringify(assignmentData));

      // Create the assignments collection if it doesn't exist yet
      const assignmentsRef = collection(db, "assignments");
      const docRef = await addDoc(assignmentsRef, assignmentData);
      
      console.log("Assignment saved with ID:", docRef.id);

      console.log("Assignment added successfully");

      // Reset form and close modal
      setNewAssignment({
        title: "",
        subDesc: "",
        description: "",
        badges: [],
        deadline: "",
      });
      setIsModalOpen(false);

      // Reload the page to show the new assignment
      window.location.reload();
    } catch (error) {
      console.error("Error adding document: ", error);
      setError("Failed to post assignment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageMeta title="Assignments Dashboard | School Management System" description="View and manage school assignments" />
      <PageBreadcrumb pageTitle="Assignments" />

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold dark:text-white">Posted Assignments</h2>
                <Button
                  size="sm"
                  variant="primary"
                  className="flex items-center gap-2"
                  onClick={() => setIsModalOpen(true)}
                >
                  Post Assignment
                </Button>
              </div>
              <AssignmentCard />
            </div>
          </div>
        </div>
      </div>

      {/* Modal for creating new assignment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold dark:text-white">Create New Assignment</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  &times;
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={newAssignment.title}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      name="subDesc"
                      value={newAssignment.subDesc}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={newAssignment.description}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      rows={5}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Badges
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={newBadge}
                        onChange={(e) => setNewBadge(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Enter badge name"
                      />
                      <button
                        type="button"
                        onClick={handleAddBadge}
                        className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {newAssignment.badges.map((badge, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {badge}
                          <button
                            type="button"
                            onClick={() => handleRemoveBadge(index)}
                            className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Deadline picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Deadline (optional)
                    </label>
                    <div className="relative w-full flatpickr-wrapper">
                      <Flatpickr
                        value={newAssignment.deadline ? new Date(newAssignment.deadline) : undefined}
                        onChange={(dates: Date[]) => {
                          const d = dates && dates[0];
                          setNewAssignment((prev) => ({
                            ...prev,
                            deadline: d ? d.toISOString() : "",
                          }));
                        }}
                        options={{
                          enableTime: true,
                          // use 12-hour clock with AM/PM
                          time_24hr: false,
                          // show AM/PM in formatted string
                          dateFormat: "Y-m-d h:i K",
                          appendTo: typeof document !== "undefined" ? document.body : undefined,
                        }}
                        className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-none focus:ring  dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700  dark:focus:border-brand-800"
                        placeholder="Select deadline (optional)"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Leave blank for no deadline.</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Posting..." : "Post Assignment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}