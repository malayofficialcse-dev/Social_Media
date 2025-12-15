import asyncHandler from "express-async-handler";
import Group from "../Models/Group.js";
import User from "../Models/User.js";

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
export const createGroup = asyncHandler(async (req, res) => {
  const { name, description, members } = req.body;
  
  if (!name) {
    res.status(400);
    throw new Error("Group name is required");
  }

  let parsedMembers = [];
  if (members) {
    try {
        parsedMembers = JSON.parse(members);
    } catch (e) {
        parsedMembers = members; // Assume it's already an array if parse fails or it was passed as object
    }
  }

  // Add creator to members if not already there
  if (!parsedMembers.includes(req.user._id.toString())) {
    parsedMembers.push(req.user._id.toString());
  }

  // Handle image upload
  let profileImage = "";
  if (req.file) {
    profileImage = req.file.path;
  }

  const group = await Group.create({
    name,
    description,
    profileImage,
    members: parsedMembers,
    admins: [req.user._id],
    createdBy: req.user._id,
  });

  const fullGroup = await Group.findOne({ _id: group._id })
    .populate("members", "-password")
    .populate("admins", "-password");

  res.status(201).json(fullGroup);
});

// @desc    Get all groups for a user
// @route   GET /api/groups
// @access  Private
export const getUserGroups = asyncHandler(async (req, res) => {
  const groups = await Group.find({ members: req.user._id })
    .populate("members", "-password")
    .populate("admins", "-password")
    .sort({ updatedAt: -1 });

  res.json(groups);
});

// @desc    Get single group details
// @route   GET /api/groups/:id
// @access  Private
export const getGroupById = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id)
    .populate("members", "username profileImage email")
    .populate("admins", "username profileImage");

  if (!group) {
    res.status(404);
    throw new Error("Group not found");
  }

  // Check membership
  // Note: members are now populated, so we check _id property
  if (!group.members.some(member => member._id.toString() === req.user._id.toString())) {
      res.status(403);
      throw new Error("Not a member of this group");
  }

  res.json(group);
});

// @desc    Update group info
// @route   PUT /api/groups/:id
// @access  Private (Admin only)
export const updateGroup = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const groupId = req.params.id;

  const group = await Group.findById(groupId);

  if (!group) {
    res.status(404);
    throw new Error("Group not found");
  }

  // Check if user is admin
  if (!group.admins.includes(req.user._id)) {
    res.status(403);
    throw new Error("Only admins can update group info");
  }

  if (name) group.name = name;
  if (description) group.description = description;
  if (req.file) {
    group.profileImage = req.file.path;
  }

  await group.save();

  const fullGroup = await Group.findOne({ _id: group._id })
    .populate("members", "-password")
    .populate("admins", "-password");

  res.json(fullGroup);
});

// @desc    Add members to group
// @route   PUT /api/groups/:id/add
// @access  Private (Admin only)
export const addMembers = asyncHandler(async (req, res) => {
  const { members } = req.body; // Array of user IDs
  const groupId = req.params.id;

  const group = await Group.findById(groupId);

  if (!group) {
    res.status(404);
    throw new Error("Group not found");
  }

  if (!group.admins.includes(req.user._id)) {
    res.status(403);
    throw new Error("Only admins can add members");
  }

  // Add new members
  let newMembers = [];
  try {
     newMembers = JSON.parse(members);
  } catch (e) {
     newMembers = members;
  }
  
  // Filter only those who are not already members
  const uniqueNewMembers = newMembers.filter(id => !group.members.includes(id));
  
  group.members.push(...uniqueNewMembers);
  await group.save();

  const fullGroup = await Group.findOne({ _id: group._id })
    .populate("members", "-password")
    .populate("admins", "-password");

  res.json(fullGroup);
});

// @desc    Remove member from group
// @route   PUT /api/groups/:id/remove
// @access  Private (Admin only)
export const removeMember = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const groupId = req.params.id;

  const group = await Group.findById(groupId);

  if (!group) {
    res.status(404);
    throw new Error("Group not found");
  }

  if (!group.admins.includes(req.user._id)) {
    res.status(403);
    throw new Error("Only admins can remove members");
  }

  // Remove from members
  group.members = group.members.filter(id => id.toString() !== userId);
  // Remove from admins if present
  group.admins = group.admins.filter(id => id.toString() !== userId);

  await group.save();

  const fullGroup = await Group.findOne({ _id: group._id })
    .populate("members", "-password")
    .populate("admins", "-password");

  res.json(fullGroup);
});

// @desc    Make member admin
// @route   PUT /api/groups/:id/make-admin
// @access  Private (Admin only)
export const makeAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const groupId = req.params.id;

  const group = await Group.findById(groupId);

  if (!group) {
    res.status(404);
    throw new Error("Group not found");
  }

  if (!group.admins.includes(req.user._id)) {
    res.status(403);
    throw new Error("Only admins can promote members");
  }

  if (!group.members.includes(userId)) {
      res.status(400);
      throw new Error("User is not a member of this group");
  }

  if (!group.admins.includes(userId)) {
    group.admins.push(userId);
    await group.save();
  }

  const fullGroup = await Group.findOne({ _id: group._id })
    .populate("members", "-password")
    .populate("admins", "-password");

  res.json(fullGroup);
});
