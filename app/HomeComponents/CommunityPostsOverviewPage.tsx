/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import React, { useState } from "react";
import {
  X,
  MessageSquare,
  Heart,
  Archive,
  Trash2,
  Search,
  Eye,
  ThumbsUp,
  Loader2,
  User,
} from "lucide-react";
import { Post, Comment, Like } from "../services/types";
import { getRelativeTime } from "../services/apis";
import { communityApi } from "../services/apis_estates";
import AuditLogsPage from "./AuditLogs";

interface CommunityPostsOverviewPageProps {
  posts: Post[];
  estate_id:string;
  estatename: string;
  onBack?: () => void;
}

export default function CommunityPostsOverviewPage({
  posts: initialPosts,
  estate_id,
  estatename,
  onBack,
}: CommunityPostsOverviewPageProps) {
  // Feed Layout & Data Matrix States
  const [postsList, setPostsList] = useState<Post[]>(initialPosts);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [viewAllLogs, setViewAllLogs] = useState(false);

  // Expanded Detailed Inspection Sub-tabs
  const [activeInspectionTab, setActiveInspectionTab] = useState<
    "comments" | "likes"
  >("comments");

  // State behavior for sub-data streams
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [loadingSubData, setLoadingSubData] = useState(false);

  // Filter Pipeline Engine
  const filteredPosts = postsList.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const postIsArchived = !!post.is_archived;
    return matchesSearch && postIsArchived === showArchived;
  });

  const handleInspectPost = async (post: Post) => {
    setSelectedPost(post);
    setActiveInspectionTab("comments");
    setLoadingSubData(true);

    setComments([]);
    setLikes([]);

    try {
      const [commentsData, likesData] = await Promise.all([
        communityApi.getComments(post.id),
        communityApi.getLikes(post.id),
      ]);

      setComments(commentsData || []);
      setLikes(likesData || []);
    } catch (err) {
      console.error(
        "Failed to compile transactional metadata collections:",
        err,
      );
    } finally {
      setLoadingSubData(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm("Are you sure you want to remove this comment?"))
      return;

    const previousComments = [...comments];
    const previousPosts = [...postsList];

    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setPostsList((prev) =>
      prev.map((p) =>
        p.id === selectedPost?.id
          ? { ...p, comments_count: Math.max(0, p.comments_count - 1) }
          : p,
      ),
    );

    if (selectedPost) {
      setSelectedPost({
        ...selectedPost,
        comments_count: Math.max(0, selectedPost.comments_count - 1),
      });
    }

    try {
      const response = await communityApi.deleteComment(commentId.toString());
      if (!response.success && !response) throw new Error("Failed");
    } catch (error) {
      console.error("Delete Comment Error:", error);
      alert("Could not delete comment. Reverting...");
      setComments(previousComments);
      setPostsList(previousPosts);
    }
  };

  const handleArchivePost = async (postId: string) => {
    const actionLabel = showArchived ? "Unarchive" : "Archive";
    const confirmed = window.confirm(
      `${actionLabel} Post\nAre you sure you want to change this post's visibility status?`,
    );

    if (!confirmed) return;

    try {
      const response = await communityApi.archivePost(postId.toString());
      if (response.success || response) {
        alert(`Post ${actionLabel.toLowerCase()}d successfully.`);

        setPostsList((prevPosts) =>
          prevPosts.map((p) =>
            p.id === postId ? { ...p, is_archived: !showArchived } : p,
          ),
        );

        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost(null);
        }
      }
    } catch (err) {
      console.error("Archive UI handler failure:", err);
      alert("Could not complete archiving action.");
    }
  };

  const handleDelete = async (postId: string) => {
    const confirmed = window.confirm(
      "Delete Post\nAre you sure you want to remove this post permanently?",
    );

    if (confirmed) {
      try {
        const response = await communityApi.deletePost(postId.toString());
        if (response.success || response) {
          setPostsList((prevPosts) => prevPosts.filter((p) => p.id !== postId));
          if (selectedPost && selectedPost.id === postId) {
            setSelectedPost(null);
          }
          alert("Post deleted successfully.");
        }
      } catch (error: any) {
        console.error("Delete Error:", error);
        alert("Could not delete post. Please try again.");
      }
    }
  };

  if (viewAllLogs) {
    return (
      <AuditLogsPage
        estate_id={estate_id}
        name={`${estatename?.toUpperCase() || "UNKNOWN ESTATE"}`}
        all={true}
        type="posts"
        onBack={() => setViewAllLogs(false)}
      />
    );
  }


  return (
    <div className="p-4 sm:p-6 bg-slate-50 animate-fadeIn">
      <div className="mx-auto space-y-6">
        {/* Navigation Action Header */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex  flex-col items-start">
            {onBack && (
              <button
                onClick={onBack}
                className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl transition-all"
              >
                ← Back to Control Desk
              </button>
            )}
            <div className="space-y-0.5">
              <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase font-montserrat">
                Community Postings Registry
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">
                  System Scope:
                </span>
                <span className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700">
                  {estatename}
                </span>
              </div>
            </div>
          </div>
          <div>
            <button
              onClick={() => setViewAllLogs(true)}
              // disabled={isMutating}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm bg-gray-200`}
            >
              View Logs History
            </button>
          </div>
        </div>

        {/* Search Filter Box */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="relative w-full md:max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Query titles or content structures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-indigo-500 outline-none font-medium transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={() => setShowArchived(false)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${!showArchived ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:text-slate-800"}`}
            >
              Active Feed
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${showArchived ? "bg-amber-600 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:text-slate-800"}`}
            >
              <Archive size={14} />
              Archived Vault
            </button>
          </div>
        </div>

        {/* Data Grid Matrix Layout */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex-1 min-h-0">
          <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 z-10 shadow-[0_1px_0_0_rgba(241,245,249,1)]">
                <tr className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  <th className="p-4">Post</th>
                  <th className="p-4">Publisher</th>
                  <th className="p-4">Engagement</th>
                  <th className="p-4">Entry Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredPosts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center italic text-slate-400 bg-white"
                    >
                      No document references found matching the defined
                      dashboard scope filters.
                    </td>
                  </tr>
                ) : (
                  filteredPosts.map((post) => (
                    <tr
                      key={post.id}
                      className="hover:bg-slate-50/30 transition-colors"
                    >
                      <td className="p-4 max-w-sm">
                        <div className="flex items-center gap-3">
                          <div className="truncate min-w-0">
                            <p className="font-bold text-slate-900 truncate block">
                              {post.title}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate block mt-0.5">
                              {post.content}
                            </p>
                          </div>
                          {post.image_url && (
                            <img
                              src={post.image_url}
                              alt=""
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0 bg-slate-100"
                            />
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800">
                            {post.author_name || "Admin Pool"}
                          </p>
                          <p className="text-[10px] text-indigo-600 uppercase font-bold tracking-wider">
                            {post.author_role || "ADMIN"}
                          </p>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
                          <span
                            className="flex items-center gap-1.5"
                            title="Total Reactions"
                          >
                            <Heart
                              size={13}
                              className="text-rose-500 fill-rose-500/20"
                            />
                            <strong className="text-slate-800 font-black">
                              {post.likes_count ?? 0}
                            </strong>
                          </span>
                          <span
                            className="flex items-center gap-1.5"
                            title="Comments Logged"
                          >
                            <MessageSquare
                              size={13}
                              className="text-indigo-500"
                            />
                            <strong className="text-slate-800 font-black">
                              {post.comments_count ?? 0}
                            </strong>
                          </span>
                        </div>
                      </td>

                      <td className="p-4 font-mono text-[11px] text-slate-400">
                        {new Date(post.created_at).toLocaleDateString("en-GB")}
                        <span className="block text-[10px] text-slate-300">
                          {getRelativeTime(post.created_at)}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleInspectPost(post)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all inline-flex items-center gap-1"
                          >
                            <Eye size={13} />
                            <span>View Post</span>
                          </button>

                          <button
                            onClick={() =>
                              handleArchivePost(post.id.toString())
                            }
                            className="p-2 hover:bg-slate-100 text-slate-400 hover:text-amber-600 rounded-lg transition-all"
                            title="Toggle Archive Status"
                          >
                            <Archive size={14} />
                          </button>

                          <button
                            onClick={() => handleDelete(post.id.toString())}
                            className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                            title="Purge Document Entry"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Slide-over Inspection Panel Drawer Container */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            onClick={() => setSelectedPost(null)}
            className="absolute inset-0 cursor-pointer"
          />
          <div className="relative w-full max-w-lg h-full bg-white shadow-2xl p-6 overflow-y-auto flex flex-col justify-between border-l border-slate-100 animate-in slide-in-from-right duration-200">
            <div className="space-y-6 min-w-0">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider font-montserrat">
                    Document Node Context
                  </h2>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Reference Index Code: {selectedPost.id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Main Content Layout Block Inside Drawer */}
              <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase">
                  {selectedPost.category || "General Content"}
                </span>
                <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                  {selectedPost.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                  {selectedPost.content}
                </p>

                {selectedPost.image_url && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-slate-200">
                    <img
                      src={selectedPost.image_url}
                      alt=""
                      className="w-full max-h-48 object-cover"
                    />
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <User size={11} className="text-slate-400" />
                    By:{" "}
                    <strong>
                      {selectedPost.author_name} ({selectedPost.author_role})
                    </strong>
                  </span>
                  <span className="font-mono">
                    {new Date(selectedPost.created_at).toLocaleString("en-GB")}
                  </span>
                </div>
              </div>

              {/* Sub-Tabs Selector Bar Component */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/40">
                <button
                  onClick={() => setActiveInspectionTab("comments")}
                  className={`flex-1 py-2 rounded-lg font-montserrat font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${activeInspectionTab === "comments" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <span>Comments ({comments.length})</span>
                </button>
                <button
                  onClick={() => setActiveInspectionTab("likes")}
                  className={`flex-1 py-2 rounded-lg font-montserrat font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${activeInspectionTab === "likes" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <span>Likes ({likes.length})</span>
                </button>
              </div>

              {/* Tab Frame Dynamic View Stream Renderer */}
              <div className="space-y-3 min-h-[200px]">
                {loadingSubData ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2
                      size={20}
                      className="text-indigo-600 animate-spin"
                    />
                    <p className="text-slate-400 text-xs mt-1.5 font-medium">
                      Compiling dynamic logs context pool...
                    </p>
                  </div>
                ) : activeInspectionTab === "likes" ? (
                  /* LIKES MATRIX STREAM */
                  <div className="space-y-2">
                    {likes.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/40 text-slate-400 text-xs font-medium">
                        No real-time reactions registered on this post node.
                      </div>
                    ) : (
                      likes.map((like, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-3xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 font-bold shrink-0 text-xs">
                              {like.author_name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">
                                {like.author_name}
                              </p>
                            </div>
                          </div>
                          <ThumbsUp
                            size={12}
                            className="text-rose-500 fill-rose-500/10 mr-1"
                          />
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  /* COMMENTS TIMELINE INDEX STREAM WITH DELETION INTERFACE */
                  <div className="space-y-3">
                    {comments.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/40 text-slate-400 text-xs font-medium">
                        No community feedback comments logged on this thread.
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-3xs space-y-1 relative group"
                        >
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-bold text-indigo-600">
                              {comment.author_name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 font-mono text-[10px]">
                                {getRelativeTime(comment.created_at)}
                              </span>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-slate-300 hover:text-rose-600 p-0.5 rounded transition-colors"
                                title="Delete Comment"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed font-medium wrap-break-word pr-4">
                            {comment.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
