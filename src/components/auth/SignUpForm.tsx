
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
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              <h3 className="font-semibold">Welcome to Metamorpet</h3>
              <p>These Terms and Conditions govern the use of our platform by teachers, including account management, sending reminders, and publishing announcements. By using our system, you agree to comply with these terms. Please read them carefully.</p>

              <h4 className="font-semibold mt-4">1. Account Creation</h4>
              <p><strong>Eligibility</strong>: Teachers must be at least 18 years old and authorized by their educational institution to create an account.</p>
              <p><strong>Process</strong>:</p>
              <ul className="list-disc pl-5">
                <li>Provide a valid email address or phone number for verification.</li>
                <li>Complete profile setup with your name, age, and role (Teacher).</li>
                <li>Create a secure password, which will be encrypted for your protection.</li>
                <li>Agree to these Terms and Conditions and the Privacy Policy during sign-up.</li>
                <li>Receive a confirmation email or notification upon successful registration.</li>
              </ul>
              <p><strong>Responsibility</strong>: You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. Teachers must ensure their email is registered in the system’s teacher database, as verified by an admin.</p>

              <h4 className="font-semibold mt-4">2. Account Update</h4>
              <p>Teachers may edit their profile information (e.g., name, contact details, profile picture) and update login credentials (e.g., email, password) at any time. Security settings, such as two-factor authentication (2FA) and recovery email, can be updated. Notification preferences (e.g., reminder and announcement delivery settings) can be customized. All changes must be saved and confirmed via a verification step (e.g., email or password confirmation).</p>

              <h4 className="font-semibold mt-4">3. Account Deletion</h4>
              <p>Teachers may request account deletion through the system’s account management settings. A verification step (e.g., confirmation prompt or email verification) is required to prevent unauthorized deletions. Teachers may opt to export relevant data (e.g., announcement or reminder logs) before deletion, where applicable. Upon deletion, all personal data will be permanently removed from the system in accordance with the Data Privacy Act of 2012, except for data required to be retained by law. A notification will be sent to confirm successful deletion.</p>

              <h4 className="font-semibold mt-4">4. Teachers’ Reminder</h4>
              <p>Teachers can send assignment reminders to students and parents, setting schedules and deadlines as needed. Notifications are delivered to both students and parents, with confirmation of receipt required. Automated follow-up reminders are sent for unacknowledged or incomplete tasks. Teachers are responsible for ensuring reminders are accurate, appropriate, and compliant with system guidelines.</p>

              <h4 className="font-semibold mt-4">5. Teacher’s Announcement</h4>
              <p>Teachers can create and publish announcements categorized as urgent, general, or event-based. Announcements can be scheduled for future release and tracked for views and engagement. Students and parents can acknowledge or respond to announcements through the system. Teachers must ensure announcements are professional, relevant, and comply with system guidelines.</p>

              <h4 className="font-semibold mt-4">6. User Responsibilities</h4>
              <p>Teachers must provide accurate information during account creation and updates. Teachers must not engage in unauthorized access, misuse of system features (e.g., sending inappropriate reminders or announcements), or sharing of account credentials. Teachers are responsible for complying with all applicable laws and regulations, including the Data Privacy Act of 2012, when handling student or parent data.</p>

              <h4 className="font-semibold mt-4">7. Termination</h4>
              <p>We reserve the right to suspend or terminate teacher accounts for violations of these Terms and Conditions, including misuse of the system, inappropriate content in reminders or announcements, or unauthorized access. Teachers will be notified of termination and provided an opportunity to export relevant data (e.g., announcement or reminder logs), where applicable.</p>

              <h4 className="font-semibold mt-4">8. Limitation of Liability</h4>
              <p>Metamorpet is not liable for any indirect, incidental, or consequential damages arising from the use of the system. We strive to ensure system availability but are not responsible for interruptions due to technical issues or maintenance.</p>

              <h4 className="font-semibold mt-4">9. Changes to the Terms and Conditions</h4>
              <p>We may update these Terms and Conditions to reflect changes in our services or legal requirements. Teachers will be notified of significant changes via email or system notifications, and continued use of the system constitutes acceptance of the updated terms.</p>

              <h4 className="font-semibold mt-4">10. Governing Law</h4>
              <p>These Terms and Conditions are governed by the laws of the Republic of the Philippines, including compliance with the Data Privacy Act of 2012.</p>

              <h4 className="font-semibold mt-4">11. Contact Us</h4>
              <p>For questions or concerns about these Terms and Conditions, contact us at metamorpet@gmail.com or 623 Bancal Extension, Meycauayan, 3020 Bulacan, Philippines.</p>

              <p className="mt-4">These Terms and Conditions are effective as of May 21, 2025.</p>
            </div>
            <button
              onClick={() => setShowTerms(false)}
              className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showPrivacy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto custom-modal">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Privacy Policy
            </h2>
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              <h3 className="font-semibold">Privacy Policy</h3>
              <p>This Privacy Policy outlines how Metamorpet collects, uses, stores, and protects user data in compliance with the Data Privacy Act of 2012 (Republic Act No. 10173) in the Philippines and other applicable legal and ethical standards. We are committed to safeguarding your personal information and ensuring transparency in our data handling practices.</p>

              <h4 className="font-semibold mt-4">1. Data Collection</h4>
              <p>We collect personal information during the sign-up process and throughout your use of the system to provide a personalized and secure experience. The data we collect includes:</p>
              <ul className="list-disc pl-5">
                <li><strong>Personal Information</strong>: Name, email address, phone number, age, and role (Parent, Student, Teacher, Admin) provided during account creation and profile setup.</li>
                <li><strong>Account Credentials</strong>: Encrypted passwords and security settings (e.g., two-factor authentication, recovery email).</li>
                <li><strong>Usage Data</strong>: Information related to routine planning, tracking, notifications, pet customization, shop transactions, leaderboard rankings, and teacher announcements/reminders.</li>
                <li><strong>Optional Data</strong>: Profile pictures, custom routine templates, and notification preferences.</li>
              </ul>
              <p>All data collection complies with the Data Privacy Act of 2012, ensuring that only necessary and relevant information is collected with your explicit consent.</p>

              <h4 className="font-semibold mt-4">2. Data Use</h4>
              <p>Your personal information is used to:</p>
              <ul className="list-disc pl-5">
                <li>Facilitate account creation, updates, and deletion.</li>
                <li>Provide personalized features such as routine planning, tracking, notifications, and pet customization.</li>
                <li>Enable communication between users (e.g., teacher reminders and announcements).</li>
                <li>Display rankings and achievements on the leaderboard.</li>
                <li>Process in-game transactions and track purchase history.</li>
                <li>Ensure system functionality and security.</li>
              </ul>
              <p>We ensure that data usage aligns with the principles of transparency, legitimate purpose, and proportionality as mandated by the Data Privacy Act of 2012.</p>

              <h4 className="font-semibold mt-4">3. Data Storage and Security</h4>
              <p><strong>Storage</strong>: Personal data is stored on secure servers with access restricted to authorized personnel only.</p>
              <p><strong>Encryption</strong>: Passwords and sensitive data are encrypted using industry-standard protocols to prevent unauthorized access.</p>
              <p><strong>Security Measures</strong>: We implement technical, organizational, and physical safeguards, including two-factor authentication (2FA) and regular security audits, to protect your data from breaches, loss, or misuse.</p>
              <p><strong>Retention</strong>: Data is retained only for as long as necessary to fulfill the purposes outlined in this policy or as required by law. Upon account deletion, personal data is permanently removed from our systems within 30 days, except for data required to be retained by law.</p>

              <h4 className="font-semibold mt-4">4. Data Sharing</h4>
              <p>We do not share your personal information with third parties except:</p>
              <ul className="list-disc pl-5">
                <li>With your explicit consent.</li>
                <li>When required by law or to comply with legal processes (e.g., court orders).</li>
                <li>To protect the rights, safety, or property of Metamorpet, its users, or the public.</li>
                <li>With authorized service providers (e.g., cloud storage or notification services) bound by strict confidentiality agreements and compliant with the Data Privacy Act of 2012.</li>
              </ul>

              <h4 className="font-semibold mt-4">5. Data Handling Process</h4>
              <p>In accordance with legal and ethical standards, we follow these processes for handling your data:</p>
              <ul className="list-disc pl-5">
                <li><strong>Consent</strong>: During sign-up, users must explicitly agree to this Privacy Policy and the Terms and Conditions. Consent is obtained via a clear and affirmative action (e.g., checking a box).</li>
                <li><strong>Transparency</strong>: Users are informed about the types of data collected, how it is used, and their rights under the Data Privacy Act of 2012.</li>
                <li><strong>Access and Control</strong>: Users can access, update, or request deletion of their data through the account management features. A verification step is required for sensitive actions like account deletion.</li>
                <li><strong>Data Minimization</strong>: Only data necessary for the system’s functionality is collected.</li>
                <li><strong>Accountability</strong>: We maintain records of data processing activities and conduct regular compliance reviews to ensure adherence to the Data Privacy Act of 2012.</li>
                <li><strong>Notification of Breaches</strong>: In the event of a data breach, affected users will be notified within 72 hours, as required by law, and appropriate remedial actions will be taken.</li>
              </ul>

              <h4 className="font-semibold mt-4">6. User Rights</h4>
              <p>Under the Data Privacy Act of 2012, you have the following rights:</p>
              <ul className="list-disc pl-5">
                <li><strong>Right to be Informed</strong>: You will be informed about how your data is processed.</li>
                <li><strong>Right to Access</strong>: You can request access to your personal data.</li>
                <li><strong>Right to Rectification</strong>: You can update or correct inaccurate data.</li>
                <li><strong>Right to Erasure</strong>: You can request the permanent deletion of your data.</li>
                <li><strong>Right to Object</strong>: You can object to certain data processing activities.</li>
                <li><strong>Right to Data Portability</strong>: You can request a copy of your data in a structured format (where applicable).</li>
                <li><strong>Right to File a Complaint</strong>: You can file a complaint with the National Privacy Commission if you believe your data privacy rights have been violated.</li>
              </ul>
              <p>To exercise these rights, contact our Data Protection Officer at metamorpet@gmail.com.</p>

              <h4 className="font-semibold mt-4">7. Data Deletion</h4>
              <p>Upon requesting account deletion:</p>
              <ul className="list-disc pl-5">
                <li>A verification step (e.g., confirmation prompt or email verification) ensures the request is legitimate.</li>
                <li>Users may opt to export their data (e.g., routine completion reports) before deletion.</li>
                <li>All personal data is permanently removed from our systems within 30 days, except for data required to be retained by law.</li>
                <li>Users will receive a confirmation notification upon successful deletion.</li>
              </ul>

              <h4 className="font-semibold mt-4">8. Changes to the Privacy Policy</h4>
              <p>We may update this Privacy Policy to reflect changes in our practices or legal requirements. Users will be notified of significant changes via email or system notifications, and continued use of the system constitutes acceptance of the updated policy.</p>

              <h4 className="font-semibold mt-4">9. Contact Us</h4>
              <p>For questions, concerns, or to exercise your data privacy rights, contact our Data Protection Officer at metamorpet@gmail.com or 623 Bancal Extension, Meycauayan, 3020 Bulacan, Philippines.</p>

              <p className="mt-4">This Privacy Policy is effective as of May 21, 2025.</p>
            </div>
            <button
              onClick={() => setShowPrivacy(false)}
              className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
