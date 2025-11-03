'use client';
import DashboardLayout from '@/components/DashboardLayout';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

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

            setBooks(userBooks);
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
                            <div key={book.book_id} className="bg-white rounded-xl shadow hover:shadow-lg transition duration-300 overflow-hidden">
                                <Link href={`/library/${book.book_id}`}>
                                    <div className="cursor-pointer">
                                        <img
                                            src={
                                                book.cover_image
                                                    ? book.cover_image
                                                    : "https://via.placeholder.com/150x220?text=No+Cover"
                                            }
                                            alt={book.title}
                                            className="w-full h-56 object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = "https://via.placeholder.com/150x220?text=No+Cover";
                                            }}
                                        />
                                        <div className="p-4">
                                            <h2 className="font-medium text-black text-lg line-clamp-2">{book.title}</h2>
                                            <p className="text-gray-600 text-sm mt-1 line-clamp-1">{book.author}</p>
                                            <p className="text-gray-500 text-xs mt-2">
                                                Added {new Date(book.added_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                                <button
                                    onClick={() => removeFromLibrary(book.book_id)}
                                    className="w-full px-4 py-2 text-red-600 hover:bg-red-50 transition border-t border-gray-200"
                                >
                                    Remove from Library
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Library;