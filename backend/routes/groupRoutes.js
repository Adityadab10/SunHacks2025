import express from 'express';
import {
  createGroup,
  addMember,
  removeMember,
  getGroup,
  deleteGroup
} from '../controllers/groupController.js';
import { getGroupsByMember } from '../controllers/groupListController.js';

const router = express.Router();

// Create a new group
router.post('/group', createGroup);
// Add member by email
router.post('/group/:groupId/member', addMember);
// Remove member
router.delete('/group/:groupId/member/:memberId', removeMember);
// Get group details
router.get('/group/:groupId', getGroup);
// Delete group
router.delete('/group/:groupId', deleteGroup);
// Get groups by member email
router.get('/groups-by-member', getGroupsByMember);

export default router;
