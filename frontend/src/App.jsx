import { useEffect, useRef, useState } from "react";
import { connectWS } from "./ws.";

export default function App() {
  const timer = useRef(null);
  const socket = useRef(null);
  const [userName, setUserName] = useState("");
  const [showNamePopup, setShowNamePopup] = useState(true);
  const [inputName, setInputName] = useState("");
  const [typers, setTypers] = useState([]);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    socket.current = connectWS();

    const handleRoomNotice = (userName) => {
      console.log(`${userName} joined to group!`);
    };

    const handleChatMessage = (msg) => {
      console.log("msg", msg);
      setMessages((prev) => [...prev, msg]);
    };

    const handleTyping = (userName) => {
      setTypers((prev) => {
        const isExist = prev.find((typer) => typer === userName);
        if (!isExist) {
          return [...prev, userName];
        }
        return prev;
      });
    };

    const handleStopTyping = (userName) => {
      setTypers((prev) => prev.filter((typer) => typer !== userName));
    };

    socket.current.on("roomNotice", handleRoomNotice);
    socket.current.on("chatMessage", handleChatMessage);
    socket.current.on("typing", handleTyping);
    socket.current.on("stopTyping", handleStopTyping);

    return () => {
      socket.current.off("roomNotice", handleRoomNotice);
      socket.current.off("chatMessage", handleChatMessage);
      socket.current.off("typing", handleTyping);
      socket.current.off("stopTyping", handleStopTyping);
    };
  }, []);

  useEffect(() => {
    if (text) {
      socket.current.emit("typing", userName);
      clearTimeout(timer.current);
    }

    timer.current = setTimeout(() => {
      socket.current.emit("stopTyping", userName);
    }, 1000);

    return () => {
      clearTimeout(timer.current);
    };
  }, [text, userName]);

  // FORMAT TIMESTAMP TO HH:MM FOR MESSAGES
  function formatTime(ts) {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  // SUBMIT NAME TO GET STARTED, OPEN CHAT WINDOW WITH INITIAL MESSAGE
  function handleNameSubmit(e) {
    e.preventDefault();
    const trimmed = inputName.trim();
    if (!trimmed) return;

    // join room
    socket.current.emit("joinRoom", trimmed);

    setUserName(trimmed);
    setShowNamePopup(false);
  }

  // SEND MESSAGE FUNCTION
  function sendMessage() {
    const t = text.trim();
    if (!t) return;

    // USER MESSAGE
    const msg = {
      id: Date.now(),
      sender: userName,
      text: t,
      ts: Date.now(),
    };
    setMessages((m) => [...m, msg]);

    // emit
    socket.current.emit("chatMessage", msg);

    setText("");
  }

  // HANDLE ENTER KEY TO SEND MESSAGE
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans antialiased">
      {/* ENTER YOUR NAME TO START CHATTING */}
      {showNamePopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/5 backdrop-blur-sm">
          <div className="glass-morphism border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] rounded-3xl max-w-md w-full mx-4 p-8">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-full glass-light border border-black/5 flex items-center justify-center mb-4 shadow-sm">
                <svg
                  className="w-7 h-7 text-black/70"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-medium text-black/80 tracking-tight">
                Join Chat
              </h1>
              <p className="text-xs text-black/40 mt-1.5 text-center">
                Enter your name to start the conversation
              </p>
            </div>
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <input
                autoFocus
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                className="w-full bg-white/60 border border-black/10 rounded-2xl px-4 py-3 text-sm text-black/80 placeholder-black/30 focus:outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all"
                placeholder="e.g. Alex Smith"
              />
              <button
                type="submit"
                disabled={!inputName.trim()}
                className="w-full px-6 py-3 rounded-2xl bg-black/90 text-white text-sm font-medium hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CHAT WINDOW */}
      {!showNamePopup && (
        <div className="w-full max-w-3xl h-[88vh] glass-morphism border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] rounded-[2rem] flex flex-col overflow-hidden">
          {/* CHAT HEADER */}
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-black/5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-11 w-11 rounded-full bg-white/80 border border-black/10 flex items-center justify-center text-black/70 font-medium text-base shadow-sm">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-black/80 border-2 border-white rounded-full bg-green-600"></div>
              </div>
              <div>
                <div className="text-sm font-medium text-black/70">
                  Group Chat
                </div>
                {typers.length > 0 ? (
                  <div className="flex items-center gap-1 text-xs text-black/40">
                    <span className="inline-block w-1 h-1 bg-black/40 rounded-full animate-pulse"></span>
                    <span
                      className="inline-block w-1 h-1 bg-black/40 rounded-full animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    ></span>
                    <span
                      className="inline-block w-1 h-1 bg-black/40 rounded-full animate-pulse"
                      style={{ animationDelay: "0.4s" }}
                    ></span>
                    <span className="ml-1">{typers.join(", ")} typing</span>
                  </div>
                ) : (
                  <div className="text-xs text-black/30 font-mono">
                    ● ONLINE
                  </div>
                )}
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/50 border border-black/5 rounded-full">
              <div className="text-[10px] text-black/40 uppercase tracking-wider font-medium">
                User
              </div>
              <div className="text-xs text-black/60 capitalize font-medium">
                {userName}
              </div>
            </div>
          </div>

          {/* CHAT MESSAGE LIST */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 glass-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-black/30">
                <div className="w-20 h-20 mb-4 glass-light border border-black/5 rounded-full flex items-center justify-center shadow-sm">
                  <svg
                    className="w-9 h-9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium">No messages yet</p>
                <p className="text-xs text-black/20 mt-1">
                  Start the conversation
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const mine = m.sender === userName;
                return (
                  <div
                    key={m.id}
                    className={`flex ${
                      mine ? "justify-end" : "justify-start"
                    } animate-fade-in`}
                  >
                    <div className="max-w-[85%] sm:max-w-[70%]">
                      {!mine && (
                        <div className="text-[10px] font-medium text-black/40 uppercase tracking-wide mb-1.5 px-1">
                          {m.sender}
                        </div>
                      )}
                      <div
                        className={`px-4 py-3 rounded-3xl text-sm leading-relaxed shadow-[0_2px_8px_0_rgba(0,0,0,0.06)] ${
                          mine
                            ? "bg-black/90 text-white/95 rounded-tr-lg"
                            : "glass-light border border-black/5 text-black/75 rounded-tl-lg hover:border-black/10 transition-colors"
                        }`}
                      >
                        <div className="break-words whitespace-pre-wrap">
                          {m.text}
                        </div>
                        <div
                          className={`text-[9px] mt-2 font-mono tracking-wide ${
                            mine ? "text-white/50 text-right" : "text-black/30"
                          }`}
                        >
                          {formatTime(m.ts)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* CHAT TEXTAREA */}
          <div className="px-6 py-5 border-t border-black/5">
            <div className="flex items-end gap-3 glass-light border border-black/10 rounded-[1.5rem] p-2 focus-within:border-black/20 transition-all">
              <textarea
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 bg-transparent text-black/75 placeholder-black/30 px-3 py-2.5 text-sm outline-none resize-none max-h-32 glass-scrollbar"
              />
              <button
                onClick={sendMessage}
                disabled={!text.trim()}
                className="w-10 h-10 flex-shrink-0 rounded-full bg-black/90 text-white hover:bg-black disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 flex items-center justify-center shadow-sm"
              >
                <svg
                  className="w-4 h-4 transform rotate-90"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
            <div className="mt-2 text-center">
              <p className="text-[9px] text-black font-mono tracking-wider">
                PRESS <span className="text-black">ENTER</span> TO SEND
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
