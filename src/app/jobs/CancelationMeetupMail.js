import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/mail';

class CancelationMeetupMail {
  get key() {
    return 'CancelationMeetupMail';
  }

  async handle({ data }) {
    const meetup = data;

    await Mail.sendMail({
      to: `${meetup.name} <${meetup.email}>`,
      subject: 'Cancelamento da Meetup',
      template: 'cancellation',
      context: {
        user: meetup.name,

        title: meetup.title,
        picture: meetup.picture,
        description: meetup.description,
        location: meetup.location,

        date: format(
          parseISO(meetup.times),
          "dd 'de' MMMM' de 'yyyy', às' H:mm'h'",
          {
            locale: pt,
          }
        ),
      },
    });
  }
}

export default new CancelationMeetupMail();
