import React, { useState, useEffect, useRef } from 'react';
import { 
  Gamepad2, 
  MessageSquare, 
  ShieldAlert, 
  Globe, 
  Home, 
  Send, 
  User, 
  Lock,
  Trash2,
  Clock,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import gamesData from './games.json';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedGame, setSelectedGame] = useState(null);
  const [proxyUrl, setProxyUrl] = useState('');
  const [currentProxyUrl, setCurrentProxyUrl] = useState('');
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [chatUsername, setChatUsername] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [ws, setWs] = useState(null);
  const chatEndRef = useRef(null);

  // Manager state
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [bannedUsers, setBannedUsers] = useState([]);
  const [banIp, setBanIp] = useState('');
  const [banReason, setBanReason] = useState('');

  useEffect(() => {
    if (activeTab === 'chat') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const socket = new WebSocket(`${protocol}//${window.location.host}`);
      
      socket.onopen = () => console.log('Connected to chat');
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'chat') {
          setMessages(prev => [...prev, data]);
        } else if (data.type === 'error') {
          alert(data.message);
        }
      };
      
      setWs(socket);
      
      // Fetch initial messages
      fetch('/api/messages')
        .then(res => res.json())
        .then(setMessages);

      return () => socket.close();
    }
  }, [activeTab]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (isAdmin) {
      fetchBannedUsers();
    }
  }, [isAdmin]);

  const fetchBannedUsers = async () => {
    const res = await fetch('/api/admin/banned');
    const data = await res.json();
    setBannedUsers(data);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !chatUsername.trim() || !ws) return;
    
    ws.send(JSON.stringify({
      type: 'chat',
      username: chatUsername,
      text: chatInput
    }));
    setChatInput('');
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: adminUser, password: adminPass })
    });
    const data = await res.json();
    if (data.success) {
      setIsAdmin(true);
    } else {
      alert('Invalid credentials');
    }
  };

  const handleBan = async (e) => {
    e.preventDefault();
    await fetch('/api/admin/ban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip: banIp, reason: banReason })
    });
    setBanIp('');
    setBanReason('');
    fetchBannedUsers();
  };

  const handleUnban = async (ip) => {
    await fetch(`/api/admin/unban/${ip}`, { method: 'DELETE' });
    fetchBannedUsers();
  };

  const handleProxySubmit = (e) => {
    e.preventDefault();
    if (!proxyUrl.trim()) return;

    let url = proxyUrl;
    if (!url.startsWith('http')) url = 'https://' + url;

    try {
      const validatedUrl = new URL(url);
      if (validatedUrl.hostname.includes('.')) {
        setCurrentProxyUrl(url);
      } else {
        throw new Error('Invalid hostname');
      }
    } catch (err) {
      alert('Please enter a valid URL (e.g., google.com)');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold tracking-tighter">STARGAZE</span>
          </div>
          
          <div className="flex items-center gap-1 md:gap-4">
            {[
              { id: 'home', icon: Home, label: 'Home' },
              { id: 'games', icon: Gamepad2, label: 'Games' },
              { id: 'proxy', icon: Globe, label: 'Proxy' },
              { id: 'chat', icon: MessageSquare, label: 'Chat' },
              { id: 'manager', icon: ShieldAlert, label: 'Manager' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSelectedGame(null);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all ${
                  activeTab === item.id 
                    ? 'bg-emerald-500 text-black font-semibold' 
                    : 'hover:bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden md:block text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-12 max-w-7xl mx-auto px-4">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-8 py-12"
            >
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
                STARGAZE UNBLOCKED
              </h1>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                The ultimate gaming destination by Holden Papa John. Access your favorite games, chat with friends, and browse freely.
              </p>
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => setActiveTab('games')}
                  className="px-8 py-4 bg-emerald-500 text-black font-bold rounded-2xl hover:scale-105 transition-transform"
                >
                  START PLAYING
                </button>
                <button 
                  onClick={() => setActiveTab('chat')}
                  className="px-8 py-4 bg-white/5 border border-white/10 font-bold rounded-2xl hover:bg-white/10 transition-colors"
                >
                  JOIN CHAT
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'games' && (
            <motion.div
              key="games"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {selectedGame ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">{selectedGame.title}</h2>
                    <button 
                      onClick={() => setSelectedGame(null)}
                      className="text-zinc-400 hover:text-white"
                    >
                      Back to Library
                    </button>
                  </div>
                  <div className="aspect-video w-full bg-zinc-900 rounded-3xl overflow-hidden border border-white/10">
                    <iframe 
                      src={selectedGame.url} 
                      className="w-full h-full border-none"
                      title={selectedGame.title}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gamesData.map((game) => (
                    <motion.div
                      key={game.id}
                      whileHover={{ y: -5 }}
                      className="group relative bg-zinc-900 rounded-3xl overflow-hidden border border-white/10 cursor-pointer"
                      onClick={() => setSelectedGame(game)}
                    >
                      <img 
                        src={game.thumbnail} 
                        alt={game.title}
                        className="w-full aspect-video object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                        <h3 className="text-xl font-bold">{game.title}</h3>
                        <p className="text-sm text-zinc-400">Click to play</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'proxy' && (
            <motion.div
              key="proxy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <div className="bg-zinc-900 p-8 rounded-3xl border border-white/10 space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Globe className="w-6 h-6 text-emerald-500" />
                  Web Proxy
                </h2>
                <p className="text-zinc-400 text-sm">
                  Enter a URL to browse through our proxy. Note: Some sites may not work due to security restrictions.
                </p>
                <form onSubmit={handleProxySubmit} className="flex gap-2">
                  <input 
                    type="text"
                    value={proxyUrl}
                    onChange={(e) => setProxyUrl(e.target.value)}
                    placeholder="google.com"
                    className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
                  />
                  <button className="bg-emerald-500 text-black font-bold px-6 py-3 rounded-xl hover:opacity-90">
                    Go
                  </button>
                </form>
              </div>

              {currentProxyUrl && (
                <div className="aspect-video w-full bg-zinc-900 rounded-3xl overflow-hidden border border-white/10">
                  <iframe 
                    src={currentProxyUrl} 
                    className="w-full h-full border-none"
                    title="Proxy View"
                  />
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto h-[70vh] flex flex-col bg-zinc-900 rounded-3xl border border-white/10 overflow-hidden"
            >
              <div className="p-4 border-b border-white/10 bg-black/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-500" />
                  <span className="font-bold">Global Chat</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-zinc-400" />
                  <input 
                    type="text"
                    value={chatUsername}
                    onChange={(e) => setChatUsername(e.target.value)}
                    placeholder="Username"
                    className="bg-black/40 border border-white/5 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-emerald-400 text-sm">{msg.username}</span>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-zinc-300 text-sm bg-white/5 p-3 rounded-2xl rounded-tl-none inline-block max-w-[80%]">
                      {msg.text}
                    </p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-4 bg-black/20 border-t border-white/10 flex gap-2">
                <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500"
                />
                <button className="p-2 bg-emerald-500 text-black rounded-xl hover:opacity-90">
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === 'manager' && (
            <motion.div
              key="manager"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto"
            >
              {!isAdmin ? (
                <div className="max-w-md mx-auto bg-zinc-900 p-8 rounded-3xl border border-white/10 space-y-6">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                      <Lock className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold">Admin Login</h2>
                    <p className="text-zinc-400 text-sm">Authorized personnel only.</p>
                  </div>
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Username</label>
                      <input 
                        type="text"
                        value={adminUser}
                        onChange={(e) => setAdminUser(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Password</label>
                      <input 
                        type="password"
                        value={adminPass}
                        onChange={(e) => setAdminPass(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <button className="w-full bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors">
                      Login
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black tracking-tight">MANAGEMENT DASHBOARD</h2>
                    <button 
                      onClick={() => setIsAdmin(false)}
                      className="text-zinc-400 hover:text-white text-sm"
                    >
                      Logout
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Ban Form */}
                    <div className="bg-zinc-900 p-6 rounded-3xl border border-white/10 space-y-4">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-red-500" />
                        Ban User
                      </h3>
                      <form onSubmit={handleBan} className="space-y-4">
                        <input 
                          type="text"
                          placeholder="IP Address"
                          value={banIp}
                          onChange={(e) => setBanIp(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-red-500"
                        />
                        <input 
                          type="text"
                          placeholder="Reason"
                          value={banReason}
                          onChange={(e) => setBanReason(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-red-500"
                        />
                        <button className="w-full bg-red-500 text-white font-bold py-2 rounded-xl hover:bg-red-600">
                          Apply Ban
                        </button>
                      </form>
                    </div>

                    {/* Banned List */}
                    <div className="bg-zinc-900 p-6 rounded-3xl border border-white/10 space-y-4">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Trash2 className="w-5 h-5 text-zinc-400" />
                        Banned Users
                      </h3>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {bannedUsers.length === 0 ? (
                          <p className="text-zinc-500 text-sm italic">No banned users.</p>
                        ) : (
                          bannedUsers.map((user) => (
                            <div key={user.ip} className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                              <div>
                                <p className="font-mono text-sm">{user.ip}</p>
                                <p className="text-xs text-zinc-500">{user.reason}</p>
                              </div>
                              <button 
                                onClick={() => handleUnban(user.ip)}
                                className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-emerald-500"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-zinc-500 text-sm">
          <p>© 2026 Stargaze Unblocked by Holden Papa John</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
