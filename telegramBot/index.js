const { Telegraf } = require('telegraf');
const session = require('telegraf/session');

const OPERATIONS = {
  PLUS: '+',
  MINUS: '-',
}

const OPERATION_KEYS = Object.keys(OPERATIONS);

function getRandomNumber(max = 20) {
  return Math.round(Math.random() * max);
}

function getRandomOperation() {
  return OPERATION_KEYS[Math.floor(Math.random() * OPERATION_KEYS.length)];
}

function getEquationResult(a, operation, b) {
  if (operation === OPERATIONS.PLUS) return a + b;
  if (operation === OPERATIONS.MINUS) return a - b;
}

function getNewEquationData() {
  try { // in case of stack overflow
    const a = getRandomNumber();
    const operation = OPERATIONS[getRandomOperation()];
    const b = getRandomNumber();
    const result = getEquationResult(a, operation, b);
    if (result < 0) return getNewEquationData();
    return {
      equation: `${a} ${operation} ${b}`,
      result: '' + result,
    }
  } catch(err) {
    return {
      equation: '1 + 1',
      result: '2',
    };
  }
}

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(session());

bot.help((ctx) => ctx.reply(`Я задаю пример, ты отвечаешь. Всё!`));

bot.start((ctx) => {
  const { equation, result } = getNewEquationData();
  ctx.session.savedEquation = equation;
  ctx.session.savedAnswer = result;
  ctx.reply(
    `Привет, ${ctx.message.from.username}!\n
    Я бот, который может позадавать тебе примерчики.\n
    Посчитаем?\n
    ${equation}`
  );
});

bot.on('text', (ctx) => {
  const receivedAnswer = ctx.update.message.text;
  const savedAnswer = ctx.session.savedAnswer;

  if (!savedAnswer) {
    const { equation, result } = getNewEquationData();
    ctx.session.savedEquation = equation;
    ctx.session.savedAnswer = result;
    ctx.reply(
      `Начнём!\n
      ${equation}`
    );
    return;
  }

  if (receivedAnswer === savedAnswer) {
    // Генерируем новое выражение:
    const { equation, result } = getNewEquationData();
    ctx.session.savedEquation = equation;
    ctx.session.savedAnswer = result;
    ctx.reply(
      `Правильно!\n
      ${equation}`
    );
    return;
  }

  ctx.reply(
    `Попробуй ещё раз\n
    ${ctx.session.savedEquation}`
  );
});

module.exports.handler = async function (event, context) {
    const message = JSON.parse(event.body);
    await bot.handleUpdate(message);
    return {
        statusCode: 200,
        body: '',
    };
};
