"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabaseClient";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

interface Author {
    name: string;
}

interface Book {
    id: number;
    title: string;
    authors: Author[];
    formats: {
        "image/jpeg"?: string;
        "text/plain": string;
    };
}

import { categories } from '../categories';



export default function Books() {
    const [showModal, setShowModal] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");

    useEffect(() => {
        checkFirstVisit();
    }, []);

    const checkFirstVisit = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Check if user has preferences
            const { data: userData } = await supabase
                .from('users')
                .select('categories')
                .eq('id', user.id)
                .single();

            if (!userData?.categories?.length) {
                setShowModal(true);
            } else {
                // Load recommended books based on saved preferences
                await loadRecommendedBooks(userData.categories);
            }
        } catch (error) {
            console.error('Error checking first visit:', error);
        }
    };

    const handleCategoryToggle = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const handleSavePreferences = async () => {
        try {
            setSaving(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Save preferences
            await supabase
                .from('users')
                .update({ categories: selectedCategories })
                .eq('id', user.id);

            // Load recommended books
            await loadRecommendedBooks(selectedCategories);
            setShowModal(false);
        } catch (error) {
            console.error('Error saving preferences:', error);
        } finally {
            setSaving(false);
        }
    };

    interface CategoryBooks {
        category: string;
        books: Book[];
        loading: boolean;
    }

    const [categoryBooks, setCategoryBooks] = useState<CategoryBooks[]>([]);
    const [searchResults, setSearchResults] = useState<Book[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchPage, setSearchPage] = useState(1);
    const [hasMoreResults, setHasMoreResults] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const loadRecommendedBooks = async (categories: string[]) => {
        try {
            setLoading(true);
            // Initialize all categories with loading state
            setCategoryBooks(categories.map(category => ({
                category,
                books: [],
                loading: true
            })));

            // Fetch books for each category in parallel
            const bookPromises = categories.map(async (category) => {
                try {
                    const url = query
                        ? `https://gutendex.com/books?search=${encodeURIComponent(query)}&languages=en&mime_type=text%2Fplain`
                        : `https://gutendex.com/books?topic=${encodeURIComponent(category)}&languages=en&mime_type=text%2Fplain&limit=8`;

                    const res = await axios.get(url);
                    const gutenbergBooks = res.data.results || [];

                    const formattedBooks = gutenbergBooks.map((item: any) => ({
                        id: item.id.toString(),
                        title: item.title,
                        authors: item.authors || ["Unknown"],
                        formats: item.formats,
                    }));

                    return {
                        category,
                        books: formattedBooks,
                        loading: false
                    };
                } catch (error) {
                    console.error(`Error fetching books for ${category}:`, error);
                    return {
                        category,
                        books: [],
                        loading: false
                    };
                }
            });

            const results = await Promise.all(bookPromises);
            setCategoryBooks(results);
        } catch (error) {
            console.error("Error fetching books:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Fetch books when the search query or selected categories change
        loadRecommendedBooks(selectedCategories);
    }, [query, selectedCategories]);

    const handleSearch = async (page: number = 1) => {
        if (!search.trim()) {
            setSearchResults([]);
            setHasSearched(false);
            return;
        }

        try {
            if (page === 1) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }
            setHasSearched(true);

            const url = `https://gutendex.com/books?search=${encodeURIComponent(search.trim())}&languages=en&mime_type=text%2Fplain&page=${page}`;
            const res = await axios.get(url);
            const gutenbergBooks = res.data.results || [];

            const formattedBooks = gutenbergBooks.map((item: any) => ({
                id: item.id.toString(),
                title: item.title,
                authors: item.authors || ["Unknown"],
                formats: item.formats,
            }));

            if (page === 1) {
                setSearchResults(formattedBooks);
                setSearchPage(1);
            } else {
                setSearchResults(prev => [...prev, ...formattedBooks]);
                setSearchPage(page);
            }

            // Check if there are more results
            setHasMoreResults(res.data.next !== null);
        } catch (error) {
            console.error("Error searching books:", error);
            if (page === 1) {
                setSearchResults([]);
            }
            setHasMoreResults(false);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const clearSearch = () => {
        setSearch("");
        setSearchResults([]);
        setHasSearched(false);
        setSearchPage(1);
        setHasMoreResults(true);
    }; return (
        <DashboardLayout>
            <div className="p-8">
                {/* Category Selection Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col mx-auto">
                            {/* Fixed Header */}
                            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                        Welcome to Readly!
                                    </h2>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                        aria-label="Close modal"
                                    >
                                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-2">
                                    Select your favorite categories to get personalized book recommendations.
                                </p>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                                    {categories.map((category) => (
                                        <button
                                            key={category}
                                            onClick={() => handleCategoryToggle(category)}
                                            className={`p-2 sm:p-3 rounded-lg text-xs sm:text-sm transition-colors text-left ${selectedCategories.includes(category)
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            <span className="block truncate" title={category}>
                                                {category}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Fixed Footer */}
                            <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
                                    <div className="flex-1 text-center sm:text-left">
                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                            {selectedCategories.length > 0
                                                ? `${selectedCategories.length} categories selected`
                                                : 'Select at least one category'
                                            }
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleSavePreferences}
                                        disabled={selectedCategories.length === 0 || saving}
                                        className={`w-full sm:w-auto px-6 py-2 sm:py-3 rounded-lg transition-colors flex items-center justify-center text-sm sm:text-base ${selectedCategories.length > 0 && !saving
                                                ? 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
                                                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        {saving ? (
                                            <>
                                                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Preferences'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* <h1 className="text-3xl font-semibold mb-6">📚 Discover Books</h1> */}

                {/* 🔍 Search Bar */}
                <div className="flex gap-2 mb-6">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch(1)}
                        placeholder="Search for books or authors..."
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={() => handleSearch(1)}
                        className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        Search
                    </button>
                    {hasSearched && (
                        <button
                            onClick={clearSearch}
                            className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition flex items-center gap-2"
                            title="Clear search"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Clear
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : hasSearched ? (
                    // Show search results
                    <div>
                        <h2 className="text-2xl font-semibold mb-6">Search Results</h2>
                        {searchResults.length > 0 ? (
                            <div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {searchResults.map((book) => (
                                        <Link key={book.id} href={`/discover/${book.id}`}>
                                            <div className="bg-black rounded-xl shadow hover:shadow-lg transition duration-300 overflow-hidden cursor-pointer h-full">
                                                <img
                                                    src={
                                                        book.formats["image/jpeg"]
                                                            ? book.formats["image/jpeg"]
                                                            : "https://via.placeholder.com/150x220?text=No+Cover"
                                                    }
                                                    alt={book.title}
                                                    className="w-full h-80 object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.src = "https://via.placeholder.com/150x220?text=No+Cover";
                                                    }}
                                                />
                                                <div className="p-4">
                                                    <h2 className="font-medium text-white text-lg line-clamp-2">{book.title}</h2>
                                                    {book.authors?.[0] && (
                                                        <p className="text-gray-500 text-sm mt-1">
                                                            {typeof book.authors[0] === "string"
                                                                ? book.authors[0]
                                                                : book.authors[0].name}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                {/* Load More Button for Search Results */}
                                {hasMoreResults && (
                                    <div className="flex justify-center mt-8">
                                        <button
                                            onClick={() => handleSearch(searchPage + 1)}
                                            disabled={loadingMore}
                                            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {loadingMore ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    {/* Loading... */}
                                                </>
                                            ) : (
                                                "Load More"
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-12">
                                <p className="text-lg">No books found matching your search.</p>
                                <button
                                    onClick={clearSearch}
                                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                                >
                                    Clear Search
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    // Show category books
                    <div className="space-y-12">
                        {categoryBooks.map(({ category, books, loading }) => (
                            <div key={category} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-semibold">{category}</h2>
                                    <Link href={`/discover/categories/${encodeURIComponent(category)}`} className="text-blue-500 hover:text-blue-800">
                                        See all
                                    </Link>
                                </div>
                                {loading ? (
                                    <div className="flex items-center justify-center h-64">
                                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : books.length > 0 ? (
                                    <div className="">
                                        <Swiper
                                            spaceBetween={24}
                                            breakpoints={{
                                                640: { slidesPerView: 1.5 },
                                                768: { slidesPerView: 2.5 },
                                                1024: { slidesPerView: 3.5 }
                                            }}
                                            className="!-mx-4 !px-4"
                                        >
                                            {books.map((book) => (
                                                <SwiperSlide key={book.id}>
                                                    <Link href={`/discover/${book.id}`}>
                                                        <div className="bg-black rounded-xl shadow hover:shadow-lg transition duration-300 overflow-hidden cursor-pointer h-full">
                                                            <img
                                                                src={
                                                                    book.formats["image/jpeg"]
                                                                        ? book.formats["image/jpeg"]
                                                                        : "https://via.placeholder.com/150x220?text=No+Cover"
                                                                }
                                                                alt={book.title}
                                                                className="w-full h-80 object-cover"
                                                                onError={(e) => {
                                                                    e.currentTarget.src = "https://via.placeholder.com/150x220?text=No+Cover";
                                                                }}
                                                            />
                                                            <div className="p-4">
                                                                <h2 className="font-medium text-white text-lg line-clamp-2">{book.title}</h2>
                                                                {book.authors?.[0] && (
                                                                    <p className="text-gray-500 text-sm mt-1">
                                                                        {typeof book.authors[0] === "string"
                                                                            ? book.authors[0]
                                                                            : book.authors[0].name}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </SwiperSlide>
                                            ))}
                                        </Swiper>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 py-8">
                                        No books found for {category}.
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
