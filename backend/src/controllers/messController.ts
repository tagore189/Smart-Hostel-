import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { MealMenu, MealType } from '../models/MealMenu';
import { MealFeedback } from '../models/MealFeedback';
import { MealOptOut } from '../models/MealOptOut';

const getDayName = (date: Date): 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' => {
  const days: ('Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday')[] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return days[date.getDay()] as any;
};

export const getTodayMenu = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    const currentDay = getDayName(today);
    const dateStr = today.toISOString().split('T')[0];

    const menus = await MealMenu.find({ dayOfWeek: currentDay }).sort({ createdAt: 1 });

    // Check resident opt-outs for today
    let myOptOuts: string[] = [];
    if (req.resident) {
      const optOuts = await MealOptOut.find({ resident: req.resident._id, dateStr });
      myOptOuts = optOuts.map((o) => o.mealType);
    }

    res.json({
      success: true,
      data: {
        day: currentDay,
        date: dateStr,
        meals: menus,
        myOptOuts,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getWeeklyMenu = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const menus = await MealMenu.find().sort({ dayOfWeek: 1, createdAt: 1 });

    const grouped: Record<string, any[]> = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };

    menus.forEach((m) => {
      if (grouped[m.dayOfWeek]) {
        grouped[m.dayOfWeek].push(m);
      }
    });

    res.json({
      success: true,
      data: grouped,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitMealFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resident = req.resident;
    if (!resident) {
      res.status(404).json({ success: false, message: 'Resident profile not found' });
      return;
    }

    const { mealType, dateStr, rating, tasteRating, hygieneRating, comment } = req.body;
    if (!mealType || !rating) {
      res.status(400).json({ success: false, message: 'Meal type and rating are required' });
      return;
    }

    const feedback = await MealFeedback.create({
      resident: resident._id,
      residentName: resident.name,
      mealType,
      dateStr: dateStr || new Date().toISOString().split('T')[0],
      rating: Number(rating),
      tasteRating: tasteRating ? Number(tasteRating) : undefined,
      hygieneRating: hygieneRating ? Number(hygieneRating) : undefined,
      comment,
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully. Thank you for helping us maintain dining quality!',
      data: feedback,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleMealOptOut = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resident = req.resident;
    if (!resident) {
      res.status(404).json({ success: false, message: 'Resident profile not found' });
      return;
    }

    const { mealType, dateStr, reason } = req.body;
    if (!mealType) {
      res.status(400).json({ success: false, message: 'Meal type is required' });
      return;
    }

    const targetDate = dateStr || new Date().toISOString().split('T')[0];

    const existing = await MealOptOut.findOne({
      resident: resident._id,
      dateStr: targetDate,
      mealType,
    });

    if (existing) {
      await MealOptOut.findByIdAndDelete(existing._id);
      res.json({
        success: true,
        message: `Meal opt-out cancelled for ${mealType}. Dining is now active for you.`,
        optedOut: false,
      });
    } else {
      await MealOptOut.create({
        resident: resident._id,
        residentName: resident.name,
        roomNumber: resident.roomNumber,
        dateStr: targetDate,
        mealType,
        reason,
      });
      res.json({
        success: true,
        message: `Opted out of ${mealType} on ${targetDate}. Kitchen notified to minimize food wastage.`,
        optedOut: true,
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyOptOuts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resident = req.resident;
    if (!resident) {
      res.status(404).json({ success: false, message: 'Resident profile not found' });
      return;
    }
    const optOuts = await MealOptOut.find({ resident: resident._id }).sort({ dateStr: -1 });
    res.json({ success: true, data: optOuts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
