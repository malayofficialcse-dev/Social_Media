import { useState, useEffect } from 'react';
import { FaTimes, FaUserPlus, FaTrash, FaCrown, FaSignOutAlt, FaPen } from 'react-icons/fa';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const GroupInfoModal = ({ group, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [isAdmin] = useState(group.admins.includes(user._id));
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(group.username || group.name); // Chat.jsx maps name to username
  const [loading, setLoading] = useState(false);
  const [addMemberMode, setAddMemberMode] = useState(false);
  const [potentialMembers, setPotentialMembers] = useState([]);

  // Fetch potential members (followers/following)
  const fetchPotentialMembers = async () => {
    try {
      const { data } = await api.get('/messages/chats');
      const uniqueUsers = data.filter(c => !c.isGroup && !group.members.includes(c._id));
      setPotentialMembers(uniqueUsers);
      setAddMemberMode(true);
    } catch (error) {
      console.error("Error fetching users", error);
    }
  };

  const handleUpdateInfo = async () => {
    try {
        const { data } = await api.put(`/groups/${group._id}`, { name: groupName });
        toast.success("Group updated");
        onUpdate(data);
        setIsEditing(false);
    } catch (error) {
        toast.error("Failed to update group");
    }
  };

  const handleAddMember = async (userId) => {
    try {
        const { data } = await api.put(`/groups/${group._id}/add`, { members: JSON.stringify([userId]) });
        toast.success("Member added");
        onUpdate(data);
        // Refresh potential members list
        setPotentialMembers(prev => prev.filter(u => u._id !== userId));
    } catch (error) {
        toast.error("Failed to add member");
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm("Remove this user?")) return;
    try {
        const { data } = await api.put(`/groups/${group._id}/remove`, { userId }); // API expects userId in body
        toast.success("Member removed");
        onUpdate(data);
    } catch (error) {
        toast.error("Failed to remove member");
    }
  };

  const handleMakeAdmin = async (userId) => {
    try {
        const { data } = await api.put(`/groups/${group._id}/make-admin`, { userId });
        toast.success("User promoted to admin");
        onUpdate(data);
    } catch (error) {
        toast.error("Failed to promote user");
    }
  };

  const handleExitGroup = async () => {
      // Re-use remove member logic for self?
      // Typically 'exit' might be different, but 'removeMember' works if I pass my own ID.
      // But admin check might block me if I'm not admin or if I am the last admin.
      // For simplicity, let's assume I can remove myself if the backend allows it.
      // Backend: removeMember checks checking: `if (!group.admins.includes(req.user._id))`
      // So non-admin cannot remove themselves. I need to update backend or assume admin only for now.
      
      // The user request didn't explicitly ask for 'Exit Group', but 'Group admin controls'.
      // If I am admin I can remove anyone. If I am the creator, I shouldn't leave easily without transferring?
      // Let's stick to "Remove members" (Admin feature). Self-leaving might be complex.
      // I'll skip "Exit Group" button for non-admins for now unless requested.
      if (isAdmin) {
          if (!confirm("Are you sure you want to leave?")) return;
          try {
             // Admin removing self
             const { data } = await api.put(`/groups/${group._id}/remove`, { userId: user._id });
             onUpdate(null); // Group removed from view
             onClose();
          } catch(e) {
              toast.error("Failed to leave");
          }
      }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 w-full max-w-md rounded-xl overflow-hidden shadow-2xl border border-slate-700 max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800">
          <h3 className="text-xl font-bold text-white">Group Info</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto">
            <div className="flex flex-col items-center mb-6">
                <img 
                    src={group.profileImage || `https://ui-avatars.com/api/?name=${group.name || group.username}&background=random`} 
                    alt={group.name}
                    className="w-24 h-24 rounded-full object-cover mb-3 border-4 border-slate-800"
                />
                
                {isEditing ? (
                    <div className="flex gap-2">
                        <input 
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="bg-slate-800 text-white px-2 py-1 rounded"
                        />
                        <button onClick={handleUpdateInfo} className="text-green-500"><FaCheck /></button>
                    </div>
                ) : (
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        {group.name || group.username}
                        {isAdmin && <button onClick={() => setIsEditing(true)} className="text-slate-500 text-sm"><FaPen /></button>}
                    </h2>
                )}
                <p className="text-slate-400">{group.members?.length || 0} members</p>
            </div>

            <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-white font-medium">Members</h4>
                    {isAdmin && !addMemberMode && (
                        <button onClick={fetchPotentialMembers} className="text-accent text-sm flex items-center gap-1">
                            <FaUserPlus /> Add Member
                        </button>
                    )}
                </div>

                {addMemberMode && (
                    <div className="mb-4 bg-slate-800 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-sm text-white">Add People</p>
                            <button onClick={() => setAddMemberMode(false)} className="text-xs text-slate-400">Cancel</button>
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                            {potentialMembers.map(u => (
                                <div key={u._id} className="flex justify-between items-center">
                                    <span className="text-slate-300 text-sm">{u.username}</span>
                                    <button onClick={() => handleAddMember(u._id)} className="text-accent text-xs">Add</button>
                                </div>
                            ))}
                            {potentialMembers.length === 0 && <p className="text-xs text-slate-500">No one to add</p>}
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    {group.members && group.members.length > 0 ? (
                        group.members.map(member => (
                            // The member object might be populated or just ID depending on how the parent passed it
                            // Ideally parent passed populated group. The controller 'getChatList' populates members? 
                            // Note: getChatList returns array of IDs for members in my code above? 
                            // Let's check getChatList in messageController.js. 
                            // It returns: members: group.members. 
                            // In 'createGroup', 'updateGroup', etc, I populated 'members'. 
                            // In 'getChatList', I did NOT populate members details in the 'groups' map loop.
                            // I only populated 'sender' of last message.
                            // So 'group.members' here might be array of IDs.
                            // This component needs full member objects.
                            // FIX: I should probably fetch full group details when opening this modal or ensure 'selectedChat' has them.
                            // Or fetch group details by ID on mount.
                            // I will fetch group details inside this component to be safe.
                            null
                        ))
                    ) : null}
                    {/* Render logic below in useEffect */}
                </div>
            </div>
            
             <FullMemberList 
                groupId={group._id} 
                currentUserId={user._id} 
                isAdmin={isAdmin} 
                onRemove={handleRemoveMember} 
                onPromote={handleMakeAdmin} 
                reloadTrigger={group}
            />

            {isAdmin && (
                <button onClick={handleExitGroup} className="w-full mt-6 py-2 text-red-500 border border-red-500/30 rounded-lg hover:bg-red-500/10 flex items-center justify-center gap-2">
                    <FaSignOutAlt /> Leave Group
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

// Sub-component to fetch and display members
const FullMemberList = ({ groupId, currentUserId, isAdmin, onRemove, onPromote, reloadTrigger }) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGroupDetails = async () => {
             setLoading(true);
             try {
                 const { data } = await api.get(`/groups/${groupId}`);
                 setMembers(data.members);
             } catch (error) {
                 console.error("Failed to fetch members", error);
             } finally {
                 setLoading(false);
             }
        };

        fetchGroupDetails();
    }, [groupId, reloadTrigger]);

    if (loading) return <p className="text-slate-500 text-center text-sm py-4">Loading members...</p>;

    return (
        <div className="space-y-3 max-h-60 overflow-y-auto">
            {members.map(member => (
                <div key={member._id} className="flex items-center justify-between p-2 hover:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                         <img 
                            src={member.profileImage || `https://ui-avatars.com/api/?name=${member.username}&background=random`} 
                            alt={member.username} 
                            className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                            <p className="text-white text-sm font-medium flex items-center gap-1">
                                {member.username}
                                {reloadTrigger.admins.includes(member._id) && <FaCrown className="text-yellow-500 text-xs" />}
                            </p>
                            <p className="text-slate-500 text-xs">{member.email}</p>
                        </div>
                    </div>
                    {isAdmin && member._id !== currentUserId && (
                         <div className="flex gap-2">
                            {!reloadTrigger.admins.includes(member._id) && (
                                <button 
                                    onClick={() => onPromote(member._id)} 
                                    className="text-yellow-500 hover:bg-yellow-500/10 p-2 rounded"
                                    title="Make Admin"
                                >
                                    <FaCrown size={14} />
                                </button>
                            )}
                            <button 
                                onClick={() => onRemove(member._id)} 
                                className="text-red-500 hover:bg-red-500/10 p-2 rounded"
                                title="Remove Member"
                            >
                                <FaTrash size={14} />
                            </button>
                         </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default GroupInfoModal;
