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

    return (
        <DashboardLayout>
            <div className="p-8">
                {/* Category Selection Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
                            <h2 className="text-2xl font-bold mb-4">Welcome to Readly!</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                Select your favorite categories to get personalized book recommendations.
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                                {categories.map((category) => (
                                    <button
                                        key={category}
                                        onClick={() => handleCategoryToggle(category)}
                                        className={`p-3 rounded-lg text-sm transition-colors ${selectedCategories.includes(category)
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handleSavePreferences}
                                disabled={selectedCategories.length === 0 || saving}
                                className={`w-full py-3 rounded-lg transition-colors flex items-center justify-center ${selectedCategories.length > 0 && !saving
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                {saving ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Saving...
                                    </>
                                ) : (
                                    'Save Preferences'
                                )}
                            </button>
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
                        placeholder="Search for books or authors..."
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        onClick={() => setQuery(search.trim())}
                        className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        Search
                    </button>
                </div>

                {loading ? (
                    <div className="p-8 text-lg text-gray-600">Loading books...</div>
                ) : (
                    <div className="space-y-12">
                        {categoryBooks.map(({ category, books, loading }) => (
                            <div key={category} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-semibold">{category}</h2>
                                    <Link href={`/discover/categories/${encodeURIComponent(category)}`} className="text-blue-600 hover:text-blue-800">
                                        See all
                                    </Link>
                                </div>
                                {loading ? (
                                    <div className="flex items-center justify-center h-64">
                                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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
                                                        <div className="bg-white rounded-xl shadow hover:shadow-lg transition duration-300 overflow-hidden cursor-pointer h-full">
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
                                                                <h2 className="font-medium text-black text-lg line-clamp-2">{book.title}</h2>
                                                                {/* {book.authors?.[0] && (
                                                                    <p className="text-gray-600 text-sm mt-1">
                                                                        {typeof book.authors[0] === "string"
                                                                            ? book.authors[0]
                                                                            : book.authors[0].name}
                                                                    </p>
                                                                )} */}
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </SwiperSlide>
                                            ))}
                                        </Swiper>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-600 py-8">
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
