import React, { useState, useEffect } from 'react';
import Layout from '../Layout/AdminLayout';
import { collection, getDocs, getDoc, updateDoc, doc, setDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db } from '../../../firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from "react-hot-toast";


export default function UserEntryScreen() {
  const navigate = useNavigate();
  const [selectedBook, setSelectedBook] = useState('');
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showList, setShowList] = useState(false);
  const [entryList, setEntryList] = useState([]);
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const selectedUserObj = users.find(u => u.id === selectedUser);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);

  // helper
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  }



  const userId = getCookie("userId");

  const fetchBooks = async () => {
    const snapshot = await getDocs(collection(db, "books"));
    const bookData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    const activeBooks = bookData.filter(
      book =>
        book.bookStatus !== 2 &&     // 2 = Delivered
        book.status !== "Inactive"   // Inactive
    );

    setBooks(activeBooks);
  };

  const handleChapterToggle = (chapterNumber) => {
    setSelectedChapters(prev =>
      prev.includes(chapterNumber)
        ? prev.filter(ch => ch !== chapterNumber)
        : [...prev, chapterNumber]
    );
  };

  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, "users"));
    const userData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log("userData", userData)
    setUsers(userData);
  };

  const fetchAssignments = async () => {
    const snapshot = await getDocs(collection(db, "chapterAssignments"));
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setAssignments(data);
  };


  useEffect(() => {
    fetchBooks();

    fetchUsers();
    fetchAssignments();
  }, []);


  useEffect(() => {
    if (selectedUserObj && selectedUserObj.userTypeId !== 5) {
      setSelectedType(selectedUserObj.userTypeId);
    } else {
      setSelectedType("");
    }
  }, [selectedUser]);
  const types = [
    { id: 2, label: "Splitting", icon: "✂️" },
    { id: 3, label: "Recording", icon: "🎙️" },
    { id: 4, label: "QC", icon: "✅" },
    { id: 5, label: "Recording & Splitting", icon: "🔄" }

  ];

  const getChapters = () => {
    const book = books.find(b => b.id === selectedBook);
    return book?.chapters || [];
  };
  const filteredUsers = users.filter(
    user => user.status === "Active"
  );

  const handleSave = async () => {
    if (!selectedBook || selectedChapters.length === 0 || !selectedUser || !selectedType) {
      toast.error("Please fill all fields");
      return;
    }
    setLoading(true);
    try {

      const book = books.find(b => b.id === selectedBook);

      for (const chapterNumber of selectedChapters) {
        const chapter = book.chapters.find(
          ch => ch.chapterNumber === chapterNumber
        );

        const docId = `${book.id}_${chapter.chapterNumber}`;
        const docRef = doc(db, "chapterAssignments", docId);
        const existingDoc = await getDoc(docRef);

        // -------------------------------
        // STEP 1: CREATE DOCUMENT IF NOT EXISTS
        // -------------------------------
        if (!existingDoc.exists()) {
          await setDoc(docRef, {
            bookId: book.id,
            bookName: book.bookName,
            chapterNumber: chapter.chapterNumber,
            chapterName: chapter.chapterName,

            recording: null,
            splitting: null,
            qc: null,
            history: [], // 👈 IMPORTANT
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }

        // -------------------------------
        // STEP 2: PREVENT DUPLICATE STAGE ASSIGNMENT
        // -------------------------------
        const currentData = (await getDoc(docRef)).data();

        const type = Number(selectedType);

        // helper
        const isLocked = (stageObj) => {
          if (!stageObj) return false;
          if (!stageObj.userId) return false;
          return stageObj.status !== 8; // allow only if declined
        };

        // 🔒 Recording
        if (type === 3) {
          if (isLocked(currentData.recording)) {
            toast.error(`Recording already active for Chapter ${chapter.chapterNumber}`);
           return
          }
        }

        // 🔒 Splitting
        if (type === 2) {
          if (isLocked(currentData.splitting)) {
            toast.error(`Splitting already active for Chapter ${chapter.chapterNumber}`);
           return;
          }
        }

        // 🔒 QC
        if (type === 4) {
          // if (!isQCAllowed(chapter.chapterNumber)) {
          //   toast.error(`QC not allowed until Recording & Splitting completed`);
          //   continue;
          // }

          if (isLocked(currentData.qc)) {
            toast.error(`QC already active for Chapter ${chapter.chapterNumber}`);
           return;
          }
        }

        // 🔒 Type 5 (Recording & Splitting)
        if (type === 5) {
          if (isLocked(currentData.recording)) {
            toast.error(`Recording already active for Chapter ${chapter.chapterNumber}`);
           return;
          }

          if (isLocked(currentData.splitting)) {
            toast.error(`Splitting already active for Chapter ${chapter.chapterNumber}`);
            return;
          }
        }
        // -------------------------------
        // STEP 3: UPDATE SPECIFIC WORKFLOW BLOCK
        // -------------------------------
        const updatePayload = {
          updatedAt: new Date(),
          userRemark: null
        };

        let historyEntries = [];



        // Recording
        if (type === 3) {
          updatePayload.recording = {
            userId: selectedUser,
            status: 1,
            assignedAt: new Date()
          };

          historyEntries.push({
            stage: "recording",
            action: "assigned",
            userId: selectedUser,
            assignedBy: userId,
            role: "admin",
            timestamp: new Date()
          });
        }

        // Splitting
        if (type === 2) {
          updatePayload.splitting = {
            userId: selectedUser,
            status: 1,
            assignedAt: new Date()
          };

          historyEntries.push({
            stage: "splitting",
            action: "assigned",
            userId: selectedUser,
            assignedBy: userId,
            role: "admin",
            timestamp: new Date()
          });
        }

        // QC
        if (type === 4) {
          updatePayload.qc = {
            userId: selectedUser,
            status: 1,
            assignedAt: new Date()
          };

          historyEntries.push({
            stage: "qc",
            action: "assigned",
            userId: selectedUser,
            assignedBy: userId,
            role: "admin",
            timestamp: new Date()
          });
        }

        // 🔥 Type 5 = BOTH recording & splitting
        if (type === 5) {
          updatePayload.recording = {
            userId: selectedUser,
            status: 1,
            assignedAt: new Date()
          };

          updatePayload.splitting = {
            userId: selectedUser,
            status: 1,
            assignedAt: new Date()
          };

          historyEntries.push(
            {
              stage: "recording",
              action: "assigned",
              userId: selectedUser,
              assignedBy: userId,
              role: "admin",
              timestamp: new Date()
            },
            {
              stage: "splitting",
              action: "assigned",
              userId: selectedUser,
              assignedBy: userId,
              role: "admin",
              timestamp: new Date()
            }
          );
        }

        await updateDoc(docRef, {
          ...updatePayload,
          history: arrayUnion(...historyEntries)
        });
      }

      toast.success("Chapters assigned successfully.");
      handleCancel();


    } catch (error) {
      console.error(error);
      toast.error("Something went wrong.");
    }
    finally {
      setLoading(false); // ✅ ALWAYS STOP LOADING
    }
  };

  const isChapterDisabled = (chapterNumber) => {
    const assignment = assignments.find(
      a =>
        a.bookId === selectedBook &&
        a.chapterNumber === chapterNumber
    );

    if (!assignment) return false;

    // Recording Lock
    if (Number(selectedType) === 3) {
      return (
        assignment.recording?.userId &&
        assignment.recording?.status !== 8
      );
    }

    // Splitting Lock
    if (Number(selectedType) === 2) {
      return (
        assignment.splitting?.userId &&
        assignment.splitting?.status !== 8
      );
    }

    // QC Lock
    if (Number(selectedType) === 4) {
      // First check readiness
      if (!isQCAllowed(chapterNumber)) return true;

      return (
        assignment.qc?.userId &&
        assignment.qc?.status !== 8
      );
    }

    if (Number(selectedType) === 5) {
      return (
        (assignment.recording?.userId &&
          assignment.recording?.status !== 8) ||
        (assignment.splitting?.userId &&
          assignment.splitting?.status !== 8)
      );
    }

    return false;
  };

  const isQCAllowed = (chapterNumber) => {
    const assignment = assignments.find(
      a =>
        a.bookId === selectedBook &&
        a.chapterNumber === chapterNumber
    );

    if (!assignment) return false;

    return (
      assignment.recording?.status >= 3 &&
      assignment.splitting?.status >= 3
    );
  };

  const handleCancel = () => {
    setSelectedBook('');
    setSelectedChapters([]);
    setSelectedUser('');
    setSelectedType('');
  };



  const chapters = getChapters();

  
  if (loading) {
    return (
       <Layout title="User Assign Master" subtitle="Assign chapters to users for processing">
        <div className="flex items-center justify-center h-[70vh]">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-white rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="User Assign Master" subtitle="Assign chapters to users for processing">
      <div className="min-h-screen bg-black p-8">
        <div className="max-w-6xl mx-auto">



          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8">
            <div className="space-y-6">
              {/* Select Book */}
              <div className="space-y-2">
                <label htmlFor="book" className="block text-sm font-medium text-gray-300">
                  Book Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    id="book"
                    value={selectedBook}
                    onChange={(e) => {
                      setSelectedBook(e.target.value);
                      setSelectedChapters([]);
                    }}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 outline-none appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-gray-800">--Select--</option>
                    {books.map((book) => (
                      <option key={book.id} value={book.id} className="bg-gray-800">
                        {book.bookName} ({book.chapters?.length || 0} chapters)
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Select Chapters */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Select Chapters <span className="text-red-400">*</span>
                </label>

                {!selectedBook ? (
                  <p className="text-gray-500 text-sm">
                    Please select a book first
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto bg-gray-800 p-4 rounded-xl border border-gray-700">
                    {chapters.map((chapter) => (
                      <label
                        key={chapter.chapterNumber}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border ${isChapterDisabled(chapter.chapterNumber)
                          ? "bg-gray-700 text-gray-500 border-gray-600 cursor-not-allowed"
                          : selectedChapters.includes(chapter.chapterNumber)
                            ? "bg-white text-black border-white"
                            : "bg-gray-900 text-white border-gray-700"
                          }`}
                      >
                        <input
                          type="checkbox"
                          disabled={isChapterDisabled(chapter.chapterNumber)}
                          checked={selectedChapters.includes(chapter.chapterNumber)}
                          onChange={() => handleChapterToggle(chapter.chapterNumber)}
                        />
                        <span className="text-sm">{chapter.chapterName}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Select User */}
              <div className="space-y-2">
                <label htmlFor="user" className="block text-sm font-medium text-gray-300">
                  Select User <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    id="user"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 outline-none appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-gray-800">--Select--</option>
                    {filteredUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Select Type */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  Assignment Type <span className="text-red-400">*</span>
                </label>

                {!selectedUserObj ? (
                  <p className="text-gray-500 text-sm">
                    Please select user first
                  </p>
                ) : selectedUserObj.userTypeId === 5 ? (
                  // ✅ UserType 5 → show multiple options
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[2, 3, 5].map((typeId) => {
                      const typeMap = {
                        2: { label: "Splitting", icon: "✂️" },
                        3: { label: "Recording", icon: "🎙️" },
                        5: { label: "Recording & Splitting", icon: "🔄" }
                      };

                      const type = typeMap[typeId];

                      return (
                        <label
                          key={typeId}
                          className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border-2 ${Number(selectedType) === typeId
                            ? "bg-white text-black border-white"
                            : "bg-gray-800 text-white border-gray-700"
                            }`}
                        >
                          <input
                            type="radio"
                            checked={Number(selectedType) === typeId}
                            onChange={() => setSelectedType(typeId)}
                          />
                          <span className="text-xl">{type.icon}</span>
                          <span>{type.label}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  // ✅ Other UserTypes → auto select and disable
                  <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-white">
                    {selectedUserObj.userTypeId === 2 && "✂️ Splitting"}
                    {selectedUserObj.userTypeId === 3 && "🎙️ Recording"}
                    {selectedUserObj.userTypeId === 4 && "✅ QC"}
                  </div>
                )}
              </div>


              {/* Summary Card */}
              {(selectedBook || selectedUser || selectedType) && (
                <div className="bg-gray-800 bg-opacity-50 border border-gray-700 rounded-xl p-5">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Entry Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-400">
                      Book : <span className="text-white font-medium">{selectedBook ? books.find(b => b.id === selectedBook)?.bookName : '-'}</span>
                    </p>
                    <p className="text-gray-400">
                      Chapter : <span className="text-white font-medium">{selectedChapters ? `Chapter ${selectedChapters}` : '-'}</span>
                    </p>
                    <p className="text-gray-400">
                      User : <span className="text-white font-medium">{selectedUser ? users.find(u => u.id === (selectedUser))?.firstName : '-'}</span>
                    </p>
                    <p className="text-gray-400">
                      Assignment Type : <span className="text-white font-medium">{selectedType ? types.find(t => t.id === selectedType)?.label : '-'}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-800">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-white text-black py-3 rounded-xl font-semibold hover:bg-gray-200 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-2xl flex items-center justify-center gap-2"
                >

                  SAVE
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-800 text-white border border-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-all duration-200 flex items-center justify-center gap-2"
                >

                  CANCEL
                </button>
                <button
                  onClick={() => navigate('/UAMList')}
                  className="flex-1 bg-gray-800 text-white border border-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-all duration-200 flex items-center justify-center gap-2"
                >

                  LIST
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}