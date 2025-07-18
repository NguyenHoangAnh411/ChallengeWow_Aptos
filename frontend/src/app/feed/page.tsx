"use client";
import { useEffect, useState, useRef } from "react";
import { userPostApi, loginUser } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import Header from "@/components/header";
import { Pencil, Hash, Image, Video, User, Gamepad2, Star } from "lucide-react";
import { useGameState } from "@/lib/game-state";

// Type cho bài đăng
interface UserPost {
  id: string;
  wallet_id: string;
  username?: string;
  content?: string;
  image_url?: string;
  video_url?: string;
  created_at?: string;
  hashtag?: string;
  like_count?: number;
  comment_count?: number;
  is_liked?: boolean;
  is_commented?: boolean;
  is_deleted?: boolean;
  is_hidden?: boolean;
}

const HASHTAGS = [
  "blockchain",
  "quiz",
  "game",
  "web3",
  "challenge",
  "aptos",
  "olym3",
  "solana",
  "trivia",
  "community"
];

const RECOMMENDED_USERS = [
  { name: "Junebu", icon: <User className="w-6 h-6 text-yellow-400" /> },
  { name: "CryptoQuizzer", icon: <User className="w-6 h-6 text-blue-400" /> },
  { name: "Web3Master", icon: <User className="w-6 h-6 text-green-400" /> },
];

const GAME_WIDGETS = [
  { name: "Leaderboard", icon: <Star className="w-5 h-5 text-purple-500" /> },
  { name: "Play Quiz", icon: <Gamepad2 className="w-5 h-5 text-blue-500" /> },
  { name: "My Stats", icon: <User className="w-5 h-5 text-green-500" /> },
];

export default function FeedPage() {
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [postType, setPostType] = useState<"text" | "image" | "video">("text");
  const [hashtag, setHashtag] = useState<string>("");
  const currentUser = useGameState(state => state.currentUser);

  // Like/unlike handler
  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!currentUser?.walletId) return;
    // Optimistic update
    setPosts(prev => prev.map(post =>
      post.id === postId
        ? { ...post, is_liked: isLiked, like_count: (post.like_count || 0) + (isLiked ? 1 : -1) }
        : post
    ));
    try {
      await userPostApi.likePost(postId, currentUser.walletId, isLiked);
    } catch (e) {
      // Nếu lỗi, revert lại
      setPosts(prev => prev.map(post =>
        post.id === postId
          ? { ...post, is_liked: !isLiked, like_count: (post.like_count || 0) + (isLiked ? -1 : 1) }
          : post
      ));
    }
  };

  // Restore openPostModal
  const openPostModal = (type: "text" | "image" | "video") => {
    setPostType(type);
    setOpen(true);
  };

  // Lấy danh sách bài đăng
  useEffect(() => {
    userPostApi.getAllPosts(20, 0)
      .then(setPosts)
      .finally(() => setLoading(false));

    // Kết nối WebSocket feed
    const wsBase = process.env.NEXT_PUBLIC_WS_BASE || "ws://localhost:9000";
    const wsUrl = wsBase.replace(/\/$/, "") + "/ws/feed";
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_post" && data.payload) {
          setPosts(prev => [data.payload, ...prev]);
        }
        if (data.type === "like_post" && data.payload) {
          setPosts(prev => prev.map(post =>
            post.id === data.payload.post_id
              ? { ...post, like_count: data.payload.like_count, is_liked: data.payload.wallet_id === currentUser?.walletId ? data.payload.is_liked : post.is_liked }
              : post
          ));
        }
      } catch (e) {
        // ignore
      }
    };
    return () => ws.close();
  }, [currentUser?.walletId]);

  // Đăng bài mới
  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content && !file) return;
    setPosting(true);
    const formData = new FormData();
    formData.append("wallet_id", currentUser?.walletId || "");
    formData.append("username", currentUser?.username || "");
    formData.append("content", content);
    if (file) formData.append("file", file);
    if (hashtag) formData.append("hashtag", hashtag);
    if (postType === "video" && file) formData.append("video_url", ""); // backend sẽ tự xử lý video_url nếu có file video
    formData.append("like_count", "0");
    formData.append("comment_count", "0");
    formData.append("is_liked", "false");
    formData.append("is_commented", "false");
    formData.append("is_deleted", "false");
    formData.append("is_hidden", "false");
    try {
      // Đảm bảo user đã tồn tại
      if (currentUser?.walletId) {
        await loginUser(currentUser.walletId);
      }
      await userPostApi.createPost(formData);
      setContent("");
      setFile(null);
      setHashtag("");
      setOpen(false);
      // Không cần reload lại feed, bài mới sẽ được thêm qua WebSocket
    } catch (err) {
      alert("Failed to post!");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#232946] to-[#1a223f] flex flex-row">
      <Header showToLanding />
      <div className="h-[calc(100vh-64px)] flex flex-row items-stretch w-full">
        {/* Left Sidebar */}
        <aside className="hidden lg:flex flex-col items-end pt-24 pl-8 pr-4 basis-1/4">
          <div className="bg-white/60 backdrop-blur-md border border-blue-200 rounded-2xl shadow-xl p-8 w-full">
            <div className="font-bold text-xl text-gray-800 mb-6 flex items-center gap-2">
              <Hash className="w-6 h-6 text-blue-500" /> Trending Hashtags
            </div>
            <div className="flex flex-col gap-4">
              {HASHTAGS.map(tag => (
                <div key={tag} className={`flex items-center gap-2 text-blue-600 font-semibold cursor-pointer hover:underline text-base ${hashtag === tag ? 'underline' : ''}`}
                  onClick={() => setHashtag(tag)}>
                  #{tag}
                </div>
              ))}
            </div>
          </div>
        </aside>
        {/* Feed Main */}
        <main className="flex-1 flex justify-center pt-20 pb-20 px-6 basis-1/2 max-w-none">
          <div className="w-full">
            {loading ? (
              <div className="text-center text-gray-400">Loading posts...</div>
            ) : (
              posts.length === 0 ? (
                <div className="text-center text-gray-500">No posts yet.</div>
              ) : (
                <div className="space-y-14">
                  {posts.map(post => (
                    <div
                      key={post.id}
                      className="relative bg-white/80 backdrop-blur-md border border-white/30 rounded-3xl shadow-2xl p-10 flex flex-col gap-6 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] transition-all duration-300 mx-auto"
                      style={{ maxWidth: 700 }}
                    >
                      {/* Avatar + User info */}
                      <div className="flex items-center gap-6 mb-2">
                        <Avatar className="w-16 h-16 border-4 border-blue-400 shadow-lg">
                          <AvatarFallback className="text-xl font-bold bg-blue-500 text-white">
                            {post.username
                              ? post.username[0].toUpperCase()
                              : (post.wallet_id ? post.wallet_id.slice(2, 4).toUpperCase() : "?")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-xl text-gray-900">
                            {post.username ? post.username : (post.wallet_id ? post.wallet_id.slice(0, 8) + "..." : "Anonymous")}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {post.created_at && new Date(post.created_at).toLocaleString()}
                          </div>
                          {post.hashtag && (
                            <div className="text-xs text-blue-600 font-semibold mt-1">#{post.hashtag}</div>
                          )}
                        </div>
                      </div>
                      {/* Content */}
                      {post.content && (
                        <div className="text-gray-800 text-lg leading-relaxed whitespace-pre-line px-1">
                          {post.content}
                        </div>
                      )}
                      {/* Image */}
                      {post.image_url && (
                        <img
                          src={post.image_url}
                          alt="Post image"
                          className="rounded-2xl border mt-2 max-h-96 object-contain mx-auto shadow-lg"
                        />
                      )}
                      {/* Video */}
                      {post.video_url && (
                        <video controls className="rounded-2xl border mt-2 max-h-96 object-contain mx-auto shadow-lg">
                          <source src={post.video_url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      )}
                      {/* Like/Comment/Status */}
                      <div className="flex gap-6 items-center mt-2">
                        <div className="text-sm text-gray-600">👍 {post.like_count ?? 0}</div>
                        <div className="text-sm text-gray-600">💬 {post.comment_count ?? 0}</div>
                        <button
                          className={`text-xs font-semibold px-2 py-1 rounded ${post.is_liked ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}
                          onClick={() => handleLike(post.id, !post.is_liked)}
                          disabled={!currentUser?.walletId}
                        >
                          {post.is_liked ? 'Unlike' : 'Like'}
                        </button>
                        {post.is_commented && <div className="text-xs text-green-500 font-semibold">Commented</div>}
                        {post.is_deleted && <div className="text-xs text-red-500 font-semibold">Deleted</div>}
                        {post.is_hidden && <div className="text-xs text-gray-400 font-semibold">Hidden</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </main>
        {/* Right Sidebar */}
        <aside className="hidden lg:flex flex-col items-start pt-24 pr-8 pl-4 basis-1/4 gap-10">
          {/* Post now box */}
          <div className="bg-white/60 backdrop-blur-md border border-blue-200 rounded-2xl shadow-xl p-8 w-full flex flex-col gap-6">
            <div className="font-bold text-xl text-gray-800 mb-4">Post now~</div>
            <div className="flex gap-6">
              <Button
                variant="outline"
                className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl hover:bg-blue-100/40"
                onClick={() => openPostModal("text")}
              >
                <Pencil className="w-6 h-6 text-blue-500" />
                <span className="text-xs font-medium">Post</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl hover:bg-blue-100/40"
                onClick={() => openPostModal("image")}
              >
                <Image className="w-6 h-6 text-green-500" />
                <span className="text-xs font-medium">Image</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl hover:bg-blue-100/40"
                onClick={() => openPostModal("video")}
              >
                <Video className="w-6 h-6 text-purple-500" />
                <span className="text-xs font-medium">Video</span>
              </Button>
            </div>
          </div>
          {/* Game widgets box */}
          <div className="bg-white/60 backdrop-blur-md border border-blue-200 rounded-2xl shadow-xl p-8 w-full flex flex-col gap-5">
            <div className="font-bold text-xl text-gray-800 mb-4">Game Widgets</div>
            <div className="grid grid-cols-2 gap-4">
              {GAME_WIDGETS.map(w => (
                <div key={w.name} className="flex items-center gap-3 bg-white/60 rounded-lg px-4 py-3 shadow hover:bg-blue-50 cursor-pointer text-base">
                  {w.icon}
                  <span className="font-medium text-gray-700">{w.name}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Recommended users box */}
          <div className="bg-white/60 backdrop-blur-md border border-blue-200 rounded-2xl shadow-xl p-8 w-full flex flex-col gap-4">
            <div className="font-bold text-xl text-gray-800 mb-4">Recommended Users</div>
            <div className="flex flex-col gap-4">
              {RECOMMENDED_USERS.map(u => (
                <div key={u.name} className="flex items-center gap-4 bg-white/60 rounded-lg px-4 py-3 shadow hover:bg-blue-50 cursor-pointer text-base">
                  {u.icon}
                  <span className="font-medium text-gray-700">{u.name}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
      {/* Post Button */}
      <Dialog open={open} onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setContent("");
          setFile(null);
          setPostType("text");
          setHashtag("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new post</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePost} className="flex flex-col gap-4">
            <textarea
              className="border rounded-xl p-3 min-h-[80px] text-base"
              placeholder="What's on your mind?"
              value={content}
              onChange={e => setContent(e.target.value)}
              required={!file}
            />
            <div className="flex flex-wrap gap-2">
              {HASHTAGS.map(tag => (
                <button
                  type="button"
                  key={tag}
                  className={`px-3 py-1 rounded-full border text-xs font-semibold ${hashtag === tag ? 'bg-blue-500 text-white' : 'bg-white text-blue-600 border-blue-300'}`}
                  onClick={() => setHashtag(tag)}
                >
                  #{tag}
                </button>
              ))}
            </div>
            {(postType === "image" || postType === "video") && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-200 border border-blue-300 shadow transition"
                  title={postType === "image" ? "Choose image" : "Choose video"}
                >
                  {postType === "image" ? (
                    <Image className="w-7 h-7 text-blue-500" />
                  ) : (
                    <Video className="w-7 h-7 text-purple-500" />
                  )}
                </button>
                <input
                  type="file"
                  accept={postType === "video" ? "video/*" : "image/*"}
                  ref={fileInputRef}
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                {file && (
                  <span className="text-sm text-gray-700 truncate max-w-[180px]">{file.name}</span>
                )}
              </div>
            )}
            {file && postType !== "video" && (
              <img
                src={URL.createObjectURL(file)}
                alt="Preview"
                className="max-h-40 rounded-xl border mb-2 object-contain"
              />
            )}
            <DialogFooter>
              <Button type="submit" disabled={posting} className="font-semibold">
                {posting ? "Posting..." : "Post"}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 