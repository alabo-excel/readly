'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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

const CategoryPage = () => {
    const params = useParams();
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchBooks = async (pageNum: number) => {
        try {
            setLoading(true);
            const category = decodeURIComponent(params.category as string);
            const url = `https://gutendex.com/books?topic=${encodeURIComponent(category)}&languages=en&mime_type=text%2Fplain&page=${pageNum}`;
            
            const res = await axios.get(url);
            const gutenbergBooks = res.data.results || [];
            
            const formattedBooks = gutenbergBooks.map((item: any) => ({
                id: item.id.toString(),
                title: item.title,
                authors: item.authors || ["Unknown"],
                formats: item.formats,
            }));

            if (pageNum === 1) {
                setBooks(formattedBooks);
            } else {
                setBooks(prev => [...prev, ...formattedBooks]);
            }

            setHasMore(!!res.data.next);
            setPage(pageNum);
        } catch (error) {
            console.error("Error fetching books:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooks(1);
    }, [params.category]);

    return (
        <DashboardLayout>
            <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-semibold">
                        {decodeURIComponent(params.category as string)}
                    </h1>
                    <Link 
                        href="/discover" 
                        className="text-blue-600 hover:text-blue-800"
                    >
                        Back to Discover
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {books.map((book) => (
                        <Link key={book.id} href={`/discover/${book.id}`}>
                            <div className="bg-black rounded-xl shadow hover:shadow-lg transition duration-300 overflow-hidden cursor-pointer h-full">
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
                                    <h2 className="font-medium text-white text-lg line-clamp-2">{book.title}</h2>
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
                    ))}
                </div>

                {loading && (
                    <div className="flex items-center justify-center h-32">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {!loading && hasMore && (
                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={() => fetchBooks(page + 1)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Load More Books
                        </button>
                    </div>
                )}

                {!loading && books.length === 0 && (
                    <div className="text-center text-gray-600 py-12">
                        No books found in this category.
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default CategoryPage;