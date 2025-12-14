import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { FaPaperPlane, FaImage, FaTimes, FaArrowLeft, FaSmile, FaCheck, FaCheckDouble } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import EmojiPicker from 'emoji-picker-react';

const Chat = () => {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [chatList, setChatList] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const userIdRef = useRef(user?._id);

  // Crop State
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);

  // Fetch chat list (followers + following)
  const fetchChatList = useCallback(async () => {
    try {
      const { data } = await api.get('/messages/chats');
      setChatList(data);
      
      // Mark messages as delivered for all chats with unread messages
      // This handles messages sent while user was offline
      data.forEach(chat => {
        if (chat.unreadCount > 0) {
          api.put(`/messages/${chat._id}/mark-delivered`).catch(console.error);
        }
      });
    } catch (error) {
      console.error('Error fetching chat list', error);
    }
  }, []);

  useEffect(() => {
    userIdRef.current = user?._id;
  }, [user]);

  useEffect(() => {
    fetchChatList();
  }, [fetchChatList]);

  const fetchMessages = useCallback(async () => {
    if (!selectedChat) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/messages/${selectedChat._id}`);
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages', error);
    }
    setLoading(false);
  }, [selectedChat]);

  const markMessagesAsRead = useCallback(async () => {
    if (!selectedChat) return;
    try {
      await api.put(`/messages/${selectedChat._id}/mark-read`);
      // Refresh chat list to update unread count
      fetchChatList();
    } catch (error) {
      console.error('Error marking messages as read', error);
    }
  }, [selectedChat, fetchChatList]);

  // Fetch messages when a chat is selected
  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
      markMessagesAsRead();
    }
  }, [selectedChat, fetchMessages, markMessagesAsRead]);

  // Socket listeners
  useEffect(() => {
    if (socket) {
      socket.on('message received', (newMessageReceived) => {
        if (selectedChat && (newMessageReceived.sender._id === selectedChat._id || newMessageReceived.receiver._id === selectedChat._id)) {
          setMessages((prev) => [newMessageReceived, ...prev]);
          // Mark as read since user is viewing the chat
          markMessagesAsRead();
        } else {
          // Mark as delivered since we received it but haven't read it
          api.put(`/messages/${newMessageReceived.sender._id}/mark-delivered`).catch(console.error);

          // Show toast notification with sender image
          const CustomToast = () => (
            <div className="flex items-center gap-3">
              <img 
                src={newMessageReceived.sender.profileImage || 'https://via.placeholder.com/40'} 
                alt={newMessageReceived.sender.username}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-bold">{newMessageReceived.sender.username}</p>
                <p className="text-sm">{newMessageReceived.content || 'Sent an image'}</p>
              </div>
            </div>
          );
          toast.info(<CustomToast />, {
            position: "top-right",
            autoClose: 5000,
          });
          
          // Play notification sound
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play().catch(e => console.log("Audio play failed", e));
        }
        
        // Refresh chat list to update order and unread count
        fetchChatList();
      });

      // Status updates for SENT messages
      socket.on('message read', ({ readerId }) => {
        // Update messages if we're viewing the chat with the person who read our messages
        if (selectedChat && selectedChat._id === readerId) {
          setMessages(prev => prev.map(msg => 
            msg.sender._id === userIdRef.current ? { ...msg, status: 'read' } : msg
          ));
        }
      });

      socket.on('message delivered', ({ receiverId }) => {
        // Update messages if we're viewing the chat with the person who received our messages
        if (selectedChat && selectedChat._id === receiverId) {
           setMessages(prev => prev.map(msg => 
            msg.sender._id === userIdRef.current && msg.status === 'sent' ? { ...msg, status: 'delivered' } : msg
          ));
        }
      });

      socket.on('typing', () => setTyping(true));
      socket.on('stop typing', () => setTyping(false));
    }

    return () => {
      if (socket) {
        socket.off('message received');
        socket.off('message read');
        socket.off('message delivered');
        socket.off('typing');
        socket.off('stop typing');
      }
    };
  }, [socket, selectedChat, fetchChatList, markMessagesAsRead]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !image) return;

    const formData = new FormData();
    formData.append('receiverId', selectedChat._id);
    formData.append('content', newMessage);
    if (image) formData.append('image', image);

    try {
      const { data } = await api.post('/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessages([data, ...messages]);
      setNewMessage('');
      setImage(null);

      // Emit socket event
      socket.emit('new message', {
        ...data,
        receiver: selectedChat._id,
      });
    } catch (error) {
      toast.error('Error sending message');
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!socket) return;

    if (!typing) {
      setTyping(true);
      socket.emit('typing', selectedChat._id);
    }

    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit('stop typing', selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  const isUserOnline = (userId) => {
    return onlineUsers.some(u => u.userId === userId);
  };

  // Crop Handlers
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
      setZoom(1);
      setRotation(0);
      setCrop({ x: 0, y: 0 });
    }
  };

  const readFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result), false);
      reader.readAsDataURL(file);
    });
  };

  const handleCropSave = async () => {
    try {
      const croppedImageBlob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      );
      
      const file = new File([croppedImageBlob], 'message-image.jpg', { type: 'image/jpeg' });
      setImage(file);
      setImageSrc(null); // Close cropper
    } catch (e) {
      console.error(e);
      toast.error("Error cropping image");
    }
  };

  return (
    <div className="flex h-[calc(100vh-73px)] bg-dark">
      {/* Image Cropper Modal */}
      {imageSrc && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-2xl h-[60vh] bg-dark rounded-lg overflow-hidden mb-4">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={4 / 3}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
            />
          </div>
          <div className="flex flex-col gap-4 w-full max-w-md">
            <div className="flex gap-4 items-center">
              <span className="text-white text-sm w-16">Zoom</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(e.target.value)}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="flex gap-4 items-center">
              <span className="text-white text-sm w-16">Rotate</span>
              <input
                type="range"
                value={rotation}
                min={0}
                max={360}
                step={1}
                onChange={(e) => setRotation(e.target.value)}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="flex justify-between gap-4 mt-2">
              <button 
                onClick={() => setImageSrc(null)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button 
                onClick={handleCropSave}
                className="btn btn-primary flex-1"
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat List Sidebar */}
      <div className={`${selectedChat ? 'hidden md:block' : 'block'} w-full md:w-80 border-r border-slate-800 overflow-y-auto`}>
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">Messages</h2>
        </div>
        <div className="divide-y divide-slate-800">
          {chatList.map((chatUser) => (
            <div
              key={chatUser._id}
              onClick={() => setSelectedChat(chatUser)}
              className={`p-4 cursor-pointer hover:bg-slate-800 transition-colors ${
                selectedChat?._id === chatUser._id ? 'bg-slate-800' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={chatUser.profileImage || 'https://via.placeholder.com/40'}
                    alt={chatUser.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {isUserOnline(chatUser._id) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-dark rounded-full"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-white truncate">{chatUser.username}</p>
                    {chatUser.unreadCount > 0 && (
                      <span className="bg-accent text-white text-xs font-bold rounded-full px-2 py-0.5 ml-2">
                        {chatUser.unreadCount > 9 ? '9+' : chatUser.unreadCount}
                      </span>
                    )}
                  </div>
                  {chatUser.lastMessage ? (
                    <p className="text-xs text-slate-400 truncate">
                      {chatUser.lastMessage.senderId === user._id ? 'You: ' : ''}
                      {chatUser.lastMessage.content || 'Sent an image'}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500">No messages yet</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {chatList.length === 0 && (
            <p className="text-center text-slate-500 p-4">No chats available. Follow users to start chatting!</p>
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`${selectedChat ? 'block' : 'hidden md:block'} flex-1 flex flex-col`}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-800 flex items-center gap-3">
              <button
                onClick={() => setSelectedChat(null)}
                className="md:hidden text-slate-400 hover:text-white"
              >
                <FaArrowLeft size={20} />
              </button>
              <div className="relative">
                <img
                  src={selectedChat.profileImage || 'https://via.placeholder.com/40'}
                  alt={selectedChat.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                {isUserOnline(selectedChat._id) && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-dark rounded-full"></span>
                )}
              </div>
              <div>
                <p className="font-medium text-white">{selectedChat.username}</p>
                {typing && <p className="text-xs text-accent">typing...</p>}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse">
              <div ref={messagesEndRef} />
              {loading ? (
                <p className="text-center text-slate-500">Loading messages...</p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message._id}
                    className={`mb-4 flex ${message.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md lg:max-w-lg ${
                        message.sender._id === user._id
                          ? 'bg-accent text-white'
                          : 'bg-slate-800 text-slate-200'
                      } rounded-lg p-3`}
                    >
                      {message.image && (
                        <img src={message.image} alt="Message" className="rounded mb-2 max-h-60 w-full object-cover" />
                      )}
                      {message.content && <p className="text-sm">{message.content}</p>}
                      <p className="text-xs opacity-70 mt-1">
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </p>
                      {message.sender._id === user._id && (
                        <div className="flex justify-end mt-1 items-center gap-1">
                          {(!message.status || message.status === 'sent') && <FaCheck className="text-white text-sm" />}
                          {message.status === 'delivered' && <FaCheckDouble className="text-white text-sm" />}
                          {message.status === 'read' && <FaCheckDouble className="text-green-400 text-sm" />}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-slate-800">
              {image && (
                <div className="mb-2 relative inline-block">
                  <img src={URL.createObjectURL(image)} alt="Preview" className="max-h-20 rounded" />
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              )}
              <div className="flex gap-2 items-center relative">
                <label className="cursor-pointer text-slate-400 hover:text-accent p-2">
                  <FaImage size={20} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                
                {/* Emoji Picker */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="text-slate-400 hover:text-accent p-2"
                  >
                    <FaSmile size={20} />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-12 left-0 z-50">
                      <EmojiPicker
                        onEmojiClick={(emojiObject) => {
                          setNewMessage(prev => prev + emojiObject.emoji);
                          setShowEmojiPicker(false);
                        }}
                        theme="dark"
                        width={300}
                        height={400}
                      />
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-800 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() && !image}
                  className="bg-accent text-white rounded-full p-2 hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaPaperPlane size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <p>Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
