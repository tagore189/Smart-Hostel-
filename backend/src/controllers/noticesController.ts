import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Notice, NoticeCategory } from '../models/Notice';
import { NoticeRead } from '../models/NoticeRead';

export const getNotices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category } = req.query;
    const filter: any = { isArchived: false };

    if (category && category !== 'All') {
      filter.category = category as NoticeCategory;
    }

    // Filter by audience if resident
    if (req.user?.role === 'RESIDENT' && req.resident) {
      filter.$or = [
        { audienceScope: 'ALL' },
        { audienceScope: 'FLOOR', targetFloor: req.resident.floorNumber },
        { audienceScope: 'ROOM', targetRoom: req.resident.roomNumber },
        { audienceScope: 'RESIDENT', targetResident: req.resident._id },
      ];
    }

    const notices = await Notice.find(filter).sort({ priority: -1, createdAt: -1 });

    // Read statuses
    const readMap: Record<string, boolean> = {};
    if (req.user) {
      const reads = await NoticeRead.find({ user: req.user._id });
      reads.forEach((r) => {
        readMap[r.notice.toString()] = true;
      });
    }

    const formatted = notices.map((n) => ({
      ...n.toObject(),
      isRead: !!readMap[n._id.toString()],
    }));

    res.json({ success: true, data: formatted });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markNoticeAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    await NoticeRead.findOneAndUpdate(
      { notice: id, user: req.user._id },
      { readAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Notice marked as read' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
