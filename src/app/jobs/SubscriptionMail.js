import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/mail';

class SubscriptionMail {
  get key() {
    return 'SubscriptionMail';
  }

  async handle({ data }) {
    const meetup = data;

    await Mail.sendMail({
      to: `${meetup.user.name} <${meetup.user.email}>`,
      subject: 'Novo Inscrito',
      template: 'subscription',
      context: {
        owner: meetup.user.name,

        picture: meetup.userSubscribed.avatar.url,
        name: meetup.userSubscribed.name,
        email: meetup.userSubscribed.email,

        title: meetup.title,
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
export default new SubscriptionMail();
