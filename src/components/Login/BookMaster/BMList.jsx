import React, { useState } from 'react';
import Layout from '../Layout/AdminLayout';
import { useNavigate } from 'react-router-dom';
import { useEffect } from "react";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from '../../../firebase';
import toast from "react-hot-toast";

export default function BookList() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLanguage, setFilterLanguage] = useState('all');
    const [bookList, setBookList] = useState([]);


    const languages = ['All Languages', 'English', 'Hindi', 'Gujarati'];





    const fetchBooks = async () => {
        try {
            const bookSnap = await getDocs(collection(db, "books"));
            const assignSnap = await getDocs(collection(db, "chapterAssignments"));

            const assignments = assignSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const books = bookSnap.docs.map((docItem) => {
                const bookData = docItem.data();

                const bookAssignments = assignments.filter(
                    a => a.bookId === docItem.id
                );

                // Each assignment is already one chapter
                const total = bookData.maxChapterLimit || 0;

                let assignedCount = 0;
                let qcCount = 0;
                let deliveredCount = 0;

                bookAssignments.forEach(a => {

                    const recStatus = a.recording?.status;
                    const splitStatus = a.splitting?.status;
                    const qcStatus = a.qc?.status;

                    // Assigned (work in progress)
                    if (
                        recStatus === 1 || recStatus === 2 ||
                        splitStatus === 1 || splitStatus === 2
                    ) {
                        assignedCount++;
                    }

                    // Under QC
                    if (qcStatus === 3 || qcStatus === 4 || qcStatus === 5) {
                        qcCount++;
                    }

                    // Delivered
                    if (qcStatus === 6) {
                        deliveredCount++;
                    }
                });

                const assignedPercent = total > 0 ? (assignedCount / total) * 100 : 0;
                const qcPercent = total > 0 ? (qcCount / total) * 100 : 0;
                const deliveredPercent = total > 0 ? (deliveredCount / total) * 100 : 0;

                const allDelivered =
                    deliveredCount > 0 &&
                    deliveredCount === total;



                return {
                    id: docItem.id,
                    ...bookData,
                    assignedCount,
                    qcCount,
                    deliveredCount,
                    assignedPercent,
                    qcPercent,
                    deliveredPercent,
                    allDelivered,
                    createdAt:
                        bookData.createdAt?.toDate()?.toLocaleString() || ""
                };
            });

            console.log("books", books)

            setBookList(books);

        } catch (error) {
            console.error("Error fetching books:", error);
        }
    };

    useEffect(() => {
        fetchBooks();
    }, []);

    const handleBookDelivered = async (id) => {
        if (!window.confirm("Mark this book as Delivered to Client?")) return;

        try {
            await updateDoc(doc(db, "books", id), {
                bookStatus: 2
            });
            toast.success("Book Delivered to Client successfully.");

            fetchBooks();
        } catch (error) {
            toast.success(`Error updating Book Delivery Status : ${error}`);
            console.error("Error updating book status:", error);
        }
    };


    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this book?")) {
            try {
                await deleteDoc(doc(db, "books", id));
                fetchBooks();
            } catch (error) {
                console.error("Error deleting book:", error);
            }
        }
    };

    const handleStatusToggle = async (id, currentStatus) => {
        try {
            await updateDoc(doc(db, "books", id), {
                status: currentStatus === "Active" ? "Inactive" : "Active"
            });
            fetchBooks();
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };
    const handleEdit = (book) => {
        // Navigate to book master with book data
        navigate('/BM', { state: { book } });
    };

    const handleAddNew = () => {
        navigate('/BM');
    };


    // Filter books based on search and language
    const filteredBooks = bookList.filter(book => {
        const matchesSearch =
            book.bookName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.language.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesLanguage =
            filterLanguage === 'all' ||
            filterLanguage === 'All Languages' ||
            book.language.toLowerCase() === filterLanguage.toLowerCase();

        return matchesSearch && matchesLanguage;
    });

    const totalBooks = bookList.length;
    const activeBooks = bookList.filter(b => b.status === 'Active').length;
    const inactiveBooks = bookList.filter(b => b.status === 'Inactive').length;
    const totalChapters = bookList.reduce(
        (sum, book) => sum + (book.chapters?.length || 0),
        0
    );

    return (
        <Layout title="Book List" subtitle="View and manage all books in the system">
            <div className="max-w-7xl mx-auto">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                    {/* Search Bar */}
                    <div className="relative flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-2 w-5 text-gray-400" fill="none" viewBox="0 0 10 10" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by book name or language..."
                            className="w-full pl-3 pr-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-xl  outline-none placeholder-gray-500"
                        />
                    </div>

                    {/* Filter and Add Button */}
                    <div className="flex items-center gap-3">
                        {/* Language Filter */}
                        <select
                            value={filterLanguage}
                            onChange={(e) => setFilterLanguage(e.target.value)}
                            className="px-2 py-3 bg-gray-800 border border-gray-700 text-white rounded-xl  outline-none cursor-pointer"
                        >
                            {languages.map((lang) => (
                                <option key={lang} value={lang === 'All Languages' ? 'all' : lang}>
                                    {lang}
                                </option>
                            ))}
                        </select>

                        {/* Add New Button */}
                        <button
                            onClick={handleAddNew}
                            className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add New Book
                        </button>
                    </div>
                </div>



                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                    <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-6">

                        <div className="flex flex-col items-center justify-center text-center">
                            <p className="text-gray-400 text-sm mb-2">Total Books</p>
                            <p className="text-3xl font-bold text-white">{totalBooks}</p>

                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-6">
                        <div className="flex flex-col items-center justify-center text-center">

                            <p className="text-gray-400 text-sm mb-1">Active Books</p>
                            <p className="text-3xl font-bold text-green-400">{activeBooks}</p>


                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-6">
                        <div className="flex flex-col items-center justify-center text-center">

                            <p className="text-gray-400 text-sm mb-1">InActive Books</p>
                            <p className="text-3xl font-bold text-red-400">{inactiveBooks}</p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
                        <div className="flex flex-col items-center justify-center text-center">

                            <p className="text-gray-400 text-sm mb-1">Total Chapters</p>
                            <p className="text-3xl font-bold text-blue-400">{totalChapters}</p>

                        </div>
                    </div>
                </div>

                {/* Book List Grid */}
                <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">
                            Books ({filteredBooks.length})
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

                    {filteredBooks.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <p className="text-gray-400 text-lg">
                                {searchTerm ? 'No Records Found matching your search' : 'No Records Found'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredBooks.map((book) => (
                                <div
                                    key={book.id}
                                    className="bg-gray-800 bg-opacity-50 border border-gray-700 rounded-xl p-6 hover:border-white transition-all duration-300 group"
                                >
                                    {/* Book Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-white font-bold text-xl mb-2 line-clamp-2">
                                                {book.bookName}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <span className="bg-white bg-opacity-10 text-black text-xs px-2 py-1 rounded">
                                                    {book.language}
                                                </span>
                                                {book.bookStatus === 2 ? (
                                                    <span className="text-xs px-2 py-1 rounded font-medium bg-blue-600 text-white">
                                                        Delivered
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleStatusToggle(book.id, book.status)}
                                                        className={`text-xs px-2 py-1 rounded font-medium transition-all ${book.status === 1
                                                                ? 'bg-green-600 text-white hover:bg-green-700'
                                                                : 'bg-red-600 text-white hover:bg-red-700'
                                                            }`}
                                                    >
                                                     {book.status === 1 ? "Active" : "Inactive"}
                                                    </button>
                                                )}
                                                {book.allDelivered && book.bookStatus !== 2 && (
                                                    <button
                                                        onClick={() => handleBookDelivered(book.id)}
                                                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                                                    >
                                                        Mark Book Delivered
                                                    </button>
                                                )}

                                            </div>
                                        </div>
                                    </div>

                                    {/* Book Details */}
                                    <div className="space-y-3 mb-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-400">Total Chapters :</span>
                                            <span className="text-white font-semibold">{book.maxChapterLimit}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-400">Assigned :</span>
                                            <span className="text-white font-semibold">{book.assignedCount || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-400">Completion:</span>
                                            <span className="text-white font-semibold">
                                                {book.chapters?.slice(0, 8).map((ch) => (
                                                    <span key={ch.chapterNumber} className="bg-white text-black text-xs px-2 py-1 rounded font-medium">
                                                        {ch.chapterNumber}
                                                    </span>
                                                ))}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden flex">

                                            {/* Assigned - Blue */}
                                            <div
                                                className="bg-blue-500 h-3 transition-all duration-500"
                                                style={{ width: `${book.assignedPercent}%` }}
                                            ></div>

                                            {/* QC - Yellow */}
                                            <div
                                                className="bg-yellow-400 h-3 transition-all duration-500"
                                                style={{ width: `${book.qcPercent}%` }}
                                            ></div>

                                            {/* Delivered - Green */}
                                            <div
                                                className="bg-green-500 h-3 transition-all duration-500"
                                                style={{ width: `${book.deliveredPercent}%` }}
                                            ></div>

                                        </div>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <span className="w-3 h-3 bg-blue-500 rounded-sm"></span>
                                                Assigned
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="w-3 h-3 bg-yellow-400 rounded-sm"></span>
                                                Under QC
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="w-3 h-3 bg-green-500 rounded-sm"></span>
                                                Delivered
                                            </div>
                                        </div>
                                    </div>

                                    {/* Chapter Preview */}
                                   

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                                        <p className="text-gray-500 text-xs">{book.createdAt}</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                disabled={book.bookStatus === 2}
                                                onClick={() => handleEdit(book)}
                                                className={`p-2 rounded-lg transition-colors ${book.bookStatus === 2
                                                        ? "text-gray-600 cursor-not-allowed"
                                                        : "text-gray-400 hover:text-white hover:bg-gray-700"
                                                    }`}
                                                title={book.bookStatus === 2 ? "Delivered book cannot be edited" : "Edit"}
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(book.id)}
                                                className={`p-2 rounded-lg transition-colors ${book.bookStatus === 2
                                                        ? "text-gray-600 cursor-not-allowed"
                                                        : "text-gray-400 hover:text-white hover:bg-gray-700"
                                                    }`}
                                                title={book.bookStatus === 2 ? "Delivered book cannot be deleted" : "Delete"}
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        
                                        {book.pdfUrl && (
                                            <a
                                                href={book.pdfUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                download
                                                className="text-gray-400 hover:text-blue-400 transition-colors p-2 hover:bg-gray-700 rounded-lg"
                                                title="Download"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                            </a>
                                        )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination Placeholder */}
                    {filteredBooks.length > 0 && (
                        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-800">
                            <p className="text-gray-400 text-sm">
                                Showing {filteredBooks.length} of {bookList.length} books
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