<h1>bsfr-agent</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-2.4.1-blue.svg?cacheSeconds=2592000" />
  <a href="#" target="_blank">
    <img alt="License: ISC" src="https://img.shields.io/badge/License-ISC-yellow.svg" />
  </a>
  <a href="https://twitter.com/BltAntoine" target="_blank">
    <img alt="Twitter: BltAntoine" src="https://img.shields.io/twitter/follow/BltAntoine.svg?style=social" />
  </a>
</p>

> Bot d'administration pour le Discord Beat Saber FR

## Pré-requis

- Serveur NextCloud (pour l'hébergement des clips Twitch)
- Clé d'API Twitch (pour le téléchargement des clips Twitch postés dans le channel #clips)
- Clé d'API Twitter (pour l'envoi de Tweets via le bot)
- Clé d'API Google (pour la publication des nouvelles vidéos sur la chaîne YouTube BSFR)
- Clé d'API VirusTotal (pour le scan antivirus des fichiers uploadés sur le serveur)

## Installation

```sh
npm install
```

## Configuration

Compléter le fichier `config.json` à la racine du projet avec les données correspondantes au serveur.

## Liste des commandes

- ### /ping : Test si le bot fonctionne

Permet de tester si le bot est en ligne.

__Exemples :__

```
/ping
```

***

- ### /list : Listes diverses

Permet de lister les mots à bannir, les messages d'anniversaire ou les URL malveillants.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **sujet** | ☑ | Choix parmis `Mots à bannir`, `Message d'anniversaire`, `URL malveillant` |
| **page** | ☐ | Numéro de page à afficher |

__Exemples :__

```
/list sujet:Mots à bannir
/list sujet:Message d'anniversaire
/list sujet:URL malveillant page:3
```

***

- ### /add : Ajouts divers

Permet d'ajouter des mots à bannir, des messages d'anniversaire ou des URL malveillants.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **sujet** | ☑ | Choix parmis `Mots à bannir`, `Message d'anniversaire`, `URL malveillant` |
| **texte** | ☑ | Liste des mots, messages d'anniversaire, URL malveillants à ajouter séparés par un point virgule `;` |

__Exemples :__

```
/add sujet:Mots à bannir texte:mot1;mot2;mot3
/add sujet:Message d'anniversaire texte:Bon anniversaire !
/add sujet:URL malveillant texte:app-discordc.com
```

***

- ### /remove : Suppressions diverses

Permet de supprimer des mots à bannir, des messages d'anniversaire ou des URL malveillants.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **sujet** | ☑ | Choix parmis `Mots à bannir`, `Message d'anniversaire`, `URL malveillant` |
| **texte** | ☑ | Liste des identifiants pour les mots, messages d'anniversaire, URL malveillants à supprimer séparés par un point virgule `;` |

__Exemples :__

```
/remove sujet:Mots à bannir ids:2;3
/remove sujet:Message d'anniversaire ids:1
/remove sujet:URLs malveillants ids:1
```

***

- ### /avatar : Récupère l'avatar d'un membre

Permet d'afficher votre avatar ou celui d'un membre.

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **membre** | ☐ | Membre de la guild |

__Exemples :__

```
/avatar
/avatar membre:@Hei5enberg#6969
```

***

- ### /birthday set : Ajoute une date d'anniversaire

Permet d'ajouter sa date d'anniversaire à la base de données afin que le bot vous le souhaite le jour J.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **date** | ☑ | Date au format `JJ/MM/AAAA` |

__Exemples :__

```
/birthday set date:02/11/1995
```

***

- ### /birthday unset : Supprime une date d'anniversaire

Permet de supprimer sa date d'anniversaire de la base de données.

__Exemples :__

```
/birthday unset
```

***

- ### /mute : Mute un membre

Permet de mute un membre sur une période définie.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **membre** | ☑ | Membre de la guild |
| **raison** | ☑ | Raison du mute |
| **durée** | ☑ | Durée du mute (s = secondes / i = minutes / h = heures / d = jours / w = semaines / m = mois / y = année) |

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
| **durée** | ☑ | Durée du ban (s = secondes / i = minutes / h = heures / d = jours / w = semaines / m = mois / y = année) |

__Exemples :__

```
/ban membre:@Hei5enberg#6969 raison:Fishing durée:10y
```

***

- ### /send : Envoie un message dans un channel

Permet d'envoyer un message par l'Agent dans un channel.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **channel** | ☑ | Channel de la guild |
| **message** | ☑ | Message |

__Exemples :__

```
/send channel:#général message:Coucou !
```

***

- ### /tweet : Envoie un Tweet

Permet de Tweeter sur le compte [@BeatSaberFR](https://twitter.com/BeatSaberFR).

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **texte** | ☑ | Message du Tweet |

__Exemples :__

```
/tweet texte:Salut Twitter !
```

***

- ### /log : Récupère un fichier de log

Permet de récupérer les logs du bot à une date donnée.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **date** | ☐ | Date du fichier de log demandé au format `JJ/MM/AAAA` |

__Exemples :__

```
/log
/log date:28/04/2022
```

***

- ### /roles list : Liste vos rôles

Permet de récupérer la liste de vos rôles auto-assignables.

__Exemples :__

```
/roles list
```

***

- ### /roles add <catégorie> : Ajoute un rôle de `<catégorie>`

Permet de vous attribuer un rôle auto-assignables pour la catégorie donnée.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **role** | ☑ | Rôle de `<catégorie>` à attribuer |

__Exemples :__

```
/roles add notification role:Annonce
```

***

- ### /roles remove <catégorie> : Supprime un rôle de `<catégorie>`

Permet de vous retirer un rôle auto-assignables pour la catégorie donnée.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **role** | ☑ | Rôle de `<catégorie>` à retirer |

__Exemples :__

```
/roles remove notification role:Annonce
```

## Auteur

👤 **Hei5enberg#6969**

* Site Web: [bsaber.fr](https://bsaber.fr)
* Twitter: [@BltAntoine](https://twitter.com/BltAntoine)
* Github: [@hei5enberg44](https://github.com/hei5enberg44)