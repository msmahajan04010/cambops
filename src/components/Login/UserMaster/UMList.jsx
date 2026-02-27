import React, { useState } from 'react';
import Layout from '../Layout/AdminLayout';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { useEffect } from "react";
import toast from "react-hot-toast";

export default function UserList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
 const [userList, setUserList] = useState([]);

 const [showPasswordModal, setShowPasswordModal] = useState(false);
const [newPassword, setNewPassword] = useState("");

  const generateRandomPassword = (length = 8) => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        let password = "";
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    };

const handleResetPassword = async (userId) => {
  if (!window.confirm("Are you sure you want to reset password for this user ?")) return;

  try {
    const randomPassword = generateRandomPassword(8);

    await updateDoc(doc(db, "users", userId), {
      password: randomPassword,
      ischangepwd: 0,
      updatedAt: new Date()
    });

    setNewPassword(randomPassword);
    setShowPasswordModal(true);

  } catch (error) {
    console.error("Error resetting password:", error);
  }
};


const handleDelete = async (id) => {
  if (window.confirm("Are you sure you want to delete this user?")) {
    try {
      await deleteDoc(doc(db, "users", id));
      toast.success("User deleted successfully.");
      fetchUsers(); // Refresh list
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  }
};

  const fetchUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users = querySnapshot.docs.map((doc) => ({
      id: doc.id, // Firestore document ID
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toLocaleString() || "",
      updatedAt: doc.data().updatedAt?.toDate()?.toLocaleString() || null
    }));

    console.log("users",users)
    setUserList(users);
  } catch (error) {
    console.error("Error fetching users:", error);
  }
};


  useEffect(() => {
  fetchUsers();
}, []);



const handleStatusToggle = async (id, currentStatus) => {
  try {
    await updateDoc(doc(db, "users", id), {
      status: currentStatus === "Active" ? "Inactive" : "Active",
      updatedAt: new Date()
    });

    fetchUsers();
  } catch (error) {
    console.error("Error updating status:", error);
  }
};


  const handleEdit = (user) => {
    // Navigate to user master with user data
    navigate('/UM', { state: { user } });
  };

  const handleAddNew = () => {
    navigate('/UM');
  };

  // Filter users based on search and status
  const filteredUsers = userList.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phoneNumber.includes(searchTerm);

    const matchesStatus = 
      filterStatus === 'all' || 
      user.status.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const activeCount = userList.filter(u => u.status === 'Active').length;
  const inactiveCount = userList.filter(u => u.status === 'Inactive').length;

  return (
    <Layout title="User List" subtitle="View and manage all system users">
      <div className="max-w-7xl mx-auto">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-white focus:border-transparent outline-none placeholder-gray-500"
            />
          </div>

          {/* Filter and Add Button */}
          <div className="flex items-center gap-3">
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-white outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {/* Add New Button */}
            <button
              onClick={handleAddNew}
              className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New User
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Users</p>
                <p className="text-3xl font-bold text-white">{userList.length}</p>
              </div>
              <div className="bg-white bg-opacity-10 p-3 rounded-xl">
                <svg className="w-8 h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Active Users</p>
                <p className="text-3xl font-bold text-green-400">{activeCount}</p>
              </div>
              <div className="bg-green-500 bg-opacity-10 p-3 rounded-xl">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Inactive Users</p>
                <p className="text-3xl font-bold text-red-400">{inactiveCount}</p>
              </div>
              <div className="bg-red-500 bg-opacity-10 p-3 rounded-xl">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* User List Table */}
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              Users ({filteredUsers.length})
            </h2>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-gray-400 text-lg">
                {searchTerm ? 'No users found matching your search' : 'No users found'}
              </p>
             
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-400 font-medium py-3 px-4">User Name</th>
                    <th className="text-left text-gray-400 font-medium py-3 px-4">Contact</th>
                    <th className="text-left text-gray-400 font-medium py-3 px-4">Status</th>
                    <th className="text-left text-gray-400 font-medium py-3 px-4">Created</th>
                    <th className="text-left text-gray-400 font-medium py-3 px-4">Last Updated</th>
                    <th className="text-left text-gray-400 font-medium py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800 hover:bg-opacity-30 transition-all">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                         
                          <div>
                            <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
                            
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-gray-300 text-sm flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                            {user.email}
                          </p>
                          <p className="text-gray-400 text-sm flex items-center gap-2 mt-1">
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {user.phoneNumber}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <button
                         onClick={() => handleStatusToggle(user.id, user.status)}
                          className={`px-3 py-1 rounded-lg font-medium text-sm transition-all inline-flex items-center gap-2 ${
                            user.status === 'Active' 
                              ? 'bg-green-600 text-white hover:bg-green-700' 
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-white' : 'bg-white'}`}></span>
                          {user.status}
                        </button>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-gray-400 text-sm">{user.createdAt}</p>
                      </td>
                      <td className="py-4 px-4">
                        {user.updatedAt ? (
                          <p className="text-gray-400 text-sm">{user.updatedAt}</p>
                        ) : (
                          <p className="text-gray-600 text-sm">-</p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
                            title="Edit User"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
  onClick={() => handleResetPassword(user.id)}
  className="text-gray-400 hover:text-yellow-400 transition-colors p-2 hover:bg-yellow-900 hover:bg-opacity-20 rounded-lg"
  title="Reset Password"
>
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 11c0 1.657-1.343 3-3 3m0 0a3 3 0 013-3m-3 3h6m2-7V4a4 4 0 10-8 0v3m-4 0h16v12H4V7z"
    />
  </svg>
</button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-gray-400 hover:text-red-400 transition-colors p-2 hover:bg-red-900 hover:bg-opacity-20 rounded-lg"
                            title="Delete User"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {showPasswordModal && (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-96 text-white">

      <h2 className="text-xl font-bold mb-4 text-center">
        Password Reset Successfully 🔐
      </h2>

      <p className="text-gray-400 text-sm mb-2 text-center">
        New Temporary Password
      </p>

      <div className="flex items-center gap-2 bg-gray-800 p-3 rounded-lg mb-6">
        <input
          type="text"
          value={newPassword}
          readOnly
          className="flex-1 bg-transparent text-white outline-none"
        />
        <button
          onClick={() => {
            navigator.clipboard.writeText(newPassword);
          }}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
        >
          Copy
        </button>
      </div>

      <button
        onClick={() => setShowPasswordModal(false)}
        className="w-full bg-white text-black py-2 rounded-lg font-semibold hover:bg-gray-200"
      >
        Close
      </button>

    </div>
  </div>
)}

          {/* Pagination Placeholder */}
          {filteredUsers.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-800">
              <p className="text-gray-400 text-sm">
                Showing {filteredUsers.length} of {userList.length} users
              </p>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                  Previous
                </button>
                <button className="px-4 py-2 bg-white text-black rounded-lg font-semibold">
                  1
                </button>
                <button className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}