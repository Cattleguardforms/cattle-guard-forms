import { NextRequest, NextResponse } from "next/server";
import { deleteMarketingBlogPost, updateMarketingBlogPost, type MarketingBlogInput } from "@/lib/marketing/blog-posts";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as Partial<MarketingBlogInput> & { status?: string };
    const post = await updateMarketingBlogPost(id, body);
    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update blog post." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteMarketingBlogPost(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete blog post." },
      { status: 500 }
    );
  }
}
