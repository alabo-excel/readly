'use client';
import DashboardLayout from '@/components/DashboardLayout';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import axios from 'axios';

interface LibraryBook {
    book_id: string;
    title: string;
    author: string;
    cover_image: string | null;
    gutenberg_url: string | null;
    added_at: string;
}

const Library = () => {
    const [books, setBooks] = useState<LibraryBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        loadLibrary();
    }, []);

    const loadLibrary = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setLoading(false);
                return;
            }

            setUserId(user.id);

            // Get books from localStorage
            const libraryKey = `library_${user.id}`;
            const libraryData = localStorage.getItem(libraryKey);
            const userBooks: LibraryBook[] = libraryData ? JSON.parse(libraryData) : [];

            // Fetch fresh book data from Gutendex to get correct cover images
            const booksWithFreshData = await Promise.all(
                userBooks.map(async (book) => {
                    try {
                        const res = await axios.get(`https://gutendex.com/books/${book.book_id}`);
                        const gutendexData = res.data;
                        return {
                            ...book,
                            cover_image: gutendexData.formats["image/jpeg"] || null,
                            title: gutendexData.title || book.title,
                            author: gutendexData.authors?.[0]?.name || book.author,
                        };
                    } catch (error) {
                        console.error(`Error fetching book ${book.book_id}:`, error);
                        return book; // Return original book data if fetch fails
                    }
                })
            );

            setBooks(booksWithFreshData);
        } catch (error) {
            console.error('Error loading library:', error);
        } finally {
            setLoading(false);
        }
    };

    const removeFromLibrary = (bookId: string) => {
        if (!userId) return;

        const libraryKey = `library_${userId}`;
        const updatedBooks = books.filter(b => b.book_id !== bookId);

        if (updatedBooks.length === 0) {
            localStorage.removeItem(libraryKey);
        } else {
            localStorage.setItem(libraryKey, JSON.stringify(updatedBooks));
        }

        setBooks(updatedBooks);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="p-8 text-lg text-gray-600">Loading your library...</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold mb-2">📚 My Library</h1>
                    <p className="text-gray-600">{books.length} {books.length === 1 ? 'book' : 'books'} in your library</p>
                </div>

                {books.length === 0 ? (
                    <div className="bg-gray-50 rounded-xl p-12 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C6.228 6.253 2 10.541 2 15.75c0 5.209 4.228 9.497 10 9.497s10-4.288 10-9.497c0-5.209-4.228-9.497-10-9.497z" />
                        </svg>
                        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Your library is empty</h2>
                        <p className="text-gray-600 mb-6">Start adding books from the Discover section to build your library.</p>
                        <Link
                            href="/discover"
                            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Explore Books
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {books.map((book) => (
                            <div key={book.book_id} className="group bg-black rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full">
                                {/* Book Cover */}
                                <Link href={`/library/${book.book_id}`}>
                                    <div className="relative overflow-hidden bg-gray-700 h-60">
                                        <img
                                            src={book.cover_image || "https://via.placeholder.com/150x220?text=No+Cover"}
                                            alt={book.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            onError={(e) => {
                                                e.currentTarget.src = "https://via.placeholder.com/150x220?text=No+Cover";
                                            }}
                                        />
                                        {/* Overlay on hover */}
                                        {/* <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                                            <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m0 0h6m-6-6h6m0 0v6m0-6h6" />
                                                </svg>
                                                Read
                                            </button>
                                        </div> */}
                                    </div>
                                </Link>

                                {/* Book Info */}
                                <div className="p-4 flex-1 flex flex-col">
                                    <Link href={`/library/${book.book_id}`}>
                                        <h2 className="font-semibold text-gray-100 text-lg line-clamp-2 hover:text-blue-400 transition-colors cursor-pointer">
                                            {book.title}
                                        </h2>
                                    </Link>
                                    <p className="text-gray-400 text-sm mt-1 line-clamp-1">{book.author}</p>

                                    {/* Divider */}
                                    <div className="my-3 h-px bg-gray-700"></div>

                                    {/* Date Added */}
                                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-auto">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Added {new Date(book.added_at).toLocaleDateString()}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 p-4 border-t border-gray-700 bg-gray-900">
                                    <Link
                                        href={`/library/${book.book_id}`}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Read
                                    </Link>
                                    <button
                                        onClick={() => removeFromLibrary(book.book_id)}
                                        className="bg-red-900 hover:bg-red-800 text-red-200 font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center"
                                        title="Remove from library"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Library;