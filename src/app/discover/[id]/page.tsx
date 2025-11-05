"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabaseClient";

export default function BookPage() {
    const { id } = useParams();
    const [book, setBook] = useState<any>(null);
    const [content, setContent] = useState<string>("Loading content...");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [addingToLibrary, setAddingToLibrary] = useState(false);
    const [addedToLibrary, setAddedToLibrary] = useState(false);

    useEffect(() => {
        const fetchBook = async () => {
            if (!id) return;
            try {
                setLoading(true);
                // 1. Fetch book metadata from Gutendex
                const res = await axios.get(`https://gutendex.com/books/${id}`);
                const data = res.data;
                setBook(data);

                // 2. Fetch the full text via proxy
                // const textUrl = data.formats["text/plain; charset=us-ascii"];
                // if (!textUrl) {
                //     setError("No plain text available for this book.");
                //     return;
                // }
                // const proxyUrl = `/api/proxy-gutenberg-text?url=${encodeURIComponent(textUrl)}`;
                // const textRes = await axios.get(proxyUrl);
                // // Remove Gutenberg boilerplate (header/footer)
                // let text = textRes.data;

                // // Try to extract between Gutenberg markers first
                // const startMarker = /\*\*\* START OF (THE|THIS) PROJECT GUTENBERG EBOOK[\s\S]*?\*\*\*/i;
                // const endMarker = /\*\*\* END OF (THE|THIS) PROJECT GUTENBERG EBOOK[\s\S]*?\*\*\*/i;

                // const startIndex = text.search(startMarker);
                // const endIndex = text.search(endMarker);

                // if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
                //     text = text.slice(startIndex, endIndex)
                //         .replace(startMarker, "")
                //         .replace(endMarker, "");
                // } else {
                //     // fallback to your existing logic
                //     text = text.replace(/^[\s\S]*?(?=CHAPTER|INTRODUCTION)/i, "");
                //     text = text.replace(/THE END.*$/i, "");
                // }

                // // Optional cleanup
                // text = text.replace(/\r?\n{2,}/g, "\n\n").trim();

                // setContent(text);
            } catch (err) {
                console.error("Error fetching book:", err);
                setError("Failed to load book content. Please try another book.");
            } finally {
                setLoading(false);
            }
        };
        fetchBook();
    }, [id]);

    const addBookToLibrary = async () => {
        try {
            setAddingToLibrary(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setError("You must be logged in to add books to your library");
                return;
            }

            // Store book in local storage
            const bookData = {
                book_id: id,
                title: book.title,
                author: book.authors?.[0]?.name || "Unknown",
                cover_image: book.formats["image/jpeg"] || null,
                gutenberg_url: book.formats["text/plain; charset=us-ascii"] || null,
                added_at: new Date().toISOString()
            };

            // Get existing library from localStorage
            const libraryKey = `library_${user.id}`;
            const existingLibrary = localStorage.getItem(libraryKey);
            const library = existingLibrary ? JSON.parse(existingLibrary) : [];

            // Check if book already exists
            const bookExists = library.some((b: any) => b.book_id === id);
            if (bookExists) {
                setError("This book is already in your library");
                return;
            }

            // Add book to library
            library.push(bookData);
            localStorage.setItem(libraryKey, JSON.stringify(library));

            setAddedToLibrary(true);
            // Show success message for 2 seconds
            setTimeout(() => setAddedToLibrary(false), 2000);
        } catch (err) {
            console.error("Error:", err);
            setError("An error occurred while adding the book");
        } finally {
            setAddingToLibrary(false);
        }
    };

    if (loading)
        return <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading...</p>
            </div>
        </div>;

    if (error)
        return <div className="p-8 text-red-500">{error}</div>;

    if (!book)
        return <div className="p-8 text-red-500">Book not found or unavailable.</div>;

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto p-8">
                {/* Header */}
                <div className="">
                    <img
                        src={
                            book.formats["image/jpeg"]
                                ? book.formats["image/jpeg"]
                                : "https://via.placeholder.com/150x220?text=No+Cover"
                        } alt={book.title}
                        className="object-cover w-full rounded-lg shadow"
                    />
                    <div className="mt-4">
                        <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
                        {book.authors?.[0] && (
                            <p className="text-gray-600 mb-4">
                                by {book.authors[0].name}
                            </p>
                        )}
                        {book.subjects && (
                            <p className="text-gray-700 italic mb-4">
                                {book.subjects.join(", ")}
                            </p>
                        )}
                        <button
                            onClick={addBookToLibrary}
                            disabled={addingToLibrary || addedToLibrary}
                            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${addedToLibrary
                                ? 'bg-green-600 text-white'
                                : 'bg-blue-500 text-white hover:bg-blue-700 disabled:bg-gray-400'
                                }`}
                        >
                            {addingToLibrary ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Adding...
                                </>
                            ) : addedToLibrary ? (
                                <>
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Added to Library
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add to Library
                                </>
                            )}
                        </button>
                    </div>

                    <div className="mt-6">
                        <h2 className="text-2xl font-semibold mb-4">Summary</h2>
                        <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                            {book.summaries
                                ? book.summaries[0]
                                : "No summary available for this book."}
                        </div>
                    </div>
                </div>
                {/* Book content */}
                {/* <div className="mt-10 bg-white p-6 rounded-xl shadow-inner prose max-w-none">
                <h2 className="text-2xl font-semibold mb-4">Book Content</h2>
                <pre className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {content}
                </pre>
            </div> */}
            </div>
        </DashboardLayout>
    );
}
