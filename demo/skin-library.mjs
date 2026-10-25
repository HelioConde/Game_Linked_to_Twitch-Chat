// Galeria das 20 skins de 2026. Caminhos relativos a /demo/.
export const SKINS = Object.freeze([
  Object.freeze({ id: 1, name: "Cavaleiro", image: "../img/characters-v2/skin-01-knight.webp" }),
  Object.freeze({ id: 2, name: "Maga Arcana", image: "../img/characters-v2/skin-02-arcane-mage.webp" }),
  Object.freeze({ id: 3, name: "Arqueira da Floresta", image: "../img/characters-v2/skin-03-forest-ranger.webp" }),
  Object.freeze({ id: 4, name: "Ladino", image: "../img/characters-v2/skin-04-rogue.webp" }),
  Object.freeze({ id: 5, name: "Clériga", image: "../img/characters-v2/skin-05-cleric.webp" }),
  Object.freeze({ id: 6, name: "Domadora de Slimes", image: "../img/characters-v2/skin-06-slime-tamer.webp" }),
  Object.freeze({ id: 7, name: "Bruxa das Chamas", image: "../img/characters-v2/skin-07-fire-witch.webp" }),
  Object.freeze({ id: 8, name: "Bardo", image: "../img/characters-v2/skin-08-bard.webp" }),
  Object.freeze({ id: 9, name: "Monge", image: "../img/characters-v2/skin-09-monk.webp" }),
  Object.freeze({ id: 10, name: "Paladina", image: "../img/characters-v2/skin-10-paladin.webp" }),
  Object.freeze({ id: 11, name: "Necromante", image: "../img/characters-v2/skin-11-necromancer.webp" }),
  Object.freeze({ id: 12, name: "Engenheiro", image: "../img/characters-v2/skin-12-engineer.webp" }),
  Object.freeze({ id: 13, name: "Druida", image: "../img/characters-v2/skin-13-druid.webp" }),
  Object.freeze({ id: 14, name: "Pirata", image: "../img/characters-v2/skin-14-pirate.webp" }),
  Object.freeze({ id: 15, name: "Samurai", image: "../img/characters-v2/skin-15-samurai.webp" }),
  Object.freeze({ id: 16, name: "Alquimista", image: "../img/characters-v2/skin-16-alchemist.webp" }),
  Object.freeze({ id: 17, name: "Feiticeira do Gelo", image: "../img/characters-v2/skin-17-ice-sorcerer.webp" }),
  Object.freeze({ id: 18, name: "Caçador", image: "../img/characters-v2/skin-18-beast-hunter.webp" }),
  Object.freeze({ id: 19, name: "Assassino Sombrio", image: "../img/characters-v2/skin-19-shadow-assassin.webp" }),
  Object.freeze({ id: 20, name: "Valquíria", image: "../img/characters-v2/skin-20-valkyrie.webp" })
]);
export function getSkin(skin) {
  const value = Number(skin);
  return Number.isInteger(value) && value >= 1 && value <= SKINS.length ? SKINS[value - 1] : SKINS[0];
}
