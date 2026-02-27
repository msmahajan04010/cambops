import React, { useState,useEffect } from 'react';
import Layout from '../Layout/AdminLayout';
import { useNavigate, useLocation } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { db, storage } from '../../../firebase';
import toast from "react-hot-toast";

export default function BookMaster() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [bookName, setBookName] = useState('');
  const [maxChapterLimit, setMaxChapterLimit] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [bookLink, setBookLink] = useState('');
  const location = useLocation();
const editingBook = location.state?.book || null;
const [isEditMode, setIsEditMode] = useState(false);

  const CLOUD_NAME = "drfek4vzw";
  const UPLOAD_PRESET = "CAMBAI";

  const [bookCode, setBookCode] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const languages = [
    'English',
    'Hindi',
    'Gujarati',
  ];

  useEffect(() => {
  if (editingBook) {
    setIsEditMode(true);

    setBookName(editingBook.bookName || '');
    setBookCode(editingBook.bookCode || '');
    setMaxChapterLimit(editingBook.maxChapterLimit || '');
    setSelectedLanguage(editingBook.language || '');
    setBookLink(editingBook.bookLink || '');

    // Extract chapter numbers from chapters array
    if (editingBook.chapters) {
      const chapterNumbers = editingBook.chapters.map(ch => ch.chapterNumber);
      setSelectedChapters(chapterNumbers);
    }
  }
}, [editingBook]);

  // Generate chapter checkboxes based on max chapter limit
  const generateChapters = () => {
    const limit = parseInt(maxChapterLimit);
    if (!limit || limit <= 0) return [];
    return Array.from({ length: limit }, (_, i) => i + 1);
  };

  const handleChapterToggle = (chapterNum) => {
    setSelectedChapters(prev => {
      if (prev.includes(chapterNum)) {
        return prev.filter(ch => ch !== chapterNum);
      } else {
        return [...prev, chapterNum].sort((a, b) => a - b);
      }
    });
  };

  const handleSelectAll = () => {
    const allChapters = generateChapters();
    if (selectedChapters.length === allChapters.length) {
      setSelectedChapters([]);
    } else {
      setSelectedChapters(allChapters);
    }
  };

 const handleSave = async () => {
  if (
    !bookName ||
    !bookCode ||
    !maxChapterLimit ||
    !selectedLanguage ||
    selectedChapters.length === 0
  ) {
    toast.error("Please fill all required fields");
    return;
  }

  try {
     setLoading(true);
    let uploadedPdfUrl = editingBook?.pdfUrl || null;

    // If new file selected → upload
    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("upload_preset", UPLOAD_PRESET);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!data.secure_url) {
        toast.error("Upload failed");
        return;
      }

      uploadedPdfUrl = data.secure_url;
    }

    const chapterDetails = selectedChapters.map((ch) => ({
      chapterNumber: ch,
      chapterName: `${ch}_BK_ADBL_${bookCode}`
    }));

    const bookData = {
      bookName,
      bookCode,
      language: selectedLanguage,
      maxChapterLimit: parseInt(maxChapterLimit),
      chapters: chapterDetails,
      pdfUrl: uploadedPdfUrl,
      bookLink: bookLink || null,
      updatedAt: new Date()
    };

    if (isEditMode) {
      await updateDoc(doc(db, "books", editingBook.id), bookData);
       setLoading(false);
      toast.success(`Book : ${bookName} updated successfully.`);
    } else {
      await addDoc(collection(db, "books"), {
        ...bookData,
        status: 1,
        createdAt: new Date()
      });
        setLoading(false);
      toast.success(`Book : ${bookName} saved successfully.`);
    }

    navigate("/BMList");

  } catch (error) {
    console.error(error);
    toast.error("Error saving book");
  }
};


  const handleCancel = () => {
    setBookName('');
    setBookCode('');
    setMaxChapterLimit('');
    setSelectedLanguage('');
    setSelectedChapters([]);
    setSelectedFile(null);
    setBookLink('');
  };

  const chapters = generateChapters();

        if (loading) {
  return (
    <Layout title="Dashboard">
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          
          {/* Spinner */}
          <div className="w-12 h-12 border-4 border-gray-700 border-t-white rounded-full animate-spin"></div>

          <p className="text-gray-400 text-sm">Saving Book Data...</p>
        </div>
      </div>
    </Layout>
  );
}

  return (
    <Layout 
  title={isEditMode ? "Edit Book" : "Book Master"} 
  subtitle={isEditMode ? "Update book details" : "Add and manage your book collection"}
>
      <div className="min-h-screen bg-black p-3 sm:p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}

          <div className="
  bg-gradient-to-br from-gray-900 to-black 
  border border-gray-800 
  rounded-xl sm:rounded-2xl 
  p-4 sm:p-6 md:p-8
">
            <div className="space-y-6">
              {/* Book Name */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="space-y-2">
                  <label htmlFor="bookName" className="block text-sm font-medium text-gray-300">
                    Book Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="bookName"
                    maxLength={90}
                    type="text"
                    value={bookName}
                    onChange={(e) => setBookName(e.target.value)}
                    className="w-full text-base px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-xl transition-all duration-200 outline-none placeholder-gray-500"

                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="bookName" className="block text-sm font-medium text-gray-300">
                    Book Code <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="bookCode"
                    type="text"
                     maxLength={45}
                    value={bookCode}
                    onChange={(e) => setBookCode(e.target.value)}
                    className="w-full text-base px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-xl transition-all duration-200 outline-none placeholder-gray-500"

                  />
                </div>
              </div>


              {/* Max Chapter Limit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Max Chapter Limit */}
                <div className="space-y-2">
                  <label htmlFor="maxChapter" className="block text-sm font-medium text-gray-300">
                    Max Chapter Limit <span className="text-red-400">*</span>
                  </label>
                <input
  id="maxChapter"
  type="text"
  inputMode="numeric"
  pattern="[0-9]*"
  maxLength={3}
  value={maxChapterLimit}
  onChange={(e) => {
    const value = e.target.value.replace(/\D/g, ''); // allow only digits
    setMaxChapterLimit(value.slice(0, 3)); // limit to 3 digits
    setSelectedChapters([]);
  }}
  className="w-full text-base px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-xl transition-all duration-200 outline-none placeholder-gray-500"
/>
                </div>

                {/* Select Language */}
                <div className="space-y-2">
                  <label htmlFor="language" className="block text-sm font-medium text-gray-300">
                    Select Language <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="language"
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="w-full text-base px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-xl transition-all duration-200 outline-none appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-gray-800">--Select--</option>
                      {languages.map((lang) => (
                        <option key={lang} value={lang} className="bg-gray-800">
                          {lang}
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

              </div>




              {/* Chapter Checkboxes */}
              {chapters.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                   <label className="block text-sm font-medium text-gray-300">
  Select Chapters <span className="text-red-400">*</span>
  <span className="ml-3">
    Selected : <span className="text-white font-semibold">
      {selectedChapters.length}
    </span> / {chapters.length} chapters
  </span>
</label>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-sm text-white hover:text-gray-300 transition-colors underline"
                    >
                      {selectedChapters.length === chapters.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {chapters.map((chapterNum) => (
                        <label
                          key={chapterNum}
                          className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all duration-200 ${selectedChapters.includes(chapterNum)
                            ? 'bg-white text-black'
                            : 'bg-gray-700 text-white hover:bg-gray-600'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedChapters.includes(chapterNum)}
                            onChange={() => handleChapterToggle(chapterNum)}
                            className="w-4 h-4 rounded focus:ring-2 focus:ring-white"
                          />
                          <span className="font-medium">{chapterNum}_BK_ADBL_{bookCode}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                 
                </div>
              )}

              {/* Upload Book PDF */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Upload Book (PDF) *
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full text-base px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-xl"
                />
              </div>


              {/* Book External Link */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Book Reference Link
                </label>
                <input
                  type="url"
                  value={bookLink}
                  onChange={(e) => setBookLink(e.target.value)}

                  className="w-full text-base px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-xl outline-none"
                />
              </div>



              {/* Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-800">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-white text-black py-3 rounded-xl font-semibold hover:bg-gray-200 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-2xl flex items-center justify-center gap-2"
                >

                  {isEditMode ? "UPDATE" : "SAVE"}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-800 text-white border border-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-all duration-200 flex items-center justify-center gap-2"
                >

                  CANCEL
                </button>
                <button
                  onClick={() => navigate('/BMList')}
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