module.exports = {
  MESSAGE_TYPE: 'scat_message',
  ABOUT: 'about',
  CONTACT: 'contact',
  MODE: {
    PUBLIC: 'PUBLIC',
    PRIVATE: 'PRIVATE'
  },
  PROGRAM_DIR: '.scat',
  TIME_WINDOW: 7 * 24 * 60 * 60 * 1000, // 7 days
  COMMAND_TEXT: {
    INVALID: 'Invalid command',
    FOLLOW: {
      BAD_ARGS: 'No id specified'
    },
    IDENTIFY: {
      BAD_ARGS: 'Need an id and a name'
    },
    QUIT: {
      FROM_PUBLIC: 'quit leaves private mode'
    },
    PUB: {
      BAD_ARGS: 'No invite code specified',
      SUCCESS: 'Pub joined successfully',
      FAILURE: 'Could not join pub'
    },
    NAME: {
      BAD_ARGS: 'No name specified',
      SUCCESS: 'Name set successfully',
      FAILURE: 'Could not set name'
    },
    WHOIS: {
      BAD_ARGS: 'No id specified to lookup'
    },
    WHOAMI: {
      FAILURE: 'Could not figure out who you are'
    },
    PRIVATE: {
      NO_RECIPIENTS: 'You must specify recipients to enter private mode',
      TOO_MANY_RECIPIENTS: 'You can only send a private message to up to 7 recipients',
      INVALID_FEED_IDS: 'Could not determine feed ids for all recipients'
    }
  }
}
