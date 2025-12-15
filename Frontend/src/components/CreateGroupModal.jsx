import { useState, useEffect } from 'react';
import { FaTimes, FaCamera, FaSearch, FaCheck } from 'react-icons/fa';
import api from '../services/api';
import { toast } from 'react-toastify';

const CreateGroupModal = ({ onClose, onGroupCreated }) => {
  const [step, setStep] = useState(1); // 1: Select Members, 2: Group Info
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupImage, setGroupImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // We can reuse the chat list endpoint or fetch followers/following specifically
      // Using chat list gives us people we talk to
      const { data } = await api.get('/messages/chats');
      // Filter out existing groups and duplicates
      const uniqueUsers = data.filter(c => !c.isGroup);
      setUsers(uniqueUsers);
    } catch (error) {
      console.error("Error fetching users", error);
    }
  };

  const toggleUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setGroupImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!groupName.trim()) {
      return toast.error("Group name is required");
    }
    if (selectedUsers.length === 0) {
      return toast.error("Select at least one member");
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('name', groupName);
    formData.append('members', JSON.stringify(selectedUsers));
    if (groupImage) {
      formData.append('image', groupImage);
    }

    try {
      const { data } = await api.post('/groups', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Group created successfully!");
      onGroupCreated(data);
      onClose();
    } catch (error) {
      console.error("Error creating group", error);
      toast.error(error.response?.data?.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 w-full max-w-md rounded-xl overflow-hidden shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800">
          <h3 className="text-xl font-bold text-white">Create Group</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 h-[60vh] flex flex-col">
          {step === 1 ? (
            <>
              <p className="text-slate-400 text-sm mb-4">Select members to add to the group</p>
              
              <div className="relative mb-4">
                <FaSearch className="absolute left-3 top-3 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  className="w-full bg-slate-800 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-accent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {filteredUsers.map(user => (
                  <div 
                    key={user._id} 
                    onClick={() => toggleUser(user._id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedUsers.includes(user._id) ? 'bg-accent/20 border border-accent/50' : 'hover:bg-slate-800'
                    }`}
                  >
                    <div className="relative">
                       <img 
                        src={user.profileImage || `https://ui-avatars.com/api/?name=${user.username}&background=random`} 
                        alt={user.username} 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      {selectedUsers.includes(user._id) && (
                        <div className="absolute -bottom-1 -right-1 bg-accent text-white rounded-full p-1 border-2 border-slate-900">
                           <FaCheck size={8} />
                        </div>
                      )}
                    </div>
                    <span className="text-white font-medium">{user.username}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-between items-center">
                 <span className="text-slate-400 text-sm">{selectedUsers.length} selected</span>
                 <button 
                   onClick={() => selectedUsers.length > 0 ? setStep(2) : toast.error("Select members")}
                   className="btn btn-primary"
                   disabled={selectedUsers.length === 0}
                 >
                   Next
                 </button>
              </div>
            </>
          ) : (
            <>
               <div className="flex flex-col items-center mb-6">
                 <div className="relative group cursor-pointer">
                   <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
                     {previewImage ? (
                       <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                     ) : (
                       <FaCamera size={32} className="text-slate-500" />
                     )}
                   </div>
                   <input 
                     type="file" 
                     accept="image/*" 
                     onChange={handleImageChange}
                     className="absolute inset-0 opacity-0 cursor-pointer"
                   />
                   <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center rounded-full pointer-events-none">
                     <FaCamera className="text-white" />
                   </div>
                 </div>
                 <p className="text-slate-400 text-sm mt-2">Upload Group Icon</p>
               </div>

               <div className="mb-4">
                 <label className="block text-slate-400 text-sm mb-2">Group Name</label>
                 <input 
                   type="text" 
                   value={groupName}
                   onChange={(e) => setGroupName(e.target.value)}
                   className="w-full bg-slate-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-accent"
                   placeholder="e.g. Weekend Plans"
                 />
               </div>

               <div className="mt-auto flex justify-between gap-4">
                 <button 
                   onClick={() => setStep(1)}
                   className="btn btn-secondary flex-1"
                 >
                   Back
                 </button>
                 <button 
                   onClick={handleSubmit}
                   className="btn btn-primary flex-1"
                   disabled={loading}
                 >
                   {loading ? 'Creating...' : 'Create Group'}
                 </button>
               </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
