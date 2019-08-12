import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore } from 'date-fns';

import Meetup from '../models/Meetup';
import File from '../models/File';
import User from '../models/User';

class MeetupController {
  async index(req, res) {
    const meetups = await Meetup.findAll({
      where: { user_id: req.userId },
      order: ['times'],
      attributes: ['id', 'title', 'description', 'location', 'times', 'past'],
      include: [
        {
          model: File,
          as: 'banner',
          attributes: ['id', 'path', 'url'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name'],
        },
      ],
    });

    return res.json(meetups);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      times: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'validation fails' });
    }

    const { image_id, times } = req.body;

    /**
     * Check for past dates
     */
    const hourStart = startOfHour(parseISO(times));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted.' });
    }

    /**
     * Check date availability
     */

    const checkAvailability = await Meetup.findOne({
      where: {
        user_id: req.userId,
        times: hourStart,
      },
    });

    if (checkAvailability) {
      return res.status(400).json({ error: 'Meetup date is not available' });
    }

    /**
     * check if image is banner
     */

    if (image_id) {
      const { type } = await File.findByPk(image_id);

      if (type !== 'banner') {
        return res.status(401).json({ error: 'File is invalid' });
      }
    }

    const { id } = await Meetup.create({
      title: req.body.title,
      description: req.body.description,
      location: req.body.location,
      times,
      image_id,
      user_id: req.userId,
    });

    const { title, description, location, banner } = await Meetup.findByPk(id, {
      include: [
        {
          model: File,
          as: 'banner',
          attributes: ['id', 'path', 'url'],
        },
      ],
    });

    return res.json({
      id,
      title,
      description,
      location,
      times,
      banner,
    });
  }

  async update(req, res) {
    return res.json({ OK: true });
  }

  async destroy(req, res) {
    const { id } = req.params;

    const { times, user_id } = await Meetup.findByPk(id);

    if (!(user_id === req.userId)) {
      return res
        .status(401)
        .json({ error: "You aren't the owner of this meeting" });
    }

    const hourStart = startOfHour(parseISO(times));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted.' });
    }

    await Meetup.destroy({ where: { id } });

    return res.json();
  }
}

export default new MeetupController();
