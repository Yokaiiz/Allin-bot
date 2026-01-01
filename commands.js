async function ping(context) {
    return context.reply({ content: 'Pong!' });
}

module.exports = { ping };