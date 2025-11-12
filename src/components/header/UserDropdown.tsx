import { useState, useEffect } from "react";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { Link } from "react-router";
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { db, auth } from '../../firebase';
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Modal } from "../ui/modal";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    teacherUID: ""
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
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
          } else {
            console.log("No such document exists!");
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dropdown-toggle dark:text-gray-400"
      >
        <span className="block mr-1 font-medium text-theme-sm">Teacher {userData.firstName}</span>
        <svg
          className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
            }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div>
          <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
            {userData.firstName} {userData.lastName}
          </span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
            {userData.email}
          </span>
        </div>

        <ul className="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              to="/profile"
              className="flex items-center pl-3 gap-3 px-2 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <svg
                className="fill-gray-500 group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-gray-300"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 14.1526 4.3002 16.1184 5.61936 17.616C6.17279 15.3096 8.24852 13.5955 10.7246 13.5955H13.2746C15.7509 13.5955 17.8268 15.31 18.38 17.6167C19.6996 16.119 20.5 14.153 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5ZM17.0246 18.8566V18.8455C17.0246 16.7744 15.3457 15.0955 13.2746 15.0955H10.7246C8.65354 15.0955 6.97461 16.7744 6.97461 18.8455V18.856C8.38223 19.8895 10.1198 20.5 12 20.5C13.8798 20.5 15.6171 19.8898 17.0246 18.8566ZM2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM11.9991 7.25C10.8847 7.25 9.98126 8.15342 9.98126 9.26784C9.98126 10.3823 10.8847 11.2857 11.9991 11.2857C13.1135 11.2857 14.0169 10.3823 14.0169 9.26784C14.0169 8.15342 13.1135 7.25 11.9991 7.25ZM8.48126 9.26784C8.48126 7.32499 10.0563 5.75 11.9991 5.75C13.9419 5.75 15.5169 7.32499 15.5169 9.26784C15.5169 11.2107 13.9419 12.7857 11.9991 12.7857C10.0563 12.7857 8.48126 11.2107 8.48126 9.26784Z"
                  fill=""
                />
              </svg>
              Edit profile
            </DropdownItem>
          </li>
          <li>
            <button
              onClick={() => {
                closeDropdown();
                setIsTermsModalOpen(true);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <svg
                className="fill-gray-500 group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-gray-300"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.5 2C5.67157 2 5 2.67157 5 3.5V20.5C5 21.3284 5.67157 22 6.5 22H17.5C18.3284 22 19 21.3284 19 20.5V7.5C19 7.23478 18.8946 6.98043 18.7071 6.79289L13.7071 1.79289C13.5196 1.60536 13.2652 1.5 13 1.5H6.5ZM6.5 3.5H12.5V7C12.5 7.82843 13.1716 8.5 14 8.5H17.5V20.5H6.5V3.5ZM16.0858 7H14V4.91421L16.0858 7ZM8.25 11C8.25 10.5858 8.58579 10.25 9 10.25H15C15.4142 10.25 15.75 10.5858 15.75 11C15.75 11.4142 15.4142 11.75 15 11.75H9C8.58579 11.75 8.25 11.4142 8.25 11ZM9 13.75C8.58579 13.75 8.25 14.0858 8.25 14.5C8.25 14.9142 8.58579 15.25 9 15.25H15C15.4142 15.25 15.75 14.9142 15.75 14.5C15.75 14.0858 15.4142 13.75 15 13.75H9ZM8.25 18C8.25 17.5858 8.58579 17.25 9 17.25H12C12.4142 17.25 12.75 17.5858 12.75 18C12.75 18.4142 12.4142 18.75 12 18.75H9C8.58579 18.75 8.25 18.4142 8.25 18Z"
                  fill=""
                />
              </svg>
              Terms and Conditions
            </button>
          </li>

          <li>
            <button
              onClick={() => {
                closeDropdown();
                setIsPrivacyModalOpen(true);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300 text-left"
            >
              <svg
                className="fill-gray-500 group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-gray-300 flex-shrink-0"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM3.5 12C3.5 7.30558 7.30558 3.5 12 3.5C16.6944 3.5 20.5 7.30558 20.5 12C20.5 16.6944 16.6944 20.5 12 20.5C7.30558 20.5 3.5 16.6944 3.5 12ZM12 7.25C12.4142 7.25 12.75 7.58579 12.75 8V12C12.75 12.4142 12.4142 12.75 12 12.75C11.5858 12.75 11.25 12.4142 11.25 12V8C11.25 7.58579 11.5858 7.25 12 7.25ZM12 14.5C11.4477 14.5 11 14.9477 11 15.5C11 16.0523 11.4477 16.5 12 16.5H12.01C12.5623 16.5 13.01 16.0523 13.01 15.5C13.01 14.9477 12.5623 14.5 12.01 14.5H12Z"
                  fill=""
                />
              </svg>
              Privacy Policy
            </button>
          </li>
        </ul>
        <Link
          to="/signin"
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
        >
          <svg
            className="fill-gray-500 group-hover:fill-gray-700 dark:group-hover:fill-gray-300"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.1007 19.247C14.6865 19.247 14.3507 18.9112 14.3507 18.497L14.3507 14.245H12.8507V18.497C12.8507 19.7396 13.8581 20.747 15.1007 20.747H18.5007C19.7434 20.747 20.7507 19.7396 20.7507 18.497L20.7507 5.49609C20.7507 4.25345 19.7433 3.24609 18.5007 3.24609H15.1007C13.8581 3.24609 12.8507 4.25345 12.8507 5.49609V9.74501L14.3507 9.74501V5.49609C14.3507 5.08188 14.6865 4.74609 15.1007 4.74609L18.5007 4.74609C18.9149 4.74609 19.2507 5.08188 19.2507 5.49609L19.2507 18.497C19.2507 18.9112 18.9149 19.247 18.5007 19.247H15.1007ZM3.25073 11.9984C3.25073 12.2144 3.34204 12.4091 3.48817 12.546L8.09483 17.1556C8.38763 17.4485 8.86251 17.4487 9.15549 17.1559C9.44848 16.8631 9.44863 16.3882 9.15583 16.0952L5.81116 12.7484L16.0007 12.7484C16.4149 12.7484 16.7507 12.4127 16.7507 11.9984C16.7507 11.5842 16.4149 11.2484 16.0007 11.2484L5.81528 11.2484L9.15585 7.90554C9.44864 7.61255 9.44847 7.13767 9.15547 6.84488C8.86248 6.55209 8.3876 6.55226 8.09481 6.84525L3.52309 11.4202C3.35673 11.5577 3.25073 11.7657 3.25073 11.9984Z"
              fill=""
            />
          </svg>
          Sign out
        </Link>
      </Dropdown>

      {/* Terms and Conditions Modal */}
      <Modal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        className="max-w-[800px] m-4"
      >
        <div className="relative w-full p-6 bg-white rounded-3xl dark:bg-gray-900 lg:p-8">
          <h3 className="mb-4 text-2xl font-bold text-gray-800 dark:text-white">
            Terms and Conditions
          </h3>

          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <p className="text-gray-500 dark:text-gray-400">
                Last updated: November 12, 2025
              </p>

              <div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  1. Acceptance of Terms
                </h4>
                <p>
                  By accessing and using this School Management System, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use this service.
                </p>
              </div>

              <div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  2. Use License
                </h4>
                <p>
                  Permission is granted to temporarily access the materials (information or software) on this School Management System for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
                </p>
              </div>

              <div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  3. User Responsibilities
                </h4>
                <p>
                  Users are responsible for maintaining the confidentiality of their account credentials and for all activities that occur under their account. You agree to notify us immediately of any unauthorized use of your account.
                </p>
              </div>

              <div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  4. Prohibited Activities
                </h4>
                <p>
                  You may not use this system for any unlawful purpose or to solicit others to perform or participate in any unlawful acts. You may not violate any international, federal, provincial or state regulations, rules, laws, or local ordinances.
                </p>
              </div>

              <div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  5. Modifications
                </h4>
                <p>
                  We reserve the right to modify these terms at any time. Your continued use of the system following any changes indicates your acceptance of the new terms.
                </p>
              </div>

              <div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  6. Disclaimer
                </h4>
                <p>
                  The materials on this School Management System are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                </p>
              </div>

              <div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  7. Contact Information
                </h4>
                <p>
                  If you have any questions about these Terms and Conditions, please contact us at support@schoolmanagement.com
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={() => setIsTermsModalOpen(false)}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        className="max-w-[800px] m-4"
      >
        <div className="relative w-full p-6 bg-white rounded-3xl dark:bg-gray-900 lg:p-8">
          <h3 className="mb-4 text-2xl font-bold text-gray-800 dark:text-white">
            Privacy Policy
          </h3>

          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <p className="text-gray-500 dark:text-gray-400">
                Last updated: November 12, 2025
              </p>

              <div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  1. Information We Collect
                </h4>
                <p>
                  We collect information that you provide directly to us, including your name, email address, grade level, and other information you choose to provide when using our School Management System.
                </p>
              </div>

              <div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  2. How We Use Your Information
                </h4>
                <p>
                  We use the information we collect to provide, maintain, and improve our services, to communicate with you, and to ensure the security of our platform. Your data is used solely for educational and administrative purposes.
                </p>
              </div>

              <div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  3. Information Sharing
                </h4>
                <p>
                  We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. This does not include trusted third parties who assist us in operating our system, conducting our business, or servicing you, as long as those parties agree to keep this information confidential.
                </p>
              </div>

              <div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  4. Data Security
                </h4>
                <p>
                  We implement a variety of security measures to maintain the safety of your personal information. Your personal information is contained behind secured networks and is only accessible by a limited number of persons who have special access rights to such systems.
                </p>
              </div>

              <div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  5. Cookies
                </h4>
                <p>
                  We use cookies to help us remember and process your preferences and understand your usage patterns. You can choose to have your computer warn you each time a cookie is being sent, or you can choose to turn off all cookies through your browser settings.
                </p>
              </div>

              <div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  6. Your Rights
                </h4>
                <p>
                  You have the right to access, update, or delete your personal information at any time. You can also object to or restrict certain types of processing of your data. To exercise these rights, please contact us at privacy@schoolmanagement.com
                </p>
              </div>

              <div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  7. Changes to This Policy
                </h4>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
                </p>
              </div>

              <div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  8. Contact Us
                </h4>
                <p>
                  If you have any questions about this Privacy Policy, please contact us at privacy@schoolmanagement.com
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={() => setIsPrivacyModalOpen(false)}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}