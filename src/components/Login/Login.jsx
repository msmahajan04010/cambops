import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import Logo from "../../assets/Logo.png"


export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [, setError] = useState("");
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();



    // 1️⃣ Hardcoded Admin
    if (username === "admin" && password === "Admin@123") {
      Cookies.set("userTypeId", 0, { expires: 1 });
      Cookies.set("userId", 0, { expires: 1 });
      Cookies.set("userName", "Admin", { expires: 1 });
      setUsername('');
      setPassword('');
      navigate("/DB");
      return;
    }

    try {
      // 2️⃣ Check Firestore users
      const q = query(
        collection(db, "users"),
        where("firstName", "==", username),
        where("password", "==", password),
        where("status", "==", "Active")
      );
      const snapshot = await getDocs(q);




      if (snapshot.empty) {
        toast.error("Invalid UserName or Password.")
        setError("❌ Invalid username or password");
        return;
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      console.log("userData", userData, userData)

      // 3️⃣ Check change password flag
      if (userData.ischangepwd === 0) {
        setCurrentUserId(userDoc.id);   // store for update
        setShowModal(true);
        return;
      }
      // Store user info in cookies
      Cookies.set("userTypeId", userData.userTypeId, { expires: 1 });
      Cookies.set("userId", userDoc.id, { expires: 1 });
      Cookies.set("userName", userData.firstName + " " + userData.lastName, { expires: 1 });
      setUsername('');
      setPassword('');
      navigate("/DB");


    } catch (error) {
      console.error(error);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      await updateDoc(doc(db, "users", currentUserId), {
        password: newPassword,
        ischangepwd: 1,
      });

      toast.success("Password changed successfully. Please login again with new password.");

      setShowModal(false);
      setUsername("");
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");

    } catch (error) {
      console.error(error);
    }
  };



  const handleCancel = () => {
    setUsername('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
    

      <div className="
  relative 
  bg-gradient-to-br from-gray-900 to-black 
  border border-gray-800 
  rounded-2xl sm:rounded-3xl 
  
  w-full 
  max-w-sm sm:max-w-md 
  p-6 sm:p-8 
  backdrop-blur-xl
">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-4 transform hover:rotate-6 transition-transform duration-300">
              <img 
                src={Logo} 
                alt="CambOps Logo" 
                className="w-25 h-25 object-contain"
              />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">LOGIN</h1>

        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Username Field */}
          <div className="space-y-1">
            <label htmlFor="username" className="block text-sm font-medium text-gray-300">
              UserName
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {/* <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg> */}
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-3 pr-3 py-3 bg-gray-800 border border-gray-700 text-white rounded-xl  transition-all duration-200 outline-none placeholder-gray-500"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {/* <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg> */}
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-3 pr-12 py-3 bg-gray-800 border border-gray-700 text-white rounded-xl transition-all duration-200 outline-none placeholder-gray-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          {/* <div className="flex items-center justify-between text-sm">

            <a href="#" className="text-gray-400 hover:text-white font-medium transition-colors">
              Forgot Password ?
            </a>
          </div> */}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-white text-black py-3 rounded-xl font-semibold hover:bg-gray-200 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-2xl"
            >
              LOGIN
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-800 text-white border border-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-all duration-200"
            >
              CANCEL
            </button>
          </div>

          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
              <div className="bg-gray-900 p-6 rounded-xl w-96 text-white">
                <h2 className="text-xl font-bold mb-4">Change Password</h2>

                <div className="space-y-4">
                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 rounded"
                  />

                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 rounded"
                  />

                  <button
                    onClick={handlePasswordChange}
                    className="w-full bg-white text-black py-2 rounded font-semibold"
                  >
                    SAVE
                  </button>
                </div>
              </div>
            </div>
          )}

        </form>


      </div>
    </div>
  );
}