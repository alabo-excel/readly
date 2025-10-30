"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import DashboardLayout from "@/components/DashboardLayout";

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

    if (loading)
        return <div className="p-8 text-gray-600 text-lg">Loading book...</div>;

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
