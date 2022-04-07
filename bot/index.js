const Discord = require('discord.js');
// get the bot token from the env
console.log(require('dotenv').config({path: `${__dirname}/.env`}));

// all intents
const allIntents = new Discord.Intents(32767);
// create a new discord client
const client = new Discord.Client({ 'disableEveryone': true, 'intents': allIntents });

const PREFIX = '.';
const TOKEN = process.env.TOKEN;

// log into the bot
client.login(TOKEN);

// messages
client.on('messageCreate', message => {
    console.log('message received', message);
    // if the command has the prefix
    if(message.content.startsWith(PREFIX)) {
        const args = message.content.slice(PREFIX.length).split(' ');   // get the arguments
        const command = args.shift().toLowerCase();  // get the command
        // get latency command
        if(command === 'ping') {
            let embed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Ping!')
                .setDescription('Pong! The latency to the server.')
                .addField('Latency', `${Date.now() - message.createdTimestamp}ms`, true)
                .addField('API Latency', `${Math.round(client.ws.ping)}ms`, true);
            message.reply({ embeds: [embed] });
        }

        if(command === 'eval'){
            if(message.author.id == 577082051895754782){
                try {
                    const code = args.join(' ');
                    let evaled = eval(code);
                    if (typeof evaled !== 'string')
                        evaled = require('util').inspect(evaled);
                    message.channel.send(clean(evaled), {code:'xl'});
                } catch (err) {
                    message.channel.send(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
                }
            }
        }

        // silent eval command, doesn't send the output
        if(command === 'seval' || command === 'evil'){
            if(message.author.id == 577082051895754782){
                try {
                    const code = args.join(' ');
                    eval(code);
                } catch (err) {
                    console.log(err);
                }
            }
        }
    }
});

function clean(text) {
    if (typeof(text) === 'string')
        return text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203));
    else
        return text;
}

// when the client is opened
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});