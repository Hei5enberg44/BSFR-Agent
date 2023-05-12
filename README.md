<h1>bsfr-agent</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-2.21.0-blue.svg?cacheSeconds=2592000" />
  <a href="#" target="_blank">
    <img alt="License: ISC" src="https://img.shields.io/badge/License-ISC-yellow.svg" />
  </a>
  <a href="https://twitter.com/BltAntoine" target="_blank">
    <img alt="Twitter: BltAntoine" src="https://img.shields.io/twitter/follow/BltAntoine.svg?style=social" />
  </a>
</p>

> Bot d'administration pour le Discord Beat Saber FR

## Pré-requis

- FFMPEG (pour le téléchargement des clips/vidéos Twitch)
- Serveur NextCloud (pour l'hébergement des clips Twitch)
- Clé d'API Twitch (pour le téléchargement des clips Twitch postés dans le salon #clips)
- Clé d'API Google (pour la publication des nouvelles vidéos sur la chaîne YouTube BSFR)

## Installation

```sh
npm install
npm run build
```

## Configuration

Compléter le fichier `src/config.json` avec les données correspondantes au serveur.

## Liste des commandes

- ### /ping : Test si le bot fonctionne

Permet de tester si le bot est en ligne.

__Exemples :__

```
/ping
```

***

- ### /lister : Listes diverses

Permet de lister les mots à bannir, les messages d'anniversaire ou les URL malveillants.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **sujet** | ☑ | Choix parmis `Message d'anniversaire`, `URL malveillant` |
| **page** |   | Numéro de page à afficher |

__Exemples :__

```
/list sujet:Message d'anniversaire
/list sujet:URL malveillant page:3
```

***

- ### /ajouter : Ajouts divers

Permet d'ajouter des messages d'anniversaire ou des URL malveillants.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **sujet** | ☑ | Choix parmis `Message d'anniversaire`, `URL malveillant` |
| **texte** | ☑ | Message d'anniversaire ou URL malveillant |

__Exemples :__

```
/add sujet:Message d'anniversaire texte:Bon anniversaire !
/add sujet:URL malveillant texte:app-discordc.com
```

***

- ### /supprimer : Suppressions diverses

Permet de supprimer des mots à bannir, des messages d'anniversaire ou des URL malveillants.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **sujet** | ☑ | Choix parmis `Message d'anniversaire`, `URL malveillant` |
| **texte** | ☑ | Liste des identifiants pour les messages d'anniversaire ou URL malveillants à supprimer séparés par un point virgule `;` |

__Exemples :__

```
/remove sujet:Message d'anniversaire ids:1
/remove sujet:URLs malveillants ids:1;2;3;4;5
```

***

- ### /avatar : Récupère l'avatar d'un membre

Permet d'afficher votre avatar ou celui d'un membre.

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **membre** |   | Membre de la guild |
| **extension** |   | Extension de l'image (défaut: png) |
| **taille** |   | Taille de l'image (défaut: 1024) |
| **statique** |   | Force l'affichage statique de l'image (défaut: True) |

__Exemples :__

```
/avatar
/avatar extension:png taille:512
/avatar membre:@Hei5enberg#6969 statique:True
```

***

- ### /anniversaire ajouter : Ajoute votre date d'anniversaire

Permet d'ajouter votre date d'anniversaire à la base de données afin que le bot vous le souhaite le jour J.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **date** | ☑ | Date au format `JJ/MM/AAAA` |

__Exemples :__

```
/anniversaire ajouter date:02/11/1995
```

***

- ### /anniversaire supprimer : Supprime votre date d'anniversaire

Permet de supprimer votre date d'anniversaire de la base de données.

__Exemples :__

```
/anniversaire supprimer
```

***

- ### /mute : Mute un membre

Permet de mute un membre sur une période définie.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **membre** | ☑ | Membre de la guild |
| **raison** | ☑ | Raison du mute |
| **durée** | ☑ | Durée du mute (s = secondes, i = minutes, h = heures, d = jours, w = semaines, m = mois, y = années) |

__Exemples :__

```
/mute membre:@Hei5enberg#6969 raison:Spam durée:1d
```

***

- ### /unmute : Unmute un membre

Permet d'unmute un membre en cours de mute.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **membre** | ☑ | Membre de la guild |
| **raison** | ☑ | Raison du unmute |

__Exemples :__

```
/unmute membre:@Hei5enberg#6969 raison:S'est calmé
```

***

- ### /ban : Ban un membre

Permet de ban un membre sur une période définie.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **membre** | ☑ | Membre de la guild |
| **raison** | ☑ | Raison du ban |
| **durée** | ☑ | Durée du ban (s = secondes, i = minutes, h = heures, d = jours, w = semaines, m = mois, y = années) |

__Exemples :__

```
/ban membre:@Hei5enberg#6969 raison:Fishing durée:10y
```

***

- ### /envoyer : Envoie un message dans un salon

Permet d'envoyer un message par l'Agent dans un salon.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **salon** | ☑ | Salon dans lequel envoyer le message |
| **message** | ☑ | Message à envoyer |

__Exemples :__

```
/envoyer salon:#général message:Coucou !
```

***

- ### /log : Récupère un fichier de log

Permet d'afficher les logs du bot pour une date donnée.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **date** |   | Date du fichier de log à afficher au format `JJ/MM/AAAA` |

__Exemples :__

```
/log
/log date:28/04/2022
```

***

- ### /roles liste : Liste vos rôles

Permet de récupérer la liste de vos rôles auto-assignables.

__Exemples :__

```
/roles liste
```

***

- ### /roles ajouter <catégorie> : Ajoute un rôle pour la catégorie `<catégorie>`

Permet de vous attribuer un rôle auto-assignables pour la catégorie donnée.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **role** | ☑ | Rôle pour la catégorie `<catégorie>` à ajouter |

__Exemples :__

```
/roles ajouter notification role:Annonce
```

***

- ### /roles supprimer <catégorie> : Supprime un rôle pour la catégorie `<catégorie>`

Permet de vous retirer un rôle auto-assignables pour la catégorie donnée.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **role** | ☑ | Rôle pour la catégorie `<catégorie>` à supprimer |

__Exemples :__

```
/roles supprimer notification role:Annonce
```

***

- ### /dm : Envoie un message privé à un membre

Permet d'envoyer un message privé de la part de l'Agent à un membre de la guild.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **membre** | ☑ | Membre de la guild |
| **message** | ☑ | Message |

__Exemples :__

```
/dm membre:@Hei5enberg#6969 message:Coucou !
```

***

- ### /r : Répond à un message privé

Permet de répondre à un message privé via un thread de messages privés.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **message** | ☑ | Message |

__Exemples :__

```
/r message:Coucou !
```

***

- ### /ville ajouter : Ajoute votre ville de résidence

Permet d'ajouter votre ville de résidence à la base de données.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **code_postal** | ☑ | Code postal |

__Exemples :__

```
/ville ajouter code_postal:46800
```

***

- ### /ville supprimer : Supprime votre ville de résidence

Permet de supprimer votre ville de résidence de la base de données.

__Exemples :__

```
/ville supprimer
```

***

- ### /twitch ajouter : Lie un compte Twitch à membre

Lie un compte Twitch afin d'activer les notifications lorsque le streameur est en live.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **chaine** | ☑ | Nom de la chaîne Twitch à lier au membre |

__Exemples :__

```
/twitch ajouter chaine:hei5enberg44
```

***

- ### /twitch supprimer : Délie un compte Twitch d'un membre

Délie le compte Twitch afin de désactiver les notifications lorsque le streameur est en live.

__Exemples :__

```
/twitch supprimer
```

***

- ### /sondage : Créé un sondage

Permet de créer un sondage et d'afficher les résultats en temps réel.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **titre** | ☑ | Titre du sondage |
| **liste** | ☑ | Liste des propositions séparées par un point virgule |
| **date_fin** | ☑ | Date de fin du sondage au format JJ/MM/AAAA HH:II (ex: 07/09/2022 15:30) |
| **emojis** |   | Emojis personnalisés séparés par un point virgule (doit correspondre au nombre de propositions) |

__Exemples :__

```
/sondage titre:Sondage de test liste:Proposition 1;Proposition 2;Proposition 3 date_fin:06/09/2022 20:00
/sondage titre:Sondage de test liste:Proposition 1;Proposition 2;Proposition 3 date_fin:07/09/2022 15:30 emojis:💀;💩;😂
```

***

- ### /cooldown ajouter : Ajoute un membre à la liste des cooldowns

Permet d'ajouter un membre à la liste des cooldowns afin que celui-ci soit mute en cas de spam de messages.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **membre** | ☑ | Membre de la guild |
| **seuil_temps** |   | Seuil de temps entre le premier et le dernier message envoyé (en secondes) |
| **seuil_nombre** |   | Nombre de messages envoyés dans le seuil de temps |
| **durée_mute** |   | Durée du mute du membre (en secondes) |

__Exemples :__

```
/cooldown ajouter membre:@Hei5enberg#6969
/cooldown ajouter membre:@Hei5enberg#6969 seuil_temps:10 seuil_nombre:3 durée_mute:10
```

***

- ### /cooldown supprimer : Supprime un membre de la liste des cooldowns

Permet de supprimer un membre de la liste des cooldowns. Celui-ci ne sera plus mute en cas de spam de messages.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **membre** | ☑ | Membre de la guild |

__Exemples :__

```
/cooldown supprimer membre:@Hei5enberg#6969
```

***

- ### /cooldown liste : Liste les membres en cooldown

Permet de lister les membres en cooldown.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **page** |   | Numéro de page à afficher |

__Exemples :__

```
/cooldown liste
/cooldown liste page:3
```

***

- ### /rejoindre : Rejoindre à salon vocal

Permet d'envoyer Agent dans un salon vocal.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **salon** | ☑ | Salon dans lequel envoyer @Agent |

__Exemples :__

```
/rejoindre salon:🔊Vocal
```

***

- ### /partir : Partir d'un salon vocal

Permet de faire partir Agent d'un salon vocal.

__Exemples :__

```
/partir
```

***

- ### /parler : Parler dans un salon vocal

Permet de faire prononcer une phrase à @Agent via tts.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **message** | ☑ | Message vocal à envoyer |
| **salon** |   | Salon dans lequel envoyer le message vocal |
| **voix** |   | Voix à utiliser |

__Exemples :__

```
/parler message:Salut !
/parler salon:🔊Vocal message:Coucou !
/parler salon:🔊Vocal message:Bonjour à tous ! voix:Femme — Français
```

## Auteur

👤 **Hei5enberg#6969**

* Site Web: [bsaber.fr](https://bsaber.fr)
* Twitter: [@BltAntoine](https://twitter.com/BltAntoine)
* Github: [@hei5enberg44](https://github.com/hei5enberg44)