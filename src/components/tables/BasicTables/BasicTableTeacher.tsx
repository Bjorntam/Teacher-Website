import { useState, useEffect } from "react";
import { db } from "../../../firebase";
import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore"; // Updated import
import { getAuth, onAuthStateChanged } from "firebase/auth";

// Type for announcement data
interface Announcement {
  id: string;
  title: string;
  subDesc: string;
  description: string;
  postedAt: string;
  badges: string[];
  Email: string;
  FirstName: string;
  LastName: string;
  GradeLevel: string;
  Name: string;
}

export default function AnnouncementCard() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
      } else {
        setError("User not logged in");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const getStringValue = (value: unknown): string => {
    if (typeof value === "string") return value;
    return "";
  };

  const getStringArrayValue = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.map((item) => String(item));
    return [];
  };

  useEffect(() => {
    if (!userEmail) return;

    const fetchAnnouncements = async () => {
      try {
        const docRef = doc(db, "teachers", userEmail);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const announcementsData: Announcement[] = [];

          if (data.Announcements) {
            Object.entries(data.Announcements).forEach(([id, announcement]) => {
              if (typeof announcement === "object" && announcement !== null) {
                const announcementData = announcement as Record<string, unknown>;
                announcementsData.push({
                  id: id,
                  title: getStringValue(announcementData.title),
                  subDesc: getStringValue(announcementData.subDesc),
                  description: getStringValue(announcementData.description),
                  postedAt: getStringValue(announcementData.postedAt),
                  badges: getStringArrayValue(announcementData.badges),
                  Email: getStringValue(announcementData.Email),
                  FirstName: getStringValue(announcementData.FirstName),
                  LastName: getStringValue(announcementData.LastName),
                  GradeLevel: getStringValue(announcementData.GradeLevel),
                  Name: getStringValue(announcementData.Name),
                });
              }
            });
          }

          announcementsData.sort((a, b) => {
            return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
          });

          setAnnouncements(announcementsData);
          setLoading(false);
        } else {
          setError("No such document!");
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching announcements: ", error);
        setError("Failed to load announcements");
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [userEmail]);

  const handleDelete = async (id: string) => {
    if (!userEmail) {
      setError("User not logged in");
      return;
    }

    if (!confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    try {
      const docRef = doc(db, "teachers", userEmail);
      // Use deleteField() for modular SDK
      await updateDoc(docRef, {
        [`Announcements.${id}`]: deleteField(),
      });

      // Update state to reflect the deletion
      setAnnouncements((prev) => prev.filter((announcement) => announcement.id !== id));
      console.log(`Announcement ${id} deleted successfully`);
    } catch (error) {
      console.error("Error deleting announcement: ", error);
      setError("Failed to delete announcement. Please try again.");
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

  if (loading) return <div className="text-center py-6 dark:text-white">Loading announcements...</div>;
  if (error) return <div className="text-center py-6 text-red-500">{error}</div>;
  if (announcements.length === 0) return <div className="text-center py-6 dark:text-white">No announcements found</div>;

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <div
          key={announcement.id}
          className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800"
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold dark:text-white">{announcement.title}</h3>
                {announcement.badges &&
                  announcement.badges.map((badge, index) => (
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
              <p className="text-sm text-gray-500 dark:text-gray-400">{announcement.subDesc}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(announcement.postedAt)}
              </span>
              <button
                onClick={() => handleDelete(announcement.id)}
                className="p-2 rounded-md bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
              >
                🗑️
              </button>
            </div>
          </div>

          <div className="p-4">
            <p className="text-gray-700 dark:text-gray-300">{announcement.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}