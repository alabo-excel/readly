
"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
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
export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        // Fetch public domain books from Gutendex (Project Gutenberg)
        const res = await axios.get(
          `https://gutendex.com/books?topic=history&languages=en&mime_type=text%2Fplain&limit=20`
        );
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
  }, []);
  if (loading) {
    return <div className="p-8 text-lg text-gray-600">Loading books...</div>;
  }
  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold mb-6">📚 Public Domain Books (Project Gutenberg)</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
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
                    // Fallback to placeholder if the image fails to load
                    e.currentTarget.src = "https://via.placeholder.com/150x220?text=No+Cover";
                  }}
                />
                <div className="p-4">
                  <h2 className="font-medium text-lg line-clamp-2">{book.title}</h2>
                  {book.authors?.[0] && (
                    <p className="text-gray-600 text-sm mt-1">
                      {typeof book.authors[0] === "string"
                        ? book.authors[0]
                        : book.authors[0].name}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Full Text</p>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-600">
            No books found. Try a different query.
          </div>
        )}
      </div>
    </div>
  );
}