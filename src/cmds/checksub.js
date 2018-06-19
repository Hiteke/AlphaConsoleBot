// https://api.twitch.tv/kraken/channels/alphaconsole/subscriptions?client_id=o9wsz9f60ig0ir8ntkaaxkms4m1dl3

/**
 * ! Checksub command
 * 
 * ? Kinda obvious, too lazy to write anything smart anyway
 * ? We also have command description for a reason. So I actually don't know why I added this here. Welp...
 */
const Discord = require('discord.js');
const request = require('request');

module.exports = {
     title: "Checksub",
     details: [
        {
            perms      : "Moderator",
            command    : "!Checksub <Twitch name>",
            description: "Shows if the user is subbed or not."
        }
    ],

    run: ({ client, serverInfo, message, args, sql, config, sendEmbed }) => {

        try {
            if (!message.member.isModerator) return;
            if (args.length < 2) return sendEmbed(message.channel, "You must have forgotten the user", "`!checksub <Twitch name>`")

            let twitchName = "";
            for (let i = 1; i < args.length; i++) twitchName += args[i] + " ";
            twitchName = twitchName.trim();

            message.channel.send("<a:typing:395451633930076190> **Fetching all Twitch users...**").then(m => {
                getSubList(config.keys.TwitchClientID, config.keys.TwitchOauth).then(list => {
                    let filtered = list.filter(s => s.user.name.toLowerCase().includes(twitchName.toLowerCase()));
                    m.delete();

                    if (filtered.length === 1) {
                        let u = filtered[0];

                        const embed = new Discord.MessageEmbed()
                            .setAuthor("Sub check on " + u.user.display_name, client.user.displayAvatarURL({ format: "png" }))
                            .setThumbnail(u.user.logo)
                            .addField("Subscribed on", new Date(u.created_at).toUTCString())
                            .setColor([255, 255, 0])
                        message.channel.send(embed);
                    } else if (filtered.length > 1) {
                        let users = "";
                        for (let i = 0; i < filtered.length; i++) {
                            const e = filtered[i];
                            
                            users += `- ${e.user.name}\n`;

                            if (users.length > 1900) {
                                users += `And ${filtered.length - (i + 1)} more...`
                                break;
                            }
                        }

                        sendEmbed(message.channel, "Multiple twitch users found", `\`\`\`${users}\`\`\``);
                    } else {
                        sendEmbed(message.channel, "No twitch users found with provided name")
                    }
                })
            })

        } catch(e) {
            console.log(e);
        }

    }
};

async function getSubList(clientid, token) {
    return new Promise(async (resolve, reject) => {
        let link = `https://api.twitch.tv/kraken/channels/alphaconsole/subscriptions?direction=asc&limit=100&offset=`;
        let more = true;
        let offset = 0;
        let list = [];
    
        while(more) {
            res = await apiCall(`${link}${offset}`, clientid, token);
    
            if (!res) more = false;
            if (res && res.subscriptions && res.subscriptions.length === 0) more = false;
            offset += 100;
    
            list = list.concat(res.subscriptions)
        }

        resolve(list);
    })
}

function apiCall(url, clientid, token) {
    return new Promise(function(resolve, reject){
        request(url, {
            headers: {
                'Client-ID': clientid,
                'Authorization': `OAuth ${token}`
            }
        }, (err, res, body) => {
            if (err) return reject(err);

            let data = JSON.parse(body);
            resolve(data);

        })
    });
}