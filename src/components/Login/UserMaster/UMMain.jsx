import React, { useState, useEffect } from 'react';
import Layout from '../Layout/AdminLayout';
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { db } from '../../../firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from "react-hot-toast";


export default function UserMaster() {
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');


    const [editingUser, setEditingUser] = useState(null);
    const [userType, setUserType] = useState("");
    const location = useLocation();
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState("");

    useEffect(() => {
        if (location.state?.user) {
            const user = location.state.user;

            setEditingUser(user);
            setFirstName(user.firstName || "");
            setLastName(user.lastName || "");
            setEmail(user.email || "");
            setPhoneNumber(user.phoneNumber || "");
            setUserType(user.userTypeId || "");
        }
    }, [location.state]);


    const userTypeOptions = [
        { label: "Admin", value: 1 },
        { label: "Splitting", value: 2 },
        { label: "Recording", value: 3 },
        { label: "QC", value: 4 },
        { label: "Recording & Splitting", value: 5 }, // Better professional name
    ];


    const generateRandomPassword = (length = 8) => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        let password = "";
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    };


    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePhone = (phone) => {
        const phoneRegex = /^[0-9]{10}$/;
        return phoneRegex.test(phone.replace(/\s+/g, ''));
    };

    const handleSave = async () => {
        if (!firstName.trim()) { toast.error('Please enter first name'); return; }
        if (!lastName.trim()) { toast.error('Please enter last name'); return; }
        if (!email.trim()) { toast.error('Please enter email address'); return; }
        if (!validateEmail(email)) { toast.error('Please enter a valid email address'); return; }
        if (!phoneNumber.trim()) { toast.error('Please enter phone number'); return; }
        if (!validatePhone(phoneNumber)) { toast.error('Please enter a valid 10-digit phone number'); return; }
        if (!userType) {
            toast.error("Please select user type");
            return;
        }

        if (editingUser) {
            // Update existing user
            await setDoc(doc(db, "users", editingUser.id), {
                firstName,
                lastName,
                email,
                phoneNumber,
                updatedAt: new Date(),
            }, { merge: true });

            toast.success(`User : ${firstName} ${lastName} updated successfully.`);
        } else {

            const userDoc = doc(collection(db, "users"));
            const userId = userDoc.id;
            const randomPassword = generateRandomPassword(8);

            const newUser = {
                userId: userId,
                firstName,
                lastName,
                email,
                phoneNumber,
                password: randomPassword,
                userTypeId: Number(userType), // Save numeric ID
                ischangepwd: 0,
                status: "Active",
                createdAt: new Date()
            };

            const docRef = await addDoc(collection(db, "users"), newUser);

            setGeneratedPassword(randomPassword);
            setShowPasswordModal(true);
        }

        handleCancel();
    };

    const handleCancel = () => {
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhoneNumber('');
        setEditingUser(null);
        setUserType("");
    };

    const handleCopyPassword = () => {
        navigator.clipboard.writeText(generatedPassword);
    };


    return (
        <Layout title="User Master" subtitle="Add or Update the Users">
            <div className="max-w-6xl mx-auto">

                <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8">
                    {editingUser && (
                        <div className="mb-6 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-xl p-4 flex items-center gap-3">
                            <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="text-white font-semibold">Editing User</p>
                                <p className="text-blue-300 text-sm">You are currently editing {editingUser.firstName} {editingUser.lastName}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* First Name */}
                        <div className="space-y-2">
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-300">
                                First Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                id="firstName"
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-xl  transition-all duration-200 outline-none placeholder-gray-500"

                            />
                        </div>

                        {/* Last Name */}
                        <div className="space-y-2">
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-300">
                                Last Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                id="lastName"
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-xl  transition-all duration-200 outline-none placeholder-gray-500"

                            />
                        </div>

                        {/* User Type */}


                        {/* Email Address */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                                Email Address <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-xl  transition-all duration-200 outline-none placeholder-gray-500"

                                />
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-2">
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300">
                                Phone Number <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <input
                                    id="phoneNumber"
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    maxLength="10"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-xl  transition-all duration-200 outline-none placeholder-gray-500"

                                />
                            </div>

                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-300">
                                User Type <span className="text-red-400">*</span>
                            </label>

                            <select
                                value={userType}
                                onChange={(e) => setUserType(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-xl outline-none"
                            >
                                <option value="">--Select--</option>
                                {userTypeOptions.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4 mt-8 pt-6 border-t border-gray-800">
                        <button
                            onClick={handleSave}
                            className="flex-1 bg-white text-black py-3 rounded-xl font-semibold hover:bg-gray-200 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-2xl flex items-center justify-center gap-2"
                        >

                            {editingUser ? 'UPDATE' : 'SAVE'}
                        </button>
                        <button
                            onClick={handleCancel}
                            className="flex-1 bg-gray-800 text-white border border-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-all duration-200 flex items-center justify-center gap-2"
                        >

                            CANCEL
                        </button>

                        <button
                            onClick={() => navigate('/UMList')}
                            className="flex-1 bg-gray-800 text-white border border-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-all duration-200 flex items-center justify-center gap-2"
                        >

                            LIST
                        </button>
                    </div>
                </div>


                {showPasswordModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-96 text-white relative">

                            <h2 className="text-xl font-bold mb-4 text-center">
                                User Created Successfully 🎉
                            </h2>

                            <p className="text-gray-400 text-sm mb-2 text-center">
                                Temporary Password
                            </p>

                            <div className="flex items-center gap-2 bg-gray-800 p-3 rounded-lg mb-6">
                                <input
                                    type="text"
                                    value={generatedPassword}
                                    readOnly
                                    className="flex-1 bg-transparent text-white outline-none"
                                />
                                <button
                                    onClick={handleCopyPassword}
                                    className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                                >
                                    Copy
                                </button>
                            </div>

                            <button
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    handleCancel();
                                }}
                                className="w-full bg-white text-black py-2 rounded-lg font-semibold hover:bg-gray-200"
                            >
                                Close
                            </button>

                        </div>
                    </div>
                )}


            </div>
        </Layout>
    );
}