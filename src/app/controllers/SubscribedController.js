import { parseISO, startOfDay, endOfDay } from 'date-fns';
import { Op } from 'sequelize';

import Meetup from '../models/Meetup';
import File from '../models/File';
import User from '../models/User';

class SubscribedController {
  async index(req, res) {
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
}
export default new SubscribedController();
