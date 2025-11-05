'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import axios from 'axios';

interface LibraryBook {
    book_id: string;
    title: string;
    author: string;
    cover_image: string | null;
    gutenberg_url: string | null;
    added_at: string;
}

const BookReader = () => {
    const params = useParams();
    const router = useRouter();
    const bookId = params.id as string;

    const [book, setBook] = useState<LibraryBook | null>(null);
    const [bookContent, setBookContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fontSize, setFontSize] = useState(16);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [showMenu, setShowMenu] = useState(true);
    const [readingProgress, setReadingProgress] = useState(0);

    const CHARS_PER_PAGE = 2000; // Approximate characters per page

    useEffect(() => {
        loadBook();
    }, [bookId]);

    const loadBook = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/auth/login');
                return;
            }

            // Fetch book metadata from Gutendex
            const res = await axios.get(`https://gutendex.com/books/${bookId}`);
            const data = res.data;

            // Create book object from Gutendex data
            const bookData: LibraryBook = {
                book_id: bookId,
                title: data.title,
                author: data.authors?.[0]?.name || "Unknown",
                cover_image: data.formats["image/jpeg"] || null,
                gutenberg_url: data.formats["text/plain"] || null,
                added_at: new Date().toISOString()
            };

            setBook(bookData);

            // Check if book content is cached in localStorage
            const cacheKey = `book_content_${bookId}`;
            const cachedContent = localStorage.getItem(cacheKey);

            let text: string | null = cachedContent;

            // If not cached, fetch from proxy URL
            if (!text && data.formats["text/plain; charset=us-ascii"]) {
                const textUrl = data.formats["text/plain; charset=us-ascii"];
                const proxyUrl = `/api/proxy-gutenberg-text?url=${encodeURIComponent(textUrl)}`;

                const textRes = await axios.get(proxyUrl);
                let fetchedText: string = textRes.data;

                // Remove Gutenberg boilerplate
                const startMarker = /\*\*\* START OF (THE|THIS) PROJECT GUTENBERG EBOOK[\s\S]*?\*\*\*/i;
                const endMarker = /\*\*\* END OF (THE|THIS) PROJECT GUTENBERG EBOOK[\s\S]*?\*\*\*/i;

                const startIndex = fetchedText.search(startMarker);
                const endIndex = fetchedText.search(endMarker);

                if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
                    fetchedText = fetchedText.slice(startIndex, endIndex)
                        .replace(startMarker, "")
                        .replace(endMarker, "");
                } else {
                    // Fallback cleanup
                    fetchedText = fetchedText.replace(/^[\s\S]*?(?=CHAPTER|INTRODUCTION)/i, "");
                    fetchedText = fetchedText.replace(/THE END.*$/i, "");
                }

                // Optional cleanup
                fetchedText = fetchedText.replace(/\r?\n{2,}/g, "\n\n").trim();

                // Store in localStorage for future reads
                localStorage.setItem(cacheKey, fetchedText);
                text = fetchedText;
            }

            if (text) {
                setBookContent(text);

                // Calculate total pages
                const pages = Math.ceil(text.length / CHARS_PER_PAGE);
                setTotalPages(pages);

                // Load saved reading progress
                const progressKey = `reading_progress_${bookId}`;
                const savedProgress = localStorage.getItem(progressKey);
                if (savedProgress) {
                    const page = parseInt(savedProgress);
                    setCurrentPage(Math.min(page, pages - 1));
                } else {
                    setCurrentPage(0);
                }
            } else {
                setError("No plain text available for this book.");
            }
        } catch (err) {
            console.error("Error fetching book:", err);
            setError("Failed to load book content. Please try another book.");
        } finally {
            setLoading(false);
        }
    };

    const saveReadingProgress = (page: number) => {
        const progressKey = `reading_progress_${bookId}`;
        localStorage.setItem(progressKey, page.toString());
        const progress = ((page + 1) / totalPages) * 100;
        setReadingProgress(progress);
    };

    const goToNextPage = () => {
        if (currentPage < totalPages - 1) {
            const newPage = currentPage + 1;
            setCurrentPage(newPage);
            saveReadingProgress(newPage);
        }
    };

    const goToPreviousPage = () => {
        if (currentPage > 0) {
            const newPage = currentPage - 1;
            setCurrentPage(newPage);
            saveReadingProgress(newPage);
        }
    };

    const getCurrentPageContent = () => {
        const startChar = currentPage * CHARS_PER_PAGE;
        const endChar = startChar + CHARS_PER_PAGE;
        return bookContent.slice(startChar, endChar);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading book...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="h-screen flex flex-col items-center justify-center">
                    <div className="text-center">
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={() => router.push('/library')}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700"
                        >
                            Back to Library
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <div className="h-screen bg-gray-900 text-white flex flex-col">
            {/* Top Menu */}
            {showMenu && (
                <div className="bg-gray-800 border-b border-gray-700 p-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h1 className="text-2xl font-bold">{book?.title}</h1>
                                <p className="text-gray-400">{book?.author}</p>
                            </div>
                            <button
                                onClick={() => router.push('/library')}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                            >
                                ← Back
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${readingProgress}%` }}
                                ></div>
                            </div>
                            <p className="text-sm text-gray-400 mt-2">
                                Page {currentPage + 1} of {totalPages} ({Math.round(readingProgress)}%)
                            </p>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-400">Font Size:</span>
                                <button
                                    onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition text-sm"
                                >
                                    A−
                                </button>
                                <span className="w-8 text-center text-sm">{fontSize}px</span>
                                <button
                                    onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition text-sm"
                                >
                                    A+
                                </button>
                            </div>
                            <button
                                onClick={() => setShowMenu(false)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                            >
                                Hide Menu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Book Content Area */}
            <div className="flex-1 overflow-auto bg-gray-950 p-8">
                <div className="max-w-3xl mx-auto">
                    <div
                        style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}
                        className="text-gray-100 whitespace-pre-wrap leading-relaxed"
                    >
                        {getCurrentPageContent()}
                    </div>
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className={`${showMenu ? 'bg-gray-800' : 'bg-gray-900 hover:bg-gray-800'} border-t border-gray-700 transition-colors`}>
                <div className="max-w-4xl mx-auto px-8 py-4 flex items-center justify-between">
                    <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 0}
                        className={`px-6 py-2 rounded-lg transition ${currentPage === 0
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-700 text-white'
                            }`}
                    >
                        ←
                    </button>

                    {/* <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                    >
                        {showMenu ? '▼ Hide' : '▲ Show'} Menu
                    </button> */}

                    <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages - 1}
                        className={`px-6 py-2 rounded-lg transition ${currentPage === totalPages - 1
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-700 text-white'
                            }`}
                    >
                        →
                    </button>
                </div>
            </div>

            {/* Show menu hint when hidden */}
            {!showMenu && (
                <button
                    onClick={() => setShowMenu(true)}
                    className="fixed top-4 right-4 px-3 py-1 bg-gray-800 text-xs rounded hover:bg-gray-700 transition"
                >
                    Press to show menu
                </button>
            )}
        </div>
    );
};

export default BookReader;