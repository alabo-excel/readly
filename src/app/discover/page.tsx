"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";

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



export default function Books() {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                setLoading(true);
                const url = query
                    ? `https://gutendex.com/books?search=${encodeURIComponent(query)}&languages=en&mime_type=text%2Fplain`
                    : `https://gutendex.com/books?topic=Dramas&languages=en&mime_type=text%2Fplain&limit=20`;

                const res = await axios.get(url);
                const gutenbergBooks = res.data.results || [];

                const formattedBooks = gutenbergBooks.map((item: any) => ({
                    id: item.id.toString(),
                    title: item.title,
                    authors: item.authors || ["Unknown"],
                    formats: item.formats,
                }));

                setBooks(formattedBooks);
            } catch (error) {
                console.error("Error fetching books:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBooks();
    }, [query]);

    return (
        <DashboardLayout> 
        <div className="p-8">
            <h1 className="text-3xl font-semibold mb-6">📚 Public Domain Books (Project Gutenberg)</h1>

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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {books.length > 0 ? (
                        books.map((book) => (
                            <Link key={book.id} href={`/books/${book.id}`}>
                                <div className="bg-white rounded-xl shadow hover:shadow-lg transition duration-300 overflow-hidden cursor-pointer">
                                    <img
                                        src={
                                            book.formats["image/jpeg"]
                                                ? book.formats["image/jpeg"]
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
                                        {book.authors?.[0] && (
                                            <p className="text-gray-600 text-sm mt-1">
                                                {typeof book.authors[0] === "string"
                                                    ? book.authors[0]
                                                    : book.authors[0].name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full text-center text-gray-600">
                            No books found. Try a different search.
                        </div>
                    )}
                </div>
            )}
            </div>
            </DashboardLayout>
    );
}
