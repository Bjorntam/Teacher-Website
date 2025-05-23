import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { auth, db } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useState, useEffect } from "react";

export default function UserMetaCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    teacherUID: ""
  });
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get user data from Firestore
          const userEmail = user.email;
          console.log("Current user email:", userEmail);
          
          if (!userEmail) {
            throw new Error("User email not found");
          }
          
          const userDocRef = doc(db, "teachers", userEmail);
          console.log("Fetching document from path:", `teachers/${userEmail}`);
          
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            console.log("Document data:", data);
            
            setUserData({
              firstName: data.FirstName || "",
              lastName: data.LastName || "",
              email: data.Email || userEmail,
              role: data.Role || "",
              teacherUID: data.TeacherUID || ""
            });

            // Also update form data for editing
            setFormData({
              firstName: data.FirstName || "",
              lastName: data.LastName || "",
              email: data.Email || userEmail
            });
          } else {
            console.log("No such document exists!");
            setError("User document not found");
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setError("Failed to load user data");
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        setError("No user logged in");
      }
    });

    // Clean up the subscription
    return () => unsubscribe();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!auth.currentUser?.email) {
      setError("No authenticated user found");
      return;
    }

    try {
      setError("");
      const userEmail = auth.currentUser.email;
      const userDocRef = doc(db, "teachers", userEmail);
      
      // Prepare update data - matching the structure in the database
      const updateData = {
        FirstName: formData.firstName,
        LastName: formData.lastName
      };
      
      console.log("Updating document with data:", updateData);
      
      // Update the document with new values
      await updateDoc(userDocRef, updateData);

      console.log("Document successfully updated");

      // Update local state to reflect changes
      setUserData(prev => ({
        ...prev,
        firstName: formData.firstName,
        lastName: formData.lastName
      }));

      setUpdateSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
      
      closeModal();
    } catch (err) {
      console.error("Error updating user data:", err);
      setError("Failed to update user information");
    }
  };

  if (loading) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <p className="text-center text-gray-500 dark:text-gray-400">Loading user information...</p>
      </div>
    );
  }

  if (error && !userData.email) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <p className="text-center text-error-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
              {userData.firstName} {userData.lastName}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Metamorpet
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                {userData.role}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
            Edit
          </button>
        </div>
        {updateSuccess && (
        <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg dark:bg-green-800/20 dark:text-green-400">
          Profile updated successfully!
        </div>
      )}
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
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
                    <Label>First Name</Label>
                    <Input 
                      type="text" 
                      name="firstName"
                      value={formData.firstName} 
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Last Name</Label>
                    <Input 
                      type="text" 
                      name="lastName"
                      value={formData.lastName} 
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email Address</Label>
                    <Input 
                      type="text" 
                      name="email"
                      value={formData.email} 
                      disabled 
                      hint="Email cannot be changed as it's used for login"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="px-2 mt-4 text-sm text-error-500 dark:text-red-400">
                {error}
              </div>
            )}
            
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
    </>
  );
}
