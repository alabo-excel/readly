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
    const [pages, setPages] = useState<string[]>([]);

    const CHARS_PER_PAGE = 3500; // Increased characters per page for better reading experience

    // Smart pagination that respects sentence and paragraph boundaries
    const splitIntoPages = (content: string): string[] => {
        const pages: string[] = [];
        let currentPageContent = '';

        // Clean and normalize the content first
        const cleanContent = content
            .replace(/\r\n/g, '\n')  // Normalize line endings
            .replace(/\n{3,}/g, '\n\n')  // Reduce excessive line breaks
            .trim();

        // Split content into paragraphs
        const paragraphs = cleanContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);

        for (const paragraph of paragraphs) {
            const trimmedParagraph = paragraph.trim();

            // Check if adding this paragraph would exceed page limit
            if (currentPageContent.length + trimmedParagraph.length + 4 > CHARS_PER_PAGE && currentPageContent.length > 0) {
                // Try to find a good sentence break point
                const sentences = currentPageContent.split(/(?<=[.!?])\s+/);

                if (sentences.length > 1) {
                    // Find the best break point (around 75% of page capacity for better flow)
                    const targetLength = CHARS_PER_PAGE * 0.75;
                    let bestBreakIndex = 0;
                    let currentLength = 0;

                    for (let i = 0; i < sentences.length; i++) {
                        const nextLength = currentLength + sentences[i].length;
                        if (nextLength >= targetLength) {
                            bestBreakIndex = i;
                            break;
                        }
                        currentLength = nextLength;
                        bestBreakIndex = i;
                    }

                    // Split at the best break point
                    const pageContent = sentences.slice(0, bestBreakIndex + 1).join(' ').trim();
                    const remainingContent = sentences.slice(bestBreakIndex + 1).join(' ').trim();

                    if (pageContent) {
                        pages.push(pageContent);
                    }

                    currentPageContent = remainingContent;
                } else {
                    // No good sentence break, just split at paragraph boundary
                    pages.push(currentPageContent.trim());
                    currentPageContent = '';
                }
            }

            // Add current paragraph
            if (currentPageContent.length > 0) {
                currentPageContent += '\n\n' + trimmedParagraph;
            } else {
                currentPageContent = trimmedParagraph;
            }

            // If single paragraph is too long, split it more carefully
            if (currentPageContent.length > CHARS_PER_PAGE * 1.1) {
                const sentences = currentPageContent.split(/(?<=[.!?])\s+/);
                let tempPage = '';

                for (const sentence of sentences) {
                    if (tempPage.length + sentence.length + 1 > CHARS_PER_PAGE && tempPage.length > 0) {
                        pages.push(tempPage.trim());
                        tempPage = sentence;
                    } else {
                        tempPage += (tempPage ? ' ' : '') + sentence;
                    }
                }
                currentPageContent = tempPage;
            }
        }

        // Add the last page if there's content
        if (currentPageContent.trim()) {
            pages.push(currentPageContent.trim());
        }

        return pages.filter(page => page.length > 0);
    };

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

                // Split content into smart pages
                const splitPages = splitIntoPages(text);
                setPages(splitPages);
                setTotalPages(splitPages.length);

                // Load saved reading progress
                const progressKey = `reading_progress_${bookId}`;
                const savedProgress = localStorage.getItem(progressKey);
                if (savedProgress) {
                    const page = parseInt(savedProgress);
                    setCurrentPage(Math.min(page, splitPages.length - 1));
                } else {
                    setCurrentPage(0);
                }

                // Calculate initial reading progress
                const initialProgress = savedProgress ?
                    ((parseInt(savedProgress) + 1) / splitPages.length) * 100 : 0;
                setReadingProgress(initialProgress);
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

    const scrollToTop = () => {
        const contentArea = document.querySelector('.flex-1.overflow-auto');
        if (contentArea) {
            contentArea.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const goToNextPage = () => {
        if (currentPage < totalPages - 1) {
            const newPage = currentPage + 1;
            setCurrentPage(newPage);
            saveReadingProgress(newPage);
            scrollToTop();
        }
    };

    const goToPreviousPage = () => {
        if (currentPage > 0) {
            const newPage = currentPage - 1;
            setCurrentPage(newPage);
            saveReadingProgress(newPage);
            scrollToTop();
        }
    };

    const goToPage = (pageNumber: number) => {
        const targetPage = Math.max(0, Math.min(pageNumber, totalPages - 1));
        setCurrentPage(targetPage);
        saveReadingProgress(targetPage);
        scrollToTop();
    };

    const getCurrentPageContent = () => {
        return pages[currentPage] || '';
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                goToPreviousPage();
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                goToNextPage();
            } else if (e.key === 'Escape') {
                setShowMenu(!showMenu);
            } else if (e.key === 'Home') {
                e.preventDefault();
                scrollToTop();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentPage, totalPages, showMenu]);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading book...</p>
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
        <div className="h-screen text-white flex flex-col">
            {/* Top Menu */}
            {showMenu && (
                <div className="bg-black border-b border-gray-700 p-4">
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
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-sm text-gray-400">
                                    Page {currentPage + 1} of {totalPages} ({Math.round(readingProgress)}%)
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-400">Go to page:</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max={totalPages}
                                        value={currentPage + 1}
                                        onChange={(e) => {
                                            const page = parseInt(e.target.value) - 1;
                                            if (!isNaN(page)) goToPage(page);
                                        }}
                                        className="w-16 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-center focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>
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
            <div className="flex-1 overflow-auto bg-gray-950">
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <div
                        style={{
                            fontSize: `${fontSize}px`,
                            lineHeight: '1.7'
                        }}
                        className="text-gray-100"
                    >
                        <div className="prose prose-invert max-w-none">
                            {getCurrentPageContent().split('\n\n').map((paragraph, index) => (
                                paragraph.trim() ? (
                                    <p key={index} className="mb-6 text-justify leading-relaxed">
                                        {paragraph.trim()}
                                    </p>
                                ) : null
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className={`${showMenu ? 'bg-black' : 'bg-black hover:bg-gray-800'} border-t border-gray-700 transition-colors`}>
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={goToPreviousPage}
                            disabled={currentPage === 0}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${currentPage === 0
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-700 text-white'
                                }`}
                        >
                            <span>←</span>
                            <span className="hidden sm:inline">Previous</span>
                        </button>

                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span>Use arrow keys to navigate</span>
                            <span className="hidden md:inline">• ESC to toggle menu • Home to scroll top</span>
                        </div>

                        <button
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages - 1}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${currentPage === totalPages - 1
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-700 text-white'
                                }`}
                        >
                            <span className="hidden sm:inline">Next</span>
                            <span>→</span>
                        </button>
                    </div>
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