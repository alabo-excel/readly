"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";

export default function BookPage() {
    const { id } = useParams();
    const [book, setBook] = useState<any>(null);
    const [content, setContent] = useState<string>("Loading content...");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                const textUrl = data.formats["text/plain; charset=us-ascii"];
                if (!textUrl) {
                    setError("No plain text available for this book.");
                    return;
                }
                const proxyUrl = `/api/proxy-gutenberg-text?url=${encodeURIComponent(textUrl)}`;
                const textRes = await axios.get(proxyUrl);
                // Remove Gutenberg boilerplate (header/footer)
                let text = textRes.data;
                // text = text.replace(/^[\s\S]*?(?=CHAPTER|THE END|INTRODUCTION)/i, "");
                // text = text.replace(/THE END.*$/i, "");


                setContent(text);
            } catch (err) {
                console.error("Error fetching book:", err);
                setError("Failed to load book content. Please try another book.");
            } finally {
                setLoading(false);
            }
        };
        fetchBook();
    }, [id]);

    if (loading)
        return <div className="p-8 text-gray-600 text-lg">Loading book...</div>;

    if (error)
        return <div className="p-8 text-red-500">{error}</div>;

    if (!book)
        return <div className="p-8 text-red-500">Book not found or unavailable.</div>;

    return (
        <div className="max-w-4xl mx-auto p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-6">
                <img
                    src={
                        book.formats["image/jpeg"]
                            ? book.formats["image/jpeg"]
                            : "https://via.placeholder.com/150x220?text=No+Cover"
                    } alt={book.title}
                    className="w-48 h-64 object-cover rounded-lg shadow"
                />
                <div>
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
                </div>
            </div>
            {/* Book content */}
            <div className="mt-10 bg-white p-6 rounded-xl shadow-inner prose max-w-none">
                <h2 className="text-2xl font-semibold mb-4">Book Content</h2>
                <pre className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {content}
                </pre>
            </div>
        </div>
    );
}
