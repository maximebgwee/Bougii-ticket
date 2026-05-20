const { Colors, ContainerBuilder, SeparatorSpacingSize,ButtonStyle,ModalBuilder,TextInputBuilder,TextInputStyle,ActionRowBuilder } = require("discord.js");
const {ticketTypes} = require("../index")


class ticketUi{
    /**Gestion du modal */
    static openTicketModal = async (interaction, type) => {
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
    
      return await interaction.showModal(modal);
    };

    static containerTicket(){
        return new ContainerBuilder().setAccentColor(Colors.Orange).addTextDisplayComponents(t=>t.setContent('📋 Création de Ticket'))
        .addSectionComponents(s=>s.addTextDisplayComponents(t=>t.setContent( '👮 **Contacter le staff** — Ouvre un ticket pour contacter le staff.'))
        .setButtonAccessory(btn=>btn.setCustomId('ticket_staff').setLabel('👮 Contacter le staff').setStyle(ButtonStyle.Success)))
        /**Première Séparation */
        .addSeparatorComponents(s=>s.setSpacing(SeparatorSpacingSize.Small))
        /**Deuxième Sections */
        .addSectionComponents(s=>s.addTextDisplayComponents(t=>t.setContent('❓ **Question SAB** — Pose une question à propos de SAB.'))
        .setButtonAccessory(btn=>btn.setCustomId('ticket_questionSab').setLabel('❓ Question SAB').setStyle(ButtonStyle.Primary)))
        .addSeparatorComponents(s=>s.setSpacing(SeparatorSpacingSize.Small))
        /**Troisième Sections */
        .addSectionComponents(s=>s.addTextDisplayComponents(t=>t.setContent( '📝 **Autre** — Demande générale ou autre sujet.'))
        .setButtonAccessory(btn=>btn.setCustomId('ticket_autre').setLabel('📝 Autre').setStyle(ButtonStyle.Danger)))
        .addSeparatorComponents(s=>s.setSpacing(SeparatorSpacingSize.Small))
        /**Quatrième Sections */
        .addSectionComponents(s=>s.addTextDisplayComponents(t=>t.setContent('🤝 **Partenariat** — Proposition ou demande de partenariat.'))
        .setButtonAccessory(btn=>btn.setCustomId('ticket_partenariat').setLabel('🤝 Partenariat').setStyle(ButtonStyle.Secondary)))
        .addSeparatorComponents(s=>s.setSpacing(SeparatorSpacingSize.Small))
    }
}
module.exports = { ticketUi };