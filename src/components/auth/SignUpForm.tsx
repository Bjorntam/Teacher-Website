
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isWeakPassword = (pass: string) => {
    const minLength = pass.length >= 8;
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasNumber = /\d/.test(pass);
    return !(minLength && hasUpperCase && hasNumber);
  };

  const validateEmail = (value: string) => {
    const isValidEmail =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
    setEmailError(!isValidEmail);
    return isValidEmail;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!isChecked) {
      setMessage("Please accept the Terms and Conditions to proceed.");
      return;
    }

    if (!validateEmail(email)) {
      setMessage("Please enter a valid email address.");
      return;
    }

    if (isWeakPassword(password)) {
      setMessage("Password must be at least 8 characters long and include an uppercase letter and a number.");
      return;
    }

    if (!firstName || !lastName) {
      setMessage("Please enter both First Name and Last Name.");
      return;
    }

    setLoading(true);

    try {
      const docRef = doc(db, "teachers", email);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setMessage("Email not found in teachers list. Please contact admin.");
        setLoading(false);
        return;
      }

      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const userEmail = userCred.user.email;

      await setDoc(doc(db, "teachers", userEmail!), {
        ...docSnap.data(),
        FirstName: firstName,
        LastName: lastName,
        verified: "true"
      });

      setMessage("Account created successfully!");
      setTimeout(() => {
        navigate("/Dashboard");
      }, 2000);
    } catch (err) {
      console.error(err);
      setMessage("Failed to create account. Email might already be in use.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <style>
        {`
          .custom-modal::-webkit-scrollbar {
            width: 8px;
          }
          .custom-modal::-webkit-scrollbar-track {
            background: #ffffff;
          }
          .custom-modal::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 4px;
          }
          .custom-modal::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
          }
          .dark .custom-modal::-webkit-scrollbar-track {
            background: #1f2937;
          }
          .dark .custom-modal::-webkit-scrollbar-thumb {
            background: #4b5563;
          }
          .dark .custom-modal::-webkit-scrollbar-thumb:hover {
            background: #6b7280;
          }
          /* Firefox */
          .custom-modal {
            scrollbar-color: #d1d5db #ffffff;
          }
          .dark .custom-modal {
            scrollbar-color: #4b5563 #1f2937;
          }
        `}
      </style>
      <div className="w-full max-w-md mx-auto mb-5 sm:pt-10"></div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign Up
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign up!
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <Label>
                      First Name<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="fname"
                      name="fname"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <Label>
                      Last Name<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="lname"
                      name="lname"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
                <div>
                  <Label>
                    Email<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={email}
                    error={emailError}
                    onChange={handleEmailChange}
                    placeholder="Enter your email"
                    hint={emailError ? "This is an invalid email address." : ""}
                  />
                </div>
                <div>
                  <Label>
                    Password<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                  {password && (
                    <p className={`text-sm mt-1 ${isWeakPassword(password) ? "text-error-500" : "text-green-500"}`}>
                      {isWeakPassword(password) ? "Weak password - Must be 8+ characters with uppercase and number" : "Strong password"}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    className="w-5 h-5"
                    checked={isChecked}
                    onChange={setIsChecked}
                  />
                  <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                    By creating an account means you agree to the{" "}
                    <span
                      onClick={() => setShowTerms(true)}
                      className="text-gray-800 dark:text-white/90 cursor-pointer hover:underline"
                    >
                      Terms and Conditions,
                    </span>{" "}
                    and our{" "}
                    <span
                      onClick={() => setShowPrivacy(true)}
                      className="text-gray-800 dark:text-white/90 cursor-pointer hover:underline"
                    >
                      Privacy Policy
                    </span>
                  </p>
                </div>
                {message && (
                  <div className={`text-sm ${message.includes("successfully") ? "text-green-500 dark:text-green-400" : "text-error-500 dark:text-red-400"}`}>
                    {message}
                  </div>
                )}
                <div>
                  <button
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Signing up..." : "Sign Up"}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Already have an account?{" "}
                <Link
                  to="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Log In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {showTerms && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto custom-modal">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Terms and Conditions
            </h2>
              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                  <p className="text-gray-500 dark:text-gray-400">
                    Last updated: November 13, 2025
                  </p>

                  <div>
                    <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                      1. Introduction
                    </h4>
                    <p>
                      Welcome to MetamorPET, a gamified educational platform designed to help students build healthy learning and daily routines through interactive activities, progress tracking, and virtual pets. By using MetamorPET on any device, you agree to these Terms and Conditions. Please read them carefully before using the application.
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                      2. Purpose of MetamorPET
                    </h4>
                    <p className="mb-3">
                      MetamorPET is a digital learning system that connects students, parents, teachers, and administrators to support daily routine management and classroom engagement.
                    </p>
                    <p className="mb-3">
                      Students participate in routines and classwork, earning progress by caring for their virtual pets.
                    </p>
                    <p className="mb-3">
                      Parents validate routines, monitor their child's progress, and stay informed through announcements.
                    </p>
                    <p className="mb-3">
                      Teachers assign classwork, create announcements, and track student performance.
                    </p>
                    <p className="mb-3">
                      Administrators manage user accounts and verify registered emails within the system.
                    </p>
                    <p>
                      The goal of MetamorPET is to create a secure and motivating platform that encourages consistent learning habits and engagement among young learners.
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                      3. User Accounts and Responsibilities
                    </h4>
                    <p className="mb-3">
                      Each user is given an account corresponding to their role: student, parent, teacher, or administrator. By accessing MetamorPET, you agree to:
                    </p>
                    <ul className="ml-6 space-y-2 list-disc">
                      <li>Keep your login credentials and PIN password private and secure.</li>
                      <li>Use the platform only for educational purposes.</li>
                      <li>Access only the features permitted for your assigned role.</li>
                      <li>Refrain from sharing or disclosing account information to others.</li>
                    </ul>
                    <p className="mt-3">
                      All accounts are linked to school records and remain active only while the user is enrolled or employed. Student accounts will be terminated once the student graduates to maintain data security and ensure proper record management.
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                      4. Acceptable Use
                    </h4>
                    <p className="mb-3">
                      Users are expected to use MetamorPET responsibly. You agree not to:
                    </p>
                    <ul className="ml-6 space-y-2 list-disc">
                      <li>Upload, share, or distribute any content, files, or materials through the system.</li>
                      <li>Modify, copy, or extract any data or code from the platform.</li>
                      <li>Access or attempt to access areas or data that are not part of your assigned role.</li>
                      <li>Perform any activity that disrupts or harms the system's performance or other users.</li>
                    </ul>
                    <p className="mt-3">
                      Any violation of these rules may result in restricted access or referral to the appropriate school authority.
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                      5. Data and Privacy
                    </h4>
                    <p className="mb-3">
                      MetamorPET collects limited information—such as user names, email addresses, activity logs, and progress data—to enable its educational features. All information is managed in accordance with the MetamorPET Privacy Policy, ensuring that data is securely stored, used only for educational purposes, and not shared with third parties unless required by law.
                    </p>
                    <p>
                      Parents and guardians are encouraged to supervise their child's use of the application to ensure proper and safe interaction.
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                      6. Intellectual Property
                    </h4>
                    <p className="mb-3">
                      All components of MetamorPET—including its name, logo, visual assets, virtual pets, designs, and system framework—are the exclusive property of the MetamorPET development team.
                    </p>
                    <p>
                      Users are not allowed to copy, reproduce, or redistribute any part of the application or its materials without written consent.
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                      7. Account Retention and Termination
                    </h4>
                    <p className="mb-3">
                      All user accounts remain active as long as they are associated with the school's system.
                    </p>
                    <p className="mb-3">
                      Student accounts are deactivated after graduation to maintain database efficiency and protect user privacy.
                    </p>
                    <p className="mb-3">
                      Parent, teacher, and administrator accounts may be removed if they are no longer associated with the institution.
                    </p>
                    <p>
                      This ensures that all active users have legitimate access and that the system remains secure and organized.
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                      8. Modifications to the Terms
                    </h4>
                    <p>
                      The MetamorPET team may update or revise these Terms and Conditions at any time. Users will be notified of major updates within the application or through official communication channels. Continued use of the platform after such updates constitutes acceptance of the revised terms.
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                      9. Limitation of Liability
                    </h4>
                    <p className="mb-3">
                      MetamorPET is intended solely for educational purposes. The developers are not responsible for:
                    </p>
                    <ul className="ml-6 space-y-2 list-disc">
                      <li>Data loss resulting from user error or misuse.</li>
                      <li>Unauthorized access caused by shared or exposed credentials.</li>
                      <li>Any indirect or incidental damages related to the use or inability to use the application.</li>
                    </ul>
                    <p className="mt-3">
                      Users accept that they use the platform at their own discretion and responsibility.
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                      10. Governing Law
                    </h4>
                    <p>
                      These Terms and Conditions are governed by the laws of the Republic of the Philippines. Any disputes related to the use of MetamorPET shall be resolved under applicable Philippine laws.
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                      11. Contact Information
                    </h4>
                    <p>
                      For inquiries, support, or feedback regarding these Terms and Conditions, please contact: 📧 metamorpet@gmail.com
                    </p>
                  </div>
                  <button
                  onClick={() => setShowTerms(false)}
                  className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
                  >
                    Close
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {showPrivacy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto custom-modal">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Privacy Policy
            </h2>
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <p className="text-gray-500 dark:text-gray-400">
                Last updated: November 13, 2025
              </p>

              <div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  1. Introduction
                </h4>
                <p className="mb-3">
                  This Privacy Policy explains how MetamorPET ("we," "our," or "us") collects, uses, stores, and protects the personal information of users who access the application across any device or platform. By using MetamorPET, you acknowledge that you have read and understood this policy and agree to the collection and use of your information as described here.
                </p>
                <p>
                  MetamorPET is a gamified educational platform designed to help students develop learning habits and daily routines through interactive features involving teachers, parents, and administrators.
                </p>
              </div>

              <div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  2. Information We Collect
                </h4>
                <p className="mb-3">
                  MetamorPET collects only the data necessary for educational and system functionality. The types of information collected include:
                </p>
                <ul className="ml-6 space-y-2 list-disc">
                  <li>Full name (student, parent, teacher, or administrator)</li>
                  <li>Email address (used for account registration and verification)</li>
                  <li>Grade level or class assignment (for grouping and educational tracking)</li>
                  <li>Routine or classwork records (completed tasks, progress, and activity logs)</li>
                  <li>Validated task information (for parent and teacher confirmation)</li>
                </ul>
                <p className="mt-3">
                  No unnecessary or sensitive data such as financial details, location tracking, or biometric information is collected.
                </p>
              </div>

              <div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  3. How We Collect Information
                </h4>
                <p className="mb-3">
                  Information is collected through:
                </p>
                <ul className="ml-6 space-y-2 list-disc">
                  <li>User registration – when accounts are created by the school or administrator.</li>
                  <li>User interaction – when students complete routines, teachers post classwork, or parents validate tasks.</li>
                  <li>Administrative verification – when administrators verify user email addresses and manage account activation.</li>
                </ul>
                <p className="mt-3">
                  All information entered into the platform is directly related to the user's educational role and activity.
                </p>
              </div>

              <div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  4. How We Use the Information
                </h4>
                <p className="mb-3">
                  The information we collect is used solely to support the learning and management features of the MetamorPET platform, including:
                </p>
                <ul className="ml-6 space-y-2 list-disc">
                  <li>Managing user accounts and ensuring proper access based on user role.</li>
                  <li>Tracking student routines, progress, and validated activities.</li>
                  <li>Facilitating communication and transparency among teachers, parents, and students.</li>
                  <li>Supporting educational reporting and class management.</li>
                </ul>
                <p className="mt-3">
                  We do not sell, trade, or share user information with external parties for commercial purposes.
                </p>
              </div>

              <div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  5. Data Storage and Security
                </h4>
                <p className="mb-3">
                  All collected data is securely stored within the MetamorPET system and protected from unauthorized access, alteration, or disclosure. We implement standard security measures to ensure the confidentiality and integrity of user data.
                </p>
                <p>
                  Only authorized users—teachers, parents, and administrators—may access relevant information based on their assigned roles.
                </p>
              </div>

              <div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  6. Data Sharing and Disclosure
                </h4>
                <p className="mb-3">
                  MetamorPET does not disclose any personal data to third parties. Information may only be shared under the following limited conditions:
                </p>
                <ul className="ml-6 space-y-2 list-disc">
                  <li>When required by law or authorized school personnel.</li>
                  <li>When necessary to ensure the educational functionality of the platform (e.g., teachers viewing class progress).</li>
                </ul>
                <p className="mt-3">
                  In all cases, data access is strictly controlled and limited to legitimate educational purposes.
                </p>
              </div>

              <div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  7. Account Retention and Deletion
                </h4>
                <p className="mb-3">
                  All user accounts remain active while linked to the participating school.
                </p>
                <ul className="ml-6 space-y-2 list-disc">
                  <li>Student accounts are deleted once the student graduates to protect privacy and keep the system database up to date.</li>
                  <li>Parent, teacher, and administrator accounts may be removed if they are no longer associated with the school.</li>
                </ul>
                <p className="mt-3">
                  All associated data will be securely deleted when an account is removed from the system.
                </p>
              </div>

              <div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  8. User Rights and Parental Consent
                </h4>
                <p className="mb-3">
                  Parents and guardians have the right to review, correct, or request deletion of their child's data by contacting us directly. Since MetamorPET involves child users, parental involvement and supervision are encouraged when using the platform.
                </p>
                <p>
                  Any data collection for child accounts is limited to educational use and verified through parental or school authorization.
                </p>
              </div>

              <div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  9. Contact Us
                </h4>
                <p>
                  For any questions, concerns, or requests regarding this Privacy Policy or your personal information, please contact us at: 📧 metamorpet@gmail.com
                </p>
              </div>
                          <button
              onClick={() => setShowPrivacy(false)}
              className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
            >
              Close
            </button>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
