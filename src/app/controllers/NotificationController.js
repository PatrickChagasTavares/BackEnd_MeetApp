import Notification from '../schemas/Notification';
import User from '../models/User';

class NotificationController {
  async index(req, res) {
    const checkExistMeetup = await User.findOne({ where: { id: req.userId } });

    if (!checkExistMeetup) {
      return res.status(401).json({ error: 'User is not owner Meetup' });
    }

    const notification = await Notification.find({
      user_id: req.userId,
    })
      .sort({ createdAt: 'desc' })
      .limit(20);

    return res.json(notification);
  }

  async update(req, res) {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    return res.json(notification);
  }
}

export default new NotificationController();
