const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder()
    .setName('tick')
    .setDescription('Ouvre le panneau de création de ticket')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(InteractionContextType.Guild)
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Déploiement des commandes slash...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('Commandes slash déployées avec succès.');
  } catch (error) {
    console.error('Erreur pendant le déploiement des commandes:', error);
    process.exit(1);
  }
})();o
