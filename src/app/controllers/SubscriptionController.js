import { Op } from 'sequelize';
import { subHours, isBefore, format } from 'date-fns';
import pt from 'date-fns/locale/pt';

import Meetup from '../models/Meetup';
import File from '../models/File';
import User from '../models/User';
import Notification from '../schemas/Notification';

class SubscriptionController {
  async index(req, res) {
    /**
     * Crie uma rota para listar os meetups em que o usuário logado está inscrito.
     * Liste apenas meetups que ainda não passaram e ordene meetups mais próximos como primeiros da lista.
     */

    const { page = 1 } = req.query;

    const meetup = await Meetup.findAll({
      where: {
        subscriptions: { [Op.contains]: [req.userId] },
        times: { [Op.gt]: new Date() },
      },
      order: [['times', 'DESC']],
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
          attributes: ['id'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });

    return res.json(meetup);
  }

  async store(req, res) {
    const meetup = await Meetup.findByPk(req.body.id);

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

    /**
     * Check user Subscribed
     */

    if (meetup.subscriptions.includes(req.userId)) {
      return res.status(401).json({ error: 'User already subscribed.' });
    }

    /**
     * check if User Subscribed other meetup on same date
     */
    const meetupCompar = await Meetup.findOne({
      where: {
        subscriptions: { [Op.contains]: [req.userId] },
        times: meetup.times,
      },
    });

    if (meetupCompar) {
      return res.json({ error: 'User subscribed for meetup on the same date' });
    }

    /**
     * save data
     */
    await meetup.update({
      subscriptions: [req.userId, ...meetup.subscriptions],
    });

    const {
      id,
      title,
      description,
      location,
      times,
      subscriptions,
      banner,
      user,
    } = await Meetup.findByPk(req.body.id, {
      include: [
        {
          model: File,
          as: 'banner',
          attributes: ['id', 'path', 'url'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });

    /**
     * Notify Subscribed in Meetup
     */
    const userSubscribed = await User.findByPk(req.userId);
    const formattedDate = format(times, "'dia' dd 'de' MMMM', às' H:mm'h'", {
      locale: pt,
    });

    await Notification.create({
      content: `${userSubscribed.name} se inscriveu para o Meetup ${title} do ${formattedDate} `,
      user_id: user.id,
    });

    return res.json({
      id,
      title,
      description,
      location,
      times,
      subscriptions,
      banner,
      user,
    });
  }

  async delete(req, res) {
    const meetup = await Meetup.findOne({ where: { id: req.params.id } });

    if (!meetup) {
      return res.status(400).json({ error: 'Meetup does not exists.' });
    }

    if (!meetup.subscriptions.includes(req.userId)) {
      return res
        .status(401)
        .json({ error: 'User is not subscribed in meetup' });
    }

    if (meetup.past) {
      return res
        .status(400)
        .json({ error: 'You can not canceled subscription a finished meetup' });
    }

    const dataWithSub = subHours(meetup.date, 2);

    if (isBefore(dataWithSub, new Date())) {
      return res.status(401).json({
        error: 'You can only cancel subscribed 2 hours in advance.',
      });
    }

    const removeSubscribed = subs => {
      subs.splice(subs.indexOf(req.userId), 1);
      return subs;
    };
    const AlterSub = removeSubscribed(meetup.subscriptions);

    await meetup.update(AlterSub);

    const {
      id,
      title,
      description,
      location,
      times,
      subscriptions,
      createdAt,
      updatedAt,
      user_id,
      banner,
    } = await Meetup.findByPk(req.params.id, {
      include: [
        {
          model: File,
          as: 'banner',
          attributes: ['id', 'path', 'url'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });

    const { name, avatar } = User.findByPk(user_id, {
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['path', 'url'],
        },
      ],
    });

    return res.json({
      id,
      title,
      description,
      location,
      times,
      subscriptions,
      createdAt,
      updatedAt,
      banner,
      user_id,
      name,
      avatar,
    });
  }
}

export default new SubscriptionController();
