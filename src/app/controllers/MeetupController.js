import * as Yup from 'yup';
import {
  startOfHour,
  parseISO,
  isBefore,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { Op } from 'sequelize';

import Meetup from '../models/Meetup';
import File from '../models/File';
import User from '../models/User';

import CancelationMeetupMail from '../jobs/CancelationMeetupMail';
import Queue from '../../lib/Queue';

class MeetupController {
  async index(req, res) {
    const meetup = await Meetup.findAll({
      where: { user_id: req.userId },
      order: ['times'],
      attributes: ['past', 'id', 'title', 'times'],
    });

    return res.json(meetup);
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

  async show(req, res) {
    const { date, page = 1 } = req.query;

    /**
     * definindo formato de data inicial e final
     */
    const parsedDate = parseISO(date);

    /**
     * Buscando dados
     */
    const meetups = await Meetup.findAll({
      where: {
        user_id: req.userId,
        times: { [Op.between]: [startOfDay(parsedDate), endOfDay(parsedDate)] },
      },
      order: ['times'],
      attributes: ['id', 'title', 'description', 'location', 'times', 'past'],
      limit: 10,
      offset: (page - 1) * 10,
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

  async update(req, res) {
    const { id } = req.params;

    const meetup = await Meetup.findByPk(id);

    if (!meetup) {
      return res.status.json({ error: 'Meetup does not exists.' });
    }

    if (meetup.past) {
      return res
        .status(400)
        .json({ error: 'You can not update a finished meetup' });
    }

    if (!(meetup.user_id === req.userId)) {
      return res
        .status(401)
        .json({ error: "You aren't the owner of this meeting" });
    }

    const hourStart = startOfHour(parseISO(meetup.times));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted.' });
    }

    await meetup.update(req.body);

    const {
      title,
      description,
      location,
      times,
      banner,
    } = await Meetup.findByPk(id, {
      include: [
        {
          model: File,
          as: 'banner',
          attributes: ['id', 'path', 'url'],
        },
      ],
    });

    return res.json({ id, title, description, location, times, banner });
  }

  async delete(req, res) {
    const { id } = req.params;

    const meetup = await Meetup.findByPk(id, {
      include: [
        { model: File, as: 'banner', attributes: ['id', 'path', 'url'] },
      ],
    });

    if (!meetup) {
      return res.status(400).json({ error: 'This meetup does not exists.' });
    }

    if (meetup.past) {
      return res
        .status(400)
        .json({ error: 'You can not delete a finished meetup' });
    }

    if (!(meetup.user_id === req.userId)) {
      return res
        .status(400)
        .json({ error: "You aren't the owner of this meeting" });
    }

    /**
     * send mail to inform cancelation meetup
     */

    meetup.subscriptions.map(async a => {
      const Subcribed = await User.findByPk(a);

      if (Subcribed !== null) {
        await Queue.add(CancelationMeetupMail.key, {
          name: Subcribed.name,
          email: Subcribed.email,
          title: meetup.title,
          picture: meetup.banner.url,
          description: meetup.description,
          location: meetup.location,
          times: meetup.times,
        });
      }
    });

    await meetup.destroy();

    return res.json();
  }
}

export default new MeetupController();
