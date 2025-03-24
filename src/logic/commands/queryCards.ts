import { GuildTextBasedChannel, TextBasedChannel } from 'discord.js';

import constants from '../constants';
import { ICard } from '../../models';
import { Log } from '../common/logging.js';
import { generateCardMessage } from '../common/card-helper';
import { scryfallQuery } from '../common/scryfall';

/**
 * Finds all cards in the given set that and post them to the given channel
 * @param {*} ignoreBasics if true, will not post the standard basic lands (plains, island, swamp, mountain, forest)
 */
export function queryCardsCommand(
  channel: GuildTextBasedChannel | TextBasedChannel,
  query: string,
  ignoreBasics = true
) {
  let message = `Trying to get cards with query ${query}`;

  if (ignoreBasics != false) {
    message += ' (excluding basic lands)';
  }
  channel.send(`${message}...`);

  scryfallQuery(query, ignoreBasics, _getQueryMessages)
    .then((messages) => {
      Log(`Sending ${messages.length} cards to channel with id ${channel.id}`);
      let interval = setInterval(
        function (messages) {
          if (messages.length <= 0) {
            Log(`Done with sending cards to channel with id ${channel.id}`);
            clearInterval(interval);
          } else {
            let message = messages.pop();
            channel.send(message);
          }
        },
        constants.MESSAGEINTERVAL,
        messages
      );
    })
    .catch((err) => {
      channel.send(err);
    });
}

function _getQueryMessages(cards: ICard[]): Promise<string[]> {
  let messages = new Array<string>();
  cards.forEach((card) => {
    let message = generateCardMessage(card);
    messages.push(message);
  });
  return Promise.resolve(messages);
}
