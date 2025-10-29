import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    try {
        const response = await fetch(url);
        const text = await response.text();
        return new NextResponse(text, {
            headers: {
                "Content-Type": "text/plain",
            },
        });
    } catch (error) {
        console.error("Error fetching Gutenberg text:", error);
        return NextResponse.json({ error: "Failed to fetch text" }, { status: 500 });
    }
}
