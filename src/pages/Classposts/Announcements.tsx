import { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import AnnouncementCard from "../../components/form/form-elements/AnnouncementCard";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { db } from "../../firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// Type for new announcement form
interface AnnouncementForm {
  title: string;
  subDesc: string;
  description: string;
  badges: string[];
}

// Type for teacher information
interface TeacherInfo {
  firstName: string;
  lastName: string;
  name: string;
  gradeLevel: string;
}

export default function Announcements() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState<AnnouncementForm>({
    title: "",
    subDesc: "",
    description: "",
    badges: [],
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
    setNewAnnouncement((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddBadge = () => {
    if (newBadge.trim()) {
      setNewAnnouncement((prev) => ({
        ...prev,
        badges: [...prev.badges, newBadge.trim()],
      }));
      setNewBadge("");
    }
  };

  const handleRemoveBadge = (index: number) => {
    setNewAnnouncement((prev) => ({
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
      
      // Create a new document in the announcements collection
      const announcementData = {
        title: newAnnouncement.title,
        subDesc: newAnnouncement.subDesc,
        description: newAnnouncement.description,
        badges: newAnnouncement.badges,
        postedAt: now.toISOString(),
        teacherEmail: userEmail,  // Important: This must match exactly what we query by
        teacherFirstName: teacherInfo.firstName,
        teacherLastName: teacherInfo.lastName,
        teacherName: teacherInfo.name,
        teacherGradeLevel: teacherInfo.gradeLevel,
        createdAt: now.toISOString(),
      };

      console.log("Saving announcement with data:", JSON.stringify(announcementData));

      // Create the announcements collection if it doesn't exist yet
      // This happens automatically when you add the first document
      const announcementsRef = collection(db, "announcements");
      const docRef = await addDoc(announcementsRef, announcementData);
      
      console.log("Announcement saved with ID:", docRef.id);

      console.log("Announcement added successfully");

      // Reset form and close modal
      setNewAnnouncement({
        title: "",
        subDesc: "",
        description: "",
        badges: [],
      });
      setIsModalOpen(false);

      // Reload the page to show the new announcement
      window.location.reload();
    } catch (error) {
      console.error("Error adding document: ", error);
      setError("Failed to post announcement. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageMeta title="Announcements Dashboard | School Management System" description="View and manage school announcements" />
      <PageBreadcrumb pageTitle="Announcements" />

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold dark:text-white">Posted Announcements</h2>
                <Button
                  size="sm"
                  variant="primary"
                  className="flex items-center gap-2"
                  onClick={() => setIsModalOpen(true)}
                >
                  Post Announcement
                </Button>
              </div>
              <AnnouncementCard />
            </div>
          </div>
        </div>
      </div>

      {/* Modal for creating new announcement */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold dark:text-white">Create New Announcement</h3>
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
                      value={newAnnouncement.title}
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
                      value={newAnnouncement.subDesc}
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
                      value={newAnnouncement.description}
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
                      {newAnnouncement.badges.map((badge, index) => (
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
                    {isSubmitting ? "Posting..." : "Post Announcement"}
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