import { NextRequest, NextResponse } from "next/server";
import { createMarketingBlogPost, getMarketingBlogPosts, type MarketingBlogInput } from "@/lib/marketing/blog-posts";

type BlogPostRequest = MarketingBlogInput;

export async function GET() {
  try {
    const posts = await getMarketingBlogPosts();
    return NextResponse.json({ posts });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load blog posts." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BlogPostRequest;
    const post = await createMarketingBlogPost(body);
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create blog post." },
      { status: 500 }
    );
  }
}
