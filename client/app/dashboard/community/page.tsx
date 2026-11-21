'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch, apiFetchRaw, ApiError } from '@/lib/api';
import { MessageCircle, Plus, Search, ThumbsUp, X } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';

interface Reply {
  authorName: string;
  content: string;
  upvotes: number;
  createdAt: string;
}

interface Post {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  authorName: string;
  authorCollege?: string;
  upvotes: number;
  replies: Reply[];
  createdAt: string;
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [posting, setPosting] = useState(false);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [error, setError] = useState('');

  const fetchPosts = async (q = '') => {
    try {
      const data = await apiFetch<{ posts: Post[] }>(
        q ? `/community/posts?search=${encodeURIComponent(q)}` : '/community/posts',
      );
      setPosts(data.posts ?? []);
      setError('');
    } catch (err) {
      setPosts([]);
      setError(err instanceof ApiError ? err.message : 'Could not load discussions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchPosts(search);
  };

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim() || posting) return;
    setPosting(true);

    try {
      const res = await apiFetchRaw('/community/posts', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          tags: newTags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      });

      if (res.ok) {
        setNewTitle('');
        setNewContent('');
        setNewTags('');
        setShowNew(false);
        fetchPosts();
      } else {
        setError('Could not publish your discussion.');
      }
    } catch {
      setError('Could not publish your discussion.');
    } finally {
      setPosting(false);
    }
  };

  const handleReply = async (postId: string) => {
    if (!replyText.trim() || replying) return;
    setReplying(true);

    try {
      const res = await apiFetchRaw(`/community/posts/${postId}/replies`, {
        method: 'POST',
        body: JSON.stringify({ content: replyText }),
      });
      if (res.ok) {
        setReplyText('');
        fetchPosts();
      } else {
        setError('Could not post your answer.');
      }
    } catch {
      setError('Could not post your answer.');
    } finally {
      setReplying(false);
    }
  };

  const handleUpvote = async (postId: string) => {
    try {
      await apiFetchRaw(`/community/posts/${postId}/upvote`, { method: 'POST' });
      fetchPosts();
    } catch {
      console.error('Failed to upvote');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-7">
        <PageHeader
          eyebrow="Community"
          title="Discussions"
          description="Ask questions, share decisions and read how other students solved the same problem."
          actions={
            <Button type="button" onClick={() => setShowNew((open) => !open)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              New discussion
            </Button>
          }
        />

        <form onSubmit={handleSearch} className="flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
              aria-hidden="true"
            />
            <label htmlFor="community-search" className="sr-only">
              Search discussions
            </label>
            <input
              id="community-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics, tags or keywords…"
              className="h-11 w-full rounded-control border border-ink/15 bg-ivory-warm/60 pl-9 pr-3 text-[13.5px] text-ink placeholder:text-ink-faint focus:border-forest/60 focus:bg-ivory-warm focus:outline-none focus:ring-2 focus:ring-forest/15"
            />
          </div>
          <Button type="submit" variant="secondary" className="sm:w-28">
            Search
          </Button>
        </form>

        {error ? (
          <div
            role="alert"
            className="rounded-card border border-[var(--color-danger)]/30 bg-[var(--color-danger-tint)] px-4 py-3 text-[13px] text-[var(--color-danger)]"
          >
            {error}
          </div>
        ) : null}

        {showNew ? (
          <Card tone="strong" className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-[19px] tracking-[-0.01em] text-ink">Start a discussion</h2>
                <p className="mt-1 text-[12.5px] text-ink-muted">
                  Specific titles and a little context get better answers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNew(false)}
                aria-label="Close new discussion form"
                className="inline-flex h-9 w-9 items-center justify-center rounded-control text-ink-muted hover:bg-ink/[0.06]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <label htmlFor="post-title" className="sr-only">
                Title
              </label>
              <input
                id="post-title"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Discussion title"
                className="control h-11"
              />
              <label htmlFor="post-content" className="sr-only">
                Content
              </label>
              <textarea
                id="post-content"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Share your question or the decision you are weighing…"
                rows={4}
                className="control min-h-[110px] resize-y"
              />
              <label htmlFor="post-tags" className="sr-only">
                Tags
              </label>
              <input
                id="post-tags"
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="Tags, comma separated: JavaScript, React, security"
                className="control h-11"
              />
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                type="button"
                onClick={handleCreatePost}
                disabled={posting || !newTitle.trim() || !newContent.trim()}
              >
                {posting ? 'Publishing…' : 'Publish discussion'}
              </Button>
            </div>
          </Card>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-32 animate-pulse rounded-card bg-ink/[0.06]" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No discussions yet"
            description="Be the first to start a conversation."
            action={
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowNew(true)}>
                Start a discussion
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post._id} className="overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="font-serif text-[19px] leading-snug tracking-[-0.015em] text-ink">
                      {post.title}
                    </h2>
                    <button
                      type="button"
                      onClick={() => handleUpvote(post._id)}
                      aria-label={`Upvote ${post.title}`}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-ink/15 px-2.5 py-1 font-mono text-[11px] text-ink-soft transition-colors hover:border-forest/40 hover:text-forest"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
                      {post.upvotes}
                    </button>
                  </div>

                  <p className="mt-2.5 text-[13px] leading-relaxed text-ink-muted">{post.content}</p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {post.tags.map((tag) => (
                        <Badge key={tag} tone="outline">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 text-[12px]">
                      <span className="font-medium text-ink-soft">{post.authorName}</span>
                      <button
                        type="button"
                        onClick={() => setExpandedPost(expandedPost === post._id ? null : post._id)}
                        aria-expanded={expandedPost === post._id}
                        className="inline-flex items-center gap-1.5 text-forest underline-offset-4 hover:underline"
                      >
                        <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        {post.replies.length} {post.replies.length === 1 ? 'answer' : 'answers'}
                      </button>
                    </div>
                  </div>
                </div>

                {expandedPost === post._id ? (
                  <div className="border-t border-ink/10 bg-ivory-warm/40 p-5">
                    {post.replies.length > 0 ? (
                      <ul className="space-y-3">
                        {post.replies.map((reply, index) => (
                          <li
                            key={index}
                            className="rounded-control border border-ink/10 bg-ivory-warm/70 p-3.5"
                          >
                            <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-faint">
                              {reply.authorName}
                            </span>
                            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">
                              {reply.content}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[12.5px] text-ink-faint">No answers yet.</p>
                    )}

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <label htmlFor={`reply-${post._id}`} className="sr-only">
                        Write an answer
                      </label>
                      <input
                        id={`reply-${post._id}`}
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your answer…"
                        className="control h-10"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleReply(post._id)}
                        disabled={replying || !replyText.trim()}
                        className="sm:h-10 sm:px-5"
                      >
                        {replying ? 'Posting…' : 'Reply'}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
