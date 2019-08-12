import Meetup from '../models/Meetup';

class SubscriptionController {
  async index(req, res) {
    return res.json();
  }

  async store(req, res) {
    const { id } = req.params;

    const meetup = await Meetup.findByPk(id);

    if (!meetup) {
      return res.status(400).json({ error: 'Meetup does not exists.' });
    }

    if (meetup.user_id === req.userId) {
      return res.status(400).json({
        error: 'you cannot subscription for the meetup that you is owner',
      });
    }

    if (meetup.past) {
      return res
        .status(400)
        .json({ error: 'You can not subscription a finished meetup' });
    }

    return res.json();
  }
}

export default new SubscriptionController();
