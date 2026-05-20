const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  AttachmentBuilder,
  ChannelType,
  PermissionFlagsBits,
  Events
} = require('discord.js');
const config = require('./config');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const ticketTypes = {
  staff: { label: 'Contacter le staff', categoryId: config.ticketCategories.staff },
  questionSab: { label: 'Question SAB', categoryId: config.ticketCategories.questionSab },
  autre: { label: 'Autre', categoryId: config.ticketCategories.autre },
  partenariat: { label: 'Partenariat', categoryId: config.ticketCategories.partenariat }
};

const buttonRows = () => [
  new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_staff').setLabel('Contacter le staff').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('ticket_questionSab').setLabel('Question SAB').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('ticket_autre').setLabel('Autre').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('ticket_partenariat').setLabel('Partenariat').setStyle(ButtonStyle.Primary)
  )
];

const ticketActionRow = (state = 'open') => {
  const row = new ActionRowBuilder();
  if (state === 'open') {
    row.addComponents(
      new ButtonBuilder().setCustomId('ticket_close').setLabel('Fermer').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('ticket_claim').setLabel('Claim').setStyle(ButtonStyle.Success)
    );
  } else {
    row.addComponents(
      new ButtonBuilder().setCustomId('ticket_open').setLabel('Ouvrir').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('ticket_delete').setLabel('Supprimer').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('ticket_claim').setLabel('Claim').setStyle(ButtonStyle.Success)
    );
  }
  return [row];
};

const openTicketModal = async (interaction, type) => {
  const modal = new ModalBuilder()
    .setCustomId(`ticket_modal_${type}`)
    .setTitle(`Ouvrir un ticket: ${ticketTypes[type].label}`);

  const titleInput = new TextInputBuilder()
    .setCustomId('ticket_title')
    .setLabel('Titre du ticket')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder('Résumé clair du problème ou de la demande');

  const descriptionInput = new TextInputBuilder()
    .setCustomId('ticket_description')
    .setLabel('Description détaillée')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setPlaceholder('Explique ton problème ou ta demande en détail');

  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(descriptionInput)
  );

  await interaction.showModal(modal);
};

const getTicketContext = (channel) => {
  if (!channel?.topic) return null;
  const match = channel.topic.match(/ticket-user:(\d+) type:(\w+) status:(open|closed)/);
  if (!match) return null;
  return {
    userId: match[1],
    type: match[2],
    status: match[3]
  };
};

const hasActiveTicket = async (guild, userId) => {
  await guild.channels.fetch();
  return guild.channels.cache.some((channel) => channel.topic?.includes(`ticket-user:${userId}`));
};

const buildTicketEmbed = (user, typeLabel, title, description) =>
  new EmbedBuilder()
    .setTitle(`Ticket: ${typeLabel}`)
    .setDescription(`**Auteur:** <@${user.id}>\n**Titre:** ${title}\n**Description:** ${description}`)
    .setColor(0x00ae86)
    .setTimestamp()
    .setFooter({ text: `Ticket créé par ${user.tag}` });

const buildActionMessage = (state = 'open') => {
  const embed = new EmbedBuilder()
    .setTitle(state === 'open' ? 'Ticket ouvert' : 'Ticket fermé')
    .setDescription(
      state === 'open'
        ? 'Utilise les boutons pour fermer, claim ou supprimer le ticket.'
        : 'Le ticket est marqué comme fermé. Tu peux l’ouvrir à nouveau ou le supprimer.'
    )
    .setColor(state === 'open' ? 0x00ae86 : 0xe74c3c)
    .setTimestamp();
  return { embeds: [embed], components: ticketActionRow(state) };
};

const createTranscript = async (channel) => {
  const fetched = await channel.messages.fetch({ limit: 100 });
  const ordered = Array.from(fetched.values()).reverse();
  const lines = ordered.map((message) => {
    const time = new Date(message.createdTimestamp).toLocaleString('fr-FR');
    const content = message.content || '';
    const attachments = message.attachments.size > 0 ? ` [ATTACHMENTS: ${message.attachments.map((a) => a.url).join(', ')}]` : '';
    return `[${time}] ${message.author.tag}: ${content}${attachments}`;
  });
  return Buffer.from(lines.join('\n'), 'utf-8');
};

client.once(Events.ClientReady, () => {
  console.log(`Connecté en tant que ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'tick') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({ content: 'Tu dois être administrateur pour utiliser cette commande.', ephemeral: true });
        }

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle('Création de ticket')
              .setDescription('Choisis ton type de ticket ci-dessous. Chaque option demandera un titre et une description détaillée.')
              .setColor(0x0099ff)
          ],
          components: buttonRows(),
          ephemeral: true
        });
      }
      return;
    }

    if (interaction.isButton()) {
      const customId = interaction.customId;

      if (customId.startsWith('ticket_') && customId !== 'ticket_close' && customId !== 'ticket_open' && customId !== 'ticket_delete' && customId !== 'ticket_claim') {
        const type = customId.replace('ticket_', '');
        if (!ticketTypes[type]) {
          return interaction.reply({ content: 'Type de ticket inconnu.', ephemeral: true });
        }
        return openTicketModal(interaction, type);
      }

      const channel = interaction.channel;
      const context = getTicketContext(channel);
      if (!context) {
        return interaction.reply({ content: 'Ce canal n’est pas un ticket valide.', ephemeral: true });
      }

      if (customId === 'ticket_close') {
        const authorCanClose = interaction.user.id === context.userId || interaction.member.roles.cache.has(config.staffRoleId);
        if (!authorCanClose) {
          return interaction.reply({ content: 'Tu n’as pas la permission de fermer ce ticket.', ephemeral: true });
        }
        await channel.setTopic(`ticket-user:${context.userId} type:${context.type} status:closed`);
        await channel.send({ content: `Ticket fermé par <@${interaction.user.id}>.` });
        return interaction.update(buildActionMessage('closed'));
      }

      if (customId === 'ticket_open') {
        const authorCanOpen = interaction.user.id === context.userId || interaction.member.roles.cache.has(config.staffRoleId);
        if (!authorCanOpen) {
          return interaction.reply({ content: 'Tu n’as pas la permission de rouvrir ce ticket.', ephemeral: true });
        }
        await channel.setTopic(`ticket-user:${context.userId} type:${context.type} status:open`);
        await channel.send({ content: `Ticket rouvert par <@${interaction.user.id}>.` });
        return interaction.update(buildActionMessage('open'));
      }

      if (customId === 'ticket_claim') {
        if (!interaction.member.roles.cache.has(config.staffRoleId)) {
          return interaction.reply({ content: 'Seuls les membres du staff peuvent claim ce ticket.', ephemeral: true });
        }
        await channel.send({ content: `Ticket claimé par <@${interaction.user.id}>.` });
        return interaction.reply({ content: 'Ticket claimé.', ephemeral: true });
      }

      if (customId === 'ticket_delete') {
        if (!interaction.member.roles.cache.has(config.staffRoleId)) {
          return interaction.reply({ content: 'Seuls les membres du staff peuvent supprimer ce ticket.', ephemeral: true });
        }

        await interaction.reply({ content: 'Suppression en cours, transcription en préparation...', ephemeral: true });
        const transcriptBuffer = await createTranscript(channel);
        const transcriptFile = new AttachmentBuilder(transcriptBuffer, { name: `${channel.name}-transcript.txt` });

        try {
          const targetUser = await client.users.fetch(context.userId);
          await targetUser.send({ content: `Voici la transcription de ton ticket ${channel.name}.`, files: [transcriptFile] });
        } catch (error) {
          console.warn('Impossible d’envoyer la transcription en MP:', error);
        }

        await channel.delete(`Ticket supprimé par ${interaction.user.tag}`);
      }

      return;
    }

    if (interaction.isModalSubmit()) {
      const customId = interaction.customId.replace('ticket_modal_', '');
      const type = interaction.customId.replace('ticket_modal_', '');
      if (!ticketTypes[type]) {
        return interaction.reply({ content: 'Type de ticket inconnu.', ephemeral: true });
      }

      const title = interaction.fields.getTextInputValue('ticket_title');
      const description = interaction.fields.getTextInputValue('ticket_description');
      if (!title || !description) {
        return interaction.reply({ content: 'Le titre et la description sont requis.', ephemeral: true });
      }

      const guild = interaction.guild;
      if (await hasActiveTicket(guild, interaction.user.id)) {
        return interaction.reply({ content: 'Tu as déjà un ticket ouvert. Tu dois le fermer ou le supprimer avant d’en ouvrir un nouveau.', ephemeral: true });
      }

      const categoryId = ticketTypes[type].categoryId;
      if (!categoryId) {
        return interaction.reply({ content: 'La catégorie du ticket n’est pas configurée.', ephemeral: true });
      }

      const channelName = `ticket-${type}-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)}-${interaction.user.discriminator}`;
      const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: categoryId,
        topic: `ticket-user:${interaction.user.id} type:${type} status:open`,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          },
          {
            id: config.staffRoleId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          }
        ]
      });

      await channel.send({
        content: `<@&${config.ticketMentionRoleId}> <@${interaction.user.id}>`,
        embeds: [buildTicketEmbed(interaction.user, ticketTypes[type].label, title, description)],
        components: ticketActionRow('open')
      });

      return interaction.reply({ content: `Ton ticket a été créé dans ${channel}.`, ephemeral: true });
    }
  } catch (error) {
    console.error('Erreur d’interaction:', error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'Une erreur est survenue.', ephemeral: true });
    } else {
      await interaction.reply({ content: 'Une erreur est survenue.', ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
