import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "../context/AuthContext";
import { api, API_URL, getToken } from "../services/api";

function initials(name = "?") { return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase(); }
function Avatar({ name, tone = 0, small = false }) { return <span className={`avatar tone-${tone % 6} ${small ? "avatar-small" : ""}`}>{initials(name)}</span>; }
function Modal({ title, onClose, children }) { return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="modal-card"><button className="icon-btn modal-close" onClick={onClose} aria-label="Close">×</button><p className="eyebrow">MINGLE WORKSPACE</p><h2>{title}</h2>{children}</section></div>; }

export default function ChatPage() {
  const { user, logout, token } = useContext(AuthContext);
  const [servers, setServers] = useState([]); const [activeServerId, setActiveServerId] = useState(null); const [activeChannelId, setActiveChannelId] = useState(null);
  const [messages, setMessages] = useState([]); const [draft, setDraft] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const [modal, setModal] = useState(""); const [modalValue, setModalValue] = useState(""); const [busy, setBusy] = useState(false); const [toast, setToast] = useState(""); const [typingUsers, setTypingUsers] = useState([]);
  const currentUserId = user?._id;
  const socketRef = useRef(null); const bottomRef = useRef(null); const typingTimer = useRef(null);
  const activeChannelRef = useRef(activeChannelId); const currentUserRef = useRef(currentUserId);
  activeChannelRef.current = activeChannelId; currentUserRef.current = currentUserId;
  const activeServer = servers.find((server) => server._id === activeServerId) || null;
  const activeChannel = activeServer?.channels?.find((channel) => channel._id === activeChannelId) || null;


  const notify = useCallback((message) => { setToast(message); window.setTimeout(() => setToast(""), 2800); }, []);
  const loadServers = useCallback(async (preferredServerId) => {
    const data = await api("/api/servers");
    setServers(data.servers);
    if (data.servers.length) {
      const selected = data.servers.find((s) => s._id === (preferredServerId || activeServerId)) || data.servers[0];
      setActiveServerId(selected._id);
      setActiveChannelId((previous) => selected.channels.some((c) => c._id === previous) ? previous : selected.channels[0]?._id || null);
    } else { setActiveServerId(null); setActiveChannelId(null); }
    return data.servers;
  }, [activeServerId]);

  useEffect(() => {
    let live = true;
    api("/api/servers").then(({ servers: found }) => {
      if (!live) return;
      setServers(found);
      if (found.length) { setActiveServerId(found[0]._id); setActiveChannelId(found[0].channels[0]?._id || null); }
    }).catch((e) => setError(e.message)).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    const socket = io(API_URL, { auth: { token: getToken() }, transports: ["websocket", "polling"] });
    socketRef.current = socket;
    socket.on("connect_error", (e) => setError(e.message || "Live connection failed."));
    socket.on("message:new", (message) => {
      if (message.channel !== activeChannelRef.current) return;
      setMessages((current) => current.some((m) => m._id === message._id) ? current : [...current, message]);
    });
    socket.on("typing:update", (event) => {
      if (event.channelId !== activeChannelRef.current || event.userId === currentUserRef.current) return;
      setTypingUsers((current) => event.isTyping ? [...new Set([...current, event.username])] : current.filter((name) => name !== event.username));
    });
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [token]);

  useEffect(() => {
    if (!activeChannelId || !socketRef.current) { setMessages([]); return; }
    let cancelled = false; setMessages([]); setTypingUsers([]);
    api(`/api/servers/channels/${activeChannelId}/messages`)
      .then(({ messages: fetched }) => { if (!cancelled) setMessages(fetched); })
      .catch((e) => { if (!cancelled) notify(e.message); });
    socketRef.current.emit("channel:join", activeChannelId, (result) => { if (!result?.ok && !cancelled) notify(result?.message || "Could not join channel."); });
    return () => { cancelled = true; };
  }, [activeChannelId, notify]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typingUsers]);

  async function createServer(e) {
    e.preventDefault(); if (!modalValue.trim()) return; setBusy(true);
    try { const data = await api("/api/servers", { method: "POST", body: JSON.stringify({ name: modalValue.trim() }) }); await loadServers(data.server._id); setActiveServerId(data.server._id); setActiveChannelId(data.server.channels[0]?._id || null); setModal(""); setModalValue(""); notify("Your new space is ready!"); }
    catch (e2) { notify(e2.message); } finally { setBusy(false); }
  }
  async function joinServer(e) {
    e.preventDefault(); if (!modalValue.trim()) return; setBusy(true);
    try { const data = await api("/api/servers/join", { method: "POST", body: JSON.stringify({ inviteCode: modalValue.trim() }) }); await loadServers(data.server._id); setActiveServerId(data.server._id); setActiveChannelId(data.server.channels[0]?._id || null); setModal(""); setModalValue(""); notify("You joined the space!"); }
    catch (e2) { notify(e2.message); } finally { setBusy(false); }
  }
  async function createChannel(e) {
    e.preventDefault(); if (!modalValue.trim() || !activeServer) return; setBusy(true);
    try { const data = await api(`/api/servers/${activeServer._id}/channels`, { method: "POST", body: JSON.stringify({ name: modalValue.trim() }) }); setServers((list) => list.map((s) => s._id === activeServer._id ? { ...s, channels: [...s.channels, data.channel] } : s)); setActiveChannelId(data.channel._id); setModal(""); setModalValue(""); notify("Channel created."); }
    catch (e2) { notify(e2.message); } finally { setBusy(false); }
  }
  function sendMessage(e) {
    e.preventDefault(); const content = draft.trim(); if (!content || !activeChannelId || !socketRef.current) return;
    setDraft(""); socketRef.current.emit("typing:set", { channelId: activeChannelId, isTyping: false });
    socketRef.current.emit("message:send", { channelId: activeChannelId, content }, (result) => { if (!result?.ok) { setDraft(content); notify(result?.message || "Message failed."); } });
  }
  function changeDraft(value) {
    setDraft(value);
    if (activeChannelId && socketRef.current) socketRef.current.emit("typing:set", { channelId: activeChannelId, isTyping: Boolean(value.trim()) });
    clearTimeout(typingTimer.current); typingTimer.current = setTimeout(() => { if (activeChannelId && socketRef.current) socketRef.current.emit("typing:set", { channelId: activeChannelId, isTyping: false }); }, 1200);
  }
  const groupedMessages = useMemo(() => messages.map((message, index) => ({ ...message, showHeader: index === 0 || messages[index - 1].sender?._id !== message.sender?._id || new Date(message.createdAt) - new Date(messages[index - 1].createdAt) > 5 * 60 * 1000 })), [messages]);
  const isOwner = activeServer?.owner?.toString() === currentUserId;

  if (loading) return <div className="loading-screen"><div className="brand-mark">m</div><p>Getting your workspace ready…</p></div>;
  return <main className="app-shell">
    <aside className="server-rail"><div className="rail-logo brand-mark" title="Mingle">m</div><div className="rail-divider"/>
      {servers.map((server, i) => <button key={server._id} className={`server-icon ${server._id === activeServerId ? "selected" : ""}`} title={server.name} onClick={() => { setActiveServerId(server._id); setActiveChannelId(server.channels[0]?._id || null); }}><span>{initials(server.name)}</span>{server._id === activeServerId && <i/>}</button>)}
      <button className="server-add" title="Create a space" onClick={() => { setModal("create-server"); setModalValue(""); }}>+</button><button className="server-add join-add" title="Join with invite code" onClick={() => { setModal("join-server"); setModalValue(""); }}>↗</button>
      <div className="rail-bottom"><span className="rail-spark">✦</span></div>
    </aside>

    <aside className="channel-sidebar"><div className="workspace-top"><div><p className="eyebrow">YOUR CORNER</p><h1>{activeServer?.name || "Your spaces"}</h1></div><button className="icon-btn" title="Create a space" onClick={() => { setModal("create-server"); setModalValue(""); }}>＋</button></div>
      <div className="workspace-search"><span>⌕</span><input aria-label="Search channels" placeholder="Find a channel" onChange={(e) => { const query = e.target.value.toLowerCase(); document.querySelectorAll(".channel-item").forEach((el) => { el.style.display = el.dataset.name.includes(query) ? "flex" : "none"; }); }}/><kbd>⌘ K</kbd></div>
      {activeServer ? <><div className="channel-section-title"><span>YOUR CHANNELS</span>{isOwner && <button className="tiny-add" title="Add channel" onClick={() => { setModal("create-channel"); setModalValue(""); }}>＋</button>}</div>
        <div className="channel-list">{activeServer.channels.map((channel) => <button data-name={channel.name} key={channel._id} className={`channel-item ${activeChannelId === channel._id ? "active" : ""}`} onClick={() => setActiveChannelId(channel._id)}><span className="hash">#</span><span>{channel.name}</span>{activeChannelId === channel._id && <span className="channel-active-dot"/>}</button>)}{activeServer.channels.length === 0 && <p className="sidebar-empty">No channels yet.</p>}</div>
        <div className="invite-card"><div className="invite-icon">✳</div><b>Bring your people in</b><p>Share this invite code with someone you want in your space.</p><button onClick={() => { navigator.clipboard?.writeText(activeServer.inviteCode).then(() => notify("Invite code copied!")).catch(() => notify(`Invite code: ${activeServer.inviteCode}`)); }}>Copy invite code ↗</button><code>{activeServer.inviteCode}</code></div>
      </> : <div className="empty-workspace"><div className="empty-illustration">✳</div><h3>Your people are waiting</h3><p>Create a space for your group or join one with an invite code.</p><button className="primary-btn" onClick={() => { setModal("create-server"); setModalValue(""); }}>Create a space</button><button className="text-btn" onClick={() => { setModal("join-server"); setModalValue(""); }}>I have an invite code</button></div>}
      <div className="profile-card"><Avatar name={user?.username || "You"} tone={2}/><div className="profile-text"><b>{user?.username}</b><span>Ready to chat</span></div><span className="profile-status"/><button className="profile-menu" title="Sign out" onClick={logout}>↪</button></div>
    </aside>

    <section className="chat-panel"><header className="chat-header"><div className="chat-title-icon">#</div><div className="chat-heading"><h2>{activeChannel?.name || "Welcome"}</h2><p>{activeServer ? activeServer.description || "A little space for good conversations." : "Create a space to start chatting."}</p></div><div className="chat-header-actions"><div className="member-count"><span className="member-dot"/> {activeServer?.members?.length || 0} {activeServer?.members?.length === 1 ? "member" : "members"}</div><button className="header-action" title="Invite people" onClick={() => activeServer ? notify(`Invite code: ${activeServer.inviteCode}`) : setModal("create-server")}>♧</button><button className="header-action" title="Sign out" onClick={logout}>↪</button></div></header>
      {error && <div className="connection-banner">{error}<button onClick={() => setError("")}>Dismiss</button></div>}
      <div className="message-scroll">{activeChannel ? <><div className="channel-welcome"><div className="welcome-hash">#</div><h2>Welcome to #{activeChannel.name}!</h2><p>This is the beginning of the <b>#{activeChannel.name}</b> channel. Say hello 👋</p><span className="welcome-line"/></div>
        {groupedMessages.map((message) => <article className={`message ${message.showHeader ? "message-start" : "message-continued"}`} key={message._id}>{message.showHeader && <Avatar name={message.sender?.username || "User"} tone={(message.sender?.username?.length || 0) % 6}/>}<div className="message-body">{message.showHeader && <div className="message-meta"><b>{message.sender?.username || "User"}</b><time>{new Date(message.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time></div>}<p>{message.content}</p></div></article>)}
        {typingUsers.length > 0 && <div className="typing-indicator"><span className="typing-dots"><i/><i/><i/></span>{typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing…</div>}<div ref={bottomRef}/></> : <div className="chat-empty"><div className="empty-illustration">✳</div><h2>A space for your conversations</h2><p>Create a channel to get the conversation started.</p>{activeServer && isOwner && <button className="primary-btn" onClick={() => setModal("create-channel")}>Create a channel</button>}</div>}</div>
      <div className="composer-area">{activeChannel ? <form className="composer" onSubmit={sendMessage}><button type="button" className="composer-plus" title="Create a channel" onClick={() => isOwner ? setModal("create-channel") : notify("Ask the server owner to add a channel.")}>＋</button><input aria-label="Message" value={draft} onChange={(e) => changeDraft(e.target.value)} placeholder={`Message #${activeChannel.name}`} maxLength={2000}/><span className="composer-hint">Enter ↵</span><button className="send-btn" disabled={!draft.trim()} aria-label="Send message" title="Send message">↑</button></form> : <div className="composer-disabled">Choose or create a channel to start messaging.</div>}<p className="composer-note">Be kind. Make it a good space. <span>made for your people ✦</span></p></div>
    </section>

    <aside className="members-sidebar"><div className="members-heading"><span>IN THIS SPACE</span><span className="members-count">{activeServer?.members?.length || 0}</span></div>{activeServer ? <><div className="members-section"><p>MEMBERS — {activeServer.members?.length || 0}</p><div className="member-list">{(activeServer.members || []).map((member, index) => { const memberId = typeof member === "string" ? member : member._id; const memberName = typeof member === "string" ? "Member" : member.username; const isMe = memberId === currentUserId; const isServerOwner = (typeof activeServer.owner === "string" ? activeServer.owner : activeServer.owner?._id) === memberId; return <div className="member-row" key={memberId}><div className="avatar-wrap"><Avatar name={memberName} tone={(memberName?.length || index) % 6}/>{isMe && <i className="online-indicator"/>}</div><div className="member-info"><b>{memberName} {isMe && <span className="you-tag">YOU</span>}</b><span>{isServerOwner ? "Space owner" : isMe ? "Here to hang out" : "Space member"}</span></div></div>; })}</div><div className="members-placeholder"><span>✦</span><p>More good people,<br/>more good conversations.</p><button onClick={() => { navigator.clipboard?.writeText(activeServer.inviteCode).then(() => notify("Invite code copied!")).catch(() => notify(`Invite code: ${activeServer.inviteCode}`)); }}>Invite a friend ↗</button></div></div><div className="about-card"><span className="about-spark">✳</span><p className="eyebrow">A LITTLE REMINDER</p><p>Good things happen when people feel welcome. Make this space yours.</p></div></> : <div className="members-empty"><span>♡</span><p>Your people will show up here once you create or join a space.</p></div>}</aside>

    {modal && <Modal title={modal === "create-server" ? "Create your space" : modal === "join-server" ? "Join a space" : "Add a channel"} onClose={() => setModal("")}><p className="modal-description">{modal === "create-server" ? "Give your people a place to meet, share, and make things happen." : modal === "join-server" ? "Enter the invite code someone shared with you." : "A new channel gives your conversations a home."}</p><form className="modal-form" onSubmit={modal === "create-server" ? createServer : modal === "join-server" ? joinServer : createChannel}><label>{modal === "create-server" ? "SPACE NAME" : modal === "join-server" ? "INVITE CODE" : "CHANNEL NAME"}<input autoFocus value={modalValue} onChange={(e) => setModalValue(e.target.value)} placeholder={modal === "create-server" ? "e.g. The study room" : modal === "join-server" ? "Paste invite code" : "e.g. project-chat"} maxLength={modal === "create-server" ? 50 : 40} required/></label>{modal === "create-server" && <p className="field-hint">A #general channel will be created automatically.</p>}{modal === "create-channel" && <p className="field-hint">Use lowercase letters, numbers, and hyphens. Only the space owner can create channels.</p>}<div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setModal("")}>Cancel</button><button className="primary-btn" disabled={busy || !modalValue.trim()}>{busy ? "Working…" : modal === "create-server" ? "Create space" : modal === "join-server" ? "Join space" : "Create channel"}</button></div></form></Modal>}
    {toast && <div className="toast-message"><span>✦</span>{toast}</div>}
  </main>;
}
