import { getBlogById } from '@/actions/blogActions'
import Header from '@/components/Header'
import Link from 'next/link'
import Image from 'next/image'
import React from 'react'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Share2,
  Bookmark,
  Heart,
} from 'lucide-react'

// Try static generation instead of ISR
export const revalidate = 300

const page = async ({ params }) => {
  const { id } = await params

  try {
    console.log(
      `🔄 Fetching blog with ID: ${id} at ${new Date().toISOString()}`,
    )
    const response = await getBlogById(id)
    console.log(`✅ Got blog response for ID: ${id}`)

    if (!response.blog) {
      throw new Error('Blog not found')
    }

    const blog = response.blog
    const publishedDate = blog.publishedDate
      ? new Date(blog.publishedDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null

    // Estimate reading time (average 200 words per minute)
    const wordCount = blog.content
      ? blog.content.replace(/<[^>]*>/g, '').split(/\s+/).length
      : 0
    const readingTime = Math.max(1, Math.ceil(wordCount / 200))

    return (
      <div className='min-h-screen bg-background'>
        {/* Navigation Bar */}
        {/* <nav className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 z-50">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link 
              href="/blogs" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="font-medium">All Posts</span>
            </Link>
            
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200">
                <Heart className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                <Bookmark className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors duration-200">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </nav> */}

        <main className='max-w-4xl mx-auto px-6 py-12'>
          {/* Article Header */}
          <header className='mb-12'>
            <div className='mb-8'>
              <h1 className='text-5xl text-center md:text-6xl font-bold text-foreground leading-tight mb-6'>
                {blog.title}
              </h1>

              {/* Meta Information */}
              <div className='flex justify-center flex-wrap items-center gap-6 text-muted-foreground text-sm'>
                <div className='flex items-center gap-2'>
                  <div className='w-10 h-10 bg-gradient-to-br from-[#2b6992] to-[#827081] text-white rounded-full flex items-center justify-center text-lg font-semibold'>
                    {blog.author?.name?.charAt(0).toUpperCase() || 'Q'}
                  </div>
                  <div>
                    <p className='font-medium text-foreground'>
                      {blog.author?.name || 'Anonymous Author'}
                    </p>
                    <p className='text-xs text-muted-foreground'>Author</p>
                  </div>
                </div>

                <div className='h-4 w-px bg-border'></div>

                {publishedDate && (
                  <div className='flex items-center gap-2'>
                    <Calendar className='w-4 h-4' />
                    <span>{publishedDate}</span>
                  </div>
                )}

                <div className='flex items-center gap-2'>
                  <Clock className='w-4 h-4' />
                  <span>{readingTime} min read</span>
                </div>
              </div>
            </div>

            {/* Featured Image */}
            {blog.image && (
              <div className='mb-12 rounded-md overflow-hidden bg-muted'>
                <Image
                  src={blog.image}
                  alt={blog.title}
                  width={1200}
                  height={600}
                  className='w-full h-96 object-cover'
                  priority
                />
              </div>
            )}
          </header>

          {/* Article Content */}
          <article className='prose prose-lg prose-gray dark:prose-invert max-w-none mb-16'>
            <div dangerouslySetInnerHTML={{ __html: blog.content || '' }} />
          </article>

          {/* Article Footer */}
          <footer className='border-t border-border pt-12'>
            {/* Author Card */}
            {blog.author && (
              <div className='bg-muted rounded-2xl p-8 mb-12'>
                <div className='flex items-start gap-6'>
                  <div className='w-20 h-20 bg-gradient-to-br from-[#2b6992] to-[#827081] text-white rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0'>
                    {blog.author.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className='flex-grow'>
                    <h3 className='text-2xl font-bold text-foreground mb-2'>
                      {blog.author.name || 'Anonymous Author'}
                    </h3>
                    <p className='text-muted-foreground mb-4'>
                      Passionate writer at Quill, sharing insights and stories
                      that matter.
                    </p>
                    <div className='flex gap-3'>
                      <button className='px-4 py-2 bg-background text-foreground rounded-lg border border-border hover:bg-muted transition-colors duration-200 text-sm font-medium'>
                        Follow
                      </button>
                      <button className='px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors duration-200 text-sm font-medium'>
                        View Profile
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className='flex flex-col sm:flex-row items-center justify-between gap-6'>
              <Link
                href='/blogs'
                className='inline-flex items-center gap-3 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-colors duration-200 font-semibold'>
                <ArrowLeft className='w-5 h-5' />
                Back to All Posts
              </Link>

              <div className='flex items-center gap-3'>
                <span className='text-muted-foreground text-sm'>
                  Share this article:
                </span>
                <div className='flex gap-2'>
                  <button className='w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center transition-colors duration-200'>
                    <Share2 className='w-4 h-4' />
                  </button>
                  <button className='w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center transition-colors duration-200'>
                    <Heart className='w-4 h-4' />
                  </button>
                  <button className='w-10 h-10 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center justify-center transition-colors duration-200'>
                    <Bookmark className='w-4 h-4' />
                  </button>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    )
  } catch (error) {
    console.error(`Error fetching blog ${id}:`, error)
    return (
      <div className='min-h-screen bg-background'>
        <Header />

        <div className='flex items-center justify-center min-h-[70vh] px-6'>
          <div className='max-w-lg text-center'>
            <div className='w-32 h-32 mx-auto mb-8 bg-muted rounded-full flex items-center justify-center'>
              <svg
                className='w-16 h-16 text-muted-foreground'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1.5}
                  d='M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
            </div>

            <h1 className='text-3xl font-bold text-foreground mb-4'>
              Article Not Found
            </h1>
            <p className='text-muted-foreground mb-8 leading-relaxed'>
              The article you&apos;re looking for doesn&apos;t exist or may have
              been moved. Let&apos;s get you back to our collection of great
              content.
            </p>

            <Link
              href='/blogs'
              className='inline-flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-colors duration-200 font-semibold'>
              <ArrowLeft className='w-5 h-5' />
              Browse All Articles
            </Link>
          </div>
        </div>
      </div>
    )
  }
}

export default page
